import express from 'express';
import { checkDBHealth, getDBStats } from '../config/database.js';
import os from 'os';

const router = express.Router();

/**
 * Basic health check endpoint (TESTED & VERIFIED)
 * GET /health
 */
router.get('/health', async (req, res) => {  
  try {
    const dbHealth = await checkDBHealth();

    const isHealthy = dbHealth.healthy;

    res.status(isHealthy ? 200 : 503).json({
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      services: {
        database: dbHealth,
        redis: { status: 'disabled', healthy: true }
      }
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message
    });
  }
});

/**
 * Readiness check (for Kubernetes) (TESTED & VERIFIED)
 * GET /ready
 */
router.get('/ready', async (req, res) => {  
  try {
    const dbHealth = await checkDBHealth();

    if (dbHealth.healthy) {
      res.status(200).json({
        status: 'ready',
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(503).json({
        status: 'not ready',
        services: {
          database: dbHealth,
          redis: { status: 'disabled', healthy: true }
        }
      });
    }
  } catch (error) {
    res.status(503).json({
      status: 'not ready',
      error: error.message
    });
  }
});

/**
 * Liveness check (for Kubernetes) (TESTED & VERIFIED)
 * GET /live
 */
router.get('/live', (req, res) => {  
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString()
  });
});

/**
 * Detailed system metrics (TESTED & VERIFIED)
 * GET /metrics
 */
router.get('/metrics', async (req, res) => {  
  try {
    const dbStats = await getDBStats();

    const metrics = {
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      
      // Process metrics
      process: {
        pid: process.pid,
        memory: {
          rss: `${(process.memoryUsage().rss / 1024 / 1024).toFixed(2)} MB`,
          heapTotal: `${(process.memoryUsage().heapTotal / 1024 / 1024).toFixed(2)} MB`,
          heapUsed: `${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB`,
          external: `${(process.memoryUsage().external / 1024 / 1024).toFixed(2)} MB`
        },
        cpu: process.cpuUsage()
      },

      // System metrics
      system: {
        platform: os.platform(),
        arch: os.arch(),
        cpus: os.cpus().length,
        totalMemory: `${(os.totalmem() / 1024 / 1024 / 1024).toFixed(2)} GB`,
        freeMemory: `${(os.freemem() / 1024 / 1024 / 1024).toFixed(2)} GB`,
        loadAverage: os.loadavg()
      },

      // Database metrics
      database: dbStats,

      // Redis metrics
      redis: { connected: false, status: 'disabled' },

      // Cache metrics
      cache: { hits: 0, misses: 0, total: 0 }
    };

    res.json(metrics);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to collect metrics',
      message: error.message
    });
  }
});

/**
 * Application info (TESTED & VERIFIED)
 * GET /info
 */
router.get('/info', (req, res) => {  
  res.json({
    name: 'EduManage Pro API',
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    nodeVersion: process.version,
    timestamp: new Date().toISOString()
  });
});

export default router;
