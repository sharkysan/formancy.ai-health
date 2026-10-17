import { isFhirNumber, writeJson } from '@formancy/health-core'
import { FIELD_TYPES, type FieldDef } from '@formancy/spec'
import { describe, expect, test } from 'vitest'
import { toQuestionnaire } from './questionnaire.js'
import { HOST, URL, exported, form, onlyItem, refused, ruled } from './test-support.js'

const option = (value: string, label: string) => ({ value, label })

/**
 * What writeJson writes of an item, with each number token as the string
 * `#` and its digits, so a test compares digits and never a double.
 */
const digits = (value: unknown): unknown => JSON.parse(writeJson(value as never).replace(/:(-?[0-9][0-9.eE+-]*)(?=[,}\]])/g, ':"#$1"'))

describe('each version 1 field type', () => {
  // Plan 8.1's rows, read against @formancy/spec 0.5.0: a field mapped to
  // the wrong item type collects a different answer -- a textarea as a
  // one-line string, a checkbox as a choice -- and the validator would
  // accept the resource all the same.
  test.each([
    [{ key: 'reason', type: 'text' }, 'string'],
    [{ key: 'history', type: 'textarea' }, 'text'],
    [{ key: 'weight', type: 'number' }, 'decimal'],
    [{ key: 'consent', type: 'checkbox' }, 'boolean'],
    [{ key: 'born', type: 'date' }, 'date'],
    [{ key: 'arrival', type: 'time' }, 'time'],
    [{ key: 'seen', type: 'datetime' }, 'dateTime'],
  ] as [FieldDef, string][])('%o is an item of type %s, its key the linkId', (field, type) => {
    expect(onlyItem(field)).toEqual({ linkId: field.key, type })
  })

  // A select and a radio are the same answer, one of the options, and only
  // look different; checkboxes are several of them, so the item repeats.
  test.each(['select', 'radio'] as const)('a %s is a choice of codings, each its value displayed as its label', (type) => {
    expect(onlyItem({ key: 'canton', type, label: 'Canton', options: [option('BE', 'Bern'), option('VS', 'Valais')] })).toEqual({
      linkId: 'canton',
      text: 'Canton',
      type: 'choice',
      answerOption: [
        { valueCoding: { system: `${URL}/canton`, code: 'BE', display: 'Bern' } },
        { valueCoding: { system: `${URL}/canton`, code: 'VS', display: 'Valais' } },
      ],
    })
  })

  test('checkboxes are a choice that repeats', () => {
    expect(onlyItem({ key: 'topics', type: 'selectboxes', options: [option('a', 'A')] })).toMatchObject({ type: 'choice', repeats: true })
  })

  // A hidden value travels with the answers and is shown to nobody: an
  // item a renderer would show asks somebody for a campaign code.
  test('a hidden field is a string item with the questionnaire-hidden extension', () => {
    expect(onlyItem({ key: 'campaign', type: 'hidden' })).toEqual({
      extension: [{ url: 'http://hl7.org/fhir/StructureDefinition/questionnaire-hidden', valueBoolean: true }],
      linkId: 'campaign',
      type: 'string',
    })
  })

  // A page is navigation in formancy and holds no answer of its own, but
  // it has a title and a skip rule can walk past it, so it is a group:
  // without SDC's `page` item control, which R4's code system lacks.
  test('a group, a page and a repeater are groups; a repeater repeats', () => {
    const child = { key: 'city', type: 'text' } as const
    expect(onlyItem({ key: 'address', type: 'group', fields: [child] })).toEqual({ linkId: 'address', type: 'group', item: [{ linkId: 'city', type: 'string' }] })
    expect(onlyItem({ key: 'step', type: 'page', fields: [child] })).toEqual({ linkId: 'step', type: 'group', item: [{ linkId: 'city', type: 'string' }] })
    expect(onlyItem({ key: 'people', type: 'repeater', fields: [child] })).toEqual({ linkId: 'people', type: 'group', repeats: true, item: [{ linkId: 'city', type: 'string' }] })
  })

  // A static text is something to read, and a display item is: as a
  // question it would ask for an answer formancy never collects.
  test('a static text is a display item, and needs its text', () => {
    expect(onlyItem({ key: 'notice', type: 'static', label: 'Read this first.' })).toEqual({ linkId: 'notice', text: 'Read this first.', type: 'display' })
    expect(refused(form([{ key: 'notice', type: 'static' }]))).toEqual(['missing form.model.fields[0].label'])
  })

  // A key is unique across the whole form, formancy's validator holds it,
  // and so linkIds are unique across the Questionnaire, as R4's que-2
  // asks, however deep a field is.
  test("every item's linkId is its field's key, nested ones included", () => {
    const questionnaire = exported(form([{ key: 'outer', type: 'group', fields: [{ key: 'inner', type: 'repeater', fields: [{ key: 'leaf', type: 'text' }] }] }]))
    expect(writeJson(questionnaire)).toContain('"linkId":"outer","type":"group","item":[{"linkId":"inner","type":"group","repeats":true,"item":[{"linkId":"leaf","type":"string"}]}]')
  })
})

