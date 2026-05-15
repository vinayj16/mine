import admissionService from '../services/admissionService.js';
import { successResponse, createdResponse, errorResponse, validationErrorResponse, notFoundResponse } from '../utils/apiResponse.js';
import logger from '../utils/logger.js';
import mongoose from 'mongoose';

// Valid application statuses
const VALID_STATUSES = ['pending', 'under_review', 'approved', 'rejected', 'waitlisted', 'enrolled'];

// Valid test types
const VALID_TEST_TYPES = ['entrance', 'aptitude', 'interview', 'written'];

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
 * Get admission applications
 */
const getApplications = async (req, res, next) => {
  try {
    const { status, academicYear, classId, search, sortBy = 'createdAt', sortOrder = 'desc', page = 1, limit = 20 } = req.query;
    const { schoolId } = req.user;

    // Validate status
    if (status && !VALID_STATUSES.includes(status)) {
      return validationErrorResponse(res, [{ field: 'status', message: `Status must be one of: ${VALID_STATUSES.join(', ')}` }]);
    }

    // Validate classId
    if (classId) {
      const validation = validateObjectId(classId, 'classId');
      if (!validation.valid) {
        return validationErrorResponse(res, [validation.error]);
      }
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

    logger.info(`Fetching admission applications for school ${schoolId}`);
    const applications = await admissionService.getApplications(schoolId, {
      status,
      academicYear,
      classId,
      search,
      sortBy,
      sortOrder,
      page: pageNum,
      limit: limitNum
    });

    return successResponse(res, applications.data, 'Applications fetched successfully', {
      pagination: applications.pagination,
      filters: { status, academicYear, classId, search }
    });
  } catch (error) {
    logger.error('Error fetching admission applications:', error);
    next(error);
  }
};

/**
 * Submit admission application
 */
const submitApplication = async (req, res, next) => {
  try {
    const { schoolId } = req.user;
    const { studentName, classId, academicYear, dateOfBirth, guardianName, guardianPhone, guardianEmail } = req.body;

    // Validate required fields
    const errors = [];
    if (!studentName || studentName.trim().length < 2) {
      errors.push({ field: 'studentName', message: 'Student name is required and must be at least 2 characters' });
    }
    if (!classId) {
      errors.push({ field: 'classId', message: 'Class ID is required' });
    } else {
      const validation = validateObjectId(classId, 'classId');
      if (!validation.valid) {
        errors.push(validation.error);
      }
    }
    if (!academicYear || !/^\d{4}-\d{4}$/.test(academicYear)) {
      errors.push({ field: 'academicYear', message: 'Academic year is required in format YYYY-YYYY' });
    }
    if (!dateOfBirth) {
      errors.push({ field: 'dateOfBirth', message: 'Date of birth is required' });
    }
    if (!guardianName || guardianName.trim().length < 2) {
      errors.push({ field: 'guardianName', message: 'Guardian name is required' });
    }
    if (!guardianPhone || !/^\+?[\d\s-()]{10,}$/.test(guardianPhone)) {
      errors.push({ field: 'guardianPhone', message: 'Valid guardian phone is required' });
    }
    if (guardianEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guardianEmail)) {
      errors.push({ field: 'guardianEmail', message: 'Invalid email format' });
    }

    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    logger.info(`Submitting admission application for school ${schoolId}`);
    const application = await admissionService.submitApplication(schoolId, req.body);

    return createdResponse(res, application, 'Application submitted successfully');
  } catch (error) {
    logger.error('Error submitting admission application:', error);
    next(error);
  }
};

/**
 * Get application details
 */
const getApplicationById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { schoolId } = req.user;

    // Validate ID
    const validation = validateObjectId(id, 'applicationId');
    if (!validation.valid) {
      return validationErrorResponse(res, [validation.error]);
    }

    logger.info(`Fetching application ${id} for school ${schoolId}`);
    const application = await admissionService.getApplicationById(schoolId, id);

    if (!application) {
      return notFoundResponse(res, 'Application not found');
    }

    return successResponse(res, application, 'Application fetched successfully');
  } catch (error) {
    logger.error('Error fetching application:', error);
    next(error);
  }
};

