import { includeIgnoreFile } from '@eslint/compat'
import eslintComments from '@eslint-community/eslint-plugin-eslint-comments/configs'
import js from '@eslint/js'
import reactHooks from 'eslint-plugin-react-hooks'
import globals from 'globals'
import { fileURLToPath } from 'node:url'
import tseslint from 'typescript-eslint'

/**
 * The repository's lint rules: @eslint/js's and typescript-eslint's
 * type-checked recommended sets, held at error.
 *
 * Type information comes from the tsconfigs `pnpm typecheck` runs, named by
 * glob so that a new package or app is linted with types without an edit
 * here. The install fixtures import packed tarballs the workspace does not
 * resolve and are linted without types; the install gate type-checks them.
 *
 * `scripts/lint.test.mjs` holds what is below. Every rule is `error` or
 * `off`: a warning is a finding nobody has to fix.
 */
const TS = ['**/*.{ts,tsx,mts,cts}']
const JS = ['**/*.{js,mjs,cjs}']
const TESTS = ['**/*.{test,spec}.{ts,tsx,mts,cts,js,mjs}']

// Both base sets name an unused-variable rule; the base one is turned off for
// TypeScript, which has its own that understands types, so there is one
// report per finding.
const unusedNames = {
  args: 'all',
  argsIgnorePattern: '^_',
  vars: 'all',
  varsIgnorePattern: '^_',
  caughtErrors: 'all',
  caughtErrorsIgnorePattern: '^_',
  destructuredArrayIgnorePattern: '^_',
}

export default tseslint.config(
  includeIgnoreFile(fileURLToPath(new URL('.gitignore', import.meta.url))),
  { ignores: ['**/dist/**', '**/coverage/**', '**/test-results/**'] },
  {
    linterOptions: { reportUnusedDisableDirectives: 'error', reportUnusedInlineConfigs: 'error' },
  },
  js.configs.recommended,
  {
    files: TS,
    extends: tseslint.configs.recommendedTypeChecked,
    languageOptions: {
      parserOptions: {
        project: ['./packages/*/tsconfig.json', './apps/*/tsconfig.json', './tsconfig.tools.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    files: TS,
    rules: {
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': ['error', unusedNames],
    },
  },
  {
    files: JS,
    extends: [tseslint.configs.disableTypeChecked],
    languageOptions: { globals: globals.node },
    rules: {
      'no-unused-vars': ['error', unusedNames],
      '@typescript-eslint/no-unused-vars': 'off',
    },
  },
  {
    // The install fixtures are type-checked by the install gate, in the
    // consumer project that has the tarballs.
    files: ['scripts/install-fixture/**'],
    extends: [tseslint.configs.disableTypeChecked],
    languageOptions: { globals: globals.node },
  },
  {
    // page.evaluate callbacks run in the page.
    files: ['apps/demo/scripts/**', 'scripts/pictures/**'],
    languageOptions: { globals: { ...globals.node, ...globals.browser } },
  },
  {
    // French typography lives in template literals (apps/demo/src/words/fr.ts).
    rules: { 'no-irregular-whitespace': ['error', { skipStrings: true, skipTemplates: true, skipJSXText: true }] },
  },
  {
    files: ['apps/demo/**/*.{ts,tsx}'],
    plugins: { 'react-hooks': reactHooks },
    rules: { 'react-hooks/rules-of-hooks': 'error', 'react-hooks/exhaustive-deps': 'error' },
  },
  eslintComments.recommended,
  { rules: { '@eslint-community/eslint-comments/require-description': 'error' } },
  {
    files: TESTS,
    rules: {
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/unbound-method': 'off',
    },
  },
)
