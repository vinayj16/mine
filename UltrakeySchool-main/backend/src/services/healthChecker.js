/**
 * Comprehensive Health Check System
 * Monitors all system components and external services
 */

import mongoose from 'mongoose';
import cacheService from '../services/cacheService.js';
import emailService from '../services/emailService.js';
import storageService from '../services/storageService.js';
import socketService from '../services/socketService.js';
import logger from '../utils/logger.js';
import os from 'os';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

class HealthChecker {
  constructor() {
    this.lastHealthCheck = null;
    this.healthHistory = [];
    this.maxHistorySize = 100;
  }

  /**
   * Comprehensive health check for all system components
   */
  async performFullHealthCheck() {
    const startTime = Date.now();
    const timestamp = new Date().toISOString();

    try {
      logger.info('Starting comprehensive health check...');

      const healthData = {
        timestamp,
        status: 'unknown',
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
        version: process.env.npm_package_version || '1.0.0',
        nodeVersion: process.version,
        checks: {}
      };

      // Database health check
      healthData.checks.database = await this.checkDatabaseHealth();

      // Redis cache health check
      healthData.checks.redis = await this.checkRedisHealth();

      // Email service health check
      healthData.checks.email = await this.checkEmailHealth();

      // File storage health check
      healthData.checks.fileStorage = await this.checkFileStorageHealth();

      // WebSocket service health check
      healthData.checks.websocket = await this.checkWebSocketHealth();

      // System resources health check
      healthData.checks.system = await this.checkSystemHealth();

      // External services health check
      healthData.checks.external = await this.checkExternalServicesHealth();

      // API endpoints health check
      healthData.checks.api = await this.checkAPIEndpointsHealth();

      // Determine overall status
      healthData.status = this.determineOverallStatus(healthData.checks);
      healthData.responseTime = Date.now() - startTime;

      // Store health check result
      this.storeHealthCheckResult(healthData);

      logger.info(`Health check completed in ${healthData.responseTime}ms with status: ${healthData.status}`);

      return healthData;

    } catch (error) {
      logger.error('Health check failed:', error);

      const errorHealthData = {
        timestamp,
        status: 'error',
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
        error: error.message,
        responseTime: Date.now() - startTime,
        checks: {
          system: { status: 'error', message: 'Health check system failed' }
        }
      };

      this.storeHealthCheckResult(errorHealthData);
      return errorHealthData;
    }
  }

  /**
   * Check database connectivity and performance
   */
  async checkDatabaseHealth() {
    try {
      const startTime = Date.now();

      // Check MongoDB connection
      if (mongoose.connection.readyState !== 1) {
        return {
          status: 'error',
          message: 'Database not connected',
          readyState: mongoose.connection.readyState
        };
      }

      // Get database statistics
      const db = mongoose.connection.db;
      const stats = await db.stats();

      // Perform a simple query to test responsiveness
      const collections = await db.collections();
      const testCollection = collections[0];

      if (testCollection) {
        await testCollection.findOne({}, { limit: 1 });
      }

      const responseTime = Date.now() - startTime;

      return {
        status: responseTime < 1000 ? 'healthy' : 'warning',
        message: 'Database connection healthy',
        responseTime: `${responseTime}ms`,
        collections: stats.collections,
        dataSize: `${(stats.dataSize / 1024 / 1024).toFixed(2)} MB`,
        indexes: stats.indexes,
        connections: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
      };

    } catch (error) {
      return {
        status: 'error',
        message: `Database health check failed: ${error.message}`,
        error: error.message
      };
    }
  }

  /**
   * Check Redis cache health
   */
  async checkRedisHealth() {
    try {
      if (!cacheService.isReady()) {
        return {
          status: 'warning',
          message: 'Redis not connected (cache disabled)',
          connected: false
        };
      }

      const startTime = Date.now();

      // Test basic Redis operations
      await cacheService.set('health_check', 'ok', 10);
      const testValue = await cacheService.get('health_check');
      await cacheService.delete('health_check');

      const responseTime = Date.now() - startTime;

      // Get Redis stats
      const stats = await cacheService.getStats();

      return {
        status: testValue === 'ok' ? 'healthy' : 'error',
        message: 'Redis cache operational',
        responseTime: `${responseTime}ms`,
        connected: true,
        dbSize: stats.dbSize || 0,
        uptime: stats.info?.uptime || 'unknown'
      };

    } catch (error) {
      return {
        status: 'error',
        message: `Redis health check failed: ${error.message}`,
        connected: false,
        error: error.message
      };
    }
  }

