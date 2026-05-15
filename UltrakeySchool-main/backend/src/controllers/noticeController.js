import noticeService from '../services/noticeService.js';
import { successResponse, createdResponse, errorResponse, validationErrorResponse, notFoundResponse } from '../utils/apiResponse.js';
import logger from '../utils/logger.js';
import mongoose from 'mongoose';

// Validation constants
const VALID_NOTICE_STATUSES = ['draft', 'published', 'archived', 'scheduled'];
const VALID_NOTICE_PRIORITIES = ['low', 'medium', 'high', 'urgent'];
const VALID_RECIPIENTS = ['all', 'students', 'teachers', 'parents', 'staff', 'administrators'];
const VALID_EXPORT_FORMATS = ['json', 'csv', 'xlsx', 'pdf'];
const MAX_TITLE_LENGTH = 200;
const MAX_CONTENT_LENGTH = 10000;
const MAX_ATTACHMENTS = 10;

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

// Helper function to validate date
const validateDate = (date, fieldName = 'Date') => {
  if (!date) {
    return fieldName + ' is required';
  }
  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) {
    return 'Invalid ' + fieldName + ' format';
  }
  return null;
};

// Helper function to validate date range
const validateDateRange = (startDate, endDate) => {
  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (start > end) {
      return 'Start date must be before end date';
    }
  }
  return null;
};

// Helper function to validate academic year format (YYYY-YYYY)
const validateAcademicYear = (year) => {
  if (!year) return null;
  const yearPattern = /^\d{4}-\d{4}$/;
  if (!yearPattern.test(year)) {
    return 'Invalid academic year format. Expected format: YYYY-YYYY';
  }
  const [startYear, endYear] = year.split('-').map(Number);
  if (endYear !== startYear + 1) {
    return 'Academic year end must be one year after start';
  }
  return null;
};

const createNotice = async (req, res) => {
  try {
    logger.info('Creating new notice');
    
    const { title, content, institutionId, academicYear, status, priority, recipient, publishDate, expiryDate, attachments } = req.body;
    
    // Validation
    const errors = [];
    
    if (!title || title.trim().length === 0) {
      errors.push('Notice title is required');
    } else if (title.length > MAX_TITLE_LENGTH) {
      errors.push('Title must not exceed ' + MAX_TITLE_LENGTH + ' characters');
    }
    
    if (!content || content.trim().length === 0) {
      errors.push('Notice content is required');
    } else if (content.length > MAX_CONTENT_LENGTH) {
      errors.push('Content must not exceed ' + MAX_CONTENT_LENGTH + ' characters');
    }
    
    if (!institutionId) {
      errors.push('Institution ID is required');
    } else {
      const institutionIdError = validateObjectId(institutionId, 'Institution ID');
      if (institutionIdError) errors.push(institutionIdError);
    }
    
    if (academicYear) {
      const academicYearError = validateAcademicYear(academicYear);
      if (academicYearError) errors.push(academicYearError);
    }
    
    if (status && !VALID_NOTICE_STATUSES.includes(status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_NOTICE_STATUSES.join(', '));
    }
    
    if (priority && !VALID_NOTICE_PRIORITIES.includes(priority)) {
      errors.push('Invalid priority. Must be one of: ' + VALID_NOTICE_PRIORITIES.join(', '));
    }
    
    if (recipient && !VALID_RECIPIENTS.includes(recipient)) {
      errors.push('Invalid recipient. Must be one of: ' + VALID_RECIPIENTS.join(', '));
    }
    
    if (publishDate) {
      const publishDateError = validateDate(publishDate, 'Publish date');
      if (publishDateError) errors.push(publishDateError);
    }
    
    if (expiryDate) {
      const expiryDateError = validateDate(expiryDate, 'Expiry date');
      if (expiryDateError) errors.push(expiryDateError);
    }
    
    if (publishDate && expiryDate) {
      const dateRangeError = validateDateRange(publishDate, expiryDate);
      if (dateRangeError) errors.push(dateRangeError);
    }
    
    if (attachments && !Array.isArray(attachments)) {
      errors.push('Attachments must be an array');
    } else if (attachments && attachments.length > MAX_ATTACHMENTS) {
      errors.push('Cannot have more than ' + MAX_ATTACHMENTS + ' attachments');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const notice = await noticeService.createNotice({
      ...req.body,
      metadata: { createdBy: req.user?.id || req.body.metadata?.createdBy }
    });
    
    logger.info('Notice created successfully:', { noticeId: notice._id });
    return createdResponse(res, notice, 'Notice created successfully');
  } catch (error) {
    logger.error('Error creating notice:', error);
    return errorResponse(res, error.message);
  }
};

const getNoticeById = async (req, res) => {
  try {
    logger.info('Fetching notice by ID');
    
    const { id } = req.params;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'Notice ID');
    if (idError) errors.push(idError);
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const notice = await noticeService.getNoticeById(id);
    
    if (!notice) {
      return notFoundResponse(res, 'Notice not found');
    }
    
    logger.info('Notice fetched successfully:', { noticeId: id });
    return successResponse(res, notice, 'Notice retrieved successfully');
  } catch (error) {
    logger.error('Error fetching notice:', error);
    return errorResponse(res, error.message);
  }
};

