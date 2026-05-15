import { body, query, param } from 'express-validator';

export const upsertPerformerValidation = [
  body('userId')
    .notEmpty()
    .withMessage('User ID is required')
    .isMongoId()
    .withMessage('Invalid user ID format'),
  
  body('type')
    .notEmpty()
    .withMessage('Type is required')
    .isIn(['teacher', 'student'])
    .withMessage('Type must be teacher or student'),
  
  body('name')
    .notEmpty()
    .withMessage('Name is required')
    .isString()
    .withMessage('Name must be a string')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  
  body('role')
    .notEmpty()
    .withMessage('Role is required')
    .isString()
    .withMessage('Role must be a string')
    .trim(),
  
  body('classInfo')
    .optional()
    .isString()
    .withMessage('Class info must be a string')
    .trim(),
  
  body('imageUrl')
    .optional()
    .isString()
    .withMessage('Image URL must be a string')
    .trim(),
  
  body('achievements')
    .optional()
    .isArray()
    .withMessage('Achievements must be an array'),
  
  body('achievements.*')
    .optional()
    .isString()
    .withMessage('Each achievement must be a string')
    .trim(),
  
  body('performance')
    .optional()
    .isObject()
    .withMessage('Performance must be an object'),
  
  body('performance.rating')
    .optional()
    .isFloat({ min: 0, max: 10 })
    .withMessage('Rating must be between 0 and 10'),
  
  body('performance.attendance')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Attendance must be between 0 and 100'),
  
  body('performance.grade')
    .optional()
    .isString()
    .withMessage('Grade must be a string')
    .trim(),
  
  body('metrics')
    .optional()
    .isObject()
    .withMessage('Metrics must be an object')
];

export const getBestPerformersValidation = [
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50'),
  
  query('period')
    .optional()
    .isIn(['current', 'all', 'month', 'quarter', 'year'])
    .withMessage('Period must be current, all, month, quarter, or year'),
  
  query('featured')
    .optional()
    .isBoolean()
    .withMessage('Featured must be a boolean')
];

export const getPerformersByTypeValidation = [
  param('type')
    .notEmpty()
    .withMessage('Type is required')
    .isIn(['teacher', 'student'])
    .withMessage('Type must be teacher or student'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  query('period')
    .optional()
    .isIn(['current', 'all', 'month', 'quarter', 'year'])
    .withMessage('Period must be current, all, month, quarter, or year')
];

export const getPerformerByIdValidation = [
  param('id')
    .notEmpty()
    .withMessage('Performer ID is required')
    .isMongoId()
    .withMessage('Invalid performer ID format')
];

export const setFeaturedPerformersValidation = [
  body('performerIds')
    .notEmpty()
    .withMessage('Performer IDs are required')
    .isArray()
    .withMessage('Performer IDs must be an array'),
  
  body('performerIds.*')
    .isMongoId()
    .withMessage('Each performer ID must be a valid MongoDB ObjectId')
];

export const calculateMetricsValidation = [
  body('userId')
    .notEmpty()
    .withMessage('User ID is required')
    .isMongoId()
    .withMessage('Invalid user ID format'),
  
  body('type')
    .notEmpty()
    .withMessage('Type is required')
    .isIn(['teacher', 'student'])
    .withMessage('Type must be teacher or student')
];

export const bulkUpdatePerformersValidation = [
  body('type')
    .notEmpty()
    .withMessage('Type is required')
    .isIn(['teacher', 'student'])
    .withMessage('Type must be teacher or student'),
  
  body('period')
    .optional()
    .isObject()
    .withMessage('Period must be an object'),
  
  body('period.month')
    .optional()
    .isInt({ min: 1, max: 12 })
    .withMessage('Month must be between 1 and 12'),
  
  body('period.year')
    .optional()
    .isInt({ min: 2000, max: 2100 })
    .withMessage('Year must be between 2000 and 2100'),
  
  body('period.quarter')
    .optional()
    .isInt({ min: 1, max: 4 })
    .withMessage('Quarter must be between 1 and 4')
];

export const deletePerformerValidation = [
  param('id')
    .notEmpty()
    .withMessage('Performer ID is required')
    .isMongoId()
    .withMessage('Invalid performer ID format')
];
