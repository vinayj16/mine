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

export const categoryValidator = [
  param('category')
    .notEmpty().withMessage('Category is required')
    .isIn(['admin', 'academic', 'staff', 'student', 'parent']).withMessage('Invalid category')
];

export const planValidator = [
  param('plan')
    .notEmpty().withMessage('Plan is required')
    .isIn(['basic', 'medium', 'premium']).withMessage('Invalid plan')
];

export const moduleKeyValidator = [
  param('moduleKey')
    .notEmpty().withMessage('Module key is required')
    .isString().withMessage('Module key must be a string')
];

export const actionValidator = [
  param('action')
    .notEmpty().withMessage('Action is required')
    .isIn([
      'canCreate',
      'canRead',
      'canUpdate',
      'canDelete',
      'canManageUsers',
      'canManageSettings',
      'canViewReports',
      'canExport',
      'canApprove',
      'canManageFinance'
    ]).withMessage('Invalid action')
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

export const assignRoleValidator = [
  param('userId')
    .notEmpty().withMessage('User ID is required')
    .isMongoId().withMessage('Invalid user ID'),
  body('roleId')
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

export const updatePermissionsValidator = [
  param('userId')
    .notEmpty().withMessage('User ID is required')
    .isMongoId().withMessage('Invalid user ID'),
  body('canCreate')
    .optional()
    .isBoolean().withMessage('canCreate must be a boolean'),
  body('canRead')
    .optional()
    .isBoolean().withMessage('canRead must be a boolean'),
  body('canUpdate')
    .optional()
    .isBoolean().withMessage('canUpdate must be a boolean'),
  body('canDelete')
    .optional()
    .isBoolean().withMessage('canDelete must be a boolean'),
  body('canManageUsers')
    .optional()
    .isBoolean().withMessage('canManageUsers must be a boolean'),
  body('canManageSettings')
    .optional()
    .isBoolean().withMessage('canManageSettings must be a boolean'),
  body('canViewReports')
    .optional()
    .isBoolean().withMessage('canViewReports must be a boolean'),
  body('canExport')
    .optional()
    .isBoolean().withMessage('canExport must be a boolean'),
  body('canApprove')
    .optional()
    .isBoolean().withMessage('canApprove must be a boolean'),
  body('canManageFinance')
    .optional()
    .isBoolean().withMessage('canManageFinance must be a boolean')
];

export const validateAccessValidator = [
  param('userId')
    .notEmpty().withMessage('User ID is required')
    .isMongoId().withMessage('Invalid user ID'),
  body('moduleKey')
    .notEmpty().withMessage('Module key is required')
    .isString().withMessage('Module key must be a string'),
  body('action')
    .optional()
    .isIn([
      'canCreate',
      'canRead',
      'canUpdate',
      'canDelete',
      'canManageUsers',
      'canManageSettings',
      'canViewReports',
      'canExport',
      'canApprove',
      'canManageFinance'
    ]).withMessage('Invalid action')
];
