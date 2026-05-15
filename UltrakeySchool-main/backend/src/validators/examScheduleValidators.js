import { body, param, query } from 'express-validator';

export const createExamScheduleValidator = [
  body('examName')
    .trim()
    .notEmpty()
    .withMessage('Exam name is required'),
  body('classId')
    .isMongoId()
    .withMessage('Invalid class ID'),
  body('className')
    .trim()
    .notEmpty()
    .withMessage('Class name is required'),
  body('section')
    .trim()
    .notEmpty()
    .withMessage('Section is required'),
  body('subject')
    .trim()
    .notEmpty()
    .withMessage('Subject is required'),
  body('examDate')
    .notEmpty()
    .withMessage('Exam date is required')
    .isISO8601()
    .withMessage('Invalid exam date format'),
  body('startTime')
    .trim()
    .notEmpty()
    .withMessage('Start time is required'),
  body('endTime')
    .trim()
    .notEmpty()
    .withMessage('End time is required'),
  body('duration')
    .trim()
    .notEmpty()
    .withMessage('Duration is required'),
  body('roomNo')
    .trim()
    .notEmpty()
    .withMessage('Room number is required'),
  body('maxMarks')
    .isInt({ min: 0 })
    .withMessage('Max marks must be a non-negative integer'),
  body('minMarks')
    .isInt({ min: 0 })
    .withMessage('Min marks must be a non-negative integer'),
  body('academicYear')
    .trim()
    .notEmpty()
    .withMessage('Academic year is required'),
  body('institutionId')
    .isMongoId()
    .withMessage('Invalid institution ID'),
  body('status')
    .optional()
    .isIn(['active', 'inactive', 'completed', 'cancelled'])
    .withMessage('Invalid status')
];

export const updateExamScheduleValidator = [
  body('examName')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Exam name cannot be empty'),
  body('subject')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Subject cannot be empty'),
  body('examDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid exam date format'),
  body('startTime')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Start time cannot be empty'),
  body('endTime')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('End time cannot be empty'),
  body('duration')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Duration cannot be empty'),
  body('roomNo')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Room number cannot be empty'),
  body('maxMarks')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Max marks must be a non-negative integer'),
  body('minMarks')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Min marks must be a non-negative integer'),
  body('status')
    .optional()
    .isIn(['active', 'inactive', 'completed', 'cancelled'])
    .withMessage('Invalid status')
];

export const scheduleIdValidator = [
  param('id')
    .isMongoId()
    .withMessage('Invalid schedule ID')
];

export const scheduleIdParamValidator = [
  param('scheduleId')
    .trim()
    .notEmpty()
    .withMessage('Schedule ID is required')
];

export const classIdValidator = [
  param('classId')
    .isMongoId()
    .withMessage('Invalid class ID')
];

export const dateValidator = [
  param('date')
    .notEmpty()
    .withMessage('Date is required')
    .isISO8601()
    .withMessage('Invalid date format')
];

export const roomNoValidator = [
  param('roomNo')
    .trim()
    .notEmpty()
    .withMessage('Room number is required')
];

export const invigilatorIdValidator = [
  param('invigilatorId')
    .isMongoId()
    .withMessage('Invalid invigilator ID')
];

export const updateStatusValidator = [
  body('status')
    .isIn(['active', 'inactive', 'completed', 'cancelled'])
    .withMessage('Status must be active, inactive, completed, or cancelled')
];

export const bulkUpdateStatusValidator = [
  body('scheduleIds')
    .isArray({ min: 1 })
    .withMessage('Schedule IDs must be a non-empty array'),
  body('scheduleIds.*')
    .isMongoId()
    .withMessage('Invalid schedule ID in array'),
  body('status')
    .isIn(['active', 'inactive', 'completed', 'cancelled'])
    .withMessage('Status must be active, inactive, completed, or cancelled')
];

export const searchValidator = [
  query('q')
    .trim()
    .notEmpty()
    .withMessage('Search query is required')
    .isLength({ min: 1 })
    .withMessage('Search query must be at least 1 character')
];

export const exportValidator = [
  query('format')
    .isIn(['json', 'csv', 'xlsx', 'pdf'])
    .withMessage('Format must be json, csv, xlsx, or pdf'),
  query('institutionId')
    .optional()
    .isMongoId()
    .withMessage('Invalid institution ID'),
  query('academicYear')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Academic year cannot be empty'),
  query('status')
    .optional()
    .isIn(['active', 'inactive', 'completed', 'cancelled'])
    .withMessage('Invalid status'),
  query('classId')
    .optional()
    .isMongoId()
    .withMessage('Invalid class ID')
];
