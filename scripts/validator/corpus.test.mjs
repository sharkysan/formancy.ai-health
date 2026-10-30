import { existsSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { describe, expect, test } from 'vitest'
import { chOrfContext, chOrfDocument } from './ch-orf.mjs'
import { corpus, documentResponse } from './corpus.mjs'
import { DEMO_NAMES, demoChOrfContext, demoReferral, demoReferralAnswers, demoReferralContext, demoResponseContext } from './demo-referral.mjs'
import {
  intake,
  intakeContext,
  intakeResponseContext,
  intakeRoutine,
  intakeUrgent,
  minimal,
  minimalAnswers,
  minimalContext,
  minimalResponseContext,
} from './forms.mjs'

/**
 * The validator gate's corpus holds every construct version 1 maps (0006)
 * and every answer the package writes (0007): H04's acceptance is that
 * each produces a Questionnaire the validator accepts, and H05's that the
 * answers of every mapped type are validated, so a field type, an item
 * type, a rule or an answer type the package writes and no corpus form or
 * submission holds is a mapping the gate never judged.
 *
 * Derived from the package as built, never listed here: each of
 * `@formancy/spec`'s field types and rule kinds is offered to
 * `toQuestionnaire` in a form of one field, and what it exports is what
 * the corpus must hold. A type the package starts to map fails this until
 * a corpus form uses it. And every resource type a package writes, each
 * export's resources derived from the export itself, and the two places
 * health-document puts a PDF's bytes, must stand in a resource the gate
 * accepts (0008), the CH ORF document's among them (0009). It reads
 * `packages/*\/dist`, so it needs `pnpm build`, which the `verify` job
 * runs before `pnpm test:repo`.
 */
const repo = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const built = (name) => join(repo, 'packages', name, 'dist', 'index.mjs')
const QUESTIONNAIRE = built('health-questionnaire')
const CORE = built('health-core')
const DOCUMENT = built('health-document')
const CORPUS = built('health-corpus')
const CH = built('health-ch')

if (![QUESTIONNAIRE, CORE, DOCUMENT, CORPUS, CH].every((path) => existsSync(path)))
  throw new Error('scripts/validator/corpus.test.mjs reads the packages as built: run pnpm build first')
const questionnairePackage = await import(pathToFileURL(QUESTIONNAIRE).href)
const { toQuestionnaire, toQuestionnaireResponse } = questionnairePackage
const core = await import(pathToFileURL(CORE).href)
const documentPackage = await import(pathToFileURL(DOCUMENT).href)
const documents = await import(pathToFileURL(CORPUS).href)
const ch = await import(pathToFileURL(CH).href)
const pdf = await documents.renderReferral()
// @formancy/spec as health-questionnaire resolves it: the version it maps.
const fromQuestionnaire = createRequire(join(repo, 'packages', 'health-questionnaire', 'package.json'))
const { FIELD_TYPES, RULE_KINDS } = await import(pathToFileURL(fromQuestionnaire.resolve('@formancy/spec')).href)

const HOST = { base: 'https://forms.synthetic.invalid', status: 'draft' }
const OPTIONS = [
  { value: 'a', label: 'A' },
  { value: 'b', label: 'B' },
]

/** A form of one field of `type`, with what formancy's validator asks of that type. */
function oneField(type, more = {}) {
  const field = { key: 'only', type, label: 'Only', ...more }
  if (['select', 'radio', 'selectboxes', 'ranking', 'matrix'].includes(type)) field.options = OPTIONS
  if (type === 'matrix') field.rows = [{ value: 'r', label: 'R' }]
  if (['group', 'page', 'repeater'].includes(type)) field.fields = [{ key: 'inner', type: 'text' }]
  return { specVersion: '4', id: 'probe', title: 'Probe', model: { fields: [field] } }
}

/** Every item type a Questionnaire holds, nested ones included. */
function itemTypes(items = [], into = new Set()) {
  for (const item of items) {
    into.add(item.type)
    itemTypes(item.item, into)
  }
  return into
}

/** Every field type a form holds, nested ones included. */
function fieldTypes(fields, into = new Set()) {
  for (const field of fields) {
    into.add(field.type)
    fieldTypes(field.fields ?? [], into)
  }
  return into
}

const exported = (form, context = HOST) => toQuestionnaire(form, context)
const mappedFieldTypes = FIELD_TYPES.filter((type) => exported(oneField(type)).ok)
const mappedItemTypes = new Set(
  [...FIELD_TYPES, 'number']
    .flatMap((type) => [oneField(type), oneField(type, { step: 1 })])
    .flatMap((form) => {
      const result = exported(form)
      return result.ok ? [...itemTypes(result.questionnaire.item)] : []
    }),
)
const forms = [intake, minimal, demoReferral]

/** The response `toQuestionnaireResponse` makes of `answers` to `form`; fails the suite when it refuses a corpus submission. */
function answered(form, answers, context) {
  const result = toQuestionnaireResponse(form, answers, context)
  if (!result.ok) throw new Error(`the package refused a corpus submission: ${result.refusals.map((refusal) => refusal.message).join('; ')}`)
  return result.questionnaireResponse
}

/** The package's responses to the corpus's submissions, by the file the gate writes each to. */
const responses = [
  ['questionnaireresponse-referral-intake-urgent.json', answered(intake, intakeUrgent, intakeResponseContext)],
  ['questionnaireresponse-referral-intake-routine.json', answered(intake, intakeRoutine, intakeResponseContext)],
  ['questionnaireresponse-minimal-v1.json', answered(minimal, minimalAnswers, minimalResponseContext)],
]

/** What a response's items hold: each answer's value[x], a group's nested items, and a repeating group's repeated ones. */
function answerShapes(items = [], into = new Set()) {
  const seen = new Set()
  for (const item of items) {
    for (const answer of item.answer ?? []) for (const name of Object.keys(answer)) if (name.startsWith('value')) into.add(name)
    if (item.item !== undefined) into.add('nested items')
    if (seen.has(item.linkId)) into.add('repeated items')
    seen.add(item.linkId)
    answerShapes(item.item, into)
  }
  return into
}

describe('the corpus of the validator gate', () => {
  // A guard on the guard: derived sets that came back empty would be held
  // by any corpus at all.
  test('derives what the package maps from the package', () => {
    expect(mappedFieldTypes).toContain('text')
    expect(mappedFieldTypes).toContain('repeater')
    expect(mappedFieldTypes).not.toContain('signature')
    expect([...mappedItemTypes]).toEqual(expect.arrayContaining(['integer', 'decimal', 'display', 'group']))
  })

  test('holds every field type the package maps', () => {
    const used = new Set(forms.flatMap((form) => [...fieldTypes(form.model.fields)]))
    expect(mappedFieldTypes.filter((type) => !used.has(type))).toEqual([])
  })

  test('holds every item type the package writes, in the Questionnaires the gate judges', () => {
    const written = new Set(
      [exported(intake, intakeContext), exported(minimal, minimalContext)].flatMap((result) => (result.ok ? [...itemTypes(result.questionnaire.item)] : [])),
    )
    expect([...mappedItemTypes].filter((type) => !written.has(type))).toEqual([])
  })

  // A rule kind is mapped when a form whose one rule is of that kind, on a
  // field it can apply to, is exported.
  test('holds every rule kind the package maps', () => {
    const probe = (kind) => {
      const fields = [
        { key: 'flag', type: 'checkbox' },
        { key: 'step', type: 'page', fields: [{ key: 'only', type: 'text' }] },
      ]
      const rule = {
        target: kind === 'skip' ? 'step' : 'only',
        kind,
        ...(kind === 'check' ? { check: 'probe' } : { cel: 'flag == true' }),
        ...(kind === 'validate' ? { code: 'probe' } : {}),
      }
      return exported({ specVersion: '4', id: 'probe', title: 'Probe', model: { fields }, logic: { rules: [rule] } }).ok
    }
    const mapped = RULE_KINDS.filter(probe)
    expect(mapped).toContain('visible')
    const used = new Set(forms.flatMap((form) => (form.logic?.rules ?? []).map((rule) => rule.kind)))
    expect(mapped.filter((kind) => !used.has(kind))).toEqual([])
  })

  // An enableWhen is judged by the validator as what it is: an operator,
  // and an answer of its question's type, which que-7 and the validator's
  // own checks of a question's type read. Derived from the package, never
  // listed: every literal of a pool, with every operator, is offered to
  // each field type the package maps, as the question of a visibility
  // rule, and whatever operators and answer[x] it writes the corpus must
  // hold. The pool is only what is offered; what is written is the
  // package's.
  test('holds every enableWhen operator and answer type the package writes', () => {
    const literals = ['true', '1', '1.5', "'a'", "'2000-01-01'", "'09:30'", "'2026-01-01T00:00:00Z'"]
    const comparisons = literals.flatMap((literal) => [
      ...['==', '!=', '<', '<=', '>', '>='].map((operator) => `only ${operator} ${literal}`),
      `${literal} in only`,
    ])
    const shapes = [...new Set(mappedFieldTypes)].flatMap((type) => [oneField(type), oneField(type, { step: 1 })])
    const writes = (questionnaire) => {
      const found = new Set()
      const walk = (items = []) => {
        for (const item of items) {
          for (const condition of item.enableWhen ?? []) {
            found.add(`operator ${condition.operator}`)
            for (const name of Object.keys(condition)) if (name.startsWith('answer')) found.add(name)
          }
          walk(item.item)
        }
      }
      walk(questionnaire.item)
      return found
    }
    const derived = new Set(
      shapes.flatMap((shape) =>
        comparisons.flatMap((cel) => {
          const fields = [...shape.model.fields, { key: 'shown', type: 'text' }]
          const result = exported({ ...shape, model: { fields }, logic: { rules: [{ target: 'shown', kind: 'visible', cel }] } })
          return result.ok ? [...writes(result.questionnaire)] : []
        }),
      ),
    )
    // A guard on the guard: a derivation that read nothing would be held by any corpus.
    expect([...derived]).toEqual(expect.arrayContaining(['operator =', 'operator exists', 'answerCoding', 'answerInteger']))
    const written = new Set(
      [exported(intake, intakeContext), exported(minimal, minimalContext)].flatMap((result) => (result.ok ? [...writes(result.questionnaire)] : [])),
    )
    expect([...derived].filter((found) => !written.has(found)).sort()).toEqual([])
  })

  // The acceptance asks for de-CH, fr and it: the intake carries each,
  // as its language or a translation, on every text.
  test('holds a form translated into every language its context asks for', () => {
    const result = exported(intake, intakeContext)
    expect(result.ok).toBe(true)
    const written = core.writeJson(result.questionnaire)
    expect(result.questionnaire.language).toBe('de-CH')
    for (const language of ['fr', 'it']) expect(written).toContain(`{"url":"lang","valueCode":"${language}"}`)
  })

  // Every Questionnaire and response the gate is told is the package's is
  // the package's: made by toQuestionnaire and toQuestionnaireResponse,
  // never typed into the corpus.
  test('is made by the package, which accepts every form and submission of it', () => {
    const entries = corpus({ core, questionnaire: questionnairePackage, documents, pdf, ch })
    const resource = (file) => entries.filter((entry) => entry.file === file)[0]?.resource
    expect(resource('questionnaire-referral-intake.json')).toEqual(exported(intake, intakeContext).questionnaire)
    expect(resource('questionnaire-minimal-v1.json')).toEqual(exported(minimal, minimalContext).questionnaire)
    for (const [file, made] of responses) expect(resource(file)).toEqual(made)
  })

  // Every document the gate is told is the package's is health-document's,
  // made of the PDF Report rendered: never typed into the corpus.
  test('holds documents health-document made of the PDF Report rendered', () => {
    const entries = corpus({ core, questionnaire: questionnairePackage, documents, pdf, ch })
    const resource = (file) => entries.filter((entry) => entry.file === file)[0]?.resource
    const made = (document) => {
      const result = documents.referralDocument(document)
      return result.ok ? result.bundle : result.refusals.map((refusal) => refusal.message)
    }
    expect(resource('bundle-document-pdf-as-data.json')).toEqual(made({ pdf, placement: 'data' }))
    expect(resource('bundle-document-pdf-in-binary.json')).toEqual(made({ pdf, placement: 'binary' }))
    const response = documentResponse(toQuestionnaireResponse, documents.NAMES)
    expect(resource('bundle-document-with-questionnaireresponse.json')).toEqual(made({ pdf, placement: 'data', response }))
  })

  // The CH ORF document the gate is told is the package's is health-ch's,
  // made of the synthetic referral, with the answers health-questionnaire
  // made of the intake: never typed into the corpus.
  test('holds the CH ORF document health-ch made of the synthetic referral', () => {
    const entries = corpus({ core, questionnaire: questionnairePackage, documents, pdf, ch })
    const resource = (file) => entries.filter((entry) => entry.file === file)[0]?.resource
    const result = ch.toChOrfDocument(chOrfContext(questionnairePackage, ch))
    expect(result.ok).toBe(true)
    expect(resource('bundle-ch-orf-referral.json')).toEqual(result.bundle)
    expect(resource('bundle-ch-orf-referral.json')).toEqual(chOrfDocument(questionnairePackage, ch))
  })

  // What the demo shows before anything is changed is what the gate
  // judged (0012): the demo's Questionnaire, response and CH ORF document
  // are the packages', made of the demo's referral, never typed into the
  // corpus; and the response the gate judges alone is the one its CH ORF
  // document carries, so the page's response and its document show one
  // resource, judged twice.
  test("holds the demo's Questionnaire, response and CH ORF document as the packages made them of its referral", () => {
    const entries = corpus({ core, questionnaire: questionnairePackage, documents, pdf, ch })
    const resource = (file) => entries.filter((entry) => entry.file === file)[0]?.resource
    expect(resource('questionnaire-demo-referral.json')).toEqual(exported(demoReferral, demoReferralContext).questionnaire)
    const response = answered(demoReferral, demoReferralAnswers, { ...demoResponseContext, profiles: [ch.PROFILES.questionnaireResponse] })
    expect(resource('questionnaireresponse-demo-referral.json')).toEqual(response)
    const document = ch.toChOrfDocument({ ...demoChOrfContext, response: { fullUrl: DEMO_NAMES.response, questionnaireResponse: response } })
    expect(document.ok).toBe(true)
    expect(resource('bundle-ch-orf-demo-referral.json')).toEqual(document.bundle)
    const carried = resource('bundle-ch-orf-demo-referral.json').entry.find((entry) => entry.fullUrl === DEMO_NAMES.response)?.resource
    expect(core.writeJson(carried)).toBe(core.writeJson(resource('questionnaireresponse-demo-referral.json')))
  })

  // The demo shows its form in the languages of its catalogues, and the
  // Questionnaire carries the languages its host asks for: were the two
  // to part, the page would offer a language the Questionnaire it shows
  // beside the form is not in, or leave out one it is.
  test("holds the demo's form in exactly the languages its host publishes it in, its default first", () => {
    expect(Object.keys(demoReferral.i18n.messages)).toEqual(demoReferralContext.languages)
    expect(demoReferral.i18n.defaultLocale).toBe(demoReferralContext.languages[0])
    const written = core.writeJson(exported(demoReferral, demoReferralContext).questionnaire)
    for (const language of demoReferralContext.languages.slice(1)) expect(written).toContain(`{"url":"lang","valueCode":"${language}"}`)
  })

  // A response is judged by the validator as what it holds: an answer of
  // each type its item has, a group's nested items, a repeating group's
  // repeated ones. Derived from the package, never listed: a pool of
  // values is offered as the answer to every field type the package maps,
  // and whatever value[x] and structure it writes, the corpus's responses
  // must hold. The pool is only what is offered; what is written is the
  // package's, and a type it starts to write fails this until a corpus
  // submission answers it.
  test('holds every answer type and structure the package writes, in the responses the gate judges', () => {
    const pool = [
      'a',
      'b',
      1,
      2.5,
      true,
      false,
      '2000-01-01',
      '09:30',
      '2026-01-01T00:00:00Z',
      ['a'],
      ['a', 'b'],
      { inner: 'x' },
      [{ inner: 'x' }],
      [{ inner: 'x' }, { inner: 'y' }],
    ]
    const context = { questionnaire: HOST, status: 'in-progress', authored: '2026-10-17' }
    const shapes = [...new Set(mappedFieldTypes)].flatMap((type) => [oneField(type), oneField(type, { step: 1 })])
    const derived = new Set(
      shapes.flatMap((form) =>
        pool.flatMap((value) =>
          // A page's field answers beside it, at the top; any other's under its key.
          [{ only: value }, { inner: value }].flatMap((answers) => {
            const result = toQuestionnaireResponse(form, answers, context)
            return result.ok ? [...answerShapes(result.questionnaireResponse.item)] : []
          }),
        ),
      ),
    )
    // A guard on the guard: a derivation that wrote nothing would be held by any corpus.
    expect([...derived]).toEqual(expect.arrayContaining(['valueCoding', 'valueInteger', 'valueTime', 'nested items', 'repeated items']))
    const written = new Set(responses.flatMap(([, made]) => [...answerShapes(made.item)]))
    expect([...derived].filter((shape) => !written.has(shape)).sort()).toEqual([])
  })
})

/** Every resource type `value` holds, a Bundle's entries' included. */
function resourceTypes(value, into = new Set()) {
  if (Array.isArray(value)) for (const each of value) resourceTypes(each, into)
  else if (typeof value === 'object' && value !== null) {
    if (typeof value.resourceType === 'string') into.add(value.resourceType)
    for (const each of Object.values(value)) resourceTypes(each, into)
  }
  return into
}

/** Where a DocumentReference holds its PDF's bytes, for every one `value` holds: `data`, or `url` to a Binary. */
function placements(value, into = new Set()) {
  if (Array.isArray(value)) for (const each of value) placements(each, into)
  else if (typeof value === 'object' && value !== null) {
    if (value.resourceType === 'DocumentReference')
      for (const { attachment } of value.content) for (const name of ['data', 'url']) if (attachment[name] !== undefined) into.add(name)
    for (const each of Object.values(value)) placements(each, into)
  }
  return into
}

/**
 * Each export of each package, with the resources it writes when offered
 * what the corpus offers it: its forms, its submissions, the PDF Report
 * rendered in each place health-document puts one. An export no probe
 * offers anything fails the suite, so a new one cannot write a resource
 * type nobody asked about.
 */
const smallestPdf = new Uint8Array([...'%PDF-1.4\n%%EOF\n'].map((character) => character.charCodeAt(0)))
const PROBES = {
  toQuestionnaire: () => [exported(oneField('text')).questionnaire],
  toQuestionnaireResponse: () => [
    toQuestionnaireResponse(oneField('text'), { only: 'a' }, { questionnaire: HOST, status: 'in-progress', authored: '2026-10-17' }).questionnaireResponse,
  ],
  toDocumentReference: () =>
    ['data', 'binary'].flatMap((placement) => {
      const result = documentPackage.toDocumentReference({ bytes: smallestPdf, profile: 'PDF' }, documents.referralContext(placement))
      return result.ok ? [result.documentReference, ...(result.binary === undefined ? [] : [result.binary])] : []
    }),
  // The Bundle and the Composition are what it writes; the host's
  // entries in it are the host's, and are not counted as its.
  toDocumentBundle: () =>
    ['data', 'binary'].flatMap((placement) => {
      const result = documentPackage.toDocumentBundle(documents.referralDocumentContext({ pdf: smallestPdf, placement }))
      return result.ok ? [{ ...result.bundle, entry: [result.bundle.entry[0]] }] : []
    }),
  // The Bundle, its Composition and the people and orders it writes; the
  // answers in it are the host's, and are not counted as its.
  toChOrfDocument: () => {
    const result = ch.toChOrfDocument(chOrfContext(questionnairePackage, ch))
    return result.ok ? [{ ...result.bundle, entry: result.bundle.entry.filter((entry) => entry.resource.resourceType !== 'QuestionnaireResponse') }] : []
  },
}

describe('the resources of the validator gate', () => {
  const exportsOf = (module) =>
    Object.entries(module)
      .filter(([name, value]) => typeof value === 'function' && /^to[A-Z]/.test(name))
      .map(([name]) => name)

  // A guard on the guard: an export the probes do not know writes
  // resources nobody derived, and a probe that names no export probes
  // nothing.
  test('probe every export of the packages that writes a resource', () => {
    expect([...exportsOf(questionnairePackage), ...exportsOf(documentPackage), ...exportsOf(ch)].sort()).toEqual(Object.keys(PROBES).sort())
  })

  // Every resource type a package writes stands in a resource the gate
  // accepts: one the packages started to write -- a Provenance, an MHD
  // List -- fails here until the corpus holds it, and one the corpus
  // stopped holding fails here until it does again.
  test('hold every resource type the packages write, in resources the gate must accept', () => {
    const written = new Set(Object.values(PROBES).flatMap((probe) => [...resourceTypes(probe())]))
    expect([...written].sort()).toEqual([
      'Binary',
      'Bundle',
      'Composition',
      'DocumentReference',
      'Organization',
      'Patient',
      'Practitioner',
      'PractitionerRole',
      'Questionnaire',
      'QuestionnaireResponse',
      'ServiceRequest',
    ])
    const accepted = corpus({ core, questionnaire: questionnairePackage, documents, pdf, ch }).filter((entry) => entry.expect === 'accepted')
    const held = new Set(accepted.flatMap((entry) => [...resourceTypes(entry.resource)]))
    expect([...written].filter((type) => !held.has(type)).sort()).toEqual([])
  })

  // The acceptance asks for the PDF attached, and health-document puts its
  // bytes in two places: each must stand in a document the gate accepts.
  test('hold the PDF in every place health-document puts it, in documents the gate must accept', () => {
    const written = placements(PROBES.toDocumentReference())
    expect([...written].sort()).toEqual(['data', 'url'])
    const accepted = corpus({ core, questionnaire: questionnairePackage, documents, pdf, ch }).filter((entry) => entry.expect === 'accepted')
    const held = placements(accepted.map((entry) => entry.resource))
    expect([...written].filter((place) => !held.has(place))).toEqual([])
  })
})
