import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';
import logger from '../utils/logger.js';

// Initialize Sentry
export const initializeSentry = () => {
  if (process.env.SENTRY_DSN) {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV || 'development',
      release: process.env.npm_package_version || '1.0.0',

      // Performance monitoring
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
      profilesSampleRate: 1.0,

      integrations: [
        // HTTP integration for automatic instrumentation
        new Sentry.Integrations.Http({ tracing: true }),

        // MongoDB integration for database monitoring
        new Sentry.Integrations.Mongo(),

        // Profiling integration for performance monitoring
        nodeProfilingIntegration(),
      ],

      // Capture console logs as breadcrumbs
      beforeBreadcrumb: (breadcrumb, hint) => {
        // Filter out noisy breadcrumbs in development
        if (process.env.NODE_ENV === 'development') {
          return null;
        }
        return breadcrumb;
      },

      // Error filtering
      beforeSend: (event, hint) => {
        // Filter out certain types of errors
        const error = hint?.originalException;
        if (error && error.message && error.message.includes('ValidationError')) {
          // Tag validation errors but still send them
          event.tags = { ...event.tags, error_type: 'validation' };
        }

        return event;
      },

      // Custom sampling for transactions
      tracesSampler: (samplingContext) => {
        // Skip health check endpoints
        if (samplingContext.request?.url?.includes('/health')) {
          return 0.01; // Very low sampling for health checks
        }

        // Higher sampling for API endpoints
        if (samplingContext.request?.url?.includes('/api/')) {
          return 0.5; // 50% sampling for API calls
        }

        return 0.1; // 10% sampling for other requests
      }
    });

    // Set user context if available
    Sentry.setUser({
      id: 'system',
      username: 'eduadmin-backend'
    });

    // Set tags
    Sentry.setTag('service', 'eduadmin-backend');
    Sentry.setTag('version', process.env.npm_package_version || '1.0.0');

    logger.info('Sentry monitoring initialized');
  } else {
    logger.warn('SENTRY_DSN not configured - monitoring disabled');
  }
};

// Error tracking utilities
export const errorTracking = {
  /**
   * Capture an exception
   */
  captureException: (error, context = {}) => {
    logger.error('Exception captured by Sentry:', error);

    if (Sentry) {
      Sentry.withScope((scope) => {
        // Add context information
        Object.keys(context).forEach(key => {
          scope.setTag(key, context[key]);
        });

        // Set user context if available
        if (context.userId) {
          scope.setUser({ id: context.userId });
        }

        // Set level
        scope.setLevel('error');

        Sentry.captureException(error);
      });
    }
  },

  /**
   * Capture a message
   */
  captureMessage: (message, level = 'info', context = {}) => {
    logger.log(level, `Message captured by Sentry: ${message}`);

    if (Sentry) {
      Sentry.withScope((scope) => {
        // Add context information
        Object.keys(context).forEach(key => {
          scope.setTag(key, context[key]);
        });

        scope.setLevel(level);
        Sentry.captureMessage(message, level);
      });
    }
  },

  /**
   * Start a transaction for performance monitoring
   */
  startTransaction: (name, op) => {
    if (Sentry && typeof Sentry.startTransaction === 'function') {
      return Sentry.startTransaction({
        name,
        op
      });
    }
    // Return a mock transaction object if Sentry is not available
    return {
      setStatus: () => {},
      setHttpStatus: () => {},
      setData: () => {},
      setTag: () => {},
      setTags: () => {},
      finish: () => {}
    };
  },

  /**
   * Set user context
   */
  setUser: (user) => {
    if (Sentry) {
      Sentry.setUser(user);
    }
  },

  /**
   * Set tags
   */
  setTag: (key, value) => {
    if (Sentry) {
      Sentry.setTag(key, value);
    }
  },

  /**
   * Set extra context
   */
  setContext: (key, context) => {
    if (Sentry) {
      Sentry.setContext(key, context);
    }
  },

  /**
   * Add breadcrumb for debugging
   */
  addBreadcrumb: (breadcrumb) => {
    if (Sentry) {
      Sentry.addBreadcrumb(breadcrumb);
    }
  }
};

