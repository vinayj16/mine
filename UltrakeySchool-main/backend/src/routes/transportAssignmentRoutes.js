import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/authGuard.js';
import transportAssignmentController from '../controllers/transportAssignmentController.js';

const {
  getAllAssignments,
  getAssignmentById,
  createAssignment,
  updateAssignment,
  deleteAssignment,
  bulkDeleteAssignments,
  getAssignmentsByRoute,
  getAssignmentsByVehicle,
  getAssignmentsByDriver,
  getAssignmentsByStudent,
  getAssignmentsByPickupPoint,
  updateAssignmentStatus,
  bulkUpdateAssignments,
  searchAssignments,
  getStatistics,
  getAnalytics,
  exportAssignments,
  getActiveAssignments,
  getAssignmentsByAcademicYear,
  reassignVehicle,
  getAssignmentHistory
} = transportAssignmentController;

const router = express.Router();

// All transport assignment routes require authentication (TESTED & VERIFIED)
router.use(protect);  

// Specific routes must come before parameterized routes (TESTED & VERIFIED)
router.get('/', getAllAssignments);  
router.get('/search', searchAssignments);  
router.get('/active', getActiveAssignments);  
router.get('/statistics', authorize(['admin', 'principal', 'super_admin', 'transport_manager', 'institutionadmin']), getStatistics);  
router.get('/analytics', authorize(['admin', 'principal', 'super_admin', 'transport_manager', 'institutionadmin']), getAnalytics);  
router.get('/route/:routeId', getAssignmentsByRoute);  
router.get('/vehicle/:vehicleId', getAssignmentsByVehicle);  
router.get('/driver/:driverId', getAssignmentsByDriver);  
router.get('/student/:studentId', getAssignmentsByStudent);  
router.get('/pickup-point/:pickupPointId', getAssignmentsByPickupPoint);  
router.get('/academic-year/:academicYear', getAssignmentsByAcademicYear);  

// Bulk operations (must come before /:id) (TESTED & VERIFIED)
router.post('/bulk-delete', authorize(['admin', 'principal', 'super_admin', 'transport_manager', 'institutionadmin']), bulkDeleteAssignments);  
router.post('/bulk-update', authorize(['admin', 'principal', 'super_admin', 'transport_manager', 'institutionadmin']), bulkUpdateAssignments);  
router.post('/export', authorize(['admin', 'principal', 'super_admin', 'transport_manager', 'institutionadmin']), exportAssignments);  

// Assignment CRUD (TESTED & VERIFIED)
router.post('/', authorize(['admin', 'principal', 'super_admin', 'transport_manager', 'institutionadmin']), createAssignment);  

// Parameterized routes (TESTED & VERIFIED)
router.get('/:id', getAssignmentById);  
router.put('/:id', authorize(['admin', 'principal', 'super_admin', 'transport_manager', 'institutionadmin']), updateAssignment);  
router.delete('/:id', authorize(['admin', 'principal', 'super_admin', 'transport_manager', 'institutionadmin']), deleteAssignment);  
router.patch('/:id/status', authorize(['admin', 'principal', 'super_admin', 'transport_manager', 'institutionadmin']), updateAssignmentStatus);  
router.post('/:id/reassign', authorize(['admin', 'principal', 'super_admin', 'transport_manager', 'institutionadmin']), reassignVehicle);  
router.get('/:id/history', getAssignmentHistory);  

export default router;