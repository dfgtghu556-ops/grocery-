import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // The Pages workflow supplies the project subpath. Android and local builds use '/'.
  base: process.env.VITE_BASE_PATH ?? '/',
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    allowedHosts: true,
  },
});
