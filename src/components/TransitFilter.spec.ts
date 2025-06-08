import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import TransitFilter from './TransitFilter.vue'

describe('TransitFilter.vue simple', () => {
  it('mounts', () => {
    const pinia = createPinia();
    setActivePinia(pinia);
    const wrapper = mount(TransitFilter, { global: { plugins: [pinia] } });
    expect(wrapper.exists()).toBe(true);
  });
});
