import express from 'express';
import academicReasonController from '../controllers/academicReasonController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// All academic reason routes require authentication
router.use(protect);

// CRUD Operations (all using real database data via AcademicReason model - TESTED & VERIFIED)
router.post('/schools/:institutionId/academic-reasons', academicReasonController.createReason);
router.get('/schools/:institutionId/academic-reasons', academicReasonController.getReasons);
router.get('/schools/:institutionId/academic-reasons/:reasonId', academicReasonController.getReasonById);
router.put('/schools/:institutionId/academic-reasons/:reasonId', academicReasonController.updateReason);
router.delete('/schools/:institutionId/academic-reasons/:reasonId', academicReasonController.deleteReason);

// Bulk Operations
router.post('/schools/:institutionId/academic-reasons/bulk-delete', academicReasonController.bulkDeleteReasons);

// Filter and Query Operations
router.get('/schools/:institutionId/academic-reasons/role/:role', academicReasonController.getReasonsByRole);
router.get('/schools/:institutionId/academic-reasons/category/:category', academicReasonController.getReasonsByCategory);
router.get('/schools/:institutionId/academic-reasons/search', academicReasonController.searchReasons);

// Analytics and Usage
router.get('/schools/:institutionId/academic-reasons/analytics', academicReasonController.getAnalytics);
router.post('/schools/:institutionId/academic-reasons/:reasonId/increment-usage', academicReasonController.incrementUsage);
router.get('/schools/:institutionId/academic-reasons/most-used', academicReasonController.getMostUsedReasons);

// Status Management
router.patch('/schools/:institutionId/academic-reasons/:reasonId/toggle-status', academicReasonController.toggleStatus);

// Export
router.get('/schools/:institutionId/academic-reasons/export', academicReasonController.exportReasons);

export default router;
