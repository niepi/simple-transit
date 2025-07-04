import { ref } from 'vue'

export function useErrorHandling() {
  const errors = ref<Array<{ id: string; message: string; timestamp: Date }>>([])

  function addError(message: string, error?: Error) {
    const errorEntry = {
      id: Math.random().toString(36).substr(2, 9),
      message,
      timestamp: new Date()
    }
    
    errors.value.push(errorEntry)
    
    // Log to console for debugging
    console.error(`[${errorEntry.timestamp.toISOString()}] ${message}`, error)
    
    // Auto-remove after 10 seconds
    setTimeout(() => {
      removeError(errorEntry.id)
    }, 10000)
    
    return errorEntry.id
  }

  function removeError(id: string) {
    const index = errors.value.findIndex(error => error.id === id)
    if (index > -1) {
      errors.value.splice(index, 1)
    }
  }

  function clearErrors() {
    errors.value = []
  }

  async function withErrorHandling<T>(
    operation: () => Promise<T>,
    errorMessage: string = 'An error occurred'
  ): Promise<T | null> {
    try {
      return await operation()
    } catch (error) {
      addError(errorMessage, error as Error)
      return null
    }
  }

  return {
    errors,
    addError,
    removeError,
    clearErrors,
    withErrorHandling
  }
}