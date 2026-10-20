import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, describe, expect, test } from 'vitest'
import { context, MARGIN, padded, serve, SETTINGS } from './camera.mjs'

/**
 * The camera's decisions that need no browser (0016): the settings every
 * picture is taken in, the widths it refuses, the margin around its parts,
 * and how it answers the page's requests from the build. The families it
 * waits for and the versions a record names are faces.mjs's. Its browser
 * half -- the font wait, the intrusion check, the settle loop, the encoder
 * -- runs at every capture and every --check.
 */

describe('the settings', () => {
  // A picture taken at another scale, locale or time zone would show other
  // dates and other pixels for the same state; the locale is also the
  // language the demo opens in, so another would picture another page.
  test('are the ones every picture is taken in', () => {
    expect(SETTINGS).toEqual({ deviceScaleFactor: 2, locale: 'en-US', timezoneId: 'UTC', reducedMotion: 'reduce', colorScheme: 'light', height: 900 })
  })
})

describe('a context', () => {
  const opened = []
  const browser = { newContext: async (options) => (opened.push(options), { options }) }

  // The wide pictures are of the two columns, the form beside the
  // resources; a width at or below the widest breakpoint of the page's
  // stylesheets would picture another layout under the same captions.
  test("is opened with the settings, past the widest breakpoint, and refused at it", async () => {
    await context(browser, { width: 1440, widest: 1120 })
    expect(opened).toEqual([{ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2, locale: 'en-US', timezoneId: 'UTC', reducedMotion: 'reduce', colorScheme: 'light' }])
    await expect(context(browser, { width: 1120, widest: 1120 })).rejects.toThrow('a picture is taken past the widest breakpoint, 1120px, and 1120px is not past it')
  })
})

describe('the clip', () => {
  // A part with no frame of its own would run into the picture's edge and
  // look cut out of the page.
  test('keeps MARGIN of the bench on every side of the parts', () => {
    expect(MARGIN).toBe(16)
    expect(padded({ x: 100, y: 200, width: 300, height: 400 }, MARGIN, { width: 1440, height: 2000 })).toEqual({ x: 84, y: 184, width: 332, height: 432 })
  })

  // The bench stops short of what is drawn beside the parts, side by side:
  // the demo's sections stand 24 px apart.
  test('keeps what the bench leaves on each side, and no more', () => {
    expect(padded({ x: 616, y: 2416, width: 808, height: 624 }, { top: 12, right: 12, bottom: 12, left: 12 }, { width: 1440, height: 5190 })).toEqual({ x: 604, y: 2404, width: 832, height: 648 })
  })

  // A margin past the page's edge would be a box the full-page shot cannot
  // take, and a picture of nothing at its side.
  test('stops at the edges of the page', () => {
    expect(padded({ x: 4, y: 0, width: 1430, height: 600 }, MARGIN, { width: 1440, height: 610 })).toEqual({ x: 0, y: 0, width: 1440, height: 610 })
  })
})

describe('the page, served from the build', () => {
  const dist = mkdtempSync(join(tmpdir(), 'pictures-camera-'))
  afterAll(() => rmSync(dist, { recursive: true, force: true }))
  mkdirSync(join(dist, 'assets'))
  writeFileSync(join(dist, 'index.html'), '<!doctype html>')
  writeFileSync(join(dist, 'assets', 'index.js'), 'export {}')
  writeFileSync(join(dist, 'assets', 'face.woff2'), 'wOF2')

  /** What serve() answers to `url`, through a route handler it registered on a stand-in for the context. */
  async function answer(url) {
    let handler
    await serve({ route: async (_, registered) => void (handler = registered) }, { origin: 'http://demo.invalid', base: '/health/', dist, headers: { 'Content-Security-Policy': "default-src 'none'" } })
    let fulfilled
    await handler({ request: () => ({ url: () => url }), fulfill: async (response) => void (fulfilled = response) })
    return fulfilled
  }

  // Under the path formancy.ai serves the demo at and with the headers the
  // deploy writes, as the browser gate serves it: a picture of the page
  // under another policy, or at another path, would be of a page no
  // visitor gets.
  test('answers the page and its assets under the base, each with the headers and its type', async () => {
    const page = await answer('http://demo.invalid/health/')
    expect(page).toMatchObject({ status: 200, headers: { 'Content-Security-Policy': "default-src 'none'", 'Content-Type': 'text/html; charset=utf-8' } })
    expect(String(page.body)).toBe('<!doctype html>')
    expect(await answer('http://demo.invalid/health/assets/index.js')).toMatchObject({ status: 200, headers: { 'Content-Type': 'text/javascript; charset=utf-8' } })
    expect(await answer('http://demo.invalid/health/assets/face.woff2')).toMatchObject({ status: 200, headers: { 'Content-Type': 'font/woff2' } })
  })

  // A file outside the base is no file of the demo as served, and a path
  // that climbs out of dist must not read the machine's files.
  test('refuses what is outside the base, missing, or outside the build', async () => {
    expect(await answer('http://demo.invalid/index.html')).toMatchObject({ status: 404 })
    expect(await answer('http://demo.invalid/health/assets/none.js')).toMatchObject({ status: 404 })
    expect(await answer('http://demo.invalid/health/..%2F..%2Fsecret')).toMatchObject({ status: 403 })
  })
})