/**
 * Update application
 */
const updateApplication = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { schoolId } = req.user;

    // Validate ID
    const validation = validateObjectId(id, 'applicationId');
    if (!validation.valid) {
      return validationErrorResponse(res, [validation.error]);
    }

    // Validate email if provided
    if (req.body.guardianEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(req.body.guardianEmail)) {
      return validationErrorResponse(res, [{ field: 'guardianEmail', message: 'Invalid email format' }]);
    }

    // Validate phone if provided
    if (req.body.guardianPhone && !/^\+?[\d\s-()]{10,}$/.test(req.body.guardianPhone)) {
      return validationErrorResponse(res, [{ field: 'guardianPhone', message: 'Invalid phone format' }]);
    }

    logger.info(`Updating application ${id} for school ${schoolId}`);
    const application = await admissionService.updateApplication(schoolId, id, req.body);

    if (!application) {
      return notFoundResponse(res, 'Application not found');
    }

    return successResponse(res, application, 'Application updated successfully');
  } catch (error) {
    logger.error('Error updating application:', error);
    next(error);
  }
};

/**
 * Review application
 */
const reviewApplication = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { schoolId, userId } = req.user;
    const { comments, rating } = req.body;

    // Validate ID
    const validation = validateObjectId(id, 'applicationId');
    if (!validation.valid) {
      return validationErrorResponse(res, [validation.error]);
    }

    // Validate rating if provided
    if (rating && (isNaN(rating) || rating < 1 || rating > 5)) {
      return validationErrorResponse(res, [{ field: 'rating', message: 'Rating must be between 1 and 5' }]);
    }

    logger.info(`Reviewing application ${id} by user ${userId}`);
    const application = await admissionService.reviewApplication(schoolId, id, userId, req.body);

    if (!application) {
      return notFoundResponse(res, 'Application not found');
    }

    return successResponse(res, application, 'Application reviewed successfully');
  } catch (error) {
    logger.error('Error reviewing application:', error);
    next(error);
  }
};

/**
 * Approve application
 */
const approveApplication = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { schoolId, userId } = req.user;
    const { comments } = req.body;

    // Validate ID
    const validation = validateObjectId(id, 'applicationId');
    if (!validation.valid) {
      return validationErrorResponse(res, [validation.error]);
    }

    logger.info(`Approving application ${id} by user ${userId}`);
    const application = await admissionService.approveApplication(schoolId, id, userId, req.body);

    if (!application) {
      return notFoundResponse(res, 'Application not found');
    }

    return successResponse(res, application, 'Application approved successfully');
  } catch (error) {
    logger.error('Error approving application:', error);
    next(error);
  }
};

/**
 * Reject application
 */
const rejectApplication = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { schoolId, userId } = req.user;
    const { reason } = req.body;

    // Validate ID
    const validation = validateObjectId(id, 'applicationId');
    if (!validation.valid) {
      return validationErrorResponse(res, [validation.error]);
    }

    // Validate reason
    if (!reason || reason.trim().length < 10) {
      return validationErrorResponse(res, [{ field: 'reason', message: 'Rejection reason is required and must be at least 10 characters' }]);
    }

    logger.info(`Rejecting application ${id} by user ${userId}`);
    const application = await admissionService.rejectApplication(schoolId, id, userId, req.body);

    if (!application) {
      return notFoundResponse(res, 'Application not found');
    }

    return successResponse(res, application, 'Application rejected');
  } catch (error) {
    logger.error('Error rejecting application:', error);
    next(error);
  }
};

/**
 * Get available seats
 */
