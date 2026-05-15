import Settings from '../models/Settings.js';

class SettingsService {
  async getSettings(institutionId) {
    let settings = await Settings.findOne({ institutionId, isActive: true })
      .populate('institutionId', 'name type');
    
    if (!settings) {
      settings = await Settings.create({ institutionId });
    }
    
    return settings;
  }

  async updateCompanySettings(institutionId, data) {
    const settings = await Settings.findOneAndUpdate(
      { institutionId },
      {
        $set: {
          companyName: data.companyName,
          companyEmail: data.companyEmail,
          companyPhone: data.companyPhone,
          faxNumber: data.faxNumber,
          website: data.website,
          'address.street': data.address?.street,
          'address.city': data.address?.city,
          'address.state': data.address?.state,
          'address.country': data.address?.country,
          'address.postalCode': data.address?.postalCode
        }
      },
      { new: true, upsert: true, runValidators: true }
    );
    
    return settings;
  }

  async updateCompanyImages(institutionId, imageType, imageData) {
    const updateField = {};
    updateField[imageType] = imageData;
    
    const settings = await Settings.findOneAndUpdate(
      { institutionId },
      { $set: updateField },
      { new: true, upsert: true }
    );
    
    return settings;
  }

  async updateLocalization(institutionId, data) {
    const settings = await Settings.findOneAndUpdate(
      { institutionId },
      {
        $set: {
          timezone: data.timezone,
          dateFormat: data.dateFormat,
          timeFormat: data.timeFormat,
          'currency.code': data.currency?.code,
          'currency.symbol': data.currency?.symbol,
          'currency.position': data.currency?.position,
          language: data.language
        }
      },
      { new: true, upsert: true, runValidators: true }
    );
    
    return settings;
  }

  async updatePrefixes(institutionId, prefixes) {
    const settings = await Settings.findOneAndUpdate(
      { institutionId },
      { $set: { prefixes } },
      { new: true, upsert: true, runValidators: true }
    );
    
    return settings;
  }

  async updatePreferences(institutionId, preferences) {
    const settings = await Settings.findOneAndUpdate(
      { institutionId },
      {
        $set: {
          emailNotifications: preferences.emailNotifications,
          smsNotifications: preferences.smsNotifications,
          maintenanceMode: preferences.maintenanceMode
        }
      },
      { new: true, upsert: true }
    );
    
    return settings;
  }

  async getMaintenanceMode(institutionId) {
    const settings = await Settings.findOne({ institutionId, isActive: true });
    return {
      maintenanceMode: settings?.maintenanceMode || false,
      message: settings?.maintenanceMode 
        ? 'System is currently under maintenance' 
        : 'System is operational'
    };
  }

  async toggleMaintenanceMode(institutionId, enabled) {
    const settings = await Settings.findOneAndUpdate(
      { institutionId },
      { $set: { maintenanceMode: enabled } },
      { new: true, upsert: true }
    );
    
    return settings;
  }

  async deleteSettings(institutionId) {
    const settings = await Settings.findOneAndUpdate(
      { institutionId },
      { isActive: false },
      { new: true }
    );
    
    if (!settings) {
      throw new Error('Settings not found');
    }
    
    return settings;
  }
}

export default new SettingsService();
