import mongoose from 'mongoose';

const moduleCategorySchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  icon: {
    type: String,
    default: 'ti ti-folder'
  },
  badgeColor: {
    type: String,
    default: 'primary'
  },
  institutionTypes: [{
    type: String,
    enum: ['School', 'Inter', 'Degree']
  }],
  modules: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Module'
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('ModuleCategory', moduleCategorySchema);
