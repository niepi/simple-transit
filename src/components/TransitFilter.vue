<script setup lang="ts">
import { computed } from 'vue'
import { usePreferencesStore } from '../stores/preferences'
import type { TransitType } from '../types/preferences'
import { ElCheckboxGroup, ElCheckbox } from 'element-plus'
import TransitIcon from './TransitIcon.vue'

const store = usePreferencesStore()

const selectedTypes = computed({
  get: () => store.preferences.enabledTransitTypes,
  set: (types: TransitType[]) => store.updatePreference('enabledTransitTypes', types)
})

interface TransitOption {
  label: string
  value: TransitType
}

const transitOptions: TransitOption[] = [
  { label: 'S-Bahn', value: 'sbahn' },
  { label: 'U-Bahn', value: 'ubahn' },
  { label: 'Tram', value: 'tram' },
  { label: 'Bus', value: 'bus' },
  { label: 'Ferry', value: 'ferry' }
]
</script>

<template>
  <div class="flex flex-col gap-2 p-4 bg-white dark:bg-dark-card rounded-lg shadow-md">
    <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300">Transit Types</h3>
    <el-checkbox-group 
      v-model="selectedTypes" 
      class="flex flex-wrap gap-2"
    >
      <el-checkbox 
        v-for="option in transitOptions" 
        :key="option.value"
        :value="option.value"
        :label="option.label"
        class="!mr-0"
      >
        <div class="flex items-center gap-2">
          <transit-icon 
            :type="option.value" 
            class="w-4 h-4"
          />
          <span class="text-sm">{{ option.label }}</span>
        </div>
      </el-checkbox>
    </el-checkbox-group>
  </div>
</template>
