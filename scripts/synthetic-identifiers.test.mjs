import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { describe, expect, test } from 'vitest'
import { corpus } from './validator/corpus.mjs'

/**
 * The people of every fixture are synthetic, and their Swiss identifiers
 * nobody's, as can be shown (CLAUDE.md, "Health data stays out of
 * everything but the output"; 0009).
 *
 * - **No AHV number that passes its check is written in any file.** None
 *   is reserved for tests, and every number of the form that passes GS1's
 *   check digit may be a person's: the BSV calls the numbers "völlig
 *   anonym und zufallsgeneriert" ("Die AHV-Nummer", updated 28 September
 *   2026). A fixture's AHV number has a wrong check digit, which makes it
 *   no AHVN13 at all; a test that needs a valid one computes it in
 *   memory. Derived from the files, not from wording: every run of 756
 *   and ten digits in every file git holds or would add, whatever
 *   separates the digits -- points, spaces, a regex's backslashes -- is
 *   held to health-ch's `ahvn13`, as built, and fails where it passes.
 * - **Every GLN the corpus writes is under GS1's prefix 952**, "used for
 *   demonstrations and examples of the GS1 system" (GS1 General
 *   Specifications 26.0, Table 1-4), or has a wrong check digit: a GLN
 *   under another prefix may be an organisation's or a person's, and the
 *   warnings register accepts CH Core's gln-startswith76 for the corpus's
 *   on that reason. Derived from every identifier of the corpus under the
 *   GLN's system.
 *
 * What it cannot see: a number a test computes in memory and a GLN of
 * another prefix written outside the corpus, which review holds. It reads
 * `packages/*\/dist`, so it needs `pnpm build`, as the corpus guard does.
 */
const repo = join(dirname(fileURLToPath(import.meta.url)), '..')
const built = (name) => join(repo, 'packages', name, 'dist', 'index.mjs')
const NAMES = ['health-core', 'health-questionnaire', 'health-corpus', 'health-ch']
if (!NAMES.every((name) => existsSync(built(name)))) throw new Error('scripts/synthetic-identifiers.test.mjs reads the packages as built: run pnpm build first')
const [core, questionnaire, documents, ch] = await Promise.all(NAMES.map((name) => import(pathToFileURL(built(name)).href)))
const pdf = await documents.renderReferral()

/**
 * 756 and ten digits, each two apart by at most three points, spaces or
 * backslashes -- `756\\.1234` is a regex's point in a TypeScript string --
 * and no digit either side.
 */
const AHVN13_SHAPED = /(?<![0-9])756(?:[. \\]{0,3}[0-9]){10}(?![0-9])/g

/** Whether `digits`, thirteen of them, are an AHVN13 health-ch accepts: one that may be a person's. */
function passes(digits) {
  try {
    ch.ahvn13(digits, 'probe')
    return true
  } catch (error) {
    if (error instanceof core.Refusal) return false
    throw error
  }
}

/** Each AHV number in `text` that passes its check, as `file:line`, and never the number. */
function validAhvn13s(file, text) {
  const found = []
  for (const match of text.matchAll(AHVN13_SHAPED)) {
    if (passes(match[0].replace(/[^0-9]/g, ''))) found.push(`${file}:${String(text.slice(0, match.index).split('\n').length)}`)
  }
  return found
}

/** Every file git holds, or would add: the repository as a pull request carries it. */
function repositoryFiles() {
  const listed = execFileSync('git', ['ls-files', '-z', '--cached', '--others', '--exclude-standard'], { cwd: repo, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
  return listed.split('\0').filter((file) => file !== '' && existsSync(join(repo, file)))
}

describe('the synthetic identifiers', () => {
  // A valid AHV number in a test, a README or a script would be a number
  // that may be a person's, published with the repository: the hard rule
  // H07 broke, in five files, while three texts said none was there.
  test('hold no AHV number that passes its check, in any file', () => {
    const files = repositoryFiles()
    const found = files.flatMap((file) => validAhvn13s(file, readFileSync(join(repo, file), 'latin1')))
    expect(found, 'write a number whose check digit is wrong, or compute a valid one in memory').toEqual([])
  })

  // A guard on the guard: the walk must find the files, and a number
  // health-ch accepts -- made in memory from a stem, never written --
  // must be found in each spelling a file could give it, while the same
  // digits with a wrong check digit are not.
  test('finds a valid AHV number however it is spelled, and only a valid one', () => {
    expect(repositoryFiles()).toEqual(expect.arrayContaining(['README.md', 'packages/health-ch/src/identifiers.ts', 'scripts/install-fixture/consume.ts']))
    const stem = '756000000001'
    const digit = [...'0123456789'].find((each) => passes(`${stem}${each}`))
    const wrong = [...'0123456789'].find((each) => each !== digit)
    const printed = (last) => `756.${stem.slice(3, 7)}.${stem.slice(7, 11)}.${stem.slice(11)}${last}`
    for (const spelling of [`${stem}${digit}`, printed(digit), printed(digit).replaceAll('.', '\\\\.'), printed(digit).replaceAll('.', ' ')]) {
      expect(validAhvn13s('probe.ts', `const a = 1\nconst b = '${spelling}'\n`)).toEqual(['probe.ts:2'])
    }
    expect(validAhvn13s('probe.ts', `${stem}${wrong} ${printed(wrong)}`)).toEqual([])
  })

  // The corpus's GLNs are what the warnings register says of them.
  test("hold every GLN of the corpus under GS1's prefix for examples, or with a wrong check digit", () => {
    const entries = corpus({ core, questionnaire, documents, pdf, ch })
    const glns = []
    const walk = (value) => {
      if (Array.isArray(value)) value.forEach(walk)
      else if (typeof value === 'object' && value !== null && !core.isFhirNumber(value)) {
        if (value.system === ch.GLN_SYSTEM && typeof value.value === 'string') glns.push(value.value)
        Object.values(value).forEach(walk)
      }
    }
    for (const { resource } of entries) walk(resource)
    expect(glns.length, 'the walk found no GLN, so it read nothing').toBeGreaterThan(0)
    const nobodys = (value) => {
      if (value.startsWith('952')) return true
      try {
        ch.gln(value, 'probe')
        return false
      } catch (error) {
        if (error instanceof core.Refusal) return true
        throw error
      }
    }
    expect(glns.filter((value) => !nobodys(value)).length, 'a GLN under another prefix than 952 may be somebody’s').toBe(0)
  })
})
