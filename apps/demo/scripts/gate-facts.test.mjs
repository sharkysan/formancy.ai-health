// @vitest-environment node
import { describe, expect, test } from 'vitest'
import { FACTS } from '../../../scripts/browsers.mjs'
import { headersFor } from '../../../scripts/demo-headers.mjs'
import { heldNextFile, heldSelectStyle, lateOfItsOwn, selectsDrawTheSame, thePagesOwn, withSamples } from './gate-facts.mjs'

/**
 * What the demo's browser gate tells apart of what a browser does of its
 * own and what the page does (gate-facts.mjs, 0014), against the reports,
 * console lines and requests a browser gives it. Part of the demo's suite,
 * whose include names scripts/: a test file here that no suite ran would be
 * one the report fails (0011).
 */

const ROW = FACTS.refusesItsOwnSelectStyle
const LINE = ROW.console
/** A report as gate-privacy.mjs's listener keeps it: WebKit's own, at the page's first select, as the demo's policy has it reported, with no sample. */
const report = (change = {}) => ({ directive: 'style-src-attr', blocked: 'inline', target: 'SELECT', element: 0, ownStyle: false, sample: '', at: 'http://localhost:4395/health/assets/index.js:10', ...change })
const FONT = 'http://localhost:4395/health/assets/ibm-plex-sans-greek-400-normal-D9ESIMu3.woff'

/** A gate that keeps its checks: name -> problem. */
const recorder = () => {
  const checks = new Map()
  return { checks, check: (name, problem) => checks.set(name, problem) }
}

describe('what the page did, apart from what the browser does of its own', () => {
  // WebKit 27.2 refuses a style of its own on every select and logs a line
  // for each: counted as the page's, every WebKit pass of a page with a
  // select fails; let through by their shape alone, a style the page puts
  // on a select, or a line more than WebKit's reports, would pass too.
  test('leaves out WebKit’s own refusal at a select, each line matched to a report, and nothing else', () => {
    const pages = thePagesOwn('webkit', { reports: [report(), report({ element: 1, sample: ROW.report.sample })], errors: [{ text: LINE, url: '' }, { text: LINE, url: '' }] })
    expect(pages).toEqual({ reports: [], errors: [], own: { refusesItsOwnSelectStyle: 2 } })
    const theirs = [report({ ownStyle: true }), report({ target: 'OPTION' }), report({ directive: 'style-src-elem' }), report({ sample: 'color:red' }), report({ blocked: 'http://localhost:4395/elsewhere.css' })]
    expect(thePagesOwn('webkit', { reports: theirs, errors: [] }).reports).toEqual(theirs)
    expect(thePagesOwn('webkit', { reports: [report()], errors: [{ text: LINE, url: '' }, { text: LINE, url: '' }] }).errors).toEqual([{ text: LINE, url: '' }])
  })

  // WebKit refuses its own style once for each select. A style the page
  // set on a select and took off again before the report came is a report
  // of the same shape at that select: excused by its shape alone, it would
  // pass in WebKit. One report of each select is WebKit's; a second at it,
  // and its line, are the page's.
  test('leaves out one report of each select, and keeps a second at one select as the page’s', () => {
    const pages = thePagesOwn('webkit', { reports: [report(), report({ element: 1 }), report()], errors: [LINE, LINE, LINE].map((text) => ({ text, url: '' })) })
    expect(pages).toEqual({ reports: [report()], errors: [{ text: LINE, url: '' }], own: { refusesItsOwnSelectStyle: 2 } })
  })

  // The row says Chromium and Firefox refuse nothing of their own: the same
  // report there is the page's, and fails the gate.
  test('leaves out nothing of the row in a browser the row says does not refuse', () => {
    for (const browser of ['chromium', 'firefox']) expect(thePagesOwn(browser, { reports: [report()], errors: [{ text: LINE, url: '' }] })).toEqual({ reports: [report()], errors: [{ text: LINE, url: '' }], own: {} })
  })

  // In the pass that refuses the web fonts, every browser logs each refused
  // file -- Chromium where it came from, Firefox in its text. Those are the
  // gate's doing; an error about any other file is the page's.
  test('leaves out the errors that name a font file the gate refused, wherever the browser names it', () => {
    const refused = new Set([FONT])
    const errors = [
      { text: 'Failed to load resource: net::ERR_FAILED', url: FONT },
      { text: `[JavaScript Error: "downloadable font: download failed (font-family: "IBM Plex Sans" style:normal weight:400 width:100 src index:0): status=2147500037 source: ${FONT}"]`, url: '' },
      { text: 'Failed to load resource: net::ERR_FAILED', url: 'http://localhost:4395/health/assets/index.js' },
    ]
    expect(thePagesOwn('chromium', { reports: [], errors, refused }).errors).toEqual([errors[2]])
  })
})

