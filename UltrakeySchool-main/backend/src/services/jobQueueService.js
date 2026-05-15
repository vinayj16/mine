/**
 * Job Queue Service using BullMQ
 * Provides background job processing for emails, notifications, and analytics
 */

import Bull from 'bull';
import logger from '../utils/logger.js';

// Job queues
let emailQueue = null;
let notificationQueue = null;
let analyticsQueue = null;
let cleanupQueue = null;

/**
 * Initialize all job queues
 */
export const initJobQueues = () => {
  try {
    // Email queue
    emailQueue = new Bull('email-queue', {
      redis: {
        host: process.env.REDIS_HOST || '127.0.0.1',
        port: process.env.REDIS_PORT || 6379
      },
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000
        },
        removeOnComplete: 100,
        removeOnFail: 200
      }
    });

    // Notification queue
    notificationQueue = new Bull('notification-queue', {
      redis: {
        host: process.env.REDIS_HOST || '127.0.0.1',
        port: process.env.REDIS_PORT || 6379
      },
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000
        },
        removeOnComplete: 100,
        removeOnFail: 200
      }
    });

    // Analytics queue
    analyticsQueue = new Bull('analytics-queue', {
      redis: {
        host: process.env.REDIS_HOST || '127.0.0.1',
        port: process.env.REDIS_PORT || 6379
      },
      defaultJobOptions: {
        attempts: 2,
        removeOnComplete: 50,
        removeOnFail: 100
      }
    });

    // Cleanup queue
    cleanupQueue = new Bull('cleanup-queue', {
      redis: {
        host: process.env.REDIS_HOST || '127.0.0.1',
        port: process.env.REDIS_PORT || 6379
      },
      defaultJobOptions: {
        attempts: 1,
        removeOnComplete: true,
        removeOnFail: false
      }
    });

    // Set up event listeners
    setupQueueListeners(emailQueue, 'Email');
    setupQueueListeners(notificationQueue, 'Notification');
    setupQueueListeners(analyticsQueue, 'Analytics');
    setupQueueListeners(cleanupQueue, 'Cleanup');

    logger.info('Job queues initialized successfully');
    
    return {
      emailQueue,
      notificationQueue,
      analyticsQueue,
      cleanupQueue
    };
  } catch (error) {
    logger.error('Failed to initialize job queues:', error);
    return null;
  }
};

/**
 * Set up queue event listeners
 */
const setupQueueListeners = (queue, name) => {
  queue.on('completed', (job, result) => {
    logger.debug(`${name} job completed:`, job.id);
  });

  queue.on('failed', (job, err) => {
    logger.error(`${name} job failed:`, job.id, err.message);
  });

  queue.on('error', (error) => {
    logger.error(`${name} queue error:`, error);
  });

  queue.on('waiting', (jobId) => {
    logger.debug(`${name} job waiting:`, jobId);
  });

  queue.on('active', (job) => {
    logger.debug(`${name} job started:`, job.id);
  });

  queue.on('stalled', (job) => {
    logger.warn(`${name} job stalled:`, job.id);
  });
};

// ==================== EMAIL JOBS ====================

/**
 * Add email job to queue
 */
export const addEmailJob = async (jobData) => {
  try {
    const job = await emailQueue.add('send-email', jobData, {
      priority: jobData.priority || 2,
      delay: jobData.delay || 0
    });
    logger.info(`Email job added: ${job.id}`);
    return job;
  } catch (error) {
    logger.error('Failed to add email job:', error);
    throw error;
  }
};

/**
 * Add bulk email job
 */
export const addBulkEmailJob = async (emails) => {
  try {
    const jobs = await emailQueue.addBulk(
      emails.map(email => ({
        name: 'send-email',
        data: email,
        opts: { priority: email.priority || 2 }
      }))
    );
    logger.info(`Bulk email jobs added: ${jobs.length}`);
    return jobs;
  } catch (error) {
    logger.error('Failed to add bulk email jobs:', error);
    throw error;
  }
};

/**
 * Send welcome email job
 */
export const addWelcomeEmailJob = async (user) => {
  return addEmailJob({
    type: 'welcome',
    to: user.email,
    data: {
      name: user.name || user.firstName,
      email: user.email
    }
  });
};

/**
 * Send password reset email job
 */
export const addPasswordResetEmailJob = async (email, resetToken) => {
  return addEmailJob({
    type: 'password-reset',
    to: email,
    data: { resetToken }
  });
};

/**
 * Send fee reminder email job
 */
export const addFeeReminderEmailJob = async (email, studentName, amount, dueDate) => {
  return addEmailJob({
    type: 'fee-reminder',
    to: email,
    data: { studentName, amount, dueDate },
    priority: 1
  });
};

// ==================== NOTIFICATION JOBS ====================

/**
 * Add notification job to queue
 */
export const addNotificationJob = async (jobData) => {
  try {
    const job = await notificationQueue.add('send-notification', jobData, {
      priority: jobData.priority || 2,
      delay: jobData.delay || 0
    });
    logger.info(`Notification job added: ${job.id}`);
    return job;
  } catch (error) {
    logger.error('Failed to add notification job:', error);
    throw error;
  }
};

/**
 * Add attendance alert notification job
 */
export const addAttendanceAlertJob = async (student, status, date) => {
  return addNotificationJob({
    type: 'attendance-alert',
    userId: student.guardianId,
    data: {
      studentName: student.name,
      status,
      date,
      message: `Your child ${student.name} was marked ${status} on ${date}`
    }
  });
};

