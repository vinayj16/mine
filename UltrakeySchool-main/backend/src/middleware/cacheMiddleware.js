import NodeCache from 'node-cache';
import { createClient } from 'redis';
import logger from '../utils/logger.js';

// Level 1: In-memory cache (fastest, per-instance)
const memoryCache = new NodeCache({
  stdTTL: 300, // 5 minutes default
  checkperiod: 60, // Check for expired keys every 60 seconds
  useClones: false, // Better performance
  maxKeys: 1000 // Limit memory usage
});

// Level 2: Redis cache (shared across instances)
let redisClient = null;

const initRedis = async () => {
  try {
    redisClient = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      socket: {
        reconnectStrategy: (retries) => Math.min(retries * 50, 2000)
      }
    });

    redisClient.on('error', (err) => logger.error('Redis Client Error:', err));
    redisClient.on('connect', () => logger.info('Redis Client Connected'));
    
    await redisClient.connect();
  } catch (error) {
    logger.error('Redis initialization failed:', error);
  }
};

// Initialize Redis on module load if enabled
if (process.env.REDIS_CACHE_ENABLED === 'true') {
  initRedis();
}

/**
 * Multi-level caching middleware
 * @param {number} duration - Cache duration in seconds
 * @param {string} keyPrefix - Cache key prefix
 */
export const cacheMiddleware = (duration = 300, keyPrefix = 'cache') => {
  return async (req, res, next) => {
    // Skip caching for non-GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Generate cache key
    const userId = req.user?.id || 'anonymous';
    const tenantId = req.user?.tenant || 'default';
    const key = `${keyPrefix}:${tenantId}:${req.originalUrl}:${userId}`;

    try {
      // Check Level 1: Memory cache
      const memCached = memoryCache.get(key);
      if (memCached) {
        logger.debug(`Memory cache HIT: ${key}`);
        return res.json(memCached);
      }

      // Check Level 2: Redis cache
      if (redisClient && redisClient.isOpen) {
        const redisCached = await redisClient.get(key);
        if (redisCached) {
          logger.debug(`Redis cache HIT: ${key}`);
          const data = JSON.parse(redisCached);
          
          // Store in memory cache for next time
          memoryCache.set(key, data, duration);
          
          return res.json(data);
        }
      }

      // Cache MISS - Store original send function
      const originalJson = res.json.bind(res);

      // Override json function to cache response
      res.json = function (data) {
        // Only cache successful responses
        if (res.statusCode === 200) {
          // Store in memory cache
          memoryCache.set(key, data, duration);

          // Store in Redis cache
          if (redisClient && redisClient.isOpen) {
            redisClient.setEx(key, duration, JSON.stringify(data))
              .catch(err => logger.error('Redis cache set error:', err));
          }

          logger.debug(`Cache MISS - Stored: ${key}`);
        }

        // Call original json function
        return originalJson(data);
      };

      next();
    } catch (error) {
      logger.error('Cache middleware error:', error);
      next(); // Continue without caching on error
    }
  };
};

/**
 * Invalidate cache by pattern
 * @param {string} pattern - Cache key pattern to invalidate
 */
export const invalidateCache = async (pattern) => {
  try {
    // Clear memory cache
    const keys = memoryCache.keys();
    keys.forEach(key => {
      if (key.includes(pattern)) {
        memoryCache.del(key);
      }
    });

    // Clear Redis cache
    if (redisClient && redisClient.isOpen) {
      const redisKeys = await redisClient.keys(`*${pattern}*`);
      if (redisKeys.length > 0) {
        await redisClient.del(redisKeys);
      }
    }

    logger.info(`Cache invalidated for pattern: ${pattern}`);
  } catch (error) {
    logger.error('Cache invalidation error:', error);
  }
};

/**
 * Clear all cache
 */
export const clearAllCache = async () => {
  try {
    memoryCache.flushAll();
    
    if (redisClient && redisClient.isOpen) {
      await redisClient.flushDb();
    }
    
    logger.info('All cache cleared');
  } catch (error) {
    logger.error('Clear cache error:', error);
  }
};

/**
 * Get cache statistics
 */
export const getCacheStats = () => {
  const memStats = memoryCache.getStats();
  
  return {
    memory: {
      keys: memStats.keys,
      hits: memStats.hits,
      misses: memStats.misses,
      hitRate: memStats.hits / (memStats.hits + memStats.misses) || 0
    },
    redis: {
      connected: redisClient?.isOpen || false
    }
  };
};

export default {
  cacheMiddleware,
  invalidateCache,
  clearAllCache,
  getCacheStats
};
