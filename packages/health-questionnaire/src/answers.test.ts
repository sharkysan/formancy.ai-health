import { writeJson } from '@formancy/health-core'
import type { FieldDef } from '@formancy/spec'
import { describe, expect, test } from 'vitest'
import { HOST, RESPONDING, URL, answered, form, refusedAnswers } from './test-support.js'

const option = (value: string, label: string) => ({ value, label })
const canton: FieldDef = { key: 'canton', type: 'select', label: 'Canton', options: [option('BE', 'Bern'), option('VS', 'Valais')] }
const topics: FieldDef = { key: 'topics', type: 'selectboxes', options: [option('a', 'A'), option('b', 'B'), option('c', 'C')] }

/** The answers of the one item a form of `field` answers with `value`, as writeJson writes them: digits are compared as text. */
function written(field: FieldDef, value: unknown): string | undefined {
  const response = answered(form([field]), { [field.key]: value })
  const [only] = response.item ?? []
  return only === undefined ? undefined : writeJson({ answer: only.answer ?? [] })
}

/** Each refusal of `value` as the one answer of a form of `field`. */
const refusedAs = (field: FieldDef, value: unknown) => refusedAnswers(form([field]), { [field.key]: value })

describe('an answer of each mapped type', () => {
  // Each formancy field type is the item type the Questionnaire gives it,
  // and its answer is that type's value[x]: a value written as another
  // would be refused by the validator against the Questionnaire
  // (Questionnaire_QR_Item_WrongType, measured 17 October 2026).
  test.each([
    [{ key: 'reason', type: 'text' }, 'Follow-up', '{"answer":[{"valueString":"Follow-up"}]}'],
    [{ key: 'history', type: 'textarea' }, 'One\nTwo', '{"answer":[{"valueString":"One\\nTwo"}]}'],
    [{ key: 'campaign', type: 'hidden' }, 'spring', '{"answer":[{"valueString":"spring"}]}'],
    [{ key: 'consent', type: 'checkbox' }, true, '{"answer":[{"valueBoolean":true}]}'],
    [{ key: 'born', type: 'date' }, '2026-10-17', '{"answer":[{"valueDate":"2026-10-17"}]}'],
    [{ key: 'seen', type: 'datetime' }, '2026-10-17T08:00:00Z', '{"answer":[{"valueDateTime":"2026-10-17T08:00:00Z"}]}'],
  ] as [FieldDef, unknown, string][])('%o answers %j as %s', (field, value, json) => {
    expect(written(field, value)).toBe(json)
  })

  // A formancy time is a minute, HH:MM, and R4's time has its seconds:
  // 09:30 is 09:30:00 exactly, nothing rounded (0006's bounds the same).
  test('a time is the minute it names, with its seconds', () => {
    expect(written({ key: 'arrival', type: 'time' }, '09:30')).toBe('{"answer":[{"valueTime":"09:30:00"}]}')
  })

  // An unticked box is an answer, false, where formancy's untouched box is
  // null and no answer: the two must not be one in the response.
  test('a checkbox left false is answered false', () => {
    expect(written({ key: 'consent', type: 'checkbox' }, false)).toBe('{"answer":[{"valueBoolean":false}]}')
    expect(written({ key: 'consent', type: 'checkbox' }, null)).toBeUndefined()
  })

  // A choice's answer is the coding the Questionnaire's option has -- its
  // system, its code, its label as display -- so a receiver finds the
  // option by system and code, and the validator does
  // (Questionnaire_QR_Item_NoCoding otherwise, measured).
  test("a choice is its option's coding", () => {
    expect(written(canton, 'VS')).toBe(`{"answer":[{"valueCoding":{"system":"${URL}/canton","code":"VS","display":"Valais"}}]}`)
    expect(written({ ...canton, type: 'radio' }, 'BE')).toBe(`{"answer":[{"valueCoding":{"system":"${URL}/canton","code":"BE","display":"Bern"}}]}`)
  })

  // A translated option's display has its translations in the
  // Questionnaire; the response's coding is the code a person chose, with
  // the display in the Questionnaire's language and no second copy of the
  // translations, which could disagree with the Questionnaire's.
  test("a choice's coding carries none of the option's translations", () => {
    const translated = form([{ ...canton, label: { $t: 'canton' }, options: [{ value: 'BE', label: { $t: 'be' } }] }], {
      i18n: { defaultLocale: 'de-CH', messages: { 'de-CH': { canton: 'Kanton', be: 'Bern' }, fr: { canton: 'Canton', be: 'Berne' } } },
    })
    const response = answered(translated, { canton: 'BE' }, { ...RESPONDING, questionnaire: { ...HOST, languages: ['fr'] } })
    expect(writeJson(response.item as never)).toBe(`[{"linkId":"canton","answer":[{"valueCoding":{"system":"${URL}/canton","code":"BE","display":"Bern"}}]}]`)
  })

  // Checkboxes are one item with several answers, never several items of
  // one linkId, which R4's qrs-2 refuses; in the order formancy holds them.
  test('checkboxes are one item with an answer per tick', () => {
    expect(written(topics, ['c', 'a'])).toBe(
      `{"answer":[{"valueCoding":{"system":"${URL}/topics","code":"c","display":"C"}},{"valueCoding":{"system":"${URL}/topics","code":"a","display":"A"}}]}`,
    )
  })
})

