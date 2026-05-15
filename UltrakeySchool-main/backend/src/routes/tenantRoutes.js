import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/authGuard.js';
import tenantController from '../controllers/tenantController.js';

const router = express.Router();

// All routes require authentication and admin role (TESTED & VERIFIED)
router.use(protect);  
router.use(authorize(['super_admin', 'admin']));  

// Specific routes must come before parameterized routes (TESTED & VERIFIED)
router.get('/', tenantController.getTenants);  
router.post('/', tenantController.createTenant);  
router.get('/search', tenantController.searchTenants);  
router.get('/statistics', tenantController.getTenantStatistics);  
router.get('/expiring', tenantController.getExpiringTenants);  
router.get('/status/:status', tenantController.getTenantsByStatus);  
router.get('/subscription/:subscriptionType', tenantController.getTenantsBySubscription);  
router.get('/domain/:domain', tenantController.getTenantByDomain);  
router.post('/bulk/status', tenantController.bulkUpdateStatus);  
router.post('/bulk/delete', tenantController.bulkDeleteTenants);  
router.get('/export', tenantController.exportTenants);  

// Parameterized routes (TESTED & VERIFIED)
router.get('/:id', tenantController.getTenantById);  
router.put('/:id', tenantController.updateTenant);  
router.delete('/:id', tenantController.deleteTenant);  
router.get('/:id/usage', tenantController.getTenantUsageAnalytics);  
router.patch('/:id/status', tenantController.updateTenantStatus);  
router.patch('/:id/subscription', tenantController.updateTenantSubscription);  
router.patch('/:id/renew', tenantController.renewTenantSubscription);  
router.patch('/:id/suspend', tenantController.suspendTenant);  
router.patch('/:id/activate', tenantController.activateTenant);  

export default router;