const getNoticeByNoticeId = async (req, res) => {
  try {
    logger.info('Fetching notice by notice ID');
    
    const { noticeId } = req.params;
    
    // Validation
    const errors = [];
    
    if (!noticeId || noticeId.trim().length === 0) {
      errors.push('Notice ID is required');
    } else if (noticeId.length > 50) {
      errors.push('Notice ID must not exceed 50 characters');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const notice = await noticeService.getNoticeByNoticeId(noticeId);
    
    if (!notice) {
      return notFoundResponse(res, 'Notice not found');
    }
    
    logger.info('Notice fetched successfully by notice ID:', { noticeId });
    return successResponse(res, notice, 'Notice retrieved successfully');
  } catch (error) {
    logger.error('Error fetching notice by notice ID:', error);
    return errorResponse(res, error.message);
  }
};

const getAllNotices = async (req, res) => {
  try {
    // Handle both direct params and params[] format
    const { institutionId, academicYear, status, priority, recipient, startDate, endDate, search, page, limit, sortBy, sortOrder } = req.query;
    
    // Extract params from params[] format if needed
    const params = req.query.params || {};
    const finalInstitutionId = institutionId || params.institutionId;
    const finalAcademicYear = academicYear || params.academicYear;
    
    const result = await noticeService.getAllNotices(
      { institutionId: finalInstitutionId, academicYear: finalAcademicYear, status, priority, recipient, startDate, endDate, search },
      { page: parseInt(page) || 1, limit: parseInt(limit) || 20, sortBy, sortOrder }
    );
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateNotice = async (req, res) => {
  try {
    const notice = await noticeService.updateNotice(req.params.id, {
      ...req.body,
      metadata: { ...req.body.metadata, updatedBy: req.user?.id }
    });
    res.json({ success: true, data: notice });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const deleteNotice = async (req, res) => {
  try {
    await noticeService.deleteNotice(req.params.id);
    res.json({ success: true, message: 'Notice deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const bulkDelete = async (req, res) => {
  try {
    const { noticeIds } = req.body;
    const result = await noticeService.bulkDelete(noticeIds);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const updateStatus = async (req, res) => {
  try {
    const notice = await noticeService.updateStatus(req.params.id, req.body.status);
    if (!notice) {
      return res.status(404).json({ success: false, message: 'Notice not found' });
    }
    res.json({ success: true, data: notice });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const getNoticesByRecipient = async (req, res) => {
  try {
    const { institutionId, academicYear } = req.query;
    const notices = await noticeService.getNoticesByRecipient(req.params.recipient, institutionId, academicYear);
    res.json({ success: true, data: notices });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getPublishedNotices = async (req, res) => {
  try {
    const { institutionId, academicYear } = req.query;
    const notices = await noticeService.getPublishedNotices(institutionId, academicYear);
    res.json({ success: true, data: notices });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getUpcomingNotices = async (req, res) => {
  try {
    const { institutionId, academicYear } = req.query;
    const notices = await noticeService.getUpcomingNotices(institutionId, academicYear);
    res.json({ success: true, data: notices });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const incrementViews = async (req, res) => {
  try {
    const notice = await noticeService.incrementViews(req.params.id, req.user?.id || req.body.userId);
    res.json({ success: true, data: notice });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const getNoticeStatistics = async (req, res) => {
  try {
    const { institutionId, academicYear } = req.query;
    const statistics = await noticeService.getNoticeStatistics(institutionId, academicYear);
    res.json({ success: true, data: statistics });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const searchNotices = async (req, res) => {
  try {
    const { q, institutionId } = req.query;
    const notices = await noticeService.searchNotices(q, institutionId);
    res.json({ success: true, data: notices });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const addAttachment = async (req, res) => {
  try {
    const notice = await noticeService.addAttachment(req.params.id, req.body);
    res.json({ success: true, data: notice });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const removeAttachment = async (req, res) => {
  try {
    const notice = await noticeService.removeAttachment(req.params.id, req.params.attachmentId);
    res.json({ success: true, data: notice });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};


export {
  createNotice,
  getNoticeById,
  getNoticeByNoticeId,
  getAllNotices,
  updateNotice,
  deleteNotice,
  bulkDelete,
  updateStatus,
  getNoticesByRecipient,
  getPublishedNotices,
  getUpcomingNotices,
  incrementViews,
  getNoticeStatistics,
  searchNotices,
  addAttachment,
  removeAttachment
};

export default {
  createNotice,
  getNoticeById,
  getNoticeByNoticeId,
  getAllNotices,
  updateNotice,
  deleteNotice,
  bulkDelete,
  updateStatus,
  getNoticesByRecipient,
  getPublishedNotices,
  getUpcomingNotices,
  incrementViews,
  getNoticeStatistics,
  searchNotices,
  addAttachment,
  removeAttachment
};
