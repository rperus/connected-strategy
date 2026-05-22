import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Port 4310 is the fixed preferred port from config/port_registry.yaml
// The actual port may be overridden at runtime; see docs/operations/PORT_REGISTRY_POLICY.md
export default defineConfig({
  plugins: [react()],
  server: {
    port: 4310,
    host: '127.0.0.1',
    strictPort: false, // Allow fallback if 4310 is busy
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor_react: ['react', 'react-dom', 'react-router-dom'],
          vendor_clerk: ['@clerk/clerk-react']
        }
      }
    }
  },
});
