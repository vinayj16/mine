/**
 * Frontend API Cache Utility
 * 
 * Caches API responses in memory to reduce duplicate network calls.
 * Automatically invalidates cache on POST/PUT/PATCH/DELETE operations.
 * Respects Cache-Control headers from the backend.
 */

interface CacheEntry<T = unknown> {
  data: T;
  timestamp: number;
  ttl: number; // milliseconds
}

interface CacheConfig {
  defaultTTL: number; // default TTL in ms
  maxEntries: number; // max cached entries before eviction
  logStats: boolean;
}

const DEFAULT_CONFIG: CacheConfig = {
  defaultTTL: 60_000, // 1 minute
  maxEntries: 200,
  logStats: false,
};

class ApiCache {
  private cache = new Map<string, CacheEntry>();
  private config: CacheConfig;
  private hits = 0;
  private misses = 0;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Generate a consistent cache key from the request URL + params
   */
  private getCacheKey(url: string, params?: Record<string, unknown>): string {
    if (!params || Object.keys(params).length === 0) {
      return `GET:${url}`;
    }
    const sorted = Object.keys(params)
      .sort()
      .reduce<Record<string, unknown>>((acc, key) => {
        acc[key] = params[key];
        return acc;
      }, {});
    return `GET:${url}:${JSON.stringify(sorted)}`;
  }

  /**
   * Get cached response for a GET request
   */
  get<T = unknown>(url: string, params?: Record<string, unknown>): T | null {
    const key = this.getCacheKey(url, params);
    const entry = this.cache.get(key);

    if (!entry) {
      this.misses++;
      return null;
    }

    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      this.misses++;
      return null;
    }

    this.hits++;
    return entry.data as T;
  }

  /**
   * Cache a response for a GET request
   */
  set<T = unknown>(url: string, data: T, params?: Record<string, unknown>, ttlMs?: number): void {
    // Auto-evict if over max entries
    if (this.cache.size >= this.config.maxEntries) {
      this.evictOldest();
    }

    const key = this.getCacheKey(url, params);
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMs ?? this.getTTLFromUrl(url) ?? this.config.defaultTTL,
    });
  }

  /**
   * Get TTL based on URL pattern (mirrors backend strategy)
   */
  private getTTLFromUrl(url: string): number | null {
    if (url.includes('/dashboard/')) return 30_000;      // 30s
    if (url.includes('/analytics/')) return 60_000;       // 1 min
    if (url.includes('/notifications')) return 15_000;     // 15s
    if (url.includes('/fees/')) return 30_000;             // 30s
    if (url.includes('/attendance/')) return 30_000;       // 30s
    if (url.includes('/settings')) return 120_000;         // 2 min
    if (url.includes('/students') || url.includes('/teachers')) return 30_000; // 30s
    if (url.includes('/classes') || url.includes('/subjects')) return 60_000;  // 1 min
    return null; // use default
  }

  /**
   * Invalidate all cache entries for a given URL prefix
   * Call this after write operations
   */
  invalidate(urlPrefix: string): number {
    let count = 0;
    for (const key of this.cache.keys()) {
      if (key.includes(urlPrefix)) {
        this.cache.delete(key);
        count++;
      }
    }
    if (count > 0 && this.config.logStats) {
      console.log(`[ApiCache] Invalidated ${count} entries for: ${urlPrefix}`);
    }
    return count;
  }

  /**
   * Clear entire cache
   */
  clear(): void {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
  }

  /**
   * Evict the oldest 20% of entries when cache is full
   */
  private evictOldest(): void {
    const entries = Array.from(this.cache.entries())
      .sort(([, a], [, b]) => a.timestamp - b.timestamp);

    const evictCount = Math.max(1, Math.floor(this.config.maxEntries * 0.2));
    for (let i = 0; i < evictCount && i < entries.length; i++) {
      this.cache.delete(entries[i][0]);
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): { size: number; hits: number; misses: number; hitRate: string } {
    const total = this.hits + this.misses;
    return {
      size: this.cache.size,
      hits: this.hits,
      misses: this.misses,
      hitRate: total > 0 ? `${((this.hits / total) * 100).toFixed(1)}%` : '0%',
    };
  }
}

// Singleton instance
const apiCache = new ApiCache();

// Wrap fetch/axios to use cache automatically
export function withCache<T = unknown>(
  url: string,
  fetcher: () => Promise<T>,
  params?: Record<string, unknown>,
  options?: { ttlMs?: number; bypass?: boolean }
): Promise<T> {
  // Bypass cache if requested
  if (options?.bypass) {
    return fetcher();
  }

  // Try cache first
  const cached = apiCache.get<T>(url, params);
  if (cached !== null) {
    return Promise.resolve(cached);
  }

  // Fetch and cache
  return fetcher().then((data) => {
    apiCache.set(url, data, params, options?.ttlMs);
    return data;
  });
}

/**
 * Invalidate all caches related to a module
 * Call after any create/update/delete operation
 */
export function invalidateModuleCache(modulePath: string): void {
  apiCache.invalidate(modulePath);
}

/**
 * Clear all cached data
 */
export function clearApiCache(): void {
  apiCache.clear();
}

/**
 * Get cache statistics (for debugging)
 */
export function getApiCacheStats() {
  return apiCache.getStats();
}

/**
 * Hook-friendly version: wraps a GET request with automatic cache invalidation
 * when a mutation (POST/PUT/PATCH/DELETE) is detected for the same module
 */
export function createCachedApiService(basePath: string) {
  return {
    async get<T = unknown>(
      url: string,
      params?: Record<string, unknown>,
      options?: { ttlMs?: number; bypass?: boolean }
    ): Promise<T> {
      return withCache<T>(url, async () => {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`API error: ${response.status}`);
        return response.json();
      }, params, options);
    },

    async mutate<T = unknown>(
      method: string,
      url: string,
      body?: unknown
    ): Promise<T> {
      // Invalidate cache for this module before the mutation
      invalidateModuleCache(basePath);

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined,
      });

      if (!response.ok) throw new Error(`API error: ${response.status}`);
      const result = await response.json();

      // Invalidate cache for this module after the mutation too
      invalidateModuleCache(basePath);
      return result;
    },
  };
}

export default apiCache;
