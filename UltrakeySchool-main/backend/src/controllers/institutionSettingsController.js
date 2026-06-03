import mongoose from 'mongoose';
import Institution from '../models/Institution.js';
import EmailSettings from '../models/EmailSettings.js';
import PaymentGatewaySettings from '../models/PaymentGatewaySettings.js';
import { successResponse, errorResponse, validationErrorResponse, notFoundResponse } from '../utils/apiResponse.js';
import logger from '../utils/logger.js';

const isValidInstitutionId = (id) => {
  if (!id) return false;
  if (typeof id === 'string' && id.startsWith('inst-')) return true;
  return mongoose.Types.ObjectId.isValid(id);
};

// GET /institution/:id/settings
export const getInstitutionSettings = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidInstitutionId(id)) return validationErrorResponse(res, ['Invalid institution id']);

    const institution = await Institution.findById(id).lean();
    if (!institution) return notFoundResponse(res, 'Institution not found');

    const [emailSettings, paymentGateways] = await Promise.all([
      EmailSettings.findOne({ institutionId: id }).lean(),
      PaymentGatewaySettings.findOne({ institutionId: id }).lean()
    ]);

    return successResponse(res, {
      profile: {
        name: institution.name,
        code: institution.instituteCode || institution.code,
        type: institution.type,
        email: institution.contact?.email,
        phone: institution.contact?.phone,
        website: institution.contact?.website,
        address: institution.contact?.address,
        principalName: institution.principalName,
        principalEmail: institution.principalEmail,
        principalPhone: institution.principalPhone,
        status: institution.status
      },
      branding: institution.branding || {},
      email: emailSettings ? {
        activeProvider: emailSettings.activeProvider,
        isActive: emailSettings.isActive,
        smtp: emailSettings.smtp ? { ...emailSettings.smtp, password: emailSettings.smtp.password ? '********' : '' } : null,
        phpMailer: emailSettings.phpMailer ? { ...emailSettings.phpMailer, password: emailSettings.phpMailer.password ? '********' : '' } : null,
        google: emailSettings.google ? { ...emailSettings.google, clientSecret: emailSettings.google.clientSecret ? '********' : '', refreshToken: emailSettings.google.refreshToken ? '********' : '' } : null
      } : { activeProvider: 'none', isActive: false },
      paymentGateways: paymentGateways ? paymentGateways.gateways.map(g => ({
        _id: g._id,
        name: g.name,
        displayName: g.displayName,
        description: g.description,
        logo: g.logo,
        isEnabled: g.isEnabled,
        isConnected: g.isConnected,
        publicKey: g.credentials?.publicKey,
        environment: g.credentials?.environment,
        hasApiKey: !!g.credentials?.apiKey,
        hasApiSecret: !!g.credentials?.apiSecret,
        hasMerchantId: !!g.credentials?.merchantId,
        hasWebhookSecret: !!g.credentials?.webhookSecret
      })) : [],
      support: institution.support || { email: institution.contact?.email, phone: institution.contact?.phone, helpdeskUrl: '', hours: '' },
      loginActivity: institution.loginActivity || { dailyLogins: [], totalLogins: 0, lastLoginAt: null, uniqueLoginsLast30Days: 0 }
    }, 'Institution settings retrieved');
  } catch (error) {
    logger.error('getInstitutionSettings error:', error);
    return errorResponse(res, 'Failed to retrieve institution settings', 500);
  }
};


// PUT /institution/:id/profile
export const updateInstitutionProfile = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidInstitutionId(id)) return validationErrorResponse(res, ['Invalid institution id']);

    const allowed = ['name', 'contact', 'principalName', 'principalEmail', 'principalPhone', 'adminContact', 'description', 'established', 'type', 'category'];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }
    if (Object.keys(updates).length === 0) return validationErrorResponse(res, ['No valid fields provided']);

    const institution = await Institution.findByIdAndUpdate(id, updates, { new: true });
    if (!institution) return notFoundResponse(res, 'Institution not found');
    return successResponse(res, institution, 'Profile updated');
  } catch (error) {
    logger.error('updateInstitutionProfile error:', error);
    return errorResponse(res, 'Failed to update profile', 500);
  }
};

