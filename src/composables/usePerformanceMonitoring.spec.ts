import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { usePerformanceMonitoring } from './usePerformanceMonitoring'
import { mount } from '@vue/test-utils'
import { defineComponent } from 'vue'

// Mock performance and PerformanceObserver
// PerformanceObserver must be constructable (used via `new PerformanceObserver(cb)`)
const mockPerformanceObserverInstance = {
  observe: vi.fn(),
  disconnect: vi.fn(),
}

class MockPerformanceObserver {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  constructor(_cb: any) {
    return mockPerformanceObserverInstance as any
  }
}

global.PerformanceObserver = MockPerformanceObserver as any
global.performance = {
  ...global.performance,
  now: vi.fn(() => 1000),
  getEntriesByType: vi.fn(() => [
    {
      navigationStart: 0,
      domInteractive: 1500,
    }
  ]),
}

// Test component that uses the composable
const TestComponent = defineComponent({
  setup() {
    const { metrics, isSupported, addMetric, measureCustomMetric, getMetricSummary } = usePerformanceMonitoring()
    return {
      metrics,
      isSupported,
      addMetric,
      measureCustomMetric,
      getMetricSummary,
    }
  },
  template: '<div>Test</div>',
})

describe('usePerformanceMonitoring', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(global.performance.now).mockReturnValue(1000)
  })

  afterEach(() => {
    vi.clearAllTimers()
  })

  it('detects if performance monitoring is supported', () => {
    const wrapper = mount(TestComponent)
    expect(wrapper.vm.isSupported).toBe(true)
  })

  it('adds metrics correctly', () => {
    const wrapper = mount(TestComponent)
    
    wrapper.vm.addMetric('test-metric', 123.456)
    
    expect(wrapper.vm.metrics).toHaveLength(1)
    expect(wrapper.vm.metrics[0]).toEqual({
      name: 'test-metric',
      value: 123.46, // Rounded to 2 decimal places
      timestamp: expect.any(Number),
    })
  })

  it('limits metrics to 50 entries', () => {
    const wrapper = mount(TestComponent)
    
    // Add 55 metrics
    for (let i = 0; i < 55; i++) {
      wrapper.vm.addMetric(`metric-${i}`, i)
    }
    
    expect(wrapper.vm.metrics).toHaveLength(50)
    expect(wrapper.vm.metrics[0].name).toBe('metric-5') // First 5 should be removed
  })

  it('measures custom metrics synchronously', () => {
    const wrapper = mount(TestComponent)
    vi.mocked(global.performance.now)
      .mockReturnValueOnce(1000) // Start time
      .mockReturnValueOnce(1100) // End time
    
    const mockFn = vi.fn()
    wrapper.vm.measureCustomMetric('sync-test', mockFn)
    
    expect(mockFn).toHaveBeenCalledOnce()
    expect(wrapper.vm.metrics).toHaveLength(1)
    expect(wrapper.vm.metrics[0]).toEqual({
      name: 'sync-test',
      value: 100, // 1100 - 1000
      timestamp: expect.any(Number),
    })
  })

  it('measures custom metrics asynchronously', async () => {
    const wrapper = mount(TestComponent)
    vi.mocked(global.performance.now)
      .mockReturnValueOnce(1000) // Start time
      .mockReturnValueOnce(1200) // End time
    
    const mockAsyncFn = vi.fn(async () => {
      await new Promise(resolve => setTimeout(resolve, 100))
    })
    
    await wrapper.vm.measureCustomMetric('async-test', mockAsyncFn)
    
    expect(mockAsyncFn).toHaveBeenCalledOnce()
    expect(wrapper.vm.metrics).toHaveLength(1)
    expect(wrapper.vm.metrics[0]).toEqual({
      name: 'async-test',
      value: 200, // 1200 - 1000
      timestamp: expect.any(Number),
    })
  })

  it('generates metric summary correctly', () => {
    const wrapper = mount(TestComponent)
    
    wrapper.vm.addMetric('test-metric', 100)
    wrapper.vm.addMetric('test-metric', 200)
    wrapper.vm.addMetric('other-metric', 50)
    
    const summary = wrapper.vm.getMetricSummary()
    
    expect(summary).toEqual({
      'test-metric': {
        latest: 200,
        average: 150, // (100 + 200) / 2
        count: 2,
      },
      'other-metric': {
        latest: 50,
        average: 50,
        count: 1,
      },
    })
  })

  it('handles performance observer setup gracefully when not supported', () => {
    // Mock unsupported environment
    const originalPerformanceObserver = global.PerformanceObserver
    delete (global as any).PerformanceObserver
    
    const wrapper = mount(TestComponent)
    expect(wrapper.vm.isSupported).toBe(false)
    
    // Restore
    global.PerformanceObserver = originalPerformanceObserver
  })
})