import logger from '../utils/logger.js';
import { getCache as redisGet, setCache as redisSet, deleteCachePattern as redisDelPattern, getRedisClient } from '../config/redis.js';

/**
 * In-memory cache store with TTL expiration
 */
class MemoryCacheStore {
  constructor() {
    this.cache = new Map();
    this.hits = 0;
    this.misses = 0;
    this.cleanupInterval = setInterval(() => this.prune(), 60000); // Clean every 60s
  }

  get(key) {
    const entry = this.cache.get(key);
    if (!entry) {
      this.misses++;
      return null;
    }
    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      this.misses++;
      return null;
    }
    this.hits++;
    return entry.value;
  }

  set(key, value, ttlSeconds) {
    this.cache.set(key, {
      value,
      expiry: Date.now() + (ttlSeconds * 1000)
    });
  }

  del(key) {
    this.cache.delete(key);
  }

  delByPattern(pattern) {
    const regex = new RegExp(
      '^' + pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*') + '$'
    );
    let count = 0;
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
        count++;
      }
    }
    return count;
  }

  prune() {
    const now = Date.now();
    let count = 0;
    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiry <= now) {
        this.cache.delete(key);
        count++;
      }
    }
    if (count > 0) {
      logger.debug(`[Cache] Pruned ${count} expired entries (total: ${this.cache.size})`);
    }
  }

  getStats() {
    return {
      size: this.cache.size,
      hits: this.hits,
      misses: this.misses,
      ratio: this.hits + this.misses > 0
        ? (this.hits / (this.hits + this.misses) * 100).toFixed(1) + '%'
        : '0%'
    };
  }

  clear() {
    this.cache.clear();
    logger.info('[Cache] Cache cleared');
  }

  destroy() {
    clearInterval(this.cleanupInterval);
    this.cache.clear();
  }
}

// Singleton cache store
const cacheStore = new MemoryCacheStore();

/**
 * Default TTL mappings by path pattern (in seconds)
 * More frequently-changing data gets shorter TTLs
 */
