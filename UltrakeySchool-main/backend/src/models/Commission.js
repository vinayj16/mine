import mongoose from 'mongoose';

const commissionSchema = new mongoose.Schema({
  agentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  institutionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institution',
    required: true
  },
  institutionName: {
    type: String,
    required: true
  },
  institutionType: {
    type: String,
    required: true
  },
  revenue: {
    type: Number,
    required: true,
    min: 0
  },
  commissionRate: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
    default: 10
  },
  commissionAmount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'INR'
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'paid'],
    default: 'pending',
    index: true
  },
  paymentDate: {
    type: Date
  },
  paymentMethod: {
    type: String
  },
  paymentReference: {
    type: String
  },
  notes: {
    type: String
  },
  metadata: {
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }
}, {
  timestamps: true
});

commissionSchema.index({ agentId: 1, status: 1 });
commissionSchema.index({ institutionId: 1 });
commissionSchema.index({ createdAt: -1 });

const Commission = mongoose.model('Commission', commissionSchema);

export default Commission;
