import { eslintConfig } from './scripts/code-style/code-style.mjs'

/**
 * The repository's lint rules: the four formancy repositories' shared ones,
 * `scripts/code-style/code-style.mjs`, a copy of what formancy.ai will
 * publish as `@formancy/code-style` until this repository pins it (0017),
 * given Formancy Health's paths. `scripts/lint.test.mjs` holds what is
 * passed here.
 *
 * The French typography `apps/demo/src/words/fr.ts` writes in template
 * literals is what the shared rules allow irregular whitespace in strings,
 * templates and JSX text for.
 */
export default eslintConfig({
  root: import.meta.dirname,
  // The tsconfigs `pnpm typecheck` runs, by glob, so that a new package or
  // app is linted with types without an edit here; tsconfig.tools.json
  // brings the vitest, Vite and tsdown configs into the typecheck.
  project: ['./packages/*/tsconfig.json', './apps/*/tsconfig.json', './tsconfig.tools.json'],
  ignoreFiles: ['.gitignore'],
  tests: ['**/*.{test,spec}.{ts,tsx,mts,cts,js,mjs}'],
  // The install fixtures import the packed tarballs, which the workspace
  // does not resolve; the install gate type-checks them, in the consumer
  // project that has them.
  untyped: ['scripts/install-fixture/**'],
  // The demo's browser gate and the README's pictures drive Playwright.
  browser: ['apps/demo/scripts/**', 'scripts/pictures/**'],
  react: ['apps/demo/**/*.{ts,tsx}'],
})