const DEFAULT_TTL_BY_PATTERN = [
  { pattern: /^\/api\/v1\/dashboard\//, ttl: 60 },       // Dashboard data: 1 min
  { pattern: /^\/api\/v1\/analytics\//, ttl: 120 },       // Analytics: 2 min
  { pattern: /^\/api\/v1\/statistics/, ttl: 300 },         // Statistics: 5 min
  { pattern: /^\/api\/v1\/students/, ttl: 60 },            // Students lists: 1 min
  { pattern: /^\/api\/v1\/teachers/, ttl: 60 },            // Teachers lists: 1 min
  { pattern: /^\/api\/v1\/classes/, ttl: 120 },            // Classes: 2 min
  { pattern: /^\/api\/v1\/subjects/, ttl: 300 },           // Subjects: 5 min
  { pattern: /^\/api\/v1\/fees/, ttl: 60 },                // Fees: 1 min
  { pattern: /^\/api\/v1\/attendance/, ttl: 60 },          // Attendance: 1 min
  { pattern: /^\/api\/v1\/exams/, ttl: 120 },              // Exams: 2 min
  { pattern: /^\/api\/v1\/notifications/, ttl: 30 },       // Notifications: 30 sec
  { pattern: /^\/api\/v1\/settings/, ttl: 300 },           // Settings: 5 min
  { pattern: /^\/api\/v1\/school-settings/, ttl: 300 },    // School settings: 5 min
  { pattern: /^\/api\/v1\/library/, ttl: 120 },            // Library: 2 min
  { pattern: /^\/api\/v1\/transport/, ttl: 120 },          // Transport: 2 min
  { pattern: /^\/api\/v1\/hostel/, ttl: 120 },             // Hostel: 2 min
  { pattern: /^\/api\/v1\/reports/, ttl: 120 },            // Reports: 2 min
  { pattern: /^\/api\/v1\/grades/, ttl: 120 },             // Grades: 2 min
  { pattern: /^\/api\/v1\/syllabi/, ttl: 300 },            // Syllabus: 5 min
  { pattern: /^\/api\/v1\/health/, ttl: 10 },              // Health: 10 sec
];

const DEFAULT_TTL = 60; // Default: 60 seconds

/**
 * Generate a cache key from request
 */
function getCacheKey(req) {
  // Include user ID + institution ID + path + query string for tenant-aware caching
  const userId = req.user?.id || 'anon';
  const institutionId = req.user?.institutionId || req.query?.institutionId || 'global';
  const queryString = JSON.stringify(req.query || {});
  return `api:${institutionId}:${userId}:${req.originalUrl}`;
}

/**
 * Get TTL for a given path
 */
function getTTLForPath(path) {
  for (const { pattern, ttl } of DEFAULT_TTL_BY_PATTERN) {
    if (pattern.test(path)) return ttl;
  }
  return DEFAULT_TTL;
}

/**
 * Check if a request should be cached
 */
function shouldCache(req) {
  // Only cache GET requests
  if (req.method !== 'GET') return false;

  // Skip cache for requests with cache-busting headers
  if (req.headers['cache-control'] === 'no-cache' || req.headers['pragma'] === 'no-cache') {
    return false;
  }

  // Skip cache for specific paths
  const skipPaths = [
    '/api/v1/auth/',
    '/api/v1/upload/',
    '/api/v1/ping',
    '/api/v1/health/'
  ];
  if (skipPaths.some(p => req.originalUrl.startsWith(p))) return false;

  return true;
}

/**
 * Cache middleware — caches GET responses with TTL based on route pattern
 * Uses Redis when available, falls back to in-memory cache.
 * Only caches 2xx responses.
 */
export const cacheMiddleware = async (req, res, next) => {
  if (!shouldCache(req)) {
    return next();
  }

  const cacheKey = getCacheKey(req);

  // 1. Try in-memory cache first (fastest)
  const cachedResponse = cacheStore.get(cacheKey);
  if (cachedResponse) {
    res.setHeader('X-Cache', 'HIT');
    return res.status(cachedResponse.status).json(cachedResponse.body);
  }

  // 2. Try Redis if available
  try {
    const redisClient = getRedisClient();
    if (redisClient) {
      const redisResult = await redisGet(cacheKey);
      if (redisResult) {
        // Populate in-memory cache from Redis hit
        const ttl = getTTLForPath(req.originalUrl);
        cacheStore.set(cacheKey, { status: redisResult.status, body: redisResult.body }, ttl);
        res.setHeader('X-Cache', 'HIT');
        return res.status(redisResult.status).json(redisResult.body);
      }
    }
  } catch (err) {
    logger.debug('[Cache] Redis lookup failed, using memory only:', err.message);
  }

  // 3. Cache miss — intercept response and store for next time
  const originalJson = res.json.bind(res);

  res.json = function (body) {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      const ttl = getTTLForPath(req.originalUrl);
      const payload = { status: res.statusCode, body };

      // Write to in-memory cache
      cacheStore.set(cacheKey, payload, ttl);

      // Write to Redis (fire-and-forget)
      redisSet(cacheKey, payload, ttl).catch(() => {});

      res.setHeader('X-Cache', 'MISS');
      res.setHeader('X-Cache-TTL', `${ttl}s`);
    }
    return originalJson(body);
  };

  next();
};

/**
 * Invalidate cache entries by path pattern
 * Call this after write operations to keep cache fresh
 * Also invalidates Redis cache if connected.
 * @param {string} pattern - e.g. 'students:*' or '/api/v1/students/*'
 */
export const invalidateCache = (pattern) => {
  const count = cacheStore.delByPattern(pattern);
  if (count > 0) {
    logger.debug(`[Cache] Invalidated ${count} entries matching: ${pattern}`);
  }
  // Also invalidate in Redis (fire-and-forget)
  redisDelPattern(`*${pattern.replace(/\//g, ':')}*`).catch(() => {});
  redisDelPattern(pattern).catch(() => {});
  return count;
};

/**
 * Invalidate all cache entries related to an entity type
 * @param {string} entityType - e.g. 'students', 'fees', 'classes'
 */
export const invalidateEntityCache = (entityType) => {
  return invalidateCache(`*${entityType}*`);
};

/**
 * Clear entire cache
 */
export const clearCache = () => {
  cacheStore.clear();
};

/**
 * Get cache statistics
 */
export const getCacheStats = () => {
  return cacheStore.getStats();
};

/**
 * Invalidate caches for common entity types
 * Call this from controllers after write operations
 */
export const invalidateRelatedCaches = (entityTypes) => {
  if (!Array.isArray(entityTypes)) entityTypes = [entityTypes];
  let total = 0;
  for (const type of entityTypes) {
    total += invalidateEntityCache(type);
  }
  return total;
};

// Export for testing/cleanup
export const __test__ = {
  cacheStore,
  getCacheKey
};

export default cacheMiddleware;
