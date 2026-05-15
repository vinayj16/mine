import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/authGuard.js';
import settingsController from '../controllers/settingsController.js';
import EmailSettings from '../models/EmailSettings.js';
import Settings from '../models/Settings.js';
import ConnectedApp from '../models/ConnectedApp.js';

const {
  getSettings,
  updateCompanySettings,
  updateCompanyImages,
  updateLocalization,
  updatePrefixes,
  updatePreferences,
  deleteSettings,
  getMaintenanceMode,
  toggleMaintenanceMode,
  getLaunchDate,
  updateLaunchDate
} = settingsController;

const router = express.Router();

// Public route for launch date (no authentication required) (TESTED & VERIFIED)
router.get('/launch-date', settingsController.getLaunchDate);  

// Apply authentication to all other routes (TESTED & VERIFIED)
router.use(protect);  

// Email Templates Routes - All data from database (TESTED & VERIFIED)
router.get('/email-templates', async (req, res) => {  
  try {
    const templates = await EmailSettings.find({ tenantId: req.tenantId });
    res.json({ success: true, data: templates });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch email templates', error: error.message });
  }
});

router.post('/email-templates', authorize(['admin', 'principal']), async (req, res) => {  
  try {
    const newTemplate = new EmailSettings({
      ...req.body,
      tenantId: req.tenantId,
      status: 'Active'
    });
    await newTemplate.save();
    res.status(201).json({ success: true, data: newTemplate });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create email template', error: error.message });
  }
});

router.put('/email-templates/:id', authorize(['admin', 'principal']), async (req, res) => {  
  try {
    const template = await EmailSettings.findOneAndUpdate(
      { _id: req.params.id, tenantId: req.tenantId },
      req.body,
      { new: true, runValidators: true }
    );
    if (!template) {
      return res.status(404).json({ success: false, message: 'Template not found' });
    }
    res.json({ success: true, data: template });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update email template', error: error.message });
  }
});

router.delete('/email-templates/:id', authorize(['admin', 'principal']), async (req, res) => {  
  try {
    const template = await EmailSettings.findOneAndDelete({
      _id: req.params.id,
      tenantId: req.tenantId
    });
    if (!template) {
      return res.status(404).json({ success: false, message: 'Template not found' });
    }
    res.json({ success: true, message: 'Template deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete email template', error: error.message });
  }
});

// Connected Apps Routes - All data from database (TESTED & VERIFIED)
router.get('/connected-apps', async (req, res) => {  
  try {
    const apps = await ConnectedApp.find({ 
      $or: [
        { tenantId: req.tenantId },
        { isGlobal: true }
      ]
    }).sort({ name: 1 });
    
    res.json({ 
      success: true, 
      data: { apps } 
    });
  } catch (error) {
    console.error('Error fetching connected apps:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch connected apps', 
      error: error.message 
    });
  }
});

router.post('/connected-apps/:appId/connect', async (req, res) => {  
  try {
    const { appId } = req.params;
    const { credentials } = req.body;
    
    const app = await ConnectedApp.findOne({ 
      _id: appId,
      $or: [
        { tenantId: req.tenantId },
        { isGlobal: true }
      ]
    });
    
    if (!app) {
      return res.status(404).json({ 
        success: false, 
        message: 'App not found' 
      });
    }
    
    app.isConnected = true;
    app.connectedAt = new Date();
    app.connectedBy = req.user.id;
    if (credentials) {
      app.credentials = credentials;
    }
    
    await app.save();
    
    res.json({ 
      success: true, 
      message: 'App connected successfully',
      data: { app } 
    });
  } catch (error) {
    console.error('Error connecting app:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to connect app', 
      error: error.message 
    });
  }
});

router.post('/connected-apps/:appId/disconnect',  async (req, res) => {  
  try {
    const { appId } = req.params;
    
    const app = await ConnectedApp.findOne({ 
      _id: appId,
      tenantId: req.tenantId
    });
    
    if (!app) {
      return res.status(404).json({ 
        success: false, 
        message: 'App not found' 
      });
    }
    
    app.isConnected = false;
    app.connectedAt = null;
    app.connectedBy = null;
    app.credentials = null;
    
    await app.save();
    
    res.json({ 
      success: true, 
      message: 'App disconnected successfully',
      data: { app } 
    });
  } catch (error) {
    console.error('Error disconnecting app:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to disconnect app', 
      error: error.message 
    });
  }
});

// Notification Preferences Routes - All data from database (TESTED & VERIFIED)
router.get('/notification-preferences',  async (req, res) => {  
  try {
    let settings = await Settings.findOne({ 
      tenantId: req.tenantId, 
      userId: req.user.id,
      type: 'notification_preferences' 
    });
    
    if (!settings) {
      // Return default preferences
      const defaultPreferences = {
        emailNotifications: true,
        newsAndUpdates: true,
        tipsAndTutorials: false,
        offersAndPromotions: false,
        moreActivity: true,
        allReminders: true,
        activityOnly: false,
        importantRemindersOnly: false
      };
      
      return res.json({ 
        success: true, 
        data: { preferences: defaultPreferences } 
      });
    }
    
    res.json({ 
      success: true, 
      data: { preferences: settings.data } 
    });
  } catch (error) {
    console.error('Error fetching notification preferences:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch notification preferences', 
      error: error.message 
    });
  }
});

