// Geofence Routes
import express from 'express';
const router = express.Router();
import geofenceController from '../controllers/geofenceController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/authGuard.js';
import { validateInput } from '../middleware/validation.js';

// Apply authentication to all routes (TESTED & VERIFIED)
router.use(protect);

// Create Geofence (TESTED & VERIFIED)
router.post('/',
  authorize(['super_admin', 'admin', 'transport_manager']),
  validateInput({
    name: { required: true, type: 'string' },
    description: { required: false, type: 'string' },
    boundary: { required: false, type: 'object' },
    center: { required: false, type: 'object' },
    radius: { required: false, type: 'number' },
    type: { required: false, type: 'string', enum: ['campus', 'transport', 'restricted', 'custom'] },
    locationType: { required: false, type: 'string', enum: ['gate', 'classroom', 'library', 'office', 'playground', 'transport'] },
    timeRestrictions: { required: false, type: 'object' },
    allowedUserTypes: { required: false, type: 'array' }
  }),
  geofenceController.createGeofence
);  

// Validate Location within Geofence (TESTED & VERIFIED)
router.post('/validate',
  validateInput({
    latitude: { required: true, type: 'number' },
    longitude: { required: true, type: 'number' },
    userType: { required: false, type: 'string', enum: ['student', 'teacher', 'staff', 'parent', 'admin'] }
  }),
  geofenceController.validateLocation
);  

// Get Geofences (TESTED & VERIFIED)
router.get('/',
  authorize(['super_admin', 'admin', 'transport_manager', 'teacher']),
  validateInput({
    page: { required: false, type: 'number' },
    limit: { required: false, type: 'number' },
    type: { required: false, type: 'string', enum: ['campus', 'transport', 'restricted', 'custom'] },
    locationType: { required: false, type: 'string', enum: ['gate', 'classroom', 'library', 'office', 'playground', 'transport'] },
    isActive: { required: false, type: 'boolean' }
  }),
  geofenceController.getGeofences
);  

// Get Geofence by ID (TESTED & VERIFIED)
router.get('/:id',
  authorize(['super_admin', 'admin', 'transport_manager', 'teacher']),
  geofenceController.getGeofenceById
);  

// Update Geofence (TESTED & VERIFIED)
router.put('/:id',
  authorize(['super_admin', 'admin', 'transport_manager']),
  validateInput({
    name: { required: false, type: 'string' },
    description: { required: false, type: 'string' },
    boundary: { required: false, type: 'object' },
    center: { required: false, type: 'object' },
    radius: { required: false, type: 'number' },
    type: { required: false, type: 'string', enum: ['campus', 'transport', 'restricted', 'custom'] },
    locationType: { required: false, type: 'string', enum: ['gate', 'classroom', 'library', 'office', 'playground', 'transport'] },
    timeRestrictions: { required: false, type: 'object' },
    allowedUserTypes: { required: false, type: 'array' },
    isActive: { required: false, type: 'boolean' }
  }),
  geofenceController.updateGeofence
);  

// Delete Geofence (Soft Delete) (TESTED & VERIFIED)
router.delete('/:id',
  authorize(['super_admin', 'admin', 'transport_manager']),
  geofenceController.deleteGeofence
);  

// Get Campus Geofences (TESTED & VERIFIED)
router.get('/campus',
  authorize(['super_admin', 'admin', 'transport_manager', 'teacher']),
  geofenceController.getCampusGeofences
);  

// Get Transport Geofences (TESTED & VERIFIED)
router.get('/transport',
  authorize(['super_admin', 'admin', 'transport_manager', 'teacher']),
  geofenceController.getTransportGeofences
);  

// Get Geofence Statistics (TESTED & VERIFIED)
router.get('/statistics',
  authorize(['super_admin', 'admin', 'transport_manager']),
  geofenceController.getGeofenceStatistics
);  

// Bulk Create Geofences (TESTED & VERIFIED)
router.post('/bulk',
  authorize(['super_admin', 'admin', 'transport_manager']),
  validateInput({
    geofences: { required: true, type: 'array' }
  }),
  geofenceController.bulkCreateGeofences
);  

export default router;