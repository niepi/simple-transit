import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import TransitFilter from './TransitFilter.vue'
import { usePreferencesStore } from '../stores/preferences'
import type { TransitType } from '../types'

// Mock TransitIcon component
vi.mock('./TransitIcon.vue', () => ({
  default: {
    name: 'TransitIcon',
    // use a prop name that is not a reserved keyword to avoid template compile errors
    props: ['type', 'cls'],
    template: '<span :data-testid="type" :class="cls">{{ type }} icon</span>',
  },
}))

// Simpler Element Plus Mocks
vi.mock('element-plus', async () => {
  return {
    ElCheckboxGroup: {
      name: 'ElCheckboxGroup',
      props: ['modelValue'],
      emits: ['update:modelValue'], // Keep emits for testing interaction
      template: '<div class="mock-el-checkbox-group" @click="$emit(\'update:modelValue\', [])"><slot /></div>', // Simplified interaction for test
    },
    ElCheckbox: {
      name: 'ElCheckbox',
      props: ['value', 'label'], // In El+, for a group, 'label' is the value, 'value' is for standalone.
                                 // The component uses :value="option.value" and :label="option.label"
                                 // Our mock will just capture these as passed.
      template: '<div class="mock-el-checkbox" :data-value="value" :data-label="label"><slot /></div>',
    },
  }
})

const transitOptionsInComponent: { label: string, value: TransitType }[] = [
  { label: 'S-Bahn', value: 'sbahn' },
  { label: 'U-Bahn', value: 'ubahn' },
  { label: 'Tram', value: 'tram' },
  { label: 'Bus', value: 'bus' },
  { label: 'Ferry', value: 'ferry' },
]
const transitTypes = transitOptionsInComponent.map(opt => opt.value)

describe('TransitFilter.vue', () => {
  let pinia: ReturnType<typeof createPinia>
  let preferencesStore: ReturnType<typeof usePreferencesStore>

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
    preferencesStore = usePreferencesStore()

    preferencesStore.preferences = {
      ...preferencesStore.preferences,
      enabledTransitTypes: [...transitTypes], 
    }
    vi.spyOn(preferencesStore, 'updatePreference')
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('renders a TransitIcon for each transit type within a (mocked) ElCheckbox', () => {
    const wrapper = mount(TransitFilter, {
      global: {
        plugins: [pinia],
      },
    })
    const checkboxes = wrapper.findAllComponents({ name: 'ElCheckbox' })
    expect(checkboxes.length).toBe(transitTypes.length)

    transitTypes.forEach((type, index) => {
      const checkbox = checkboxes[index]
      // The component passes option.value to the `label` prop
      expect(checkbox.props('label')).toBe(transitOptionsInComponent[index].value)
      const icon = checkbox.findComponent({ name: 'TransitIcon' })
      expect(icon.exists()).toBe(true)
      expect(icon.props('type')).toBe(type)
    })
  })

  it('binds enabledTransitTypes from preferencesStore to ElCheckboxGroup modelValue', () => {
    const testEnabledTypes: TransitType[] = ['sbahn', 'bus']
    preferencesStore.preferences.enabledTransitTypes = testEnabledTypes
    
    const wrapper = mount(TransitFilter, {
      global: {
        plugins: [pinia],
      },
    })
    
    const checkboxGroup = wrapper.findComponent({ name: 'ElCheckboxGroup' })
    expect(checkboxGroup.props('modelValue')).toEqual(testEnabledTypes)
  })

  it('calls updatePreference when ElCheckboxGroup modelValue changes', async () => {
    const wrapper = mount(TransitFilter, {
      global: {
        plugins: [pinia],
      },
    })
    
    const checkboxGroup = wrapper.findComponent({ name: 'ElCheckboxGroup' })
    
    const newSelectedTypes: TransitType[] = ['ubahn', 'tram']
    // Simulate the change event from ElCheckboxGroup by emitting 'update:modelValue'
    // This is how v-model binding works internally.
    await checkboxGroup.vm.$emit('update:modelValue', newSelectedTypes)
    
    expect(preferencesStore.updatePreference).toHaveBeenCalledTimes(1)
    expect(preferencesStore.updatePreference).toHaveBeenCalledWith('enabledTransitTypes', newSelectedTypes)
  })

  it('initializes ElCheckboxGroup with current preferences from the store', () => {
    const initialTypes: TransitType[] = ['ferry', 'tram']
    preferencesStore.preferences.enabledTransitTypes = initialTypes
    
    const wrapper = mount(TransitFilter, {
      global: {
        plugins: [pinia],
      },
    })
    const checkboxGroup = wrapper.findComponent({ name: 'ElCheckboxGroup' })
    expect(checkboxGroup.props('modelValue')).toEqual(initialTypes)
  })
})
