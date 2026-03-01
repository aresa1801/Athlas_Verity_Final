// Core Web Vitals targets
export const PERFORMANCE_TARGETS = {
  LCP: 2500, // Largest Contentful Paint (milliseconds)
  FID: 100, // First Input Delay (milliseconds)
  CLS: 0.1, // Cumulative Layout Shift
  TTFB: 600, // Time to First Byte
}

// Code splitting utilities
export function createLazyComponent<P extends object>(
  componentImport: () => Promise<{ default: React.ComponentType<P> }>,
  loading?: React.ComponentType
) {
  return {
    loader: componentImport,
    loading: loading || (() => <div>Loading...</div>),
  }
}

// Image optimization helpers
export const IMAGE_SIZES = {
  thumbnail: { width: 96, height: 96 },
  card: { width: 384, height: 256 },
  hero: { width: 1200, height: 600 },
  fullWidth: { width: 1920, height: 1080 },
}

export function generateImageSrcSet(basePath: string, sizes: number[]) {
  return sizes.map((size) => `${basePath}?w=${size} ${size}w`).join(', ')
}

// Request batching for API calls
export class RequestBatcher {
  private queue: Map<string, any[]> = new Map()
  private timers: Map<string, NodeJS.Timeout> = new Map()
  private batchSize = 10
  private batchDelay = 50 // milliseconds

  constructor(private onBatch: (key: string, items: any[]) => Promise<void>) {}

  add(key: string, item: any) {
    if (!this.queue.has(key)) {
      this.queue.set(key, [])
    }

    const items = this.queue.get(key)!
    items.push(item)

    // Clear existing timer
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key)!)
    }

    // Execute batch if size reached
    if (items.length >= this.batchSize) {
      this.flush(key)
    } else {
      // Set timer for delayed batch
      const timer = setTimeout(() => this.flush(key), this.batchDelay)
      this.timers.set(key, timer)
    }
  }

  private async flush(key: string) {
    const items = this.queue.get(key)
    if (!items || items.length === 0) return

    this.queue.delete(key)
    this.timers.delete(key)

    try {
      await this.onBatch(key, items)
    } catch (error) {
      console.error('[v0] Batch operation failed:', error)
    }
  }

  clear() {
    this.queue.clear()
    this.timers.forEach((timer) => clearTimeout(timer))
    this.timers.clear()
  }
}

// Intersection Observer utilities
export function useIntersectionObserver(callback: (entries: IntersectionObserverEntry[]) => void) {
  return new IntersectionObserver(callback, {
    rootMargin: '50px',
    threshold: 0.1,
  })
}

// Web Worker utility
export function createWorker(scriptUrl: string) {
  return new Worker(scriptUrl)
}

// Performance metrics tracking
export const performanceMetrics = {
  mark(name: string) {
    if (typeof performance !== 'undefined') {
      performance.mark(name)
    }
  },

  measure(name: string, startMark: string, endMark: string) {
    if (typeof performance !== 'undefined') {
      try {
        performance.measure(name, startMark, endMark)
        const measure = performance.getEntriesByName(name)[0]
        console.log(`[v0] ${name}: ${measure.duration.toFixed(2)}ms`)
        return measure.duration
      } catch (error) {
        console.warn(`[v0] Performance measurement failed: ${error}`)
      }
    }
  },

  getMetrics() {
    if (typeof performance === 'undefined') return null

    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
    const paint = performance.getEntriesByType('paint')

    return {
      ttfb: navigation?.responseStart - navigation?.fetchStart,
      dcl: navigation?.domContentLoadedEventEnd - navigation?.fetchStart,
      load: navigation?.loadEventEnd - navigation?.fetchStart,
      fcp: paint.find((p) => p.name === 'first-contentful-paint')?.startTime,
    }
  },
}

// Debounce utility for expensive operations
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null

  return function (...args: Parameters<T>) {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

// Throttle utility for high-frequency events
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean

  return function (...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

// Memoization for expensive computations
export function memoize<T extends (...args: any[]) => any>(func: T): T {
  const cache = new Map()

  return ((...args: Parameters<T>) => {
    const key = JSON.stringify(args)

    if (cache.has(key)) {
      return cache.get(key)
    }

    const result = func(...args)
    cache.set(key, result)
    return result
  }) as T
}

// Connection status monitoring
export function isLowBandwidth() {
  if (navigator && 'connection' in navigator) {
    const connection = (navigator as any).connection
    return connection.effectiveType === '3g' || connection.effectiveType === '4g'
  }
  return false
}

// Request cancellation with AbortController
export function createCancelableRequest(promise: Promise<any>) {
  const abortController = new AbortController()

  return {
    promise,
    cancel: () => abortController.abort(),
    signal: abortController.signal,
  }
}
