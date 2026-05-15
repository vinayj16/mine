import express from 'express';
import menuController from '../controllers/menuController.js';
import * as validators from '../validators/menuValidators.js';
import { protect } from '../middleware/authMiddleware.js';
import { validationResult } from 'express-validator';

const router = express.Router();

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// Apply authentication middleware to all routes (TESTED & VERIFIED)
router.use(protect);  

// Get menu for current user (TESTED & VERIFIED)
router.get('/my-menu', menuController.getMyMenu);  

// Get menu for specific role (TESTED & VERIFIED)
router.get('/role/:roleId', validators.roleIdValidator, validate, validators.schoolIdQueryValidator, validate, menuController.getMenuForRole);  

// Get menu for specific user (TESTED & VERIFIED)
router.get('/user/:userId', validators.userIdValidator, validate, menuController.getMenuForUser);  

// Create default menu for role (TESTED & VERIFIED)
router.post('/role/:roleId/default', validators.createDefaultMenuValidator, validate, menuController.createDefaultMenuForRole);  

// Update menu for role (TESTED & VERIFIED)
router.put('/role/:roleId', validators.updateMenuValidator, validate, menuController.updateMenuForRole);  

// Add custom menu item (TESTED & VERIFIED)
router.post('/role/:roleId/custom-item', validators.addCustomMenuItemValidator, validate, menuController.addCustomMenuItem);  

// Remove custom menu item (TESTED & VERIFIED)
router.delete('/role/:roleId/custom-item/:menuItemPath', validators.removeCustomMenuItemValidator, validate, menuController.removeCustomMenuItem);  

// Hide menu item (TESTED & VERIFIED)
router.post('/role/:roleId/hide-item', validators.hideShowMenuItemValidator, validate, menuController.hideMenuItem);  

// Show menu item (TESTED & VERIFIED)
router.post('/role/:roleId/show-item', validators.hideShowMenuItemValidator, validate, menuController.showMenuItem);  

// Reorder menu sections (TESTED & VERIFIED)
router.put('/role/:roleId/reorder', validators.reorderMenuValidator, validate, menuController.reorderMenuSections);  

// Add quick action (TESTED & VERIFIED)
router.post('/role/:roleId/quick-action', validators.addQuickActionValidator, validate, menuController.addQuickAction);  

// Remove quick action (TESTED & VERIFIED)
router.delete('/role/:roleId/quick-action/:actionId', validators.removeQuickActionValidator, validate, menuController.removeQuickAction);  

// Reset menu to default (TESTED & VERIFIED)
router.post('/role/:roleId/reset', validators.resetMenuValidator, validate, menuController.resetMenuToDefault);  

export default router;
