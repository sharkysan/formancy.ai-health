// What the demo's browser gate reads from a page, apart from the journey
// that brings the page to each state (gate-journey.mjs) and what it holds
// of the page's requests, storage and policy (gate-privacy.mjs): the
// widths worth measuring, the measurements themselves, axe, where the
// keyboard is, and the web fonts. formancy.ai-report's apps/studio/scripts/
// gate-page.mjs, which is formancy.ai-data's, without the Studio's paper.
//
// The reads that go to the DOM rather than the accessibility tree go there
// because the tree has no geometry, no pixels, no stylesheets and no fonts.

import { readdirSync, readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

export const app = join(dirname(fileURLToPath(import.meta.url)), '..')
export const dist = join(app, 'dist')
const require = createRequire(join(app, 'package.json'))
const AXE = readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8')

/** A font file, wherever it is from: what the pass that refuses the web fonts aborts. */
export const FONT_FILE = /\.(?:woff2?|ttf|otf)(?:[?#]|$)/

/**
 * The stylesheets the page wears, in the order src/main.tsx imports them:
 * the themes as installed, then the page's own; each `@import` of the
 * page's inlined, as Vite builds it. A stylesheet imported otherwise than
 * by a bare `import '….css'` is refused, rather than measured by nobody.
 */
export function stylesheets(root = app) {
  const main = readFileSync(join(root, 'src', 'main.tsx'), 'utf8')
  const imported = [...main.matchAll(/^import '([^']+\.css)'$/gm)].map((match) => match[1])
  if (imported.length === 0 || /^import\s[^'"\n]*\sfrom\s+['"][^'"]+\.css['"]/m.test(main)) throw new Error('src/main.tsx imports its stylesheets otherwise than as `import \'….css\'`, so the gate would read no breakpoint of theirs')
  const read = (file) => readFileSync(file, 'utf8').replaceAll(/@import\s+'([^']+\.css)';/g, (_, path) => read(path.startsWith('.') ? join(dirname(file), path) : createRequire(file).resolve(path)))
  return imported.map((path) => {
    const file = path.startsWith('.') ? join(root, 'src', path) : createRequire(join(root, 'package.json')).resolve(path)
    return { path, css: read(file).replaceAll(/\/\*[\s\S]*?\*\//g, '') }
  })
}

/**
 * What @formancy/themes' room.css, as installed, sets on :root: each custom
 * property by its name, with every `var()` of another of its own read
 * through to that one's value, as a browser computes it, and the colour
 * scheme it is drawn for (0015). Read from the package the manifest pins,
 * never written here, so a release that moves a colour moves what the gate
 * expects with it.
 */
export function roomOf(root = app) {
  const css = readFileSync(createRequire(join(root, 'package.json')).resolve('@formancy/themes/room.css'), 'utf8').replaceAll(/\/\*[\s\S]*?\*\//g, '')
  const declared = Object.fromEntries([...css.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)].map(([, name, value]) => [name, value.trim()]))
  const through = (value, seen) => value.replaceAll(/var\(\s*(--[\w-]+)\s*\)/g, (whole, name) => (declared[name] === undefined || seen.includes(name) ? whole : through(declared[name], [...seen, name])))
  const variables = Object.fromEntries(Object.entries(declared).map(([name, value]) => [name, through(value, [name])]))
  return { variables, scheme: /color-scheme\s*:\s*([^;]+);/.exec(css)?.[1]?.trim() ?? null }
}

/** A byte, 0 to 255, of a colour's channel or alpha written as a number or a percentage of `whole`. */
const byte = (written, whole) => Math.round(written.endsWith('%') ? (Number(written.slice(0, -1)) / 100) * 255 : (Number(written) / whole) * 255)

/**
 * Each colour of `value` -- #rgb, #rgba, #rrggbb, #rrggbbaa, rgb() or
 * rgba(), with commas or without -- as #rrggbbaa, its alpha to the byte, as
 * a minifier writes it: Vite's Lightning CSS builds an rgb() with a
 * percentage alpha, room.css's --glass among them, as eight hex digits,
 * the same colour in other words. A colour in another form is left as it
 * is, and compared as written.
 */
export function canonicalColours(value) {
  const hex = (bytes) => `#${bytes.map((each) => each.toString(16).padStart(2, '0')).join('')}`
  return value
    .replaceAll(/#([\da-f]{3,8})(?![\da-f])/gi, (whole, digits) => {
      if (digits.length === 3 || digits.length === 4) return `${hex([...digits].map((digit) => Number.parseInt(digit + digit, 16)))}${digits.length === 3 ? 'ff' : ''}`
      if (digits.length === 6 || digits.length === 8) return `#${digits.toLowerCase()}${digits.length === 6 ? 'ff' : ''}`
      return whole
    })
    .replaceAll(/rgba?\(([^()]*)\)/gi, (whole, args) => {
      const parts = args.split(/[\s,/]+/).filter((part) => part !== '')
      if (parts.length !== 3 && parts.length !== 4) return whole
      const bytes = [...parts.slice(0, 3).map((part) => byte(part, 255)), parts.length === 4 ? byte(parts[3], 1) : 255]
      return bytes.every((each) => Number.isInteger(each) && each >= 0 && each <= 255) ? hex(bytes) : whole
    })
}

/** A custom property's value as the gate compares it: its colours as #rrggbbaa, one quote, one space, none inside a bracket, as browsers and minifiers write a token list differently. */
const tokens = (value) =>
  canonicalColours(value)
    .replaceAll('"', "'")
    .replaceAll(/\s+/g, ' ')
    .replaceAll(/\s*,\s*/g, ', ')
    .replaceAll(/\(\s+/g, '(')
    .replaceAll(/\s+\)/g, ')')
    .trim()

/**
 * Whether the page, as built and served, is in formancy.ai's room: every
 * custom property room.css sets holds its value on :root -- the
 * workbench's --wb-* among them, which a workbench loaded after the room
 * would turn light again, as room.css's header warns -- :root is drawn in
 * its colour scheme, and what is behind the page is its --ground. jsdom
 * applies no stylesheet and computes no custom property, so this is the
 * browser's to say. Null when it holds; otherwise every property that is
 * not so, and what it holds instead.
 */
export async function roomProblem(page, room = roomOf()) {
  const names = Object.keys(room.variables)
  if (names.length === 0 || room.scheme === null) return 'the installed room.css sets no custom property or no colour scheme, so the gate has nothing to hold the page to'
  const ground = canonicalColours(room.variables['--ground'] ?? '')
  if (!/^#[\da-f]{8}$/.test(ground)) return `room.css's --ground is ${String(room.variables['--ground'])}, not a colour the gate compares with what the page computes`
  const held = await page.evaluate((each) => {
    const style = getComputedStyle(document.documentElement)
    return { values: Object.fromEntries(each.map((name) => [name, style.getPropertyValue(name)])), scheme: style.colorScheme, ground: getComputedStyle(document.body).backgroundColor }
  }, names)
  const wrong = names.filter((name) => tokens(held.values[name] ?? '') !== tokens(room.variables[name])).map((name) => `${name} is ${JSON.stringify(held.values[name] ?? '')}, not ${room.variables[name]}`)
  if (held.scheme !== room.scheme) wrong.push(`:root is drawn ${JSON.stringify(held.scheme)}, not ${room.scheme}`)
  if (canonicalColours(held.ground) !== ground) wrong.push(`the page's ground is ${held.ground}, not --ground's ${String(room.variables['--ground'])}`)
  return wrong.length === 0 ? null : `${String(wrong.length)} of the room's ${String(names.length + 2)} not so: ${wrong.slice(0, 4).join('; ')}`
}

/** Every width breakpoint of `css`, in CSS pixels, by which side of it a rule takes: `max` or `min`. A unit the gate cannot turn into pixels is refused. */
export function breakpointsOf(css) {
  const found = { max: [], min: [] }
  for (const [, side, size, unit] of css.matchAll(/\((max|min)-width:\s*([\d.]+)([a-z]*)\s*\)/g)) {
    if (!['rem', 'em', 'px'].includes(unit)) throw new Error(`a ${side}-width breakpoint of ${size}${unit} is in a unit the gate does not measure`)
    found[side].push(unit === 'px' ? Number(size) : Number(size) * 16)
  }
  return found
}

/**
 * The passes worth measuring, one language each. Breakpoints are read from
 * every stylesheet the page wears (above): one pixel past each max-width,
 * where the wider layout is at its narrowest, and at each min-width, where
 * its own layout is; a breakpoint added to the page or to a theme is
 * measured without anybody editing this. Then the reflow width, the same
 * with the web fonts refused, a phone, a laptop, and a wide screen made
 * tall. The languages are dealt out in turn, so every one of `languages`
 * is measured, German's long words at the narrowest; fewer passes than
 * languages would leave one measured by nobody, and is refused.
 */
export function passes(languages, sheets = stylesheets()) {
  const max = new Set()
  const min = new Set()
  for (const { css } of sheets) {
    const found = breakpointsOf(css)
    for (const px of found.max) max.add(px)
    for (const px of found.min) min.add(px)
  }
  if (max.size === 0) throw new Error("found no max-width breakpoint in the page's stylesheets, so the widths below measure no layout change")
  const widest = Math.max(...max, ...min)
  const list = [
    // WCAG 2.2 SC 1.4.10, Reflow: 320 CSS pixels with no horizontal scrolling.
    { label: 'reflow, 320', width: 320, height: 900 },
    // The same with the web fonts refused, whose fallback widths differ.
    { label: 'reflow, 320, web fonts refused', width: 320, height: 900, refuseFonts: true },
    { label: 'phone, 360', width: 360, height: 900 },
    ...[
      ...[...max].map((px) => ({ label: `one past the ${String(px)}px max-width breakpoint`, width: px + 1, height: 900 })),
      ...[...min].map((px) => ({ label: `at the ${String(px)}px min-width breakpoint`, width: px, height: 900 })),
    ].sort((a, b) => a.width - b.width),
    { label: 'laptop, 1440', width: 1440, height: 900 },
    { label: 'wide, 2400 by 1400', width: Math.max(2400, widest + 1), height: 1400 },
  ]
  if (list.length < languages.length) throw new Error(`${String(list.length)} passes for ${String(languages.length)} languages: ${languages.slice(list.length).join(', ')} would be measured by no pass`)
  return list.map((entry, index) => {
    const language = languages[index % languages.length]
    return { ...entry, label: `${entry.label}, ${language}`, language }
  })
}

/**
 * Sideways scroll, and every element whose painted box is past either edge.
 * Painted: cut by every ancestor that clips what overflows it, as
 * formancy.ai-data's camera cuts it. A JSON region scrolls its text inside
 * itself; what it clips is reached by scrolling it, and its own box is
 * measured like any other.
 */
export function measureWidth(page) {
  return page.evaluate(() => {
    const edge = document.documentElement.clientWidth
    const painted = (element) => {
      let { left, right } = element.getBoundingClientRect()
      for (let ancestor = element.parentElement; ancestor !== null && ancestor !== document.documentElement; ancestor = ancestor.parentElement) {
        if (getComputedStyle(ancestor).overflowX === 'visible') continue
        const box = ancestor.getBoundingClientRect()
        ;[left, right] = [Math.max(left, box.left), Math.min(right, box.right)]
      }
      return { left, right }
    }
    const past = []
    for (const element of document.body.querySelectorAll('*')) {
      const whole = element.getBoundingClientRect()
      if (whole.width === 0 || whole.height === 0) continue
      const box = painted(element)
      if (box.right <= box.left) continue
      if (box.right <= edge + 0.5 && box.left >= -0.5) continue
      past.push(`${element.tagName.toLowerCase()}.${String(element.className).slice(0, 24)} at ${Math.round(box.left)}..${Math.round(box.right)}`)
    }
    return { overflow: document.documentElement.scrollWidth - edge, past: [...new Set(past)].slice(0, 6) }
  })
}

/**
 * axe's default rules, and target size, which axe ships switched off
 * (WCAG 2.2 SC 2.5.8), over `target` or the whole document. axe goes in
 * through Playwright's evaluate, which the page's policy does not govern:
 * Report's `addScriptTag({ content })` is an inline script, which the
 * policy refuses, and gate-privacy.mjs checks that it does. A guard on the
 * guard: the two measurements jsdom cannot make must have run over
 * something. Every text whose contrast axe left undecided is sorted:
 * scrolled out of its region, wholly or in part, which axe cannot see past
 * -- the tall pass brings more into view -- or a text nobody measured,
 * which fails.
 */
export async function audit(page, target) {
  if (!(await page.evaluate(() => 'axe' in window))) await page.evaluate(AXE)
  const subject = target ?? (await page.evaluateHandle(() => document))
  return subject.evaluate(async (context) => {
    const results = await window.axe.run(context, { rules: { 'target-size': { enabled: true } } })
    const nodes = (list, id) => list.find((rule) => rule.id === id)?.nodes ?? []
    const why = (node) => node.any?.[0]?.data?.messageKey ?? node.any?.[0]?.message ?? 'no reason given'
    const elementOf = (node) => document.querySelector(String(node.target[0]))
    // Scrolled out of its region, wholly or in part: its box cut by an ancestor that clips what overflows it.
    const clipped = (node) => {
      const element = elementOf(node)
      if (element === null) return false
      const box = element.getBoundingClientRect()
      let [left, top, right, bottom] = [box.left, box.top, box.right, box.bottom]
      for (let ancestor = element.parentElement; ancestor !== null && ancestor !== document.documentElement; ancestor = ancestor.parentElement) {
        const style = getComputedStyle(ancestor)
        if (style.overflowX === 'visible' && style.overflowY === 'visible') continue
        const outer = ancestor.getBoundingClientRect()
        ;[left, top, right, bottom] = [Math.max(left, outer.left), Math.max(top, outer.top), Math.min(right, outer.right), Math.min(bottom, outer.bottom)]
      }
      const shown = Math.max(0, right - left) * Math.max(0, bottom - top)
      return shown < box.width * box.height - 1
    }
    const undecided = nodes(results.incomplete, 'color-contrast')
    const hidden = undecided.filter(clipped)
    return {
      axe: window.axe.version,
      violations: results.violations.map((rule) => `${rule.id} (${String(rule.nodes.length)}): ${rule.nodes[0]?.html.slice(0, 90) ?? ''}`),
      measured: ['color-contrast', 'target-size'].filter((id) => nodes(results.passes, id).length > 0),
      undecided: undecided.filter((node) => !hidden.includes(node)).map((node) => `${node.html.slice(0, 60)} (${why(node)})`).slice(0, 4),
      hidden: hidden.length,
    }
  })
}

/**
 * Installed before any script of the page runs: the hook React's renderer
 * reports itself to as it starts, as React's developer tools install it,
 * keeping only the build each renderer says it is -- `bundleType` 0 for
 * React's production build, 1 for its development build. The bundle's
 * text could be searched for a development-only word instead; the
 * renderer's own report is the fact, and a word is not.
 */
export function recordReact() {
  window.__gateReact = []
  window.__REACT_DEVTOOLS_GLOBAL_HOOK__ = {
    supportsFiber: true,
    inject: (internals) => window.__gateReact.push(internals.bundleType),
    onCommitFiberRoot: () => undefined,
    onCommitFiberUnmount: () => undefined,
    onPostCommitFiberRoot: () => undefined,
    checkDCE: () => undefined,
  }
}

/** Null when every React renderer the page started is React's production build; otherwise what reported. */
export async function reactProblem(page) {
  const builds = await page.evaluate(() => window.__gateReact ?? null)
  if (builds === null) return 'no hook was installed before the page ran'
  if (builds.length === 0) return 'no React renderer reported itself'
  return builds.every((build) => build === 0) ? null : `React's renderer reported bundleType ${builds.join(', ')}: its development build, which no deploy serves`
}

/** What has the keyboard's focus, said so that a failure names it. */
export function describeFocus(page) {
  return page.evaluate(() => {
    const element = document.activeElement
    if (element === null || element === document.body) return 'the page itself'
    const name = element.getAttribute('aria-label') ?? element.labels?.[0]?.textContent ?? element.textContent ?? ''
    return `${element.tagName.toLowerCase()}${element.getAttribute('type') === null ? '' : `[type=${element.getAttribute('type')}]`} "${name.trim().slice(0, 40)}"`
  })
}

/** Every face the built stylesheets declare, as `family weight style`: what the page can ask for. */
export function declaredFaces(dir = dist) {
  const assets = join(dir, 'assets')
  const css = readdirSync(assets)
    .filter((name) => name.endsWith('.css'))
    .map((name) => readFileSync(join(assets, name), 'utf8'))
    .join('\n')
  return [...css.matchAll(/@font-face\s*\{([^}]*)\}/g)].map(([, block]) => {
    const value = (property, fallback) => new RegExp(`${property}:\\s*([^;]+)`).exec(block)?.[1]?.trim().replaceAll(/["']/g, '') ?? fallback
    return `${value('font-family', '?')} ${value('font-weight', '400')} ${value('font-style', 'normal')} ${value('unicode-range', 'every character')}`
  })
}

/**
 * Whether every face the page declares loaded, once `document.fonts` has
 * nothing pending, or, in the pass that refuses the font files, none did:
 * a state measured before a late face swapped in would measure the
 * fallback. Each face, and not each family: the page asks for every face
 * as it starts (src/faces.ts), so that nothing typed later asks for one.
 * In a browser that `forgets` -- 0014's forgetsLoadedFaces, WebKit -- a face
 * the page loaded and does not draw with is "unloaded" again once it has
 * drawn: there, every face not loaded is "unloaded", at least one is, or
 * the row no longer says what the browser does, and each loads again; the
 * privacy checks after hold that doing so asked for no file. Null when it
 * holds.
 */
export async function fontProblem(page, { refused, forgets = false }) {
  const declared = declaredFaces()
  if (declared.length === 0) return "no stylesheet of the built demo declares a face; the gate reads the faces from dist's @font-face rules"
  const faces = await page.evaluate(async () => {
    await document.fonts.ready
    return [...document.fonts].map((face) => ({ face: `${face.family.replaceAll(/["']/g, '')} ${face.weight} ${face.style} ${face.unicodeRange === 'U+0-10FFFF' ? 'every character' : face.unicodeRange}`, status: face.status }))
  })
  const loaded = faces.filter((face) => face.status === 'loaded').map((face) => face.face)
  if (refused) return loaded.length === 0 ? null : `${loaded.slice(0, 3).join('; ')} loaded anyway, so this pass measured the web fonts, not the fallback stack`
  const families = (list) => [...new Set(list.map((face) => face.split(' ')[0]))]
  if (faces.length !== declared.length) return `the page holds ${String(faces.length)} faces, where the built stylesheets declare ${String(declared.length)} (${families(declared).join(', ')})`
  const waiting = faces.filter((face) => face.status !== 'loaded').map((face) => `${face.face}: ${face.status}`)
  if (!forgets) return waiting.length === 0 ? null : `${String(waiting.length)} of ${String(faces.length)} faces did not load as the page started, so text typed in their range would ask for them later: ${waiting.slice(0, 3).join('; ')}`
  const otherwise = faces.filter((face) => !['loaded', 'unloaded'].includes(face.status)).map((face) => `${face.face}: ${face.status}`)
  if (otherwise.length > 0) return `${String(otherwise.length)} of ${String(faces.length)} faces neither loaded nor forgotten: ${otherwise.slice(0, 3).join('; ')}`
  if (waiting.length === 0) return `every face is loaded once the page has drawn, so 0014's table no longer says what this browser does`
  const again = await page.evaluate(async () => (await Promise.allSettled([...document.fonts].filter((face) => face.status === 'unloaded').map((face) => face.load()))).filter((result) => result.status !== 'fulfilled' || result.value.status !== 'loaded').length)
  return again === 0 ? null : `${String(again)} of the ${String(waiting.length)} faces it forgot did not load again`
}
