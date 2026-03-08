import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
  logLevel: 'info', // Show server info
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  plugins: [
    react(),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // React and core dependencies
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          
          // Firebase (largest dependency)
          'vendor-firebase': ['firebase/app', 'firebase/auth', 'firebase/firestore'],
          
          // UI libraries
          'vendor-ui': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-select',
            '@radix-ui/react-tabs',
            '@radix-ui/react-toast',
            '@radix-ui/react-avatar',
            '@radix-ui/react-label',
            '@radix-ui/react-slot',
            '@radix-ui/react-switch',
            '@radix-ui/react-alert-dialog',
            '@radix-ui/react-accordion',
          ],
          
          // Form and validation
          'vendor-form': ['react-hook-form', '@hookform/resolvers'],
          
          // Utilities
          'vendor-utils': ['date-fns', 'clsx', 'tailwind-merge', 'class-variance-authority'],
          
          // Icons
          'vendor-icons': ['lucide-react'],
          
          // i18n
          'vendor-i18n': ['react-i18next', 'i18next'],
          
          // React Query
          'vendor-query': ['@tanstack/react-query'],
        },
      },
    },
    // Increase chunk size warning limit (optional, to reduce noise)
    chunkSizeWarningLimit: 600,
    // Enable source maps for production debugging (optional)
    sourcemap: false,
  },
});
