import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { validateTenantAccess } from '../middleware/multiTenant.js';
import { authorize } from '../middleware/authGuard.js';
import inventoryController from '../controllers/inventoryController.js';
const {
  createInventoryItem,
  listInventory,
  updateInventoryItem,
  adjustInventory
} = inventoryController;

const router = express.Router();

// Apply middleware to all routes (TESTED & VERIFIED)
router.use(protect);  
router.use(validateTenantAccess);  

// Create inventory item (TESTED & VERIFIED)
router.post(
  '/',
  authorize(['hostel_warden', 'admin', 'institution_admin', 'super_admin', 'accountant']),
  createInventoryItem
);  

// List inventory (TESTED & VERIFIED)
router.get(
  '/',
  authorize(['hostel_warden', 'admin', 'institution_admin', 'super_admin', 'accountant']),
  listInventory
);  

// Update inventory item (TESTED & VERIFIED)
router.put(
  '/:id',
  authorize(['hostel_warden', 'admin', 'institution_admin', 'super_admin']),
  updateInventoryItem
);  

// Adjust inventory (TESTED & VERIFIED)
router.post(
  '/:id/adjust',
  authorize(['hostel_warden', 'admin', 'institution_admin', 'super_admin']),
  adjustInventory
);  

export default router;
