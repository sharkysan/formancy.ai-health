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
 * corpus holds everything the questionnaire package maps (0006) and every
 * resource type the packages write, a PDF in each place health-document puts
 * one (0008), and every code system the corpus writes is one whose terms
 * admit it, LOINC with its name and its notice in NOTICE and no SNOMED CT,
 * and no file holds an AHV number that passes its check (0009); the
 * architecture in docs/ names every package and decision record, and links
 * to and names as code only what exists (0010); and the release report's
 * registers hold, every decision record read as it stands, the report
 * fails a run on what it should, a release holds the SBOM to it, and the
 * getting-started guide hands every block of code to the install gate,
 * installs what the gate installs and links only to what exists, and the
 * README's intended purpose holds CLAUDE.md's sentence word for word and
 * its links land (0011); and the letter's PDF is the bytes its register
 * names, and health-corpus's documents entry, which the demo bundles,
 * reaches the workspace's packages alone; and the demo's deploy puts the
 * build at one path of formancy.ai, under headers whose policy allows the
 * page no connection, written as the one rule Cloudflare reads, as the
 * README, REPO-METADATA and RELEASING say (0012); and the README's pictures
 * of the demo are what their record says was taken, every caption quoting
 * only what its sections said, and the README's regions are rendered from
 * them (0016).
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
