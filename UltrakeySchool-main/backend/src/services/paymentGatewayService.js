import Stripe from 'stripe';
import axios from 'axios';
import crypto from 'crypto';
import Razorpay from 'razorpay';
import Payment from '../models/Payment.js';
import Institution from '../models/Institution.js';
import logger from '../utils/logger.js';

class PaymentGatewayService {
  constructor() {
    // Initialize Stripe
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_dummy');
    
    // Razorpay will be lazily initialized from DB platform config
    this.razorpay = null;
    this._loadPromise = null;
    
    // PayU configuration
    this.payuConfig = {
      merchantKey: process.env.PAYU_MERCHANT_KEY || 'dummy_key',
      merchantSalt: process.env.PAYU_MERCHANT_SALT || 'dummy_salt',
      baseUrl: process.env.PAYU_BASE_URL || 'https://test.payu.in/_payment',
    };
    
    // Initiate background load of platform keys
    this._ensurePlatformKeys();
  }

  /**
   * Load platform Razorpay keys from DB (with env var fallback)
   */
  async _ensurePlatformKeys() {
    if (this.razorpay) return;
    if (this._loadPromise) return this._loadPromise;
    
    this._loadPromise = (async () => {
      try {
        const { default: PlatformConfig } = await import('../models/PlatformConfig.js');
        const keyIdDoc = await PlatformConfig.findOne({ key: 'razorpay_key_id' }).lean();
        const keySecretDoc = await PlatformConfig.findOne({ key: 'razorpay_key_secret' }).lean();
        
        // .env takes priority over PlatformConfig DB
        const keyId = process.env.RAZORPAY_KEY_ID || keyIdDoc?.value || 'rzp_test_dummy';
        const keySecret = process.env.RAZORPAY_KEY_SECRET || keySecretDoc?.value || 'secret_dummy';
        
        this.razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
        
        if (keyIdDoc?.value) {
          logger.info('Razorpay initialized from PlatformConfig DB');
        } else if (process.env.RAZORPAY_KEY_ID) {
          logger.info('Razorpay initialized from environment variables');
        }
      } catch (err) {
        logger.warn('Could not load platform Razorpay keys from DB, using env fallback:', err.message);
        this.razorpay = new Razorpay({
          key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_dummy',
          key_secret: process.env.RAZORPAY_KEY_SECRET || 'secret_dummy',
        });
      }
    })();
    
    return this._loadPromise;
  }

  /**
   * Get the platform Razorpay public key ID for frontend checkout
   */
  async getPlatformRazorpayKeyId() {
    await this._ensurePlatformKeys();
    // .env takes priority
    if (process.env.RAZORPAY_KEY_ID) return process.env.RAZORPAY_KEY_ID;
    try {
      const { default: PlatformConfig } = await import('../models/PlatformConfig.js');
      const keyIdDoc = await PlatformConfig.findOne({ key: 'razorpay_key_id' }).lean();
      return keyIdDoc?.value || 'rzp_test_dummy';
    } catch {
      return process.env.RAZORPAY_KEY_ID || 'rzp_test_dummy';
    }
  }

  /**
   * Get platform Razorpay instance (for subscription/superadmin payments)
   */
  async getPlatformRazorpay() {
    await this._ensurePlatformKeys();
    return this.razorpay;
  }

  /**
   * Create an institution-scoped Razorpay instance using the institution's
   * saved payment gateway credentials.
   * Falls back to the global platform keys if none are configured.
   */
  async getInstitutionRazorpay(institutionId) {
    await this._ensurePlatformKeys();
    try {
      const inst = await Institution.findById(institutionId).select('settings.payment-gateway').lean();
      const pgSettings = inst?.settings?.['payment-gateway'];
      
      if (pgSettings?.enabled && pgSettings?.provider === 'razorpay') {
        const keyId = pgSettings.razorpay?.keyId || pgSettings.apiKey || pgSettings.merchantId;
        const keySecret = pgSettings.razorpay?.keySecret || pgSettings.apiSecret;
        if (keyId && keySecret) {
          return new Razorpay({ key_id: keyId, key_secret: keySecret });
        }
      }
      
      return this.razorpay;
    } catch {
      return this.razorpay;
    }
  }