const getAvailableSeats = async (req, res, next) => {
  try {
    const { academicYear, classId } = req.query;
    const { schoolId } = req.user;

    // Validate academicYear
    if (academicYear && !/^\d{4}-\d{4}$/.test(academicYear)) {
      return validationErrorResponse(res, [{ field: 'academicYear', message: 'Academic year must be in format YYYY-YYYY' }]);
    }

    // Validate classId if provided
    if (classId) {
      const validation = validateObjectId(classId, 'classId');
      if (!validation.valid) {
        return validationErrorResponse(res, [validation.error]);
      }
    }

    logger.info(`Fetching available seats for school ${schoolId}`);
    const seats = await admissionService.getAvailableSeats(schoolId, { academicYear, classId });

    return successResponse(res, seats, 'Available seats fetched successfully');
  } catch (error) {
    logger.error('Error fetching available seats:', error);
    next(error);
  }
};

/**
 * Allocate seat
 */
const allocateSeat = async (req, res, next) => {
  try {
    const { schoolId, userId } = req.user;
    const { applicationId, classId, section } = req.body;

    // Validate required fields
    const errors = [];
    if (!applicationId) {
      errors.push({ field: 'applicationId', message: 'Application ID is required' });
    } else {
      const validation = validateObjectId(applicationId, 'applicationId');
      if (!validation.valid) {
        errors.push(validation.error);
      }
    }
    if (!classId) {
      errors.push({ field: 'classId', message: 'Class ID is required' });
    } else {
      const validation = validateObjectId(classId, 'classId');
      if (!validation.valid) {
        errors.push(validation.error);
      }
    }

    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    logger.info(`Allocating seat for application ${applicationId}`);
    const allocation = await admissionService.allocateSeat(schoolId, req.body, userId);

    return successResponse(res, allocation, 'Seat allocated successfully');
  } catch (error) {
    logger.error('Error allocating seat:', error);
    next(error);
  }
};

/**
 * Get admission criteria
 */
const getAdmissionCriteria = async (req, res, next) => {
  try {
    const { academicYear } = req.query;
    const { schoolId } = req.user;

    // Validate academicYear if provided
    if (academicYear && !/^\d{4}-\d{4}$/.test(academicYear)) {
      return validationErrorResponse(res, [{ field: 'academicYear', message: 'Academic year must be in format YYYY-YYYY' }]);
    }

    logger.info(`Fetching admission criteria for school ${schoolId}`);
    const criteria = await admissionService.getAdmissionCriteria(schoolId, academicYear);

    return successResponse(res, criteria, 'Admission criteria fetched successfully');
  } catch (error) {
    logger.error('Error fetching admission criteria:', error);
    next(error);
  }
};

/**
 * Set admission criteria
 */
const setAdmissionCriteria = async (req, res, next) => {
  try {
    const { schoolId, userId } = req.user;
    const { academicYear, minAge, maxAge, requiredDocuments } = req.body;

    // Validate required fields
    const errors = [];
    if (!academicYear || !/^\d{4}-\d{4}$/.test(academicYear)) {
      errors.push({ field: 'academicYear', message: 'Valid academic year is required in format YYYY-YYYY' });
    }
    if (minAge && (isNaN(minAge) || minAge < 1 || minAge > 25)) {
      errors.push({ field: 'minAge', message: 'Minimum age must be between 1 and 25' });
    }
    if (maxAge && (isNaN(maxAge) || maxAge < 1 || maxAge > 25)) {
      errors.push({ field: 'maxAge', message: 'Maximum age must be between 1 and 25' });
    }
    if (minAge && maxAge && minAge > maxAge) {
      errors.push({ field: 'age', message: 'Minimum age cannot be greater than maximum age' });
    }

    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    logger.info(`Setting admission criteria for school ${schoolId}`);
    const criteria = await admissionService.setAdmissionCriteria(schoolId, req.body, userId);

    return successResponse(res, criteria, 'Admission criteria set successfully');
  } catch (error) {
    logger.error('Error setting admission criteria:', error);
    next(error);
  }
};


/**
 * Schedule entrance test
 */
