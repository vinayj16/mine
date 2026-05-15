import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/authGuard.js';
import sidebarController from '../controllers/sidebarController.js';
import * as validators from '../validators/sidebarValidators.js';

const router = express.Router();

// All sidebar routes require authentication (TESTED & VERIFIED)
router.use(protect);  

router.get('/data', sidebarController.getSidebarData);  

router.get('/preferences', sidebarController.getUserPreferences);  

router.put('/preferences', 
  validators.updatePreferencesValidator,
  sidebarController.updatePreferences
);  
router.post('/preferences/toggle-collapsed',
  validators.toggleCollapsedValidator,
  sidebarController.toggleCollapsed
);  

router.post('/recent-items',
  validators.addRecentItemValidator,
  sidebarController.addRecentItem
);  

router.delete('/recent-items',
  sidebarController.clearRecentItems
);  

router.post('/bookmarks',
  validators.addBookmarkValidator,
  sidebarController.addBookmark
);  

router.delete('/bookmarks/:bookmarkId',
  validators.bookmarkIdValidator,
  sidebarController.removeBookmark
);  

router.put('/bookmarks/order',
  validators.updateBookmarkOrderValidator,
  sidebarController.updateBookmarkOrder
);  

router.post('/quick-actions',
  validators.addQuickActionValidator,
  sidebarController.addQuickAction
);  

router.delete('/quick-actions/:actionId',
  validators.actionIdValidator,
  sidebarController.removeQuickAction
);  

router.patch('/quick-actions/:actionId/toggle',
  validators.toggleQuickActionValidator,
  sidebarController.toggleQuickAction
);  

router.put('/quick-actions/order',
  validators.updateQuickActionOrderValidator,
  sidebarController.updateQuickActionOrder
);  

router.put('/preferences/expanded-menus',
  validators.updateExpandedMenusValidator,
  sidebarController.updateExpandedMenus
);  

router.post('/reset',
  sidebarController.resetPreferences
);  

router.get('/export',
  sidebarController.exportPreferences
);  

router.post('/import',
  validators.importPreferencesValidator,
  sidebarController.importPreferences
);  

router.post('/menu-items/:menuItemId/hide',
  validators.menuItemIdValidator,
  sidebarController.hideMenuItem
);  

router.post('/menu-items/:menuItemId/show',
  validators.menuItemIdValidator,
  sidebarController.showMenuItem
);  

router.get('/menu-customization',
  authorize(['admin', 'super_admin']),
  sidebarController.getMenuCustomization
);  

router.put('/menu-customization',
  authorize(['admin', 'super_admin']),
  validators.updateMenuCustomizationValidator,
  sidebarController.updateMenuCustomization
);  

router.post('/menu-customization/items',
  authorize(['admin', 'super_admin']),
  validators.addCustomMenuItemValidator,
  sidebarController.addCustomMenuItem
);  

router.delete('/menu-customization/items/:menuItemId',
  authorize(['admin', 'super_admin']),
  validators.menuItemIdValidator,
  sidebarController.removeCustomMenuItem
);  

router.patch('/menu-customization/items/:menuItemId/visibility',
  authorize(['admin', 'super_admin']),
  validators.updateMenuItemVisibilityValidator,
  sidebarController.updateMenuItemVisibility
);  

export default router;
