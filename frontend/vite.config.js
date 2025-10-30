import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],

  build: {
    // Output directory
    outDir: 'dist',

    // Optimize chunk size
    rollupOptions: {
      output: {
        // Manual chunk splitting for better caching and loading
        manualChunks: {
          // React core libraries
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],

          // React Query
          'query-vendor': ['react-query'],

          // UI libraries
          'ui-vendor': ['framer-motion', 'sonner'],

          // Large utility libraries
          'utils-vendor': ['axios', 'date-fns', 'lodash'],

          // Chart libraries (if used)
          'chart-vendor': ['recharts'],
        },

        // Naming strategy for chunks
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId ? chunkInfo.facadeModuleId.split('/').slice(-2).join('/') : 'chunk';
          return `js/${facadeModuleId}-[hash].js`;
        },

        // Asset file naming
        assetFileNames: (assetInfo) => {
          const extType = assetInfo.name.split('.').at(1);
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(extType)) {
            return `images/[name]-[hash][extname]`;
          }
          if (/woff|woff2|eot|ttf|otf/i.test(extType)) {
            return `fonts/[name]-[hash][extname]`;
          }
          return `assets/[name]-[hash][extname]`;
        },

        // Entry file naming
        entryFileNames: 'js/[name]-[hash].js',
      },
    },

    // Increase chunk size warning limit (500kb)
    chunkSizeWarningLimit: 500,

    // Enable CSS code splitting
    cssCodeSplit: true,

    // Minify options
    minify: 'terser',
    terserOptions: {
      compress: {
        // Remove console logs in production
        drop_console: true,
        drop_debugger: true,
      },
    },

    // Source maps for production debugging
    sourcemap: false,
  },

  // Development server configuration
  server: {
    port: 5173,
    strictPort: false,
    host: true,
    open: true,
  },

  // Preview server configuration
  preview: {
    port: 4173,
    strictPort: false,
    host: true,
    open: true,
  },

  // Optimizations
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'react-query',
      'axios',
      'framer-motion',
      'sonner',
    ],
  },
});
