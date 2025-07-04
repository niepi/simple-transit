import { ref, onMounted } from 'vue'

interface PerformanceMetric {
  name: string
  value: number
  timestamp: number
}

export function usePerformanceMonitoring() {
  const metrics = ref<PerformanceMetric[]>([])
  const isSupported = ref(false)

  onMounted(() => {
    isSupported.value = 'performance' in window && 'PerformanceObserver' in window
    
    if (isSupported.value) {
      initPerformanceMonitoring()
    }
  })

  function initPerformanceMonitoring() {
    // Monitor Core Web Vitals
    try {
      // Largest Contentful Paint (LCP)
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        entries.forEach((entry) => {
          if (entry.entryType === 'largest-contentful-paint') {
            addMetric('LCP', entry.startTime)
          }
        })
      })
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] })

      // First Input Delay (FID)
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        entries.forEach((entry) => {
          if (entry.entryType === 'first-input') {
            addMetric('FID', (entry as any).processingStart - entry.startTime)
          }
        })
      })
      fidObserver.observe({ entryTypes: ['first-input'] })

      // Cumulative Layout Shift (CLS)
      let clsValue = 0
      const clsObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        entries.forEach((entry) => {
          if (entry.entryType === 'layout-shift' && !(entry as any).hadRecentInput) {
            clsValue += (entry as any).value
            addMetric('CLS', clsValue)
          }
        })
      })
      clsObserver.observe({ entryTypes: ['layout-shift'] })

      // Time to Interactive (TTI) - approximation
      setTimeout(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
        if (navigation) {
          const tti = navigation.domInteractive - navigation.navigationStart
          addMetric('TTI', tti)
        }
      }, 1000)

    } catch (error) {
      console.warn('Performance monitoring setup failed:', error)
    }
  }

  function addMetric(name: string, value: number) {
    metrics.value.push({
      name,
      value: Math.round(value * 100) / 100, // Round to 2 decimal places
      timestamp: Date.now()
    })

    // Keep only last 50 metrics to prevent memory leaks
    if (metrics.value.length > 50) {
      metrics.value = metrics.value.slice(-50)
    }
  }

  function measureCustomMetric(name: string, fn: () => void | Promise<void>) {
    const start = performance.now()
    
    const result = fn()
    
    if (result instanceof Promise) {
      return result.finally(() => {
        const duration = performance.now() - start
        addMetric(name, duration)
      })
    } else {
      const duration = performance.now() - start
      addMetric(name, duration)
      return result
    }
  }

  function getMetricSummary() {
    const summary: Record<string, { latest: number; average: number; count: number }> = {}
    
    metrics.value.forEach(metric => {
      if (!summary[metric.name]) {
        summary[metric.name] = { latest: 0, average: 0, count: 0 }
      }
      
      summary[metric.name].latest = metric.value
      summary[metric.name].count++
    })

    // Calculate averages
    Object.keys(summary).forEach(name => {
      const values = metrics.value
        .filter(m => m.name === name)
        .map(m => m.value)
      
      summary[name].average = values.reduce((a, b) => a + b, 0) / values.length
    })

    return summary
  }

  return {
    metrics,
    isSupported,
    addMetric,
    measureCustomMetric,
    getMetricSummary
  }
}