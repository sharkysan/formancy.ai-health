import type { ViteUserConfig } from 'vitest/config'
import { configDefaults } from 'vitest/config'

/**
 * vitest's own reporters, GitHub's annotations included, plus a JSON copy of
 * each run in `test-results/`, which turbo never caches.
 *
 * Spread from `configDefaults` rather than named: a `reporters` list replaces
 * vitest's, and naming `default` here would drop the `github-actions`
 * reporter vitest adds on CI, and with it every failure's annotation on the
 * pull request.
 *
 * The JSON is what the release report reads (0011, formancy.ai-report
 * 0014's shape): each test's status, which collect.mjs carries to the
 * report job and the report holds to every test file the checkout holds.
 */
export const reporters: NonNullable<NonNullable<ViteUserConfig['test']>['reporters']> = [
  ...configDefaults.reporters,
  ['json', { outputFile: 'test-results/vitest.json' }],
]
