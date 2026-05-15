import express from 'express';
import * as oauthController from '../controllers/oauthController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes (no authentication required)
router.get('/google/url', oauthController.default.getGoogleAuthUrl);
router.get('/google/callback', oauthController.default.googleCallback);
router.get('/microsoft/url', oauthController.default.getMicrosoftAuthUrl);
router.get('/microsoft/callback', oauthController.default.microsoftCallback);

// Protected routes (authentication required)
router.use(protect);

router.post('/link', oauthController.default.linkAccount);
router.delete('/unlink/:provider', oauthController.default.unlinkAccount);
router.get('/linked', oauthController.default.getLinkedAccounts);

export default router;