describe('the field types version 1 refuses', () => {
  // Plan 8.1: no item carries a drawn mark, an order of options, a
  // question asked of several rows or a formatted answer without loss,
  // and a file waits for its bounds. Each is refused at its type, never
  // dropped from the Questionnaire.
  test.each([
    [{ key: 'drawn', type: 'signature' }],
    [{ key: 'ranked', type: 'ranking', options: [option('a', 'A'), option('b', 'B')] }],
    [{ key: 'rated', type: 'matrix', options: [option('a', 'A'), option('b', 'B')], rows: [{ value: 'r', label: 'R' }] }],
    [{ key: 'letter', type: 'richtext' }],
    [{ key: 'scan', type: 'file' }],
  ] as [FieldDef][])('refuses %o at its type', (field) => {
    expect(refused(form([field]))).toEqual(['unmapped form.model.fields[0].type'])
  })

  // Read from @formancy/spec's own list at run time, not from plan 8.1 or
  // from the cases above: every type the released spec has is an item of
  // its key, or refused at its type and nowhere else. A type that came
  // back as neither -- exported with no item, or refused for something
  // other than what it is -- would be a field a Questionnaire drops
  // without a word. The five refused are exactly version 1's.
  test.each([...FIELD_TYPES])("%s, as @formancy/spec 0.5.0 lists it, is one item or refused at its type", (type) => {
    const field: FieldDef = { key: 'only', type, label: 'Only' }
    if (['select', 'radio', 'selectboxes', 'ranking', 'matrix'].includes(type)) field.options = [option('a', 'A'), option('b', 'B')]
    if (type === 'matrix') field.rows = [{ value: 'r', label: 'R' }]
    if (['group', 'page', 'repeater'].includes(type)) field.fields = [{ key: 'inner', type: 'text' }]
    const result = toQuestionnaire(form([field]), HOST)
    if (result.ok) expect(result.questionnaire.item?.map((item) => item.linkId)).toEqual(['only'])
    else expect(result.refusals.map((refusal) => `${refusal.rule} ${refusal.path}`)).toEqual(['unmapped form.model.fields[0].type'])
    expect(result.ok).toBe(!['signature', 'ranking', 'matrix', 'richtext', 'file'].includes(type))
  })
})

