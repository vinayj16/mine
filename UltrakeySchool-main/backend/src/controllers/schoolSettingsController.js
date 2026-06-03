import schoolSettingsService from '../services/schoolSettingsService.js';
import { successResponse, createdResponse, errorResponse, notFoundResponse } from '../utils/apiResponse.js';
import logger from '../utils/logger.js';
import mongoose from 'mongoose';

const validateObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

export const getByInstitution = async (req, res) => {
  try {
    const { institutionId } = req.params;
    if (!validateObjectId(institutionId)) {
      return errorResponse(res, 'Invalid institution ID', 400);
    }
    let settings = await schoolSettingsService.getSchoolSettingsByInstitution(institutionId);
    if (!settings) {
      settings = { institutionId, basicInfo: {}, academicSettings: {}, examSettings: {}, attendanceSettings: {}, feeSettings: {}, notificationSettings: {}, status: 'active' };
    }
    return successResponse(res, settings);
  } catch (error) {
    logger.error('Error fetching school settings:', error);
    return errorResponse(res, error.message);
  }
};

export const updateBasicInfo = async (req, res) => {
  try {
    const { institutionId } = req.params;
    if (!validateObjectId(institutionId)) return errorResponse(res, 'Invalid institution ID', 400);
    const updated = await schoolSettingsService.updateBasicInfo(institutionId, req.body, req.user?._id);
    return successResponse(res, updated, 'Basic info updated successfully');
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

export const updateAcademicSettings = async (req, res) => {
  try {
    const { institutionId } = req.params;
    if (!validateObjectId(institutionId)) return errorResponse(res, 'Invalid institution ID', 400);
    const updated = await schoolSettingsService.updateAcademicSettings(institutionId, req.body, req.user?._id);
    return successResponse(res, updated, 'Academic settings updated successfully');
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

export const updateExamSettings = async (req, res) => {
  try {
    const { institutionId } = req.params;
    if (!validateObjectId(institutionId)) return errorResponse(res, 'Invalid institution ID', 400);
    const updated = await schoolSettingsService.updateExamSettings(institutionId, req.body, req.user?._id);
    return successResponse(res, updated, 'Exam settings updated successfully');
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

export const updateAttendanceSettings = async (req, res) => {
  try {
    const { institutionId } = req.params;
    if (!validateObjectId(institutionId)) return errorResponse(res, 'Invalid institution ID', 400);
    const updated = await schoolSettingsService.updateAttendanceSettings(institutionId, req.body, req.user?._id);
    return successResponse(res, updated, 'Attendance settings updated successfully');
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

export const updateFeeSettings = async (req, res) => {
  try {
    const { institutionId } = req.params;
    if (!validateObjectId(institutionId)) return errorResponse(res, 'Invalid institution ID', 400);
    const updated = await schoolSettingsService.updateFeeSettings(institutionId, req.body, req.user?._id);
    return successResponse(res, updated, 'Fee settings updated successfully');
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

export const updateNotificationSettings = async (req, res) => {
  try {
    const { institutionId } = req.params;
    if (!validateObjectId(institutionId)) return errorResponse(res, 'Invalid institution ID', 400);
    const updated = await schoolSettingsService.updateNotificationSettings(institutionId, req.body, req.user?._id);
    return successResponse(res, updated, 'Notification settings updated successfully');
  } catch (error) {
    return errorResponse(res, error.message);
  }
};
