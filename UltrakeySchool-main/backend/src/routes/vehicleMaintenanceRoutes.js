import express from 'express';
import vehicleMaintenanceController from '../controllers/vehicleMaintenanceController.js';
import { protect } from '../middleware/authMiddleware.js';
import { validateTenantAccess } from '../middleware/multiTenant.js';
import { authorize } from '../middleware/authGuard.js';

const router = express.Router();

// All routes require authentication and tenant validation
router.use(protect);
router.use(validateTenantAccess);

// Get all vehicle maintenances
router.get('/', vehicleMaintenanceController.getVehicleMaintenances);

// Get maintenance statistics
router.get('/stats', vehicleMaintenanceController.getMaintenanceStats);

// Get single vehicle maintenance
router.get('/:id', vehicleMaintenanceController.getVehicleMaintenanceById);

// Create vehicle maintenance
router.post('/', authorize(['admin', 'transport_manager', 'institution_admin']), vehicleMaintenanceController.createVehicleMaintenance);

// Update vehicle maintenance
router.put('/:id', authorize(['admin', 'transport_manager', 'institution_admin']), vehicleMaintenanceController.updateVehicleMaintenance);

// Delete vehicle maintenance
router.delete('/:id', authorize(['admin', 'transport_manager']), vehicleMaintenanceController.deleteVehicleMaintenance);

export default router;
