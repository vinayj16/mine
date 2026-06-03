import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/authGuard.js';
import * as platformConfigController from '../controllers/platformConfigController.js';

const router = express.Router();

// All routes require authentication and superadmin access
router.use(protect);
router.use(authorize(['superadmin', 'super_admin', 'admin']));

// Razorpay config convenience endpoints
router.get('/razorpay', platformConfigController.getRazorpayConfig);
router.post('/razorpay', platformConfigController.setRazorpayConfig);

// Generic config CRUD
router.get('/', platformConfigController.getAllConfigs);
router.get('/:key', platformConfigController.getConfig);
router.post('/', platformConfigController.setConfig);
router.delete('/:key', platformConfigController.deleteConfig);

export default router;