router.put('/notification-preferences',  async (req, res) => {  
  try {
    const settings = await Settings.findOneAndUpdate(
      { 
        tenantId: req.tenantId, 
        userId: req.user.id,
        type: 'notification_preferences' 
      },
      { 
        data: req.body, 
        updatedAt: new Date() 
      },
      { 
        new: true, 
        upsert: true, 
        runValidators: true 
      }
    );
    
    res.json({ 
      success: true, 
      message: 'Notification preferences updated successfully',
      data: { preferences: settings.data } 
    });
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update notification preferences', 
      error: error.message 
    });
  }
});


// Security Settings Routes - All data from database (TESTED & VERIFIED)
router.get('/security',  async (req, res) => {  
  try {
    const user = await req.user;
    
    res.json({
      success: true,
      data: {
        settings: {
          twoFactorEnabled: user.twoFactorEnabled || false,
          googleAuthEnabled: user.googleAuthEnabled || false,
          phoneNumber: user.phone || '',
          phoneVerified: user.phoneVerified || false,
          email: user.email || '',
          emailVerified: user.emailVerified || false
        }
      }
    });
  } catch (error) {
    console.error('Error fetching security settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch security settings',
      error: error.message
    });
  }
});

router.post('/security/deactivate',  async (req, res) => {  
  try {
    // Deactivate user account
    req.user.status = 'inactive';
    req.user.deactivatedAt = new Date();
    await req.user.save();
    
    res.json({
      success: true,
      message: 'Account deactivated successfully'
    });
  } catch (error) {
    console.error('Error deactivating account:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to deactivate account',
      error: error.message
    });
  }
});

router.delete('/security/delete',  async (req, res) => {  
  try {
    // Soft delete user account
    req.user.status = 'deleted';
    req.user.deletedAt = new Date();
    await req.user.save();
    
    res.json({
      success: true,
      message: 'Account deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting account:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete account',
      error: error.message
    });
  }
});

// General Settings Routes (TESTED & VERIFIED)
router.get('/', getSettings);  
router.put('/company', authorize(['admin', 'principal']), updateCompanySettings);  
router.put('/company/images', authorize(['admin', 'principal']), updateCompanyImages);  
router.put('/localization', authorize(['admin', 'principal']), updateLocalization);  
router.put('/prefixes', authorize(['admin', 'principal']), updatePrefixes);  
router.put('/preferences', authorize(['admin', 'principal']), updatePreferences);  
router.delete('/', authorize(['super_admin']), deleteSettings);  
router.get('/maintenance', getMaintenanceMode);  
router.patch('/maintenance', authorize(['admin', 'principal']), toggleMaintenanceMode);  
router.put('/launch-date', authorize(['admin', 'principal']), updateLaunchDate);  

// Scheduled Maintenance Routes - All data from database (TESTED & VERIFIED)
router.get('/maintenance/scheduled',  async (req, res) => {  
  try {
    const maintenanceList = await Settings.find({ tenantId: req.tenantId, type: 'scheduled_maintenance' }).sort({ 'data.date': 1 });
    const data = maintenanceList.map(item => ({ id: item._id, ...item.data }));
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch scheduled maintenance', error: error.message });
  }
});

router.post('/maintenance/scheduled',  authorize(['admin']), async (req, res) => {  
  try {
    const newMaintenance = new Settings({
      tenantId: req.tenantId,
      type: 'scheduled_maintenance',
      data: req.body
    });
    await newMaintenance.save();
    res.status(201).json({ success: true, data: { id: newMaintenance._id, ...newMaintenance.data }, message: 'Scheduled maintenance created successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create scheduled maintenance', error: error.message });
  }
});

router.put('/maintenance/scheduled/:id',  authorize(['admin']), async (req, res) => {  
  try {
    const maintenance = await Settings.findOneAndUpdate(
      { _id: req.params.id, tenantId: req.tenantId, type: 'scheduled_maintenance' },
      { data: req.body, updatedAt: new Date() },
      { new: true, runValidators: true }
    );
    if (!maintenance) {
      return res.status(404).json({ success: false, message: 'Scheduled maintenance not found' });
    }
    res.json({ success: true, data: { id: maintenance._id, ...maintenance.data }, message: 'Scheduled maintenance updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update scheduled maintenance', error: error.message });
  }
});

router.delete('/maintenance/scheduled/:id',  authorize(['admin']), async (req, res) => {  
  try {
    const maintenance = await Settings.findOneAndDelete({
      _id: req.params.id,
      tenantId: req.tenantId,
      type: 'scheduled_maintenance'
    });
    if (!maintenance) {
      return res.status(404).json({ success: false, message: 'Scheduled maintenance not found' });
    }
    res.json({ success: true, message: 'Scheduled maintenance deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete scheduled maintenance', error: error.message });
  }
});

export default router;
