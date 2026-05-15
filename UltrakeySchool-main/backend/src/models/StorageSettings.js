import mongoose from 'mongoose';

const storageSettingsSchema = new mongoose.Schema({
  institutionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institution',
    required: false
  },
  provider: {
    type: String,
    enum: ['local', 'aws', 'azure', 'gcp', 'cloudinary'],
    default: 'local'
  },
  displayName: {
    type: String,
    default: 'Local Storage'
  },
  isEnabled: {
    type: Boolean,
    default: false
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  configuration: {
    // Local Storage
    localPath: String,
    
    // AWS S3
    awsAccessKeyId: String,
    awsSecretAccessKey: String,
    awsRegion: String,
    awsBucket: String,
    
    // Azure Blob Storage
    azureAccountName: String,
    azureAccountKey: String,
    azureContainerName: String,
    
    // Google Cloud Storage
    gcpProjectId: String,
    gcpKeyFilePath: String,
    gcpBucketName: String,
    
    // Cloudinary
    cloudinaryCloudName: String,
    cloudinaryApiKey: String,
    cloudinaryApiSecret: String,
    
    // Common settings
    maxFileSize: {
      type: Number,
      default: 10485760 // 10MB in bytes
    },
    allowedFileTypes: [{
      type: String
    }],
    publicAccess: {
      type: Boolean,
      default: false
    }
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'error'],
    default: 'inactive'
  },
  lastTested: {
    type: Date
  },
  testResult: {
    success: Boolean,
    message: String,
    testedAt: Date
  },
  usage: {
    totalFiles: {
      type: Number,
      default: 0
    },
    totalSize: {
      type: Number,
      default: 0
    },
    lastUpdated: Date
  },
  metadata: {
    icon: String,
    description: String,
    documentationUrl: String
  }
}, {
  timestamps: true
});

storageSettingsSchema.index({ isEnabled: 1 });
storageSettingsSchema.index({ isDefault: 1 });

// Ensure only one default provider
storageSettingsSchema.pre('save', async function(next) {
  if (this.isDefault) {
    await mongoose.model('StorageSettings').updateMany(
      { _id: { $ne: this._id } },
      { $set: { isDefault: false } }
    );
  }
  next();
});

export default mongoose.model('StorageSettings', storageSettingsSchema);
