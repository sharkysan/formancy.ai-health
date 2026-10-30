import { join } from 'node:path'
import { describe, expect, test } from 'vitest'
import {
  announce,
  checkProblems,
  dated,
  digest,
  entry,
  lineDiff,
  misquotes,
  outsideRepository,
  pairingProblems,
  picturedApps,
  pictureOf,
  quotations,
  readScenes,
  REPO,
  serialize,
  stylesheetNotices,
  withEntry,
} from './record.mjs'

/**
 * What a capture may write into docs/images/readme/captured.json and what
 * `--check` fails with, decided once for the demo's script and the guard
 * (0016). Pure, so held here without a browser; the browser half is the
 * camera's.
 */

const LOOK = {
  platform: 'win32-x64',
  playwright: '1.64.1',
  chromium: '156.0.8078.4',
  fonts: { Archivo: 'v25', 'IBM Plex Mono': 'v20', 'IBM Plex Sans': 'v23' },
}
const SETTINGS = { width: 1440, height: 900, deviceScaleFactor: 2, locale: 'en-US', timezoneId: 'UTC' }
const SCENES = [
  {
    id: 'demo-form',
    app: 'demo',
    placement: 'inline',
    title: 'The form',
    caption: 'It says “Synthetische Fragestellung”.',
    alt: 'The form.',
    quotes: { 'Synthetische Fragestellung': ['Form'] },
  },
  {
    id: 'demo-refused',
    app: 'demo',
    placement: 'inline',
    title: 'Refused',
    caption: '“Refused by @formancy/health-questionnaire:”.',
    alt: 'The response.',
    quotes: { 'Refused by @formancy/health-questionnaire:': ['Response'] },
  },
]
const FORM = { Form: '- region "The form":\n  - textbox "Question for the specialist*": Synthetische Fragestellung, ohne klinische Bedeutung' }
const REFUSED = { Response: '- region "The answers, as a QuestionnaireResponse":\n  - paragraph: "Refused by @formancy/health-questionnaire:"' }
const PICTURES = { 'demo-form': Buffer.from('demo-form'), 'demo-refused': Buffer.from('demo-refused') }
const taken = (id, text, look = LOOK) =>
  entry(id, {
    captured: '2026-10-20',
    settings: SETTINGS,
    clip: { x: 0, y: 0, width: 608, height: 1077 },
    picture: PICTURES[id] ?? Buffer.from(id),
    look,
    data: 'the demo referral',
    stylesheet: 'sha256 0',
    text,
  })

describe('the apps with pictures', () => {
  // The guard holds the scenes of every app with a pictures script, and the
  // release report expects a check of the same apps (collect.mjs asks this
  // too): an app one counted and the other did not would be pictures held
  // by the guard and checked by nobody, or a check nobody expects.
  test('are the apps with a pictures script: in this repository, the demo', () => {
    expect(picturedApps()).toEqual(['demo'])
    expect(picturedApps(join(REPO, 'docs'))).toEqual([])
  })
})

describe('quotations', () => {
  // A mark opened and never closed, or closed twice, would quote a run nobody
  // meant, or none, and the check would hold the caption to the wrong text.
  test('reads every “…” and refuses one left open or closed twice', () => {
    expect(quotations('It says “Not made”, then “Made by”.')).toEqual(['Not made', 'Made by'])
    expect(() => quotations('It says “Not made.')).toThrow(/never closed/)
    expect(() => quotations('It says Not made.” twice.”')).toThrow(/never opened/)
    expect(() => quotations('“a “b” c”')).toThrow(/opened inside another/)
  })
})

