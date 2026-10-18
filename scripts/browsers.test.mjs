import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, test } from 'vitest'
import { BROWSERS, FACTS, gateBrowsers, installCommand, PINNED_AS, ranIn, VARIABLE } from './browsers.mjs'
import { readWorkflow } from './workflows.mjs'

const repo = join(dirname(fileURLToPath(import.meta.url)), '..')

/**
 * The browsers the demo's gate runs in, how it is told which, and the table
 * of what they disagree on (0014): held to the gates workflow, which runs one
 * leg of the browser job per browser, and to FORMANCY_BROWSERS, which
 * narrows a run on a machine and never widens one past what the report can
 * hold to a pin.
 */

describe('BROWSERS', () => {
  // The report expects a result from every browser of BROWSERS, and CI
  // produces one per leg of the browser job's matrix. A browser in one and
  // not the other is a leg whose results the report reads as missing, or a
  // browser the report requires that no job runs.
  test('is the browser job’s matrix, in its order', () => {
    expect(readWorkflow().jobs.browser.strategy.matrix.browser).toEqual([...BROWSERS])
  })

  // turbo runs test:browser in strict mode, handing a task only the
  // variables its config names: were FORMANCY_BROWSERS dropped there, every
  // leg would run the gate in every browser it runs on, and each leg's
  // collect would find the others' files beside its own.
  test('reaches the gate through turbo', () => {
    expect(JSON.parse(readFileSync(join(repo, 'turbo.json'), 'utf8')).tasks['test:browser'].passThroughEnv).toContain(VARIABLE)
  })

  // Playwright pins one build per browser, and headless Chromium is the
  // headless shell, pinned beside the full browser at one version: the pin
  // the report holds a launch to must be the build the launch starts.
  test('pins each browser as the build its launch starts', () => {
    expect(PINNED_AS).toEqual({ chromium: 'chromium-headless-shell', firefox: 'firefox', webkit: 'webkit' })
  })
})

describe('gateBrowsers', () => {
  // On a machine with the variable unset, the gate runs in every browser
  // that runs there, one after the other: the demo's gate starts nothing
  // per browser but a context, so a person's run is CI's, but for WebKit
  // off Linux.
  test('runs every browser that runs here when FORMANCY_BROWSERS is unset, and those it names otherwise, in its order', () => {
    expect(gateBrowsers({ env: {}, platform: 'linux' })).toEqual(['chromium', 'firefox', 'webkit'])
    expect(gateBrowsers({ env: {}, platform: 'win32' })).toEqual(['chromium', 'firefox'])
    expect(gateBrowsers({ env: { FORMANCY_BROWSERS: ' webkit , chromium ' }, platform: 'linux' })).toEqual(['webkit', 'chromium'])
  })

  // A name the gate does not run in would launch a browser no pin holds, or
  // fail deep inside Playwright; an empty value is a leg whose matrix value
  // went missing, which must not quietly run every browser; a repeat runs
  // one browser twice and overwrites its own results.
  test('refuses an unknown browser, an empty list and a repeat', () => {
    expect(() => gateBrowsers({ env: { FORMANCY_BROWSERS: 'opera' }, platform: 'linux' })).toThrow('FORMANCY_BROWSERS names opera, which is no browser the gates run in: chromium, firefox, webkit')
    expect(() => gateBrowsers({ env: { FORMANCY_BROWSERS: '' }, platform: 'linux' })).toThrow('FORMANCY_BROWSERS is set and names no browser: unset it for every browser the gates run in here, or name some of chromium, firefox, webkit')
    expect(() => gateBrowsers({ env: { FORMANCY_BROWSERS: ' , ' }, platform: 'linux' })).toThrow(/names no browser/)
    expect(() => gateBrowsers({ env: { FORMANCY_BROWSERS: 'firefox,firefox' }, platform: 'linux' })).toThrow('FORMANCY_BROWSERS names firefox twice')
  })

  // Playwright's WebKit on Windows and macOS is another port than the
  // Linux one CI runs: on Windows its Tab skipped the skip link (0014). A
  // WebKit run there would hold another browser to the table.
  test('refuses WebKit off Linux, naming what runs there', () => {
    for (const platform of ['darwin', 'win32']) {
      expect(() => gateBrowsers({ env: { FORMANCY_BROWSERS: 'chromium,webkit' }, platform })).toThrow(
        `FORMANCY_BROWSERS names WebKit, which the gate runs on Linux only: Playwright's WebKit on ${platform} is another port than the one CI runs, and the gate holds 0014's table on Linux's. Here, FORMANCY_BROWSERS=chromium,firefox pnpm test:browser`,
      )
    }
  })

  // The first line of a run says what it measured and what it left to
  // another run, so a green local run in two browsers is not read as three.
  test('says which browsers a run leaves out', () => {
    expect(ranIn(['chromium', 'firefox'], { env: {}, platform: 'win32' })).toBe(
      'In Chromium and Firefox: FORMANCY_BROWSERS is unset, which runs every browser the gate runs on win32; not in WebKit, which the release report expects results from too, and which runs on Linux only.',
    )
    expect(ranIn(['webkit'], { env: { FORMANCY_BROWSERS: 'webkit' }, platform: 'linux' })).toBe('In WebKit, as FORMANCY_BROWSERS=webkit asks; not in Chromium and Firefox, which the release report expects results from too.')
    expect(installCommand('webkit')).toBe('pnpm --filter @formancy/health-demo exec playwright install webkit')
  })
})

