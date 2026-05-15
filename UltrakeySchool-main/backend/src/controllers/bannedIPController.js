import BannedIP from '../models/BannedIP.js';
import { successResponse, createdResponse, errorResponse, validationErrorResponse, notFoundResponse } from '../utils/apiResponse.js';
import logger from '../utils/logger.js';
import mongoose from 'mongoose';

// Valid ban statuses
const VALID_STATUSES = ['active', 'expired', 'removed'];

// Valid ban reasons
const VALID_REASONS = [
  'brute_force',
  'suspicious_activity',
  'malicious_requests',
  'ddos_attempt',
  'spam',
  'policy_violation',
  'manual_ban',
  'other'
];

/**
 * Validate MongoDB ObjectId
 */
const validateObjectId = (id, fieldName = 'id') => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return { valid: false, error: { field: fieldName, message: `Invalid ${fieldName} format` } };
  }
  return { valid: true };
};

/**
 * Validate IP address format
 */
const validateIPAddress = (ip) => {
  // IPv4 pattern
  const ipv4Pattern = /^(\d{1,3}\.){3}\d{1,3}$/;
  // IPv6 pattern (simplified)
  const ipv6Pattern = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
  // CIDR pattern
  const cidrPattern = /^(\d{1,3}\.){3}\d{1,3}\/\d{1,2}$/;
  
  if (!ip) return false;
  
  if (ipv4Pattern.test(ip)) {
    const parts = ip.split('.');
    return parts.every(part => parseInt(part) >= 0 && parseInt(part) <= 255);
  }
  
  return ipv6Pattern.test(ip) || cidrPattern.test(ip);
};

// Get all banned IPs
const getAllBannedIPs = async (req, res) => {
  try {
    const { status, reason, search, sortBy = 'createdAt', sortOrder = 'desc', page = 1, limit = 20 } = req.query;

    // Validate status if provided
    if (status && !VALID_STATUSES.includes(status)) {
      return validationErrorResponse(res, [{ field: 'status', message: 'Status must be one of: ' + VALID_STATUSES.join(', ') }]);
    }

    // Validate reason if provided
    if (reason && !VALID_REASONS.includes(reason)) {
      return validationErrorResponse(res, [{ field: 'reason', message: 'Reason must be one of: ' + VALID_REASONS.join(', ') }]);
    }

    // Validate pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    if (isNaN(pageNum) || pageNum < 1) {
      return validationErrorResponse(res, [{ field: 'page', message: 'Page must be a positive integer' }]);
    }
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      return validationErrorResponse(res, [{ field: 'limit', message: 'Limit must be between 1 and 100' }]);
    }

    // Build filter
    const filter = {};
    if (status) filter.status = status;
    if (reason) filter.reason = reason;
    if (search) {
      filter.$or = [
        { ipAddress: { $regex: search, $options: 'i' } },
        { notes: { $regex: search, $options: 'i' } }
      ];
    }

    // Build sort
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    logger.info('Fetching banned IPs');
    const bannedIPs = await BannedIP.find(filter)
      .populate('bannedBy', 'name email')
      .sort(sort)
      .limit(limitNum)
      .skip((pageNum - 1) * limitNum);

    const total = await BannedIP.countDocuments(filter);

    return successResponse(res, bannedIPs, 'Banned IPs fetched successfully', {
      pagination: {
        current: pageNum,
        pageSize: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      },
      filters: { status, reason, search }
    });
  } catch (error) {
    logger.error('Error fetching banned IPs:', error);
    return errorResponse(res, 'Failed to fetch banned IPs', 500);
  }
};

// Get banned IP by ID
const getBannedIPById = async (req, res) => {
  try {
    const bannedIP = await BannedIP.findById(req.params.id)
      .populate('bannedBy', 'name email');

    if (!bannedIP) {
      return res.status(404).json({
        success: false,
        message: 'Banned IP not found'
      });
    }

    res.status(200).json({
      success: true,
      data: { bannedIP }
    });
  } catch (error) {
    console.error('Error fetching banned IP:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch banned IP',
      error: error.message
    });
  }
};

// Check if IP is banned
const checkIPBanned = async (req, res) => {
  try {
    const { ipAddress } = req.params;

    const bannedIP = await BannedIP.findOne({
      ipAddress,
      status: 'active'
    });

    if (!bannedIP) {
      return res.status(200).json({
        success: true,
        data: { isBanned: false }
      });
    }

    // Check if expired
    if (bannedIP.isExpired()) {
      bannedIP.status = 'expired';
      await bannedIP.save();
      
      return res.status(200).json({
        success: true,
        data: { isBanned: false }
      });
    }

    // Increment attempts
    await bannedIP.incrementAttempts();

    res.status(200).json({
      success: true,
      data: {
        isBanned: true,
        reason: bannedIP.reason,
        bannedAt: bannedIP.bannedAt,
        expiresAt: bannedIP.expiresAt
      }
    });
  } catch (error) {
    console.error('Error checking banned IP:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check banned IP',
      error: error.message
    });
  }
};

// Create new banned IP
const createBannedIP = async (req, res) => {
  try {
    const { ipAddress, reason, isPermanent, expiresAt, notes } = req.body;

    // Check if IP already banned
    const existing = await BannedIP.findOne({ ipAddress });
    if (existing && existing.status === 'active') {
      return res.status(400).json({
        success: false,
        message: 'IP address is already banned'
      });
    }

    const bannedIPData = {
      ipAddress,
      reason,
      isPermanent: isPermanent !== undefined ? isPermanent : true,
      expiresAt: isPermanent ? null : expiresAt,
      notes,
      bannedBy: req.user?.id,
      status: 'active'
    };

    const bannedIP = new BannedIP(bannedIPData);
    await bannedIP.save();

    res.status(201).json({
      success: true,
      message: 'IP address banned successfully',
      data: { bannedIP }
    });
  } catch (error) {
    console.error('Error banning IP:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to ban IP address',
      error: error.message
    });
  }
};

// Update banned IP
const updateBannedIP = async (req, res) => {
  try {
    const bannedIP = await BannedIP.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    ).populate('bannedBy', 'name email');

    if (!bannedIP) {
      return res.status(404).json({
        success: false,
        message: 'Banned IP not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Banned IP updated successfully',
      data: { bannedIP }
    });
  } catch (error) {
    console.error('Error updating banned IP:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update banned IP',
      error: error.message
    });
  }
};

// Delete banned IP (unban)
const deleteBannedIP = async (req, res) => {
  try {
    const bannedIP = await BannedIP.findByIdAndDelete(req.params.id);

    if (!bannedIP) {
      return res.status(404).json({
        success: false,
        message: 'Banned IP not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'IP address unbanned successfully'
    });
  } catch (error) {
    console.error('Error unbanning IP:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to unban IP address',
      error: error.message
    });
  }
};

// Bulk delete banned IPs
const bulkDeleteBannedIPs = async (req, res) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide valid IP IDs'
      });
    }

    const result = await BannedIP.deleteMany({ _id: { $in: ids } });

    res.status(200).json({
      success: true,
      message: `${result.deletedCount} IP address(es) unbanned successfully`,
      data: { deletedCount: result.deletedCount }
    });
  } catch (error) {
    console.error('Error bulk unbanning IPs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to unban IP addresses',
      error: error.message
    });
  }
};


export default {
  getAllBannedIPs,
  getBannedIPById,
  checkIPBanned,
  createBannedIP,
  updateBannedIP,
  deleteBannedIP,
  bulkDeleteBannedIPs
};