describe('the record the demo script writes', () => {
  // The shape captured.json keeps every entry in: a key out of place, or a
  // size taken from the viewport instead of the clip, would be a record
  // the README renders at the wrong width.
  test("is one entry per scene, with the clip as its CSS size and the picture's own bytes and digest", () => {
    const written = entry('demo-form', {
      captured: '2026-10-20',
      settings: SETTINGS,
      clip: { x: 0, y: 316, width: 608, height: 1077 },
      picture: PICTURES['demo-form'],
      look: LOOK,
      data: 'the demo referral',
      stylesheet: 'sha256 0',
      text: FORM,
    })
    expect(Object.keys(written)).toEqual([
      'file',
      'captured',
      'viewport',
      'deviceScaleFactor',
      'locale',
      'timezone',
      'css',
      'bytes',
      'sha256',
      'look',
      'data',
      'stylesheet',
      'text',
    ])
    expect(written).toMatchObject({
      file: 'docs/images/readme/demo-form.webp',
      viewport: { width: 1440, height: 900 },
      css: { width: 608, height: 1077 },
      bytes: 9,
      timezone: 'UTC',
    })
    expect(written.sha256).toBe(digest('demo-form'))
  })

  // A capture that wrote first and checked after would commit a picture its
  // caption misquotes; so would one that wrote a line nobody can decode.
  test('is refused when the caption would quote what the new text does not say', () => {
    expect(() => withEntry({}, SCENES, 'demo-form', taken('demo-form', { Form: '- region "The form":\n  - textbox "Question for the specialist*"' }))).toThrow(
      /demo-form was not written, because its caption or alt would not be true of it:\n {2}demo-form: “Synthetische Fragestellung” is not inside one name or value of what the part Form says/,
    )
    expect(() => withEntry({}, SCENES, 'demo-form', taken('demo-form', { Form: 'region "The form"' }))).toThrow(/line 1 is not an accessibility snapshot line/)
    expect(() => withEntry({}, SCENES, 'demo-gone', taken('demo-gone', FORM))).toThrow(/demo-gone is not a scene of scripts\/pictures\/scenes\.json/)
  })

  // One picture retaken on another machine would sit beside the others in
  // another look; the refusal says how to retake them all.
  test('is refused when it was taken on another look than the record, naming --all', () => {
    const record = { 'demo-refused': taken('demo-refused', REFUSED) }
    const elsewhere = taken('demo-form', FORM, { ...LOOK, chromium: '157.0.0.0' })
    expect(() => withEntry(record, SCENES, 'demo-form', elsewhere)).toThrow(
      'the pictures were taken on win32-x64, Playwright 1.64.1, Chromium 156.0.8078.4, Archivo v25, IBM Plex Mono v20, IBM Plex Sans v23; this machine has win32-x64, Playwright 1.64.1, Chromium 157.0.0.0, Archivo v25, IBM Plex Mono v20, IBM Plex Sans v23; `node scripts/pictures.mjs --all` retakes every picture',
    )
    // On an empty record -- the root runner's --all -- any look is the first.
    expect(Object.keys(withEntry({}, SCENES, 'demo-form', elsewhere))).toEqual(['demo-form'])
  })

  // A retake that gives the same bytes and the same text on the same look
  // changed nothing; a new date on it would put captured.json in `git status`
  // after every retake.
  test('keeps the date of a picture retaken as the same bytes and text, and only then', () => {
    const before = { ...taken('demo-form', FORM), captured: '2026-10-01' }
    const same = taken('demo-form', FORM)
    expect(dated(before, same).captured).toBe('2026-10-01')
    expect(withEntry({ 'demo-form': before }, SCENES, 'demo-form', same)['demo-form'].captured).toBe('2026-10-01')
    expect(dated(before, { ...same, sha256: 'f'.repeat(64) }).captured).toBe('2026-10-20')
    expect(dated(before, { ...same, text: { Form: `${FORM.Form}\n  - button "To the resources"` } }).captured).toBe('2026-10-20')
    expect(dated(before, { ...same, look: { ...LOOK, chromium: '157.0.0.0' } }).captured).toBe('2026-10-20')
    expect(dated(undefined, same)).toBe(same)
  })

  // The record is diffed in every pull request that retakes a picture: in
  // scenes.json's order, so a retake changes its own lines and no others.
  test('keeps scenes.json order and LF only, whichever scene is written first', () => {
    const record = withEntry(withEntry({}, SCENES, 'demo-refused', taken('demo-refused', REFUSED)), SCENES, 'demo-form', taken('demo-form', FORM))
    expect(Object.keys(record)).toEqual(['demo-form', 'demo-refused'])
    const text = serialize(record, SCENES)
    expect(text.endsWith('}\n')).toBe(true)
    expect(text.includes('\r')).toBe(false)
    expect(JSON.parse(text)).toEqual(record)
  })

  // The repository's own scenes, checked as a capture would check them
  // before writing: each caption and alt lists exactly the quotes it has.
  test("holds the repository's scenes to their quotes", () => {
    for (const scene of readScenes()) expect(misquotes(scene, undefined), scene.id).toEqual([])
  })
})

