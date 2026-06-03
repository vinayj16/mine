import express from 'express';
import { authenticate } from '../middleware/authGuard.js';
import emailSettingsService from '../services/emailSettingsService.js';

const router = express.Router();

router.use(authenticate);

router.get('/', async (req, res) => {
  try {
    const institutionId = req.query.institutionId || req.user.institutionId;
    if (!institutionId) {
      return res.status(400).json({ success: false, message: 'Institution ID is required' });
    }
    const settings = await emailSettingsService.getEmailSettings(institutionId);
    res.json({ success: true, data: settings });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch email settings', error: error.message });
  }
});

router.put('/smtp', async (req, res) => {
  try {
    const institutionId = req.body.institutionId || req.user.institutionId;
    if (!institutionId) {
      return res.status(400).json({ success: false, message: 'Institution ID is required' });
    }
    const settings = await emailSettingsService.updateSmtpSettings(institutionId, req.body);
    res.json({ success: true, data: settings, message: 'SMTP settings updated' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update SMTP settings', error: error.message });
  }
});

router.put('/phpmailer', async (req, res) => {
  try {
    const institutionId = req.body.institutionId || req.user.institutionId;
    if (!institutionId) {
      return res.status(400).json({ success: false, message: 'Institution ID is required' });
    }
    const settings = await emailSettingsService.updatePhpMailerSettings(institutionId, req.body);
    res.json({ success: true, data: settings, message: 'PHPMailer settings updated' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update PHPMailer settings', error: error.message });
  }
});

router.put('/google', async (req, res) => {
  try {
    const institutionId = req.body.institutionId || req.user.institutionId;
    if (!institutionId) {
      return res.status(400).json({ success: false, message: 'Institution ID is required' });
    }
    const settings = await emailSettingsService.updateGoogleSettings(institutionId, req.body);
    res.json({ success: true, data: settings, message: 'Google settings updated' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update Google settings', error: error.message });
  }
});

router.post('/toggle', async (req, res) => {
  try {
    const { institutionId, provider, enabled } = req.body;
    const id = institutionId || req.user.institutionId;
    if (!id || !provider) {
      return res.status(400).json({ success: false, message: 'Institution ID and provider are required' });
    }
    const settings = await emailSettingsService.toggleProvider(id, provider, enabled);
    res.json({ success: true, data: settings, message: `Provider ${enabled ? 'enabled' : 'disabled'}` });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to toggle provider', error: error.message });
  }
});

router.get('/test/:provider', async (req, res) => {
  try {
    const institutionId = req.query.institutionId || req.user.institutionId;
    if (!institutionId) {
      return res.status(400).json({ success: false, message: 'Institution ID is required' });
    }
    const result = await emailSettingsService.testEmailConnection(institutionId, req.params.provider);
    res.json({ success: true, data: result, message: result.message });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Connection test failed' });
  }
});

export default router;
