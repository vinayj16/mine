import emailSettingsService from '../services/emailSettingsService.js';

const getEmailSettings = async (req, res) => {
  try {
    const institutionId = req.user?.institutionId || req.query.institutionId || '507f1f77bcf86cd799439011';
    
    const settings = await emailSettingsService.getEmailSettings(institutionId);
    
    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const updatePhpMailerSettings = async (req, res) => {
  try {
    const institutionId = req.user?.institutionId || req.body.institutionId || '507f1f77bcf86cd799439011';
    
    const settings = await emailSettingsService.updatePhpMailerSettings(institutionId, req.body);
    
    res.json({
      success: true,
      message: 'PHP Mailer settings updated successfully',
      data: settings
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

const updateSmtpSettings = async (req, res) => {
  try {
    const institutionId = req.user?.institutionId || req.body.institutionId || '507f1f77bcf86cd799439011';
    
    const settings = await emailSettingsService.updateSmtpSettings(institutionId, req.body);
    
    res.json({
      success: true,
      message: 'SMTP settings updated successfully',
      data: settings
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

const updateGoogleSettings = async (req, res) => {
  try {
    const institutionId = req.user?.institutionId || req.body.institutionId || '507f1f77bcf86cd799439011';
    
    const settings = await emailSettingsService.updateGoogleSettings(institutionId, req.body);
    
    res.json({
      success: true,
      message: 'Google settings updated successfully',
      data: settings
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

const toggleProvider = async (req, res) => {
  try {
    const institutionId = req.user?.institutionId || req.body.institutionId || '507f1f77bcf86cd799439011';
    const { provider, enabled } = req.body;
    
    if (!['phpMailer', 'smtp', 'google'].includes(provider)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid provider'
      });
    }
    
    const settings = await emailSettingsService.toggleProvider(institutionId, provider, enabled);
    
    res.json({
      success: true,
      message: `${provider} ${enabled ? 'enabled' : 'disabled'} successfully`,
      data: settings
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

const testEmailConnection = async (req, res) => {
  try {
    const institutionId = req.user?.institutionId || req.query.institutionId || '507f1f77bcf86cd799439011';
    const { provider } = req.params;
    
    const result = await emailSettingsService.testEmailConnection(institutionId, provider);
    
    res.json(result);
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};


export default {
  getEmailSettings,
  updatePhpMailerSettings,
  updateSmtpSettings,
  updateGoogleSettings,
  toggleProvider,
  testEmailConnection
};
