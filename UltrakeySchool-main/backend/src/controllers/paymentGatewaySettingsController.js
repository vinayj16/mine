import PaymentGatewaySettings from '../models/PaymentGatewaySettings.js';
import { successResponse, createdResponse, errorResponse, validationErrorResponse, notFoundResponse } from '../utils/apiResponse.js';
import logger from '../utils/logger.js';
import mongoose from 'mongoose';

// Validation constants
const VALID_GATEWAY_NAMES = [
  'paypal', 'stripe', 'braintree', 'authorize.net', 'razorpay', 
  'payoneer', 'apple-pay', '2checkout', 'skrill', 'paytm', 
  'payu', 'midtrans', 'pytorch', 'bank-transfer', 'cash-on-delivery'
];
const VALID_EXPORT_FORMATS = ['json', 'csv', 'xlsx', 'pdf'];

// Helper function to validate MongoDB ObjectId
const validateObjectId = (id, fieldName = 'ID') => {
  if (!id) {
    return fieldName + ' is required';
  }
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return 'Invalid ' + fieldName + ' format';
  }
  return null;
};

// Helper function to get default gateways
function getDefaultGateways() {
  return [
    {
      name: 'paypal',
      displayName: 'PayPal',
      description: 'PayPal is the faster, safer way to send and receive money or make an online payment.',
      logo: '/assets/img/payment-gateway/payment-gateway-01.svg',
      isEnabled: false,
      isConnected: false
    },
    {
      name: 'stripe',
      displayName: 'Stripe',
      description: 'APIs to accept credit cards, manage subscriptions, send money.',
      logo: '/assets/img/payment-gateway/payment-gateway-02.svg',
      isEnabled: false,
      isConnected: false
    },
    {
      name: 'braintree',
      displayName: 'Braintree',
      description: 'Braintree offers more fraud protection and security features.',
      logo: '/assets/img/payment-gateway/payment-gateway-03.svg',
      isEnabled: false,
      isConnected: false
    },
    {
      name: 'authorize.net',
      displayName: 'Authorize.net',
      description: 'Works stably and reliably and features are valuable and necessary for any software.',
      logo: '/assets/img/payment-gateway/payment-gateway-04.svg',
      isEnabled: false,
      isConnected: false
    },
    {
      name: 'razorpay',
      displayName: 'Razorpay',
      description: 'Razorpay is a comprehensive payment gateway and financial solutions provider in India.',
      logo: '/assets/img/payment-gateway/payment-gateway-05.svg',
      isEnabled: false,
      isConnected: false
    },
    {
      name: 'payoneer',
      displayName: 'Payoneer',
      description: 'Allows send international money transfers and payments quickly with low fees.',
      logo: '/assets/img/payment-gateway/payment-gateway-06.svg',
      isEnabled: false,
      isConnected: false
    },
    {
      name: 'apple-pay',
      displayName: 'Apple Pay',
      description: 'Replaces your physical cards and cash with an easier, safer, more private and secure',
      logo: '/assets/img/payment-gateway/payment-gateway-07.svg',
      isEnabled: false,
      isConnected: false
    },
    {
      name: '2checkout',
      displayName: '2Checkout',
      description: 'Fast, Low-Cost Solution for your International Business.',
      logo: '/assets/img/payment-gateway/payment-gateway-08.svg',
      isEnabled: false,
      isConnected: false
    },
    {
      name: 'skrill',
      displayName: 'Skrill',
      description: 'Provide payment solution to individuals to make payments using credit card.',
      logo: '/assets/img/payment-gateway/payment-gateway-09.svg',
      isEnabled: false,
      isConnected: false
    },
    {
      name: 'paytm',
      displayName: 'Paytm',
      description: 'Paytm stands for Pay through mobile and it is India\'s largest mobile payments.',
      logo: '/assets/img/payment-gateway/payment-gateway-10.svg',
      isEnabled: false,
      isConnected: false
    },
    {
      name: 'payu',
      displayName: 'PayU',
      description: 'Online payment platform that enables to send and receive money via emails.',
      logo: '/assets/img/payment-gateway/payment-gateway-11.svg',
      isEnabled: false,
      isConnected: false
    },
    {
      name: 'midtrans',
      displayName: 'Midtrans',
      description: 'Midtrans provides the maximum number of payment methods across payment gateways.',
      logo: '/assets/img/payment-gateway/payment-gateway-12.svg',
      isEnabled: false,
      isConnected: false
    },
    {
      name: 'pytorch',
      displayName: 'PyTorch',
      description: 'PyTorch is a network through which your customers transfer funds to you.',
      logo: '/assets/img/payment-gateway/payment-gateway-13.svg',
      isEnabled: false,
      isConnected: false
    },
    {
      name: 'bank-transfer',
      displayName: 'Bank Transfer',
      description: 'Direct transfer of funds from one bank account into another.',
      logo: '/assets/img/payment-gateway/payment-gateway-14.svg',
      isEnabled: false,
      isConnected: false
    },
    {
      name: 'cash-on-delivery',
      displayName: 'Cash on Delivery',
      description: 'Indicating that goods must be paid for at the time of delivery.',
      logo: '/assets/img/payment-gateway/payment-gateway-15.svg',
      isEnabled: false,
      isConnected: false
    }
  ];
}

