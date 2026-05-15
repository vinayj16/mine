import Stripe from 'stripe';
import { Invoice, FinanceTransaction } from '../models/finance.js';
import logger from '../utils/logger.js';

// Initialize Stripe
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripePublishableKey = process.env.STRIPE_PUBLISHABLE_KEY;
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

let stripe;
if (stripeSecretKey) {
  stripe = new Stripe(stripeSecretKey, {
    apiVersion: '2023-10-16',
  });
}

class StripeService {
  constructor() {
    this.currency = 'INR'; // Indian Rupee
    this.successUrl = process.env.FRONTEND_URL + '/payment/success';
    this.cancelUrl = process.env.FRONTEND_URL + '/payment/cancelled';
  }

  // Create payment intent for invoice
  async createPaymentIntent(invoiceId, userId) {
    try {
      if (!stripe) {
        throw new Error('Stripe not configured');
      }

      const invoice = await Invoice.findOne({
        _id: invoiceId,
        institution: userId.institutionId || userId
      }).populate('student', 'name email');

      if (!invoice) {
        throw new Error('Invoice not found');
      }

      if (invoice.status === 'paid') {
        throw new Error('Invoice is already paid');
      }

      // Create payment intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(invoice.totalAmount * 100), // Convert to paise (smallest currency unit)
        currency: this.currency,
        metadata: {
          invoiceId: invoice._id.toString(),
          studentId: invoice.student._id.toString(),
          studentName: invoice.student.name,
          institutionId: invoice.institution.toString()
        },
        description: `Fee payment for ${invoice.student.name} - Invoice ${invoice.invoiceNumber}`,
        receipt_email: invoice.student.email,
        automatic_payment_methods: {
          enabled: true,
        },
      });

      logger.info(`Payment intent created: ${paymentIntent.id}`, {
        invoiceId,
        amount: invoice.totalAmount,
        userId
      });

