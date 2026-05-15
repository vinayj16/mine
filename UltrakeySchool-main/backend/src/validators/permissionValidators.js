import { body, param, validationResult } from 'express-validator';

export const createPermissionValidator = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('key').trim().notEmpty().withMessage('Key is required'),
  body('category').isIn(['dashboard', 'students', 'teachers', 'staff', 'classes', 'attendance', 'fees', 'exams', 'library', 'hostel', 'transport', 'reports', 'settings', 'system']).withMessage('Invalid category'),
  body('module').trim().notEmpty().withMessage('Module is required'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    next();
  }
];

export const updatePermissionValidator = [
  param('id').isMongoId().withMessage('Invalid permission ID'),
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
  body('key').optional().trim().notEmpty().withMessage('Key cannot be empty'),
  body('category').optional().isIn(['dashboard', 'students', 'teachers', 'staff', 'classes', 'attendance', 'fees', 'exams', 'library', 'hostel', 'transport', 'reports', 'settings', 'system']).withMessage('Invalid category'),
  body('module').optional().trim().notEmpty().withMessage('Module cannot be empty'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    next();
  }
];

export const idValidator = [
  param('id').isMongoId().withMessage('Invalid ID'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    next();
  }
];

export const assignPermissionsValidator = [
  param('userId').isMongoId().withMessage('Invalid user ID'),
  body('permissions').isArray().withMessage('Permissions must be an array'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    next();
  }
];

export const assignModulesValidator = [
  param('userId').isMongoId().withMessage('Invalid user ID'),
  body('modules').isArray().withMessage('Modules must be an array'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    next();
  }
];

export const updateRoleValidator = [
  param('userId').isMongoId().withMessage('Invalid user ID'),
  body('role').isIn(['superadmin', 'admin',   'teacher', 'staff', 'parent', 'guardian', 'student']).withMessage('Invalid role'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    next();
  }
];

export const updatePlanValidator = [
  param('userId').isMongoId().withMessage('Invalid user ID'),
  body('plan').isIn(['basic', 'medium', 'premium']).withMessage('Invalid plan'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    next();
  }
];
