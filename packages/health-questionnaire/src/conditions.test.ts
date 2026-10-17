import { writeJson } from '@formancy/health-core'
import type { FieldDef, LogicRule } from '@formancy/spec'
import { describe, expect, test } from 'vitest'
import type { QuestionnaireItem } from './resource.js'
import { URL, exported, refused, ruled } from './test-support.js'

const country: FieldDef = { key: 'country', type: 'select', options: [{ value: 'CH', label: 'Switzerland' }, { value: 'DE', label: 'Germany' }] }
const age: FieldDef = { key: 'age', type: 'number', step: 1 }
const weight: FieldDef = { key: 'weight', type: 'number' }
const consent: FieldDef = { key: 'consent', type: 'checkbox' }
const topics: FieldDef = { key: 'topics', type: 'selectboxes', options: [{ value: 'a', label: 'A' }, { value: 'b', label: 'B' }] }
const reason: FieldDef = { key: 'reason', type: 'text' }
const history: FieldDef = { key: 'history', type: 'textarea' }
const born: FieldDef = { key: 'born', type: 'date' }
const arrival: FieldDef = { key: 'arrival', type: 'time' }
const seen: FieldDef = { key: 'seen', type: 'datetime' }
const target: FieldDef = { key: 'follow_up', type: 'text' }
const QUESTIONS = [country, age, weight, consent, topics, reason, history, born, arrival, seen]

/** The item of `follow_up` when it is visible by `cel`, written as the validator reads it. */
function shown(cel: string): string {
  const items = exported(ruled([...QUESTIONS, target], [{ target: 'follow_up', kind: 'visible', cel }])).item ?? []
  return writeJson(items.at(-1) as QuestionnaireItem)
}

const coding = (key: string, value: string) => `{"system":"${URL}/${key}","code":"${value}"}`

/** `!=` with its unanswered case beside it, under any. */
const unequal = (key: string, answer: string) =>
  `"enableWhen":[{"question":"${key}","operator":"!=",${answer}},{"question":"${key}","operator":"exists","answerBoolean":false}],"enableBehavior":"any"`

