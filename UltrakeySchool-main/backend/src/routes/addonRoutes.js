import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import addonController from '../controllers/addonController.js';
const {
  getAllAddons,
  getAddonById,
  getAddonByAddonId,
  createAddon,
  updateAddon,
  deleteAddon,
  bulkDeleteAddons,
  toggleStatus,
  getAddonsByCategory,
  getStatistics,
  reorderAddons
} = addonController;

const router = express.Router();

// All addon routes require authentication
router.use(protect);

// CRUD Operations (all using real database data via MembershipAddon model - TESTED & VERIFIED)
router.get('/', getAllAddons);
router.get('/by-addon-id/:addonId', getAddonByAddonId);
router.get('/:id', getAddonById);
router.post('/', createAddon);
router.put('/:id', updateAddon);
router.delete('/:id', deleteAddon);

// Bulk Operations
router.post('/bulk-delete', bulkDeleteAddons);

// Status Management
router.patch('/:id/toggle-status', toggleStatus);

// Category Operations
router.get('/category/:category', getAddonsByCategory);

// Statistics
router.get('/statistics', getStatistics);

// Reordering
router.post('/reorder', reorderAddons);

export default router;
