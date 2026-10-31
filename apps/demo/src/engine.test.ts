import { createFormEngine } from '@formancy/core'
import { FormancyForm, FormancyProvider } from '@formancy/react'
import { FIELD_TYPES, WIDGETS_BY_FIELD_TYPE, type FormSchema } from '@formancy/spec'
import { cleanup, render } from '@testing-library/react'
import { createElement } from 'react'
import { afterEach, describe, expect, test } from 'vitest'
import { sampleOf } from './build/plugin.js'
import { engineFor, FIXED_CAPABILITIES, targetOf } from './engine.js'
import { LANGUAGES } from './words/index.js'

/**
 * formancy 0.6.0's engine over the demo's form, as the page builds it: what
 * it needs to start, and what it holds of the sample. The corpus's response
 * is made of the sample's answers as written in demo-referral.mjs; the page
 * makes its own of what the engine holds of them, so the two must be one.
 */
const sample = sampleOf()

afterEach(cleanup)

describe("the demo's engine", () => {
  // createFormEngine refuses a form with logic rules and no capability
  // source; without the page's fixed one, the demo's one rule stops the
  // page before it draws anything.
  test('starts only with a capability source, which the page gives it fixed', () => {
    expect(() => createFormEngine({ schema: sample.form, locale: 'en', initialValue: sample.answers })).toThrow(/capabilities/)
    expect(() => engineFor(sample.form, 'en', sample.answers)).not.toThrow()
    expect([FIXED_CAPABILITIES.now(), FIXED_CAPABILITIES.today(), FIXED_CAPABILITIES.random()]).toEqual([1_792_224_000_000, '2026-10-17', 0])
  })

  // Measured with formancy 0.5.0 on 17 October 2026, and with 0.6.0, whose
  // engine replaces a value handed in for a computed field with its rule's
  // and clears the fields of a group a rule hides (the demo's form has no
  // computed field and no group), on 19 October: the engine hands back the
  // sample's answers unchanged in every language. An engine that
  // normalised one -- a date, the hidden field -- would make the page's
  // first response other bytes than the corpus's.
  test("holds the sample's answers as written, in every language", () => {
    for (const language of LANGUAGES) expect(engineFor(sample.form, language, sample.answers).value()).toStrictEqual(sample.answers)
  })

  // The one rule: the interpreter's language shows while the box is
  // ticked, and its answer goes when the field does, so a response never
  // answers a question its own answers disable.
  test('drops the language to interpret when no interpreter is needed', () => {
    const engine = engineFor(sample.form, 'en', sample.answers)
    engine.setValue(['interpreter'], false)
    expect(engine.value()).not.toHaveProperty('interpreter_language')
  })
})

