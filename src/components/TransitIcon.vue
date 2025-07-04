<script setup lang="ts">
import { computed } from 'vue'
import type { TransitType } from '../types'

const props = defineProps<{
  type: TransitType
}>()

const icon = computed(() => {
  switch (props.type.toLowerCase()) {
    case 'sbahn':
      return '🚈'
    case 'ubahn':
      return '🚇'
    case 'tram':
      return '🚊'
    case 'bus':
      return '🚌'
    case 'ferry':
      return '⛴️'
    case 'express':
      return '🚅'
    case 'regional':
      return '🚂'
    default:
      return '🚊'
  }
})

const accessibleLabel = computed(() => {
  switch (props.type.toLowerCase()) {
    case 'sbahn':
      return 'S-Bahn (suburban train)'
    case 'ubahn':
      return 'U-Bahn (subway)'
    case 'tram':
      return 'Tram'
    case 'bus':
      return 'Bus'
    case 'ferry':
      return 'Ferry'
    case 'express':
      return 'Express train'
    case 'regional':
      return 'Regional train'
    default:
      return 'Transit vehicle'
  }
})
</script>

<template>
  <span role="img" :aria-label="accessibleLabel">{{ icon }}</span>
</template>
