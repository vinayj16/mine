import { body, param, query } from 'express-validator';

// Validation rules for creating an institution
export const createInstitutionValidator = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Institution name is required')
    .isLength({ max: 200 })
    .withMessage('Name must not exceed 200 characters'),
  
  body('type')
    .notEmpty()
    .withMessage('Institution type is required')
    .isIn(['School', 'Inter College', 'Degree College', 'Engineering College'])
    .withMessage('Type must be School, Inter College, Degree College, or Engineering College'),
  
  // Most fields are optional to allow flexible institution creation
  body('shortName').optional(),
  body('category').optional(),
  body('established').optional(),
  body('contact').optional(),
  body('principalName').optional(),
  body('principalEmail').optional().isEmail().withMessage('Invalid email format'),
  body('principalPhone').optional(),
  body('adminContact').optional(),
  body('subscription').optional(),
  body('features').optional(),
  body('academic').optional(),
  body('board').optional(),
  body('classes').optional(),
  body('streams').optional(),
  body('yearStructure').optional(),
  body('semesters').optional(),
  body('departments').optional(),
  body('universityAffiliation').optional(),
  
  body('adminContact.name')
    .notEmpty()
    .withMessage('Admin contact name is required'),
  
  body('adminContact.email')
    .notEmpty()
    .withMessage('Admin contact email is required')
    .isEmail()
    .withMessage('Invalid admin email format'),
  
  body('adminContact.phone')
    .notEmpty()
    .withMessage('Admin contact phone is required'),
  
  body('subscription.planId')
    .notEmpty()
    .withMessage('Subscription plan ID is required')
    .isIn(['basic', 'medium', 'premium'])
    .withMessage('Invalid plan ID'),
  
  body('subscription.planName')
    .notEmpty()
    .withMessage('Subscription plan name is required'),
  
  body('subscription.startDate')
    .notEmpty()
    .withMessage('Subscription start date is required')
    .isISO8601()
    .withMessage('Invalid start date format'),
  
  body('subscription.endDate')
    .notEmpty()
    .withMessage('Subscription end date is required')
    .isISO8601()
    .withMessage('Invalid end date format'),
  
  body('subscription.monthlyCost')
    .notEmpty()
    .withMessage('Monthly cost is required')
    .isFloat({ min: 0 })
    .withMessage('Monthly cost must be a positive number'),
  
  body('features.maxUsers')
    .notEmpty()
    .withMessage('Maximum users is required')
    .isInt({ min: 1 })
    .withMessage('Max users must be at least 1'),
  
  body('features.maxStudents')
    .notEmpty()
    .withMessage('Maximum students is required')
    .isInt({ min: 1 })
    .withMessage('Max students must be at least 1'),
  
  body('features.maxTeachers')
    .notEmpty()
    .withMessage('Maximum teachers is required')
    .isInt({ min: 1 })
    .withMessage('Max teachers must be at least 1'),
  
  body('features.storageLimit')
    .notEmpty()
    .withMessage('Storage limit is required')
    .isInt({ min: 1 })
    .withMessage('Storage limit must be at least 1 GB'),
  
  body('academicYear')
    .notEmpty()
    .withMessage('Academic year is required')
    .matches(/^\d{4}-\d{4}$/)
    .withMessage('Academic year must be in format YYYY-YYYY'),
  
  body('workingHours.start')
    .notEmpty()
    .withMessage('Working hours start time is required'),
  
  body('workingHours.end')
    .notEmpty()
    .withMessage('Working hours end time is required')
];

// Validation rules for updating an institution
export const updateInstitutionValidator = [
  param('id')
    .notEmpty()
    .withMessage('Institution ID is required')
    .isMongoId()
    .withMessage('Invalid institution ID'),
  
  body('name')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Name must not exceed 200 characters'),
  
  body('type')
    .optional()
    .isIn(['School', 'Inter College', 'Degree College'])
    .withMessage('Type must be School, Inter College, or Degree College'),
  
  body('category')
    .optional()
    .isIn(['primary', 'secondary', 'higher-secondary', 'undergraduate', 'postgraduate'])
    .withMessage('Invalid category'),
  
  body('established')
    .optional()
    .isInt({ min: 1800, max: new Date().getFullYear() })
    .withMessage('Invalid established year'),
  
  body('contact.email')
    .optional()
    .isEmail()
    .withMessage('Invalid email format'),
  
  body('subscription.status')
    .optional()
    .isIn(['active', 'expired', 'cancelled', 'suspended', 'trial'])
    .withMessage('Invalid subscription status'),
  
  body('subscription.monthlyCost')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Monthly cost must be a positive number'),
  
  body('status')
    .optional()
    .isIn(['active', 'inactive', 'suspended', 'trial', 'expired'])
    .withMessage('Invalid status')
];

// Validation rules for getting institution by ID
export const institutionIdValidator = [
  param('id')
    .notEmpty()
    .withMessage('Institution ID is required')
    .isMongoId()
    .withMessage('Invalid institution ID')
];

// Validation rules for search query
export const searchInstitutionsValidator = [
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

// Validation rules for getting institutions by filters
export const getInstitutionsValidator = [
  query('type')
    .optional()
    .isIn(['School', 'Inter College', 'Degree College', 'Engineering College'])
    .withMessage('Invalid type'),
  
  query('category')
    .optional()
    .isIn(['primary', 'secondary', 'higher-secondary', 'undergraduate', 'postgraduate'])
    .withMessage('Invalid category'),
  
  query('status')
    .optional()
    .isIn(['active', 'inactive', 'suspended', 'trial', 'expired'])
    .withMessage('Invalid status'),
  
  query('subscriptionStatus')
    .optional()
    .isIn(['active', 'expired', 'cancelled', 'suspended', 'trial'])
    .withMessage('Invalid subscription status'),
  
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
    .isIn(['name', 'createdAt', 'updatedAt', 'status'])
    .withMessage('Invalid sort field'),
  
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc')
];

// Validation rules for expiring subscriptions
export const expiringSubscriptionsValidator = [
  query('days')
    .optional()
    .isInt({ min: 1, max: 365 })
    .withMessage('Days must be between 1 and 365')
];

// Validation rules for migration from school
export const migrateFromSchoolValidator = [
  param('schoolId')
    .notEmpty()
    .withMessage('School ID is required')
    .isMongoId()
    .withMessage('Invalid school ID')
];
