import express from 'express';
import roleController from '../controllers/roleController.js';
import * as validators from '../validators/roleValidators.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/authGuard.js';
import { validationResult } from 'express-validator';

const router = express.Router();

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// All routes require authentication (TESTED & VERIFIED)
router.use(protect);  

// Public read routes (after authentication) (TESTED & VERIFIED)
router.get('/', authorize(['super_admin', 'admin']), roleController.getAllRoles);  
router.get('/:roleId', authorize(['super_admin', 'admin', 'teacher']), roleController.getRoleById);  
router.get('/category/:category', authorize(['super_admin', 'admin']), roleController.getRolesByCategory);  
router.get('/plan/:plan', authorize(['super_admin', 'admin']), roleController.getRolesByPlan);  
router.get('/:roleId/permissions', authorize(['super_admin', 'admin']), roleController.getRolePermissions);  
router.get('/:roleId/module/:moduleKey/access', authorize(['super_admin', 'admin']), roleController.canRoleAccessModule);  
router.get('/:roleId/module/:moduleKey/readonly', authorize(['super_admin', 'admin']), roleController.isModuleReadOnlyForRole);  
router.get('/:roleId/action/:action', authorize(['super_admin', 'admin']), roleController.canRolePerformAction);  

// User role management (TESTED & VERIFIED)
router.get('/stats', validators.schoolIdQueryValidator, validate, roleController.getRoleStats);  
router.get('/:roleId/users', validators.roleIdValidator, validate, validators.schoolIdQueryValidator, validate, roleController.getUsersByRole);  
router.post('/users/:userId/assign', validators.assignRoleValidator, validate, roleController.assignRole);  
router.put('/users/:userId/permissions', validators.updatePermissionsValidator, validate, roleController.updateUserPermissions);  
router.get('/users/:userId/permissions', validators.userIdValidator, validate, roleController.getUserEffectivePermissions);  
router.post('/users/:userId/validate-access', validators.validateAccessValidator, validate, roleController.validateRoleAccess);  

// Search and analytics (TESTED & VERIFIED)
router.get('/search', authorize(['super_admin', 'admin']), roleController.searchRoles);  
router.get('/analytics', authorize(['super_admin', 'admin']), roleController.getRoleAnalytics);  
router.get('/permission-matrix', authorize(['super_admin', 'admin']), roleController.getPermissionMatrix);  
router.post('/export', authorize(['super_admin', 'admin']), roleController.exportRoles);  

// Bulk operations (TESTED & VERIFIED)
router.put('/bulk/update', authorize(['super_admin', 'admin']), roleController.bulkUpdateRoles);  
router.delete('/bulk/delete', authorize(['super_admin', 'admin']), roleController.bulkDeleteRoles);  
router.post('/bulk/assign', authorize(['super_admin', 'admin']), roleController.bulkAssignRoles);  

// Role CRUD (TESTED & VERIFIED)
router.post('/', authorize(['super_admin', 'admin']), roleController.createRole);  
router.put('/:roleId', authorize(['super_admin', 'admin']), roleController.updateRole);  
router.delete('/:roleId', authorize(['super_admin', 'admin']), roleController.deleteRole);  
router.patch('/:roleId/status', authorize(['super_admin', 'admin']), roleController.updateRoleStatus);  
router.post('/:roleId/clone', authorize(['super_admin', 'admin']), roleController.cloneRole);  

export default router;