describe('what --check fails with', () => {
  const record = { 'demo-form': taken('demo-form', FORM), 'demo-refused': taken('demo-refused', REFUSED) }
  const all = { 'demo-form': FORM, 'demo-refused': REFUSED }
  const file = (path) => Object.entries(PICTURES).find(([id]) => pictureOf(id) === path)?.[1]
  const check = (changes) =>
    checkProblems({ app: 'demo', scenes: SCENES, record, actIds: Object.keys(all), running: all, playwright: '1.64.1', file, ...changes })

  // A guard on the guards below: the walk as recorded passes.
  test('is nothing when every part says what it said and every picture is its file', () => {
    expect(check({})).toEqual([])
  })

  // An act table emptied, as the demo script hands it over: a check that
  // walked nothing would pass, so "compared no scene" comes first and alone.
  test('is "compared no scene" first, before anything else is looked at', () => {
    expect(check({ actIds: [], running: {} })).toEqual(['demo: compared no scene, so nothing held its pictures'])
  })

  // The same sentence from the walk's side: with every scene paired with its
  // act, a walk that read no scene's text would otherwise find nothing to
  // differ and pass.
  test('is "compared no scene" when the walk read nothing, though every scene has its act', () => {
    expect(check({ running: {} })).toEqual(['demo: compared no scene, so nothing held its pictures'])
  })

  // A picture nothing walks is held by nothing, and an act nothing records
  // compares nothing.
  test('is a scene with no act, and an act with no scene', () => {
    expect(check({ actIds: ['demo-form', 'demo-refusd'], running: { 'demo-form': FORM } })).toEqual([
      'demo: the scene demo-refused has no act, so its picture is held by nothing',
      'demo: the act demo-refusd is no scene of scripts/pictures/scenes.json',
    ])
  })

  // The same pairing, asked before the walk: an act renamed from its scene
  // would otherwise be walked with no scene to be held to.
  test('pairs scenes and acts before any walk, after an empty act table', () => {
    expect(pairingProblems({ app: 'demo', scenes: SCENES, actIds: [] })).toEqual(['demo: compared no scene, so nothing held its pictures'])
    expect(pairingProblems({ app: 'demo', scenes: SCENES, actIds: ['demo-form', 'demo-refused'] })).toEqual([])
  })

  // What a changed sentence in the demo reaches the check as: the diff and
  // both Playwright versions say whether the page changed or the snapshot
  // format did -- and the caption that quoted the old sentence is said too.
  // Watched failing with the refusal's maker renamed in the running text.
  test('is each part whose text changed, with a line diff and both Playwright versions, and the quote it broke', () => {
    const running = {
      ...all,
      'demo-refused': { Response: '- region "The answers, as a QuestionnaireResponse":\n  - paragraph: "Refused by @formancy/health-ch:"' },
    }
    expect(check({ running, playwright: '1.65.0' })).toEqual([
      'demo-refused, part Response: the page now says something else than its picture (recorded with Playwright 1.64.1, running 1.65.0); `node scripts/pictures.mjs --scene demo-refused` retakes it\n    -   - paragraph: "Refused by @formancy/health-questionnaire:"\n    +   - paragraph: "Refused by @formancy/health-ch:"',
      'demo-refused: “Refused by @formancy/health-questionnaire:” is not inside one name or value of what the part Response says, so the caption quotes what its picture does not show',
    ])
  })

  // A part added to or dropped from an act changes what the picture is of.
  test('is a part the record or the walk does not have', () => {
    const running = { ...all, 'demo-refused': { ...REFUSED, Document: '- region "The referral, as a CH ORF document"' } }
    expect(check({ running })).toEqual(['demo-refused: the part Document is not in the record'])
  })

  // A picture deleted, or replaced by hand, with the page unchanged: the
  // text alone would pass, and the README would show nothing, or something
  // no capture took. Watched failing with the file reader returning nothing.
  test("is a picture missing, and a picture that is not its record's", () => {
    expect(check({ file: (path) => (path === pictureOf('demo-form') ? undefined : file(path)) })).toEqual([
      'docs/images/readme/demo-form.webp does not exist, and its record says it was taken',
    ])
    expect(check({ file: (path) => (path === pictureOf('demo-form') ? Buffer.from('another') : file(path)) })).toEqual([
      'docs/images/readme/demo-form.webp is not the picture its record describes: it was changed by hand, or the record was',
    ])
  })
})

