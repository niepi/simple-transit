import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import TransitIcon from './TransitIcon.vue'
import type { TransitType } from '../types'

describe('TransitIcon.vue', () => {
  const testCases: { type: TransitType; expectedIcon: string }[] = [
    { type: 'sbahn', expectedIcon: '🚈' },
    { type: 'ubahn', expectedIcon: '🚇' },
    { type: 'tram', expectedIcon: '🚊' },
    { type: 'bus', expectedIcon: '🚌' },
    { type: 'ferry', expectedIcon: '⛴️' },
    { type: 'express', expectedIcon: '🚅' },
    { type: 'regional', expectedIcon: '🚂' },
    // Test case for default fallback
    { type: 'unknown' as TransitType, expectedIcon: '🚊' }, 
  ];

  testCases.forEach(({ type, expectedIcon }) => {
    it(`renders the correct icon for type "${type}"`, () => {
      const wrapper = mount(TransitIcon, {
        props: { type },
      })
      expect(wrapper.text()).toBe(expectedIcon)
      expect(wrapper.attributes('role')).toBe('img')
      expect(wrapper.attributes('aria-label')).toBe(type)
    })
  })

  it('applies the passed class to the span element', () => {
    const testClass = 'my-custom-class'
    const wrapper = mount(TransitIcon, {
      props: { type: 'bus', class: testClass },
    })
    expect(wrapper.classes()).toContain(testClass)
  })
  
  it('applies dynamic classes correctly', () => {
    const wrapper = mount(TransitIcon, {
      props: { type: 'sbahn', class: 'text-red-500' }
    })
    expect(wrapper.classes()).toContain('text-red-500')
  })

  it('emits a click event when the span is clicked', async () => {
    const wrapper = mount(TransitIcon, {
      props: { type: 'tram' },
    })
    await wrapper.trigger('click')
    // For native events, wrapper.emitted() will capture them if they bubble up
    // or if Vue Test Utils has specific handling for them on basic elements.
    // If it's a custom event defined with `defineEmits`, it would be wrapper.emitted().eventName
    // For native DOM events, we check if the event listener would have been called.
    // As there's no custom emit, we check the native event.
    // Vue Test Utils doesn't automatically record native DOM events on non-component root elements
    // unless there's a listener attached in the component that re-emits or handles it.
    // Since this component only has a <span>, we're testing if the browser would emit a click.
    // A more robust way for components would be to have an explicit emit.
    // For this component, we can assume the native event works as expected.
    // To make this testable via wrapper.emitted(), the component would need:
    // const emit = defineEmits(['click'])
    // <span @click="emit('click', $event)" ...>
    // For native events on the root element, wrapper.emitted() will capture them.
    // If the component had `emits: ['click']` and explicitly emitted, this would also work.
    // Here, we are testing that a native click on the span occurs.
    expect(wrapper.emitted().click).toBeTruthy()
    expect(wrapper.emitted().click?.length).toBe(1) // Check that it was emitted once
    // Optionally, check the event payload if needed, though for a native click it's just the MouseEvent
    expect(wrapper.emitted().click![0][0]).toBeInstanceOf(MouseEvent)
  })

  it('renders default icon for an unknown type', () => {
    const wrapper = mount(TransitIcon, {
      props: { type: 'helicopter' as TransitType }, // Cast to satisfy type, tests default case
    })
    expect(wrapper.text()).toBe('🚊') // Default icon
    expect(wrapper.attributes('aria-label')).toBe('helicopter')
  })
})
