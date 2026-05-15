import mongoose from 'mongoose';

const paymentGatewaySettingsSchema = new mongoose.Schema({
  institutionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institution',
    required: true
  },
  
  gateways: [{
    name: {
      type: String,
      required: true,
      enum: [
        'paypal',
        'stripe',
        'braintree',
        'authorize.net',
        'razorpay',
        'payoneer',
        'apple-pay',
        '2checkout',
        'skrill',
        'paytm',
        'payu',
        'midtrans',
        'pytorch',
        'bank-transfer',
        'cash-on-delivery'
      ]
    },
    displayName: {
      type: String,
      required: true
    },
    description: {
      type: String
    },
    logo: {
      type: String
    },
    isEnabled: {
      type: Boolean,
      default: false
    },
    isConnected: {
      type: Boolean,
      default: false
    },
    credentials: {
      apiKey: {
        type: String,
        select: false // Don't return by default for security
      },
      apiSecret: {
        type: String,
        select: false
      },
      merchantId: {
        type: String,
        select: false
      },
      publicKey: {
        type: String
      },
      webhookSecret: {
        type: String,
        select: false
      },
      environment: {
        type: String,
        enum: ['sandbox', 'production'],
        default: 'sandbox'
      }
    },
    settings: {
      currency: {
        type: String,
        default: 'USD'
      },
      acceptedPaymentMethods: [{
        type: String
      }],
      autoCapture: {
        type: Boolean,
        default: true
      },
      sendReceipt: {
        type: Boolean,
        default: true
      }
    },
    connectedAt: {
      type: Date
    },
    lastUsed: {
      type: Date
    }
  }],
  
  defaultGateway: {
    type: String
  },
  
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

paymentGatewaySettingsSchema.index({ institutionId: 1 });

export default mongoose.model('PaymentGatewaySettings', paymentGatewaySettingsSchema);
