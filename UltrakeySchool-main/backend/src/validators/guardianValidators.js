import { body, param, query } from 'express-validator';

export const schoolIdValidator = [
  param('schoolId')
    .notEmpty().withMessage('School ID is required')
    .isMongoId().withMessage('Invalid school ID')
];

export const guardianIdValidator = [
  param('guardianId')
    .notEmpty().withMessage('Guardian ID is required')
    .isString().withMessage('Guardian ID must be a string')
];

export const studentIdValidator = [
  param('studentId')
    .notEmpty().withMessage('Student ID is required')
    .isMongoId().withMessage('Invalid student ID')
];

export const createGuardianValidator = [
  param('schoolId')
    .notEmpty().withMessage('School ID is required')
    .isMongoId().withMessage('Invalid school ID'),
  body('firstName')
    .notEmpty().withMessage('First name is required')
    .isString().withMessage('First name must be a string')
    .trim(),
  body('lastName')
    .notEmpty().withMessage('Last name is required')
    .isString().withMessage('Last name must be a string')
    .trim(),
  body('email')
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email format'),
  body('phone')
    .notEmpty().withMessage('Phone is required')
    .isString().withMessage('Phone must be a string'),
  body('children')
    .optional()
    .isArray().withMessage('Children must be an array')
];

export const updateGuardianValidator = [
  param('schoolId')
    .notEmpty().withMessage('School ID is required')
    .isMongoId().withMessage('Invalid school ID'),
  param('guardianId')
    .notEmpty().withMessage('Guardian ID is required')
    .isString().withMessage('Guardian ID must be a string'),
  body('firstName')
    .optional()
    .isString().withMessage('First name must be a string')
    .trim(),
  body('lastName')
    .optional()
    .isString().withMessage('Last name must be a string')
    .trim(),
  body('email')
    .optional()
    .isEmail().withMessage('Invalid email format'),
  body('phone')
    .optional()
    .isString().withMessage('Phone must be a string')
];

export const addChildValidator = [
  param('schoolId')
    .notEmpty().withMessage('School ID is required')
    .isMongoId().withMessage('Invalid school ID'),
  param('guardianId')
    .notEmpty().withMessage('Guardian ID is required')
    .isString().withMessage('Guardian ID must be a string'),
  body('studentId')
    .notEmpty().withMessage('Student ID is required')
    .isMongoId().withMessage('Invalid student ID'),
  body('relationship.type')
    .notEmpty().withMessage('Relationship type is required')
    .isIn(['father', 'mother', 'guardian', 'grandparent', 'sibling', 'other']).withMessage('Invalid relationship type'),
  body('relationship.priority')
    .optional()
    .isInt({ min: 1, max: 3 }).withMessage('Priority must be 1, 2, or 3'),
  body('relationship.isPrimary')
    .optional()
    .isBoolean().withMessage('isPrimary must be a boolean'),
  body('relationship.isEmergency')
    .optional()
    .isBoolean().withMessage('isEmergency must be a boolean')
];

export const updatePermissionsValidator = [
  param('schoolId')
    .notEmpty().withMessage('School ID is required')
    .isMongoId().withMessage('Invalid school ID'),
  param('guardianId')
    .notEmpty().withMessage('Guardian ID is required')
    .isString().withMessage('Guardian ID must be a string'),
  body('canViewGrades')
    .optional()
    .isBoolean().withMessage('canViewGrades must be a boolean'),
  body('canViewAttendance')
    .optional()
    .isBoolean().withMessage('canViewAttendance must be a boolean'),
  body('canViewFees')
    .optional()
    .isBoolean().withMessage('canViewFees must be a boolean'),
  body('canReceiveNotifications')
    .optional()
    .isBoolean().withMessage('canReceiveNotifications must be a boolean'),
  body('canCommunicateWithTeachers')
    .optional()
    .isBoolean().withMessage('canCommunicateWithTeachers must be a boolean'),
  body('canApproveLeaves')
    .optional()
    .isBoolean().withMessage('canApproveLeaves must be a boolean'),
  body('canAccessReports')
    .optional()
    .isBoolean().withMessage('canAccessReports must be a boolean')
];

export const searchValidator = [
  param('schoolId')
    .notEmpty().withMessage('School ID is required')
    .isMongoId().withMessage('Invalid school ID'),
  query('q')
    .notEmpty().withMessage('Search query is required')
    .isString().withMessage('Search query must be a string')
];

export const permissionValidator = [
  param('schoolId')
    .notEmpty().withMessage('School ID is required')
    .isMongoId().withMessage('Invalid school ID'),
  param('permission')
    .notEmpty().withMessage('Permission is required')
    .isIn([
      'canViewGrades',
      'canViewAttendance',
      'canViewFees',
      'canReceiveNotifications',
      'canCommunicateWithTeachers',
      'canApproveLeaves',
      'canAccessReports'
    ]).withMessage('Invalid permission')
];
