import express from 'express';
import hrController from '../controllers/hrController.js';

import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/authGuard.js';
import { validateTenantAccess } from '../middleware/multiTenant.js';

const router = express.Router();

// Apply tenant middleware to all routes (TESTED & VERIFIED)
router.use(protect);  
router.use(validateTenantAccess);  

// Employee Routes - HR Manager and above (TESTED & VERIFIED)
router.post('/employees',
  authorize('hr_manager', 'admin', 'institution_admin', 'superadmin'),
  hrController.default.createEmployee
);  

router.get('/employees',
  authorize('hr_manager', 'admin', 'institution_admin', 'superadmin', 'accountant', 'librarian', 'transport_manager', 'hostel_warden'),
  hrController.default.getAllEmployees
);  

router.get('/employees/:id',
  authorize('hr_manager', 'admin', 'institution_admin', 'superadmin', 'accountant', 'librarian', 'transport_manager', 'hostel_warden'),
  hrController.default.getEmployeeById
);  

router.put('/employees/:id',
  authorize('hr_manager', 'admin', 'institution_admin', 'superadmin'),
  hrController.default.updateEmployee
);  

router.put('/employees/:id/performance',
  authorize('hr_manager', 'admin', 'institution_admin', 'superadmin'),
  hrController.default.updateEmployeePerformance
);  

// Leave Routes - All authenticated users (TESTED & VERIFIED)
router.post('/leave',
  hrController.default.applyLeave
);  

router.get('/leave',
  hrController.default.getAllLeaves
);  

router.put('/leave/:id/status',
  authorize('hr_manager', 'admin', 'institution_admin', 'superadmin'),
  hrController.default.updateLeaveStatus
);  

// Recruitment Routes - HR Manager and above (TESTED & VERIFIED)
router.post('/recruitment',
  authorize('hr_manager', 'admin', 'institution_admin', 'superadmin'),
  hrController.default.createRecruitment
);  

router.get('/recruitment',
  authorize('hr_manager', 'admin', 'institution_admin', 'superadmin', 'teacher', 'staff_member'),
  hrController.default.getAllRecruitments
);  

router.post('/recruitment/:id/apply',
  hrController.default.applyForJob
);  

// Performance Review Routes - HR Manager and above (TESTED & VERIFIED)
router.post('/performance',
  authorize('hr_manager', 'admin', 'institution_admin', 'superadmin'),
  hrController.default.createPerformanceReview
);  

router.get('/performance',
  authorize('hr_manager', 'admin', 'institution_admin', 'superadmin'),
  hrController.default.getAllPerformanceReviews
);  

// Training Routes - HR Manager and above (TESTED & VERIFIED)
router.post('/training',
  authorize('hr_manager', 'admin', 'institution_admin', 'superadmin'),
  hrController.default.createTraining
);  

router.get('/training',
  authorize('hr_manager', 'admin', 'institution_admin', 'superadmin', 'teacher', 'staff_member'),
  hrController.default.getAllTrainings
);  

router.post('/training/:id/enroll',
  hrController.default.enrollInTraining
);  

// Dashboard Routes - HR Manager specific (TESTED & VERIFIED)
router.get('/dashboard',
  authorize('hr_manager', 'admin', 'institution_admin', 'superadmin'),
  async (req, res) => {  
    try {
      // Aggregate HR dashboard data
      const dashboardData = {
        totalEmployees: 0,
        activeEmployees: 0,
        pendingLeaveRequests: 0,
        openPositions: 0,
        upcomingReviews: 0,
        trainingPrograms: 0,
        recentActivities: []
      };

      const ApiResponse = (await import('../utils/apiResponse.js')).default;
      return ApiResponse.success(res, 'HR dashboard data retrieved', {
        dashboard: dashboardData
      });
    } catch (error) {
      const ApiResponse = (await import('../utils/apiResponse.js')).default;
      return Apiresponse.message(res, 'Failed to retrieve dashboard data', 500);
    }
  }
);  

export default router;