      return {
        success: true,
        paymentIntent: {
          id: paymentIntent.id,
          client_secret: paymentIntent.client_secret,
          amount: paymentIntent.amount,
          currency: paymentIntent.currency,
          status: paymentIntent.status
        },
        invoice: {
          id: invoice._id,
          number: invoice.invoiceNumber,
          amount: invoice.totalAmount,
          student: invoice.student.name
        }
      };
    } catch (error) {
      logger.error('Create payment intent error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Create checkout session for fee payment
  async createCheckoutSession(invoiceId, userId) {
    try {
      if (!stripe) {
        throw new Error('Stripe not configured');
      }

      const invoice = await Invoice.findOne({
        _id: invoiceId,
        institution: userId.institutionId || userId
      }).populate('student', 'name email');

      if (!invoice) {
        throw new Error('Invoice not found');
      }

      if (invoice.status === 'paid') {
        throw new Error('Invoice is already paid');
      }

      // Create checkout session
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [{
          price_data: {
            currency: this.currency,
            product_data: {
              name: `Fee Payment - Invoice ${invoice.invoiceNumber}`,
              description: `Fee payment for ${invoice.student.name}`,
            },
            unit_amount: Math.round(invoice.totalAmount * 100), // Amount in paise
          },
          quantity: 1,
        }],
        mode: 'payment',
        success_url: `${this.successUrl}?session_id={CHECKOUT_SESSION_ID}&invoice_id=${invoiceId}`,
        cancel_url: `${this.cancelUrl}?invoice_id=${invoiceId}`,
        metadata: {
          invoiceId: invoice._id.toString(),
          studentId: invoice.student._id.toString(),
          institutionId: invoice.institution.toString()
        },
        customer_email: invoice.student.email,
        receipt_email: invoice.student.email,
      });

      logger.info(`Checkout session created: ${session.id}`, {
        invoiceId,
        amount: invoice.totalAmount,
        userId
      });

      return {
        success: true,
        session: {
          id: session.id,
          url: session.url,
          amount: invoice.totalAmount,
          currency: this.currency
        },
        invoice: {
          id: invoice._id,
          number: invoice.invoiceNumber,
          student: invoice.student.name
        }
      };
    } catch (error) {
      logger.error('Create checkout session error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Handle webhook events
  async handleWebhook(rawBody, signature) {
    try {
      if (!stripe || !webhookSecret) {
        throw new Error('Stripe webhook not configured');
      }

      // Verify webhook signature
      const event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);

      logger.info(`Webhook received: ${event.type}`, {
        eventId: event.id
      });

      switch (event.type) {
        case 'payment_intent.succeeded':
          await this.handlePaymentIntentSucceeded(event.data.object);
          break;

        case 'checkout.session.completed':
          await this.handleCheckoutSessionCompleted(event.data.object);
          break;

        case 'payment_intent.payment_failed':
          await this.handlePaymentFailed(event.data.object);
          break;

        default:
          logger.info(`Unhandled webhook event: ${event.type}`);
      }

      return { received: true };
    } catch (error) {
      logger.error('Webhook handling error:', error);
      throw error;
    }
  }

  // Handle successful payment intent
  async handlePaymentIntentSucceeded(paymentIntent) {
    try {
      const { invoiceId, studentId } = paymentIntent.metadata;

      // Update invoice status
      const invoice = await Invoice.findByIdAndUpdate(
        invoiceId,
        {
          status: 'paid',
          paidDate: new Date(),
          paymentMethod: 'online'
        },
        { new: true }
      );

      if (!invoice) {
        throw new Error(`Invoice not found: ${invoiceId}`);
      }

      // Create transaction record
      const transaction = new FinanceTransaction({
        transactionId: `TXN-${paymentIntent.id}`,
        invoice: invoiceId,
        student: studentId,
        institution: invoice.institution,
        type: 'payment',
        amount: invoice.totalAmount,
        paymentMethod: 'online',
        reference: paymentIntent.id,
        description: `Online payment for invoice ${invoice.invoiceNumber}`,
        status: 'completed',
        processedBy: null, // System processed
        metadata: {
          stripePaymentIntentId: paymentIntent.id,
          stripeChargeId: paymentIntent.latest_charge
        }
      });

      await transaction.save();

      logger.info(`Payment processed successfully: ${paymentIntent.id}`, {
        invoiceId,
        amount: invoice.totalAmount,
        studentId
      });

      return { success: true, invoice, transaction };
    } catch (error) {
      logger.error('Handle payment intent succeeded error:', error);
      throw error;
    }
  }

  // Handle completed checkout session
  async handleCheckoutSessionCompleted(session) {
    try {
      const { invoiceId } = session.metadata;

      // Update invoice status (similar to payment intent success)
      const invoice = await Invoice.findByIdAndUpdate(
        invoiceId,
        {
          status: 'paid',
          paidDate: new Date(),
          paymentMethod: 'online'
        },
        { new: true }
      );

      logger.info(`Checkout session completed: ${session.id}`, {
        invoiceId,
        amount: invoice.totalAmount
      });

      return { success: true, invoice };
    } catch (error) {
      logger.error('Handle checkout session completed error:', error);
      throw error;
    }
  }

  // Handle payment failure
  async handlePaymentFailed(paymentIntent) {
    try {
      const { invoiceId } = paymentIntent.metadata;

      // Create failed transaction record
      const transaction = new FinanceTransaction({
        transactionId: `TXN-${paymentIntent.id}-FAILED`,
        invoice: invoiceId,
        institution: paymentIntent.metadata.institutionId,
        type: 'payment',
        amount: paymentIntent.amount / 100, // Convert from paise
        paymentMethod: 'online',
        reference: paymentIntent.id,
        description: 'Payment failed',
        status: 'failed',
        processedBy: null,
        metadata: {
          stripePaymentIntentId: paymentIntent.id,
          failureReason: paymentIntent.last_payment_error?.message || 'Unknown'
        }
      });

      await transaction.save();

      logger.warn(`Payment failed: ${paymentIntent.id}`, {
        invoiceId,
        reason: paymentIntent.last_payment_error?.message
      });

      return { success: true, transaction };
    } catch (error) {
      logger.error('Handle payment failed error:', error);
      throw error;
    }
  }

  // Refund payment
  async refundPayment(transactionId, amount, reason) {
    try {
      if (!stripe) {
        throw new Error('Stripe not configured');
      }

      const transaction = await FinanceTransaction.findById(transactionId);
      if (!transaction) {
        throw new Error('FinanceTransaction not found');
      }

      if (!transaction.metadata?.stripePaymentIntentId) {
        throw new Error('No Stripe payment intent found for this transaction');
      }

      // Get the charge from payment intent
      const paymentIntent = await stripe.paymentIntents.retrieve(transaction.metadata.stripePaymentIntentId);
      const chargeId = paymentIntent.latest_charge;

      if (!chargeId) {
        throw new Error('No charge found for refund');
      }

      // Create refund
      const refund = await stripe.refunds.create({
        charge: chargeId,
        amount: amount ? Math.round(amount * 100) : undefined, // Partial or full refund
        reason: reason || 'requested_by_customer',
        metadata: {
          transactionId: transactionId,
          originalAmount: transaction.amount
        }
      });

      // Update transaction status
      transaction.status = 'refunded';
      transaction.metadata = {
        ...transaction.metadata,
        refundId: refund.id,
        refundAmount: refund.amount / 100,
        refundReason: reason
      };
      await transaction.save();

      logger.info(`Refund processed: ${refund.id}`, {
        transactionId,
        amount: refund.amount / 100,
        reason
      });

      return {
        success: true,
        refund: {
          id: refund.id,
          amount: refund.amount / 100,
          status: refund.status
        }
      };
    } catch (error) {
      logger.error('Refund payment error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Get payment methods for customer
  async getPaymentMethods(customerId) {
    try {
      if (!stripe) {
        throw new Error('Stripe not configured');
      }

      const paymentMethods = await stripe.paymentMethods.list({
        customer: customerId,
        type: 'card'
      });

      return {
        success: true,
        paymentMethods: paymentMethods.data
      };
    } catch (error) {
      logger.error('Get payment methods error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Create customer in Stripe
  async createCustomer(customerData) {
    try {
      if (!stripe) {
        throw new Error('Stripe not configured');
      }

      const customer = await stripe.customers.create({
        email: customerData.email,
        name: customerData.name,
        phone: customerData.phone,
        metadata: {
          userId: customerData.userId,
          institutionId: customerData.institutionId
        }
      });

      logger.info(`Stripe customer created: ${customer.id}`, {
        email: customerData.email,
        userId: customerData.userId
      });

      return {
        success: true,
        customer: {
          id: customer.id,
          email: customer.email,
          name: customer.name
        }
      };
    } catch (error) {
      logger.error('Create customer error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// Export singleton instance
export default new StripeService();
