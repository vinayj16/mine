import { body, param, query } from 'express-validator';

export const markAttendanceValidator = [
  body('studentId').notEmpty().withMessage('Student ID is required').isMongoId().withMessage('Invalid student ID'),
  body('admissionNo').notEmpty().withMessage('Admission number is required'),
  body('rollNo').notEmpty().withMessage('Roll number is required'),
  body('studentName').notEmpty().withMessage('Student name is required'),
  body('className').notEmpty().withMessage('Class is required'),
  body('section').notEmpty().withMessage('Section is required'),
  body('date').notEmpty().withMessage('Date is required').isISO8601().withMessage('Invalid date format'),
  body('attendance').isIn(['present', 'late', 'absent', 'holiday', 'halfday']).withMessage('Invalid attendance status'),
  body('markedBy').notEmpty().withMessage('Marked by user ID is required').isMongoId().withMessage('Invalid user ID'),
  body('markedByName').notEmpty().withMessage('Marked by name is required'),
  body('academicYear').notEmpty().withMessage('Academic year is required'),
  body('institutionId').notEmpty().withMessage('Institution ID is required').isMongoId().withMessage('Invalid institution ID'),
  body('notes').optional().isLength({ max: 500 }).withMessage('Notes cannot exceed 500 characters')
];

export const bulkMarkAttendanceValidator = [
  body('attendanceRecords').isArray({ min: 1 }).withMessage('Attendance records array is required'),
  body('attendanceRecords.*.studentId').isMongoId().withMessage('Invalid student ID'),
  body('attendanceRecords.*.attendance').isIn(['present', 'late', 'absent', 'holiday', 'halfday']).withMessage('Invalid attendance status')
];

export const updateAttendanceValidator = [
  param('id').isMongoId().withMessage('Invalid attendance ID'),
  body('attendance').optional().isIn(['present', 'late', 'absent', 'holiday', 'halfday']).withMessage('Invalid attendance status'),
  body('notes').optional().isLength({ max: 500 }).withMessage('Notes cannot exceed 500 characters'),
  body('modifiedBy').optional().isMongoId().withMessage('Invalid user ID'),
  body('modifiedByName').optional().isString().withMessage('Modified by name must be a string')
];

export const idValidator = [
  param('id').isMongoId().withMessage('Invalid attendance ID')
];

export const dateValidator = [
  param('date').isISO8601().withMessage('Invalid date format')
];

export const studentIdValidator = [
  param('studentId').isMongoId().withMessage('Invalid student ID')
];

export const classReportValidator = [
  param('className').notEmpty().withMessage('Class name is required'),
  param('section').notEmpty().withMessage('Section is required'),
  param('date').isISO8601().withMessage('Invalid date format'),
  query('institutionId').notEmpty().withMessage('Institution ID is required').isMongoId().withMessage('Invalid institution ID')
];

export const queryValidator = [
  query('institutionId').optional().isMongoId().withMessage('Invalid institution ID'),
  query('studentId').optional().isMongoId().withMessage('Invalid student ID'),
  query('className').optional().isString().withMessage('Class name must be a string'),
  query('section').optional().isString().withMessage('Section must be a string'),
  query('academicYear').optional().isString().withMessage('Academic year must be a string'),
  query('attendance').optional().isIn(['present', 'late', 'absent', 'holiday', 'halfday']).withMessage('Invalid attendance status'),
  query('dateFrom').optional().isISO8601().withMessage('Invalid date format'),
  query('dateTo').optional().isISO8601().withMessage('Invalid date format'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
];
