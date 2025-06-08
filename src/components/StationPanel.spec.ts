import { describe, it, expect } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import StationPanel from './StationPanel.vue'
import { useStationsStore } from '../stores/stations'

// simple mock for fetch
global.fetch = vi.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve({ departures: [] }) })) as any;

describe('StationPanel.vue simple', () => {
  it('mounts and calls fetchDepartures', async () => {
    const pinia = createPinia();
    setActivePinia(pinia);
    const store = useStationsStore();
    vi.spyOn(store, 'fetchDepartures').mockResolvedValue(void 0);
    const wrapper = mount(StationPanel, { props: { station: { id: '1', name: 'Test', lines: [], location: { latitude: 0, longitude: 0, altitude: null }, notes: null, type: 'station', slug: 'test', distance: 0 } }, global: { plugins: [pinia] } });
    await flushPromises();
    expect(wrapper.text()).toContain('Test');
    expect(store.fetchDepartures).toHaveBeenCalled();
  });
});
