// The referral letter's PDF by the bytes docs/release/letter.json registers
// (0008, 0012): what `@formancy/health-corpus` renders with Formancy Report,
// which the validator gate judges inside the corpus's document Bundles and
// the demo's build carries into its page.
//
// The PDF is rendered on whatever machine runs the gate or builds the
// demo -- GitHub's runner, Cloudflare's build image, a desktop -- by
// Report's renderer and the zlib of that machine's Node, and health-corpus's
// own tests prove the same bytes only within one process. So every reader
// takes the letter through `registeredLetter`, which refuses a render that
// is not the registered one, by its size and SHA-256: a machine that renders
// it otherwise stops the gate or the build, rather than one PDF being judged
// and another served. Held by scripts/validator/letter.test.mjs.

import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const repo = join(dirname(fileURLToPath(import.meta.url)), '..', '..')

export const LETTER = 'docs/release/letter.json'

const SHA256 = /^[0-9a-f]{64}$/
/** A released version and nothing else, as health-corpus's manifest names Report's. */
const EXACT = /^\d+\.\d+\.\d+$/

/** The register, parsed. */
export const readLetter = (root = repo) => JSON.parse(readFileSync(join(root, LETTER), 'utf8'))

/** The SHA-256 of `bytes`, as 64 lowercase hex digits. */
export const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex')

/**
 * What is wrong with the register, as sentences: a size that is none, a
 * hash that is not one, or a renderer not named as Formancy Report's
 * packages, each at an exact release.
 */
export function letterRegisterProblems(letter) {
  const problems = []
  if (!Number.isSafeInteger(letter?.bytes) || letter.bytes <= 0) problems.push(`${LETTER}: bytes is not a size`)
  if (typeof letter?.sha256 !== 'string' || !SHA256.test(letter.sha256)) problems.push(`${LETTER}: sha256 is not 64 lowercase hex digits`)
  const by = letter?.renderedBy
  const named = typeof by === 'object' && by !== null && !Array.isArray(by) ? Object.entries(by) : []
  if (named.length === 0 || named.some(([name, version]) => !name.startsWith('@formancy/report-') || typeof version !== 'string' || !EXACT.test(version))) {
    problems.push(`${LETTER}: renderedBy is not Formancy Report's packages, each at an exact release`)
  }
  return problems
}

/** What is wrong with `pdf`, a render of the letter, against the register: its size, then its SHA-256, each as measured. */
export function letterProblems(pdf, letter) {
  const problems = []
  if (pdf.length !== letter.bytes) problems.push(`it is ${String(pdf.length)} bytes, where ${LETTER} registers ${String(letter.bytes)}`)
  const hash = sha256(pdf)
  if (hash !== letter.sha256) problems.push(`its SHA-256 is ${hash}, where ${LETTER} registers ${String(letter.sha256)}`)
  return problems
}

/**
 * The letter `renderReferral` renders -- health-corpus's, as built --
 * once it is shown to be the registered bytes; throws, before anything
 * uses it, when the register does not hold or the render is another.
 */
export async function registeredLetter(renderReferral, letter = readLetter()) {
  const wrong = letterRegisterProblems(letter)
  if (wrong.length > 0) throw new Error(`the letter's register does not hold:\n  - ${wrong.join('\n  - ')}`)
  const pdf = await renderReferral()
  const problems = letterProblems(pdf, letter)
  if (problems.length > 0) {
    throw new Error(
      `the letter health-corpus rendered here is not the one ${LETTER} registers, so it is neither judged nor served: ${problems.join('; ')}. A letter rendered otherwise is measured where the gate runs and registered in a commit of its own`,
    )
  }
  return pdf
}
