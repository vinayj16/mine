import mongoose from 'mongoose';

const canteenPaymentSchema = new mongoose.Schema({
  institution: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institution',
    required: true
  },
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CanteenOrder',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  method: {
    type: String,
    enum: ['cash', 'card', 'wallet', 'upi'],
    default: 'cash'
  },
  reference: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'successful', 'failed'],
    default: 'pending'
  }
}, {
  timestamps: true
});

canteenPaymentSchema.index({ institution: 1, status: 1 });

export default mongoose.model('CanteenPayment', canteenPaymentSchema);