// Get all payment gateway settings
const getAllSettings = async (req, res) => {
  try {
    logger.info('Fetching all payment gateway settings');
    
    const { page, limit, isEnabled, isConnected } = req.query;
    const tenantId = req.tenantId;
    
    // Validation
    const errors = [];
    
    if (!tenantId) {
      errors.push('Tenant information is required');
    }
    
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 20;
    
    if (pageNum < 1) {
      errors.push('Page must be greater than 0');
    }
    
    if (limitNum < 1 || limitNum > 100) {
      errors.push('Limit must be between 1 and 100');
    }
    
    if (isEnabled !== undefined && isEnabled !== 'true' && isEnabled !== 'false') {
      errors.push('isEnabled must be true or false');
    }
    
    if (isConnected !== undefined && isConnected !== 'true' && isConnected !== 'false') {
      errors.push('isConnected must be true or false');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const filter = { tenantId };
    if (isEnabled !== undefined) filter.isEnabled = isEnabled === 'true';
    if (isConnected !== undefined) filter.isConnected = isConnected === 'true';
    
    const skip = (pageNum - 1) * limitNum;
    
    const [settings, total] = await Promise.all([
      PaymentGatewaySettings.find(filter).skip(skip).limit(limitNum).sort({ name: 1 }),
      PaymentGatewaySettings.countDocuments(filter)
    ]);
    
    // If no settings exist, create default ones
    if (settings.length === 0 && !isEnabled && !isConnected) {
      const defaultGateways = getDefaultGateways();
      const gatewaySettings = defaultGateways.map(gateway => ({
        ...gateway,
        tenantId
      }));
      
      await PaymentGatewaySettings.insertMany(gatewaySettings);
      const newSettings = await PaymentGatewaySettings.find({ tenantId }).sort({ name: 1 });
      
      logger.info('Default payment gateway settings created');
      return successResponse(res, {
        settings: newSettings,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: newSettings.length,
          totalPages: Math.ceil(newSettings.length / limitNum)
        }
      }, 'Payment gateway settings retrieved successfully');
    }
    
    logger.info('Payment gateway settings fetched successfully');
    return successResponse(res, {
      settings,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    }, 'Payment gateway settings retrieved successfully');
  } catch (error) {
    logger.error('Error fetching payment gateway settings:', error);
    return errorResponse(res, error.message);
  }
};

