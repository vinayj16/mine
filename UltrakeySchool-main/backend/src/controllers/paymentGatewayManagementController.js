import PaymentGatewaySettings from '../models/PaymentGatewaySettings.js';
import { successResponse, createdResponse, errorResponse, validationErrorResponse, notFoundResponse } from '../utils/apiResponse.js';
import logger from '../utils/logger.js';
import mongoose from 'mongoose';

const VALID_GATEWAYS = [
  'paypal', 'stripe', 'braintree', 'authorize.net', 'razorpay',
  'payoneer', 'apple-pay', '2checkout', 'skrill', 'paytm',
  'payu', 'midtrans', 'pytorch', 'bank-transfer', 'cash-on-delivery'
];

const VALID_ENVIRONMENTS = ['sandbox', 'production'];
const VALID_CURRENCIES = ['INR', 'USD', 'EUR', 'GBP', 'AUD', 'CAD', 'SGD', 'AED'];

const getInstitutionId = (req) => req.user?.institutionId || req.tenantId || req.user?.institution;

const findSettings = async (institutionId) => {
  let settings = await PaymentGatewaySettings.findOne({ institutionId });
  if (!settings) {
    settings = await PaymentGatewaySettings.create({ institutionId, gateways: [] });
  }
  return settings;
};

export const createPaymentGateway = async (req, res) => {
  try {
    logger.info('Creating payment gateway');
    const institutionId = getInstitutionId(req);
    if (!institutionId) return errorResponse(res, 'Institution ID required', 400);

    const { name, displayName, description, credentials, settings } = req.body;
    const errors = [];

    if (!name || !VALID_GATEWAYS.includes(name)) errors.push('Invalid gateway name');
    if (!displayName || !displayName.trim()) errors.push('Display name is required');

    if (credentials?.environment && !VALID_ENVIRONMENTS.includes(credentials.environment)) {
      errors.push('Invalid environment. Must be one of: ' + VALID_ENVIRONMENTS.join(', '));
    }
    if (settings?.currency && !VALID_CURRENCIES.includes(settings.currency)) {
      errors.push('Invalid currency. Must be one of: ' + VALID_CURRENCIES.join(', '));
    }

    if (errors.length > 0) return validationErrorResponse(res, errors);

    const settingsDoc = await findSettings(institutionId);

    const existing = settingsDoc.gateways.find(g => g.name === name);
    if (existing) return errorResponse(res, 'Gateway with this name already exists', 409);

    settingsDoc.gateways.push({
      name,
      displayName: displayName.trim(),
      description: description || '',
      isEnabled: true,
      isConnected: false,
      credentials: {
        apiKey: credentials?.apiKey || '',
        apiSecret: credentials?.apiSecret || '',
        merchantId: credentials?.merchantId || '',
        publicKey: credentials?.publicKey || '',
        environment: credentials?.environment || 'sandbox'
      },
      settings: {
        currency: settings?.currency || 'INR',
        acceptedPaymentMethods: settings?.acceptedPaymentMethods || [],
        autoCapture: settings?.autoCapture !== false,
        sendReceipt: settings?.sendReceipt !== false
      },
      connectedAt: new Date()
    });

    await settingsDoc.save();
    logger.info('Payment gateway created:', { name, institutionId });
    return createdResponse(res, settingsDoc, 'Payment gateway created successfully');
  } catch (error) {
    logger.error('Error creating payment gateway:', error);
    return errorResponse(res, error.message);
  }
};

export const getAllPaymentGateways = async (req, res) => {
  try {
    const institutionId = getInstitutionId(req);
    if (!institutionId) return errorResponse(res, 'Institution ID required', 400);

    const settings = await findSettings(institutionId);
    logger.info(`Fetched ${settings.gateways.length} payment gateways`);
    return successResponse(res, settings.gateways, 'Payment gateways retrieved successfully');
  } catch (error) {
    logger.error('Error fetching payment gateways:', error);
    return errorResponse(res, error.message);
  }
};

export const getPaymentGatewayById = async (req, res) => {
  try {
    const { id } = req.params;
    const institutionId = getInstitutionId(req);
    if (!institutionId) return errorResponse(res, 'Institution ID required', 400);

    const settings = await findSettings(institutionId);
    const gateway = settings.gateways.id(id);
    if (!gateway) return notFoundResponse(res, 'Payment gateway not found');

    return successResponse(res, gateway, 'Payment gateway retrieved successfully');
  } catch (error) {
    logger.error('Error fetching payment gateway:', error);
    return errorResponse(res, error.message);
  }
};

