<script setup lang="ts">
import { ref, onErrorCaptured } from 'vue'
import { ExclamationTriangleIcon, ArrowPathIcon } from '@heroicons/vue/24/solid'

const props = defineProps<{
  fallbackComponent?: string
}>()

const hasError = ref(false)
const errorMessage = ref('')
const errorDetails = ref('')

onErrorCaptured((error: Error, instance, info) => {
  hasError.value = true
  errorMessage.value = error.message || 'An unexpected error occurred'
  errorDetails.value = info || ''
  
  // Log error for debugging
  console.error('Error caught by boundary:', error)
  console.error('Component info:', info)
  
  // Prevent the error from propagating
  return false
})

function retry() {
  hasError.value = false
  errorMessage.value = ''
  errorDetails.value = ''
}

function reportError() {
  // In a real app, this would send to error reporting service
  console.log('Error reported:', { errorMessage: errorMessage.value, errorDetails: errorDetails.value })
  alert('Error reported. Thank you!')
}
</script>

<template>
  <div v-if="hasError" class="min-h-[200px] flex items-center justify-center p-4">
    <div class="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-6">
      <div class="flex items-center mb-4">
        <ExclamationTriangleIcon class="w-8 h-8 text-red-500 mr-3" />
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
          Something went wrong
        </h3>
      </div>
      
      <p class="text-gray-600 dark:text-gray-300 mb-4">
        {{ errorMessage }}
      </p>
      
      <details v-if="errorDetails" class="mb-4">
        <summary class="text-sm text-gray-500 dark:text-gray-400 cursor-pointer hover:text-gray-700 dark:hover:text-gray-200">
          Technical Details
        </summary>
        <pre class="mt-2 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900 p-2 rounded overflow-auto">{{ errorDetails }}</pre>
      </details>
      
      <div class="flex gap-2">
        <button
          @click="retry"
          class="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          <ArrowPathIcon class="w-4 h-4" />
          Try Again
        </button>
        
        <button
          @click="reportError"
          class="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
        >
          Report Issue
        </button>
      </div>
    </div>
  </div>
  
  <slot v-else />
</template>