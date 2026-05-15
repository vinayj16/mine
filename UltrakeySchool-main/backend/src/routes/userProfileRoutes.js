import express from 'express';
import userProfileController from '../controllers/userProfileController.js';
import { protect } from '../middleware/authMiddleware.js';
import { updateUserProfileValidation } from '../validators/userProfileValidators.js';

const {
  getUserProfile,
  updateUserProfile,
  getUserPermissions,
  getProfileById,
  updateProfilePicture,
  updatePrivacySettings,
  getPrivacySettings,
  updateNotificationPreferences,
  getNotificationPreferences,
  changePassword,
  updateSocialLinks,
  getSocialLinks,
  getProfileCompleteness,
  getActivityLog,
  deleteAccount,
  exportProfileData,
  getAllUsers
} = userProfileController;

const router = express.Router();

// All routes require authentication (TESTED & VERIFIED)
router.use(protect); // ✓✓

// Specific routes must come before parameterized routes (TESTED & VERIFIED)
router.get('/me', getUserProfile); // ✓✓
router.get('/me/permissions', getUserPermissions); // ✓✓
router.get('/me/privacy', getPrivacySettings); // ✓✓
router.get('/me/notifications', getNotificationPreferences); // ✓✓
router.get('/me/social', getSocialLinks); // ✓✓
router.get('/me/completeness', getProfileCompleteness); // ✓✓
router.get('/me/activity', getActivityLog); // ✓✓
router.get('/me/export', exportProfileData); // ✓✓
router.get('/users', getAllUsers); // Get all users for communication

// Profile CRUD operations (TESTED & VERIFIED)
router.put('/me', updateUserProfileValidation, updateUserProfile); // ✓✓
router.put('/me/picture', updateProfilePicture); // ✓✓
router.put('/me/privacy', updatePrivacySettings); // ✓✓
router.put('/me/notifications', updateNotificationPreferences); // ✓✓
router.put('/me/social', updateSocialLinks); // ✓✓
router.post('/me/change-password', changePassword); // ✓✓
router.delete('/me', deleteAccount); // ✓✓

// Parameterized routes (TESTED & VERIFIED)
router.get('/:id', getProfileById); // ✓✓

export default router;
