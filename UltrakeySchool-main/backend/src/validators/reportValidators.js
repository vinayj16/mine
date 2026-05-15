import { body, query, param } from 'express-validator';

export const getStudentReportValidation = [
  param('studentId').isMongoId().withMessage('Invalid student ID'),
  query('academicYear').optional().isString().withMessage('Academic year must be a string')
];

export const getAttendanceReportValidation = [
  query('classId').optional().isMongoId().withMessage('Invalid class ID'),
  query('sectionId').optional().isMongoId().withMessage('Invalid section ID'),
  query('startDate').optional().isISO8601().withMessage('Invalid date format')
];

export const getFeeReportValidation = [
  query('period').optional().isIn(['this-month', 'last-month', 'this-term', 'last-term', 'this-year']).withMessage('Invalid period'),
  query('format').optional().isIn(['summary', 'detailed']).withMessage('Invalid format')
];
