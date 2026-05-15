import advancedProctoringService from '../services/advancedProctoringService.js';
import { successResponse, createdResponse, errorResponse, validationErrorResponse, notFoundResponse } from '../utils/apiResponse.js';
import logger from '../utils/logger.js';
import mongoose from 'mongoose';

// Valid violation types
const VALID_VIOLATION_TYPES = [
  'face_not_detected',
  'multiple_faces',
  'looking_away',
  'tab_switch',
  'window_switch',
  'copy_paste',
  'unauthorized_device',
  'suspicious_behavior',
  'audio_detected',
  'screen_sharing'
];

// Valid session statuses
const VALID_SESSION_STATUSES = ['active', 'paused', 'completed', 'terminated', 'flagged'];

// Valid severity levels
const VALID_SEVERITY_LEVELS = ['low', 'medium', 'high', 'critical'];

/**
 * Validate MongoDB ObjectId
 */
const validateObjectId = (id, fieldName = 'id') => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return { valid: false, error: { field: fieldName, message: `Invalid ${fieldName} format` } };
  }
  return { valid: true };
};

class AdvancedProctoringController {
  async startSession(req, res) {
    try {
      const { examId, studentId, duration, settings } = req.body;

      // Validate required fields
      const errors = [];
      if (!examId) {
        errors.push({ field: 'examId', message: 'Exam ID is required' });
      } else {
        const validation = validateObjectId(examId, 'examId');
        if (!validation.valid) {
          errors.push(validation.error);
        }
      }
      if (!studentId) {
        errors.push({ field: 'studentId', message: 'Student ID is required' });
      } else {
        const validation = validateObjectId(studentId, 'studentId');
        if (!validation.valid) {
          errors.push(validation.error);
        }
      }
      if (duration && (isNaN(duration) || duration < 1 || duration > 600)) {
        errors.push({ field: 'duration', message: 'Duration must be between 1 and 600 minutes' });
      }

      if (errors.length > 0) {
        return validationErrorResponse(res, errors);
      }

      logger.info(`Starting proctoring session for student ${studentId}, exam ${examId}`);
      const session = await advancedProctoringService.startProctoringSession(
        req.body,
        req.user.institution
      );

      return createdResponse(res, session, 'Proctoring session started successfully');
    } catch (error) {
      logger.error(`Error starting proctoring session: ${error.message}`);
      return errorResponse(res, error.message, 500);
    }
  }

  async recordViolation(req, res) {
    try {
      const { sessionId } = req.params;
      const { violationType, severity, description, timestamp, evidence } = req.body;

      // Validate sessionId
      const validation = validateObjectId(sessionId, 'sessionId');
      if (!validation.valid) {
        return validationErrorResponse(res, [validation.error]);
      }

      // Validate required fields
      const errors = [];
      if (!violationType || !VALID_VIOLATION_TYPES.includes(violationType)) {
        errors.push({ field: 'violationType', message: `Violation type must be one of: ${VALID_VIOLATION_TYPES.join(', ')}` });
      }
      if (severity && !VALID_SEVERITY_LEVELS.includes(severity)) {
        errors.push({ field: 'severity', message: 'Severity must be one of: ' + VALID_SEVERITY_LEVELS.join(', ') });
      }
      if (!description || description.trim().length < 5) {
        errors.push({ field: 'description', message: 'Description is required and must be at least 5 characters' });
      }
      if (timestamp) {
        const ts = new Date(timestamp);
        if (isNaN(ts.getTime())) {
          errors.push({ field: 'timestamp', message: 'Invalid timestamp format' });
        }
      }

      if (errors.length > 0) {
        return validationErrorResponse(res, errors);
      }

      logger.info(`Recording violation for session ${sessionId}: ${violationType}`);
      const session = await advancedProctoringService.recordViolation(
        sessionId,
        req.body,
        req.user.institution
      );

      if (!session) {
        return notFoundResponse(res, 'Proctoring session not found');
      }

      return successResponse(res, session, 'Violation recorded successfully');
    } catch (error) {
      logger.error(`Error recording violation: ${error.message}`);
      return errorResponse(res, error.message, 500);
    }
  }

