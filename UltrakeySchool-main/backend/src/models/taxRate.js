import mongoose from 'mongoose';

const taxRateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  rate: {
    type: Number,
    required: true,
    min: 0
  },
  description: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  type: {
    type: String,
    enum: ['inclusive', 'exclusive'],
    default: 'exclusive'
  },
  institution: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institution',
    required: true,
    index: true
  }
}, {
  timestamps: true
});

taxRateSchema.index({ institution: 1, name: 1 }, { unique: true, partialFilterExpression: { name: { $exists: true } } });

const TaxRate = mongoose.model('TaxRate', taxRateSchema);

export default TaxRate;
