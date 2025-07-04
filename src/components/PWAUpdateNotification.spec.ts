import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'
import PWAUpdateNotification from './PWAUpdateNotification.vue'

// Mock the usePWA composable
vi.mock('../composables/usePWA', () => ({
  usePWA: vi.fn(() => ({
    needRefresh: ref(false),
    offlineReady: ref(false),
    updateServiceWorker: vi.fn()
  }))
}))

describe('PWAUpdateNotification.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders without errors when no updates are needed', () => {
    const wrapper = mount(PWAUpdateNotification)
    expect(wrapper.exists()).toBe(true)
    
    // Should not show any notifications by default
    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
    expect(wrapper.find('[role="status"]').exists()).toBe(false)
  })

  it('shows update notification when needRefresh is true', async () => {
    const { usePWA } = await import('../composables/usePWA')
    vi.mocked(usePWA).mockReturnValue({
      needRefresh: ref(true),
      offlineReady: ref(false),
      updateServiceWorker: vi.fn()
    })

    const wrapper = mount(PWAUpdateNotification)
    await wrapper.vm.$nextTick()

    expect(wrapper.find('[role="alert"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('App Update Available')
    expect(wrapper.text()).toContain('Update Now')
    expect(wrapper.text()).toContain('Later')
  })

  it('shows offline ready notification when offlineReady is true', async () => {
    const { usePWA } = await import('../composables/usePWA')
    vi.mocked(usePWA).mockReturnValue({
      needRefresh: ref(false),
      offlineReady: ref(true),
      updateServiceWorker: vi.fn()
    })

    const wrapper = mount(PWAUpdateNotification)
    await wrapper.vm.$nextTick()

    expect(wrapper.find('[role="status"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('App Ready for Offline Use')
  })

  it('calls updateServiceWorker when update button is clicked', async () => {
    const mockUpdateServiceWorker = vi.fn()
    const { usePWA } = await import('../composables/usePWA')
    vi.mocked(usePWA).mockReturnValue({
      needRefresh: ref(true),
      offlineReady: ref(false),
      updateServiceWorker: mockUpdateServiceWorker
    })

    const wrapper = mount(PWAUpdateNotification)
    await wrapper.vm.$nextTick()

    const buttons = wrapper.findAll('button')
    const updateButton = buttons.find(button => button.text().includes('Update Now'))
    if (updateButton) {
      await updateButton.trigger('click')
      expect(mockUpdateServiceWorker).toHaveBeenCalled()
    }
  })

  it('can dismiss update notification', async () => {
    const { usePWA } = await import('../composables/usePWA')
    vi.mocked(usePWA).mockReturnValue({
      needRefresh: ref(true),
      offlineReady: ref(false),
      updateServiceWorker: vi.fn()
    })

    const wrapper = mount(PWAUpdateNotification)
    await wrapper.vm.$nextTick()

    // Find and click dismiss button
    const dismissButton = wrapper.find('[aria-label="Close"]')
    if (dismissButton.exists()) {
      await dismissButton.trigger('click')
      await wrapper.vm.$nextTick()
      
      // Notification should be hidden after dismissal
      expect(wrapper.find('[role="alert"]').exists()).toBe(false)
    }
  })
})