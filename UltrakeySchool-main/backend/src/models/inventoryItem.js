import mongoose from 'mongoose';

const inventoryItemSchema = new mongoose.Schema({
  institution: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institution',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  sku: {
    type: String,
    trim: true,
    index: true
  },
  category: {
    type: String,
    trim: true
  },
  quantity: {
    type: Number,
    default: 0
  },
  unit: {
    type: String,
    default: 'unit'
  },
  location: {
    type: String,
    trim: true
  },
  condition: {
    type: String,
    default: 'good'
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

inventoryItemSchema.index({ institution: 1, name: 1 });

export default mongoose.model('InventoryItem', inventoryItemSchema);
