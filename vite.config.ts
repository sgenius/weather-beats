import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: false,
    css: true,
    // Playwright's *.spec.ts naming otherwise matches Vitest's default
    // include glob too - keep the two test runners out of each other's way.
    exclude: ['node_modules/**', 'e2e/**', 'dist/**'],
  },
});
