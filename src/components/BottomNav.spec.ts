import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import BottomNav from './BottomNav.vue'
import { useFavoritesStore } from '../stores/favorites'

// Mock @heroicons/vue/24/solid
// We only need to mock StarIcon, but mocking the whole path is safer if other icons were used.
vi.mock('@heroicons/vue/24/solid', () => ({
  StarIcon: {
    name: 'StarIcon',
    template: '<svg data-testid="star-icon" class="w-5 h-5"></svg>',
  },
}))

describe('BottomNav.vue', () => {
  let pinia: ReturnType<typeof createPinia>
  let favoritesStore: ReturnType<typeof useFavoritesStore>

  // Define classes for active/inactive states for clarity in tests
  const uniqueActiveClasses = ['bg-blue-700', 'dark:bg-blue-800']
  const uniqueInactiveClasses = ['bg-blue-400', 'dark:bg-blue-600', 'hover:bg-blue-600', 'dark:hover:bg-blue-700']
  const commonClasses = ['text-white', 'flex-1', 'px-4', 'py-3', 'text-sm', 'font-medium', 'transition-colors']


  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
    favoritesStore = useFavoritesStore()

    // Reset store state before each test
    favoritesStore.activeView = 'all' // Default to 'all' view

    // Spy on store actions
    vi.spyOn(favoritesStore, 'setActiveView')
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('renders "All Stations" and "Favorites" buttons', () => {
    const wrapper = mount(BottomNav, {
      global: {
        plugins: [pinia],
      },
    })
    const buttons = wrapper.findAll('button')
    expect(buttons.length).toBe(2)
    expect(buttons[0].text()).toBe('All Stations')
    expect(buttons[1].text()).toContain('Favorites') // Contains "Favorites" and has StarIcon
    expect(buttons[1].findComponent({ name: 'StarIcon' }).exists()).toBe(true)
  })

  describe('Active button state based on favoritesStore.activeView', () => {
    it('correctly applies active class to "All Stations" button when activeView is "all"', async () => {
      favoritesStore.activeView = 'all'
      const wrapper = mount(BottomNav, {
        global: {
          plugins: [pinia],
        },
      })
      await wrapper.vm.$nextTick() // Wait for reactivity

      const allStationsButton = wrapper.findAll('button')[0]
      const favoritesButton = wrapper.findAll('button')[1]

      // All Stations button should be active
      uniqueActiveClasses.forEach(cls => expect(allStationsButton.classes()).toContain(cls))
      uniqueInactiveClasses.forEach(cls => expect(allStationsButton.classes()).not.toContain(cls))
      commonClasses.forEach(cls => expect(allStationsButton.classes()).toContain(cls))
      
      // Favorites button should be inactive
      uniqueInactiveClasses.forEach(cls => expect(favoritesButton.classes()).toContain(cls))
      uniqueActiveClasses.forEach(cls => expect(favoritesButton.classes()).not.toContain(cls))
      commonClasses.forEach(cls => expect(favoritesButton.classes()).toContain(cls))
    })

    it('correctly applies active class to "Favorites" button when activeView is "favorites"', async () => {
      favoritesStore.activeView = 'favorites'
      const wrapper = mount(BottomNav, {
        global: {
          plugins: [pinia],
        },
      })
      await wrapper.vm.$nextTick() // Wait for reactivity

      const allStationsButton = wrapper.findAll('button')[0]
      const favoritesButton = wrapper.findAll('button')[1]
      
      // All Stations button should be inactive
      uniqueInactiveClasses.forEach(cls => expect(allStationsButton.classes()).toContain(cls))
      uniqueActiveClasses.forEach(cls => expect(allStationsButton.classes()).not.toContain(cls))
      commonClasses.forEach(cls => expect(allStationsButton.classes()).toContain(cls))

      // Favorites button should be active
      uniqueActiveClasses.forEach(cls => expect(favoritesButton.classes()).toContain(cls))
      uniqueInactiveClasses.forEach(cls => expect(favoritesButton.classes()).not.toContain(cls))
      commonClasses.forEach(cls => expect(favoritesButton.classes()).toContain(cls))
    })
  })

  describe('Calling favoritesStore.setActiveView on button click', () => {
    it('calls setActiveView with "all" when "All Stations" button is clicked', async () => {
      const wrapper = mount(BottomNav, {
        global: {
          plugins: [pinia],
        },
      })
      const allStationsButton = wrapper.findAll('button')[0]
      await allStationsButton.trigger('click')

      expect(favoritesStore.setActiveView).toHaveBeenCalledTimes(1)
      expect(favoritesStore.setActiveView).toHaveBeenCalledWith('all')
    })

    it('calls setActiveView with "favorites" when "Favorites" button is clicked', async () => {
      // Set initial view to 'all' to see a change
      favoritesStore.activeView = 'all'
      const wrapper = mount(BottomNav, {
        global: {
          plugins: [pinia],
        },
      })
      const favoritesButton = wrapper.findAll('button')[1]
      await favoritesButton.trigger('click')

      expect(favoritesStore.setActiveView).toHaveBeenCalledTimes(1)
      expect(favoritesStore.setActiveView).toHaveBeenCalledWith('favorites')
    })

    it('calls setActiveView correctly on multiple clicks', async () => {
      const wrapper = mount(BottomNav, {
        global: {
          plugins: [pinia],
        },
      })
      const allStationsButton = wrapper.findAll('button')[0]
      const favoritesButton = wrapper.findAll('button')[1]

      await favoritesButton.trigger('click')
      expect(favoritesStore.setActiveView).toHaveBeenLastCalledWith('favorites')
      
      await allStationsButton.trigger('click')
      expect(favoritesStore.setActiveView).toHaveBeenLastCalledWith('all')
      
      await favoritesButton.trigger('click')
      expect(favoritesStore.setActiveView).toHaveBeenLastCalledWith('favorites')

      expect(favoritesStore.setActiveView).toHaveBeenCalledTimes(3)
    })
  })

  it('StarIcon is rendered inside the Favorites button', () => {
    const wrapper = mount(BottomNav, {
      global: {
        plugins: [pinia],
      },
    })
    const favoritesButton = wrapper.findAll('button')[1]
    const starIcon = favoritesButton.findComponent({ name: 'StarIcon' })
    expect(starIcon.exists()).toBe(true)
    // Check if it's inside the button structure as expected
    expect(favoritesButton.html()).toContain('data-testid="star-icon"')
  })
})