// PUT /institution/:id/branding
export const updateBranding = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidInstitutionId(id)) return validationErrorResponse(res, ['Invalid institution id']);

    const allowed = ['logo', 'favicon', 'emailHeaderLogo', 'primaryColor', 'secondaryColor', 'fontFamily', 'customCSS'];
    const branding = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) branding[key] = req.body[key];
    }
    if (Object.keys(branding).length === 0) return validationErrorResponse(res, ['No branding fields provided']);

    const setObj = {};
    for (const [k, v] of Object.entries(branding)) setObj[`branding.${k}`] = v;

    const institution = await Institution.findByIdAndUpdate(id, { $set: setObj }, { new: true });
    if (!institution) return notFoundResponse(res, 'Institution not found');
    return successResponse(res, institution.branding, 'Branding updated');
  } catch (error) {
    logger.error('updateBranding error:', error);
    return errorResponse(res, 'Failed to update branding', 500);
  }
};

// GET /institution/:id/branding  (public, used by login screen & email headers)
export const getPublicBranding = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidInstitutionId(id)) return validationErrorResponse(res, ['Invalid institution id']);

    const institution = await Institution.findById(id).select('name shortName instituteCode branding support').lean();
    if (!institution) return notFoundResponse(res, 'Institution not found');
    return successResponse(res, {
      name: institution.name,
      shortName: institution.shortName,
      instituteCode: institution.instituteCode,
      branding: institution.branding || {},
      support: institution.support || null
    }, 'Branding retrieved');
  } catch (error) {
    logger.error('getPublicBranding error:', error);
    return errorResponse(res, 'Failed to retrieve branding', 500);
  }
};

// PUT /institution/:id/email-config
export const updateEmailConfig = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidInstitutionId(id)) return validationErrorResponse(res, ['Invalid institution id']);

    const { smtp, phpMailer, google, activeProvider, isActive } = req.body;
    const update = { institutionId: id };
    if (smtp) update.smtp = smtp;
    if (phpMailer) update.phpMailer = phpMailer;
    if (google) update.google = google;
    if (activeProvider) update.activeProvider = activeProvider;
    if (isActive !== undefined) update.isActive = isActive;

    const settings = await EmailSettings.findOneAndUpdate(
      { institutionId: id },
      { $set: update },
      { new: true, upsert: true }
    );
    return successResponse(res, { activeProvider: settings.activeProvider, isActive: settings.isActive }, 'Email configuration updated');
  } catch (error) {
    logger.error('updateEmailConfig error:', error);
    return errorResponse(res, 'Failed to update email config', 500);
  }
};

// PUT /institution/:id/payment-gateway
export const updatePaymentGateway = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidInstitutionId(id)) return validationErrorResponse(res, ['Invalid institution id']);

    const { gateway, action } = req.body;
    if (!gateway || !gateway.name) return validationErrorResponse(res, ['Gateway name is required']);

    let doc = await PaymentGatewaySettings.findOne({ institutionId: id });
    if (!doc) {
      doc = new PaymentGatewaySettings({ institutionId: id, gateways: [] });
    }

    if (action === 'delete') {
      doc.gateways = doc.gateways.filter(g => g.name !== gateway.name);
    } else {
      const existing = doc.gateways.find(g => g.name === gateway.name);
      const merged = {
        name: gateway.name,
        displayName: gateway.displayName || (existing && existing.displayName) || gateway.name,
        description: gateway.description !== undefined ? gateway.description : (existing && existing.description),
        logo: gateway.logo !== undefined ? gateway.logo : (existing && existing.logo),
        isEnabled: gateway.isEnabled !== undefined ? gateway.isEnabled : (existing && existing.isEnabled) || false,
        isConnected: gateway.isConnected !== undefined ? gateway.isConnected : (existing && existing.isConnected) || false,
        credentials: {
          apiKey: (gateway.credentials && gateway.credentials.apiKey) || (existing && existing.credentials && existing.credentials.apiKey),
          apiSecret: (gateway.credentials && gateway.credentials.apiSecret) || (existing && existing.credentials && existing.credentials.apiSecret),
          merchantId: (gateway.credentials && gateway.credentials.merchantId) || (existing && existing.credentials && existing.credentials.merchantId),
          publicKey: (gateway.credentials && gateway.credentials.publicKey) || (existing && existing.credentials && existing.credentials.publicKey),
          webhookSecret: (gateway.credentials && gateway.credentials.webhookSecret) || (existing && existing.credentials && existing.credentials.webhookSecret),
          environment: (gateway.credentials && gateway.credentials.environment) || (existing && existing.credentials && existing.credentials.environment) || 'sandbox'
        },
        settings: (gateway.settings) || (existing && existing.settings) || { currency: 'INR' }
      };
      Object.keys(merged.credentials).forEach(k => merged.credentials[k] === undefined && delete merged.credentials[k]);
      const idx = doc.gateways.findIndex(g => g.name === gateway.name);
      if (idx >= 0) doc.gateways[idx] = merged;
      else doc.gateways.push(merged);
    }
    await doc.save();
    return successResponse(res, doc.gateways, 'Payment gateway updated');
  } catch (error) {
    logger.error('updatePaymentGateway error:', error);
    return errorResponse(res, 'Failed to update payment gateway', 500);
  }
};

