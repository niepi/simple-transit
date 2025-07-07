import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'
import { fileURLToPath, URL } from 'node:url'
import Icons from 'unplugin-icons/vite'
import { readFileSync } from 'fs'
import { execSync } from 'child_process'

// Get version from git tags for cache versioning
function getVersionFromGit() {
  try {
    // Get the latest git tag
    const version = execSync('git describe --tags --abbrev=0 2>/dev/null', { encoding: 'utf8' }).trim()
    
    // Remove 'v' prefix if present (e.g., v1.2.3 -> 1.2.3)
    return version.startsWith('v') ? version.slice(1) : version
  } catch (error) {
    // If no tags exist or git command fails, use commit hash
    try {
      const shortHash = execSync('git rev-parse --short HEAD 2>/dev/null', { encoding: 'utf8' }).trim()
      return `dev-${shortHash}`
    } catch (hashError) {
      // Fallback for non-git environments
      return 'dev-unknown'
    }
  }
}

const version = getVersionFromGit()

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '')
  
  // Ensure version is updated when config is loaded
  console.log(`🔄 Vite config loaded in ${mode} mode`)
  console.log(`📦 Current version from env: ${env.VITE_APP_VERSION || 'not found'}`)
  
  return {
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
      includeAssets: [
        'icons/favicon-16x16.png',
        'icons/favicon-32x32.png', 
        'icons/apple-touch-icon.png',
        'icons/*.png'
      ],
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
            src: 'icons/icon-72x72.png',
            sizes: '72x72',
            type: 'image/png'
          },
          {
            src: 'icons/icon-96x96.png',
            sizes: '96x96',
            type: 'image/png'
          },
          {
            src: 'icons/icon-128x128.png',
            sizes: '128x128',
            type: 'image/png'
          },
          {
            src: 'icons/icon-144x144.png',
            sizes: '144x144',
            type: 'image/png'
          },
          {
            src: 'icons/icon-152x152.png',
            sizes: '152x152',
            type: 'image/png'
          },
          {
            src: 'icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'icons/icon-192x192-maskable.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable'
          },
          {
            src: 'icons/icon-384x384.png',
            sizes: '384x384',
            type: 'image/png'
          },
          {
            src: 'icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'icons/icon-512x512-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
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
  },
  
  // Ensure environment variables are properly defined
  define: {
    __APP_VERSION__: JSON.stringify(env.VITE_APP_VERSION || version)
  }
  }
})
