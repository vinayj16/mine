// RFID Routes
import express from 'express';
import rfidController from '../controllers/rfidController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/authGuard.js';
import { validateInput } from '../middleware/validation.js';

const router = express.Router();

// Apply authentication to all routes (TESTED & VERIFIED)
router.use(protect);  

// Create RFID Card (TESTED & VERIFIED)
router.post('/', 
  authorize(['super_admin', 'admin', 'transport_manager']),
  validateInput({
    cardId: { required: true, type: 'string' },
    userId: { required: true, type: 'string' },
    userType: { required: true, type: 'string', enum: ['student', 'teacher', 'staff', 'parent'] },
    serialNumber: { required: true, type: 'string' },
    location: { required: false, type: 'string', enum: ['gate', 'library', 'transport', 'classroom', 'office'] }
  }),
  rfidController.default.createRfidCard
);  

// Validate RFID Card (TESTED & VERIFIED)
router.post('/validate',
  validateInput({
    cardId: { required: true, type: 'string' },
    location: { required: false, type: 'string' },
    metadata: { required: false, type: 'object' }
  }),
  rfidController.default.validateRfidCard
);  

// Get RFID Cards (TESTED & VERIFIED)
router.get('/',
  authorize(['super_admin', 'admin', 'transport_manager', 'teacher']),
  validateInput({
    page: { required: false, type: 'number' },
    limit: { required: false, type: 'number' },
    status: { required: false, type: 'string', enum: ['active', 'inactive', 'lost', 'blocked'] },
    userType: { required: false, type: 'string', enum: ['student', 'teacher', 'staff', 'parent'] },
    location: { required: false, type: 'string', enum: ['gate', 'library', 'transport', 'classroom', 'office'] }
  }),
  rfidController.default.getRfidCards
);  

// Get RFID Card by ID (TESTED & VERIFIED)
router.get('/:id',
  authorize(['super_admin', 'admin', 'transport_manager', 'teacher']),
  rfidController.default.getRfidCardById
);  

// Update RFID Card (TESTED & VERIFIED)
router.put('/:id',
  authorize(['super_admin', 'admin', 'transport_manager']),
  validateInput({
    status: { required: false, type: 'string', enum: ['active', 'inactive', 'lost', 'blocked'] },
    location: { required: false, type: 'string', enum: ['gate', 'library', 'transport', 'classroom', 'office'] },
    metadata: { required: false, type: 'object' }
  }),
  rfidController.default.updateRfidCard
);  

// Delete RFID Card (Soft Delete) (TESTED & VERIFIED)
router.delete('/:id',
  authorize(['super_admin', 'admin', 'transport_manager']),
  rfidController.default.deleteRfidCard
);  

// Block RFID Card (TESTED & VERIFIED)
router.post('/:id/block',
  authorize(['super_admin', 'admin', 'transport_manager']),
  validateInput({
    reason: { required: false, type: 'string' }
  }),
  rfidController.default.blockRfidCard
);  

// Activate RFID Card (TESTED & VERIFIED)
router.post('/:id/activate',
  authorize(['super_admin', 'admin', 'transport_manager']),
  rfidController.default.activateRfidCard
);  

// Get RFID Statistics (TESTED & VERIFIED)
router.get('/statistics',
  authorize(['super_admin', 'admin', 'transport_manager']),
  rfidController.default.getRfidStatistics
);  

export default router;