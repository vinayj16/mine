import { body, param, query } from 'express-validator';

export const createItemValidator = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 255 }).withMessage('Name cannot exceed 255 characters'),
  body('type').isIn(['file', 'folder']).withMessage('Type must be file or folder'),
  body('fileType').optional().isIn(['pdf', 'doc', 'xls', 'img', 'video', 'audio', 'other']).withMessage('Invalid file type'),
  body('size').optional().isInt({ min: 0 }).withMessage('Size must be non-negative'),
  body('ownerId').notEmpty().withMessage('Owner ID is required').isString().withMessage('Owner ID must be a string'),
  body('ownerName').notEmpty().withMessage('Owner name is required'),
  body('parentId').optional().isString().withMessage(' Parent ID must be a string'),
  body('institutionId').optional().isString().withMessage('Institution ID must be a string'),
  body('permissions').optional().isIn(['read', 'write', 'admin']).withMessage('Invalid permissions')
];

export const updateItemValidator = [
  param('id').isMongoId().withMessage('Invalid item ID'),
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty').isLength({ max: 255 }).withMessage('Name cannot exceed 255 characters'),
  body('size').optional().isInt({ min: 0 }).withMessage('Size must be non-negative'),
  body('permissions').optional().isIn(['read', 'write', 'admin']).withMessage('Invalid permissions'),
  body('description').optional().isLength({ max: 1000 }).withMessage('Description cannot exceed 1000 characters')
];

export const idValidator = [
  param('id').isMongoId().withMessage('Invalid item ID')
];

export const shareValidator = [
  param('id').isMongoId().withMessage('Invalid item ID'),
  body('userIds').isArray({ min: 1 }).withMessage('User IDs array is required'),
  body('userIds.*').isMongoId().withMessage('Invalid user ID in array')
];

export const moveValidator = [
  param('id').isMongoId().withMessage('Invalid item ID'),
  body('newParentId').optional().isMongoId().withMessage('Invalid parent ID')
];

export const queryValidator = [
  query('ownerId').optional().isString().withMessage('Owner ID must be a string'),
  query('institutionId').optional().isString().withMessage('Institution ID must be a string'),
  query('parentId').optional().isString().withMessage('Parent ID must be a string'),
  query('type').optional().isIn(['file', 'folder']).withMessage('Invalid type'),
  query('fileType').optional().isIn(['pdf', 'doc', 'xls', 'img', 'video', 'audio', 'other']).withMessage('Invalid file type'),
  query('isFavorite').optional().isBoolean().withMessage('isFavorite must be boolean'),
  query('isShared').optional().isBoolean().withMessage('isShared must be boolean'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be positive integer'),
  query('limit').optional().isInt({ min: 1, max: 200 }).withMessage('Limit must be between 1 and 200')
];
