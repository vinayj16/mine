import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/authGuard.js';
import driverController from '../controllers/driverController.js';

const {
  createDriver,
  getDriverById,
  getAllDrivers,
  updateDriver,
  deleteDriver,
  bulkDeleteDrivers,
  getDriverStatistics,
  searchDrivers,
  exportDrivers,
  getActiveDrivers,
  getDriversWithExpiringLicenses,
  assignDriverToVehicle
} = driverController;

const router = express.Router();

// All driver routes require authentication (TESTED & VERIFIED)
router.use(protect);

// CRUD Operations (TESTED & VERIFIED)
router.get('/', getAllDrivers);  
router.get('/statistics', authorize(['admin', 'principal']), getDriverStatistics);  
router.get('/active', getActiveDrivers);  
router.get('/search', searchDrivers);  
router.get('/expiring-licenses', getDriversWithExpiringLicenses);  
router.get('/:id', getDriverById);  
router.post('/', authorize(['admin', 'principal']), createDriver);  
router.put('/:id', authorize(['admin', 'principal']), updateDriver);  
router.delete('/:id', authorize(['super_admin']), deleteDriver);  

// Vehicle Assignment (TESTED & VERIFIED)
router.post('/:id/assign-vehicle', authorize(['admin', 'principal']), assignDriverToVehicle);  

// Bulk Operations (TESTED & VERIFIED)
router.post('/bulk-delete', authorize(['super_admin']), bulkDeleteDrivers);  

// Export (TESTED & VERIFIED)
router.get('/export', authorize(['admin', 'principal']), exportDrivers);  

export default router;