describe('what the browser asked for late, apart from the page', () => {
  // WebKit asks for a face's next file when text in its range is drawn,
  // after the page settled, once its first was refused: counted as the
  // page's, the refusing pass fails in WebKit; let through anywhere else,
  // a late request of the page's would pass.
  test('leaves out a refused font file in WebKit alone', () => {
    const late = [FONT, 'http://localhost:4395/health/assets/index.js']
    expect(lateOfItsOwn('webkit', { late, refused: new Set([FONT]) })).toEqual({ own: [FONT], page: ['http://localhost:4395/health/assets/index.js'] })
    expect(lateOfItsOwn('chromium', { late, refused: new Set([FONT]) })).toEqual({ own: [], page: late })
  })

  // The row holds by its check: a WebKit that asked for nothing late, or a
  // Chromium that did, is a table that no longer says what the browser does.
  test('holds asksForTheNextFileLater by one check of one name in every browser', () => {
    const [name] = FACTS.asksForTheNextFileLater.heldBy.checks
    const held = (browser, late, refused = new Set([FONT])) => {
      const gate = recorder()
      heldNextFile(gate, { browser, late, refused })
      return gate.checks.get(name)
    }
    expect(held('webkit', [FONT])).toBeNull()
    expect(held('webkit', [])).toBe('the table says true, and once the page had settled it asked for no font file')
    expect(held('webkit', [FONT], new Set())).toBe('the table says true, and once the page had settled it asked for ibm-plex-sans-greek-400-normal-D9ESIMu3.woff (not refused)')
    expect(held('chromium', [])).toBeNull()
    expect(held('firefox', [FONT])).toBe('the table says false, and once the page had settled it asked for ibm-plex-sans-greek-400-normal-D9ESIMu3.woff')
  })
})

describe('the row of the select, held on a page of its own', () => {
  // The probe page is the demo's policy with samples asked for, so that the
  // report names what WebKit refused; the policy is otherwise the demo's.
  test('asks for samples in the policy’s style-src and changes nothing else', () => {
    const policy = headersFor('http://localhost:4395/health/')['Content-Security-Policy']
    const sampled = withSamples(policy)
    expect(sampled).toBe(policy.replace("style-src http://localhost:4395/health/assets/", "style-src http://localhost:4395/health/assets/ 'report-sample'"))
    expect(() => withSamples("default-src 'none'")).toThrow("the page's policy has no style-src to ask for samples in: default-src 'none'")
  })

  /**
   * A context whose one new page reports `reports` and logs `lines`, as a
   * browser would: the lines once loaded, or after the gate has waited
   * `waits` times, as a slow machine's console reaches it late.
   */
  const context = (reports, lines, { waits = 0 } = {}) => ({
    newPage: async () => {
      const listeners = []
      let waited = 0
      const log = () => {
        for (const line of lines) for (const listener of listeners) listener({ type: () => 'error', text: () => line })
      }
      return {
        on: (event, listener) => (event === 'console' ? listeners.push(listener) : undefined),
        route: async () => undefined,
        goto: async () => (waits === 0 ? log() : undefined),
        waitForTimeout: async () => {
          waited += 1
          if (waited === waits) log()
        },
        evaluate: async () => reports,
        close: async () => undefined,
      }
    },
  })
  const held = async (browser, reports, lines, late) => {
    const gate = recorder()
    await heldSelectStyle(gate, { context: context(reports, lines, late), url: 'http://localhost:4395/health/', headers: headersFor('http://localhost:4395/health/'), browser })
    return gate.checks.get(ROW.heldBy.checks[0])
  }

  // WebKit's report and line, exactly as the row says them, hold it in
  // WebKit; any other answer -- nothing, another sample, a second line, the
  // same in Chromium -- is the table no longer saying what the browser does.
  test('holds refusesItsOwnSelectStyle by one check of one name in every browser', async () => {
    const theirs = [report({ sample: ROW.report.sample })]
    expect(await held('webkit', theirs, [LINE])).toBeNull()
    expect(await held('chromium', [], [])).toBeNull()
    expect(await held('webkit', [], [])).toBe('the table says true, and the page of one select reported [] and logged []')
    expect(await held('webkit', [report({ sample: 'color:red' })], [LINE])).toMatch(/^the table says true, and the page of one select reported \[\{.*"sample":"color:red"/)
    expect(await held('webkit', theirs, [LINE, LINE])).toMatch(/logged \[".*",".*"\]$/)
    expect(await held('firefox', theirs, [LINE])).toMatch(/^the table says false, and the page of one select reported \[\{/)
    expect(await held('webkit', null, [])).toBe('no listener was installed before the page ran')
  })

  // The console's line reaches the gate by another way than the report,
  // and on a slower machine later: read after a fixed wait, WebKit's row
  // would fail there by chance. It is waited for, and only so long.
  test('waits for the row’s line where it comes late, and fails where it does not come', async () => {
    const theirs = [report({ sample: ROW.report.sample })]
    expect(await held('webkit', theirs, [LINE], { waits: 3 })).toBeNull()
    expect(await held('webkit', theirs, [LINE], { waits: 1_000 })).toMatch(/logged \[\]$/)
  })
})

describe('why the row costs the page nothing', () => {
  /** A page whose selects have `overflows` as their text-overflow. */
  const page = (overflows) => ({ evaluate: async () => overflows })
  const said = async (overflows) => {
    const gate = recorder()
    await selectsDrawTheSame(gate, page(overflows))
    return [...gate.checks.values()][0]
  }

  // The style WebKit refuses passes a select's text-overflow to its text:
  // with every select at clip it changes nothing drawn; a select given
  // ellipsis would be drawn otherwise in WebKit, and a page with no select
  // measures nothing of the row.
  test('holds while every select of the page has clip, and fails on another value or on none', async () => {
    expect(await said(['clip', 'clip'])).toBeNull()
    expect(await said(['clip', 'ellipsis'])).toBe('selects with ellipsis')
    expect(await said([])).toBe('the page holds no select, so the row measures nothing of it')
  })
})
