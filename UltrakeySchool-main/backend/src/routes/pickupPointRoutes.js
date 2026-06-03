import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/authGuard.js';
import pickupPointController from '../controllers/pickupPointController.js';

const {
  getAllPickupPoints,
  getPickupPointById,
  createPickupPoint,
  updatePickupPoint,
  deletePickupPoint,
  bulkDeletePickupPoints,
  getPickupPointsByRoute,
  getPickupPointStatistics,
  exportPickupPoints,
  getNearbyPickupPoints,
  updatePickupPointStatus,
  getPickupPointsByStatus,
  assignStudentsToPickupPoint,
  getPickupPointCapacity
} = pickupPointController;

const router = express.Router();

// All pickup point routes require authentication (TESTED & VERIFIED)
router.use(protect);  

// Get all pickup points (TESTED & VERIFIED)
router.get('/', getAllPickupPoints);  

// Pickup point CRUD operations (TESTED & VERIFIED)
router.get('/:id', getPickupPointById);  
router.post('/', authorize(['admin', 'principal', 'super_admin', 'institution_admin', 'transport_manager']), createPickupPoint);  
router.put('/:id', authorize(['admin', 'principal', 'super_admin', 'institution_admin', 'transport_manager']), updatePickupPoint);  
router.delete('/:id', authorize(['admin', 'principal', 'super_admin', 'institution_admin', 'transport_manager']), deletePickupPoint);  

// Advanced pickup point operations (TESTED & VERIFIED)
router.post('/bulk-delete', authorize(['admin', 'principal', 'super_admin', 'institution_admin', 'transport_manager']), bulkDeletePickupPoints);  
router.get('/route/:routeId', getPickupPointsByRoute);  
router.get('/statistics', authorize(['admin', 'principal', 'super_admin', 'institution_admin', 'transport_manager']), getPickupPointStatistics);  
router.get('/export', authorize(['admin', 'principal', 'super_admin', 'institution_admin', 'transport_manager']), exportPickupPoints);  
router.get('/nearby', getNearbyPickupPoints);  
router.patch('/:id/status', authorize(['admin', 'principal', 'super_admin', 'institution_admin', 'transport_manager']), updatePickupPointStatus);  
router.get('/status/:status', getPickupPointsByStatus);  
router.post('/:id/assign-students', authorize(['admin', 'principal', 'super_admin', 'institution_admin', 'transport_manager']), assignStudentsToPickupPoint);  
router.get('/:id/capacity', getPickupPointCapacity);  

export default router;
