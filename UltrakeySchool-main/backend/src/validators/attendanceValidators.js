import { query, body, param } from 'express-validator';

export const getAttendanceWithSummaryValidation = [
  query('classId').optional().isMongoId().withMessage('Invalid class ID'),
  query('sectionId').optional().isMongoId().withMessage('Invalid section ID'),
  query('date').optional().isISO8601().withMessage('Invalid date format')
];

export const markAttendanceValidation = [
  body('studentId').isMongoId().withMessage('Invalid student ID'),
  body('date').isISO8601().withMessage('Invalid date'),
  body('status').isIn(['present', 'absent', 'late', 'excused']).withMessage('Invalid status')
];

export const getStatsValidation = [
  query('classId').optional().isMongoId().withMessage('Invalid class ID'),
  query('date').optional().isISO8601().withMessage('Invalid date')
];

export const getHistoryValidation = [
  query('userId').optional().isMongoId().withMessage('Invalid user ID'),
  query('userType').optional().isIn(['student', 'teacher', 'staff']).withMessage('Invalid user type'),
  query('schoolId').optional().isMongoId().withMessage('Invalid school ID'),
  query('startDate').optional().isISO8601().withMessage('Invalid start date'),
  query('endDate').optional().isISO8601().withMessage('Invalid end date'),
  query('status').optional().isIn(['present', 'absent', 'late', 'excused']).withMessage('Invalid status'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
];

export const getBulkAttendanceValidation = [
  body('classId').isMongoId().withMessage('Invalid class ID'),
  body('date').isISO8601().withMessage('Invalid date'),
  body('attendance').isArray().withMessage('Attendance must be an array')
];
