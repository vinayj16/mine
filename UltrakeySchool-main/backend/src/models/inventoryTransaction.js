import mongoose from 'mongoose';

const inventoryTransactionSchema = new mongoose.Schema({
  item: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'InventoryItem',
    required: true
  },
  institution: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institution',
    required: true
  },
  change: {
    type: Number,
    required: true
  },
  reason: {
    type: String,
    trim: true
  },
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

inventoryTransactionSchema.index({ institution: 1 });

export default mongoose.model('InventoryTransaction', inventoryTransactionSchema);
