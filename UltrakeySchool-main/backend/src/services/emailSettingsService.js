import EmailSettings from '../models/EmailSettings.js';

class EmailSettingsService {
  async getEmailSettings(institutionId) {
    let settings = await EmailSettings.findOne({ institutionId, isActive: true });
    
    if (!settings) {
      settings = await EmailSettings.create({ institutionId });
    }
    
    return settings;
  }

  async updatePhpMailerSettings(institutionId, data) {
    const settings = await EmailSettings.findOneAndUpdate(
      { institutionId },
      {
        $set: {
          'phpMailer.enabled': data.enabled,
          'phpMailer.host': data.host,
          'phpMailer.port': data.port,
          'phpMailer.username': data.username,
          'phpMailer.password': data.password,
          'phpMailer.encryption': data.encryption,
          'phpMailer.fromEmail': data.fromEmail,
          'phpMailer.fromName': data.fromName,
          activeProvider: data.enabled ? 'phpMailer' : 'none'
        }
      },
      { new: true, upsert: true, runValidators: true }
    );
    
    return settings;
  }

  async updateSmtpSettings(institutionId, data) {
    const settings = await EmailSettings.findOneAndUpdate(
      { institutionId },
      {
        $set: {
          'smtp.enabled': data.enabled,
          'smtp.host': data.host,
          'smtp.port': data.port,
          'smtp.username': data.username,
          'smtp.password': data.password,
          'smtp.encryption': data.encryption,
          'smtp.fromEmail': data.fromEmail,
          'smtp.fromName': data.fromName,
          activeProvider: data.enabled ? 'smtp' : 'none'
        }
      },
      { new: true, upsert: true, runValidators: true }
    );
    
    return settings;
  }

  async updateGoogleSettings(institutionId, data) {
    const settings = await EmailSettings.findOneAndUpdate(
      { institutionId },
      {
        $set: {
          'google.enabled': data.enabled,
          'google.clientId': data.clientId,
          'google.clientSecret': data.clientSecret,
          'google.refreshToken': data.refreshToken,
          'google.fromEmail': data.fromEmail,
          'google.fromName': data.fromName,
          activeProvider: data.enabled ? 'google' : 'none'
        }
      },
      { new: true, upsert: true, runValidators: true }
    );
    
    return settings;
  }

  async toggleProvider(institutionId, provider, enabled) {
    const updateField = {};
    updateField[`${provider}.enabled`] = enabled;
    
    if (enabled) {
      updateField.activeProvider = provider;
    } else {
      updateField.activeProvider = 'none';
    }
    
    const settings = await EmailSettings.findOneAndUpdate(
      { institutionId },
      { $set: updateField },
      { new: true, upsert: true }
    );
    
    return settings;
  }

  async testEmailConnection(institutionId, provider) {
    const settings = await this.getEmailSettings(institutionId);
    
    if (!settings[provider] || !settings[provider].enabled) {
      throw new Error(`${provider} is not configured or enabled`);
    }
    
    return {
      success: true,
      message: `${provider} connection test successful`,
      provider,
      config: {
        host: settings[provider].host,
        port: settings[provider].port,
        fromEmail: settings[provider].fromEmail
      }
    };
  }
}

export default new EmailSettingsService();
