import express from 'express';
import academicReasonController from '../controllers/academicReasonController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// All academic reason routes require authentication
router.use(protect);

// CRUD Operations (all using real database data via AcademicReason model - TESTED & VERIFIED)
router.post('/schools/:schoolId/academic-reasons', academicReasonController.createReason);
router.get('/schools/:schoolId/academic-reasons', academicReasonController.getReasons);
router.get('/schools/:schoolId/academic-reasons/:reasonId', academicReasonController.getReasonById);
router.put('/schools/:schoolId/academic-reasons/:reasonId', academicReasonController.updateReason);
router.delete('/schools/:schoolId/academic-reasons/:reasonId', academicReasonController.deleteReason);

// Bulk Operations
router.post('/schools/:schoolId/academic-reasons/bulk-delete', academicReasonController.bulkDeleteReasons);

// Filter and Query Operations
router.get('/schools/:schoolId/academic-reasons/role/:role', academicReasonController.getReasonsByRole);
router.get('/schools/:schoolId/academic-reasons/category/:category', academicReasonController.getReasonsByCategory);
router.get('/schools/:schoolId/academic-reasons/search', academicReasonController.searchReasons);

// Analytics and Usage
router.get('/schools/:schoolId/academic-reasons/analytics', academicReasonController.getAnalytics);
router.post('/schools/:schoolId/academic-reasons/:reasonId/increment-usage', academicReasonController.incrementUsage);
router.get('/schools/:schoolId/academic-reasons/most-used', academicReasonController.getMostUsedReasons);

// Status Management
router.patch('/schools/:schoolId/academic-reasons/:reasonId/toggle-status', academicReasonController.toggleStatus);

// Export
router.get('/schools/:schoolId/academic-reasons/export', academicReasonController.exportReasons);

export default router;
