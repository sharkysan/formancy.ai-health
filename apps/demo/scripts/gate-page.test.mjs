// @vitest-environment node
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { join } from 'node:path'
import { describe, expect, test } from 'vitest'
import { LANGUAGES } from '../src/words/index.js'
import { app, breakpointsOf, canonicalColours, passes, roomOf, roomProblem, stylesheets } from './gate-page.mjs'

/**
 * The browser gate's plan (gate-page.mjs): which widths, in which
 * languages, it measures the page at. The plan is the gate's own word --
 * the release report holds the gate to every pass it planned, and cannot
 * say which passes it should have planned -- so the plan is held here, to
 * the stylesheets the page wears and the languages it speaks. Part of the
 * demo's suite, whose include names scripts/.
 */
describe("the browser gate's plan", () => {
  // A language no pass opens the page in is a language whose words nobody
  // laid out, measured for contrast or walked through by keyboard: its
  // longer words past an edge, its refusal sentence unread.
  test('opens the page in every language it speaks, the longest words at the narrowest', () => {
    const plan = passes(LANGUAGES)
    expect([...new Set(plan.map((entry) => entry.language))].sort()).toEqual([...LANGUAGES].sort())
    expect(plan[0]).toMatchObject({ width: 320, language: LANGUAGES[0] })
    expect(new Set(plan.map((entry) => entry.label)).size).toBe(plan.length)
    expect(plan.filter((entry) => entry.refuseFonts === true).map((entry) => entry.width)).toEqual([320])
  })

  // Fewer passes than languages would leave a language to no pass, and a
  // gate that ran would say nothing of it.
  test('refuses a plan with fewer passes than languages', () => {
    const many = Array.from({ length: 12 }, (_, index) => `x${String(index)}`)
    expect(() => passes(many)).toThrow(/would be measured by no pass/)
  })

  // A breakpoint added to the page or to a theme it wears is a layout the
  // gate measures without anybody editing it: one past each max-width,
  // where the wider layout is narrowest, and at each min-width.
  test('measures one past each max-width and at each min-width of every stylesheet the page wears', () => {
    const plan = passes(LANGUAGES, [
      { path: 'a.css', css: '@media (max-width: 30rem) {} @media (min-width: 50rem) {}' },
      { path: 'b.css', css: '@media (max-width: 480px) {}' },
    ])
    expect(plan.map((entry) => entry.width)).toEqual([320, 320, 360, 481, 800, 1440, 2400])
    expect(() => passes(LANGUAGES, [{ path: 'a.css', css: '@media (min-width: 50rem) {}' }])).toThrow(/no max-width breakpoint/)
    expect(() => breakpointsOf('@media (max-width: 40vw) {}')).toThrow(/a unit the gate does not measure/)
  })

  // The room is read from the package as installed: a value written here
  // would be a copy of formancy's palette (0002), and would pass a page
  // whose release had moved a colour. A guard on the guard: the room sets
  // every colour of the workbench's, as @formancy/themes' README says, and
  // a release whose workbench gained one the room does not set would leave
  // that colour light in the dark room, which no other check names.
  test('reads the room from the installed room.css, every colour of the workbench’s set to one of its own', () => {
    const room = roomOf()
    expect(room.scheme).toBe('dark')
    expect(room.variables['--wb-signal']).toBe(room.variables['--client'])
    expect(room.variables['--wb-signal']).toMatch(/^#[\da-f]{6}$/i)
    const workbench = readFileSync(createRequire(join(app, 'package.json')).resolve('@formancy/themes/workbench.css'), 'utf8').replaceAll(
      /\/\*[\s\S]*?\*\//g,
      '',
    )
    const colours = [...workbench.matchAll(/(--wb-[\w-]+)\s*:\s*([^;]+);/g)].filter(([, , value = '']) => !value.includes("'")).map(([, name]) => name)
    expect(colours).toContain('--wb-bench')
    expect(colours.filter((name) => room.variables[name] === undefined)).toEqual([])
  })

  // What the gate holds the page to, on what a browser would hand back: the
  // room whole passes however a browser quotes or spaces a token list, and
  // however a minifier writes a colour -- Vite builds an rgb() with a
  // percentage alpha as eight hex digits, as it built room.css's --glass --
  // but a colour another by a byte of its alpha does not; the workbench
  // after the room -- its light bench on :root -- a light colour scheme, or
  // another ground behind the page each fails, naming it. The colours of
  // the made-up room are none of formancy's, so that nothing here copies
  // its palette.
  test('holds the page to the room, and names what is not so', async () => {
    const room = roomOf()
    const [r = '', g = '', b = ''] = /^#(..)(..)(..)$/.exec(room.variables['--ground'] ?? '')?.slice(1) ?? []
    const computed = `rgb(${[r, g, b].map((pair) => String(Number.parseInt(pair, 16))).join(', ')})`
    const page = (values, scheme = 'dark', ground = computed) => ({ evaluate: () => Promise.resolve({ values, scheme, ground }) })
    const exact = { ...room.variables }
    expect(await roomProblem(page(exact), room)).toBeNull()
    expect(await roomProblem(page({ ...exact, '--display': ` ${room.variables['--display'].replaceAll("'", '"').replaceAll(', ', ',')}` }), room)).toBeNull()
    const glass = { variables: { '--ground': '#010203', '--glass': 'rgb(4 5 6 / 74%)', '--edge': 'rgb(7, 8, 9, 0.09)', '--text': '#ffffff' }, scheme: 'dark' }
    const built = { '--ground': '#010203', '--glass': '#040506bd', '--edge': '#07080917', '--text': '#fff' }
    expect(await roomProblem(page(built, 'dark', 'rgb(1, 2, 3)'), glass)).toBeNull()
    expect(await roomProblem(page({ ...built, '--glass': '#040506be' }, 'dark', 'rgb(1, 2, 3)'), glass)).toMatch(/--glass is "#040506be"/)
    expect(await roomProblem(page({ ...exact, '--wb-bench': '#fefdfc' }), room)).toMatch(/--wb-bench is "#fefdfc"/)
    expect(await roomProblem(page(exact, 'normal'), room)).toMatch(/:root is drawn "normal"/)
    expect(await roomProblem(page(exact, 'dark', 'rgb(254, 253, 252)'), room)).toMatch(/the page's ground is rgb\(254, 253, 252\)/)
    expect(await roomProblem(page(exact), { variables: {}, scheme: null })).toMatch(/nothing to hold the page to/)
    expect(await roomProblem(page(exact), { variables: { '--ground': 'black' }, scheme: 'dark' })).toMatch(/not a colour the gate compares/)
  })

  // A colour a minifier rewrote is the same colour: each way CSS writes
  // one that the room or a build could, read as the same bytes, and a word
  // that is no colour left as it is. Made-up colours, none of formancy's.
  test.each([
    ['#010203', '#010203ff'],
    ['#fff', '#ffffffff'],
    ['#04050617', '#04050617'],
    ['rgb(4 5 6 / 9%)', '#04050617'],
    ['rgba(1, 2, 3, 0.74)', '#010203bd'],
    ['rgb(1, 2, 3)', '#010203ff'],
    ["'A Face', 'Another Face'", "'A Face', 'Another Face'"],
  ])('reads %s as %s', (written, read) => {
    expect(canonicalColours(written)).toBe(read)
  })

  // The breakpoints are read from what the page wears, in the order
  // main.tsx imports it: a stylesheet read from elsewhere, or one missed,
  // would plan widths for another page. A guard on the guard: the page's
  // own one-column breakpoint is among those read.
  test('reads the stylesheets main.tsx imports, in its order, its own breakpoints among them', () => {
    const main = readFileSync(join(app, 'src', 'main.tsx'), 'utf8')
    const imported = [...main.matchAll(/^import '([^']+\.css)'$/gm)].map((match) => match[1])
    const sheets = stylesheets()
    expect(sheets.map((sheet) => sheet.path)).toEqual(imported)
    expect(breakpointsOf(sheets.find((sheet) => sheet.path === './styles/demo.css')?.css ?? '').max).toContain(64 * 16)
    // The faces' stylesheet is read with Fontsource's, inlined as Vite builds it.
    expect(sheets.find((sheet) => sheet.path === './styles/fonts.css')?.css).toContain('@font-face')
  })
})
