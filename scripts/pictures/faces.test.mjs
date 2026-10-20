import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { afterAll, describe, expect, test } from 'vitest'
import { declaredFamilies, faceVersions, familiesOf } from './faces.mjs'
import { REPO } from './record.mjs'

/**
 * The faces the demo serves from its own build (0012, 0015), as a README
 * picture waits for them and its record names them (0016): the families a
 * built stylesheet declares, and the Fontsource packages that ship them,
 * whose font versions a picture's look names.
 */
const made = []
afterAll(() => {
  for (const directory of made) rmSync(directory, { recursive: true, force: true })
})

/** A directory holding `files`, each path with its text. */
function tree(files) {
  const directory = mkdtempSync(join(tmpdir(), 'pictures-faces-'))
  made.push(directory)
  for (const [path, text] of Object.entries(files)) {
    mkdirSync(dirname(join(directory, path)), { recursive: true })
    writeFileSync(join(directory, path), text)
  }
  return directory
}

describe('the families a stylesheet declares', () => {
  // The camera waits for each family the page asks for, and refuses a
  // picture in which one did not load. A family read from an ordinary
  // rule's stack is one the page merely hopes for -- 'Archivo' in the
  // room's --display, which no face of that name serves -- and waiting for
  // it would refuse every picture. Minified, a name loses its quotes;
  // either way it is one family.
  test("are every @font-face's family, once each, quoted or not, and no stack's", () => {
    const css = [
      "@font-face {\n  font-family: 'Archivo Variable';\n  font-weight: 100 900;\n  src: url(./a.woff2) format('woff2-variations');\n}",
      '@font-face{font-family:IBM Plex Sans;font-weight:400;src:url(./b.woff2)format("woff2")}',
      '@font-face{font-family:"IBM Plex Sans";font-weight:500;src:url(./c.woff2)format("woff2")}',
      ".room{--display:'Archivo','Archivo Variable',sans-serif;font-family:'IBM Plex Mono',monospace}",
    ].join('\n')
    expect(familiesOf(css)).toEqual(['Archivo Variable', 'IBM Plex Sans'])
    expect(familiesOf('.page { font-family: var(--wb-sans); }')).toEqual([])
  })

  // The built page's own: every stylesheet the build wrote, in any
  // directory, so a face moved into a lazily loaded chunk's stylesheet is
  // still waited for; a build that declares none says so as an empty list,
  // which the session refuses in its own words.
  test('are read from every stylesheet a build wrote, sorted', () => {
    const dist = tree({
      'index.html': '<link rel="stylesheet" href="./assets/index.css">',
      'assets/index.css': '@font-face{font-family:IBM Plex Sans;src:url(./a.woff2)}',
      'assets/lazy/chunk.css': "@font-face{font-family:'Archivo Variable';src:url(./b.woff2)}",
      'assets/index.js': "const css = '@font-face{font-family:Hidden}'",
    })
    expect(declaredFamilies(dist)).toEqual(['Archivo Variable', 'IBM Plex Sans'])
    expect(declaredFamilies(tree({ 'assets/index.css': 'body { margin: 0 }' }))).toEqual([])
  })
})

describe("the faces' versions", () => {
  // The record's look names the font each picture was drawn in, so a font
  // that changed under the pictures is seen. Served from the build, a
  // font's file names no version; its Fontsource package records the
  // Google Fonts release its files were made from. Keyed by the font's own
  // family, as formancy.ai-report's look names them.
  test("are each family's release, from the demo's Fontsource packages", () => {
    expect(faceVersions(join(REPO, 'apps', 'demo'), ['Archivo Variable', 'IBM Plex Mono', 'IBM Plex Sans'])).toEqual({ Archivo: 'v25', 'IBM Plex Mono': 'v20', 'IBM Plex Sans': 'v23' })
  })

  // A family no package ships -- a face from somewhere else, or a package
  // dropped -- has no version to record, and a record that named none
  // would say nothing of what was pictured.
  test('refuse a family no Fontsource package of the app ships', () => {
    expect(() => faceVersions(join(REPO, 'apps', 'demo'), ['IBM Plex Sans', 'Inter'])).toThrow('no Fontsource package of apps/demo declares the family Inter, so its version cannot be recorded')
  })
})