describe('a number answer', () => {
  // formancy holds a number answer as a JSON number, a double, and nothing
  // here has the text a person typed: 70.50 was 70.5 before the export saw
  // it. What is written is the double's shortest text, the one that reads
  // back as that double -- so the response holds exactly the value
  // formancy stored, and no digit it did not (0007).
  test.each([
    [70.5, '70.5'],
    [0.1, '0.1'],
    [0.30000000000000004, '0.30000000000000004'],
    [1e21, '1e+21'],
    [5e-324, '5e-324'],
    [-0, '-0'],
  ])('a decimal answer of %d is written %s', (value, text) => {
    expect(written({ key: 'weight', type: 'number' }, value)).toBe(`{"answer":[{"valueDecimal":${text}}]}`)
  })

  // A whole number on an integer item is written from its BigInt, exactly;
  // -0 is whole, and an R4 integer has no -0.
  test.each([
    [3, '3'],
    [-2147483648, '-2147483648'],
    [-0, '0'],
  ])('an integer answer of %d is written %s', (value, text) => {
    expect(written({ key: 'children', type: 'number', step: 1 }, value)).toBe(`{"answer":[{"valueInteger":${text}}]}`)
  })

  // formancy's step admits 2.0000001 on a step of one, within its
  // tolerance of a millionth of a step (measured on @formancy/core 0.5.0);
  // R4's integer does not. Refused, never rounded to 2. And a whole number
  // past R4's 32 bits, which formancy's number admits, is refused, never
  // wrapped.
  test.each([
    [2.0000001, 'grammar'],
    [3e9, 'range'],
    [2147483648, 'range'],
  ])('an integer answer of %d is refused as %s', (value, rule) => {
    expect(refusedAs({ key: 'children', type: 'number', step: 1 }, value)).toEqual([`${rule} answers.children`])
  })

  // A double that is no number has no FHIR decimal; formancy's JSON could
  // never hold one, and a host's object can.
  test.each([Number.NaN, Number.POSITIVE_INFINITY])('refuses %d', (value) => {
    expect(refusedAs({ key: 'weight', type: 'number' }, value)).toEqual(['grammar answers.weight'])
  })
})

