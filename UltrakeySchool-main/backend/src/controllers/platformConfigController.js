import PlatformConfig from '../models/PlatformConfig.js';
import logger from '../utils/logger.js';

// Get a single platform config by key
export const getConfig = async (req, res) => {
  try {
    const { key } = req.params;
    const config = await PlatformConfig.findOne({ key });
    if (!config) {
      return res.status(404).json({ success: false, message: 'Config not found' });
    }
    return res.json({ success: true, data: config });
  } catch (error) {
    logger.error('Error fetching platform config:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Get all platform configs
export const getAllConfigs = async (req, res) => {
  try {
    const configs = await PlatformConfig.find().sort({ key: 1 });
    return res.json({ success: true, data: configs });
  } catch (error) {
    logger.error('Error fetching platform configs:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Set (create or update) a platform config
export const setConfig = async (req, res) => {
  try {
    const { key, value, description } = req.body;
    if (!key) {
      return res.status(400).json({ success: false, message: 'Key is required' });
    }

    const config = await PlatformConfig.findOneAndUpdate(
      { key: key.trim() },
      {
        $set: {
          value,
          description: description || '',
          updatedBy: req.user?.id,
        },
      },
      { upsert: true, new: true }
    );

    logger.info(`Platform config updated: ${key}`);
    return res.json({ success: true, data: config, message: 'Config saved successfully' });
  } catch (error) {
    logger.error('Error setting platform config:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Delete a platform config
export const deleteConfig = async (req, res) => {
  try {
    const { key } = req.params;
    await PlatformConfig.findOneAndDelete({ key });
    logger.info(`Platform config deleted: ${key}`);
    return res.json({ success: true, message: 'Config deleted successfully' });
  } catch (error) {
    logger.error('Error deleting platform config:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Get Razorpay config (convenience)
export const getRazorpayConfig = async (req, res) => {
  try {
    const keyIdDoc = await PlatformConfig.findOne({ key: 'razorpay_key_id' });
    const keySecretDoc = await PlatformConfig.findOne({ key: 'razorpay_key_secret' });

    return res.json({
      success: true,
      data: {
        key_id: keyIdDoc?.value || process.env.RAZORPAY_KEY_ID || '',
        key_secret: keySecretDoc?.value || process.env.RAZORPAY_KEY_SECRET || '',
      },
    });
  } catch (error) {
    logger.error('Error fetching Razorpay config:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Set Razorpay config (convenience)
export const setRazorpayConfig = async (req, res) => {
  try {
    const { key_id, key_secret, description } = req.body;
    const userId = req.user?.id;

    if (key_id) {
      await PlatformConfig.findOneAndUpdate(
        { key: 'razorpay_key_id' },
        { $set: { value: key_id, description: description || 'Razorpay Key ID', updatedBy: userId } },
        { upsert: true, new: true }
      );
    }
    if (key_secret) {
      await PlatformConfig.findOneAndUpdate(
        { key: 'razorpay_key_secret' },
        { $set: { value: key_secret, description: description || 'Razorpay Key Secret', updatedBy: userId } },
        { upsert: true, new: true }
      );
    }

    logger.info('Razorpay platform config updated');
    return res.json({
      success: true,
      data: { key_id, key_secret: key_secret ? '••••••' : '' },
      message: 'Razorpay keys saved successfully',
    });
  } catch (error) {
    logger.error('Error setting Razorpay config:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
