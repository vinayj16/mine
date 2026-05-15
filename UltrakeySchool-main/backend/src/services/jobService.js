import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';
import logger from '../utils/logger.js';
import Notification from '../models/Notification.js';
import monitoringService from './monitoringService.js';
import exportService from './exportService.js';

// Redis connection for BullMQ
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || null,
  db: process.env.REDIS_DB || 0,
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: null, // Required for BullMQ
  lazyConnect: true,
  enableOfflineQueue: false, // Don't queue commands when offline
  connectTimeout: 5000, // 5 second timeout
  retryStrategy: (times) => {
    // Stop retrying after 3 attempts
    if (times > 3) {
      return null;
    }
    return Math.min(times * 100, 3000);
  }
};

// Create Redis connection for BullMQ
let redisConnection = null;
if (process.env.REDIS_ENABLED === 'true') {
  try {
    redisConnection = new IORedis(redisConfig);

    // Handle Redis connection errors gracefully
    redisConnection.on('error', (err) => {
      logger.warn('Redis connection error (BullMQ will not be available):', err.message);
    });

    redisConnection.on('connect', () => {
      logger.info('Redis connected successfully for BullMQ');
    });
  } catch (error) {
    logger.warn('Failed to create Redis connection:', error.message);
  }
}

// Job queues
const queues = {
  notification: null,
  report: null,
  cleanup: null
};

// Workers
const workers = {
  notification: null,
  report: null,
  cleanup: null
};

/**
 * Initialize BullMQ queues and workers
 */
export const initializeJobQueues = async () => {
  if (process.env.REDIS_ENABLED !== 'true') {
    logger.info('Job queues disabled - Redis not configured');
    return;
  }

  try {
    if (!redisConnection) {
      throw new Error('Redis connection not available');
    }

    logger.info('Initializing BullMQ job queues...');

    // Test Redis connection first
    await redisConnection.connect();
    await redisConnection.ping();

    // Notification queue - for sending in-app notifications
    queues.notification = new Queue('notification', {
      connection: redisConnection,
      defaultJobOptions: {
        removeOnComplete: 100,
        removeOnFail: 50,
        attempts: 2,
        backoff: {
          type: 'exponential',
          delay: 1000
        }
      }
    });

    // Report queue - for generating reports
    queues.report = new Queue('report', {
      connection: redisConnection,
      defaultJobOptions: {
        removeOnComplete: 10,
        removeOnFail: 20,
        attempts: 2,
        backoff: {
          type: 'exponential',
          delay: 5000
        }
      }
    });

    // Cleanup queue - for maintenance tasks
    queues.cleanup = new Queue('cleanup', {
      connection: redisConnection,
      defaultJobOptions: {
        removeOnComplete: 5,
        removeOnFail: 10,
        attempts: 1
      }
    });

    // Initialize workers
    await initializeWorkers();

    logger.info('BullMQ job queues initialized successfully');

  } catch (error) {
    logger.warn(`Failed to initialize BullMQ queues: ${error.message}. Job processing will be disabled.`);
    if (redisConnection && redisConnection.status !== 'end') {
      redisConnection.disconnect();
    }
  }
};

/**
 * Initialize job workers
 */
const initializeWorkers = async () => {

  // Notification worker
  workers.notification = new Worker('notification', notificationJobProcessor, {
    connection: redisConnection,
    concurrency: 10, // Process up to 10 notification jobs concurrently
  });

  // Report worker
  workers.report = new Worker('report', reportJobProcessor, {
    connection: redisConnection,
    concurrency: 2, // Process up to 2 report jobs concurrently
  });

  // Cleanup worker
  workers.cleanup = new Worker('cleanup', cleanupJobProcessor, {
    connection: redisConnection,
    concurrency: 1, // Process cleanup jobs one at a time
  });

  // Worker event handlers
  Object.keys(workers).forEach(workerName => {
    const worker = workers[workerName];

    worker.on('completed', (job) => {
      logger.info(`Job completed: ${workerName} - ${job.id}`);
    });

    worker.on('failed', (job, err) => {
      logger.error(`Job failed: ${workerName} - ${job.id}`, {
        error: err.message,
        data: job.data
      });
    });

    worker.on('stalled', (job) => {
      logger.warn(`Job stalled: ${workerName} - ${job.id}`);
    });
  });

  logger.info('BullMQ workers initialized');
};