describe('a visibility rule', () => {
  // formancy shows `x == 'a'` when x is 'a' and hides it otherwise,
  // unanswered included, and so does R4's `=`. Measured on @formancy/core
  // 0.5.0.
  test.each([
    ["country == 'CH'", `"enableWhen":[{"question":"country","operator":"=","answerCoding":${coding('country', 'CH')}}]`],
    ['consent == true', '"enableWhen":[{"question":"consent","operator":"=","answerBoolean":true}]'],
    ["reason == 'other'", '"enableWhen":[{"question":"reason","operator":"=","answerString":"other"}]'],
    ['age == 18', '"enableWhen":[{"question":"age","operator":"=","answerInteger":18}]'],
    ["born == '2000-01-31'", '"enableWhen":[{"question":"born","operator":"=","answerDate":"2000-01-31"}]'],
  ])('%s is the same enableWhen', (cel, written) => {
    expect(shown(cel)).toBe(`{"linkId":"follow_up","type":"string",${written}}`)
  })

  // formancy shows `x != 'a'` unanswered: null != 'a' is true. The HL7
  // validator reads R4's `!=` as "an answer that differs", so with no
  // answer it disables the item, and refuses the answer a person gave it
  // (Questionnaire_QR_Item_NotEnabled2, measured 17 October 2026 with
  // 7.0.2, 0007); R5 words it "no answer is equal", which enables it. So
  // the unanswered case is written beside it, as an ordering's is, and
  // both readings agree with formancy's.
  test.each([
    ['country != "DE"', unequal('country', `"answerCoding":${coding('country', 'DE')}`)],
    ['consent != true', unequal('consent', '"answerBoolean":true')],
    ["history != 'none'", unequal('history', '"answerString":"none"')],
  ])('%s holds, or the field is unanswered', (cel, written) => {
    expect(shown(cel)).toBe(`{"linkId":"follow_up","type":"string",${written}}`)
  })

  // Under ||, the unanswered case is one more condition of the any, once
  // per question; under &&, "this, and that differs or is unanswered" is
  // a nesting enableWhen cannot say, and is refused.
  test('writes != with its unanswered case under ||, and refuses it under &&', () => {
    expect(shown("country == 'CH' || reason != 'x' || reason != 'y'")).toContain(
      `"enableWhen":[{"question":"country","operator":"=","answerCoding":${coding('country', 'CH')}},{"question":"reason","operator":"!=","answerString":"x"},{"question":"reason","operator":"!=","answerString":"y"},{"question":"reason","operator":"exists","answerBoolean":false}],"enableBehavior":"any"`,
    )
    expect(refused(ruled([...QUESTIONS, target], [{ target: 'follow_up', kind: 'visible', cel: "consent == true && country != 'CH'" }]))).toEqual(['unmapped form.logic.rules[0].cel'])
  })

  // A list answer holding a value is R4's `=` on a repeating question:
  // at least one answer equal.
  test("'a' in topics is enableWhen topics = a", () => {
    expect(shown("'a' in topics")).toContain(`"enableWhen":[{"question":"topics","operator":"=","answerCoding":${coding('topics', 'a')}}]`)
  })

  // An ordering is an error on an unanswered field in formancy, and a
  // visibility rule that errors shows its field; R4's `>=` with no answer
  // is false. Written without its unanswered case, a Questionnaire would
  // hide a follow-up question formancy showed.
  test.each([
    ['age >= 18', '"answerInteger":18', '>='],
    ['weight < 2.50', '"answerDecimal":2.50', '<'],
    ["arrival > '09:30'", '"answerTime":"09:30:00"', '>'],
    ["seen <= '2026-10-17T08:00:00Z'", '"answerDateTime":"2026-10-17T08:00:00Z"', '<='],
  ])('%s holds, or the field is unanswered', (cel, answer, operator) => {
    const key = cel.split(' ')[0] ?? ''
    expect(shown(cel)).toContain(
      `"enableWhen":[{"question":"${key}","operator":"${operator}",${answer}},{"question":"${key}","operator":"exists","answerBoolean":false}],"enableBehavior":"any"`,
    )
  })

  // A decimal literal keeps its digits: 2.50 is written as 2.50, from the
  // rule's text, and never through a double.
  test('keeps a literal\'s digits', () => {
    expect(shown('weight == 2.50')).toContain('"answerDecimal":2.50')
    expect(shown('weight > 0.000123456789012345')).toContain('"answerDecimal":0.000123456789012345')
    expect(shown(`weight > -0.${'0'.repeat(306)}1`)).toContain(`"answerDecimal":-0.${'0'.repeat(306)}1`)
  })

  // CEL reads a number literal as the double nearest it: on
  // @formancy/core 0.5.0, `weight == 0.30000000000000001` shows its field
  // for an answer of 0.3 (measured 17 October 2026). R4 compares the
  // digits, and would hide it. Fifteen significant digits are as many as
  // every double keeps, so a literal of more, or one so small that a
  // double keeps fewer, may mean another number in each, and is refused.
  test.each(['weight == 0.30000000000000001', 'weight >= 1234567890123456', `weight > 0.${'0'.repeat(307)}1`])('refuses %s, a literal a double does not hold', (cel) => {
    expect(refused(ruled([weight, target], [{ target: 'follow_up', kind: 'visible', cel }]))).toEqual(['unmapped form.logic.rules[0].cel'])
  })

  // Equalities never error, so && is every one and || any one.
  test('a chain of equalities is all or any of them', () => {
    expect(shown("country == 'CH' && consent == true")).toContain(',"enableBehavior":"all"}')
    expect(shown("country == 'CH' || 'b' in topics")).toContain(',"enableBehavior":"any"}')
  })

  // What enableWhen cannot say, or says differently, is refused at the
  // rule's expression rather than written as something near it.
  test.each([
    ['a negation', "!(country == 'CH')"],
    ['parentheses', "(country == 'CH')"],
    ['a function', "size(reason) > 3"],
    ['a field in a group', "address.city == 'Bern'"],
    ['an ordering in a chain', "age >= 18 && consent == true"],
    ['two joins', "country == 'CH' && consent == true || age == 1"],
    ['an ordering of text', "reason > 'a'"],
    ['an ordering of a choice', "country > 'CH'"],
    ['a value the choice does not offer', "country == 'FR'"],
    ['a list compared as one answer', "topics == 'a'"],
    ['in on one answer', "'CH' in country"],
    ['a string for a number', "age == '18'"],
    ['an empty string', "reason == ''"],
    // formancy shows `reason == '  '` for an answer of two spaces
    // (measured on @formancy/core 0.5.0 in review, 17 October 2026), and
    // its `unanswered` reads that answer as none, which the response
    // therefore never writes (0007): R4's `=` would hide the item
    // formancy showed, and refuse what was typed into it.
    ['a string of nothing but whitespace', "reason == '  '"],
    ['an escape', "reason == 'it\\'s'"],
    ['an exponent', 'weight > 1e3'],
    ['null', 'reason == null'],
    ['the field itself', "follow_up == 'x'"],
    ['a boolean for text', 'reason == true'],
    ['a group', "address == 'x'"],
    ['a static text', "notice == 'x'"],
    ['a field version 1 refuses', "drawn == 'x'"],
    ['a field nobody defined', "nobody == 'x'"],
  ])('refuses %s', (_, cel) => {
    const others: FieldDef[] = [{ key: 'address', type: 'group', fields: [{ key: 'city', type: 'text' }] }, { key: 'notice', type: 'static', label: 'Read.' }]
    const refusals = refused(ruled([...QUESTIONS, ...others, { key: 'drawn', type: 'signature' }, target], [{ target: 'follow_up', kind: 'visible', cel }]))
    expect(refusals.filter((refusal) => refusal !== 'unmapped form.model.fields[12].type')).toEqual(['unmapped form.logic.rules[0].cel'])
  })

  // A literal is checked as its question's type, as a bound is: an
  // integer question compares with a whole number within 32 bits, and a
  // time with formancy's `HH:MM`, the only shape in which comparing text
  // orders times. Each is refused as what is wrong with it, once.
  test.each([
    ['a whole number past 32 bits', 'age > 2147483648', 'range'],
    ['a fraction for an integer', 'age == 17.5', 'grammar'],
    ["a time not in formancy's shape", "arrival > '9:30'", 'grammar'],
    ["a date not in formancy's shape", "born > '2000-1-1'", 'grammar'],
    ['a date and time with an offset, which formancy never stores', "seen == '2026-10-17T10:00:00+02:00'", 'grammar'],
    ['a day the calendar does not have', "born == '2026-02-30'", 'calendar'],
  ])('refuses %s as its type does', (_, cel, rule) => {
    expect(refused(ruled([age, arrival, born, seen, target], [{ target: 'follow_up', kind: 'visible', cel }]))).toEqual([`${rule} form.logic.rules[0].cel`])
  })

  // A choice that offers nothing is refused as an item, and a rule
  // comparing it with a value it cannot offer is refused as a rule.
  test('refuses a comparison with a choice that offers nothing', () => {
    expect(refused(ruled([{ key: 'clinic', type: 'select' }, target], [{ target: 'follow_up', kind: 'visible', cel: "clinic == 'x'" }]))).toEqual([
      'unmapped form.logic.rules[0].cel',
      'unmapped form.model.fields[0].options',
    ])
  })

  // A renderer walking the items in order has not reached an answer that
  // comes after the item it would enable; the validator warns of it, with
  // no message id the gate could register, so the rule is refused. On a
  // page, a skip rule reading a field on that page reads one after it too.
  test('refuses a question that comes after the item it enables', () => {
    expect(refused(ruled([target, consent], [{ target: 'follow_up', kind: 'visible', cel: 'consent == true' }]))).toEqual(['unmapped form.logic.rules[0].cel'])
    const page: FieldDef = { key: 'step', type: 'page', fields: [consent] }
    expect(refused(ruled([page], [{ target: 'step', kind: 'skip', cel: 'consent == true' }]))).toEqual(['unmapped form.logic.rules[0].cel'])
  })

  // A rule inside a repeater runs once per row with the row in scope,
  // which no enableWhen has.
  test('refuses a visibility rule on a field inside a repeater', () => {
    const rows: FieldDef = { key: 'rows', type: 'repeater', fields: [{ key: 'kind', type: 'text' }, { key: 'detail', type: 'text' }] }
    expect(refused(ruled([rows], [{ target: 'rows[].detail', kind: 'visible', cel: "item.kind == 'x'" }]))).toEqual(['unmapped form.logic.rules[0].target'])
  })

  // A field on a page a skip rule walks past keeps its value in formancy,
  // and its rules still read it; R4 reads a disabled question as
  // unanswered, so the two would disagree.
  test('refuses a question on a page a skip rule walks past', () => {
    const page: FieldDef = { key: 'visa', type: 'page', fields: [{ key: 'needs_visa', type: 'checkbox' }] }
    const rest: FieldDef = { key: 'rest', type: 'page', fields: [target] }
    const rules: LogicRule[] = [
      { target: 'visa', kind: 'skip', cel: 'consent == true' },
      { target: 'follow_up', kind: 'visible', cel: 'needs_visa == true' },
    ]
    expect(refused(ruled([consent, page, rest], rules))).toEqual(['unmapped form.logic.rules[1].cel'])
  })

  // formancy keeps the answer of a field hidden with clearOnHide off,
  // and R4 drops a disabled item's: the export could not say which.
  test('refuses clearOnHide off on a field a rule can hide, and not on one nothing hides', () => {
    expect(refused(ruled([consent, { ...target, clearOnHide: false }], [{ target: 'follow_up', kind: 'visible', cel: 'consent == true' }]))).toEqual(['unmapped form.model.fields[1].clearOnHide'])
    const group: FieldDef = { key: 'box', type: 'group', fields: [{ ...reason, clearOnHide: false }] }
    expect(refused(ruled([consent, group], [{ target: 'box', kind: 'visible', cel: 'consent == true' }]))).toEqual(['unmapped form.model.fields[1].fields[0].clearOnHide'])
    expect(exported(ruled([{ ...reason, clearOnHide: false }], [])).item).toEqual([{ linkId: 'reason', type: 'string' }])
    // A page above it hides nothing unless a skip rule walks past it.
    expect(exported(ruled([{ key: 'step', type: 'page', fields: [{ ...reason, clearOnHide: false }] }], [])).item?.[0]?.item).toEqual([{ linkId: 'reason', type: 'string' }])
  })
})