  async analyzeScreenshot(req, res) {
    try {
      const { sessionId } = req.params;
      const { imageData, timestamp, metadata } = req.body;

      // Validate sessionId
      const validation = validateObjectId(sessionId, 'sessionId');
      if (!validation.valid) {
        return validationErrorResponse(res, [validation.error]);
      }

      // Validate required fields
      const errors = [];
      if (!imageData || imageData.length < 100) {
        errors.push({ field: 'imageData', message: 'Valid image data is required' });
      }
      if (timestamp) {
        const ts = new Date(timestamp);
        if (isNaN(ts.getTime())) {
          errors.push({ field: 'timestamp', message: 'Invalid timestamp format' });
        }
      }

      if (errors.length > 0) {
        return validationErrorResponse(res, errors);
      }

      logger.info(`Analyzing screenshot for session ${sessionId}`);
      const analysis = await advancedProctoringService.analyzeScreenshot(
        sessionId,
        req.body,
        req.user.institution
      );

      if (!analysis) {
        return notFoundResponse(res, 'Proctoring session not found');
      }

      return successResponse(res, analysis, 'Screenshot analyzed successfully');
    } catch (error) {
      logger.error(`Error analyzing screenshot: ${error.message}`);
      return errorResponse(res, error.message, 500);
    }
  }

  async endSession(req, res) {
    try {
      const { sessionId } = req.params;
      const { reason, finalReport } = req.body;

      // Validate sessionId
      const validation = validateObjectId(sessionId, 'sessionId');
      if (!validation.valid) {
        return validationErrorResponse(res, [validation.error]);
      }

      logger.info(`Ending proctoring session ${sessionId}`);
      const session = await advancedProctoringService.endProctoringSession(
        sessionId,
        req.user.institution,
        { reason, finalReport }
      );

      if (!session) {
        return notFoundResponse(res, 'Proctoring session not found');
      }

      return successResponse(res, session, 'Proctoring session ended successfully');
    } catch (error) {
      logger.error(`Error ending proctoring session: ${error.message}`);
      return errorResponse(res, error.message, 500);
    }
  }