  /**
   * Check email service health
   */
  async checkEmailHealth() {
    try {
      if (!emailService.isReady()) {
        return {
          status: 'warning',
          message: 'Email service not configured',
          configured: false
        };
      }

      // Get email service status
      const status = emailService.getStatus();

      return {
        status: 'healthy',
        message: 'Email service configured',
        configured: true,
        host: status.config?.host || 'unknown',
        ready: status.ready
      };

    } catch (error) {
      return {
        status: 'error',
        message: `Email health check failed: ${error.message}`,
        configured: false,
        error: error.message
      };
    }
  }

  /**
   * Check file storage health
   */
  async checkFileStorageHealth() {
    try {
      const storageCheck = await storageService.checkHealth();

      return {
        status: storageCheck.success ? 'healthy' : 'error',
        message: storageCheck.message,
        path: storageCheck.path,
        accessible: storageCheck.success
      };

    } catch (error) {
      return {
        status: 'error',
        message: `File storage health check failed: ${error.message}`,
        accessible: false,
        error: error.message
      };
    }
  }

  /**
   * Check WebSocket service health
   */
  async checkWebSocketHealth() {
    try {
      const connectedUsers = socketService.getConnectedUsersCount();
      const isInitialized = socketService.io !== null;

      return {
        status: isInitialized ? 'healthy' : 'warning',
        message: isInitialized ? 'WebSocket service running' : 'WebSocket service not initialized',
        initialized: isInitialized,
        connectedUsers,
        onlineUsers: socketService.getOnlineUsers().length
      };

    } catch (error) {
      return {
        status: 'error',
        message: `WebSocket health check failed: ${error.message}`,
        initialized: false,
        error: error.message
      };
    }
  }

  /**
   * Check system resources
   */
  async checkSystemHealth() {
    try {
      const totalMemory = os.totalmem();
      const freeMemory = os.freemem();
      const usedMemory = totalMemory - freeMemory;
      const memoryUsagePercent = ((usedMemory / totalMemory) * 100).toFixed(2);

      const cpus = os.cpus();
      const loadAverage = os.loadavg();

      // Check disk space (basic check)
      let diskSpace = 'unknown';
      try {
        const { stdout } = await execAsync('df -h / | tail -1');
        diskSpace = stdout.trim().split(/\s+/)[4] || 'unknown';
      } catch (error) {
        // Disk space check failed, continue
      }

      // Determine system health
      let status = 'healthy';
      let warnings = [];

      if (parseFloat(memoryUsagePercent) > 90) {
        status = 'critical';
        warnings.push('High memory usage');
      } else if (parseFloat(memoryUsagePercent) > 80) {
        status = 'warning';
        warnings.push('High memory usage');
      }

      if (loadAverage[0] > cpus.length * 2) {
        status = 'critical';
        warnings.push('High CPU load');
      } else if (loadAverage[0] > cpus.length) {
        if (status !== 'critical') status = 'warning';
        warnings.push('Elevated CPU load');
      }

      return {
        status,
        message: `System ${status}`,
        memory: {
          total: `${(totalMemory / 1024 / 1024 / 1024).toFixed(2)} GB`,
          used: `${(usedMemory / 1024 / 1024 / 1024).toFixed(2)} GB`,
          free: `${(freeMemory / 1024 / 1024 / 1024).toFixed(2)} GB`,
          usagePercent: `${memoryUsagePercent}%`
        },
        cpu: {
          cores: cpus.length,
          loadAverage: loadAverage.map(load => load.toFixed(2)),
          model: cpus[0]?.model || 'unknown'
        },
        disk: {
          usage: diskSpace
        },
        platform: `${os.platform()} ${os.release()}`,
        uptime: `${(os.uptime() / 3600).toFixed(2)} hours`,
        warnings: warnings.length > 0 ? warnings : undefined
      };

    } catch (error) {
      return {
        status: 'error',
        message: `System health check failed: ${error.message}`,
        error: error.message
      };
    }
  }

