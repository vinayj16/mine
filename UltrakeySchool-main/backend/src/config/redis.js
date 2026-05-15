import { createClient } from 'redis';
import logger from '../utils/logger.js';

let redisClient = null;
let isConnected = false;

/**
 * Initialize Redis connection with retry logic
 */
export const connectRedis = async () => {
  try {
    redisClient = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      password: process.env.REDIS_PASSWORD,
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            logger.error('Redis: Max reconnection attempts reached');
            return new Error('Max reconnection attempts reached');
          }
          const delay = Math.min(retries * 50, 2000);
          logger.info(`Redis: Reconnecting in ${delay}ms (attempt ${retries})`);
          return delay;
        },
        connectTimeout: 10000,
        keepAlive: 30000
      },
      // Connection pool settings
      isolationPoolOptions: {
        min: 2,
        max: 10
      }
    });

    // Event handlers
    redisClient.on('connect', () => {
      logger.info('Redis: Connecting...');
    });

    redisClient.on('ready', () => {
      isConnected = true;
      logger.info('Redis: Connected and ready');
    });

    redisClient.on('error', (err) => {
      isConnected = false;
      logger.error('Redis Client Error:', err);
    });

    redisClient.on('reconnecting', () => {
      logger.info('Redis: Reconnecting...');
    });

    redisClient.on('end', () => {
      isConnected = false;
      logger.warn('Redis: Connection closed');
    });

    // Connect
    await redisClient.connect();

    // Test connection
    await redisClient.ping();
    logger.info('Redis: Connection test successful');

    return redisClient;
  } catch (error) {
    logger.error('Redis connection error:', error);
    throw error;
  }
};

/**
 * Get Redis client instance
 */
export const getRedisClient = () => {
  if (!redisClient || !isConnected) {
    logger.warn('Redis client not connected');
    return null;
  }
  return redisClient;
};

/**
 * Set value in Redis with expiration
 */
export const setCache = async (key, value, expirationInSeconds = 300) => {
  try {
    if (!redisClient || !isConnected) {
      logger.warn('Redis not available for caching');
      return false;
    }

    const serialized = JSON.stringify(value);
    await redisClient.setEx(key, expirationInSeconds, serialized);
    return true;
  } catch (error) {
    logger.error('Redis setCache error:', error);
    return false;
  }
};

/**
 * Get value from Redis
 */
export const getCache = async (key) => {
  try {
    if (!redisClient || !isConnected) {
      return null;
    }

    const value = await redisClient.get(key);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    logger.error('Redis getCache error:', error);
    return null;
  }
};

/**
 * Delete key from Redis
 */
export const deleteCache = async (key) => {
  try {
    if (!redisClient || !isConnected) {
      return false;
    }

    await redisClient.del(key);
    return true;
  } catch (error) {
    logger.error('Redis deleteCache error:', error);
    return false;
  }
};

/**
 * Delete multiple keys by pattern
 */
export const deleteCachePattern = async (pattern) => {
  try {
    if (!redisClient || !isConnected) {
      return false;
    }

    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(keys);
    }
    return true;
  } catch (error) {
    logger.error('Redis deleteCachePattern error:', error);
    return false;
  }
};

/**
 * Increment counter in Redis
 */
export const incrementCounter = async (key, expirationInSeconds = 60) => {
  try {
    if (!redisClient || !isConnected) {
      return 0;
    }

    const value = await redisClient.incr(key);
    
    // Set expiration on first increment
    if (value === 1) {
      await redisClient.expire(key, expirationInSeconds);
    }
    
    return value;
  } catch (error) {
    logger.error('Redis incrementCounter error:', error);
    return 0;
  }
};

/**
 * Get Redis statistics
 */
export const getRedisStats = async () => {
  try {
    if (!redisClient || !isConnected) {
      return { connected: false };
    }

    const info = await redisClient.info();
    const dbSize = await redisClient.dbSize();
    
    return {
      connected: true,
      keys: dbSize,
      info: info
    };
  } catch (error) {
    logger.error('Redis getStats error:', error);
    return { connected: false, error: error.message };
  }
};

/**
 * Health check for Redis
 */
export const checkRedisHealth = async () => {
  try {
    if (!redisClient || !isConnected) {
      return {
        status: 'disconnected',
        healthy: false
      };
    }

    await redisClient.ping();
    
    return {
      status: 'connected',
      healthy: true
    };
  } catch (error) {
    return {
      status: 'error',
      healthy: false,
      error: error.message
    };
  }
};

/**
 * Graceful shutdown
 */
export const disconnectRedis = async () => {
  try {
    if (redisClient && isConnected) {
      await redisClient.quit();
      logger.info('Redis: Disconnected gracefully');
    }
  } catch (error) {
    logger.error('Redis disconnect error:', error);
  }
};

// Graceful shutdown on process termination
process.on('SIGINT', async () => {
  await disconnectRedis();
});

process.on('SIGTERM', async () => {
  await disconnectRedis();
});

export default {
  connectRedis,
  getRedisClient,
  setCache,
  getCache,
  deleteCache,
  deleteCachePattern,
  incrementCounter,
  getRedisStats,
  checkRedisHealth,
  disconnectRedis
};