// Get payment gateway setting by ID
const getSettingById = async (req, res) => {
  try {
    logger.info('Fetching payment gateway setting by ID');
    
    const { id } = req.params;
    const tenantId = req.tenantId;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'Setting ID');
    if (idError) errors.push(idError);
    
    if (!tenantId) {
      errors.push('Tenant information is required');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const setting = await PaymentGatewaySettings.findOne({ _id: id, tenantId });
    
    if (!setting) {
      return notFoundResponse(res, 'Payment gateway setting not found');
    }
    
    logger.info('Payment gateway setting fetched successfully:', { settingId: id });
    return successResponse(res, setting, 'Payment gateway setting retrieved successfully');
  } catch (error) {
    logger.error('Error fetching payment gateway setting:', error);
    return errorResponse(res, error.message);
  }
};

// Get payment gateway setting by name
const getSettingByName = async (req, res) => {
  try {
    logger.info('Fetching payment gateway setting by name');
    
    const { name } = req.params;
    const tenantId = req.tenantId;
    
    // Validation
    const errors = [];
    
    if (!name || name.trim().length === 0) {
      errors.push('Gateway name is required');
    } else if (!VALID_GATEWAY_NAMES.includes(name.toLowerCase())) {
      errors.push('Invalid gateway name. Must be one of: ' + VALID_GATEWAY_NAMES.join(', '));
    }
    
    if (!tenantId) {
      errors.push('Tenant information is required');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const setting = await PaymentGatewaySettings.findOne({ name: name.toLowerCase(), tenantId });
    
    if (!setting) {
      return notFoundResponse(res, 'Payment gateway setting not found');
    }
    
    logger.info('Payment gateway setting fetched successfully by name:', { name });
    return successResponse(res, setting, 'Payment gateway setting retrieved successfully');
  } catch (error) {
    logger.error('Error fetching payment gateway setting by name:', error);
    return errorResponse(res, error.message);
  }
};

// Create payment gateway setting
const createSetting = async (req, res) => {
  try {
    logger.info('Creating payment gateway setting');
    
    const { name, displayName, description, apiKey, apiSecret, webhookSecret, isEnabled, isConnected } = req.body;
    const tenantId = req.tenantId;
    
    // Validation
    const errors = [];
    
    if (!tenantId) {
      errors.push('Tenant information is required');
    }
    
    if (!name || name.trim().length === 0) {
      errors.push('Gateway name is required');
    } else if (!VALID_GATEWAY_NAMES.includes(name.toLowerCase())) {
      errors.push('Invalid gateway name. Must be one of: ' + VALID_GATEWAY_NAMES.join(', '));
    }
    
    if (!displayName || displayName.trim().length === 0) {
      errors.push('Display name is required');
    } else if (displayName.length > 100) {
      errors.push('Display name must not exceed 100 characters');
    }
    
    if (description && description.length > 500) {
      errors.push('Description must not exceed 500 characters');
    }
    
    if (apiKey && apiKey.length > 500) {
      errors.push('API key must not exceed 500 characters');
    }
    
    if (apiSecret && apiSecret.length > 500) {
      errors.push('API secret must not exceed 500 characters');
    }
    
    if (webhookSecret && webhookSecret.length > 500) {
      errors.push('Webhook secret must not exceed 500 characters');
    }
    
    if (isEnabled !== undefined && typeof isEnabled !== 'boolean') {
      errors.push('isEnabled must be a boolean value');
    }
    
    if (isConnected !== undefined && typeof isConnected !== 'boolean') {
      errors.push('isConnected must be a boolean value');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    // Check for duplicate
    const existingSetting = await PaymentGatewaySettings.findOne({
      name: name.toLowerCase(),
      tenantId
    });
    
    if (existingSetting) {
      return validationErrorResponse(res, ['Payment gateway setting with this name already exists']);
    }
    
    const setting = new PaymentGatewaySettings({
      ...req.body,
      name: name.toLowerCase(),
      tenantId
    });
    
    await setting.save();
    
    logger.info('Payment gateway setting created successfully:', { settingId: setting._id });
    return createdResponse(res, setting, 'Payment gateway setting created successfully');
  } catch (error) {
    logger.error('Error creating payment gateway setting:', error);
    return errorResponse(res, error.message);
  }
};

// Update payment gateway setting
const updateSetting = async (req, res) => {
  try {
    logger.info('Updating payment gateway setting');
    
    const { id } = req.params;
    const { displayName, description, apiKey, apiSecret, webhookSecret, isEnabled, isConnected, config } = req.body;
    const tenantId = req.tenantId;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'Setting ID');
    if (idError) errors.push(idError);
    
    if (!tenantId) {
      errors.push('Tenant information is required');
    }
    
    if (displayName !== undefined) {
      if (!displayName || displayName.trim().length === 0) {
        errors.push('Display name cannot be empty');
      } else if (displayName.length > 100) {
        errors.push('Display name must not exceed 100 characters');
      }
    }
    
    if (description !== undefined && description.length > 500) {
      errors.push('Description must not exceed 500 characters');
    }
    
    if (apiKey !== undefined && apiKey.length > 500) {
      errors.push('API key must not exceed 500 characters');
    }
    
    if (apiSecret !== undefined && apiSecret.length > 500) {
      errors.push('API secret must not exceed 500 characters');
    }
    
    if (webhookSecret !== undefined && webhookSecret.length > 500) {
      errors.push('Webhook secret must not exceed 500 characters');
    }
    
    if (isEnabled !== undefined && typeof isEnabled !== 'boolean') {
      errors.push('isEnabled must be a boolean value');
    }
    
    if (isConnected !== undefined && typeof isConnected !== 'boolean') {
      errors.push('isConnected must be a boolean value');
    }
    
    if (config !== undefined && (typeof config !== 'object' || Array.isArray(config))) {
      errors.push('Config must be an object');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const setting = await PaymentGatewaySettings.findOneAndUpdate(
      { _id: id, tenantId },
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!setting) {
      return notFoundResponse(res, 'Payment gateway setting not found');
    }
    
    logger.info('Payment gateway setting updated successfully:', { settingId: id });
    return successResponse(res, setting, 'Payment gateway setting updated successfully');
  } catch (error) {
    logger.error('Error updating payment gateway setting:', error);
    return errorResponse(res, error.message);
  }
};

// Delete payment gateway setting
const deleteSetting = async (req, res) => {
  try {
    logger.info('Deleting payment gateway setting');
    
    const { id } = req.params;
    const tenantId = req.tenantId;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'Setting ID');
    if (idError) errors.push(idError);
    
    if (!tenantId) {
      errors.push('Tenant information is required');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const setting = await PaymentGatewaySettings.findOneAndDelete({ _id: id, tenantId });
    
    if (!setting) {
      return notFoundResponse(res, 'Payment gateway setting not found');
    }
    
    logger.info('Payment gateway setting deleted successfully:', { settingId: id });
    return successResponse(res, null, 'Payment gateway setting deleted successfully');
  } catch (error) {
    logger.error('Error deleting payment gateway setting:', error);
    return errorResponse(res, error.message);
  }
};

// Enable payment gateway
const enableGateway = async (req, res) => {
  try {
    logger.info('Enabling payment gateway');
    
    const { id } = req.params;
    const tenantId = req.tenantId;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'Setting ID');
    if (idError) errors.push(idError);
    
    if (!tenantId) {
      errors.push('Tenant information is required');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const setting = await PaymentGatewaySettings.findOneAndUpdate(
      { _id: id, tenantId },
      { isEnabled: true },
      { new: true }
    );
    
    if (!setting) {
      return notFoundResponse(res, 'Payment gateway setting not found');
    }
    
    logger.info('Payment gateway enabled successfully:', { settingId: id });
    return successResponse(res, setting, 'Payment gateway enabled successfully');
  } catch (error) {
    logger.error('Error enabling payment gateway:', error);
    return errorResponse(res, error.message);
  }
};

// Disable payment gateway
const disableGateway = async (req, res) => {
  try {
    logger.info('Disabling payment gateway');
    
    const { id } = req.params;
    const tenantId = req.tenantId;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'Setting ID');
    if (idError) errors.push(idError);
    
    if (!tenantId) {
      errors.push('Tenant information is required');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const setting = await PaymentGatewaySettings.findOneAndUpdate(
      { _id: id, tenantId },
      { isEnabled: false },
      { new: true }
    );
    
    if (!setting) {
      return notFoundResponse(res, 'Payment gateway setting not found');
    }
    
    logger.info('Payment gateway disabled successfully:', { settingId: id });
    return successResponse(res, setting, 'Payment gateway disabled successfully');
  } catch (error) {
    logger.error('Error disabling payment gateway:', error);
    return errorResponse(res, error.message);
  }
};

// Test gateway connection
const testConnection = async (req, res) => {
  try {
    logger.info('Testing payment gateway connection');
    
    const { id } = req.params;
    const tenantId = req.tenantId;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'Setting ID');
    if (idError) errors.push(idError);
    
    if (!tenantId) {
      errors.push('Tenant information is required');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const setting = await PaymentGatewaySettings.findOne({ _id: id, tenantId });
    
    if (!setting) {
      return notFoundResponse(res, 'Payment gateway setting not found');
    }
    
    // Simulate connection test (in real implementation, this would test actual gateway connection)
    const isConnected = setting.apiKey && setting.apiSecret;
    
    await PaymentGatewaySettings.findByIdAndUpdate(id, {
      isConnected,
      lastTestedAt: new Date()
    });
    
    logger.info('Payment gateway connection tested:', { settingId: id, isConnected });
    return successResponse(res, { isConnected, testedAt: new Date() }, 'Connection test completed');
  } catch (error) {
    logger.error('Error testing payment gateway connection:', error);
    return errorResponse(res, error.message);
  }
};

// Get enabled gateways
const getEnabledGateways = async (req, res) => {
  try {
    logger.info('Fetching enabled payment gateways');
    
    const tenantId = req.tenantId;
    
    // Validation
    const errors = [];
    
    if (!tenantId) {
      errors.push('Tenant information is required');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const settings = await PaymentGatewaySettings.find({
      tenantId,
      isEnabled: true
    }).sort({ name: 1 });
    
    logger.info('Enabled payment gateways fetched successfully');
    return successResponse(res, settings, 'Enabled gateways retrieved successfully');
  } catch (error) {
    logger.error('Error fetching enabled payment gateways:', error);
    return errorResponse(res, error.message);
  }
};

// Initialize default gateways
const initializeDefaults = async (req, res) => {
  try {
    logger.info('Initializing default payment gateways');
    
    const tenantId = req.tenantId;
    
    // Validation
    const errors = [];
    
    if (!tenantId) {
      errors.push('Tenant information is required');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    // Check if settings already exist
    const existingCount = await PaymentGatewaySettings.countDocuments({ tenantId });
    
    if (existingCount > 0) {
      return validationErrorResponse(res, ['Payment gateway settings already exist for this tenant']);
    }
    
    const defaultGateways = getDefaultGateways();
    const gatewaySettings = defaultGateways.map(gateway => ({
      ...gateway,
      tenantId
    }));
    
    await PaymentGatewaySettings.insertMany(gatewaySettings);
    const settings = await PaymentGatewaySettings.find({ tenantId }).sort({ name: 1 });
    
    logger.info('Default payment gateways initialized successfully');
    return createdResponse(res, settings, 'Default payment gateways initialized successfully');
  } catch (error) {
    logger.error('Error initializing default payment gateways:', error);
    return errorResponse(res, error.message);
  }
};

// Export all functions
export default {
  getAllSettings,
  getSettingById,
  getSettingByName,
  createSetting,
  updateSetting,
  deleteSetting,
  enableGateway,
  disableGateway,
  testConnection,
  getEnabledGateways,
  initializeDefaults
};
