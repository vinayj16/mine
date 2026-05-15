import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema({
  settingsId: {
    type: String,
    required: false,
    unique: false,
    sparse: true,
    index: true
  },
  
  // For user-specific settings
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false,
    index: true
  },
  
  // For tenant-specific settings
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: false,
    index: true
  },
  
  // Type of settings (e.g., 'otp', 'notification_preferences', 'general')
  type: {
    type: String,
    required: false,
    index: true
  },
  
  // Generic data field for flexible settings storage
  data: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  
  // Company Information
  companyName: {
    type: String,
    trim: true
  },
  companyEmail: {
    type: String,
    lowercase: true,
    trim: true
  },
  companyPhone: {
    type: String,
    trim: true
  },
  faxNumber: {
    type: String,
    trim: true
  },
  website: {
    type: String,
    trim: true
  },
  
  // Address Information
  address: {
    street: String,
    city: String,
    state: String,
    country: String,
    postalCode: String
  },
  
  // Company Images
  logo: {
    url: String,
    filename: String,
    size: Number
  },
  favicon: {
    url: String,
    filename: String,
    size: Number
  },
  icon: {
    url: String,
    filename: String,
    size: Number
  },
  darkLogo: {
    url: String,
    filename: String,
    size: Number
  },
  
  // Localization
  timezone: {
    type: String,
    default: 'UTC'
  },
  dateFormat: {
    type: String,
    default: 'DD/MM/YYYY'
  },
  timeFormat: {
    type: String,
    enum: ['12', '24'],
    default: '24'
  },
  currency: {
    code: {
      type: String,
      default: 'USD'
    },
    symbol: {
      type: String,
      default: '$'
    },
    position: {
      type: String,
      enum: ['before', 'after'],
      default: 'before'
    }
  },
  language: {
    type: String,
    default: 'en'
  },
  
  // Prefixes
  prefixes: {
    student: {
      type: String,
      default: 'STU'
    },
    teacher: {
      type: String,
      default: 'TCH'
    },
    staff: {
      type: String,
      default: 'STF'
    },
    invoice: {
      type: String,
      default: 'INV'
    },
    receipt: {
      type: String,
      default: 'RCP'
    },
    admission: {
      type: String,
      default: 'ADM'
    }
  },
  
  // Preferences
  emailNotifications: {
    type: Boolean,
    default: true
  },
  smsNotifications: {
    type: Boolean,
    default: false
  },
  maintenanceMode: {
    type: Boolean,
    default: false
  },
  
  institutionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institution',
    required: true
  },
  
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

settingsSchema.index({ institutionId: 1, settingsId: 1 });

settingsSchema.pre('save', async function(next) {
  if (this.isNew && !this.settingsId) {
    const count = await mongoose.model('Settings').countDocuments();
    this.settingsId = `SET${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

const Settings = mongoose.model('Settings', settingsSchema);

export default Settings;