// PUT /institution/:id/support
export const updateSupport = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidInstitutionId(id)) return validationErrorResponse(res, ['Invalid institution id']);

    const allowed = ['email', 'phone', 'helpdeskUrl', 'hours', 'whatsapp', 'telegram', 'address'];
    const support = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) support[key] = req.body[key];
    }
    if (Object.keys(support).length === 0) return validationErrorResponse(res, ['No support fields provided']);

    const setObj = {};
    for (const [k, v] of Object.entries(support)) setObj[`support.${k}`] = v;

    const institution = await Institution.findByIdAndUpdate(id, { $set: setObj }, { new: true });
    if (!institution) return notFoundResponse(res, 'Institution not found');
    return successResponse(res, institution.support, 'Support info updated');
  } catch (error) {
    logger.error('updateSupport error:', error);
    return errorResponse(res, 'Failed to update support info', 500);
  }
};

// GET /institution/:id/login-activity
export const getLoginActivity = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidInstitutionId(id)) return validationErrorResponse(res, ['Invalid institution id']);

    const institution = await Institution.findById(id).select('loginActivity').lean();
    if (!institution) return notFoundResponse(res, 'Institution not found');
    return successResponse(res, institution.loginActivity || { dailyLogins: [], totalLogins: 0, lastLoginAt: null, uniqueLoginsLast30Days: 0 }, 'Login activity retrieved');
  } catch (error) {
    logger.error('getLoginActivity error:', error);
    return errorResponse(res, 'Failed to retrieve login activity', 500);
  }
};

// POST /institution/:id/track-login
// Called by auth service after login so the institution can see daily unique logins.
export const trackLogin = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidInstitutionId(id)) return validationErrorResponse(res, ['Invalid institution id']);

    const userId = req.body.userId || (req.user && req.user.id);
    const userName = req.body.userName || (req.user && req.user.name);
    const userRole = req.body.userRole || (req.user && req.user.role);
    if (!userId) return validationErrorResponse(res, ['userId is required']);

    const today = new Date();
    const dayKey = today.toISOString().slice(0, 10);

    const institution = await Institution.findById(id);
    if (!institution) return notFoundResponse(res, 'Institution not found');

    if (!institution.loginActivity) {
      institution.loginActivity = { dailyLogins: [], totalLogins: 0, lastLoginAt: null, uniqueLoginsLast30Days: 0 };
    }
    if (!Array.isArray(institution.loginActivity.dailyLogins)) {
      institution.loginActivity.dailyLogins = [];
    }

    let day = institution.loginActivity.dailyLogins.find(d => d.date === dayKey);
    if (!day) {
      day = { date: dayKey, count: 0, users: [] };
      institution.loginActivity.dailyLogins.push(day);
    }
    if (!day.users.find(u => u.userId === String(userId))) {
      day.count += 1;
      day.users.push({ userId: String(userId), name: userName, role: userRole, timestamp: today });
    }

    institution.loginActivity.totalLogins = (institution.loginActivity.totalLogins || 0) + 1;
    institution.loginActivity.lastLoginAt = today;

    const cutoff = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    institution.loginActivity.dailyLogins = institution.loginActivity.dailyLogins.filter(d => d.date >= cutoff);

    const cutoff30 = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const userSet = new Set();
    institution.loginActivity.dailyLogins.filter(d => d.date >= cutoff30).forEach(d => d.users.forEach(u => userSet.add(u.userId)));
    institution.loginActivity.uniqueLoginsLast30Days = userSet.size;

    await institution.save();

    return successResponse(res, institution.loginActivity, 'Login tracked');
  } catch (error) {
    logger.error('trackLogin error:', error);
    return errorResponse(res, 'Failed to track login', 500);
  }
};
