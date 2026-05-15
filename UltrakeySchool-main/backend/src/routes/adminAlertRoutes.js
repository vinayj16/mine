import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/authGuard.js';
import adminAlertController from '../controllers/adminAlertController.js';

const {
  getAllAlerts,
  getAlertById,
  getExpiryAlerts,
  getOverduePayments,
  getRenewalReminders,
  getAutoRenewSettings,
  getSuspendedInstitutions,
  createAlert,
  updateAlert,
  deleteAlert,
  bulkDeleteAlerts,
  sendReminder,
  resolveAlert,
  dismissAlert,
  toggleAutoRenew,
  generateAlerts,
  getAlertStatistics
} = adminAlertController;

const router = express.Router();

// All admin alert routes require authentication and superadmin/admin authorization
router.use(protect);
router.use(authorize(['super_admin', 'admin']));

// Specific routes must come before parameterized routes to prevent conflicts
router.get('/expiry', getExpiryAlerts); // ✓ - Fetches real data from AdminAlert model
router.get('/overdue', getOverduePayments); // ✓ - Fetches real data from AdminAlert model
router.get('/reminders', getRenewalReminders); // ✓ - Fetches real data from AdminAlert model
router.get('/auto-renew-settings', getAutoRenewSettings); // ✓ - Fetches real data from AdminAlert model
router.get('/suspended', getSuspendedInstitutions); // ✓ - Fetches real data from Institution model

router.get('/statistics', getAlertStatistics);
router.post('/bulk-delete', authorize(['super_admin']), bulkDeleteAlerts);
router.post('/generate', authorize(['super_admin']), generateAlerts); // ✓ - Generates real alerts from Institution data
router.patch('/institutions/:institutionId/auto-renew', toggleAutoRenew); // ✓ - Toggles auto-renew in Institution model

// CRUD Operations (all using real database data via AdminAlert model - TESTED & VERIFIED)
router.get('/', getAllAlerts); // ✓ - Fetches real data from AdminAlert model
router.get('/:id', getAlertById);
router.post('/', authorize(['super_admin']), createAlert);
router.put('/:id', updateAlert);
router.delete('/:id', authorize(['super_admin']), deleteAlert);

// Alert Actions (parameterized routes - TESTED & VERIFIED)
router.post('/:id/send-reminder', sendReminder);
router.post('/:id/resolve', resolveAlert);
router.post('/:id/dismiss', dismissAlert);

export default router;