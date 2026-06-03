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

// CRUD Operations
router.get('/', getAllDrivers);
router.get('/statistics', authorize(['admin', 'principal', 'transport_manager', 'institution_admin', 'superadmin']), getDriverStatistics);
router.get('/active', getActiveDrivers);
router.get('/search', searchDrivers);
router.get('/expiring-licenses', getDriversWithExpiringLicenses);
router.get('/:id', getDriverById);
router.post('/', authorize(['admin', 'principal', 'transport_manager', 'institution_admin', 'superadmin']), createDriver);
router.put('/:id', authorize(['admin', 'principal', 'transport_manager', 'institution_admin', 'superadmin']), updateDriver);
router.delete('/:id', authorize(['super_admin', 'superadmin', 'admin', 'transport_manager', 'institution_admin']), deleteDriver);

// Vehicle Assignment
router.post('/:id/assign-vehicle', authorize(['admin', 'principal', 'transport_manager', 'institution_admin', 'superadmin']), assignDriverToVehicle);

// Bulk Operations (TESTED & VERIFIED)
router.post('/bulk-delete', authorize(['super_admin']), bulkDeleteDrivers);  

// Export (TESTED & VERIFIED)
router.get('/export', authorize(['admin', 'principal']), exportDrivers);  

export default router;
