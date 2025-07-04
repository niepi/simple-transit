// Mock for virtual:pwa-register in test environment
export function registerSW(options: {
  onNeedRefresh?: () => void;
  onOfflineReady?: () => void;
  onRegistered?: (registration: ServiceWorkerRegistration) => void;
  onRegisterError?: (error: Error) => void;
}) {
  // Return a mock function that doesn't actually register a service worker
  return () => Promise.resolve()
}