/**
 * Email job processor
 */
const wrapJob = (name, processor) => {
  return async (job) => {
    return monitoringService.performanceMonitoring.monitorBackgroundJob(
      `${name}.${job.data?.type || 'unknown'}`,
      job.data || {},
      async () => {
        logger.info(`Processing ${name} job: ${job.data?.type || 'unknown'}`, { jobId: job.id });
        const result = await processor(job);
        logger.info(`Completed ${name} job: ${job.data?.type || 'unknown'}`, { jobId: job.id });
        return result;
      }
    );
  };
};

const notificationJobProcessor = wrapJob('notification', async (job) => {
  const { type, data } = job.data;

  switch (type) {
    case 'user_notification':
      await createUserNotification(data);
      break;

    case 'bulk_notification':
      await createBulkNotifications(data);
      break;

    case 'system_alert':
      await createSystemAlert(data);
      break;

    default:
      throw new Error(`Unknown notification type: ${type}`);
  }

  return { success: true };
});

const reportJobProcessor = wrapJob('report', async (job) => {
  const { type, data } = job.data;

  switch (type) {
    case 'attendance_report':
      await generateAttendanceReport(data);
      break;

    case 'grade_report':
      await generateGradeReport(data);
      break;

    case 'financial_report':
      await generateFinancialReport(data);
      break;

    case 'data_export':
      await exportService.processExport(data.requestId);
      break;

    case 'scheduled_report':
      if (!data?.scheduleId) {
        throw new Error('Scheduled report ID is missing');
      }

      const { default: scheduledReportService } = await import('./scheduledReportService.js');
      await scheduledReportService.runScheduledReport(data.scheduleId);
      break;

    default:
      throw new Error(`Unknown report type: ${type}`);
  }

  return { success: true };
});

const cleanupJobProcessor = wrapJob('cleanup', async (job) => {
  const { type, data } = job.data;

  switch (type) {
    case 'expired_notifications':
      await cleanupExpiredNotifications(data);
      break;

    case 'old_logs':
      await cleanupOldLogs(data);
      break;

    case 'temp_files':
      await cleanupTempFiles(data);
      break;

    default:
      throw new Error(`Unknown cleanup type: ${type}`);
  }

  return { success: true };
});