const scheduleEntranceTest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { schoolId } = req.user;
    const { testDate, testType, venue, duration } = req.body;

    // Validate ID
    const validation = validateObjectId(id, 'applicationId');
    if (!validation.valid) {
      return validationErrorResponse(res, [validation.error]);
    }

    // Validate required fields
    const errors = [];
    if (!testDate) {
      errors.push({ field: 'testDate', message: 'Test date is required' });
    } else {
      const date = new Date(testDate);
      if (isNaN(date.getTime()) || date < new Date()) {
        errors.push({ field: 'testDate', message: 'Test date must be a valid future date' });
      }
    }
    if (testType && !VALID_TEST_TYPES.includes(testType)) {
      errors.push({ field: 'testType', message: `Test type must be one of: ${VALID_TEST_TYPES.join(', ')}` });
    }
    if (duration && (isNaN(duration) || duration < 15 || duration > 480)) {
      errors.push({ field: 'duration', message: 'Duration must be between 15 and 480 minutes' });
    }

    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    logger.info(`Scheduling entrance test for application ${id}`);
    const application = await admissionService.scheduleEntranceTest(schoolId, id, req.body);

    if (!application) {
      return notFoundResponse(res, 'Application not found');
    }

    return successResponse(res, application, 'Entrance test scheduled successfully');
  } catch (error) {
    logger.error('Error scheduling entrance test:', error);
    next(error);
  }
};

/**
 * Submit entrance test result
 */
const submitEntranceTestResult = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { schoolId } = req.user;
    const { score, maxScore, remarks, passed } = req.body;

    // Validate ID
    const validation = validateObjectId(id, 'applicationId');
    if (!validation.valid) {
      return validationErrorResponse(res, [validation.error]);
    }

    // Validate required fields
    const errors = [];
    if (score === undefined || score === null) {
      errors.push({ field: 'score', message: 'Score is required' });
    } else if (isNaN(score) || score < 0) {
      errors.push({ field: 'score', message: 'Score must be a non-negative number' });
    }
    if (maxScore === undefined || maxScore === null) {
      errors.push({ field: 'maxScore', message: 'Maximum score is required' });
    } else if (isNaN(maxScore) || maxScore <= 0) {
      errors.push({ field: 'maxScore', message: 'Maximum score must be a positive number' });
    }
    if (score > maxScore) {
      errors.push({ field: 'score', message: 'Score cannot exceed maximum score' });
    }

    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    logger.info(`Submitting test result for application ${id}`);
    const application = await admissionService.submitEntranceTestResult(schoolId, id, req.body);

    if (!application) {
      return notFoundResponse(res, 'Application not found');
    }

    return successResponse(res, application, 'Test result submitted successfully');
  } catch (error) {
    logger.error('Error submitting test result:', error);
    next(error);
  }
};

/**
 * Generate merit list
 */
const generateMeritList = async (req, res, next) => {
  try {
    const { schoolId } = req.user;
    const { academicYear, classId, criteria } = req.body;

    // Validate required fields
    const errors = [];
    if (!academicYear || !/^\d{4}-\d{4}$/.test(academicYear)) {
      errors.push({ field: 'academicYear', message: 'Valid academic year is required in format YYYY-YYYY' });
    }
    if (classId) {
      const validation = validateObjectId(classId, 'classId');
      if (!validation.valid) {
        errors.push(validation.error);
      }
    }

    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    logger.info(`Generating merit list for school ${schoolId}, academic year ${academicYear}`);
    const meritList = await admissionService.generateMeritList(schoolId, req.body);

    return successResponse(res, meritList, 'Merit list generated successfully');
  } catch (error) {
    logger.error('Error generating merit list:', error);
    next(error);
  }
};

/**
 * Get merit list
 */