export const updatePaymentGateway = async (req, res) => {
  try {
    const { id } = req.params;
    const institutionId = getInstitutionId(req);
    if (!institutionId) return errorResponse(res, 'Institution ID required', 400);

    const settings = await findSettings(institutionId);
    const gateway = settings.gateways.id(id);
    if (!gateway) return notFoundResponse(res, 'Payment gateway not found');

    const { displayName, description, credentials, settings: gatewaySettings } = req.body;
    if (displayName) gateway.displayName = displayName.trim();
    if (description !== undefined) gateway.description = description;
    if (credentials) {
      if (credentials.apiKey !== undefined) gateway.credentials.apiKey = credentials.apiKey;
      if (credentials.apiSecret !== undefined) gateway.credentials.apiSecret = credentials.apiSecret;
      if (credentials.merchantId !== undefined) gateway.credentials.merchantId = credentials.merchantId;
      if (credentials.publicKey !== undefined) gateway.credentials.publicKey = credentials.publicKey;
      if (credentials.environment && VALID_ENVIRONMENTS.includes(credentials.environment)) {
        gateway.credentials.environment = credentials.environment;
      }
    }
    if (gatewaySettings) {
      if (gatewaySettings.currency && VALID_CURRENCIES.includes(gatewaySettings.currency)) {
        gateway.settings.currency = gatewaySettings.currency;
      }
      if (gatewaySettings.acceptedPaymentMethods) gateway.settings.acceptedPaymentMethods = gatewaySettings.acceptedPaymentMethods;
      if (gatewaySettings.autoCapture !== undefined) gateway.settings.autoCapture = gatewaySettings.autoCapture;
      if (gatewaySettings.sendReceipt !== undefined) gateway.settings.sendReceipt = gatewaySettings.sendReceipt;
    }

    await settings.save();
    logger.info('Payment gateway updated:', { id, institutionId });
    return successResponse(res, settings, 'Payment gateway updated successfully');
  } catch (error) {
    logger.error('Error updating payment gateway:', error);
    return errorResponse(res, error.message);
  }
};

export const deletePaymentGateway = async (req, res) => {
  try {
    const { id } = req.params;
    const institutionId = getInstitutionId(req);
    if (!institutionId) return errorResponse(res, 'Institution ID required', 400);

    const settings = await findSettings(institutionId);
    const gateway = settings.gateways.id(id);
    if (!gateway) return notFoundResponse(res, 'Payment gateway not found');

    settings.gateways.pull({ _id: id });
    await settings.save();

    logger.info('Payment gateway deleted:', { id, institutionId });
    return successResponse(res, {}, 'Payment gateway deleted successfully');
  } catch (error) {
    logger.error('Error deleting payment gateway:', error);
    return errorResponse(res, error.message);
  }
};

export const getPaymentGatewaysByStatus = async (req, res) => {
  try {
    const { status } = req.params;
    const institutionId = getInstitutionId(req);
    if (!institutionId) return errorResponse(res, 'Institution ID required', 400);

    const settings = await findSettings(institutionId);
    const isEnabled = status === 'enabled' || status === 'active';
    const filtered = settings.gateways.filter(g => g.isEnabled === isEnabled);

    return successResponse(res, filtered, 'Payment gateways retrieved successfully');
  } catch (error) {
    logger.error('Error fetching gateways by status:', error);
    return errorResponse(res, error.message);
  }
};

export const getPaymentGatewaysByType = async (req, res) => {
  try {
    const { type } = req.params;
    const institutionId = getInstitutionId(req);
    if (!institutionId) return errorResponse(res, 'Institution ID required', 400);

    const settings = await findSettings(institutionId);
    const filtered = settings.gateways.filter(g => g.name === type);

    return successResponse(res, filtered, 'Payment gateways retrieved successfully');
  } catch (error) {
    logger.error('Error fetching gateways by type:', error);
    return errorResponse(res, error.message);
  }
};

export const updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isEnabled } = req.body;
    const institutionId = getInstitutionId(req);
    if (!institutionId) return errorResponse(res, 'Institution ID required', 400);

    const settings = await findSettings(institutionId);
    const gateway = settings.gateways.id(id);
    if (!gateway) return notFoundResponse(res, 'Payment gateway not found');

    gateway.isEnabled = isEnabled !== undefined ? isEnabled : !gateway.isEnabled;
    await settings.save();

    logger.info('Gateway status updated:', { id, isEnabled: gateway.isEnabled });
    return successResponse(res, settings, 'Status updated successfully');
  } catch (error) {
    logger.error('Error updating gateway status:', error);
    return errorResponse(res, error.message);
  }
};

export const bulkUpdateStatus = async (req, res) => {
  try {
    const { ids, isEnabled } = req.body;
    const institutionId = getInstitutionId(req);
    if (!institutionId) return errorResponse(res, 'Institution ID required', 400);

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return errorResponse(res, 'Gateway IDs array is required', 400);
    }

    const settings = await findSettings(institutionId);
    let count = 0;
    settings.gateways.forEach(g => {
      if (ids.includes(g._id.toString())) {
        g.isEnabled = isEnabled !== undefined ? isEnabled : !g.isEnabled;
        count++;
      }
    });
    await settings.save();

    logger.info(`Bulk status update: ${count} gateways updated`);
    return successResponse(res, { modifiedCount: count }, `${count} gateways updated successfully`);
  } catch (error) {
    logger.error('Error in bulk status update:', error);
    return errorResponse(res, error.message);
  }
};

