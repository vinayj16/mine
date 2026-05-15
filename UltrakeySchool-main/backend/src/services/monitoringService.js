import axios from 'axios';
import logger from '../utils/logger.js';
import sentryService from './sentryService.js';

const isDatadogEnabled = Boolean(process.env.DATADOG_API_KEY && process.env.DATADOG_APP_KEY);

const datadogClient = isDatadogEnabled
  ? axios.create({
      baseURL: 'https://api.datadoghq.com/api/v1',
      timeout: 10000,
      headers: {
        'DD-API-KEY': process.env.DATADOG_API_KEY,
        'DD-APPLICATION-KEY': process.env.DATADOG_APP_KEY,
        'Content-Type': 'application/json'
      }
    })
  : null;

const sendDatadogMetric = async (series) => {
  if (!datadogClient) {
    logger.debug('Datadog metric skipped; service not configured');
    return;
  }

  try {
    await datadogClient.post('/series', { series });
  } catch (error) {
    logger.warn('Failed to send metric to Datadog', { error: error.message });
  }
};

const sendDatadogEvent = async (title, text, options = {}) => {
  if (!datadogClient) {
    logger.debug('Datadog event skipped; service not configured');
    return;
  }

  try {
    await datadogClient.post('/events', {
      title,
      text,
      ...options
    });
  } catch (error) {
    logger.warn('Failed to post event to Datadog', { error: error.message });
  }
};

const reportMetric = async (metric, value, tags = [], type = 'gauge') => {
  const timestamp = Math.floor(Date.now() / 1000);

  await sendDatadogMetric([
    {
      metric,
      points: [[timestamp, value]],
      type,
      tags
    }
  ]);

  if (sentryService?.errorTracking?.addBreadcrumb) {
    sentryService.errorTracking.addBreadcrumb({
      category: 'metric',
      message: `${metric}:${value}`,
      data: { tags }
    });
  }
};

const reportHealthCheck = async (healthData) => {
  await reportMetric('edumanage.health.status', healthData.status === 'healthy' ? 1 : 0, [
    `status:${healthData.status}`
  ]);

  if (healthData.status !== 'healthy') {
    await sendDatadogEvent('Health check failure', JSON.stringify(healthData), {
      priority: 'normal',
      alert_type: 'error',
      tags: ['service:backend']
    });
  }

  sentryService.healthCheckIntegration.reportHealthCheck(healthData);
};

const alertCritical = async (title, text, context = {}) => {
  await sendDatadogEvent(title, text, {
    priority: 'normal',
    alert_type: 'error',
    tags: ['service:backend', ...(context.tags || [])],
    ...context.options
  });

  sentryService.alerting.sendCriticalAlert(text, context);
};

const captureException = (error, context = {}) => {
  sentryService.errorTracking.captureException(error, context);
};

export default {
  reportMetric,
  reportHealthCheck,
  alertCritical,
  captureException,
  performanceMonitoring: sentryService.performanceMonitoring
};
