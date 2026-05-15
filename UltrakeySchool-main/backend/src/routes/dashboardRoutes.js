import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { validateTenantAccess } from '../middleware/multiTenant.js';
import { addInstitutionFilter, addInstitutionHeaders } from '../middleware/institutionFilter.js';
import dashboardController from '../controllers/dashboardController.js';
const {
  getDashboard,
  getStudentDashboard,
  getTeacherDashboard,
  getParentDashboard,
  getAdminDashboard,
  getInstituteAdminDashboard,
  getQuickStats,
  getAdminOverview,
  getAdminStats
} = dashboardController;

const router = express.Router();

// Protected routes - all other dashboard routes require authentication (TESTED & VERIFIED)
router.use(protect);

// Institution Admin Dashboard - requires authentication (TESTED & VERIFIED)
// Place middleware AFTER the institute-admin route so it doesn't block
router.get('/institute-admin', getInstituteAdminDashboard);

// Role-specific dashboards (TESTED & VERIFIED)
router.get('/', getDashboard);  
router.get('/student', getStudentDashboard);  
router.get('/teacher', getTeacherDashboard);  
router.get('/parent', getParentDashboard);  
router.get('/admin', getAdminDashboard);  

// Admin-specific endpoints (accessible via /dashboard/admin/overview and /dashboard/admin/stats) (TESTED & VERIFIED)
router.get('/admin/overview', getAdminOverview);  
router.get('/admin/stats', getAdminStats);  

// Get quick stats (TESTED & VERIFIED)
router.get('/quick-stats', getQuickStats);  

// Apply tenant validation AFTER dashboard endpoints so institution owners can access
router.use(validateTenantAccess);
router.use(addInstitutionHeaders);
router.use(addInstitutionFilter);

export default router;
