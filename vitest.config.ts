/// <reference types="vitest/config" />
import { defineConfig } from 'vitest/config';
import path from 'node:path';

/**
 * Vitest for the landing app (CONN-TEST-2).
 *
 * This repo had no test runner, no test dependency and no test script - not
 * thin coverage, the absence of the capability. CI ran `tsc --noEmit` and
 * `next build`, neither of which can see a behavioural regression.
 *
 * Deliberately a separate vitest.config.ts rather than a `test` block in a
 * Vite config: Next 16 builds with Turbopack and there is no vite.config.ts to
 * extend. Vitest only uses this file, so nothing here touches the real build.
 *
 * NO @testing-library/* HERE either. Its current releases declare
 * engines.node >= 22 and this repo runs Node 20; yarn v1 in the sibling repos
 * refuses the install outright, while Berry here accepts it silently and fails
 * at runtime instead. Add it alongside the first COMPONENT test, at a version
 * whose engines match the Node actually in use.
 *
 * happy-dom rather than jsdom: jsdom requires `undici`, which conflicts with
 * the copy bundled into current Node and fails at load with
 * "webidl.util.markAsUncloneable is not a function" before any test runs.
 * happy-dom has no such dependency and Testing Library supports both.
 *
 * NO @vitejs/plugin-react HERE, on purpose. Its current major imports
 * `vite/internal`, which the vite 7 that Vitest 3 resolves does not export, so
 * adding it fails the run at startup before a single test loads. Nothing in
 * this suite needs a JSX transform yet. Whoever writes the first COMPONENT
 * test will need to add the plugin at a version matching the installed vite -
 * check `node_modules/vite/package.json` first rather than taking latest.
 */
export default defineConfig({
  resolve: {
    // Mirrors the "@/*" -> "./*" path mapping in tsconfig.json. Without it,
    // every import of '@/lib/...' fails to resolve under Vitest.
    alias: { '@': path.resolve(__dirname, '.') },
  },
  test: {
    globals: true,
    environment: 'happy-dom',
    include: ['{app,lib}/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['node_modules', '.next', 'app/_design-sandbox/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      exclude: ['node_modules/', '.next/', '**/*.config.*', '**/*.d.ts'],
    },
  },
  css: {
    postcss: {
      plugins: [],
    },
  },
});