// Job creation functions
const jobService = {

  /**
   * Add notification job to queue
   */
  async addNotificationJob(type, data, options = {}) {
    if (process.env.REDIS_ENABLED !== 'true' || !queues.notification) {
      logger.warn('Notification queue not available. Skipping job.', { type });
      return null;
    }
    const job = await queues.notification.add(`${type}_notification`, { type, data }, {
      delay: options.delay || 0,
      priority: options.priority || 0,
      ...options
    });

    logger.info(`Notification job queued: ${type}`, { jobId: job.id });
    return job;
  },

  /**
   * Add report job to queue
   */
  async addReportJob(type, data, options = {}) {
    if (process.env.REDIS_ENABLED !== 'true' || !queues.report) {
      logger.warn('Report queue not available. Skipping job.', { type });
      return null;
    }
    const job = await queues.report.add(`${type}_report`, { type, data }, {
      delay: options.delay || 0,
      priority: options.priority || 0,
      ...options
    });

    logger.info(`Report job queued: ${type}`, { jobId: job.id });
    return job;
  },

  /**
   * Add cleanup job to queue
   */
  async addCleanupJob(type, data, options = {}) {
    if (process.env.REDIS_ENABLED !== 'true' || !queues.cleanup) {
      logger.warn('Cleanup queue not available. Skipping job.', { type });
      return null;
    }
    const job = await queues.cleanup.add(`${type}_cleanup`, { type, data }, {
      delay: options.delay || 0,
      priority: options.priority || 0,
      ...options
    });

    logger.info(`Cleanup job queued: ${type}`, { jobId: job.id });
    return job;
  },

  /**
   * Schedule recurring jobs
   */
  async scheduleRecurringJobs() {
    if (process.env.REDIS_ENABLED !== 'true' || !queues.cleanup) {
      logger.warn('Cleanup queue not available. Skipping recurring job scheduling.');
      return;
    }
    // Clean up expired notifications daily
    await queues.cleanup.add(
      'daily_notification_cleanup',
      { type: 'expired_notifications', data: { daysOld: 30 } },
      {
        repeat: { cron: '0 2 * * *' }, // Daily at 2 AM
        jobId: 'daily_notification_cleanup'
      }
    );

    // Clean up old logs weekly
    await queues.cleanup.add(
      'weekly_log_cleanup',
      { type: 'old_logs', data: { daysOld: 30 } },
      {
        repeat: { cron: '0 3 * * 0' }, // Weekly on Sunday at 3 AM
        jobId: 'weekly_log_cleanup'
      }
    );

    logger.info('Recurring jobs scheduled');
  },

  /**
   * Get queue statistics
   */
  async getQueueStats() {
    if (process.env.REDIS_ENABLED !== 'true') {
      return {};
    }

    const stats = {};

    for (const [queueName, queue] of Object.entries(queues)) {
      if (queue) {
        stats[queueName] = {
          waiting: await queue.getWaiting(),
          active: await queue.getActive(),
          completed: await queue.getCompleted(),
          failed: await queue.getFailed(),
          delayed: await queue.getDelayed()
        };
      }
    }

    return stats;
  },

  /**
   * Graceful shutdown
   */
  async shutdown() {
    if (process.env.REDIS_ENABLED !== 'true') {
      return;
    }

    logger.info('Shutting down job queues...');

    // Close workers
    for (const worker of Object.values(workers)) {
      if (worker) {
        await worker.close();
      }
    }

    // Close queues
    for (const queue of Object.values(queues)) {
      if (queue) {
        await queue.close();
      }
    }

    // Close Redis connection if it exists and is connected
    if (redisConnection && redisConnection.status === 'ready') {
      try {
        await redisConnection.quit();
      } catch (error) {
        logger.warn('Error closing Redis connection:', error.message);
      }
    }

    logger.info('Job queues shut down successfully');
  }
};

// Helper functions for job processors

async function createUserNotification(data) {
  const { userId, title, message, type = 'info', priority = 'normal', data: extraData } = data;

  const notification = new Notification({
    recipient: userId,
    title,
    message,
    type,
    priority,
    data: extraData,
    read: false,
    createdAt: new Date()
  });

  await notification.save();

  // Emit real-time notification if user is online
  // This would integrate with socketService

  return notification;
}

async function createBulkNotifications(data) {
  const { userIds, title, message, type = 'info', priority = 'normal' } = data;

  const notifications = userIds.map(userId => ({
    recipient: userId,
    title,
    message,
    type,
    priority,
    read: false,
    createdAt: new Date()
  }));

  const result = await Notification.insertMany(notifications);
  return result;
}

async function createSystemAlert(data) {
  // Implementation for system-wide alerts
  // This could send notifications to all users or specific groups
}

async function generateAttendanceReport(data) {
  // Implementation for generating attendance reports
  // This would process attendance data and generate PDF/Excel reports
}

async function generateGradeReport(data) {
  // Implementation for generating grade reports
}

async function generateFinancialReport(data) {
  // Implementation for generating financial reports
}

async function cleanupExpiredNotifications(data) {
  const { daysOld = 30 } = data;
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  const result = await Notification.deleteMany({
    createdAt: { $lt: cutoffDate },
    read: true
  });

  logger.info(`Cleaned up ${result.deletedCount} expired notifications`);
  return result;
}

async function cleanupOldLogs(data) {
  // Implementation for cleaning up old log files
}

async function cleanupTempFiles(data) {
  // Implementation for cleaning up temporary files
}

// Export for use in other modules
export { queues, workers };
export default jobService;
