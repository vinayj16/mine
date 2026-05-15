import { body, param, query } from 'express-validator';

export const studentIdValidator = [
  param('studentId').isMongoId().withMessage('Invalid student ID')
];

export const applyLeaveValidator = [
  param('studentId').isMongoId().withMessage('Invalid student ID'),
  body('leaveType').isIn(['sick', 'casual', 'emergency', 'other']).withMessage('Invalid leave type'),
  body('startDate').isISO8601().withMessage('Invalid start date'),
  body('endDate').isISO8601().withMessage('Invalid end date'),
  body('reason').trim().notEmpty().withMessage('Reason is required'),
  body('attachments').optional().isArray().withMessage('Attachments must be an array')
];

export const reviewLeaveValidator = [
  param('leaveId').isMongoId().withMessage('Invalid leave ID'),
  body('status').isIn(['approved', 'rejected']).withMessage('Invalid status'),
  body('comments').optional().trim()
];

export const getStudentLeavesValidator = [
  param('studentId').isMongoId().withMessage('Invalid student ID'),
  query('status').optional().isIn(['pending', 'approved', 'rejected']).withMessage('Invalid status'),
  query('startDate').optional().isISO8601().withMessage('Invalid start date'),
  query('endDate').optional().isISO8601().withMessage('Invalid end date')
];

export const getStudentAttendanceValidator = [
  param('studentId').isMongoId().withMessage('Invalid student ID'),
  query('startDate').optional().isISO8601().withMessage('Invalid start date'),
  query('endDate').optional().isISO8601().withMessage('Invalid end date'),
  query('status').optional().isIn(['present', 'absent', 'late', 'emergency']).withMessage('Invalid status'),
  query('limit').optional().isInt({ min: 1, max: 500 }).withMessage('Limit must be between 1 and 500')
];

export const getStudentFeesValidator = [
  param('studentId').isMongoId().withMessage('Invalid student ID'),
  query('status').optional().isIn(['pending', 'paid', 'overdue', 'partial']).withMessage('Invalid status'),
  query('feeType').optional().trim(),
  query('academicYear').optional().trim()
];

export const getStudentResultsValidator = [
  param('studentId').isMongoId().withMessage('Invalid student ID'),
  query('academicYear').optional().trim(),
  query('term').optional().isIn(['1st', '2nd', '3rd', 'annual', 'midterm', 'final']).withMessage('Invalid term'),
  query('status').optional().isIn(['draft', 'published', 'archived']).withMessage('Invalid status')
];

export const getStudentLibraryValidator = [
  param('studentId').isMongoId().withMessage('Invalid student ID'),
  query('status').optional().isIn(['issued', 'returned', 'overdue', 'lost']).withMessage('Invalid status')
];
