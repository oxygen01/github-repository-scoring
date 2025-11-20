import { cleanInt } from '../utils/helpers'
import NodeCache from 'node-cache'

/**
 * Simple in-memory cache service using node-cache
 *
 * Default TTL: 15 minutes (900 seconds)
 * Automatically cleans up expired entries every 10 minutes
 */
class CacheService {
  private cache: NodeCache

  constructor() {
    // Time to live for each cache entry in seconds
    const ttl = cleanInt(process.env.CACHE_TTL_SECONDS) || 900 // 15 minutes default
    // How often to check for expired keys
    const checkPeriod = cleanInt(process.env.CACHE_CHECK_PERIOD) || 600 // 10 minutes

    this.cache = new NodeCache({
      stdTTL: ttl,
      checkperiod: checkPeriod,
      // WARNING: useClones is false for performance. Callers MUST NOT modify returned objects.
      useClones: false, // Better performance, don't clone objects
    })
  }

  get<T>(key: string): T | undefined {
    return this.cache.get<T>(key)
  }

  set<T>(key: string, value: T): boolean {
    return this.cache.set(key, value)
  }

  has(key: string): boolean {
    return this.cache.has(key)
  }

  del(key: string): number {
    return this.cache.del(key)
  }

  flush(): void {
    this.cache.flushAll()
  }

  getStats(): NodeCache.Stats {
    return this.cache.getStats()
  }
}

export const cacheService = new CacheService()
