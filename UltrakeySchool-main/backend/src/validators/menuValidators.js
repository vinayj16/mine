import { body, param, query } from 'express-validator';

export const roleIdValidator = [
  param('roleId')
    .notEmpty().withMessage('Role ID is required')
    .isIn([
      'super_admin',
      'admin',
      'teacher',
      'student',
      'parent',
      'accountant',
      'hr',
      'librarian',
      'transport_manager',
      'hostel_warden'
    ]).withMessage('Invalid role ID')
];

export const userIdValidator = [
  param('userId')
    .notEmpty().withMessage('User ID is required')
    .isMongoId().withMessage('Invalid user ID')
];

export const schoolIdQueryValidator = [
  query('schoolId')
    .optional()
    .isMongoId().withMessage('Invalid school ID')
];

export const createDefaultMenuValidator = [
  param('roleId')
    .notEmpty().withMessage('Role ID is required')
    .isIn([
      'super_admin',
      'admin',
      'teacher',
      'student',
      'parent',
      'accountant',
      'hr',
      'librarian',
      'transport_manager',
      'hostel_warden'
    ]).withMessage('Invalid role ID'),
  body('schoolId')
    .optional()
    .isMongoId().withMessage('Invalid school ID')
];

export const updateMenuValidator = [
  param('roleId')
    .notEmpty().withMessage('Role ID is required')
    .isIn([
      'super_admin',
      'admin',
      'teacher',
      'student',
      'parent',
      'accountant',
      'hr',
      'librarian',
      'transport_manager',
      'hostel_warden'
    ]).withMessage('Invalid role ID'),
  query('schoolId')
    .optional()
    .isMongoId().withMessage('Invalid school ID'),
  body('menuSections')
    .optional()
    .isArray().withMessage('Menu sections must be an array'),
  body('hiddenMenuItems')
    .optional()
    .isArray().withMessage('Hidden menu items must be an array'),
  body('customMenuItems')
    .optional()
    .isArray().withMessage('Custom menu items must be an array'),
  body('quickActions')
    .optional()
    .isArray().withMessage('Quick actions must be an array')
];

export const addCustomMenuItemValidator = [
  param('roleId')
    .notEmpty().withMessage('Role ID is required')
    .isIn([
      'super_admin',
      'admin',
      'teacher',
      'student',
      'parent',
      'accountant',
      'hr',
      'librarian',
      'transport_manager',
      'hostel_warden'
    ]).withMessage('Invalid role ID'),
  query('schoolId')
    .optional()
    .isMongoId().withMessage('Invalid school ID'),
  body('label')
    .notEmpty().withMessage('Label is required')
    .isString().withMessage('Label must be a string'),
  body('path')
    .notEmpty().withMessage('Path is required')
    .isString().withMessage('Path must be a string'),
  body('icon')
    .notEmpty().withMessage('Icon is required')
    .isString().withMessage('Icon must be a string'),
  body('moduleKey')
    .optional()
    .isString().withMessage('Module key must be a string'),
  body('order')
    .optional()
    .isInt().withMessage('Order must be an integer')
];

export const removeCustomMenuItemValidator = [
  param('roleId')
    .notEmpty().withMessage('Role ID is required')
    .isIn([
      'super_admin',
      'admin',
      'teacher',
      'student',
      'parent',
      'accountant',
      'hr',
      'librarian',
      'transport_manager',
      'hostel_warden'
    ]).withMessage('Invalid role ID'),
  param('menuItemPath')
    .notEmpty().withMessage('Menu item path is required')
    .isString().withMessage('Menu item path must be a string'),
  query('schoolId')
    .optional()
    .isMongoId().withMessage('Invalid school ID')
];

export const hideShowMenuItemValidator = [
  param('roleId')
    .notEmpty().withMessage('Role ID is required')
    .isIn([
      'super_admin',
      'admin',
      'teacher',
      'student',
      'parent',
      'accountant',
      'hr',
      'librarian',
      'transport_manager',
      'hostel_warden'
    ]).withMessage('Invalid role ID'),
  body('schoolId')
    .optional()
    .isMongoId().withMessage('Invalid school ID'),
  body('menuItemPath')
    .notEmpty().withMessage('Menu item path is required')
    .isString().withMessage('Menu item path must be a string')
];

export const reorderMenuValidator = [
  param('roleId')
    .notEmpty().withMessage('Role ID is required')
    .isIn([
      'super_admin',
      'admin',
      'teacher',
      'student',
      'parent',
      'accountant',
      'hr',
      'librarian',
      'transport_manager',
      'hostel_warden'
    ]).withMessage('Invalid role ID'),
  body('schoolId')
    .optional()
    .isMongoId().withMessage('Invalid school ID'),
  body('sectionOrders')
    .notEmpty().withMessage('Section orders are required')
    .isArray().withMessage('Section orders must be an array')
];

export const addQuickActionValidator = [
  param('roleId')
    .notEmpty().withMessage('Role ID is required')
    .isIn([
      'super_admin',
      'admin',
      'teacher',
      'student',
      'parent',
      'accountant',
      'hr',
      'librarian',
      'transport_manager',
      'hostel_warden'
    ]).withMessage('Invalid role ID'),
  query('schoolId')
    .optional()
    .isMongoId().withMessage('Invalid school ID'),
  body('id')
    .notEmpty().withMessage('Action ID is required')
    .isString().withMessage('Action ID must be a string'),
  body('label')
    .notEmpty().withMessage('Label is required')
    .isString().withMessage('Label must be a string'),
  body('icon')
    .notEmpty().withMessage('Icon is required')
    .isString().withMessage('Icon must be a string'),
  body('path')
    .notEmpty().withMessage('Path is required')
    .isString().withMessage('Path must be a string'),
  body('category')
    .optional()
    .isIn(['frequent', 'recent', 'custom']).withMessage('Invalid category')
];

export const removeQuickActionValidator = [
  param('roleId')
    .notEmpty().withMessage('Role ID is required')
    .isIn([
      'super_admin',
      'admin',
      'teacher',
      'student',
      'parent',
      'accountant',
      'hr',
      'librarian',
      'transport_manager',
      'hostel_warden'
    ]).withMessage('Invalid role ID'),
  param('actionId')
    .notEmpty().withMessage('Action ID is required')
    .isString().withMessage('Action ID must be a string'),
  query('schoolId')
    .optional()
    .isMongoId().withMessage('Invalid school ID')
];

export const resetMenuValidator = [
  param('roleId')
    .notEmpty().withMessage('Role ID is required')
    .isIn([
      'super_admin',
      'admin',
      'teacher',
      'student',
      'parent',
      'accountant',
      'hr',
      'librarian',
      'transport_manager',
      'hostel_warden'
    ]).withMessage('Invalid role ID'),
  body('schoolId')
    .optional()
    .isMongoId().withMessage('Invalid school ID')
];
