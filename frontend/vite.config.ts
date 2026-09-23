import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: process.env.DEMO_BUILD === 'true' ? '/lag4/' : '/',
  build: { outDir: process.env.DEMO_BUILD === 'true' ? '../docs' : 'dist' },
  server: { proxy: { '/api': 'http://127.0.0.1:3300' } },
});