  async getSessions(req, res) {
    try {
      const { examId, studentId, status, startDate, endDate, page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

      // Validate examId if provided
      if (examId) {
        const validation = validateObjectId(examId, 'examId');
        if (!validation.valid) {
          return validationErrorResponse(res, [validation.error]);
        }
      }

      // Validate studentId if provided
      if (studentId) {
        const validation = validateObjectId(studentId, 'studentId');
        if (!validation.valid) {
          return validationErrorResponse(res, [validation.error]);
        }
      }

      // Validate status if provided
      if (status && !VALID_SESSION_STATUSES.includes(status)) {
        return validationErrorResponse(res, [{ field: 'status', message: `Status must be one of: ${VALID_SESSION_STATUSES.join(', ')}` }]);
      }

      // Validate date range if provided
      if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) {
          return validationErrorResponse(res, [{ field: 'dateRange', message: 'Valid start and end dates are required' }]);
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

      logger.info(`Fetching proctoring sessions for institution ${req.user.institution}`);
      const result = await advancedProctoringService.getProctoringSessions(
        req.user.institution,
        { examId, studentId, status, startDate, endDate, page: pageNum, limit: limitNum, sortBy, sortOrder }
      );

      return successResponse(res, result.sessions, 'Proctoring sessions fetched successfully', {
        pagination: result.pagination,
        filters: { examId, studentId, status }
      });
    } catch (error) {
      logger.error(`Error fetching proctoring sessions: ${error.message}`);
      return errorResponse(res, error.message, 500);
    }
  }

  async getSessionById(req, res) {
    try {
      const { sessionId } = req.params;

      // Validate sessionId
      const validation = validateObjectId(sessionId, 'sessionId');
      if (!validation.valid) {
        return validationErrorResponse(res, [validation.error]);
      }

      logger.info(`Fetching proctoring session ${sessionId}`);
      const session = await advancedProctoringService.getSessionById(
        sessionId,
        req.user.institution
      );

      if (!session) {
        return notFoundResponse(res, 'Proctoring session not found');
      }

      return successResponse(res, session, 'Proctoring session fetched successfully');
    } catch (error) {
      logger.error(`Error fetching proctoring session: ${error.message}`);
      return errorResponse(res, error.message, 500);
    }
  }

  async getStatistics(req, res) {
    try {
      const { examId, startDate, endDate, groupBy = 'day' } = req.query;

      // Validate examId if provided
      if (examId) {
        const validation = validateObjectId(examId, 'examId');
        if (!validation.valid) {
          return validationErrorResponse(res, [validation.error]);
        }
      }

      // Validate date range if provided
      if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) {
          return validationErrorResponse(res, [{ field: 'dateRange', message: 'Valid start and end dates are required' }]);
        }
      }

      // Validate groupBy
      const validGroupBy = ['hour', 'day', 'week', 'month'];
      if (!validGroupBy.includes(groupBy)) {
        return validationErrorResponse(res, [{ field: 'groupBy', message: `groupBy must be one of: ${validGroupBy.join(', ')}` }]);
      }

      logger.info(`Fetching proctoring statistics for institution ${req.user.institution}`);
      const stats = await advancedProctoringService.getProctoringStatistics(
        req.user.institution,
        { examId, startDate, endDate, groupBy }
      );

      return successResponse(res, stats, 'Proctoring statistics fetched successfully');
    } catch (error) {
      logger.error(`Error fetching proctoring statistics: ${error.message}`);
      return errorResponse(res, error.message, 500);
    }
  }

  async updateWebcamStatus(req, res) {
    try {
      const { sessionId } = req.params;
      const { status, reason } = req.body;

      // Validate sessionId
      const validation = validateObjectId(sessionId, 'sessionId');
      if (!validation.valid) {
        return validationErrorResponse(res, [validation.error]);
      }

      // Validate status
      const validStatuses = ['active', 'inactive', 'blocked', 'error'];
      if (!status || !validStatuses.includes(status)) {
        return validationErrorResponse(res, [{ field: 'status', message: `Status must be one of: ${validStatuses.join(', ')}` }]);
      }

      logger.info(`Updating webcam status for session ${sessionId} to ${status}`);
      const session = await advancedProctoringService.updateWebcamStatus(
        sessionId,
        status,
        req.user.institution,
        reason
      );

      if (!session) {
        return notFoundResponse(res, 'Proctoring session not found');
      }

      return successResponse(res, session, 'Webcam status updated successfully');
    } catch (error) {
      logger.error(`Error updating webcam status: ${error.message}`);
      return errorResponse(res, error.message, 500);
    }
  }

  async getViolations(req, res) {
    try {
      const { sessionId, violationType, severity, startDate, endDate, page = 1, limit = 20 } = req.query;

      // Validate sessionId if provided
      if (sessionId) {
        const validation = validateObjectId(sessionId, 'sessionId');
        if (!validation.valid) {
          return validationErrorResponse(res, [validation.error]);
        }
      }

      // Validate violationType if provided
      if (violationType && !VALID_VIOLATION_TYPES.includes(violationType)) {
        return validationErrorResponse(res, [{ field: 'violationType', message: `Violation type must be one of: ${VALID_VIOLATION_TYPES.join(', ')}` }]);
      }

      // Validate severity if provided
      if (severity && !VALID_SEVERITY_LEVELS.includes(severity)) {
        return validationErrorResponse(res, [{ field: 'severity', message: 'Severity must be one of: ' + VALID_SEVERITY_LEVELS.join(', ') }]);
      }

      // Validate date range if provided
      if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) {
          return validationErrorResponse(res, [{ field: 'dateRange', message: 'Valid start and end dates are required' }]);
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

      logger.info(`Fetching violations for institution ${req.user.institution}`);
      const result = await advancedProctoringService.getViolations(
        req.user.institution,
        { sessionId, violationType, severity, startDate, endDate, page: pageNum, limit: limitNum }
      );

      return successResponse(res, result.violations, 'Violations fetched successfully', {
        pagination: result.pagination
      });
    } catch (error) {
      logger.error(`Error fetching violations: ${error.message}`);
      return errorResponse(res, error.message, 500);
    }
  }

  async pauseSession(req, res) {
    try {
      const { sessionId } = req.params;
      const { reason } = req.body;

      // Validate sessionId
      const validation = validateObjectId(sessionId, 'sessionId');
      if (!validation.valid) {
        return validationErrorResponse(res, [validation.error]);
      }

      logger.info(`Pausing proctoring session ${sessionId}`);
      const session = await advancedProctoringService.pauseSession(
        sessionId,
        req.user.institution,
        reason
      );

      if (!session) {
        return notFoundResponse(res, 'Proctoring session not found');
      }

      return successResponse(res, session, 'Proctoring session paused successfully');
    } catch (error) {
      logger.error(`Error pausing proctoring session: ${error.message}`);
      return errorResponse(res, error.message, 500);
    }
  }

  async resumeSession(req, res) {
    try {
      const { sessionId } = req.params;

      // Validate sessionId
      const validation = validateObjectId(sessionId, 'sessionId');
      if (!validation.valid) {
        return validationErrorResponse(res, [validation.error]);
      }

      logger.info(`Resuming proctoring session ${sessionId}`);
      const session = await advancedProctoringService.resumeSession(
        sessionId,
        req.user.institution
      );

      if (!session) {
        return notFoundResponse(res, 'Proctoring session not found');
      }

      return successResponse(res, session, 'Proctoring session resumed successfully');
    } catch (error) {
      logger.error(`Error resuming proctoring session: ${error.message}`);
      return errorResponse(res, error.message, 500);
    }
  }

  async flagSession(req, res) {
    try {
      const { sessionId } = req.params;
      const { reason, severity } = req.body;

      // Validate sessionId
      const validation = validateObjectId(sessionId, 'sessionId');
      if (!validation.valid) {
        return validationErrorResponse(res, [validation.error]);
      }

      // Validate required fields
      const errors = [];
      if (!reason || reason.trim().length < 10) {
        errors.push({ field: 'reason', message: 'Reason is required and must be at least 10 characters' });
      }
      if (severity && !VALID_SEVERITY_LEVELS.includes(severity)) {
        errors.push({ field: 'severity', message: 'Severity must be one of: ' + VALID_SEVERITY_LEVELS.join(', ') });
      }

      if (errors.length > 0) {
        return validationErrorResponse(res, errors);
      }

      logger.info(`Flagging proctoring session ${sessionId}`);
      const session = await advancedProctoringService.flagSession(
        sessionId,
        req.user.institution,
        { reason, severity }
      );

      if (!session) {
        return notFoundResponse(res, 'Proctoring session not found');
      }

      return successResponse(res, session, 'Proctoring session flagged successfully');
    } catch (error) {
      logger.error(`Error flagging proctoring session: ${error.message}`);
      return errorResponse(res, error.message, 500);
    }
  }

  async generateReport(req, res) {
    try {
      const { sessionId } = req.params;
      const { format = 'json', includeScreenshots = false } = req.query;

      // Validate sessionId
      const validation = validateObjectId(sessionId, 'sessionId');
      if (!validation.valid) {
        return validationErrorResponse(res, [validation.error]);
      }

      // Validate format
      const validFormats = ['json', 'pdf', 'csv'];
      if (!validFormats.includes(format)) {
        return validationErrorResponse(res, [{ field: 'format', message: `Format must be one of: ${validFormats.join(', ')}` }]);
      }

      logger.info(`Generating report for proctoring session ${sessionId}`);
      const report = await advancedProctoringService.generateReport(
        sessionId,
        req.user.institution,
        { format, includeScreenshots: includeScreenshots === 'true' }
      );

      if (!report) {
        return notFoundResponse(res, 'Proctoring session not found');
      }

      return successResponse(res, report, 'Report generated successfully');
    } catch (error) {
      logger.error(`Error generating report: ${error.message}`);
      return errorResponse(res, error.message, 500);
    }
  }

  async updateSessionSettings(req, res) {
    try {
      const { sessionId } = req.params;
      const { settings } = req.body;

      // Validate sessionId
      const validation = validateObjectId(sessionId, 'sessionId');
      if (!validation.valid) {
        return validationErrorResponse(res, [validation.error]);
      }

      // Validate settings
      if (!settings || typeof settings !== 'object') {
        return validationErrorResponse(res, [{ field: 'settings', message: 'Valid settings object is required' }]);
      }

      logger.info(`Updating settings for proctoring session ${sessionId}`);
      const session = await advancedProctoringService.updateSessionSettings(
        sessionId,
        req.user.institution,
        settings
      );

      if (!session) {
        return notFoundResponse(res, 'Proctoring session not found');
      }

      return successResponse(res, session, 'Session settings updated successfully');
    } catch (error) {
      logger.error(`Error updating session settings: ${error.message}`);
      return errorResponse(res, error.message, 500);
    }
  }

  async getSessionActivity(req, res) {
    try {
      const { sessionId } = req.params;
      const { activityType, page = 1, limit = 50 } = req.query;

      // Validate sessionId
      const validation = validateObjectId(sessionId, 'sessionId');
      if (!validation.valid) {
        return validationErrorResponse(res, [validation.error]);
      }

      // Validate activityType if provided
      const validActivityTypes = ['screenshot', 'violation', 'status_change', 'webcam_event', 'all'];
      if (activityType && !validActivityTypes.includes(activityType)) {
        return validationErrorResponse(res, [{ field: 'activityType', message: `Activity type must be one of: ${validActivityTypes.join(', ')}` }]);
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

      logger.info(`Fetching activity for proctoring session ${sessionId}`);
      const result = await advancedProctoringService.getSessionActivity(
        sessionId,
        req.user.institution,
        { activityType, page: pageNum, limit: limitNum }
      );

      if (!result) {
        return notFoundResponse(res, 'Proctoring session not found');
      }

      return successResponse(res, result.activities, 'Session activity fetched successfully', {
        pagination: result.pagination
      });
    } catch (error) {
      logger.error(`Error fetching session activity: ${error.message}`);
      return errorResponse(res, error.message, 500);
    }
  }
}

export default new AdvancedProctoringController();
