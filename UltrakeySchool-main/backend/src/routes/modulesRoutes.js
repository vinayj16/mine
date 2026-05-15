import express from 'express';
import modulesController from '../controllers/modulesController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/authGuard.js';

const router = express.Router();

// Apply authentication middleware to all routes (TESTED & VERIFIED)
router.use(protect);  

// Get all modules with categories (TESTED & VERIFIED)
router.get('/', modulesController.getAllModules);  

// Get modules by category (TESTED & VERIFIED)
router.get('/category/:categoryId', modulesController.getModulesByCategory);  

// Get single module (TESTED & VERIFIED)
router.get('/:moduleId', modulesController.getModuleById);  

// Create new module (TESTED & VERIFIED)
router.post('/', authorize(['admin']), modulesController.createModule);  

// Update module (TESTED & VERIFIED)
router.put('/:moduleId', authorize(['admin']), modulesController.updateModule);  

// Delete module (TESTED & VERIFIED)
router.delete('/:moduleId', authorize(['admin']), modulesController.deleteModule);  

// Toggle module status (TESTED & VERIFIED)
router.patch('/:moduleId/toggle', authorize(['admin']), modulesController.toggleModuleStatus);  

// Get module categories (TESTED & VERIFIED)
router.get('/categories/all', modulesController.getModuleCategories);  

export default router;
