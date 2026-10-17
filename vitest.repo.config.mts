import { defineConfig } from 'vitest/config'
import { reporters } from './vitest.results'

/**
 * The repository's own guards: checks on the files that describe the repository
 * rather than on a package. codecov.yml matches its generator, every CLA
 * signature names the current text, upstream dependencies are exact releases,
 * no source file is past the size budget CLAUDE.md sets, nothing names the
 * product with HL7's marks while NOTICE and the README carry HL7's notice, no
 * package's source converts a value through a JavaScript number or reads a
 * clock or a random source, the README's compatibility table is current, and
 * the validator gate's registers, verdict and command line hold (0005), and its
 * corpus holds everything the questionnaire package maps (0006).
 *
 * Run as `pnpm test:repo`, and by CI on every pull request. A guard that is not
 * a gate is a comment.
 */
export default defineConfig({
  test: {
    reporters,
    include: ['scripts/**/*.test.mjs'],
  },
})
