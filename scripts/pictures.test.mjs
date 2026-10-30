import { join } from 'node:path'
import { describe, expect, test } from 'vitest'
import { parse, plan, redated, table } from './pictures.mjs'
import { readScenes, REPO } from './pictures/record.mjs'

/**
 * `node scripts/pictures.mjs`, the root runner of the README's pictures
 * (0016): what it accepts, what it runs and what it prints. Running the app
 * is its script's business and needs a browser; deciding what to run is
 * this file's and needs neither. Two apps here, where the repository has
 * one, so that "only its own scenes" says something.
 */

const SCENES = [
  { id: 'demo-form', app: 'demo' },
  { id: 'other-one', app: 'other' },
  { id: 'demo-refused', app: 'demo' },
  { id: 'other-two', app: 'other' },
]
const OUTSIDE = join(REPO, '..', 'pictures-review')

describe('the arguments', () => {
  // A misspelt scene or app would otherwise run nothing and say it succeeded.
  test('are checked against scenes.json', () => {
    expect(parse(['--app', 'demo', '--scene', 'demo-refused'], SCENES)).toEqual({
      apps: ['demo'],
      scenes: ['demo-refused'],
      all: false,
      check: false,
      review: undefined,
    })
    expect(() => parse(['--app', 'site'], SCENES)).toThrow('--app site is no app with a scene in scripts/pictures/scenes.json; those are demo, other')
    expect(() => parse(['--scene', 'demo-refusd'], SCENES)).toThrow('--scene demo-refusd is no scene of scripts/pictures/scenes.json')
    expect(() => parse(['--scene'], SCENES)).toThrow(/^--scene needs a value/)
    expect(() => parse(['--scene', '--all'], SCENES)).toThrow(/^--scene needs a value/)
    expect(() => parse(['--force'], SCENES)).toThrow(/^--force is not an option/)
  })

  // Each pair would mean nothing, and running one half of it would surprise.
  test('refuse the combinations that mean nothing', () => {
    expect(() => parse(['--all', '--scene', 'demo-form'], SCENES)).toThrow('--all retakes every scene of an app, so it is not given with --scene')
    expect(() => parse(['--check', '--all'], SCENES)).toThrow(/^--check walks every scene of an app and writes nothing/)
    expect(() => parse(['--check', '--scene', 'demo-form'], SCENES)).toThrow(/^--check walks every scene/)
    expect(() => parse(['--app', 'demo', '--scene', 'other-two'], SCENES)).toThrow('--scene other-two is a other scene, and --app names demo')
  })

  // Refused before any app runs, and a relative directory resolved here,
  // since the app runs elsewhere.
  test('take a review directory outside the repository only, made absolute', () => {
    expect(() => parse(['--review', 'x'], SCENES, { cwd: REPO })).toThrow(/^--review x is inside the repository \(x\)/)
    expect(parse(['--review', '../pictures-review'], SCENES, { cwd: REPO }).review).toBe(OUTSIDE)
  })

  // The repository's own scenes: every app in them is one --app accepts,
  // and today that is the demo alone.
  test("accept every app of the repository's scenes", () => {
    const apps = [...new Set(readScenes().map((scene) => scene.app))]
    expect(apps).toEqual(['demo'])
    for (const app of apps) expect(parse(['--app', app], readScenes()).apps).toEqual([app])
  })
})

describe('the plan', () => {
  // Every app, in scenes.json's order, when nothing narrows it; a scene only
  // to the app that has it, so no app is asked for a scene it cannot take.
  test("runs the apps in scenes.json's order, each with only its own scenes", () => {
    expect(plan(parse([], SCENES), SCENES)).toEqual({
      runs: [
        { app: 'demo', args: [] },
        { app: 'other', args: [] },
      ],
      fresh: false,
      write: true,
    })
    expect(plan(parse(['--scene', 'other-two', '--scene', 'demo-form', '--review', OUTSIDE], SCENES), SCENES).runs).toEqual([
      { app: 'demo', args: ['--scene', 'demo-form', '--review', OUTSIDE] },
      { app: 'other', args: ['--scene', 'other-two', '--review', OUTSIDE] },
    ])
  })

  // One look: only --all without --app may start a new look, so only it
  // starts from an empty record; --check writes neither pictures nor README.
  test('starts from an empty record only for --all without --app, and writes nothing for --check', () => {
    expect(plan(parse(['--all'], SCENES), SCENES)).toMatchObject({ fresh: true, write: true })
    expect(plan(parse(['--all', '--app', 'demo'], SCENES), SCENES)).toEqual({ runs: [{ app: 'demo', args: ['--all'] }], fresh: false, write: true })
    expect(plan(parse(['--check'], SCENES), SCENES)).toEqual({ runs: ['demo', 'other'].map((app) => ({ app, args: ['--check'] })), fresh: false, write: false })
  })
})

describe('the record after --all', () => {
  // --all starts the apps from an empty record, so no app sees the date a
  // picture was first taken; without this, every --all would rewrite every
  // date and captured.json would change on a retake that changed no picture.
  test('keeps the date of every picture retaken as the same bytes and text', () => {
    const look = { platform: 'win32-x64', playwright: '1.64.1', chromium: '156.0.8078.4', fonts: {} }
    const before = {
      'demo-form': { captured: '2026-10-01', sha256: 'a', look, text: { Form: '- region "The form"' } },
      'demo-refused': { captured: '2026-10-01', sha256: 'b', look, text: { Response: '- region "The answers"' } },
    }
    const after = {
      'demo-form': { ...before['demo-form'], captured: '2026-10-20' },
      'demo-refused': { ...before['demo-refused'], captured: '2026-10-20', sha256: 'c' },
    }
    expect(redated(before, after, SCENES)).toEqual({ 'demo-form': before['demo-form'], 'demo-refused': after['demo-refused'] })
  })
})

describe('the table', () => {
  // What a reviewer lists in the pull request: which pictures are new, which
  // changed by their bytes, and which a retake left as they were.
  test('says of each scene its CSS size, its bytes, and whether its picture is new, changed or unchanged', () => {
    const before = {
      'demo-form': { css: { width: 608, height: 1077 }, bytes: 138686, sha256: 'a' },
      'demo-refused': { css: { width: 840, height: 504 }, bytes: 122910, sha256: 'b' },
    }
    const after = {
      ...before,
      'demo-refused': { ...before['demo-refused'], sha256: 'c' },
      'other-two': { css: { width: 1440, height: 752 }, bytes: 292636, sha256: 'd' },
    }
    expect(table(before, after, SCENES).split('\n')).toEqual([
      'scene         CSS size  bytes   picture',
      'demo-form     608x1077  138686  unchanged',
      'other-one     -         -       not taken',
      'demo-refused  840x504   122910  changed',
      'other-two     1440x752  292636  new',
    ])
  })
})
