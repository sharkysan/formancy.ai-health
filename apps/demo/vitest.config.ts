import { defineConfig, mergeConfig } from 'vitest/config'
import { coverage } from '../../vitest.coverage'
import { reporters } from '../../vitest.results'
import app from './vite.config.ts'

/**
 * The suite runs through the same plugins the build does, merged rather
 * than restated, so the page's tests import the very modules the build
 * hands the page -- the corpus's referral, the letter's registered bytes,
 * the facts -- and not a copy made for them.
 */
export default mergeConfig(
  app,
  defineConfig({
    test: {
      reporters,
      coverage: {
        ...coverage,
        // `.tsx` counts. `main.tsx` is the composition root the shared
        // policy excludes as `main.ts`; the `test-` files are the suite's
        // own support, which is test code.
        include: ['src/**/*.{ts,tsx}'],
        exclude: ['src/**/*.test.{ts,tsx}', 'src/**/*.d.ts', 'src/main.tsx', 'src/test-*.{ts,tsx}'],
      },
      // The browser gate's own checks of its plan join the suite where
      // they are, so the release report finds them run (0011).
      include: ['src/**/*.test.{ts,tsx}', 'scripts/**/*.test.mjs'],
      environment: 'jsdom',
      setupFiles: ['src/test-setup.ts'],
    },
  }),
)