describe('a skip rule', () => {
  // A page is walked past while the rule holds, so it is enabled while it
  // does not: each comparison negated, && become any and || all.
  // A negated equality is a `!=`, and carries its unanswered case as one
  // written so does: formancy's `country == 'CH'` is false unanswered, so
  // the page is not skipped, and shows.
  const page: FieldDef = { key: 'visa', type: 'page', fields: [{ key: 'visa_number', type: 'text' }] }
  const skipping = (cel: string) => ruled([country, consent, age, topics, page], [{ target: 'visa', kind: 'skip', cel }])
  const enabled = (cel: string) => writeJson(exported(skipping(cel)).item?.[4] as QuestionnaireItem)
  test('enables its page while the rule does not hold', () => {
    expect(enabled("country == 'CH'")).toContain(`${unequal('country', `"answerCoding":${coding('country', 'CH')}`)},"item"`)
    expect(enabled("country == 'CH' && consent == true")).toContain(
      `"enableWhen":[{"question":"country","operator":"!=","answerCoding":${coding('country', 'CH')}},{"question":"consent","operator":"!=","answerBoolean":true},{"question":"country","operator":"exists","answerBoolean":false},{"question":"consent","operator":"exists","answerBoolean":false}],"enableBehavior":"any"`,
    )
    expect(enabled("country != 'CH' || consent != true")).toContain(`"enableWhen":[{"question":"country","operator":"=","answerCoding":${coding('country', 'CH')}},{"question":"consent","operator":"=","answerBoolean":true}],"enableBehavior":"all"`)
    // A skip rule that errors does not skip: unanswered, the page shows.
    expect(enabled('age > 65')).toContain('"enableWhen":[{"question":"age","operator":"<=","answerInteger":65},{"question":"age","operator":"exists","answerBoolean":false}],"enableBehavior":"any"')
  })

  // `||` negated is every `!=` at once, which enableWhen cannot say with
  // each one's unanswered case. And a list not holding a value is no R4
  // operator: `!=` on a repeating question is, to the validator, "some
  // answer differs", which [a, b] meets though it holds a. Both refused.
  test.each(["country == 'CH' || consent == true", "'a' in topics"])('refuses %s, whose negation enableWhen cannot say', (cel) => {
    expect(refused(skipping(cel))).toEqual(['unmapped form.logic.rules[0].cel'])
  })
})

describe('the other rules', () => {
  // Each judges or changes an answer with an expression SDC states only
  // in FHIRPath, or not at all; left out, the Questionnaire would accept
  // what the form refuses or require what it does not.
  test.each([
    { target: 'reason', kind: 'validate', cel: 'size(reason) > 2', code: 'short' },
    { target: 'reason', kind: 'check', check: 'unique.reason' },
    { target: 'reason', kind: 'required', cel: 'consent == true' },
    { target: 'reason', kind: 'disabled', cel: 'consent == true' },
  ] as LogicRule[])('refuses a $kind rule at its kind', (rule) => {
    expect(refused(ruled([consent, reason], [rule]))).toEqual(['unmapped form.logic.rules[0].kind'])
  })
})
