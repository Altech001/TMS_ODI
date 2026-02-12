import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    svgr({
      svgrOptions: {
        icon: true,
        exportType: 'named',
        namedExport: 'ReactComponent',
      },
    }),
  ],

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },

  // ← Add this section
  server: {
    port: 3000,              // ← this is the key line
    open: true,
    proxy: {
      // All requests starting with /api will be forwarded to your backend
      '/api': {
        target: 'https://project-management-backend-exsp.onrender.com',
        changeOrigin: true,           // Changes the origin header to match the target
        secure: false,                // useful if the target uses self-signed cert (Render usually doesn't need this)
        rewrite: (path) => path.replace(/^\/api/, '/api'), // keep /api in the backend path
      },
    },
  },
});
