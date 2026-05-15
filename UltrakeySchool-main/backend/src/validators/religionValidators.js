import { body, param, query } from 'express-validator';

export const createReligionValidator = [
  body('name').trim().notEmpty().withMessage('Religion name is required'),
  body('status').optional().isIn(['active', 'inactive']).withMessage('Invalid status'),
  body('institutionId').optional().isMongoId().withMessage('Invalid institution ID'),
  body('displayOrder').optional().isInt({ min: 0 }).withMessage('Display order must be a positive number')
];

export const updateReligionValidator = [
  body('name').optional().trim().notEmpty().withMessage('Religion name cannot be empty'),
  body('status').optional().isIn(['active', 'inactive']).withMessage('Invalid status'),
  body('displayOrder').optional().isInt({ min: 0 }).withMessage('Display order must be a positive number')
];

export const religionIdValidator = [
  param('id').isMongoId().withMessage('Invalid religion ID')
];

export const statusValidator = [
  param('status').isIn(['active', 'inactive']).withMessage('Invalid status')
];

export const searchValidator = [
  query('q').trim().notEmpty().withMessage('Search query is required').isLength({ min: 2 }).withMessage('Search query must be at least 2 characters')
];

export const updateStatusValidator = [
  body('status').notEmpty().withMessage('Status is required').isIn(['active', 'inactive']).withMessage('Invalid status')
];

export const bulkUpdateStatusValidator = [
  body('religionIds').isArray({ min: 1 }).withMessage('Religion IDs must be a non-empty array'),
  body('religionIds.*').isMongoId().withMessage('Invalid religion ID'),
  body('status').notEmpty().withMessage('Status is required').isIn(['active', 'inactive']).withMessage('Invalid status')
];