describe('lineDiff', () => {
  // The diff a failing check prints: lines kept are left out, so the change is what is read.
  test('lists the recorded lines removed and the running lines added, in order', () => {
    expect(lineDiff('a\nb\nc', 'a\nx\nc\nd')).toEqual(['- b', '+ x', '+ d'])
    expect(lineDiff('a', 'a')).toEqual([])
  })
})

describe('the stylesheet notice', () => {
  // A change of style alone leaves every text equal; without the notice
  // nothing would say the pictures may no longer look like the page.
  test('names the scenes whose recorded stylesheet differs, and only those', () => {
    const record = { 'demo-form': taken('demo-form', FORM), 'demo-refused': { ...taken('demo-refused', REFUSED), stylesheet: 'sha256 1' } }
    expect(stylesheetNotices({ app: 'demo', scenes: SCENES, record, stylesheet: 'sha256 1' })).toEqual([
      "demo's stylesheets changed since demo-form was taken; the text check cannot see what that did to the pictures, so look at them, and `node scripts/pictures.mjs --scene <id>` retakes one",
    ])
    expect(stylesheetNotices({ app: 'other', scenes: SCENES, record, stylesheet: 'sha256 1' })).toEqual([])
  })

  // Under Actions the notice must reach the run's page: as an annotation,
  // and in the step summary.
  test('is printed, and under GitHub Actions also annotated and written to the step summary', () => {
    const printed = []
    const appended = []
    announce(['a notice, 100% true'], { env: {}, print: (line) => printed.push(line), append: (...args) => appended.push(args) })
    expect(printed).toEqual(['notice: a notice, 100% true'])
    expect(appended).toEqual([])
    printed.length = 0
    announce(['a notice, 100% true'], {
      env: { GITHUB_ACTIONS: 'true', GITHUB_STEP_SUMMARY: '/summary' },
      print: (line) => printed.push(line),
      append: (...args) => appended.push(args),
    })
    expect(printed).toEqual(['notice: a notice, 100% true', '::warning title=README pictures::a notice, 100%25 true'])
    expect(appended).toEqual([['/summary', '> **README pictures:** a notice, 100% true\n\n']])
  })
})

describe('outsideRepository', () => {
  // Decoded PNGs inside the working tree are one `git add -A` from being
  // committed beside the WebPs.
  test('refuses a review directory inside the repository, and gives back one outside it absolute', () => {
    expect(() => outsideRepository(join(REPO, 'x'))).toThrow(/is inside the repository \(x\)/)
    expect(() => outsideRepository('.', REPO)).toThrow(/is inside the repository \(\.\)/)
    expect(() => outsideRepository('docs/review', REPO)).toThrow(/is inside the repository \(docs\/review\)/)
    expect(outsideRepository('../review', REPO)).toBe(join(REPO, '..', 'review'))
    // A directory whose name starts with two dots is still inside.
    expect(() => outsideRepository(join(REPO, '..x'), REPO)).toThrow(/is inside the repository \(\.\.x\)/)
  })
})
