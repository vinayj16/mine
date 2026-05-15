import { body, param, query } from 'express-validator';

export const createNoteValidator = [
  body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 200 }).withMessage('Title cannot exceed 200 characters'),
  body('description').optional().trim().isLength({ max: 2000 }).withMessage('Description cannot exceed 2000 characters'),
  body('priority').optional().isIn(['high', 'medium', 'low']).withMessage('Invalid priority'),
  body('tag').optional().isIn(['personal', 'work', 'social']).withMessage('Invalid tag'),
  body('userId').notEmpty().withMessage('User ID is required').isMongoId().withMessage('Invalid user ID'),
  body('userName').notEmpty().withMessage('User name is required'),
  body('institutionId').optional().isMongoId().withMessage('Invalid institution ID'),
  body('important').optional().isBoolean().withMessage('Important must be boolean')
];

export const updateNoteValidator = [
  param('id').isMongoId().withMessage('Invalid note ID'),
  body('title').optional().trim().notEmpty().withMessage('Title cannot be empty').isLength({ max: 200 }).withMessage('Title cannot exceed 200 characters'),
  body('description').optional().trim().isLength({ max: 2000 }).withMessage('Description cannot exceed 2000 characters'),
  body('priority').optional().isIn(['high', 'medium', 'low']).withMessage('Invalid priority'),
  body('tag').optional().isIn(['personal', 'work', 'social']).withMessage('Invalid tag'),
  body('important').optional().isBoolean().withMessage('Important must be boolean')
];

export const idValidator = [
  param('id').isMongoId().withMessage('Invalid note ID')
];

export const queryValidator = [
  query('userId').optional().isMongoId().withMessage('Invalid user ID'),
  query('institutionId').optional().isMongoId().withMessage('Invalid institution ID'),
  query('status').optional().isIn(['active', 'trash']).withMessage('Invalid status'),
  query('priority').optional().isIn(['high', 'medium', 'low']).withMessage('Invalid priority'),
  query('tag').optional().isIn(['personal', 'work', 'social']).withMessage('Invalid tag'),
  query('important').optional().isBoolean().withMessage('Important must be boolean'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
];
