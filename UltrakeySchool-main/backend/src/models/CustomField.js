import mongoose from 'mongoose';

const customFieldSchema = new mongoose.Schema({
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: true,
    index: true
  },
  entityType: {
    type: String,
    enum: ['student', 'teacher', 'guardian', 'staff', 'user'],
    required: true
  },
  fieldName: {
    type: String,
    required: true
  },
  fieldLabel: {
    type: String,
    required: true
  },
  fieldType: {
    type: String,
    enum: ['text', 'number', 'date', 'select', 'multiselect', 'textarea', 'checkbox', 'radio', 'email', 'phone', 'file'],
    default: 'text'
  },
  placeholder: String,
  helpText: String,
  defaultValue: mongoose.Schema.Types.Mixed,
  options: [String], // For select, multiselect, radio
  isRequired: {
    type: Boolean,
    default: false
  },
  isUnique: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  validation: {
    minLength: Number,
    maxLength: Number,
    min: Number,
    max: Number,
    pattern: String
  },
  displayOrder: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

customFieldSchema.index({ schoolId: 1, entityType: 1, fieldName: 1 }, { unique: true });
customFieldSchema.index({ entityType: 1, displayOrder: 1 });

export default mongoose.model('CustomField', customFieldSchema);
