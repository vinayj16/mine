import { body } from 'express-validator';

export const updateUserProfileValidation = [
  body('name')
    .optional()
    .isString()
    .withMessage('Name must be a string')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  
  body('email')
    .optional()
    .isEmail()
    .withMessage('Invalid email format')
    .normalizeEmail(),
  
  body('phone')
    .optional()
    .isString()
    .withMessage('Phone must be a string')
    .trim(),
  
  body('avatar')
    .optional()
    .isString()
    .withMessage('Avatar must be a string')
    .trim(),
  
  body('profileImage')
    .optional()
    .isString()
    .withMessage('Profile image must be a string')
    .trim(),
  
  body('department')
    .optional()
    .isString()
    .withMessage('Department must be a string')
    .trim(),
  
  body('gender')
    .optional()
    .isString()
    .withMessage('Gender must be a string')
    .trim(),
  
  body('dateOfBirth')
    .optional()
    .isString()
    .withMessage('Date of birth must be a string')
    .trim(),
  
  body('address.street')
    .optional()
    .isString()
    .withMessage('Street must be a string')
    .trim(),
  
  body('address.city')
    .optional()
    .isString()
    .withMessage('City must be a string')
    .trim(),
  
  body('address.state')
    .optional()
    .isString()
    .withMessage('State must be a string')
    .trim(),
  
  body('address.zipCode')
    .optional()
    .isString()
    .withMessage('Zip code must be a string')
    .trim(),
  
  body('address.country')
    .optional()
    .isString()
    .withMessage('Country must be a string')
    .trim(),
  
  body('preferences')
    .optional()
    .isObject()
    .withMessage('Preferences must be an object')
];