/**
 * Add exam result notification job
 */
export const addExamResultNotificationJob = async (studentId, examName) => {
  return addNotificationJob({
    type: 'exam-result',
    userId: studentId,
    data: {
      examName,
      message: `Your exam results for ${examName} have been published`
    }
  });
};

// ==================== ANALYTICS JOBS ====================

/**
 * Add analytics job to queue
 */
export const addAnalyticsJob = async (jobData) => {
  try {
    const job = await analyticsQueue.add('process-analytics', jobData, {
      priority: jobData.priority || 3
    });
    logger.info(`Analytics job added: ${job.id}`);
    return job;
  } catch (error) {
    logger.error('Failed to add analytics job:', error);
    throw error;
  }
};

/**
 * Add daily statistics calculation job
 */
export const addDailyStatisticsJob = async (institutionId) => {
  return addAnalyticsJob({
    type: 'daily-statistics',
    institutionId,
    data: { date: new Date() }
  });
};

// ==================== CLEANUP JOBS ====================

/**
 * Add cleanup job to queue
 */
export const addCleanupJob = async (jobData) => {
  try {
    const job = await cleanupQueue.add('cleanup', jobData);
    logger.info(`Cleanup job added: ${job.id}`);
    return job;
  } catch (error) {
    logger.error('Failed to add cleanup job:', error);
    throw error;
  }
};

/**
 * Add log rotation job
 */
export const addLogRotationJob = async () => {
  return addCleanupJob({
    type: 'log-rotation',
    data: {}
  });
};

// ==================== QUEUE MANAGEMENT ====================

/**
 * Get queue statistics
 */
export const getQueueStats = async () => {
  try {
    const [emailStats, notificationStats, analyticsStats, cleanupStats] = await Promise.all([
      emailQueue?.getJobCounts() || {},
      notificationQueue?.getJobCounts() || {},
      analyticsQueue?.getJobCounts() || {},
      cleanupQueue?.getJobCounts() || {}
    ]);

    return {
      email: emailStats,
      notification: notificationStats,
      analytics: analyticsStats,
      cleanup: cleanupStats
    };
  } catch (error) {
    logger.error('Failed to get queue stats:', error);
    return null;
  }
};

/**
 * Get failed jobs
 */
export const getFailedJobs = async (queueName, start = 0, end = 10) => {
  try {
    let queue;
    switch (queueName) {
      case 'email':
        queue = emailQueue;
        break;
      case 'notification':
        queue = notificationQueue;
        break;
      case 'analytics':
        queue = analyticsQueue;
        break;
      case 'cleanup':
        queue = cleanupQueue;
        break;
      default:
        return [];
    }

    const failed = await queue.getFailed(start, end);
    return failed;
  } catch (error) {
    logger.error('Failed to get failed jobs:', error);
    return [];
  }
};

/**
 * Retry failed jobs
 */
export const retryFailedJobs = async (queueName) => {
  try {
    let queue;
    switch (queueName) {
      case 'email':
        queue = emailQueue;
        break;
      case 'notification':
        queue = notificationQueue;
        break;
      case 'analytics':
        queue = analyticsQueue;
        break;
      case 'cleanup':
        queue = cleanupQueue;
        break;
      default:
        return 0;
    }

    const failed = await queue.getFailed();
    let retriedCount = 0;
    
    for (const job of failed) {
      await job.retry();
      retriedCount++;
    }
    
    logger.info(`Retried ${retriedCount} failed jobs from ${queueName} queue`);
    return retriedCount;
  } catch (error) {
    logger.error('Failed to retry jobs:', error);
    return 0;
  }
};

/**
 * Clear all jobs from queue
 */
export const clearQueue = async (queueName) => {
  try {
    let queue;
    switch (queueName) {
      case 'email':
        queue = emailQueue;
        break;
      case 'notification':
        queue = notificationQueue;
        break;
      case 'analytics':
        queue = analyticsQueue;
        break;
      case 'cleanup':
        queue = cleanupQueue;
        break;
      case 'all':
        await emailQueue?.empty();
        await notificationQueue?.empty();
        await analyticsQueue?.empty();
        await cleanupQueue?.empty();
        logger.info('All queues cleared');
        return true;
      default:
        return false;
    }

    await queue.empty();
    logger.info(`${queueName} queue cleared`);
    return true;
  } catch (error) {
    logger.error('Failed to clear queue:', error);
    return false;
  }
};

/**
 * Close all queues
 */
export const closeAllQueues = async () => {
  try {
    await Promise.all([
      emailQueue?.close(),
      notificationQueue?.close(),
      analyticsQueue?.close(),
      cleanupQueue?.close()
    ]);
    logger.info('All queues closed');
    return true;
  } catch (error) {
    logger.error('Failed to close queues:', error);
    return false;
  }
};

export default {
  initJobQueues,
  addEmailJob,
  addBulkEmailJob,
  addWelcomeEmailJob,
  addPasswordResetEmailJob,
  addFeeReminderEmailJob,
  addNotificationJob,
  addAttendanceAlertJob,
  addExamResultNotificationJob,
  addAnalyticsJob,
  addDailyStatisticsJob,
  addCleanupJob,
  addLogRotationJob,
  getQueueStats,
  getFailedJobs,
  retryFailedJobs,
  clearQueue,
  closeAllQueues
};
