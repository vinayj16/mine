import Staff from '../models/Staff.js';
import Leave from '../models/Leave.js';
import { successResponse, createdResponse, errorResponse, notFoundResponse } from '../utils/apiResponse.js';
import logger from '../utils/logger.js';

const findStaffForUser = async (user) => {
  if (!user?.email) return null;
  const email = user.email.toLowerCase();
  return Staff.findOne({
    $or: [{ email }, { 'contact.email': email }]
  }).lean();
};

const calcDays = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diff = Math.abs(end.getTime() - start.getTime());
  return Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1;
};

export const getMyStaffProfile = async (req, res) => {
  try {
    const staff = await findStaffForUser(req.user);
    if (!staff) {
      return successResponse(res, {
        staffId: req.user.id,
        fullName: req.user.name,
        email: req.user.email,
        departmentName: 'General',
        designationName: req.user.role || 'Staff',
        fromUserAccount: true
      }, 'Staff profile (from user account)');
    }
    return successResponse(res, staff, 'Staff profile retrieved');
  } catch (error) {
    logger.error('getMyStaffProfile error:', error);
    return errorResponse(res, error.message || 'Failed to load staff profile', 500);
  }
};

export const getMyLeaves = async (req, res) => {
  try {
    const staff = await findStaffForUser(req.user);
    const staffId = staff?.staffId || req.user.id;
    const leaves = await Leave.find({ staffId }).sort({ appliedOn: -1 }).lean();
    const mapped = leaves.map((l) => ({
      ...l,
      _id: l.leaveId || l._id?.toString()
    }));
    return successResponse(res, mapped, 'Leaves retrieved successfully');
  } catch (error) {
    logger.error('getMyLeaves error:', error);
    return errorResponse(res, error.message || 'Failed to load leaves', 500);
  }
};

export const applyMyLeave = async (req, res) => {
  try {
    const staff = await findStaffForUser(req.user);
    const { leaveType, startDate, endDate, reason } = req.body;

    if (!leaveType || !startDate || !endDate || !reason?.trim()) {
      return errorResponse(res, 'Leave type, dates, and reason are required', 400);
    }

    const staffId = staff?.staffId || req.user.id;
    const staffName = staff?.fullName || req.user.name || 'Staff';
    const days = calcDays(startDate, endDate);
    const leaveId = `LV-${Date.now()}`;

    const leave = await Leave.create({
      leaveId,
      staffId,
      staffName,
      leaveType,
      startDate,
      endDate,
      days,
      reason: reason.trim(),
      status: 'pending'
    });

    return createdResponse(res, { ...leave.toObject(), _id: leave.leaveId }, 'Leave application submitted');
  } catch (error) {
    logger.error('applyMyLeave error:', error);
    return errorResponse(res, error.message || 'Failed to apply for leave', 500);
  }
};

export const cancelMyLeave = async (req, res) => {
  try {
    const staff = await findStaffForUser(req.user);
    const staffId = staff?.staffId || req.user.id;
    const leaveId = req.params.id;

    const leave = await Leave.findOne({
      $or: [{ leaveId }, { _id: leaveId }],
      staffId,
      status: 'pending'
    });

    if (!leave) {
      return notFoundResponse(res, 'Pending leave not found');
    }

    leave.status = 'cancelled';
    await leave.save();

    return successResponse(res, { ...leave.toObject(), _id: leave.leaveId }, 'Leave cancelled');
  } catch (error) {
    logger.error('cancelMyLeave error:', error);
    return errorResponse(res, error.message || 'Failed to cancel leave', 500);
  }
};

export default {
  getMyStaffProfile,
  getMyLeaves,
  applyMyLeave,
  cancelMyLeave
};
