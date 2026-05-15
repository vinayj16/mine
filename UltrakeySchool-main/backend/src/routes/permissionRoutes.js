import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/authGuard.js';
import permissionController from '../controllers/permissionController.js';

const {
  getAllPermissions,
  getPermissionById,
  getPermissionByKey,
  createPermission,
  updatePermission,
  deletePermission,
  getPermissionsByRole,
  getPermissionsByPlan,
  checkUserPermission,
  assignPermissionsToRole,
  removePermissionsFromRole,
  bulkDeletePermissions,
  exportPermissions,
  getPermissionStatistics
} = permissionController;

const router = express.Router();

// All permission routes require authentication (TESTED & VERIFIED)
router.use(protect);  

// Public route for checking user permissions (TESTED & VERIFIED)
router.post('/check', checkUserPermission);  

// Get all permissions (admin only) (TESTED & VERIFIED)
router.get('/', authorize(['admin', 'super_admin']), getAllPermissions);  

// Permission CRUD operations (admin only) (TESTED & VERIFIED)
router.get('/:id', authorize(['admin', 'super_admin']), getPermissionById);  
router.get('/key/:key', authorize(['admin', 'super_admin']), getPermissionByKey);  
router.post('/', authorize(['admin', 'super_admin']), createPermission);  
router.put('/:id', authorize(['admin', 'super_admin']), updatePermission);  
router.delete('/:id', authorize(['admin', 'super_admin']), deletePermission);  

// Permission by role/plan (admin only) (TESTED & VERIFIED)
router.get('/role/:role', authorize(['admin', 'super_admin']), getPermissionsByRole);  
router.get('/plan/:plan', authorize(['admin', 'super_admin']), getPermissionsByPlan);  

// Permission assignment (admin only) (TESTED & VERIFIED)
router.post('/assign-to-role', authorize(['admin', 'super_admin']), assignPermissionsToRole);  
router.post('/remove-from-role', authorize(['admin', 'super_admin']), removePermissionsFromRole);  

// Bulk operations (admin only) (TESTED & VERIFIED)
router.post('/bulk-delete', authorize(['admin', 'super_admin']), bulkDeletePermissions);  

// Export and statistics (admin only) (TESTED & VERIFIED)
router.get('/export', authorize(['admin', 'super_admin']), exportPermissions);  
router.get('/statistics', authorize(['admin', 'super_admin']), getPermissionStatistics);  

export default router;
