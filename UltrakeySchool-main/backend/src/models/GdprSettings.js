import mongoose from 'mongoose';

const gdprSettingsSchema = new mongoose.Schema({
  institutionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institution',
    required: true
  },
  // Cookie Consent Settings
  cookiesContentText: {
    type: String,
    default: 'We use cookies to ensure you get the best experience on our website.'
  },
  cookiesPosition: {
    type: String,
    enum: ['right', 'left', 'center', 'top', 'bottom'],
    default: 'bottom'
  },
  agreeButtonText: {
    type: String,
    default: 'Agree'
  },
  declineButtonText: {
    type: String,
    default: 'Decline'
  },
  showDeclineButton: {
    type: Boolean,
    default: true
  },
  cookiesPageLink: {
    type: String,
    default: '/privacy-policy'
  },
  
  // Data Subject Rights (DSR) Settings
  dataSubjectRights: {
    enabled: {
      type: Boolean,
      default: true
    },
    allowDataExport: {
      type: Boolean,
      default: true
    },
    allowDataRectification: {
      type: Boolean,
      default: true
    },
    allowDataErasure: {
      type: Boolean,
      default: true
    },
    erasureGracePeriod: {
      type: Number,
      default: 30, // days
      min: 0,
      max: 365
    },
    requireVerification: {
      type: Boolean,
      default: true
    },
    exportFormats: {
      type: [String],
      enum: ['json', 'csv', 'pdf'],
      default: ['json', 'csv']
    }
  },
  
  // Data Retention Settings
  dataRetention: {
    enabled: {
      type: Boolean,
      default: true
    },
    studentDataRetention: {
      type: Number,
      default: 7, // years
      min: 0,
      max: 100
    },
    staffDataRetention: {
      type: Number,
      default: 7, // years
      min: 0,
      max: 100
    },
    auditLogRetention: {
      type: Number,
      default: 7, // years
      min: 0,
      max: 100
    }
  },
  
  // Compliance Settings
  compliance: {
    gdprEnabled: {
      type: Boolean,
      default: true
    },
    ferpaEnabled: {
      type: Boolean,
      default: true
    },
    hipaaEnabled: {
      type: Boolean,
      default: false
    },
    privacyPolicyUrl: {
      type: String,
      default: '/privacy-policy'
    },
    termsOfServiceUrl: {
      type: String,
      default: '/terms-of-service'
    }
  },

  dataProtectionOfficer: {
    contactEmail: {
      type: String,
      default: 'dpo@edumanage.pro'
    },
    name: {
      type: String,
      default: 'EduManage Data Protection Officer'
    },
    responsibilities: {
      type: String,
      default: 'Data protection compliance, breach notification, DPIA coordination'
    },
    contactDetails: {
      type: String,
      default: 'Contact information is available in the privacy policy and system settings'
    }
  },

  dpiImpactAssessment: {
    highRiskProcessing: {
      type: [String],
      default: [
        'Student personal data processing',
        'Automated decision making for assessments',
        'Large-scale data processing'
      ]
    },
    lastReviewedAt: {
      type: Date,
      default: () => new Date()
    },
    notes: {
      type: String,
      default: 'High-risk processing areas are reviewed quarterly'
    }
  },

  enabled: {
    type: Boolean,
    default: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

gdprSettingsSchema.index({ institutionId: 1 });

export default mongoose.model('GdprSettings', gdprSettingsSchema);