  /**
   * Get the institution's or platform's Razorpay public key for the frontend checkout
   */
  async getInstitutionRazorpayKeyId(institutionId) {
    await this._ensurePlatformKeys();
    try {
      const inst = await Institution.findById(institutionId).select('settings.payment-gateway').lean();
      const pgSettings = inst?.settings?.['payment-gateway'];
      
      if (pgSettings?.enabled && pgSettings?.provider === 'razorpay') {
        const keyId = pgSettings.razorpay?.keyId || pgSettings.apiKey || pgSettings.merchantId;
        if (keyId) return keyId;
      }
      
      // Fallback - .env takes priority over DB
      if (process.env.RAZORPAY_KEY_ID) return process.env.RAZORPAY_KEY_ID;
      const { default: PlatformConfig } = await import('../models/PlatformConfig.js');
      const keyIdDoc = await PlatformConfig.findOne({ key: 'razorpay_key_id' }).lean();
      return keyIdDoc?.value || 'rzp_test_dummy';
    } catch {
      return process.env.RAZORPAY_KEY_ID || 'rzp_test_dummy';
    }
  }

  // ─── Stripe Methods ─────────────────────────────────────────────────────

  async createStripePayment(paymentData) {
    try {
      const { amount, currency, metadata, customerId } = paymentData;
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(amount * 100),
        currency: currency || 'usd',
        metadata: metadata || {},
        customer: customerId,
        automatic_payment_methods: { enabled: true },
      });
      logger.info(`Stripe payment intent created: ${paymentIntent.id}`);
      return {
        paymentId: paymentIntent.id,
        clientSecret: paymentIntent.client_secret,
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency,
        status: paymentIntent.status,
      };
    } catch (error) {
      logger.error(`Stripe payment error: ${error.message}`);
      throw new Error(`Stripe payment failed: ${error.message}`);
    }
  }

  async verifyStripePayment(paymentIntentId) {
    try {
      const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId);
      return {
        success: paymentIntent.status === 'succeeded',
        status: paymentIntent.status,
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency,
        paymentMethod: paymentIntent.payment_method,
      };
    } catch (error) {
      logger.error(`Stripe verification error: ${error.message}`);
      throw new Error(`Stripe verification failed: ${error.message}`);
    }
  }

  async createStripeCustomer(customerData) {
    try {
      const { email, name, phone, metadata } = customerData;
      const customer = await this.stripe.customers.create({ email, name, phone, metadata: metadata || {} });
      logger.info(`Stripe customer created: ${customer.id}`);
      return customer;
    } catch (error) {
      logger.error(`Stripe customer creation error: ${error.message}`);
      throw new Error(`Failed to create Stripe customer: ${error.message}`);
    }
  }

  // ─── Razorpay Methods ───────────────────────────────────────────────────

  async createRazorpayOrder(orderData) {
    await this._ensurePlatformKeys();
    try {
      const { amount, currency, receipt, notes, razorpayInstance } = orderData;
      const rp = razorpayInstance || this.razorpay;

      if (!amount || amount <= 0) {
        throw new Error(`Invalid amount: ${amount}`);
      }

      const paiseAmount = Math.round(amount * 100);
      logger.info(`Creating Razorpay order: amount=${amount} INR (${paiseAmount} paise)`);

      const order = await rp.orders.create({
        amount: paiseAmount,
        currency: currency || 'INR',
        receipt: receipt || `receipt_${Date.now()}`,
        notes: notes || {},
      });

      logger.info(`Razorpay order created: ${order.id}`);
      return {
        orderId: order.id,
        amount: order.amount / 100,
        currency: order.currency,
        receipt: order.receipt,
      };
    } catch (error) {
      const errorMsg = error.message || error.error?.description || error.error?.reason || JSON.stringify(error);
      logger.error(`Razorpay order error: ${errorMsg}`, { statusCode: error.statusCode, error: error.error });
      throw new Error(`Razorpay order failed: ${errorMsg}`);
    }
  }

  async verifyRazorpayPayment(verificationData) {
    await this._ensurePlatformKeys();
    try {
      const { orderId, paymentId, signature, razorpayInstance } = verificationData;
      const rp = razorpayInstance || this.razorpay;

      const generatedSignature = crypto
        .createHmac('sha256', rp.key_secret)
        .update(`${orderId}|${paymentId}`)
        .digest('hex');

      const isValid = generatedSignature === signature;
      if (!isValid) throw new Error('Invalid payment signature');

      logger.info(`Razorpay payment verified: ${paymentId}`);
      return { success: true, orderId, paymentId };
    } catch (error) {
      logger.error(`Razorpay verification error: ${error.message}`);
      throw new Error(`Razorpay verification failed: ${error.message}`);
    }
  }

  // ─── PayU Methods ───────────────────────────────────────────────────────

  createPayUPayment(paymentData) {
    try {
      const { amount, productInfo, firstName, email, phone, txnId, successUrl, failureUrl } = paymentData;
      const hashString = `${this.payuConfig.merchantKey}|${txnId}|${amount}|${productInfo}|${firstName}|${email}|||||||||||${this.payuConfig.merchantSalt}`;
      const hash = crypto.createHash('sha512').update(hashString).digest('hex');

      return {
        paymentUrl: this.payuConfig.baseUrl,
        params: { key: this.payuConfig.merchantKey, txnid: txnId, amount: amount.toString(), productinfo: productInfo, firstname: firstName, email, phone, surl: successUrl, furl: failureUrl, hash },
      };
    } catch (error) {
      logger.error(`PayU payment error: ${error.message}`);
      throw new Error(`PayU payment failed: ${error.message}`);
    }
  }

  verifyPayUPayment(responseData) {
    try {
      const { status, txnid, amount, productinfo, firstname, email, hash } = responseData;
      const hashString = `${this.payuConfig.merchantSalt}|${status}|||||||||||${email}|${firstname}|${productinfo}|${amount}|${txnid}|${this.payuConfig.merchantKey}`;
      const generatedHash = crypto.createHash('sha512').update(hashString).digest('hex');
      return { success: generatedHash === hash && status === 'success', txnId: txnid, amount: parseFloat(amount), status };
    } catch (error) {
      logger.error(`PayU verification error: ${error.message}`);
      throw new Error(`PayU verification failed: ${error.message}`);
    }
  }

  // ─── Refund Methods ─────────────────────────────────────────────────────

  async processRefund(gateway, refundData) {
    await this._ensurePlatformKeys();
    switch (gateway) {
      case 'stripe': return await this.processStripeRefund(refundData);
      case 'razorpay': return await this.processRazorpayRefund(refundData);
      case 'payu': return await this.processPayURefund(refundData);
      default: throw new Error(`Unsupported gateway: ${gateway}`);
    }
  }

  async processStripeRefund(refundData) {
    const { paymentIntentId, amount, reason } = refundData;
    const refund = await this.stripe.refunds.create({
      payment_intent: paymentIntentId,
      amount: amount ? Math.round(amount * 100) : undefined,
      reason: reason || 'requested_by_customer',
    });
    return { refundId: refund.id, amount: refund.amount / 100, status: refund.status };
  }

  async processRazorpayRefund(refundData) {
    const { paymentId, amount } = refundData;
    const refund = await this.razorpay.payments.refund(paymentId, {
      amount: amount ? Math.round(amount * 100) : undefined,
    });
    return { refundId: refund.id, amount: refund.amount / 100, status: refund.status };
  }

  async processPayURefund(refundData) {
    logger.info('PayU refund initiated (manual process required)');
    return { success: true, message: 'Refund request submitted for manual processing' };
  }

  // ─── Status Methods ─────────────────────────────────────────────────────

  async getPaymentStatus(gateway, paymentId) {
    await this._ensurePlatformKeys();
    switch (gateway) {
      case 'stripe': {
        const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentId);
        return { status: paymentIntent.status, amount: paymentIntent.amount / 100, currency: paymentIntent.currency };
      }
      case 'razorpay': {
        const payment = await this.razorpay.payments.fetch(paymentId);
        return { status: payment.status, amount: payment.amount / 100, currency: payment.currency };
      }
      default: throw new Error(`Unsupported gateway: ${gateway}`);
    }
  }
}

export default new PaymentGatewayService();
