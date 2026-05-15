import express from 'express';
import * as subscriptionController from '../controllers/subscriptionController.js';
import * as validators from '../validators/subscriptionValidators.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/authGuard.js';
import { validationResult } from 'express-validator';

const router = express.Router();

const validate = (req, res, next) => {  
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// Public routes (no authentication required) (TESTED & VERIFIED)
// IMPORTANT: These routes must be defined BEFORE the protect middleware!
router.get('/plans', subscriptionController.getAllPlans);  
router.get('/plans/:planId', validators.planIdValidator, validate, subscriptionController.getPlanById);  
router.post('/coming-soon', subscriptionController.subscribeComingSoon);  

// Protected routes (authentication required) (TESTED & VERIFIED)
// This middleware applies to all routes defined AFTER this line
router.use(protect);  

router.get('/schools/:schoolId', validators.schoolIdValidator, validate, subscriptionController.getSchoolSubscription);  

router.post('/', validators.createSubscriptionValidator, validate, subscriptionController.createSubscription);  

router.post('/schools/:schoolId/upgrade', validators.upgradeSubscriptionValidator, validate, subscriptionController.upgradeSubscription);  

router.post('/schools/:schoolId/cancel', validators.cancelSubscriptionValidator, validate, subscriptionController.cancelSubscription);  

router.post('/schools/:schoolId/renew', validators.schoolIdValidator, validate, subscriptionController.renewSubscription);  

router.get('/expiring', validators.expiringSubscriptionsValidator, validate, subscriptionController.getExpiringSubscriptions);  

router.get('/stats', subscriptionController.getSubscriptionStats);  

router.get('/schools/:schoolId/limits', validators.schoolIdValidator, validate, subscriptionController.checkSubscriptionLimits);  

// Status and filtering routes (TESTED & VERIFIED)
router.get('/status/:status', subscriptionController.getSubscriptionsByStatus);  
router.get('/all', subscriptionController.getAllSubscriptions);  

// Subscription management (TESTED & VERIFIED)
router.post('/schools/:schoolId/suspend', authorize(['admin', 'super_admin']), subscriptionController.suspendSubscription);  
router.post('/schools/:schoolId/reactivate', authorize(['admin', 'super_admin']), subscriptionController.reactivateSubscription);  
router.get('/schools/:schoolId/history', validators.schoolIdValidator, validate, subscriptionController.getSubscriptionHistory);  
router.get('/schools/:schoolId/usage', validators.schoolIdValidator, validate, subscriptionController.getSubscriptionUsage);  

// Statistics and export (TESTED & VERIFIED)
router.get('/export', authorize(['admin', 'super_admin']), subscriptionController.exportSubscriptions);  
router.get('/revenue', authorize(['admin', 'super_admin']), subscriptionController.getRevenueStatistics);  
router.get('/plans/:planId/statistics', authorize(['admin', 'super_admin']), subscriptionController.getPlanStatistics);  

// Renewal reminders (TESTED & VERIFIED)
router.post('/schools/:schoolId/renewal-reminder', authorize(['admin']), subscriptionController.sendRenewalReminder);  
router.post('/bulk-renewal-reminders', authorize(['admin', 'super_admin']), subscriptionController.bulkSendRenewalReminders);  

export default router;
