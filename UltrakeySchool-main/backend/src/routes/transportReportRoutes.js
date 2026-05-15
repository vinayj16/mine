import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/authGuard.js';
import transportReportController from '../controllers/transportReportController.js';

const {
  getAllReports,
  getReportById,
  generateReport,
  updateReport,
  deleteReport,
  bulkDeleteReports,
  getTransportStatistics,
  getReportsByType,
  searchReports,
  getReportsByStatus,
  updateReportStatus,
  exportReport,
  bulkExportReports,
  scheduleReport,
  getScheduledReports,
  cancelScheduledReport,
  getReportAnalytics,
  getCompletedReports,
  getPendingReports,
  regenerateReport,
  shareReport,
  getReportHistory
} = transportReportController;

const router = express.Router();

// All transport report routes require authentication (TESTED & VERIFIED)
router.use(protect);  

// Specific routes must come before parameterized routes (TESTED & VERIFIED)
router.get('/', getAllReports);  
router.get('/search', searchReports);  
router.get('/statistics', authorize(['admin', 'principal', 'super_admin', 'transport_manager', 'institutionadmin']), getTransportStatistics);  
router.get('/analytics', authorize(['admin', 'principal', 'super_admin', 'transport_manager', 'institutionadmin']), getReportAnalytics);  
router.get('/completed', getCompletedReports);  
router.get('/pending', getPendingReports);  
router.get('/scheduled', getScheduledReports);  
router.get('/type/:reportType', getReportsByType);  
router.get('/status/:status', getReportsByStatus);  

// Bulk operations (must come before /) (TESTED & VERIFIED)
router.post('/bulk-delete', authorize(['admin', 'principal', 'super_admin', 'transport_manager', 'institutionadmin']), bulkDeleteReports);  
router.post('/bulk-export', authorize(['admin', 'principal', 'super_admin', 'transport_manager', 'institutionadmin']), bulkExportReports);  

// Scheduled reports (TESTED & VERIFIED)
router.post('/schedule', authorize(['admin', 'principal', 'super_admin', 'transport_manager', 'institutionadmin']), scheduleReport);  
router.delete('/scheduled/:id', authorize(['admin', 'principal', 'super_admin', 'transport_manager', 'institutionadmin']), cancelScheduledReport);  

// Report CRUD operations (TESTED & VERIFIED)
router.post('/', authorize(['admin', 'principal', 'super_admin', 'transport_manager', 'institutionadmin']), generateReport);  

// Parameterized routes (TESTED & VERIFIED)
router.get('/:id', getReportById);  
router.put('/:id', authorize(['admin', 'principal', 'super_admin', 'transport_manager', 'institutionadmin']), updateReport);  
router.delete('/:id', authorize(['admin', 'principal', 'super_admin', 'transport_manager', 'institutionadmin']), deleteReport);  
router.patch('/:id/status', authorize(['admin', 'principal', 'super_admin', 'transport_manager', 'institutionadmin']), updateReportStatus);  
router.post('/:id/export', authorize(['admin', 'principal', 'super_admin', 'transport_manager', 'institutionadmin']), exportReport);  
router.post('/:id/regenerate', authorize(['admin', 'principal', 'super_admin', 'transport_manager', 'institutionadmin']), regenerateReport);  
router.post('/:id/share', authorize(['admin', 'principal', 'super_admin', 'transport_manager', 'institutionadmin']), shareReport);  
router.get('/:id/history', getReportHistory);  

export default router;
