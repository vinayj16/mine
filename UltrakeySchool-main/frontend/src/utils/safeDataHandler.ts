/**
 * Safe Data Handler - Ensures all API responses return proper data structures
 * Prevents "Cannot read properties of undefined" errors
 */

/**
 * Ensures the value is an array, returns empty array if not
 */
export function ensureArray<T>(value: any): T[] {
  if (Array.isArray(value)) {
    return value
  }
  if (value === null || value === undefined) {
    return []
  }
  // If it's an object with a data property that's an array
  if (typeof value === 'object' && Array.isArray(value.data)) {
    return value.data
  }
  return []
}

/**
 * Ensures the value is an object, returns empty object if not
 */
export function ensureObject<T extends object>(value: any): T {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as T
  }
  return {} as T
}

/**
 * Safely gets a nested property from an object
 */
export function safeGet<T>(obj: any, path: string, defaultValue: T): T {
  const keys = path.split('.')
  let result = obj
  
  for (const key of keys) {
    if (result === null || result === undefined) {
      return defaultValue
    }
    result = result[key]
  }
  
  return result !== undefined ? result : defaultValue
}

/**
 * Wraps an async function to ensure it always returns an array
 */
export function wrapArrayService<T, Args extends any[]>(
  serviceFn: (...args: Args) => Promise<T[]>
): (...args: Args) => Promise<T[]> {
  return async (...args: Args): Promise<T[]> => {
    try {
      const result = await serviceFn(...args)
      return ensureArray<T>(result)
    } catch (error) {
      console.error('[SafeDataHandler] Service call failed:', error)
      return []
    }
  }
}

/**
 * Wraps an async function to ensure it always returns an object
 */
export function wrapObjectService<T extends object, Args extends any[]>(
  serviceFn: (...args: Args) => Promise<T>
): (...args: Args) => Promise<T> {
  return async (...args: Args): Promise<T> => {
    try {
      const result = await serviceFn(...args)
      return ensureObject<T>(result)
    } catch (error) {
      console.error('[SafeDataHandler] Service call failed:', error)
      return {} as T
    }
  }
}
