<script setup lang="ts">
import { ref, computed } from 'vue'
import { usePWA } from '../composables/usePWA'
import { ArrowPathIcon, XMarkIcon } from '@heroicons/vue/24/outline'

const { needRefresh, offlineReady, updateServiceWorker } = usePWA()

const dismissed = ref(false)

const showUpdateNotification = computed(() => needRefresh.value && !dismissed.value)

const handleUpdate = async () => {
  try {
    await updateServiceWorker()
  } catch (error) {
    console.error('Failed to update app:', error)
  }
}

const dismissNotification = () => {
  dismissed.value = true
}
</script>

<template>
  <!-- Update Available Notification -->
  <Transition
    enter-active-class="transform ease-out duration-300 transition"
    enter-from-class="translate-y-2 opacity-0 sm:translate-y-0 sm:translate-x-2"
    enter-to-class="translate-y-0 opacity-100 sm:translate-x-0"
    leave-active-class="transition ease-in duration-100"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0"
  >
    <div
      v-if="showUpdateNotification"
      class="fixed top-4 right-4 z-[9999] max-w-sm w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg pointer-events-auto border border-gray-200 dark:border-gray-700"
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
    >
      <div class="p-4">
        <div class="flex items-start">
          <div class="flex-shrink-0">
            <ArrowPathIcon class="h-6 w-6 text-blue-400" aria-hidden="true" />
          </div>
          <div class="ml-3 w-0 flex-1 pt-0.5">
            <p class="text-sm font-medium text-gray-900 dark:text-white">
              App Update Available
            </p>
            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
              A new version is available with improvements and bug fixes.
            </p>
            <div class="mt-3 flex space-x-2">
              <button
                @click="handleUpdate"
                type="button"
                class="bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 ml-3 rounded-md px-3 py-2 text-sm font-medium text-white shadow-sm transition-colors"
              >
                Update Now
              </button>
              <button
                @click="dismissNotification"
                type="button"
                class="ml-3 rounded-md bg-white dark:bg-gray-800 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 transition-colors"
              >
                Later
              </button>
            </div>
          </div>
          <div class="ml-4 flex-shrink-0 flex">
            <button
              @click="dismissNotification"
              type="button"
              class="bg-white dark:bg-gray-800 rounded-md inline-flex text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 transition-colors"
            >
              <span class="sr-only">Close</span>
              <XMarkIcon class="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>