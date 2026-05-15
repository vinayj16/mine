import express from 'express';
import authController from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';
import {
  validateRegister,
  validateLogin,
  validatePasswordChange,
  validateRefreshToken
} from '../middleware/authValidation.js';
import {
  loginLimiter,
  registerLimiter,
  refreshTokenLimiter
} from '../middleware/authRateLimiter.js';

const router = express.Router();

// Public routes (TESTED & VERIFIED)
router.post('/register', registerLimiter, validateRegister, authController.register);  
router.post('/login', loginLimiter, validateLogin, authController.login);  
router.post('/refresh-token', refreshTokenLimiter, validateRefreshToken, authController.refreshToken);  
router.post('/refresh', refreshTokenLimiter, validateRefreshToken, authController.refreshToken);  
router.post('/create-account-request', authController.createAccountRequest);  

// Protected routes (TESTED & VERIFIED)
router.post('/logout', protect, authController.logout);  
router.post('/change-password', protect, validatePasswordChange, authController.changePassword);  
router.get('/profile', protect, authController.getProfile);  
router.put('/profile', protect, authController.updateProfile);  
router.get('/me', protect, authController.getProfile);  

export default router;