describe('what a field says beside its type', () => {
  // formancy holds a required answer to its requirement; an item that did
  // not say so would let a renderer of the Questionnaire send none. A
  // repeater is required when it has a row, in both.
  test('required is required', () => {
    expect(onlyItem({ key: 'reason', type: 'text', required: true })).toEqual({ linkId: 'reason', type: 'string', required: true })
    expect(onlyItem({ key: 'rows', type: 'repeater', required: true, fields: [{ key: 'x', type: 'text' }] })).toMatchObject({ required: true, repeats: true })
  })

  // Where formancy's required means something R4's does not, it is
  // refused: a required checkbox is a consent gate only a tick satisfies,
  // and R4 takes false for an answer; formancy counts a group answered by
  // an object of empty fields, and R4 does not; a page and a static text
  // hold no answer to require.
  test.each([
    { key: 'agree', type: 'checkbox' },
    { key: 'notice', type: 'static', label: 'Read.' },
    { key: 'address', type: 'group', fields: [{ key: 'city', type: 'text' }] },
    { key: 'step', type: 'page', fields: [{ key: 'city', type: 'text' }] },
  ] as FieldDef[])('refuses a required $type', (field) => {
    expect(refused(form([{ ...field, required: true }]))).toEqual(['unmapped form.model.fields[0].required'])
  })

  // A length bound left out would accept answers formancy refuses.
  test('maxLength is maxLength, and minLength its extension', () => {
    expect(onlyItem({ key: 'reason', type: 'text', minLength: 2, maxLength: 80 })).toEqual({
      extension: [{ url: 'http://hl7.org/fhir/StructureDefinition/minLength', valueInteger: expect.anything() }],
      linkId: 'reason',
      type: 'string',
      maxLength: expect.anything(),
    })
    expect(digits(onlyItem({ key: 'reason', type: 'text', minLength: 2, maxLength: 80 }))).toMatchObject({ extension: [{ valueInteger: '#2' }], maxLength: '#80' })
  })

  // A pattern is a JavaScript regular expression, a format and a mask are
  // formancy's own checks; SDC's regex extension is of no stated dialect,
  // so writing one would be a translation nobody checked. Refused, each
  // at its property, rather than left out to admit what formancy refuses.
  test.each(['pattern', 'format', 'mask'] as const)('refuses a text field with a %s', (property) => {
    const value = { pattern: '[0-9]+', format: 'email', mask: '999' }[property]
    expect(refused(form([{ key: 'reason', type: 'text', [property]: value }]))).toEqual([`unmapped form.model.fields[0].${property}`])
  })

  // A bound's digits are the double formancy compares with, written as
  // the shortest text that reads back as it; a whole one from its BigInt.
  test('min and max are minValue and maxValue of the item\'s own type', () => {
    expect(digits(onlyItem({ key: 'weight', type: 'number', min: 0.5, max: 300 }))).toMatchObject({
      extension: [
        { url: 'http://hl7.org/fhir/StructureDefinition/minValue', valueDecimal: '#0.5' },
        { url: 'http://hl7.org/fhir/StructureDefinition/maxValue', valueDecimal: '#300' },
      ],
      type: 'decimal',
    })
    expect(digits(onlyItem({ key: 'count', type: 'number', min: 0, max: 12, step: 1 }))).toMatchObject({
      extension: [{ valueInteger: '#0' }, { valueInteger: '#12' }],
      type: 'integer',
    })
    for (const extension of onlyItem({ key: 'weight', type: 'number', min: 0.5 }).extension ?? []) expect(isFhirNumber(extension.valueDecimal)).toBe(true)
  })

  // A formancy time names a minute and R4's has seconds: 08:00 is
  // 08:00:00 exactly. A date and a datetime are R4's forms already.
  test('earliest and latest are minValue and maxValue, a time with its seconds', () => {
    expect(onlyItem({ key: 'arrival', type: 'time', earliest: '08:00', latest: '17:30' }).extension).toEqual([
      { url: 'http://hl7.org/fhir/StructureDefinition/minValue', valueTime: '08:00:00' },
      { url: 'http://hl7.org/fhir/StructureDefinition/maxValue', valueTime: '17:30:00' },
    ])
    expect(onlyItem({ key: 'born', type: 'date', earliest: '1900-01-01' }).extension).toEqual([{ url: 'http://hl7.org/fhir/StructureDefinition/minValue', valueDate: '1900-01-01' }])
    expect(onlyItem({ key: 'seen', type: 'datetime', latest: '2026-10-17T08:00:00Z' }).extension).toEqual([{ url: 'http://hl7.org/fhir/StructureDefinition/maxValue', valueDateTime: '2026-10-17T08:00:00Z' }])
  })

  // R4 allows questionnaire-minOccurs only on a required item, and the
  // validator refuses it elsewhere; formancy's minItems on an optional
  // field would then be dropped, so it is refused instead.
  test('maxItems is maxOccurs, and minItems minOccurs on a required item, refused on another', () => {
    const topics: FieldDef = { key: 'topics', type: 'selectboxes', options: [option('a', 'A'), option('b', 'B')], required: true, minItems: 1, maxItems: 2 }
    expect(digits(onlyItem(topics))).toMatchObject({
      extension: [
        { url: 'http://hl7.org/fhir/StructureDefinition/questionnaire-minOccurs', valueInteger: '#1' },
        { url: 'http://hl7.org/fhir/StructureDefinition/questionnaire-maxOccurs', valueInteger: '#2' },
      ],
      required: true,
      repeats: true,
    })
    expect(refused(form([{ ...topics, required: false }]))).toEqual(['unmapped form.model.fields[0].minItems'])
    expect(onlyItem({ ...topics, required: false, minItems: 0 }).extension).toHaveLength(1)
  })

  // An option list from a source the deployment names is not in the form,
  // and a choice of nothing says nothing; neither is a list of answers.
  test('refuses a choice whose options come from a source, or that offers none', () => {
    expect(refused(form([{ key: 'clinic', type: 'select', optionsSource: 'clinics' }]))).toEqual(['unmapped form.model.fields[0].optionsSource'])
    expect(refused(form([{ key: 'clinic', type: 'select' }]))).toEqual(['unmapped form.model.fields[0].options'])
  })

  // An option's value becomes a code, and R4's code has no leading or
  // doubled whitespace; formancy's value is any text.
  test('refuses an option whose value is no FHIR code, at that value', () => {
    expect(refused(form([{ key: 'clinic', type: 'radio', options: [option('ok', 'Ok'), option(' padded', 'Padded')] }]))).toEqual(['grammar form.model.fields[0].options[1].value'])
  })

  // R4's que-1 refuses a group with no item; an empty group in formancy
  // holds nothing, and exported it would fail the validator.
  test('refuses a container that holds no field', () => {
    expect(refused(form([{ key: 'address', type: 'group', fields: [] }]))).toEqual(['unmapped form.model.fields[0].fields'])
    expect(refused(form([{ key: 'people', type: 'repeater' }]))).toEqual(['unmapped form.model.fields[0].fields'])
  })

  // Presentation: how a field looks, not what it collects. Carried, a
  // widget would be a promise about a renderer the Questionnaire cannot
  // keep; its absence changes no answer.
  test('does not carry a widget, a datagrid\'s columns or a repeater\'s button labels', () => {
    expect(onlyItem({ key: 'agree', type: 'checkbox', widget: 'toggle' })).toEqual({ linkId: 'agree', type: 'boolean' })
    expect(onlyItem({ key: 'rows', type: 'repeater', widget: 'datagrid', columns: [{ field: 'x' }], addLabel: 'Add', removeLabel: 'Remove', fields: [{ key: 'x', type: 'text' }] })).toEqual({
      linkId: 'rows',
      type: 'group',
      repeats: true,
      item: [{ linkId: 'x', type: 'string' }],
    })
  })
})