// Performance monitoring utilities
export const performanceMonitoring = {
  /**
   * Monitor database query performance
   */
  monitorDatabaseQuery: async (operation, collection, query, callback) => {
    const transaction = errorTracking.startTransaction(
      `db.${operation}`,
      'db.query'
    );

    if (transaction) {
      transaction.setTag('collection', collection);
      transaction.setData('query', query);
    }

    const startTime = Date.now();

    try {
      const result = await callback();
      const duration = Date.now() - startTime;

      // Set performance data
      if (transaction) {
        transaction.setMeasurement('query_duration', duration, 'millisecond');
        transaction.setData('result_count', Array.isArray(result) ? result.length : 1);
        transaction.setStatus('ok');
      }

      // Log slow queries
      if (duration > 1000) {
        logger.warn(`Slow database query: ${operation} on ${collection}`, {
          duration: `${duration}ms`,
          query
        });
      }

      return result;
    } catch (error) {
      if (transaction) {
        transaction.setStatus('internal_error');
        errorTracking.captureException(error, {
          operation,
          collection,
          query,
          duration: Date.now() - startTime
        });
      }
      throw error;
    } finally {
      if (transaction) {
        transaction.finish();
      }
    }
  },

  /**
   * Monitor API endpoint performance
   */
  monitorAPIEndpoint: (req, res, next) => {
    const transaction = errorTracking.startTransaction(
      `${req.method} ${req.route?.path || req.path}`,
      'http.server'
    );

    if (transaction) {
      transaction.setTag('method', req.method);
      transaction.setTag('endpoint', req.route?.path || req.path);
      transaction.setData('query', req.query);
      transaction.setData('params', req.params);

      if (req.user) {
        transaction.setUser({ id: req.user.id });
      }
    }

    const startTime = Date.now();

    // Override res.end to capture response
    const originalEnd = res.end;
    res.end = function(...args) {
      const duration = Date.now() - startTime;

      if (transaction) {
        transaction.setMeasurement('request_duration', duration, 'millisecond');
        transaction.setTag('status_code', res.statusCode);

        // Set transaction status based on response code
        if (res.statusCode >= 500) {
          transaction.setStatus('internal_error');
        } else if (res.statusCode >= 400) {
          transaction.setStatus('invalid_argument');
        } else {
          transaction.setStatus('ok');
        }

        transaction.finish();
      }

      // Log slow requests
      if (duration > 5000) {
        logger.warn(`Slow API request: ${req.method} ${req.path}`, {
          duration: `${duration}ms`,
          statusCode: res.statusCode,
          userId: req.user?.id
        });
      }

      originalEnd.apply(this, args);
    };

    next();
  },

  /**
   * Monitor background job performance
   */
  monitorBackgroundJob: async (jobName, jobData, callback) => {
    const transaction = errorTracking.startTransaction(
      `job.${jobName}`,
      'queue.task'
    );

    if (transaction) {
      transaction.setTag('job_name', jobName);
      transaction.setData('job_data', jobData);
    }

    const startTime = Date.now();

    try {
      const result = await callback();
      const duration = Date.now() - startTime;

      if (transaction) {
        transaction.setMeasurement('job_duration', duration, 'millisecond');
        transaction.setStatus('ok');
        transaction.setData('result', result);
      }

      logger.info(`Background job completed: ${jobName}`, {
        duration: `${duration}ms`
      });

      return result;
    } catch (error) {
      if (transaction) {
        transaction.setStatus('internal_error');
        errorTracking.captureException(error, {
          jobName,
          jobData,
          duration: Date.now() - startTime
        });
      }

      logger.error(`Background job failed: ${jobName}`, {
        error: error.message,
        jobData
      });

      throw error;
    } finally {
      if (transaction) {
        transaction.finish();
      }
    }
  }
};

// Alerting utilities
export const alerting = {
  /**
   * Send alert for critical errors
   */
  sendCriticalAlert: (message, context = {}) => {
    logger.error(`CRITICAL ALERT: ${message}`, context);

    if (Sentry) {
      errorTracking.captureMessage(`🚨 CRITICAL: ${message}`, 'fatal', {
        ...context,
        alert_type: 'critical'
      });
    }

    // Here you could integrate with other alerting services
    // like Slack, PagerDuty, etc.
  },

  /**
   * Send alert for system issues
   */
  sendSystemAlert: (message, context = {}) => {
    logger.warn(`SYSTEM ALERT: ${message}`, context);

    if (Sentry) {
      errorTracking.captureMessage(`⚠️ SYSTEM: ${message}`, 'warning', {
        ...context,
        alert_type: 'system'
      });
    }
  },

  /**
   * Send alert for performance issues
   */
  sendPerformanceAlert: (message, context = {}) => {
    logger.warn(`PERFORMANCE ALERT: ${message}`, context);

    if (Sentry) {
      errorTracking.captureMessage(`🐌 PERFORMANCE: ${message}`, 'warning', {
        ...context,
        alert_type: 'performance'
      });
    }
  }
};

// Health check integration with Sentry
export const healthCheckIntegration = {
  /**
   * Report health check results to Sentry
   */
  reportHealthCheck: (healthData) => {
    if (healthData.status !== 'healthy') {
      errorTracking.captureMessage(
        `Health check failed: ${healthData.status}`,
        'error',
        {
          health_status: healthData.status,
          checks: healthData.checks,
          alert_type: 'health_check'
        }
      );
    }

    // Send metrics to Sentry
    if (Sentry) {
      Sentry.metrics.increment('health_check_total', 1);
      Sentry.metrics.set('health_check_status', healthData.status === 'healthy' ? 1 : 0);
    }
  }
};

export default {
  initializeSentry,
  errorTracking,
  performanceMonitoring,
  alerting,
  healthCheckIntegration
};