describe('an answer the Questionnaire could not hold', () => {
  // formancy's engine holds a number field's value to a number only when
  // the field has a bound or a step, and a text field's, a checkbox's, a
  // hidden field's and a static text's not at all (measured on
  // @formancy/core 0.5.0: 42 in a text field, 'abc' in a number field,
  // 'yes' in a checkbox, 7 in a hidden field and a value under a static
  // text each validate there). Each would be an answer of the wrong type,
  // and is refused at its path.
  test.each([
    [{ key: 'reason', type: 'text' }, 42],
    [{ key: 'weight', type: 'number' }, 'abc'],
    [{ key: 'consent', type: 'checkbox' }, 'yes'],
    [{ key: 'campaign', type: 'hidden' }, 7],
    [{ key: 'notice', type: 'static', label: 'Read.' }, 'typed'],
    [canton, ['BE']],
    [topics, 'a'],
    [{ key: 'born', type: 'date' }, 20261017],
  ] as [FieldDef, unknown][])('refuses %o answered %j', (field, value) => {
    expect(refusedAs(field, value)).toEqual([`answer-type answers.${field.key}`])
  })

  // An option the field does not offer has no coding in the Questionnaire,
  // and a tick given twice is two answers to one choice: each is refused
  // where it stands, all at once.
  test('refuses an option not offered, and one chosen twice, where each stands', () => {
    expect(refusedAs(canton, 'ZH')).toEqual(['option answers.canton'])
    expect(refusedAs(topics, ['a', 'z', 'a', 3])).toEqual(['option answers.topics[1]', 'option answers.topics[2]', 'answer-type answers.topics[3]'])
  })

  // formancy's date shape does not check the calendar (2026-02-30
  // validates on @formancy/core 0.5.0), and R4's date does; a date and
  // time is always UTC in formancy, so one with an offset is no formancy
  // answer; a time is HH:MM.
  test.each([
    [{ key: 'born', type: 'date' }, '2026-02-30', 'calendar'],
    [{ key: 'born', type: 'date' }, '17.10.2026', 'grammar'],
    [{ key: 'seen', type: 'datetime' }, '2026-10-17T10:00:00+02:00', 'grammar'],
    [{ key: 'arrival', type: 'time' }, '9:30', 'grammar'],
  ] as [FieldDef, string, string][])('refuses %o answered %j as %s', (field, value, rule) => {
    expect(refusedAs(field, value)).toEqual([`${rule} answers.${field.key}`])
  })

  // A bound the Questionnaire states is checked by the validator against
  // the answer (QUESTIONNAIRE_QR_ITEM_DECIMAL_MIN and its kin, measured);
  // an answer past one would be refused there, so it is refused here, as
  // the same doubles and texts formancy compares.
  test.each([
    [{ key: 'weight', type: 'number', min: 0.5, max: 300 }, 300.0000001],
    [{ key: 'weight', type: 'number', min: 0.5, max: 300 }, 0.4],
    [{ key: 'children', type: 'number', step: 1, min: 0, max: 20 }, 21],
    [{ key: 'born', type: 'date', earliest: '1900-01-01', latest: '2026-10-17' }, '2026-10-18'],
    [{ key: 'arrival', type: 'time', earliest: '07:00' }, '06:59'],
    [{ key: 'seen', type: 'datetime', latest: '2026-10-17T08:00:00Z' }, '2026-10-17T08:00:01Z'],
    [{ key: 'reason', type: 'text', maxLength: 3 }, 'abcd'],
    [{ key: 'reason', type: 'text', minLength: 2 }, 'a'],
    [{ ...topics, maxItems: 2 }, ['a', 'b', 'c']],
    [{ ...topics, required: true, minItems: 2 }, ['a']],
  ] as [FieldDef, unknown][])('refuses %o answered %j past its bound', (field, value) => {
    expect(refusedAs(field, value)).toEqual([`bound answers.${field.key}`])
  })

  // The bounds themselves are answers formancy accepts, inclusive.
  test('accepts an answer on its bound', () => {
    expect(written({ key: 'weight', type: 'number', min: 0.5, max: 300 }, 0.5)).toBe('{"answer":[{"valueDecimal":0.5}]}')
    expect(written({ key: 'arrival', type: 'time', earliest: '07:00' }, '07:00')).toBe('{"answer":[{"valueTime":"07:00:00"}]}')
  })
})

describe('no answer', () => {
  // formancy's own reading of "no answer", @formancy/core 0.5.0's
  // `unanswered`: absent, null, a text of nothing but spaces, an empty
  // list. R4 has no null answer and no empty one, and FHIR JSON no empty
  // string: each is an item not written, and a response with none has no
  // item list at all, never an empty one (refused by the validator,
  // "Array cannot be empty", measured).
  test.each([
    [{ key: 'reason', type: 'text' }, undefined],
    [{ key: 'reason', type: 'text' }, null],
    [{ key: 'reason', type: 'text' }, ''],
    [{ key: 'reason', type: 'text' }, '   '],
    [{ key: 'weight', type: 'number' }, null],
    [topics, []],
    [canton, null],
  ] as [FieldDef, unknown][])('%o answered %j is no item', (field, value) => {
    const response = answered(form([field]), value === undefined ? {} : { [field.key]: value })
    expect(response).not.toHaveProperty('item')
  })

  // formancy's empty list has an answer of its own -- `'a' in topics` is
  // false against it and an error against null -- but `unanswered` reads
  // it as none, its required check refuses it, and R4 has no empty list:
  // a required list left empty is unanswered, not short of its minimum.
  test('a required list left empty is unanswered, not past its bound', () => {
    expect(refusedAnswers(form([{ ...topics, required: true, minItems: 2 }]), { topics: [] })).toEqual(['required answers.topics'])
  })
})
