import mongoose from 'mongoose';

const institutionField = {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'Institution',
  required: true,
  index: true
};

const feeGroupSchema = new mongoose.Schema(
  {
    institutionId: institutionField,
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: '' },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

const feeTypeSchema = new mongoose.Schema(
  {
    institutionId: institutionField,
    feeGroupId: { type: mongoose.Schema.Types.ObjectId, ref: 'FeeGroup' },
    name: { type: String, required: true, trim: true },
    code: { type: String, trim: true },
    description: { type: String, trim: true, default: '' },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

const feeMasterSchema = new mongoose.Schema(
  {
    institutionId: institutionField,
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: '' },
    amount: { type: Number, default: 0, min: 0 },
    dueDate: { type: Date },
    fineType: { type: String, enum: ['None', 'Percentage', 'Fixed'], default: 'None' },
    finePercentage: { type: Number, default: 0 },
    fineAmount: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

const feeAssignmentSchema = new mongoose.Schema(
  {
    institutionId: institutionField,
    feesGroup: { type: String, trim: true },
    feesType: { type: String, trim: true },
    class: { type: String, trim: true },
    section: { type: String, trim: true },
    amount: { type: Number, required: true, min: 0 },
    gender: { type: String, trim: true, default: 'all' },
    category: { type: String, trim: true, default: 'all' },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export const FeeGroup = mongoose.model('FeeGroup', feeGroupSchema);
export const FeeType = mongoose.model('FeeType', feeTypeSchema);
export const FeeMaster = mongoose.model('FeeMaster', feeMasterSchema);
export const FeeAssignment = mongoose.model('FeeAssignment', feeAssignmentSchema);
