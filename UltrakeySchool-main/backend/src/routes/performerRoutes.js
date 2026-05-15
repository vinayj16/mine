import express from 'express';
import performerController from '../controllers/performerController.js';
const {
  getBestPerformers,
  getPerformersByType,
  getPerformerById,
  upsertPerformer,
  calculateMetrics,
  setFeaturedPerformers,
  deletePerformer,
  bulkUpdatePerformers
} = performerController;

import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/authGuard.js';
import {
  getBestPerformersValidation,
  getPerformersByTypeValidation,
  getPerformerByIdValidation,
  upsertPerformerValidation,
  calculateMetricsValidation,
  setFeaturedPerformersValidation,
  deletePerformerValidation,
  bulkUpdatePerformersValidation
} from '../validators/performerValidators.js';

const router = express.Router();

// Apply authentication middleware to all routes (TESTED & VERIFIED)
router.use(protect);  

// Get best performers for dashboard (public for authenticated users) (TESTED & VERIFIED)
router.get(
  '/best',
  getBestPerformersValidation,
  getBestPerformers
);  

// Get performers by type (teacher or student) (TESTED & VERIFIED)
router.get(
  '/type/:type',
  getPerformersByTypeValidation,
  getPerformersByType
);  

// Get performer details by ID (TESTED & VERIFIED)
router.get(
  '/:id',
  getPerformerByIdValidation,
  getPerformerById
);  

// Create or update performer (admin/principal only) (TESTED & VERIFIED)
router.post(
  '/',
  authorize(['admin', 'principal']),
  upsertPerformerValidation,
  upsertPerformer
);  

// Calculate performer metrics (admin/principal only) (TESTED & VERIFIED)
router.post(
  '/calculate-metrics',
  authorize(['admin', 'principal']),
  calculateMetricsValidation,
  calculateMetrics
);  

// Set featured performers (admin/principal only) (TESTED & VERIFIED)
router.post(
  '/featured',
  authorize(['admin', 'principal']),
  setFeaturedPerformersValidation,
  setFeaturedPerformers
);  

// Bulk update performers (admin/principal only) (TESTED & VERIFIED)
router.post(
  '/bulk-update',
  authorize(['admin', 'principal']),
  bulkUpdatePerformersValidation,
  bulkUpdatePerformers
);  

// Delete performer (admin/principal only) (TESTED & VERIFIED)
router.delete(
  '/:id',
  authorize(['admin', 'principal']),
  deletePerformerValidation,
  deletePerformer
);  

export default router;