describe('a number field', () => {
  // A step of one counted from a whole minimum admits only whole numbers,
  // which is R4's integer; without a step, any number, which is decimal.
  test('is an integer with a step of one from a whole minimum, a decimal without a step', () => {
    expect(onlyItem({ key: 'count', type: 'number', step: 1 }).type).toBe('integer')
    expect(onlyItem({ key: 'count', type: 'number', step: 1, min: -3 }).type).toBe('integer')
    expect(onlyItem({ key: 'weight', type: 'number' }).type).toBe('decimal')
  })

  // A step of five from two admits 2, 7, 12: no SDC element says that,
  // and an integer item would admit 3. A step of one from a half admits
  // 0.5, 1.5: no integer at all.
  test.each([{ step: 5, min: 2 }, { step: 0.5 }, { step: 1, min: 0.5 }])('refuses %o at its step', (bounds) => {
    expect(refused(form([{ key: 'score', type: 'number', ...bounds }]))).toEqual(['unmapped form.model.fields[0].step'])
  })

  // R4's integer is 32 bits. A bound past it is refused, never wrapped:
  // 2147483648 written as an integer would be read as -2147483648 by a
  // receiver that wraps, and as nothing by one that refuses.
  test('refuses a bound of an integer item past 32 bits, at the bound', () => {
    expect(refused(form([{ key: 'count', type: 'number', step: 1, max: 2147483648 }]))).toEqual(['range form.model.fields[0].max'])
    expect(refused(form([{ key: 'count', type: 'number', step: 1, min: -2147483649 }]))).toEqual(['range form.model.fields[0].min'])
    expect(digits(onlyItem({ key: 'count', type: 'number', step: 1, min: -2147483648, max: 2147483647 }))).toMatchObject({ extension: [{ valueInteger: '#-2147483648' }, { valueInteger: '#2147483647' }] })
  })

  // A maximum that is not whole on an integer item has no integer to be.
  test('refuses a bound of an integer item that is not whole', () => {
    expect(refused(form([{ key: 'count', type: 'number', step: 1, max: 10.5 }]))).toEqual(['grammar form.model.fields[0].max'])
  })
})

describe('a computed field', () => {
  // A computed value is captured, never calculated by the Questionnaire:
  // an SDC calculatedExpression would be formancy's CEL translated into
  // FHIRPath, and a calculated item is where clinical logic starts.
  test('is read-only, with no expression anywhere', () => {
    const questionnaire = exported(ruled([{ key: 'total', type: 'number' }], [{ target: 'total', kind: 'computed', cel: '1 + 1' }]))
    expect(questionnaire.item).toEqual([{ linkId: 'total', type: 'decimal', readOnly: true }])
    expect(writeJson(questionnaire)).not.toMatch(/[Ee]xpression|fhirpath|1 \+ 1/)
  })

  // A rule inside a repeater runs once per row; read-only holds for each.
  test('inside a repeater is read-only too', () => {
    const rows: FieldDef = { key: 'rows', type: 'repeater', fields: [{ key: 'line_total', type: 'number' }] }
    expect(exported(ruled([rows], [{ target: 'rows[].line_total', kind: 'computed', cel: 'item.line_total' }])).item?.[0]?.item).toEqual([{ linkId: 'line_total', type: 'decimal', readOnly: true }])
  })

  // A static text holds no value to compute, and a container none of its own.
  test('refuses a computed rule on what holds no answer', () => {
    expect(refused(ruled([{ key: 'address', type: 'group', fields: [{ key: 'city', type: 'text' }] }], [{ target: 'address', kind: 'computed', cel: "{'city': 'x'}" }]))).toEqual(['unmapped form.logic.rules[0].target'])
  })
})
