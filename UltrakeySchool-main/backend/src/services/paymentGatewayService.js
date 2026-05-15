import Stripe from 'stripe';
import axios from 'axios';
import crypto from 'crypto';
import Razorpay from 'razorpay';
import Payment from '../models/Payment.js';
import logger from '../utils/logger.js';

class PaymentGatewayService {
  constructor() {
    // Initialize Stripe
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_dummy');
    
    // Initialize Razorpay
    this.razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_dummy',
      key_secret: process.env.RAZORPAY_KEY_SECRET || 'secret_dummy',
    });
    
    // PayU configuration
    this.payuConfig = {
      merchantKey: process.env.PAYU_MERCHANT_KEY || 'dummy_key',
      merchantSalt: process.env.PAYU_MERCHANT_SALT || 'dummy_salt',
      baseUrl: process.env.PAYU_BASE_URL || 'https://test.payu.in/_payment',
    };
  }

  /**
   * Create Stripe payment intent
   * @param {Object} paymentData - Payment data
   * @returns {Object} Payment intent
   */
  async createStripePayment(paymentData) {
    try {
      const { amount, currency, metadata, customerId } = paymentData;

      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: currency || 'usd',
        metadata: metadata || {},
        customer: customerId,
        automatic_payment_methods: {
          enabled: true,
        },
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

  /**
   * Verify Stripe payment
   * @param {string} paymentIntentId - Payment intent ID
   * @returns {Object} Payment status
   */
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

  /**
   * Create Stripe customer
   * @param {Object} customerData - Customer data
   * @returns {Object} Customer
   */
  async createStripeCustomer(customerData) {
    try {
      const { email, name, phone, metadata } = customerData;

      const customer = await this.stripe.customers.create({
        email,
        name,
        phone,
        metadata: metadata || {},
      });

      logger.info(`Stripe customer created: ${customer.id}`);
      return customer;
    } catch (error) {
      logger.error(`Stripe customer creation error: ${error.message}`);
      throw new Error(`Failed to create Stripe customer: ${error.message}`);
    }
  }

  /**
   * Create Razorpay order
   * @param {Object} orderData - Order data
   * @returns {Object} Order
   */
  async createRazorpayOrder(orderData) {
    try {
      const { amount, currency, receipt, notes } = orderData;

      const order = await this.razorpay.orders.create({
        amount: Math.round(amount * 100), // Convert to paise
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
      logger.error(`Razorpay order error: ${error.message}`);
      throw new Error(`Razorpay order failed: ${error.message}`);
    }
  }

  /**
   * Verify Razorpay payment
   * @param {Object} verificationData - Verification data
   * @returns {Object} Verification result
   */
  verifyRazorpayPayment(verificationData) {
    try {
      const { orderId, paymentId, signature } = verificationData;

      const generatedSignature = crypto
        .createHmac('sha256', this.razorpay.key_secret)
        .update(`${orderId}|${paymentId}`)
        .digest('hex');

      const isValid = generatedSignature === signature;

      if (!isValid) {
        throw new Error('Invalid payment signature');
      }

      logger.info(`Razorpay payment verified: ${paymentId}`);
      
      return {
        success: true,
        orderId,
        paymentId,
      };
    } catch (error) {
      logger.error(`Razorpay verification error: ${error.message}`);
      throw new Error(`Razorpay verification failed: ${error.message}`);
    }
  }

  /**
   * Create PayU payment
   * @param {Object} paymentData - Payment data
   * @returns {Object} Payment form data
   */
  createPayUPayment(paymentData) {
    try {
      const {
        amount,
        productInfo,
        firstName,
        email,
        phone,
        txnId,
        successUrl,
        failureUrl,
      } = paymentData;

      const hashString = `${this.payuConfig.merchantKey}|${txnId}|${amount}|${productInfo}|${firstName}|${email}|||||||||||${this.payuConfig.merchantSalt}`;
      
      const hash = crypto
        .createHash('sha512')
        .update(hashString)
        .digest('hex');

      const paymentParams = {
        key: this.payuConfig.merchantKey,
        txnid: txnId,
        amount: amount.toString(),
        productinfo: productInfo,
        firstname: firstName,
        email,
        phone,
        surl: successUrl,
        furl: failureUrl,
        hash,
      };

      logger.info(`PayU payment created: ${txnId}`);
      
      return {
        paymentUrl: this.payuConfig.baseUrl,
        params: paymentParams,
      };
    } catch (error) {
      logger.error(`PayU payment error: ${error.message}`);
      throw new Error(`PayU payment failed: ${error.message}`);
    }
  }

  /**
   * Verify PayU payment
   * @param {Object} responseData - PayU response data
   * @returns {Object} Verification result
   */
  verifyPayUPayment(responseData) {
    try {
      const { status, txnid, amount, productinfo, firstname, email, hash } = responseData;

      const hashString = `${this.payuConfig.merchantSalt}|${status}|||||||||||${email}|${firstname}|${productinfo}|${amount}|${txnid}|${this.payuConfig.merchantKey}`;
      
      const generatedHash = crypto
        .createHash('sha512')
        .update(hashString)
        .digest('hex');

      const isValid = generatedHash === hash;

      if (!isValid) {
        throw new Error('Invalid payment hash');
      }

      logger.info(`PayU payment verified: ${txnid}`);
      
      return {
        success: status === 'success',
        txnId: txnid,
        amount: parseFloat(amount),
        status,
      };
    } catch (error) {
      logger.error(`PayU verification error: ${error.message}`);
      throw new Error(`PayU verification failed: ${error.message}`);
    }
  }

  /**
   * Process refund
   * @param {string} gateway - Payment gateway (stripe, razorpay, payu)
   * @param {Object} refundData - Refund data
   * @returns {Object} Refund result
   */
  async processRefund(gateway, refundData) {
    try {
      switch (gateway) {
        case 'stripe':
          return await this.processStripeRefund(refundData);
        case 'razorpay':
          return await this.processRazorpayRefund(refundData);
        case 'payu':
          return await this.processPayURefund(refundData);
        default:
          throw new Error(`Unsupported gateway: ${gateway}`);
      }
    } catch (error) {
      logger.error(`Refund error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Process Stripe refund
   * @param {Object} refundData - Refund data
   * @returns {Object} Refund result
   */
  async processStripeRefund(refundData) {
    const { paymentIntentId, amount, reason } = refundData;

    const refund = await this.stripe.refunds.create({
      payment_intent: paymentIntentId,
      amount: amount ? Math.round(amount * 100) : undefined,
      reason: reason || 'requested_by_customer',
    });

    logger.info(`Stripe refund processed: ${refund.id}`);
    
    return {
      refundId: refund.id,
      amount: refund.amount / 100,
      status: refund.status,
    };
  }

  /**
   * Process Razorpay refund
   * @param {Object} refundData - Refund data
   * @returns {Object} Refund result
   */
  async processRazorpayRefund(refundData) {
    const { paymentId, amount } = refundData;

    const refund = await this.razorpay.payments.refund(paymentId, {
      amount: amount ? Math.round(amount * 100) : undefined,
    });

    logger.info(`Razorpay refund processed: ${refund.id}`);
    
    return {
      refundId: refund.id,
      amount: refund.amount / 100,
      status: refund.status,
    };
  }

  /**
   * Process PayU refund
   * @param {Object} refundData - Refund data
   * @returns {Object} Refund result
   */
  async processPayURefund(refundData) {
    // PayU refund implementation
    // Note: PayU refunds are typically processed manually or via API
    logger.info('PayU refund initiated (manual process required)');
    
    return {
      success: true,
      message: 'Refund request submitted for manual processing',
    };
  }

  /**
   * Get payment status
   * @param {string} gateway - Payment gateway
   * @param {string} paymentId - Payment ID
   * @returns {Object} Payment status
   */
  async getPaymentStatus(gateway, paymentId) {
    try {
      switch (gateway) {
        case 'stripe':
          const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentId);
          return {
            status: paymentIntent.status,
            amount: paymentIntent.amount / 100,
            currency: paymentIntent.currency,
          };
        
        case 'razorpay':
          const payment = await this.razorpay.payments.fetch(paymentId);
          return {
            status: payment.status,
            amount: payment.amount / 100,
            currency: payment.currency,
          };
        
        default:
          throw new Error(`Unsupported gateway: ${gateway}`);
      }
    } catch (error) {
      logger.error(`Get payment status error: ${error.message}`);
      throw error;
    }
  }
}

export default new PaymentGatewayService();
