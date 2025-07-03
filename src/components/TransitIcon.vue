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
</script>

<template>
  <span role="img" :aria-label="type">{{ icon }}</span>
</template>
