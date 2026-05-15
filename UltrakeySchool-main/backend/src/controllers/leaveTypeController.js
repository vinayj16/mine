import LeaveType from '../models/LeaveType.js';
import { successResponse, createdResponse, errorResponse, validationErrorResponse, notFoundResponse } from '../utils/apiResponse.js';
import logger from '../utils/logger.js';
import mongoose from 'mongoose';

// Validation constants
const VALID_LEAVE_STATUSES = ['active', 'inactive'];
const VALID_EXPORT_FORMATS = ['json', 'csv', 'xlsx', 'pdf'];

// Helper function to validate MongoDB ObjectId
const validateObjectId = (id, fieldName = 'ID') => {
  if (!id) {
    return fieldName + ' is required';
  }
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return 'Invalid ' + fieldName + ' format';
  }
  return null;
};

// Create leave type
const createLeaveType = async (req, res) => {
  try {
    logger.info('Creating leave type');
    
    const { type, maxDays, description, requiresApproval, carryForward, status } = req.body;
    
    // Validation
    const errors = [];
    
    if (!type || type.trim().length === 0) {
      errors.push('Leave type name is required');
    } else if (type.length > 100) {
      errors.push('Leave type name must not exceed 100 characters');
    }
    
    if (maxDays !== undefined && maxDays !== null) {
      const maxDaysNum = parseInt(maxDays);
      if (isNaN(maxDaysNum) || maxDaysNum < 0) {
        errors.push('Maximum days must be a non-negative number');
      } else if (maxDaysNum > 365) {
        errors.push('Maximum days must not exceed 365');
      }
    }
    
    if (description && description.length > 500) {
      errors.push('Description must not exceed 500 characters');
    }
    
    if (requiresApproval !== undefined && typeof requiresApproval !== 'boolean') {
      errors.push('Requires approval must be a boolean value');
    }
    
    if (carryForward !== undefined && typeof carryForward !== 'boolean') {
      errors.push('Carry forward must be a boolean value');
    }
    
    if (status && !VALID_LEAVE_STATUSES.includes(status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_LEAVE_STATUSES.join(', '));
    }
    
    if (!req.tenantId) {
      errors.push('Institution information is required');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    // Generate leave type ID
    const count = await LeaveType.countDocuments({ institution: req.tenantId });
    const leaveTypeId = 'LT' + String(count + 1).padStart(6, '0');

    const leaveType = new LeaveType({
      ...req.body,
      leaveTypeId,
      institution: req.tenantId,
      createdBy: req.user?.id
    });

    await leaveType.save();

    logger.info('Leave type created successfully:', { type: leaveType.type, id: leaveType._id });
    return createdResponse(res, leaveType, 'Leave type created successfully');
  } catch (error) {
    logger.error('Error creating leave type:', error);
    return errorResponse(res, error.message);
  }
};


// Get all leave types
const getAllLeaveTypes = async (req, res) => {
  try {
    logger.info('Fetching all leave types');
    
    const { page, limit, status, search } = req.query;
    
    // Validation
    const errors = [];
    
    if (status && !VALID_LEAVE_STATUSES.includes(status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_LEAVE_STATUSES.join(', '));
    }
    
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    
    if (pageNum < 1) {
      errors.push('Page must be greater than 0');
    }
    
    if (limitNum < 1 || limitNum > 100) {
      errors.push('Limit must be between 1 and 100');
    }
    
    if (search && search.length > 200) {
      errors.push('Search query must not exceed 200 characters');
    }
    
    if (!req.tenantId) {
      errors.push('Institution information is required');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    const query = { institution: req.tenantId };
    if (status) query.status = status;
    if (search) query.type = { $regex: search, $options: 'i' };

    const skip = (pageNum - 1) * limitNum;

    const [leaveTypes, total] = await Promise.all([
      LeaveType.find(query)
        .populate('createdBy', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      LeaveType.countDocuments(query)
    ]);

    logger.info('Leave types fetched successfully');
    return successResponse(res, {
      leaveTypes,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    }, 'Leave types retrieved successfully');
  } catch (error) {
    logger.error('Error fetching leave types:', error);
    return errorResponse(res, error.message);
  }
};


// Get leave type by ID
const getLeaveTypeById = async (req, res) => {
  try {
    logger.info('Fetching leave type by ID');
    
    const { id } = req.params;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'Leave type ID');
    if (idError) errors.push(idError);
    
    if (!req.tenantId) {
      errors.push('Institution information is required');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const leaveType = await LeaveType.findOne({
      _id: id,
      institution: req.tenantId
    }).populate('createdBy', 'name');

    if (!leaveType) {
      return notFoundResponse(res, 'Leave type not found');
    }

    logger.info('Leave type fetched successfully:', { id });
    return successResponse(res, leaveType, 'Leave type retrieved successfully');
  } catch (error) {
    logger.error('Error fetching leave type:', error);
    return errorResponse(res, error.message);
  }
};


// Update leave type
const updateLeaveType = async (req, res) => {
  try {
    logger.info('Updating leave type');
    
    const { id } = req.params;
    const { type, maxDays, status } = req.body;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'Leave type ID');
    if (idError) errors.push(idError);
    
    if (type !== undefined && (!type || type.trim().length === 0)) {
      errors.push('Leave type name cannot be empty');
    } else if (type && type.length > 100) {
      errors.push('Leave type name must not exceed 100 characters');
    }
    
    if (maxDays !== undefined && maxDays !== null) {
      const maxDaysNum = parseInt(maxDays);
      if (isNaN(maxDaysNum) || maxDaysNum < 0) {
        errors.push('Maximum days must be a non-negative number');
      } else if (maxDaysNum > 365) {
        errors.push('Maximum days must not exceed 365');
      }
    }
    
    if (status && !VALID_LEAVE_STATUSES.includes(status)) {
      errors.push('Invalid status');
    }
    
    if (!req.tenantId) {
      errors.push('Institution information is required');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const leaveType = await LeaveType.findOneAndUpdate(
      { _id: id, institution: req.tenantId },
      req.body,
      { new: true, runValidators: true }
    ).populate('createdBy', 'name');

    if (!leaveType) {
      return notFoundResponse(res, 'Leave type not found');
    }

    logger.info('Leave type updated successfully:', { type: leaveType.type, id });
    return successResponse(res, leaveType, 'Leave type updated successfully');
  } catch (error) {
    logger.error('Error updating leave type:', error);
    return errorResponse(res, error.message);
  }
};


// Delete leave type
const deleteLeaveType = async (req, res) => {
  try {
    logger.info('Deleting leave type');
    
    const { id } = req.params;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'Leave type ID');
    if (idError) errors.push(idError);
    
    if (!req.tenantId) {
      errors.push('Institution information is required');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const leaveType = await LeaveType.findOneAndDelete({
      _id: id,
      institution: req.tenantId
    });

    if (!leaveType) {
      return notFoundResponse(res, 'Leave type not found');
    }

    logger.info('Leave type deleted successfully:', { type: leaveType.type, id });
    return successResponse(res, null, 'Leave type deleted successfully');
  } catch (error) {
    logger.error('Error deleting leave type:', error);
    return errorResponse(res, error.message);
  }
};

// Get active leave types
const getActiveLeaveTypes = async (req, res) => {
  try {
    logger.info('Fetching active leave types');
    
    // Validation
    if (!req.tenantId) {
      return validationErrorResponse(res, ['Institution information is required']);
    }
    
    const leaveTypes = await LeaveType.find({
      institution: req.tenantId,
      status: 'active'
    })
      .select('type maxDays description requiresApproval carryForward')
      .sort({ type: 1 });
    
    logger.info('Active leave types fetched successfully');
    return successResponse(res, leaveTypes, 'Active leave types retrieved successfully');
  } catch (error) {
    logger.error('Error fetching active leave types:', error);
    return errorResponse(res, error.message);
  }
};

// Bulk update leave types
const bulkUpdateLeaveTypes = async (req, res) => {
  try {
    logger.info('Bulk updating leave types');
    
    const { leaveTypeIds, updates } = req.body;
    
    // Validation
    const errors = [];
    
    if (!leaveTypeIds || !Array.isArray(leaveTypeIds) || leaveTypeIds.length === 0) {
      errors.push('Leave type IDs array is required and must not be empty');
    } else if (leaveTypeIds.length > 100) {
      errors.push('Cannot update more than 100 leave types at once');
    }
    
    if (!updates || typeof updates !== 'object') {
      errors.push('Updates object is required');
    }
    
    if (updates?.status && !VALID_LEAVE_STATUSES.includes(updates.status)) {
      errors.push('Invalid status in updates');
    }
    
    if (!req.tenantId) {
      errors.push('Institution information is required');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const result = await LeaveType.updateMany(
      { _id: { $in: leaveTypeIds }, institution: req.tenantId },
      { $set: updates }
    );
    
    logger.info('Bulk leave type update completed:', { count: result.modifiedCount });
    return successResponse(res, { modifiedCount: result.modifiedCount }, 'Leave types updated successfully');
  } catch (error) {
    logger.error('Error in bulk leave type update:', error);
    return errorResponse(res, error.message);
  }
};

// Bulk delete leave types
const bulkDeleteLeaveTypes = async (req, res) => {
  try {
    logger.info('Bulk deleting leave types');
    
    const { leaveTypeIds } = req.body;
    
    // Validation
    const errors = [];
    
    if (!leaveTypeIds || !Array.isArray(leaveTypeIds) || leaveTypeIds.length === 0) {
      errors.push('Leave type IDs array is required and must not be empty');
    } else if (leaveTypeIds.length > 100) {
      errors.push('Cannot delete more than 100 leave types at once');
    }
    
    if (!req.tenantId) {
      errors.push('Institution information is required');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const result = await LeaveType.deleteMany({
      _id: { $in: leaveTypeIds },
      institution: req.tenantId
    });
    
    logger.info('Bulk leave type deletion completed:', { count: result.deletedCount });
    return successResponse(res, { deletedCount: result.deletedCount }, 'Leave types deleted successfully');
  } catch (error) {
    logger.error('Error in bulk leave type deletion:', error);
    return errorResponse(res, error.message);
  }
};

// Export leave types
const exportLeaveTypes = async (req, res) => {
  try {
    logger.info('Exporting leave types');
    
    const { format, status } = req.query;
    
    // Validation
    const errors = [];
    
    if (!format || format.trim().length === 0) {
      errors.push('Export format is required');
    } else if (!VALID_EXPORT_FORMATS.includes(format.toLowerCase())) {
      errors.push('Invalid export format. Must be one of: ' + VALID_EXPORT_FORMATS.join(', '));
    }
    
    if (status && !VALID_LEAVE_STATUSES.includes(status)) {
      errors.push('Invalid status');
    }
    
    if (!req.tenantId) {
      errors.push('Institution information is required');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const query = { institution: req.tenantId };
    if (status) query.status = status;
    
    const leaveTypes = await LeaveType.find(query)
      .populate('createdBy', 'name')
      .sort({ type: 1 })
      .lean();
    
    const exportData = {
      format: format.toLowerCase(),
      data: leaveTypes,
      count: leaveTypes.length
    };
    
    logger.info('Leave types exported successfully:', { format });
    return successResponse(res, exportData, 'Leave types exported successfully');
  } catch (error) {
    logger.error('Error exporting leave types:', error);
    return errorResponse(res, error.message);
  }
};

// Get leave type statistics
const getLeaveTypeStatistics = async (req, res) => {
  try {
    logger.info('Fetching leave type statistics');
    
    // Validation
    if (!req.tenantId) {
      return validationErrorResponse(res, ['Institution information is required']);
    }
    
    const [totalLeaveTypes, activeLeaveTypes, inactiveLeaveTypes, avgMaxDays] = await Promise.all([
      LeaveType.countDocuments({ institution: req.tenantId }),
      LeaveType.countDocuments({ institution: req.tenantId, status: 'active' }),
      LeaveType.countDocuments({ institution: req.tenantId, status: 'inactive' }),
      LeaveType.aggregate([
        { $match: { institution: new mongoose.Types.ObjectId(req.tenantId) } },
        { $group: { _id: null, avgMaxDays: { $avg: '$maxDays' } } }
      ])
    ]);
    
    const statistics = {
      totalLeaveTypes,
      activeLeaveTypes,
      inactiveLeaveTypes,
      averageMaxDays: avgMaxDays[0]?.avgMaxDays ? parseFloat(avgMaxDays[0].avgMaxDays.toFixed(2)) : 0
    };
    
    logger.info('Leave type statistics fetched successfully');
    return successResponse(res, statistics, 'Statistics retrieved successfully');
  } catch (error) {
    logger.error('Error fetching leave type statistics:', error);
    return errorResponse(res, error.message);
  }
};

// Toggle leave type status
const toggleLeaveTypeStatus = async (req, res) => {
  try {
    logger.info('Toggling leave type status');
    
    const { id } = req.params;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'Leave type ID');
    if (idError) errors.push(idError);
    
    if (!req.tenantId) {
      errors.push('Institution information is required');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const leaveType = await LeaveType.findOne({
      _id: id,
      institution: req.tenantId
    });
    
    if (!leaveType) {
      return notFoundResponse(res, 'Leave type not found');
    }
    
    leaveType.status = leaveType.status === 'active' ? 'inactive' : 'active';
    await leaveType.save();
    
    logger.info('Leave type status toggled successfully:', { id, newStatus: leaveType.status });
    return successResponse(res, leaveType, 'Leave type status updated successfully');
  } catch (error) {
    logger.error('Error toggling leave type status:', error);
    return errorResponse(res, error.message);
  }
};

// Duplicate leave type
const duplicateLeaveType = async (req, res) => {
  try {
    logger.info('Duplicating leave type');
    
    const { id } = req.params;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'Leave type ID');
    if (idError) errors.push(idError);
    
    if (!req.tenantId) {
      errors.push('Institution information is required');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const originalLeaveType = await LeaveType.findOne({
      _id: id,
      institution: req.tenantId
    });
    
    if (!originalLeaveType) {
      return notFoundResponse(res, 'Leave type not found');
    }
    
    // Generate new leave type ID
    const count = await LeaveType.countDocuments({ institution: req.tenantId });
    const leaveTypeId = 'LT' + String(count + 1).padStart(6, '0');
    
    const duplicatedLeaveType = new LeaveType({
      type: originalLeaveType.type + ' (Copy)',
      leaveTypeId,
      maxDays: originalLeaveType.maxDays,
      description: originalLeaveType.description,
      requiresApproval: originalLeaveType.requiresApproval,
      carryForward: originalLeaveType.carryForward,
      status: 'inactive',
      institution: req.tenantId,
      createdBy: req.user?.id
    });
    
    await duplicatedLeaveType.save();
    
    logger.info('Leave type duplicated successfully:', { originalId: id, newId: duplicatedLeaveType._id });
    return createdResponse(res, duplicatedLeaveType, 'Leave type duplicated successfully');
  } catch (error) {
    logger.error('Error duplicating leave type:', error);
    return errorResponse(res, error.message);
  }
};

// Get leave types with usage count
const getLeaveTypesWithUsage = async (req, res) => {
  try {
    logger.info('Fetching leave types with usage count');
    
    // Validation
    if (!req.tenantId) {
      return validationErrorResponse(res, ['Institution information is required']);
    }
    
    const leaveTypes = await LeaveType.aggregate([
      {
        $match: { institution: new mongoose.Types.ObjectId(req.tenantId) }
      },
      {
        $lookup: {
          from: 'studentleaves',
          localField: '_id',
          foreignField: 'leaveTypeId',
          as: 'leaves'
        }
      },
      {
        $project: {
          type: 1,
          maxDays: 1,
          status: 1,
          requiresApproval: 1,
          carryForward: 1,
          usageCount: { $size: '$leaves' }
        }
      },
      {
        $sort: { usageCount: -1 }
      }
    ]);
    
    logger.info('Leave types with usage count fetched successfully');
    return successResponse(res, leaveTypes, 'Leave types with usage retrieved successfully');
  } catch (error) {
    logger.error('Error fetching leave types with usage:', error);
    return errorResponse(res, error.message);
  }
};

// Export all functions
export default {
  createLeaveType,
  getAllLeaveTypes,
  getLeaveTypeById,
  updateLeaveType,
  deleteLeaveType,
  getActiveLeaveTypes,
  bulkUpdateLeaveTypes,
  bulkDeleteLeaveTypes,
  exportLeaveTypes,
  getLeaveTypeStatistics,
  toggleLeaveTypeStatus,
  duplicateLeaveType,
  getLeaveTypesWithUsage
};
