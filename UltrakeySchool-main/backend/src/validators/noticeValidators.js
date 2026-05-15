import { body, param, query } from 'express-validator';

export const createNoticeValidator = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ min: 3, max: 200 })
    .withMessage('Title must be between 3 and 200 characters'),
  body('description')
    .trim()
    .notEmpty()
    .withMessage('Description is required'),
  body('noticeDate')
    .notEmpty()
    .withMessage('Notice date is required')
    .isISO8601()
    .withMessage('Invalid notice date format'),
  body('publishDate')
    .notEmpty()
    .withMessage('Publish date is required')
    .isISO8601()
    .withMessage('Invalid publish date format'),
  body('recipients')
    .isArray({ min: 1 })
    .withMessage('At least one recipient is required'),
  body('recipients.*')
    .isIn(['student', 'parent', 'teacher', 'admin', 'accountant', 'librarian', 'receptionist', 'superadmin', 'staff'])
    .withMessage('Invalid recipient type'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Invalid priority'),
  body('status')
    .optional()
    .isIn(['draft', 'published', 'archived'])
    .withMessage('Invalid status'),
  body('academicYear')
    .trim()
    .notEmpty()
    .withMessage('Academic year is required'),
  body('institutionId')
    .isMongoId()
    .withMessage('Invalid institution ID')
];

export const updateNoticeValidator = [
  body('title')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Title cannot be empty')
    .isLength({ min: 3, max: 200 })
    .withMessage('Title must be between 3 and 200 characters'),
  body('description')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Description cannot be empty'),
  body('noticeDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid notice date format'),
  body('publishDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid publish date format'),
  body('recipients')
    .optional()
    .isArray({ min: 1 })
    .withMessage('At least one recipient is required'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Invalid priority'),
  body('status')
    .optional()
    .isIn(['draft', 'published', 'archived'])
    .withMessage('Invalid status')
];

export const noticeIdValidator = [
  param('id')
    .isMongoId()
    .withMessage('Invalid notice ID')
];

export const noticeIdParamValidator = [
  param('noticeId')
    .trim()
    .notEmpty()
    .withMessage('Notice ID is required')
];

export const recipientValidator = [
  param('recipient')
    .isIn(['student', 'parent', 'teacher', 'admin', 'accountant', 'librarian', 'receptionist', 'superadmin', 'staff'])
    .withMessage('Invalid recipient type')
];

export const updateStatusValidator = [
  body('status')
    .isIn(['draft', 'published', 'archived'])
    .withMessage('Status must be draft, published, or archived')
];

export const bulkDeleteValidator = [
  body('noticeIds')
    .isArray({ min: 1 })
    .withMessage('Notice IDs must be a non-empty array'),
  body('noticeIds.*')
    .isMongoId()
    .withMessage('Invalid notice ID in array')
];

export const searchValidator = [
  query('q')
    .trim()
    .notEmpty()
    .withMessage('Search query is required')
    .isLength({ min: 1 })
    .withMessage('Search query must be at least 1 character')
];

export const addAttachmentValidator = [
  body('fileName')
    .trim()
    .notEmpty()
    .withMessage('File name is required'),
  body('fileUrl')
    .trim()
    .notEmpty()
    .withMessage('File URL is required')
    .isURL()
    .withMessage('Invalid file URL'),
  body('fileSize')
    .optional()
    .isInt({ min: 0 })
    .withMessage('File size must be a non-negative integer'),
  body('fileType')
    .optional()
    .trim()
];

export const attachmentIdValidator = [
  param('attachmentId')
    .isMongoId()
    .withMessage('Invalid attachment ID')
];
