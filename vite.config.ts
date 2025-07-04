import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'
import { fileURLToPath, URL } from 'node:url'
import Icons from 'unplugin-icons/vite'
import { readFileSync } from 'fs'

// Read version from package.json for cache versioning
const packageJson = JSON.parse(readFileSync('./package.json', 'utf8'))
const version = packageJson.version

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    Icons({
      compiler: 'vue3',
      autoInstall: true
    }),
    vue({
      template: {
        compilerOptions: {
          isCustomElement: (tag) => tag.startsWith('leaflet-')
        }
      }
    }),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest}'],
        cleanupOutdatedCaches: true,
        skipWaiting: false,
        clientsClaim: false,
        runtimeCaching: [
          {
            urlPattern: /\.(png|jpg|jpeg|svg|gif)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: `images-cache-v${version}`,
              expiration: {
                maxEntries: 60,
                maxAgeSeconds: 2592000, // 30 days
              },
            },
          },
        ],
      },
      manifest: {
        name: 'Berlin Transit Map',
        short_name: 'Transit Map',
        description: 'Real-time Berlin public transportation tracking',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      devOptions: {
        enabled: true, // Enable SW in development
        type: 'module',
      },
    })
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['vue', 'pinia', '@vueuse/core'],
          'map': ['leaflet'],
          'ui': ['@headlessui/vue', 'element-plus'],
          'icons': ['@heroicons/vue/24/solid', '@heroicons/vue/24/outline', '@element-plus/icons-vue']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  },
  optimizeDeps: {
    include: ['vue', 'pinia', '@vueuse/core', 'leaflet']
  }
})