describe("the way from the Questionnaire's read-out to a field", () => {
  // An item's linkId is its field's key (0006), and the read-out leads to
  // the control formancy's renderer drew for it, by the id formancy's
  // engine mints: a way that led to another field, or to one the form does
  // not show, would leave the keyboard somewhere the visitor did not ask.
  test("is the control the engine names for the item's key, and whether the form shows it", () => {
    const engine = engineFor(sample.form, 'en', sample.answers)
    expect(targetOf(engine, 'question')).toEqual({ id: engine.getFieldSnapshot(['question']).ids.control, shown: true })
    expect(targetOf(engine, 'interpreter_language')).toEqual({ id: engine.getFieldSnapshot(['interpreter_language']).ids.control, shown: true })
    engine.setValue(['interpreter'], false)
    expect(targetOf(engine, 'interpreter_language')?.shown).toBe(false)
    expect(targetOf(engine, 'no_such_key')).toBeUndefined()
  })

  // A key twice in a form -- one under each of two groups -- names two
  // fields, and a linkId would lead to one of them by a guess.
  test('is none where two fields have the key', () => {
    const twice = {
      specVersion: '4',
      id: 'twice',
      model: { fields: ['first', 'second'].map((key) => ({ key, type: 'group', fields: [{ key: 'name', type: 'text' }] })) },
    } as unknown as FormSchema
    expect(targetOf(engineFor(twice, 'en', {}), 'name')).toBeUndefined()
  })

  // A linkId is a key wherever its field stands, and a way leads to the
  // one field it names: under a group, the field's own; in a repeater's
  // rows, one field per row, and no one of them the item's.
  test("is the key's one field under a group, and none in a repeater's rows", () => {
    const nested = {
      specVersion: '4',
      id: 'nested',
      model: {
        fields: [
          { key: 'about', type: 'group', label: 'About', fields: [{ key: 'name', type: 'text', label: 'Name' }] },
          { key: 'rows', type: 'repeater', label: 'Rows', fields: [{ key: 'note', type: 'text', label: 'Note' }] },
        ],
      },
    } as unknown as FormSchema
    const engine = engineFor(nested, 'en', { rows: [{ note: 'x' }] })
    expect(targetOf(engine, 'name')).toEqual({ id: engine.getFieldSnapshot(['about', 'name']).ids.control, shown: true })
    expect(targetOf(engine, 'note')).toBeUndefined()
  })

  // Read from the DOM, which is what is measured: for every field type
  // formancy 0.6.0's spec has, containers included, and every widget,
  // whether its React renderer draws an element of the engine's id that
  // takes the keyboard. A radio group's options take ids of the renderer's
  // own making and its fieldset none (read in its RadioGroupField on 18
  // October 2026), and a ranking's or a matrix's fieldset has the id and
  // takes no focus, so a way to one would lead nowhere or be a guess at an
  // id nothing documents; a container is no field of the engine's
  // `fieldPaths`, and its key has no way. A type the renderer starts or
  // stops drawing so fails here, and the way follows. Read with `:` in the
  // form's key, as the engine joins an id, so each case's id is its own.
  test("leads only to a field type and widget the renderer draws a control of the engine's id for, which takes the keyboard", () => {
    const options = [
      { value: 'a', label: 'A' },
      { value: 'b', label: 'B' },
    ]
    const cases = [
      ...FIELD_TYPES.map((type) => ({ type, widget: undefined })),
      ...Object.entries(WIDGETS_BY_FIELD_TYPE).flatMap(([type, widgets]) => widgets.map((widget) => ({ type, widget }))),
    ]
    const takes = cases.flatMap(({ type, widget }) => {
      const kind = widget === undefined ? type : `${type}/${widget}`
      const inner = { key: 'inner', type: 'text', label: 'Inner' }
      const field = {
        key: 'field',
        type,
        label: kind,
        ...(widget === undefined ? {} : { widget }),
        options,
        rows: type === 'matrix' ? [{ value: 'r', label: 'R' }] : undefined,
        fields: ['group', 'page', 'repeater'].includes(type) ? [inner] : undefined,
      }
      const engine = engineFor({ specVersion: '4', id: 'every-type', model: { fields: [field] } } as unknown as FormSchema, 'en', {})
      const { unmount } = render(createElement(FormancyProvider, { engine }, createElement(FormancyForm)))
      const target = targetOf(engine, 'field')
      const control = engine.fieldPaths().includes('field') ? document.getElementById(engine.getFieldSnapshot(['field']).ids.control) : null
      control?.focus()
      const focused = control !== null && document.activeElement === control
      unmount()
      return [{ kind, focused, led: target?.shown === true }]
    })
    expect(takes.filter(({ focused }) => focused).map(({ kind }) => kind)).toEqual([
      'text',
      'textarea',
      'number',
      'checkbox',
      'select',
      'date',
      'time',
      'datetime',
      'richtext',
      'checkbox/toggle',
      'select/typeahead',
      'selectboxes/tagpicker',
      'text/scanner',
      'number/rating',
      'number/slider',
    ])
    expect(takes.filter(({ led }) => led).map(({ kind }) => kind)).toEqual(takes.filter(({ focused }) => focused).map(({ kind }) => kind))
  })
})
