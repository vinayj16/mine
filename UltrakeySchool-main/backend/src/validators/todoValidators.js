import { body, param, query } from 'express-validator';

export const createTodoValidator = [
  body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 200 }).withMessage('Title cannot exceed 200 characters'),
  body('description').optional().trim().isLength({ max: 1000 }).withMessage('Description cannot exceed 1000 characters'),
  body('priority').optional().isIn(['high', 'medium', 'low']).withMessage('Invalid priority'),
  body('status').optional().isIn(['new', 'pending', 'inprogress', 'done', 'trash']).withMessage('Invalid status'),
  body('userId').notEmpty().withMessage('User ID is required').isMongoId().withMessage('Invalid user ID'),
  body('userName').notEmpty().withMessage('User name is required'),
  body('institutionId').optional().isMongoId().withMessage('Invalid institution ID'),
  body('important').optional().isBoolean().withMessage('Important must be boolean'),
  body('dueDate').optional().isISO8601().withMessage('Invalid due date')
];

export const updateTodoValidator = [
  param('id').isMongoId().withMessage('Invalid todo ID'),
  body('title').optional().trim().notEmpty().withMessage('Title cannot be empty').isLength({ max: 200 }).withMessage('Title cannot exceed 200 characters'),
  body('description').optional().trim().isLength({ max: 1000 }).withMessage('Description cannot exceed 1000 characters'),
  body('priority').optional().isIn(['high', 'medium', 'low']).withMessage('Invalid priority'),
  body('status').optional().isIn(['new', 'pending', 'inprogress', 'done', 'trash']).withMessage('Invalid status'),
  body('important').optional().isBoolean().withMessage('Important must be boolean'),
  body('dueDate').optional().isISO8601().withMessage('Invalid due date')
];

export const idValidator = [
  param('id').isMongoId().withMessage('Invalid todo ID')
];

export const bulkActionValidator = [
  body('ids').isArray({ min: 1 }).withMessage('IDs array is required'),
  body('ids.*').isMongoId().withMessage('Invalid todo ID in array')
];

export const queryValidator = [
  query('userId').optional().isMongoId().withMessage('Invalid user ID'),
  query('institutionId').optional().isMongoId().withMessage('Invalid institution ID'),
  query('status').optional().isIn(['new', 'pending', 'inprogress', 'done', 'trash']).withMessage('Invalid status'),
  query('priority').optional().isIn(['high', 'medium', 'low']).withMessage('Invalid priority'),
  query('important').optional().isBoolean().withMessage('Important must be boolean'),
  query('completed').optional().isBoolean().withMessage('Completed must be boolean'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
];
