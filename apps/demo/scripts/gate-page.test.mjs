// @vitest-environment node
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, test } from 'vitest'
import { LANGUAGES } from '../src/words/index.js'
import { app, breakpointsOf, passes, stylesheets } from './gate-page.mjs'

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
    const plan = passes(LANGUAGES, [{ path: 'a.css', css: '@media (max-width: 30rem) {} @media (min-width: 50rem) {}' }, { path: 'b.css', css: '@media (max-width: 480px) {}' }])
    expect(plan.map((entry) => entry.width)).toEqual([320, 320, 360, 481, 800, 1440, 2400])
    expect(() => passes(LANGUAGES, [{ path: 'a.css', css: '@media (min-width: 50rem) {}' }])).toThrow(/no max-width breakpoint/)
    expect(() => breakpointsOf('@media (max-width: 40vw) {}')).toThrow(/a unit the gate does not measure/)
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
