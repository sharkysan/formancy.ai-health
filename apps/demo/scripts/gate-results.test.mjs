// @vitest-environment node
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, test } from 'vitest'
import { launchedAs, LAUNCH_OPTIONS } from '../../../scripts/browsers.mjs'
import { gateRecorder } from './gate-results.mjs'

/**
 * The demo's browser gate's recorder (gate-results.mjs), as the release
 * report reads what it writes. Part of the demo's suite, whose include
 * names scripts/: a test file here that no suite ran would be one the
 * report fails (0011).
 */
let dirs = []
afterEach(() => {
  for (const dir of dirs) rmSync(dir, { recursive: true, force: true })
  dirs = []
})

const temporary = () => {
  const dir = mkdtempSync(join(tmpdir(), 'formancy-health-gate-'))
  dirs.push(dir)
  return dir
}

/** A browser as Playwright hands one to the gate. */
const chromium = { browserType: () => ({ name: () => 'chromium' }), version: () => '156.0.8078.4' }

describe('what the browser gate writes', () => {
  // The gate walks one journey at every width, so a pass it planned and did
  // not make is every check of that width skipped. The report can only see
  // that against the plan the gate made before its first pass; written
  // after, the plan would be whatever the gate reached.
  test('keeps the passes it planned beside those it made, and the Playwright that launched the browser', () => {
    const dir = temporary()
    const gate = gateRecorder('apps/demo', { browser: 'chromium', playwright: '1.64.1', log: () => {} })
    gate.plan([{ label: 'reflow, 320, de-CH' }, { label: 'phone, 360, it' }])
    gate.launched(chromium, { headless: true })
    gate.pass({ label: 'reflow, 320, de-CH', width: 320, height: 900 })
    gate.check('the first Tab reaches the skip link', null)
    gate.check('the page set no cookie', 'cookies: planted')
    gate.error(new Error('page.goto: net::ERR_CONNECTION_REFUSED'))
    const written = gate.write(dir)
    expect(JSON.parse(readFileSync(join(dir, 'test-results', 'browser-chromium.json'), 'utf8'))).toEqual(written)
    expect(written).toMatchObject({
      gate: 'apps/demo',
      asked: 'chromium',
      browser: { name: 'chromium', version: '156.0.8078.4', headless: true },
      playwright: '1.64.1',
      planned: ['reflow, 320, de-CH', 'phone, 360, it'],
      passes: 1,
      made: [
        {
          label: 'reflow, 320, de-CH',
          width: 320,
          checks: ['the first Tab reaches the skip link', 'the page set no cookie'],
          failed: ['the page set no cookie'],
        },
      ],
      checks: { ok: 1, failed: ['reflow, 320, de-CH: the page set no cookie: cookies: planted'] },
      error: 'page.goto: net::ERR_CONNECTION_REFUSED',
    })
  })

  // Playwright pins Chromium's headless shell and its full browser at one
  // version, so how the browser was launched is what says which build ran;
  // the report holds it to LAUNCH_OPTIONS.
  test('records whether the browser ran headless, and refuses a launch of another browser than asked', () => {
    const headed = gateRecorder('apps/demo', { browser: 'chromium', log: () => {} })
    headed.launched(chromium, { headless: false })
    expect(headed.write(temporary()).browser).toMatchObject({ name: 'chromium', version: '156.0.8078.4', headless: false })
    // Playwright launches headless when the options do not say.
    expect(launchedAs(chromium, {})).toEqual({ name: 'chromium', version: '156.0.8078.4', headless: true })
    expect(launchedAs(chromium, LAUNCH_OPTIONS).headless).toBe(LAUNCH_OPTIONS.headless)
    expect(() => gateRecorder('apps/demo', { browser: 'firefox', log: () => {} }).launched(chromium, {})).toThrow(
      'apps/demo asked for firefox, and the launch gave chromium 156.0.8078.4',
    )
  })

  // A gate that never planned -- it failed before it knew its widths -- says
  // so with an empty plan and its error, not with a plan it did not make.
  test('writes an empty plan and no browser when it ended before either', () => {
    const gate = gateRecorder('apps/demo', { browser: 'chromium', log: () => {} })
    gate.error('found no max-width breakpoint')
    expect(gate.write(temporary())).toMatchObject({ planned: [], passes: 0, browser: null, playwright: null, error: 'found no max-width breakpoint' })
  })
})
