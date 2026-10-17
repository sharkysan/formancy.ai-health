import { existsSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { describe, expect, test } from 'vitest'
import { corpus } from './corpus.mjs'
import { intake, intakeContext, minimal, minimalContext } from './forms.mjs'

/**
 * The validator gate's corpus holds every construct version 1 maps (0006):
 * H04's acceptance is that each produces a Questionnaire the validator
 * accepts, so a field type, an item type or a rule the package maps and
 * no corpus form uses is a mapping the gate never judged.
 *
 * Derived from the package as built, never listed here: each of
 * `@formancy/spec`'s field types and rule kinds is offered to
 * `toQuestionnaire` in a form of one field, and what it exports is what
 * the corpus must hold. A type the package starts to map fails this until
 * a corpus form uses it. It reads `packages/*\/dist`, so it needs
 * `pnpm build`, which the `verify` job runs before `pnpm test:repo`.
 */
const repo = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const QUESTIONNAIRE = join(repo, 'packages', 'health-questionnaire', 'dist', 'index.mjs')
const CORE = join(repo, 'packages', 'health-core', 'dist', 'index.mjs')

if (!existsSync(QUESTIONNAIRE) || !existsSync(CORE)) throw new Error('scripts/validator/corpus.test.mjs reads the packages as built: run pnpm build first')
const { toQuestionnaire } = await import(pathToFileURL(QUESTIONNAIRE).href)
const core = await import(pathToFileURL(CORE).href)
// @formancy/spec as health-questionnaire resolves it: the version it maps.
const fromQuestionnaire = createRequire(join(repo, 'packages', 'health-questionnaire', 'package.json'))
const { FIELD_TYPES, RULE_KINDS } = await import(pathToFileURL(fromQuestionnaire.resolve('@formancy/spec')).href)

const HOST = { base: 'https://forms.synthetic.invalid', status: 'draft' }
const OPTIONS = [{ value: 'a', label: 'A' }, { value: 'b', label: 'B' }]

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
const mappedItemTypes = new Set([...FIELD_TYPES, 'number'].flatMap((type) => [oneField(type), oneField(type, { step: 1 })]).flatMap((form) => {
  const result = exported(form)
  return result.ok ? [...itemTypes(result.questionnaire.item)] : []
}))
const forms = [intake, minimal]

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
    const written = new Set([exported(intake, intakeContext), exported(minimal, minimalContext)].flatMap((result) => (result.ok ? [...itemTypes(result.questionnaire.item)] : [])))
    expect([...mappedItemTypes].filter((type) => !written.has(type))).toEqual([])
  })

  // A rule kind is mapped when a form whose one rule is of that kind, on a
  // field it can apply to, is exported.
  test('holds every rule kind the package maps', () => {
    const probe = (kind) => {
      const fields = [{ key: 'flag', type: 'checkbox' }, { key: 'step', type: 'page', fields: [{ key: 'only', type: 'text' }] }]
      const rule = { target: kind === 'skip' ? 'step' : 'only', kind, ...(kind === 'check' ? { check: 'probe' } : { cel: 'flag == true' }), ...(kind === 'validate' ? { code: 'probe' } : {}) }
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
    const comparisons = literals.flatMap((literal) => [...['==', '!=', '<', '<=', '>', '>='].map((operator) => `only ${operator} ${literal}`), `${literal} in only`])
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
    const written = new Set([exported(intake, intakeContext), exported(minimal, minimalContext)].flatMap((result) => (result.ok ? [...writes(result.questionnaire)] : [])))
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

  // Every Questionnaire the gate is told is the package's is the
  // package's: made by toQuestionnaire, never typed into the corpus.
  test('is made by the package, which accepts every form of it', () => {
    const entries = corpus({ core, questionnaire: { toQuestionnaire } })
    expect(entries.filter((entry) => entry.file === 'questionnaire-referral-intake.json')[0]?.resource).toEqual(exported(intake, intakeContext).questionnaire)
    expect(entries.filter((entry) => entry.file === 'questionnaire-minimal-v1.json')[0]?.resource).toEqual(exported(minimal, minimalContext).questionnaire)
  })
})
