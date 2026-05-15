import { body, param, query } from 'express-validator';

export const createTicketValidator = [
  body('subject')
    .trim()
    .notEmpty()
    .withMessage('Subject is required')
    .isLength({ min: 5, max: 200 })
    .withMessage('Subject must be between 5 and 200 characters'),
  
  body('description')
    .trim()
    .notEmpty()
    .withMessage('Description is required')
    .isLength({ min: 10 })
    .withMessage('Description must be at least 10 characters'),
  
  body('requester.name')
    .trim()
    .notEmpty()
    .withMessage('Requester name is required'),
  
  body('requester.email')
    .trim()
    .notEmpty()
    .withMessage('Requester email is required')
    .isEmail()
    .withMessage('Invalid email format'),
  
  body('requester.phone')
    .optional()
    .trim(),
  
  body('requester.role')
    .optional()
    .isIn(['student', 'teacher', 'parent', 'admin', 'staff', 'guest'])
    .withMessage('Invalid requester role'),
  
  body('category.primary')
    .notEmpty()
    .withMessage('Primary category is required')
    .isIn(['technical', 'billing', 'account', 'feature', 'bug', 'general'])
    .withMessage('Invalid primary category'),
  
  body('category.secondary')
    .optional()
    .trim(),
  
  body('category.tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  
  body('priority.level')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent', 'critical'])
    .withMessage('Invalid priority level'),
  
  body('source')
    .optional()
    .isIn(['email', 'portal', 'phone', 'chat', 'api'])
    .withMessage('Invalid source')
];

export const updateTicketValidator = [
  body('subject')
    .optional()
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Subject must be between 5 and 200 characters'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ min: 10 })
    .withMessage('Description must be at least 10 characters'),
  
  body('status')
    .optional()
    .isIn(['open', 'in-progress', 'pending', 'resolved', 'closed', 'reopened'])
    .withMessage('Invalid status'),
  
  body('priority.level')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent', 'critical'])
    .withMessage('Invalid priority level')
];

export const updateStatusValidator = [
  body('status')
    .notEmpty()
    .withMessage('Status is required')
    .isIn(['open', 'in-progress', 'pending', 'resolved', 'closed', 'reopened'])
    .withMessage('Invalid status')
];

export const addMessageValidator = [
  body('sender.name')
    .trim()
    .notEmpty()
    .withMessage('Sender name is required'),
  
  body('sender.email')
    .trim()
    .notEmpty()
    .withMessage('Sender email is required')
    .isEmail()
    .withMessage('Invalid email format'),
  
  body('sender.role')
    .notEmpty()
    .withMessage('Sender role is required'),
  
  body('content')
    .trim()
    .notEmpty()
    .withMessage('Message content is required')
    .isLength({ min: 1, max: 5000 })
    .withMessage('Message content must be between 1 and 5000 characters'),
  
  body('type')
    .optional()
    .isIn(['message', 'note', 'system'])
    .withMessage('Invalid message type'),
  
  body('visibility')
    .optional()
    .isIn(['public', 'internal'])
    .withMessage('Invalid visibility'),
  
  body('attachments')
    .optional()
    .isArray()
    .withMessage('Attachments must be an array')
];

export const assignTicketValidator = [
  body('userId')
    .notEmpty()
    .withMessage('User ID is required')
    .isMongoId()
    .withMessage('Invalid user ID'),
  
  body('team')
    .optional()
    .trim(),
  
  body('department')
    .optional()
    .trim()
];

export const reassignTicketValidator = [
  body('userId')
    .notEmpty()
    .withMessage('User ID is required')
    .isMongoId()
    .withMessage('Invalid user ID'),
  
  body('reason')
    .optional()
    .trim()
];

export const escalateTicketValidator = [
  body('level')
    .notEmpty()
    .withMessage('Escalation level is required')
    .isInt({ min: 1, max: 5 })
    .withMessage('Escalation level must be between 1 and 5'),
  
  body('reason')
    .trim()
    .notEmpty()
    .withMessage('Escalation reason is required'),
  
  body('escalatedBy')
    .trim()
    .notEmpty()
    .withMessage('Escalated by is required'),
  
  body('escalatedTo')
    .trim()
    .notEmpty()
    .withMessage('Escalated to is required')
];

export const resolveTicketValidator = [
  body('summary')
    .trim()
    .notEmpty()
    .withMessage('Resolution summary is required')
    .isLength({ min: 10, max: 1000 })
    .withMessage('Resolution summary must be between 10 and 1000 characters'),
  
  body('steps')
    .optional()
    .isArray()
    .withMessage('Steps must be an array')
];

export const reopenTicketValidator = [
  body('reason')
    .trim()
    .notEmpty()
    .withMessage('Reason for reopening is required')
    .isLength({ min: 10, max: 500 })
    .withMessage('Reason must be between 10 and 500 characters')
];

export const addAttachmentValidator = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Attachment name is required'),
  
  body('url')
    .trim()
    .notEmpty()
    .withMessage('Attachment URL is required')
    .isURL()
    .withMessage('Invalid URL format'),
  
  body('size')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Size must be a positive integer'),
  
  body('type')
    .optional()
    .trim(),
  
  body('uploadedBy')
    .trim()
    .notEmpty()
    .withMessage('Uploaded by is required')
];

export const linkRelatedTicketsValidator = [
  body('relatedTicketIds')
    .isArray({ min: 1 })
    .withMessage('Related ticket IDs must be a non-empty array'),
  
  body('relatedTicketIds.*')
    .isMongoId()
    .withMessage('Invalid ticket ID')
];

export const submitSatisfactionSurveyValidator = [
  body('rating')
    .notEmpty()
    .withMessage('Rating is required')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
  
  body('feedback')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Feedback must not exceed 1000 characters')
];

export const ticketIdValidator = [
  param('id')
    .isMongoId()
    .withMessage('Invalid ticket ID')
];

export const ticketNumberValidator = [
  param('ticketNumber')
    .trim()
    .notEmpty()
    .withMessage('Ticket number is required')
];

export const statusValidator = [
  param('status')
    .isIn(['open', 'in-progress', 'pending', 'resolved', 'closed', 'reopened'])
    .withMessage('Invalid status')
];

export const priorityValidator = [
  param('priority')
    .isIn(['low', 'medium', 'high', 'urgent', 'critical'])
    .withMessage('Invalid priority')
];

export const categoryValidator = [
  param('category')
    .isIn(['technical', 'billing', 'account', 'feature', 'bug', 'general'])
    .withMessage('Invalid category')
];

export const emailValidator = [
  param('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Invalid email format')
];

export const userIdValidator = [
  param('userId')
    .isMongoId()
    .withMessage('Invalid user ID')
];

export const searchValidator = [
  query('q')
    .trim()
    .notEmpty()
    .withMessage('Search query is required')
    .isLength({ min: 2 })
    .withMessage('Search query must be at least 2 characters')
];

export const paginationValidator = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
];

export const dateRangeValidator = [
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid start date format'),
  
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid end date format')
];
