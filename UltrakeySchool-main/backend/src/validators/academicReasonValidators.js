import { body, param, query } from 'express-validator';

// Validation rules for creating a reason
export const createReasonValidator = [
  body('reason')
    .trim()
    .notEmpty()
    .withMessage('Reason is required')
    .isLength({ max: 100 })
    .withMessage('Reason must not exceed 100 characters'),
  
  body('role')
    .notEmpty()
    .withMessage('Role is required')
    .isIn(['teacher', 'student', 'staff', 'parent', 'admin'])
    .withMessage('Invalid role'),
  
  body('category')
    .notEmpty()
    .withMessage('Category is required')
    .isIn(['academic', 'personal', 'medical', 'administrative', 'disciplinary', 'other'])
    .withMessage('Invalid category'),
  
  body('severity')
    .notEmpty()
    .withMessage('Severity is required')
    .isIn(['low', 'medium', 'high', 'critical'])
    .withMessage('Invalid severity'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters'),
  
  body('requiresApproval')
    .optional()
    .isBoolean()
    .withMessage('Requires approval must be a boolean'),
  
  body('status')
    .optional()
    .isIn(['active', 'inactive', 'deprecated'])
    .withMessage('Invalid status'),
  
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array')
];

// Validation rules for updating a reason
export const updateReasonValidator = [
  param('reasonId')
    .notEmpty()
    .withMessage('Reason ID is required')
    .isMongoId()
    .withMessage('Invalid reason ID'),
  
  body('reason')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Reason must not exceed 100 characters'),
  
  body('role')
    .optional()
    .isIn(['teacher', 'student', 'staff', 'parent', 'admin'])
    .withMessage('Invalid role'),
  
  body('category')
    .optional()
    .isIn(['academic', 'personal', 'medical', 'administrative', 'disciplinary', 'other'])
    .withMessage('Invalid category'),
  
  body('severity')
    .optional()
    .isIn(['low', 'medium', 'high', 'critical'])
    .withMessage('Invalid severity'),
  
  body('status')
    .optional()
    .isIn(['active', 'inactive', 'deprecated'])
    .withMessage('Invalid status')
];

// Validation rules for getting reason by ID
export const reasonIdValidator = [
  param('reasonId')
    .notEmpty()
    .withMessage('Reason ID is required')
    .isMongoId()
    .withMessage('Invalid reason ID')
];

// Validation rules for getting reasons with filters
export const getReasonsValidator = [
  param('schoolId')
    .notEmpty()
    .withMessage('School ID is required')
    .isMongoId()
    .withMessage('Invalid school ID'),
  
  query('role')
    .optional()
    .isIn(['teacher', 'student', 'staff', 'parent', 'admin'])
    .withMessage('Invalid role'),
  
  query('category')
    .optional()
    .isIn(['academic', 'personal', 'medical', 'administrative', 'disciplinary', 'other'])
    .withMessage('Invalid category'),
  
  query('severity')
    .optional()
    .isIn(['low', 'medium', 'high', 'critical'])
    .withMessage('Invalid severity'),
  
  query('status')
    .optional()
    .isIn(['active', 'inactive', 'deprecated'])
    .withMessage('Invalid status'),
  
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  query('sortBy')
    .optional()
    .isIn(['reason', 'createdAt', 'usageCount', 'category'])
    .withMessage('Invalid sort field'),
  
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc')
];

// Validation rules for search
export const searchReasonsValidator = [
  query('q')
    .notEmpty()
    .withMessage('Search query is required')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search query must be between 1 and 100 characters'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
];

// Validation rules for role filter
export const roleValidator = [
  param('role')
    .notEmpty()
    .withMessage('Role is required')
    .isIn(['teacher', 'student', 'staff', 'parent', 'admin'])
    .withMessage('Invalid role')
];

// Validation rules for category filter
export const categoryValidator = [
  param('category')
    .notEmpty()
    .withMessage('Category is required')
    .isIn(['academic', 'personal', 'medical', 'administrative', 'disciplinary', 'other'])
    .withMessage('Invalid category')
];
