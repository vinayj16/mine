import { body, param, query } from 'express-validator';

export const createGradeValidator = [
  body('grade')
    .trim()
    .notEmpty()
    .withMessage('Grade is required')
    .isLength({ min: 1, max: 5 })
    .withMessage('Grade must be between 1 and 5 characters'),
  body('marksFrom')
    .isInt({ min: 0, max: 100 })
    .withMessage('Marks From must be between 0 and 100'),
  body('marksTo')
    .isInt({ min: 0, max: 100 })
    .withMessage('Marks To must be between 0 and 100'),
  body('points')
    .isInt({ min: 0, max: 10 })
    .withMessage('Points must be between 0 and 10'),
  body('status')
    .optional()
    .isIn(['active', 'inactive'])
    .withMessage('Status must be either active or inactive'),
  body('academicYear')
    .trim()
    .notEmpty()
    .withMessage('Academic year is required'),
  body('institutionId')
    .isMongoId()
    .withMessage('Invalid institution ID'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters')
];

export const updateGradeValidator = [
  body('grade')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Grade cannot be empty')
    .isLength({ min: 1, max: 5 })
    .withMessage('Grade must be between 1 and 5 characters'),
  body('marksFrom')
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage('Marks From must be between 0 and 100'),
  body('marksTo')
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage('Marks To must be between 0 and 100'),
  body('points')
    .optional()
    .isInt({ min: 0, max: 10 })
    .withMessage('Points must be between 0 and 10'),
  body('status')
    .optional()
    .isIn(['active', 'inactive'])
    .withMessage('Status must be either active or inactive'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters')
];

export const gradeIdValidator = [
  param('id')
    .isMongoId()
    .withMessage('Invalid grade ID')
];

export const gradeIdParamValidator = [
  param('gradeId')
    .trim()
    .notEmpty()
    .withMessage('Grade ID is required')
];

export const statusValidator = [
  param('status')
    .isIn(['active', 'inactive'])
    .withMessage('Status must be either active or inactive')
];

export const updateStatusValidator = [
  body('status')
    .isIn(['active', 'inactive'])
    .withMessage('Status must be either active or inactive')
];

export const bulkUpdateStatusValidator = [
  body('gradeIds')
    .isArray({ min: 1 })
    .withMessage('Grade IDs must be a non-empty array'),
  body('gradeIds.*')
    .isMongoId()
    .withMessage('Invalid grade ID in array'),
  body('status')
    .isIn(['active', 'inactive'])
    .withMessage('Status must be either active or inactive')
];

export const updateDisplayOrderValidator = [
  body('displayOrder')
    .isInt({ min: 0 })
    .withMessage('Display order must be a non-negative integer')
];

export const searchValidator = [
  query('q')
    .trim()
    .notEmpty()
    .withMessage('Search query is required')
    .isLength({ min: 1 })
    .withMessage('Search query must be at least 1 character')
];

export const getGradeByMarksValidator = [
  query('marks')
    .notEmpty()
    .withMessage('Marks is required')
    .isFloat({ min: 0, max: 100 })
    .withMessage('Marks must be between 0 and 100'),
  query('institutionId')
    .notEmpty()
    .withMessage('Institution ID is required')
    .isMongoId()
    .withMessage('Invalid institution ID'),
  query('academicYear')
    .notEmpty()
    .withMessage('Academic year is required')
];

export const institutionIdValidator = [
  param('institutionId')
    .isMongoId()
    .withMessage('Invalid institution ID')
];
