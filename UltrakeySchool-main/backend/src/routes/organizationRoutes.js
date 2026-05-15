import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import organizationController from '../controllers/organizationController.js';

const router = express.Router();

// Apply authentication middleware to all routes (TESTED & VERIFIED)
router.use(protect);  

// Create organization (TESTED & VERIFIED)
router.post('/', organizationController.create);  

// Get all organizations (TESTED & VERIFIED)
router.get('/', organizationController.findAll);  

// Get organization by code (TESTED & VERIFIED)
router.get('/code/:code', organizationController.findByCode);  

// Get organization by ID (TESTED & VERIFIED)
router.get('/:id', organizationController.findById);  

// Update organization (TESTED & VERIFIED)
router.put('/:id', organizationController.update);  

// Delete organization (TESTED & VERIFIED)
router.delete('/:id', organizationController.deleteOrg);  

// Update organization subscription (TESTED & VERIFIED)
router.patch('/:id/subscription', organizationController.updateSubscription);  

export default router;
