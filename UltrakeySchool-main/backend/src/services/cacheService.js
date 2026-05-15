/**
 * Cache Service using Redis
 * Provides caching functionality for improved performance
 */

import redis from 'redis';
import logger from '../utils/logger.js';

// Redis client
let redisClient = null;

// Default TTL values (in seconds)
const DEFAULT_TTL = 300; // 5 minutes
const CACHE_KEYS = {
  STUDENTS_LIST: 'students:list',
  STUDENT_DETAIL: 'students:detail',
  TEACHERS_LIST: 'teachers:list',
  TEACHER_DETAIL: 'teachers:detail',
  CLASSES_LIST: 'classes:list',
  SUBJECTS_LIST: 'subjects:list',
  STATISTICS: 'statistics',
  DASHBOARD: 'dashboard',
  DROPDOWNS: 'dropdowns',
  SETTINGS: 'settings'
};

/**
 * Initialize Redis connection
 */
export const initRedis = async () => {
  try {
    if (process.env.REDIS_URL) {
      redisClient = redis.createClient({
        url: process.env.REDIS_URL,
        legacyMode: false
      });

      redisClient.on('error', (err) => {
        logger.error('Redis Client Error:', err);
      });

      redisClient.on('connect', () => {
        logger.info('Redis connected successfully');
      });

      await redisClient.connect();
      return true;
    } else {
      logger.warn('REDIS_URL not configured, using in-memory cache');
      return false;
    }
  } catch (error) {
    logger.error('Failed to initialize Redis:', error);
    return false;
  }
};

/**
 * Get cached data
 * @param {string} key - Cache key
 * @returns {Promise<any>} Cached data or null
 */
export const getCache = async (key) => {
  try {
    if (!redisClient) {
      return null;
    }
    
    const data = await redisClient.get(key);
    if (data) {
      logger.debug(`Cache hit: ${key}`);
      return JSON.parse(data);
    }
    logger.debug(`Cache miss: ${key}`);
    return null;
  } catch (error) {
    logger.error('Cache get error:', error);
    return null;
  }
};

/**
 * Set cached data
 * @param {string} key - Cache key
 * @param {any} value - Data to cache
 * @param {number} ttl - Time to live in seconds
 */
export const setCache = async (key, value, ttl = DEFAULT_TTL) => {
  try {
    if (!redisClient) {
      return false;
    }
    
    await redisClient.setEx(key, ttl, JSON.stringify(value));
    logger.debug(`Cache set: ${key} (TTL: ${ttl}s)`);
    return true;
  } catch (error) {
    logger.error('Cache set error:', error);
    return false;
  }
};

/**
 * Delete cached data
 * @param {string} key - Cache key
 */
export const deleteCache = async (key) => {
  try {
    if (!redisClient) {
      return false;
    }
    
    await redisClient.del(key);
    logger.debug(`Cache deleted: ${key}`);
    return true;
  } catch (error) {
    logger.error('Cache delete error:', error);
    return false;
  }
};

/**
 * Delete cache by pattern
 * @param {string} pattern - Key pattern (e.g., 'students:*')
 */
export const deleteCacheByPattern = async (pattern) => {
  try {
    if (!redisClient) {
      return false;
    }
    
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(keys);
      logger.debug(`Cache deleted by pattern: ${pattern} (${keys.length} keys)`);
    }
    return true;
  } catch (error) {
    logger.error('Cache delete by pattern error:', error);
    return false;
  }
};

/**
 * Clear all cache
 */
export const clearAllCache = async () => {
  try {
    if (!redisClient) {
      return false;
    }
    
    await redisClient.flushAll();
    logger.info('All cache cleared');
    return true;
  } catch (error) {
    logger.error('Clear all cache error:', error);
    return false;
  }
};

// In-memory cache fallback (when Redis is not available)
const memoryCache = new Map();

export const getMemoryCache = (key) => {
  const item = memoryCache.get(key);
  if (!item) return null;
  
  if (Date.now() > item.expiry) {
    memoryCache.delete(key);
    return null;
  }
  
  return item.value;
};

export const setMemoryCache = (key, value, ttl = DEFAULT_TTL) => {
  memoryCache.set(key, {
    value,
    expiry: Date.now() + (ttl * 1000)
  });
};

export const deleteMemoryCache = (key) => {
  memoryCache.delete(key);
};

// Unified cache functions (use Redis if available, fallback to memory)
export const cacheGet = async (key) => {
  if (redisClient) {
    return getCache(key);
  }
  return getMemoryCache(key);
};

export const cacheSet = async (key, value, ttl) => {
  if (redisClient) {
    return setCache(key, value, ttl);
  }
  setMemoryCache(key, value, ttl);
  return true;
};

export const cacheDelete = async (key) => {
  if (redisClient) {
    return deleteCache(key);
  }
  deleteMemoryCache(key);
  return true;
};

// Cache helpers for specific entities
export const cacheStudents = async (students, page = 1) => {
  const key = `${CACHE_KEYS.STUDENTS_LIST}:${page}`;
  return cacheSet(key, students, 300); // 5 minutes
};

export const getCachedStudents = async (page = 1) => {
  const key = `${CACHE_KEYS.STUDENTS_LIST}:${page}`;
  return cacheGet(key);
};

export const invalidateStudentsCache = async () => {
  return deleteCacheByPattern('students:*');
};

export const cacheTeachers = async (teachers, page = 1) => {
  const key = `${CACHE_KEYS.TEACHERS_LIST}:${page}`;
  return cacheSet(key, teachers, 300);
};

export const getCachedTeachers = async (page = 1) => {
  const key = `${CACHE_KEYS.TEACHERS_LIST}:${page}`;
  return cacheGet(key);
};

export const invalidateTeachersCache = async () => {
  return deleteCacheByPattern('teachers:*');
};

export const cacheStatistics = async (stats) => {
  return cacheSet(CACHE_KEYS.STATISTICS, stats, 600); // 10 minutes
};

export const getCachedStatistics = async () => {
  return cacheGet(CACHE_KEYS.STATISTICS);
};

export const invalidateStatisticsCache = async () => {
  return cacheDelete(CACHE_KEYS.STATISTICS);
};

export default {
  initRedis,
  getCache,
  setCache,
  deleteCache,
  deleteCacheByPattern,
  clearAllCache,
  cacheGet,
  cacheSet,
  cacheDelete,
  cacheStudents,
  getCachedStudents,
  invalidateStudentsCache,
  cacheTeachers,
  getCachedTeachers,
  invalidateTeachersCache,
  cacheStatistics,
  getCachedStatistics,
  invalidateStatisticsCache
};