const getMeritList = async (req, res, next) => {
  try {
    const { academicYear, classId, page = 1, limit = 50 } = req.query;
    const { schoolId } = req.user;

    // Validate academicYear
    if (academicYear && !/^\d{4}-\d{4}$/.test(academicYear)) {
      return validationErrorResponse(res, [{ field: 'academicYear', message: 'Academic year must be in format YYYY-YYYY' }]);
    }

    // Validate classId if provided
    if (classId) {
      const validation = validateObjectId(classId, 'classId');
      if (!validation.valid) {
        return validationErrorResponse(res, [validation.error]);
      }
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

    logger.info(`Fetching merit list for school ${schoolId}`);
    const meritList = await admissionService.getMeritList(schoolId, {
      academicYear,
      classId,
      page: pageNum,
      limit: limitNum
    });

    return successResponse(res, meritList.data, 'Merit list fetched successfully', {
      pagination: meritList.pagination
    });
  } catch (error) {
    logger.error('Error fetching merit list:', error);
    next(error);
  }
};

/**
 * Get admission statistics
 */
const getAdmissionStatistics = async (req, res, next) => {
  try {
    const { academicYear, startDate, endDate } = req.query;
    const { schoolId } = req.user;

    // Validate academicYear if provided
    if (academicYear && !/^\d{4}-\d{4}$/.test(academicYear)) {
      return validationErrorResponse(res, [{ field: 'academicYear', message: 'Academic year must be in format YYYY-YYYY' }]);
    }

    logger.info(`Fetching admission statistics for school ${schoolId}`);
    const stats = await admissionService.getAdmissionStatistics(schoolId, { academicYear, startDate, endDate });

    return successResponse(res, stats, 'Admission statistics fetched successfully');
  } catch (error) {
    logger.error('Error fetching admission statistics:', error);
    next(error);
  }
};


/**
 * Bulk update application status
 */
const bulkUpdateStatus = async (req, res, next) => {
  try {
    const { schoolId, userId } = req.user;
    const { applicationIds, status, comments } = req.body;

    // Validate applicationIds
    if (!applicationIds || !Array.isArray(applicationIds) || applicationIds.length === 0) {
      return validationErrorResponse(res, [{ field: 'applicationIds', message: 'applicationIds must be a non-empty array' }]);
    }

    // Validate all IDs
    const invalidIds = applicationIds.filter(id => !mongoose.Types.ObjectId.isValid(id));
    if (invalidIds.length > 0) {
      return validationErrorResponse(res, [{ field: 'applicationIds', message: 'One or more application IDs are invalid' }]);
    }

    // Validate status
    if (!status || !VALID_STATUSES.includes(status)) {
      return validationErrorResponse(res, [{ field: 'status', message: `Status must be one of: ${VALID_STATUSES.join(', ')}` }]);
    }

    logger.info(`Bulk updating ${applicationIds.length} applications to status ${status}`);
    const result = await admissionService.bulkUpdateStatus(schoolId, applicationIds, status, userId, comments);

    return successResponse(res, result, `${result.updated} applications updated successfully`);
  } catch (error) {
    logger.error('Error bulk updating applications:', error);
    next(error);
  }
};

/**
 * Delete application
 */
const deleteApplication = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { schoolId } = req.user;

    // Validate ID
    const validation = validateObjectId(id, 'applicationId');
    if (!validation.valid) {
      return validationErrorResponse(res, [validation.error]);
    }

    logger.info(`Deleting application ${id}`);
    const result = await admissionService.deleteApplication(schoolId, id);

    if (!result) {
      return notFoundResponse(res, 'Application not found');
    }

    return successResponse(res, null, 'Application deleted successfully');
  } catch (error) {
    logger.error('Error deleting application:', error);
    next(error);
  }
};

/**
 * Waitlist application
 */