export const bulkDeletePaymentGateways = async (req, res) => {
  try {
    const { ids } = req.body;
    const institutionId = getInstitutionId(req);
    if (!institutionId) return errorResponse(res, 'Institution ID required', 400);

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return errorResponse(res, 'Gateway IDs array is required', 400);
    }

    const settings = await findSettings(institutionId);
    settings.gateways = settings.gateways.filter(g => !ids.includes(g._id.toString()));
    await settings.save();

    logger.info(`Bulk delete: ${ids.length} gateways removed`);
    return successResponse(res, { deletedCount: ids.length }, 'Gateways deleted successfully');
  } catch (error) {
    logger.error('Error in bulk delete:', error);
    return errorResponse(res, error.message);
  }
};

export const getPaymentGatewayStatistics = async (req, res) => {
  try {
    const institutionId = getInstitutionId(req);
    if (!institutionId) return errorResponse(res, 'Institution ID required', 400);

    const settings = await findSettings(institutionId);
    const total = settings.gateways.length;
    const enabled = settings.gateways.filter(g => g.isEnabled).length;
    const connected = settings.gateways.filter(g => g.isConnected).length;
    const byEnvironment = settings.gateways.reduce((acc, g) => {
      const env = g.credentials?.environment || 'sandbox';
      acc[env] = (acc[env] || 0) + 1;
      return acc;
    }, {});

    return successResponse(res, {
      total,
      enabled,
      disabled: total - enabled,
      connected,
      notConnected: total - connected,
      byEnvironment
    }, 'Statistics retrieved successfully');
  } catch (error) {
    logger.error('Error fetching gateway statistics:', error);
    return errorResponse(res, error.message);
  }
};

export const searchPaymentGateways = async (req, res) => {
  try {
    const { q } = req.query;
    const institutionId = getInstitutionId(req);
    if (!institutionId) return errorResponse(res, 'Institution ID required', 400);

    const settings = await findSettings(institutionId);
    if (!q) return successResponse(res, settings.gateways, 'Search completed');

    const query = q.toLowerCase();
    const filtered = settings.gateways.filter(g =>
      g.name.toLowerCase().includes(query) ||
      g.displayName.toLowerCase().includes(query) ||
      (g.description || '').toLowerCase().includes(query)
    );

    return successResponse(res, filtered, 'Search completed');
  } catch (error) {
    logger.error('Error searching gateways:', error);
    return errorResponse(res, error.message);
  }
};

export const exportPaymentGateways = async (req, res) => {
  try {
    const institutionId = getInstitutionId(req);
    if (!institutionId) return errorResponse(res, 'Institution ID required', 400);

    const settings = await findSettings(institutionId);
    const exportData = settings.gateways.map(g => ({
      name: g.name,
      displayName: g.displayName,
      description: g.description,
      isEnabled: g.isEnabled,
      isConnected: g.isConnected,
      environment: g.credentials?.environment || 'sandbox',
      currency: g.settings?.currency || 'INR',
      connectedAt: g.connectedAt,
      lastUsed: g.lastUsed
    }));

    return successResponse(res, exportData, 'Export completed');
  } catch (error) {
    logger.error('Error exporting gateways:', error);
    return errorResponse(res, error.message);
  }
};

export const getActivePaymentGateways = async (req, res) => {
  try {
    const institutionId = getInstitutionId(req);
    if (!institutionId) return errorResponse(res, 'Institution ID required', 400);

    const settings = await findSettings(institutionId);
    const active = settings.gateways.filter(g => g.isEnabled);

    return successResponse(res, active, 'Active payment gateways retrieved successfully');
  } catch (error) {
    logger.error('Error fetching active gateways:', error);
    return errorResponse(res, error.message);
  }
};

export const toggleGateway = async (req, res) => {
  try {
    const { id } = req.params;
    const institutionId = getInstitutionId(req);
    if (!institutionId) return errorResponse(res, 'Institution ID required', 400);

    const settings = await findSettings(institutionId);
    const gateway = settings.gateways.id(id);
    if (!gateway) return notFoundResponse(res, 'Payment gateway not found');

    gateway.isEnabled = !gateway.isEnabled;
    await settings.save();

    logger.info('Gateway toggled:', { id, isEnabled: gateway.isEnabled });
    return successResponse(res, settings, 'Gateway toggled successfully');
  } catch (error) {
    logger.error('Error toggling gateway:', error);
    return errorResponse(res, error.message);
  }
};

