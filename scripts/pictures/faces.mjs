// The faces a built app serves from its own origin (0012, 0015), as a README
// picture needs them (0016): the families its stylesheets declare, which the
// camera waits for before it shoots, and the Fontsource packages that ship
// the faces, whose font versions a picture's record names as its look.
// formancy.ai-report's scripts/web-fonts.mjs, for the pictures alone: the
// demo's browser gate reads the faces its own way (apps/demo/scripts/
// gate-page.mjs's declaredFaces, each face rather than each family), and
// the request a pass refuses as a font file is that file's FONT_FILE, which
// the demo's pictures script hands the session.
//
// Served from the build, a face is an @font-face in a built stylesheet and a
// file beside it whose name says no version, so the version is read from the
// package the file came from.
//
// Node's built-ins only.

import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import { REPO } from './record.mjs'

/** Fontsource's packages: a face in its static weights, and the variable one. */
const FONTSOURCE = /^@fontsource(?:-variable)?\//

/** The family each `@font-face` of `css` declares, unquoted, each once, in order of first appearance. */
export function familiesOf(css) {
  const found = []
  for (const [, body] of css.matchAll(/@font-face\s*\{([^}]*)\}/g)) {
    const family = /font-family\s*:\s*([^;]+)/.exec(body)?.[1]?.trim().replace(/^(['"])(.*)\1$/, '$2')
    if (family !== undefined && !found.includes(family)) found.push(family)
  }
  return found
}

/**
 * The families the stylesheets of the build at `dist` declare, sorted: what
 * its page asks for. Every `.css` file under it is read, so a face in a
 * lazily loaded chunk's stylesheet counts too. Empty when none declares a
 * face, which the session refuses in its own words.
 */
export function declaredFamilies(dist) {
  const sheets = readdirSync(dist, { recursive: true, withFileTypes: true }).filter((entry) => entry.isFile() && entry.name.endsWith('.css'))
  return [...new Set(sheets.flatMap((entry) => familiesOf(readFileSync(join(entry.parentPath, entry.name), 'utf8'))))].sort()
}

/**
 * The Fontsource packages the app at `app` depends on, as its node_modules
 * holds them: each one's name, the family its stylesheets declare
 * (`Archivo Variable`), and, from its metadata.json, the font's own family
 * (`Archivo`) and the Google Fonts release its files were made from (`v25`).
 */
function fontsourceFaces(app) {
  const manifest = JSON.parse(readFileSync(join(app, 'package.json'), 'utf8'))
  return Object.keys(manifest.dependencies ?? {})
    .filter((name) => FONTSOURCE.test(name))
    .sort()
    .map((name) => {
      const directory = join(app, 'node_modules', name)
      if (!existsSync(join(directory, 'metadata.json'))) throw new Error(`${relative(REPO, app).replaceAll('\\', '/')} depends on ${name}, and its node_modules holds no metadata.json for it: run pnpm install`)
      const own = JSON.parse(readFileSync(join(directory, 'package.json'), 'utf8'))
      const metadata = JSON.parse(readFileSync(join(directory, 'metadata.json'), 'utf8'))
      const [declares] = familiesOf(readFileSync(join(directory, own.main ?? 'index.css'), 'utf8'))
      return { name, declares, family: metadata.family, version: metadata.version }
    })
}

/**
 * Each of `families` -- families a built stylesheet declares -- as the
 * version of its font, keyed by the font's own family, from the Fontsource
 * package of the app at `app` that declares it. Refuses a family no such
 * package declares.
 */
export function faceVersions(app, families) {
  const faces = fontsourceFaces(app)
  const versions = {}
  for (const family of families) {
    const face = faces.find((each) => each.declares === family)
    if (face === undefined) throw new Error(`no Fontsource package of ${relative(REPO, app).replaceAll('\\', '/')} declares the family ${family}, so its version cannot be recorded`)
    versions[face.family] = face.version
  }
  return Object.fromEntries(Object.keys(versions).sort().map((family) => [family, versions[family]]))
}