const waitlistApplication = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { schoolId, userId } = req.user;
    const { priority, reason } = req.body;

    // Validate ID
    const validation = validateObjectId(id, 'applicationId');
    if (!validation.valid) {
      return validationErrorResponse(res, [validation.error]);
    }

    // Validate priority if provided
    if (priority && (isNaN(priority) || priority < 1)) {
      return validationErrorResponse(res, [{ field: 'priority', message: 'Priority must be a positive integer' }]);
    }

    logger.info(`Waitlisting application ${id}`);
    const application = await admissionService.waitlistApplication(schoolId, id, userId, { priority, reason });

    if (!application) {
      return notFoundResponse(res, 'Application not found');
    }

    return successResponse(res, application, 'Application added to waitlist');
  } catch (error) {
    logger.error('Error waitlisting application:', error);
    next(error);
  }
};

/**
 * Export applications
 */
const exportApplications = async (req, res, next) => {
  try {
    const { schoolId } = req.user;
    const { status, academicYear, classId, format = 'json' } = req.query;

    // Validate format
    const validFormats = ['json', 'csv', 'xlsx'];
    if (!validFormats.includes(format)) {
      return validationErrorResponse(res, [{ field: 'format', message: `Format must be one of: ${validFormats.join(', ')}` }]);
    }

    logger.info(`Exporting applications for school ${schoolId} in ${format} format`);
    const applications = await admissionService.getApplications(schoolId, {
      status,
      academicYear,
      classId,
      page: 1,
      limit: 10000 // Large limit for export
    });

    // TODO: Implement CSV/XLSX conversion
    if (format === 'json') {
      return successResponse(res, applications.data, 'Applications exported successfully', {
        format,
        count: applications.data.length,
        exportedAt: new Date().toISOString()
      });
    }

    return errorResponse(res, `Export format ${format} not yet implemented`, 501);
  } catch (error) {
    logger.error('Error exporting applications:', error);
    next(error);
  }
};

/**
 * Get application timeline
 */
const getApplicationTimeline = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { schoolId } = req.user;

    // Validate ID
    const validation = validateObjectId(id, 'applicationId');
    if (!validation.valid) {
      return validationErrorResponse(res, [validation.error]);
    }

    logger.info(`Fetching timeline for application ${id}`);
    const timeline = await admissionService.getApplicationTimeline(schoolId, id);

    if (!timeline) {
      return notFoundResponse(res, 'Application not found');
    }

    return successResponse(res, timeline, 'Application timeline fetched successfully');
  } catch (error) {
    logger.error('Error fetching application timeline:', error);
    next(error);
  }
};

/**
 * Send application notification
 */
const sendNotification = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { schoolId } = req.user;
    const { type, message, channel = 'email' } = req.body;

    // Validate ID
    const validation = validateObjectId(id, 'applicationId');
    if (!validation.valid) {
      return validationErrorResponse(res, [validation.error]);
    }

    // Validate required fields
    const errors = [];
    if (!type) {
      errors.push({ field: 'type', message: 'Notification type is required' });
    }
    if (!message || message.trim().length < 10) {
      errors.push({ field: 'message', message: 'Message is required and must be at least 10 characters' });
    }
    const validChannels = ['email', 'sms', 'both'];
    if (!validChannels.includes(channel)) {
      errors.push({ field: 'channel', message: `Channel must be one of: ${validChannels.join(', ')}` });
    }

    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    logger.info(`Sending ${type} notification for application ${id} via ${channel}`);
    const result = await admissionService.sendNotification(schoolId, id, { type, message, channel });

    return successResponse(res, result, 'Notification sent successfully');
  } catch (error) {
    logger.error('Error sending notification:', error);
    next(error);
  }
};


export default {
  getApplications,
  submitApplication,
  getApplicationById,
  updateApplication,
  reviewApplication,
  approveApplication,
  rejectApplication,
  getAvailableSeats,
  allocateSeat,
  getAdmissionCriteria,
  setAdmissionCriteria,
  scheduleEntranceTest,
  submitEntranceTestResult,
  generateMeritList,
  getMeritList,
  getAdmissionStatistics,
  bulkUpdateStatus,
  deleteApplication,
  waitlistApplication,
  exportApplications,
  getApplicationTimeline,
  sendNotification
};
