import mongoose from 'mongoose';

const platformHealthSchema = new mongoose.Schema({
  serverStatus: {
    type: String,
    enum: ['online', 'maintenance', 'offline'],
    default: 'online',
    required: true
  },
  databaseStatus: {
    type: String,
    enum: ['healthy', 'degraded', 'critical'],
    default: 'healthy',
    required: true
  },
  apiStatus: {
    type: String,
    enum: ['operational', 'degraded', 'outage'],
    default: 'operational',
    required: true
  },
  uptime: {
    type: String,
    default: '99.99%'
  },
  activeUsers: {
    type: Number,
    default: 0
  },
  totalSchools: {
    type: Number,
    default: 0
  },
  pendingTickets: {
    type: Number,
    default: 0
  },
  cpuUsage: {
    type: Number,
    default: 0
  },
  memoryUsage: {
    type: Number,
    default: 0
  },
  diskUsage: {
    type: Number,
    default: 0
  },
  responseTime: {
    type: Number,
    default: 0
  },
  errorRate: {
    type: Number,
    default: 0
  },
  lastChecked: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

platformHealthSchema.index({ lastChecked: -1 });

const PlatformHealth = mongoose.model('PlatformHealth', platformHealthSchema);

export default PlatformHealth;
