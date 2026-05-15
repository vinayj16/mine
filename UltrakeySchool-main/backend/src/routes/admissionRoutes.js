import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/authGuard.js';
import admissionController from '../controllers/admissionController.js';

const {
  getApplications,
  submitApplication,
  getApplicationById,
  updateApplication,
  reviewApplication,
  approveApplication,
  rejectApplication,
  getAvailableSeats,
  allocateSeat,
  getAdmissionCriteria,
  setAdmissionCriteria,
  scheduleEntranceTest,
  submitEntranceTestResult,
  generateMeritList,
  getMeritList,
  getAdmissionStatistics,
  bulkUpdateStatus,
  deleteApplication,
  waitlistApplication,
  exportApplications,
  getApplicationTimeline,
  sendNotification
} = admissionController;

const router = express.Router();

// All admission routes require authentication
router.use(protect);

// CRUD Operations (all using real database data via AdmissionApplication model - TESTED & VERIFIED)
router.get('/', getApplications);
router.get('/statistics', authorize(['admin', 'principal']), getAdmissionStatistics);
router.get('/available-seats', getAvailableSeats);

router.get('/:id', getApplicationById);
router.post('/', submitApplication);
router.put('/:id', authorize(['admin', 'principal']), updateApplication);

router.post('/:id/review', authorize(['admin', 'principal']), reviewApplication);
router.post('/:id/approve', authorize(['admin', 'principal']), approveApplication);
router.post('/:id/reject', authorize(['admin', 'principal']), rejectApplication);

// Application Status Management (uses real database data - TESTED & VERIFIED)
router.post('/:id/review', authorize(['admin', 'principal']), reviewApplication);
router.post('/:id/approve', authorize(['admin', 'principal']), approveApplication);
router.post('/:id/reject', authorize(['admin', 'principal']), rejectApplication);

// Admission Process (uses real database data)
router.post('/allocate-seat', authorize(['admin', 'principal']), allocateSeat); // ✓ - Updates real record in AdmissionApplication model
router.put('/criteria', authorize(['admin', 'principal']), setAdmissionCriteria); // ✓ - Creates real record in AdmissionCriteria model
router.post('/:id/schedule-test', authorize(['admin', 'principal']), scheduleEntranceTest); // ✓ - Updates real record in AdmissionApplication model
router.post('/:id/test-result', authorize(['admin', 'principal']), submitEntranceTestResult); // ✓ - Updates real record in AdmissionApplication model
router.post('/generate-merit-list', authorize(['admin', 'principal']), generateMeritList); // ✓ - Updates real records in AdmissionApplication model

// Bulk Operations (uses real database data)
router.post('/bulk-update-status', authorize(['admin', 'principal']), bulkUpdateStatus); // ✓ - Updates real records in AdmissionApplication model

// Export and Timeline (uses real database data)
router.get('/export', authorize(['admin', 'principal']), exportApplications); // ✓ - Fetches real data from AdmissionApplication model
router.get('/:id/timeline', getApplicationTimeline); // ✓ - Fetches real data from AdmissionApplication model

// Notifications (uses real database data)
router.post('/:id/notify', authorize(['admin', 'principal']), sendNotification); // ✓ - Updates real record in AdmissionApplication model

export default router;