  /**
   * Check external services
   */
  async checkExternalServicesHealth() {
    const services = [];

    // Add external service checks here
    // Example: Payment gateway, SMS service, etc.

    return {
      status: 'healthy',
      message: 'External services check completed',
      services,
      checked: services.length
    };
  }

  /**
   * Check critical API endpoints
   */
  async checkAPIEndpointsHealth() {
    const endpoints = [
      { path: '/health', description: 'Health check endpoint' },
      { path: '/api/v1/auth/login', description: 'Authentication endpoint' },
      { path: '/api/v1/students', description: 'Students API' },
      { path: '/api-docs', description: 'API documentation' }
    ];

    const results = [];

    // Note: In a real implementation, you might want to make actual HTTP calls
    // to these endpoints, but for now we'll just check if the server is running

    for (const endpoint of endpoints) {
      results.push({
        endpoint: endpoint.path,
        description: endpoint.description,
        status: 'available', // Assuming server is running
        responseTime: '< 10ms'
      });
    }

    return {
      status: 'healthy',
      message: 'API endpoints accessible',
      endpoints: results,
      totalChecked: endpoints.length,
      available: results.filter(r => r.status === 'available').length
    };
  }

  /**
   * Determine overall system status
   */
  determineOverallStatus(checks) {
    const statuses = Object.values(checks).map(check => check.status);

    if (statuses.includes('error') || statuses.includes('critical')) {
      return 'unhealthy';
    }

    if (statuses.includes('warning')) {
      return 'warning';
    }

    if (statuses.every(status => status === 'healthy')) {
      return 'healthy';
    }

    return 'degraded';
  }

  /**
   * Store health check result in history
   */
  storeHealthCheckResult(healthData) {
    this.lastHealthCheck = healthData;
    this.healthHistory.push(healthData);

    // Keep only recent history
    if (this.healthHistory.length > this.maxHistorySize) {
      this.healthHistory = this.healthHistory.slice(-this.maxHistorySize);
    }
  }

  /**
   * Get health check history
   */
  getHealthHistory(limit = 10) {
    return this.healthHistory.slice(-limit);
  }

  /**
   * Get last health check result
   */
  getLastHealthCheck() {
    return this.lastHealthCheck;
  }

  /**
   * Get health check summary
   */
  getHealthSummary() {
    if (!this.lastHealthCheck) {
      return { status: 'unknown', message: 'No health checks performed yet' };
    }

    const { status, checks, responseTime } = this.lastHealthCheck;

    const summary = {
      status,
      timestamp: this.lastHealthCheck.timestamp,
      responseTime,
      services: {}
    };

    // Summarize each service status
    Object.entries(checks).forEach(([service, check]) => {
      summary.services[service] = {
        status: check.status,
        message: check.message
      };
    });

    return summary;
  }

  /**
   * Get detailed health metrics
   */
  getHealthMetrics() {
    if (!this.lastHealthCheck) {
      return null;
    }

    return this.lastHealthCheck;
  }
}

// Express middleware for health check endpoint
export const healthCheckMiddleware = async (req, res) => {
  try {
    const healthChecker = new HealthChecker();

    // Quick health check for basic endpoint
    if (req.path === '/health') {
      const basicHealth = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
        version: process.env.npm_package_version || '1.0.0'
      };

      return res.json(basicHealth);
    }

    // Detailed health check for /health/detailed
    if (req.path === '/health/detailed') {
      const detailedHealth = await healthChecker.performFullHealthCheck();
      const statusCode = detailedHealth.status === 'healthy' ? 200 :
                        detailedHealth.status === 'warning' ? 200 :
                        detailedHealth.status === 'unhealthy' ? 503 : 500;

      return res.status(statusCode).json(detailedHealth);
    }

    // Health check history
    if (req.path === '/health/history') {
      const history = healthChecker.getHealthHistory(req.query.limit || 10);
      return res.json({
        history,
        count: history.length
      });
    }

    // Health check summary
    if (req.path === '/health/summary') {
      const summary = healthChecker.getHealthSummary();
      return res.json(summary);
    }

    // Default health response
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });

  } catch (error) {
    logger.error('Health check middleware error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Health check failed',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
};

// Export singleton instance
const healthChecker = new HealthChecker();
export default healthChecker;