describe('FACTS', () => {
  // A row with no value for a browser is a fact the gate cannot hold in
  // it: its check would pass or fail there on an undefined.
  test('gives every row a value, a source and a measurement for every browser', () => {
    for (const [id, fact] of Object.entries(FACTS)) {
      for (const field of ['values', 'source', 'measured']) expect(Object.keys(fact[field]).sort(), `${id}.${field}`).toEqual([...BROWSERS].sort())
      for (const browser of BROWSERS) expect(typeof fact.values[browser], `${id}.values.${browser}`).toBe('boolean')
      for (const browser of BROWSERS) expect(fact.measured[browser].on, `${id}.measured.${browser}`).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    }
  })

  // A row is held by checks of a gate that runs: an app with no browser
  // gate, or a row with no check, is a sentence nothing measures. That
  // each check is made is the report's to hold, from the run.
  test('names, for every row, the checks of an app whose test:browser is its gate', () => {
    const gated = readdirSync(join(repo, 'apps')).filter((name) => JSON.parse(readFileSync(join(repo, 'apps', name, 'package.json'), 'utf8')).scripts?.['test:browser'] === 'node scripts/browser-test.mjs')
    for (const [id, fact] of Object.entries(FACTS)) {
      expect(gated.map((name) => `apps/${name}`), id).toContain(fact.heldBy.gate)
      expect(fact.heldBy.checks.length, id).toBeGreaterThan(0)
      // One name in every browser, so a browser that changes fails it by name.
      for (const check of fact.heldBy.checks) expect(check, id).not.toMatch(/Chromium|Firefox|WebKit/)
    }
  })

  // The demo's gate tells WebKit's own refusal from the page's by what the
  // row says WebKit reports and logs; a row that said less would let a
  // refusal of the page's through as WebKit's.
  test('says exactly what the browser reports and logs of its own refusal', () => {
    expect(FACTS.refusesItsOwnSelectStyle.report).toEqual({ directive: 'style-src-attr', blocked: 'inline', target: 'SELECT', sample: 'text-overflow:inherit' })
    expect(FACTS.refusesItsOwnSelectStyle.console).toBe("Refused to apply a stylesheet because its hash, its nonce, or 'unsafe-inline' does not appear in the style-src directive of the Content Security Policy.")
  })
})
