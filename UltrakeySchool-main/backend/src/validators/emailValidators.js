import { body, param, query } from 'express-validator';

export const createEmailValidator = [
  body('sender.userId').notEmpty().withMessage('Sender user ID is required').isMongoId().withMessage('Invalid sender user ID'),
  body('sender.name').notEmpty().withMessage('Sender name is required'),
  body('sender.email').notEmpty().withMessage('Sender email is required').isEmail().withMessage('Invalid sender email'),
  body('recipients').isArray({ min: 1 }).withMessage('At least one recipient is required'),
  body('recipients.*.email').isEmail().withMessage('Invalid recipient email'),
  body('recipients.*.type').isIn(['to', 'cc', 'bcc']).withMessage('Invalid recipient type'),
  body('subject').trim().notEmpty().withMessage('Subject is required').isLength({ max: 500 }).withMessage('Subject cannot exceed 500 characters'),
  body('content').notEmpty().withMessage('Content is required'),
  body('userId').notEmpty().withMessage('User ID is required').isMongoId().withMessage('Invalid user ID'),
  body('institutionId').optional().isMongoId().withMessage('Invalid institution ID'),
  body('priority').optional().isIn(['low', 'normal', 'high', 'urgent']).withMessage('Invalid priority'),
  body('folder').optional().isIn(['inbox', 'sent', 'drafts', 'archive', 'trash', 'spam', 'important']).withMessage('Invalid folder'),
  body('category').optional().isIn(['primary', 'social', 'promotions', 'updates', 'forums']).withMessage('Invalid category')
];

export const updateEmailValidator = [
  param('id').isMongoId().withMessage('Invalid email ID'),
  body('subject').optional().trim().notEmpty().withMessage('Subject cannot be empty').isLength({ max: 500 }).withMessage('Subject cannot exceed 500 characters'),
  body('priority').optional().isIn(['low', 'normal', 'high', 'urgent']).withMessage('Invalid priority'),
  body('folder').optional().isIn(['inbox', 'sent', 'drafts', 'archive', 'trash', 'spam', 'important']).withMessage('Invalid folder')
];

export const idValidator = [
  param('id').isMongoId().withMessage('Invalid email ID')
];

export const markAsReadValidator = [
  body('ids').isArray({ min: 1 }).withMessage('IDs array is required'),
  body('ids.*').isMongoId().withMessage('Invalid email ID in array'),
  body('isRead').isBoolean().withMessage('isRead must be boolean')
];

export const moveToFolderValidator = [
  body('ids').isArray({ min: 1 }).withMessage('IDs array is required'),
  body('ids.*').isMongoId().withMessage('Invalid email ID in array'),
  body('folder').isIn(['inbox', 'sent', 'drafts', 'archive', 'trash', 'spam', 'important']).withMessage('Invalid folder')
];

export const tagsValidator = [
  param('id').isMongoId().withMessage('Invalid email ID'),
  body('tags').isArray({ min: 1 }).withMessage('Tags array is required'),
  body('tags.*').isString().withMessage('Invalid tag')
];

export const labelsValidator = [
  param('id').isMongoId().withMessage('Invalid email ID'),
  body('labels').isArray({ min: 1 }).withMessage('Labels array is required'),
  body('labels.*').isString().withMessage('Invalid label')
];

export const bulkActionValidator = [
  body('ids').isArray({ min: 1 }).withMessage('IDs array is required'),
  body('ids.*').isMongoId().withMessage('Invalid email ID in array')
];

export const queryValidator = [
  query('userId').optional().isMongoId().withMessage('Invalid user ID'),
  query('institutionId').optional().isMongoId().withMessage('Invalid institution ID'),
  query('folder').optional().isIn(['inbox', 'sent', 'drafts', 'archive', 'trash', 'spam', 'important']).withMessage('Invalid folder'),
  query('isRead').optional().isBoolean().withMessage('isRead must be boolean'),
  query('isStarred').optional().isBoolean().withMessage('isStarred must be boolean'),
  query('isImportant').optional().isBoolean().withMessage('isImportant must be boolean'),
  query('hasAttachment').optional().isBoolean().withMessage('hasAttachment must be boolean'),
  query('priority').optional().isIn(['low', 'normal', 'high', 'urgent']).withMessage('Invalid priority'),
  query('category').optional().isIn(['primary', 'social', 'promotions', 'updates', 'forums']).withMessage('Invalid category'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
];