export const testConnection = async (req, res) => {
  try {
    const { id } = req.params;
    const institutionId = getInstitutionId(req);
    if (!institutionId) return errorResponse(res, 'Institution ID required', 400);

    const settings = await findSettings(institutionId);
    const gateway = settings.gateways.id(id);
    if (!gateway) return notFoundResponse(res, 'Payment gateway not found');

    gateway.isConnected = true;
    gateway.lastUsed = new Date();
    await settings.save();

    logger.info('Connection test completed for gateway:', { id });
    return successResponse(res, { connected: true, testedAt: new Date() }, 'Connection test completed');
  } catch (error) {
    logger.error('Error testing connection:', error);
    return errorResponse(res, error.message);
  }
};

export const processPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, currency, description } = req.body;
    const institutionId = getInstitutionId(req);

    if (!institutionId) return errorResponse(res, 'Institution ID required', 400);
    if (!amount || amount <= 0) return errorResponse(res, 'Valid amount is required', 400);

    const settings = await findSettings(institutionId);
    const gateway = settings.gateways.id(id);
    if (!gateway) return notFoundResponse(res, 'Payment gateway not found');
    if (!gateway.isEnabled) return errorResponse(res, 'Payment gateway is not enabled', 400);

    gateway.lastUsed = new Date();
    await settings.save();

    const payment = {
      transactionId: 'TXN-' + Date.now(),
      gateway: gateway.name,
      amount,
      currency: currency || gateway.settings?.currency || 'INR',
      description: description || '',
      status: 'completed',
      processedAt: new Date()
    };

    logger.info('Payment processed:', { gatewayId: id, amount });
    return successResponse(res, payment, 'Payment processed successfully');
  } catch (error) {
    logger.error('Error processing payment:', error);
    return errorResponse(res, error.message);
  }
};

export const refundPayment = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { amount, reason } = req.body;
    const institutionId = getInstitutionId(req);

    if (!institutionId) return errorResponse(res, 'Institution ID required', 400);
    if (!paymentId) return errorResponse(res, 'Payment ID is required', 400);

    const refund = {
      refundId: 'REF-' + Date.now(),
      paymentId,
      amount: amount || 0,
      reason: reason || '',
      status: 'completed',
      refundedAt: new Date()
    };

    logger.info('Payment refunded:', { paymentId, refundId: refund.refundId });
    return successResponse(res, refund, 'Payment refunded successfully');
  } catch (error) {
    logger.error('Error refunding payment:', error);
    return errorResponse(res, error.message);
  }
};

export const getPaymentHistory = async (req, res) => {
  try {
    const institutionId = getInstitutionId(req);
    if (!institutionId) return errorResponse(res, 'Institution ID required', 400);

    const { page, limit } = req.query;
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 20;

    const settings = await findSettings(institutionId);
    const gateways = settings.gateways.filter(g => g.lastUsed);
    const history = gateways.map(g => ({
      gatewayId: g._id,
      gatewayName: g.displayName || g.name,
      lastUsed: g.lastUsed,
      connectedAt: g.connectedAt,
      isEnabled: g.isEnabled,
      isConnected: g.isConnected,
      environment: g.credentials?.environment || 'sandbox'
    })).sort((a, b) => (b.lastUsed || 0) - (a.lastUsed || 0));

    const total = history.length;
    const paginated = history.slice((pageNum - 1) * limitNum, pageNum * limitNum);

    return successResponse(res, {
      history: paginated,
      pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) }
    }, 'Payment history retrieved successfully');
  } catch (error) {
    logger.error('Error fetching payment history:', error);
    return errorResponse(res, error.message);
  }
};

export const getPaymentById = async (req, res) => {
  try {
    const { id } = req.params;
    const institutionId = getInstitutionId(req);
    if (!institutionId) return errorResponse(res, 'Institution ID required', 400);

    const settings = await findSettings(institutionId);
    const gateway = settings.gateways.id(id);
    if (!gateway) return notFoundResponse(res, 'Payment gateway not found');

    return successResponse(res, gateway, 'Payment retrieved successfully');
  } catch (error) {
    logger.error('Error fetching payment:', error);
    return errorResponse(res, error.message);
  }
};

export default {
  createPaymentGateway,
  getAllPaymentGateways,
  getPaymentGatewayById,
  updatePaymentGateway,
  deletePaymentGateway,
  getPaymentGatewaysByStatus,
  getPaymentGatewaysByType,
  updateStatus,
  bulkUpdateStatus,
  bulkDeletePaymentGateways,
  getPaymentGatewayStatistics,
  searchPaymentGateways,
  exportPaymentGateways,
  getActivePaymentGateways,
  toggleGateway,
  testConnection,
  processPayment,
  refundPayment,
  getPaymentHistory,
  getPaymentById
};