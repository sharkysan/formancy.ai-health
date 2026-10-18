import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { describe, expect, test } from 'vitest'
import { LETTER, letterProblems, letterRegisterProblems, readLetter, registeredLetter, sha256 } from './letter.mjs'

/**
 * docs/release/letter.json, the referral letter's PDF by its size and
 * SHA-256 (0008, 0012): the bytes the validator gate judges inside the
 * corpus's documents are the bytes the demo carries, on whichever machine
 * rendered them. Held three ways:
 *
 * - **The register's shape**, and that `renderedBy` is the Report releases
 *   health-corpus depends on: a Report moved without the letter measured
 *   again would leave a register naming a renderer that did not make its
 *   bytes.
 * - **This machine's render** is the registered one. `pnpm test:repo` runs
 *   it in the `verify` job, under the Node and on the image CI's other jobs
 *   run, so a Node of CI's that renders the letter otherwise fails there.
 *   Cloudflare's build of the demo runs on another machine and another
 *   Node -- `.node-version` names a major, and each installs its own patch
 *   of it -- and nothing here runs there: its build is the first to render
 *   the letter on that Node, and the plugin refuses another render there,
 *   which RELEASING.md's check of a deploy reads the build's log for.
 * - **`registeredLetter`**, which the gate and the demo's build take the
 *   letter through, hands over the registered bytes and refuses others
 *   before anything uses them, on fixtures.
 *
 * It reads `packages/health-corpus/dist`, so it needs `pnpm build`, as the
 * corpus guard does.
 */
const repo = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const CORPUS = join(repo, 'packages', 'health-corpus', 'dist', 'index.mjs')
if (!existsSync(CORPUS)) throw new Error('scripts/validator/letter.test.mjs reads health-corpus as built: run pnpm build first')
const { renderReferral } = await import(pathToFileURL(CORPUS).href)
const letter = readLetter(repo)
const manifest = JSON.parse(readFileSync(join(repo, 'packages', 'health-corpus', 'package.json'), 'utf8'))

/** A register of `bytes`, well formed, for fixtures to break one field of. */
const registered = (bytes, fields = {}) => ({ renderedBy: { '@formancy/report-render-pdf': '0.1.0' }, bytes: bytes.length, sha256: sha256(bytes), ...fields })

/** A PDF of `text`, by its bytes alone: nothing here reads it as one. */
const bytesOf = (text) => new Uint8Array(Buffer.from(text, 'latin1'))

describe('the letter register', () => {
  // A malformed register holds no render to anything: a size that is a
  // string, or a hash in capitals, would refuse every render or none.
  test('is a size, a SHA-256 and the Report releases that rendered it', () => {
    expect(letterRegisterProblems(letter)).toEqual([])
  })

  // The register says which renderer made its bytes. A Report moved in
  // health-corpus's manifest and not here would leave it naming a release
  // that did not make them, while the next render, by the new one, is
  // refused for bytes nobody registered.
  test('names exactly the Report releases health-corpus renders with, as its manifest declares them', () => {
    const report = Object.fromEntries(Object.entries(manifest.dependencies).filter(([name]) => name.startsWith('@formancy/report-')))
    expect(Object.keys(report).length, 'health-corpus declares no Report package, so this compares nothing').toBeGreaterThan(0)
    expect(letter.renderedBy).toEqual(report)
  })

  // The letter this machine renders is the one the register names, byte
  // for byte, so the validator judged and the demo serves the same PDF
  // (0012). A Node, a zlib or a Report that renders it otherwise fails
  // here.
  test('is the letter health-corpus renders on this machine', async () => {
    expect(letterProblems(await renderReferral(), letter)).toEqual([])
  })

  // Each refusal names what it measured and what is registered: one byte
  // more changes both, and one byte changed in place changes the hash
  // alone, which a check of the size alone would not see.
  test('refuses a render of another size or another hash, saying what each is', () => {
    const pdf = bytesOf('%PDF-1.3\n%%EOF\n')
    const register = registered(pdf)
    expect(letterProblems(pdf, register)).toEqual([])
    const longer = bytesOf('%PDF-1.3\n%%EOF\n\n')
    expect(letterProblems(longer, register)).toEqual([`it is 16 bytes, where ${LETTER} registers 15`, `its SHA-256 is ${sha256(longer)}, where ${LETTER} registers ${register.sha256}`])
    const changed = bytesOf('%PDF-1.4\n%%EOF\n')
    expect(letterProblems(changed, register)).toEqual([`its SHA-256 is ${sha256(changed)}, where ${LETTER} registers ${register.sha256}`])
  })

  // A register that names no size, no hash or a renderer at a range would
  // be held to nothing, or to whatever release a range resolves to.
  test('refuses a register whose size, hash or renderer is none', () => {
    const pdf = bytesOf('%PDF-1.3\n%%EOF\n')
    expect(letterRegisterProblems(registered(pdf, { bytes: '15' }))).toEqual([`${LETTER}: bytes is not a size`])
    expect(letterRegisterProblems(registered(pdf, { sha256: sha256(pdf).toUpperCase() }))).toEqual([`${LETTER}: sha256 is not 64 lowercase hex digits`])
    const renderer = [`${LETTER}: renderedBy is not Formancy Report's packages, each at an exact release`]
    for (const renderedBy of [undefined, {}, ['@formancy/report-render-pdf'], { '@formancy/report-render-pdf': '^0.1.0' }, { pdfmake: '0.2.20' }]) {
      expect(letterRegisterProblems(registered(pdf, { renderedBy }))).toEqual(renderer)
    }
  })

  // What the gate and the demo's build call: the registered bytes are
  // handed over as rendered, and other bytes stop the caller -- the gate
  // before it writes a corpus, the build before it writes a page -- saying
  // which register and what it measured. A register that does not hold
  // stops it before anything is rendered.
  test('hands over the registered bytes, and stops the caller on others before anything uses them', async () => {
    const pdf = bytesOf('%PDF-1.3\n%%EOF\n')
    await expect(registeredLetter(async () => pdf, registered(pdf))).resolves.toBe(pdf)
    const other = bytesOf('%PDF-1.4\n%%EOF\n')
    await expect(registeredLetter(async () => other, registered(pdf))).rejects.toThrow(`the letter health-corpus rendered here is not the one ${LETTER} registers, so it is neither judged nor served: its SHA-256 is ${sha256(other)}`)
    let rendered = false
    const render = async () => {
      rendered = true
      return pdf
    }
    await expect(registeredLetter(render, registered(pdf, { sha256: 'none' }))).rejects.toThrow(`${LETTER}: sha256 is not 64 lowercase hex digits`)
    expect(rendered).toBe(false)
  })
})
