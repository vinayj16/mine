import { body } from 'express-validator';

// Validation for creating an agent
const validateAgentCreate = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Agent name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters')
    .matches(/^[a-zA-Z\s\-']+$/)
    .withMessage('Name can only contain letters, spaces, hyphens, and apostrophes'),

  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please enter a valid email address')
    .normalizeEmail(),

  body('phone')
    .trim()
    .notEmpty()
    .withMessage('Phone number is required')
    .matches(/^[+\d][\d\s\-()]{7,14}$/)
    .withMessage('Please enter a valid phone number'),

  body('address')
    .trim()
    .notEmpty()
    .withMessage('Address is required')
    .isLength({ min: 5, max: 500 })
    .withMessage('Address must be between 5 and 500 characters'),

  body('city')
    .trim()
    .notEmpty()
    .withMessage('City is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('City must be between 2 and 100 characters')
    .matches(/^[a-zA-Z\s\-']+$/)
    .withMessage('City can only contain letters, spaces, hyphens, and apostrophes'),

  body('state')
    .trim()
    .notEmpty()
    .withMessage('State is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('State must be between 2 and 100 characters')
    .matches(/^[a-zA-Z\s\-']+$/)
    .withMessage('State can only contain letters, spaces, hyphens, and apostrophes'),

  body('country')
    .trim()
    .notEmpty()
    .withMessage('Country is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Country must be between 2 and 100 characters')
    .matches(/^[a-zA-Z\s\-']+$/)
    .withMessage('Country can only contain letters, spaces, hyphens, and apostrophes'),

  body('postalCode')
    .trim()
    .notEmpty()
    .withMessage('Postal code is required')
    .matches(/^\d{5,10}$/)
    .withMessage('Postal code must be 5-10 digits'),

  body('commissionRate')
    .notEmpty()
    .withMessage('Commission rate is required')
    .isFloat({ min: 0, max: 50 })
    .withMessage('Commission rate must be between 0 and 50'),

  body('status')
    .optional()
    .isIn(['Active', 'Suspended', 'Inactive'])
    .withMessage('Status must be either Active, Suspended, or Inactive'),

  body('notes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Notes cannot exceed 1000 characters')
];

// Validation for updating an agent (all fields optional)
const validateAgentUpdate = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters')
    .matches(/^[a-zA-Z\s\-']+$/)
    .withMessage('Name can only contain letters, spaces, hyphens, and apostrophes'),

  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Please enter a valid email address')
    .normalizeEmail(),

  body('phone')
    .optional()
    .trim()
    .matches(/^[+\d][\d\s\-()]{7,14}$/)
    .withMessage('Please enter a valid phone number'),

  body('address')
    .optional()
    .trim()
    .isLength({ min: 5, max: 500 })
    .withMessage('Address must be between 5 and 500 characters'),

  body('city')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('City must be between 2 and 100 characters')
    .matches(/^[a-zA-Z\s\-']+$/)
    .withMessage('City can only contain letters, spaces, hyphens, and apostrophes'),

  body('state')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('State must be between 2 and 100 characters')
    .matches(/^[a-zA-Z\s\-']+$/)
    .withMessage('State can only contain letters, spaces, hyphens, and apostrophes'),

  body('country')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Country must be between 2 and 100 characters')
    .matches(/^[a-zA-Z\s\-']+$/)
    .withMessage('Country can only contain letters, spaces, hyphens, and apostrophes'),

  body('postalCode')
    .optional()
    .trim()
    .matches(/^\d{5,10}$/)
    .withMessage('Postal code must be 5-10 digits'),

  body('commissionRate')
    .optional()
    .isFloat({ min: 0, max: 50 })
    .withMessage('Commission rate must be between 0 and 50'),

  body('status')
    .optional()
    .isIn(['Active', 'Suspended', 'Inactive'])
    .withMessage('Status must be either Active, Suspended, or Inactive'),

  body('notes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Notes cannot exceed 1000 characters')
];

export { validateAgentCreate, validateAgentUpdate };
