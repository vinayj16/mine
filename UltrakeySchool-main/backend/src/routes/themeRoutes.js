import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/authGuard.js';
import themeController from '../controllers/themeController.js';
const {
  getUserTheme,
  updateUserTheme,
  getSystemTheme,
  updateSystemTheme,
  getAvailableThemes,
  getDesignTokens,
  resetUserTheme,
  getThemeById,
  createCustomTheme,
  updateCustomTheme,
  deleteCustomTheme,
  getCustomThemesBySchool,
  applyThemeToUser,
  cloneTheme,
  exportThemeConfig,
  importThemeConfig,
  getThemePreview,
  validateThemeConfig
} = themeController;

const router = express.Router();

// Public routes (TESTED & VERIFIED)
router.get('/available', getAvailableThemes);  
router.get('/tokens', getDesignTokens);  

// Protected routes (TESTED & VERIFIED)
router.use(protect);  

// User theme preferences (TESTED & VERIFIED)
router.get('/user', getUserTheme);  
router.put('/user', updateUserTheme);  
router.post('/user/reset', resetUserTheme);  
router.post('/user/apply', applyThemeToUser);  

// System theme configuration (admin only) (TESTED & VERIFIED)
router.get('/system', getSystemTheme);  
router.put('/system', authorize(['admin', 'super_admin']), updateSystemTheme);  

// Custom theme management (admin only) (TESTED & VERIFIED)
router.get('/schools/:schoolId/themes', authorize(['admin', 'super_admin']), getCustomThemesBySchool);  
router.post('/custom', authorize(['admin', 'super_admin']), createCustomTheme);  
router.get('/custom/:id', getThemeById);  
router.put('/custom/:id', authorize(['admin', 'super_admin']), updateCustomTheme);  
router.delete('/custom/:id', authorize(['admin', 'super_admin']), deleteCustomTheme);  
router.post('/custom/:id/clone', authorize(['admin', 'super_admin']), cloneTheme);  
router.get('/custom/:id/preview', getThemePreview);  
router.get('/custom/:id/export', authorize(['admin', 'super_admin']), exportThemeConfig);  
router.post('/custom/import', authorize(['admin', 'super_admin']), importThemeConfig);  

// Theme validation (TESTED & VERIFIED)
router.post('/validate', validateThemeConfig);  

export default router;
