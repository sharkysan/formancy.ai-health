import { code, date, decimal, integer, time, uri } from '@formancy/health-core'
import { describe, expect, test } from 'vitest'
import { isEnabled } from './enablement.js'
import type { EnableWhen, QuestionnaireItem } from './resource.js'
import type { QuestionnaireResponseAnswer } from './response-resource.js'

const at = 'test'
const coding = (value: string) => ({ system: uri('https://forms.synthetic.invalid/Questionnaire/intake/canton', at), code: code(value, at) })
const when = (operator: string, answer: Partial<EnableWhen>, question = 'q'): EnableWhen => ({ question, operator: code(operator, at), ...answer })
const item = (enableWhen: EnableWhen[], enableBehavior?: 'all' | 'any'): QuestionnaireItem => ({
  linkId: 't',
  type: code('string', at),
  enableWhen,
  ...(enableBehavior === undefined ? {} : { enableBehavior: code(enableBehavior, at) }),
})
const answers = (...list: QuestionnaireResponseAnswer[]) => new Map([['q', list]])
const none = new Map<string, readonly QuestionnaireResponseAnswer[]>()

describe('isEnabled', () => {
  // An item without a condition is enabled whatever was answered.
  test('enables an item without enableWhen', () => {
    expect(isEnabled({ linkId: 't', type: code('string', at) }, none)).toBe(true)
  })

  // The validator reads every operator as "an answer that ...": with no
  // answer, = and != and an ordering are all false, and only exists
  // false holds (measured 17 October 2026 with 7.0.2, 0007). An answer
  // written here to an item the validator disables is refused there, so
  // the reading is the validator's.
  test.each([
    ['=', false],
    ['!=', false],
    ['>', false],
  ])('with no answer, %s is %s', (operator, enabled) => {
    expect(isEnabled(item([when(operator, { answerCoding: coding('BE') })]), none)).toBe(enabled)
  })

  test('exists asks whether there is an answer, true or false', () => {
    expect(isEnabled(item([when('exists', { answerBoolean: false })]), none)).toBe(true)
    expect(isEnabled(item([when('exists', { answerBoolean: false })]), answers({ valueBoolean: false }))).toBe(false)
    expect(isEnabled(item([when('exists', { answerBoolean: true })]), answers({ valueBoolean: false }))).toBe(true)
  })

  // A coding is its system and its code; its display is a text, and two
  // displays of one code are one answer.
  test('compares codings by system and code', () => {
    expect(isEnabled(item([when('=', { answerCoding: coding('BE') })]), answers({ valueCoding: { ...coding('BE'), display: 'Bern' } }))).toBe(true)
    expect(
      isEnabled(
        item([when('=', { answerCoding: coding('BE') })]),
        answers({ valueCoding: { ...coding('BE'), system: uri('https://forms.synthetic.invalid/other', at) } }),
      ),
    ).toBe(false)
    expect(isEnabled(item([when('!=', { answerCoding: coding('BE') })]), answers({ valueCoding: coding('VS') }))).toBe(true)
  })

  // On a repeating question each operator asks whether some answer meets
  // it: [a, b] is = a, and != a as well, which is why the mapping never
  // writes != on one (conditions.ts).
  test('asks whether some answer of several meets it', () => {
    const ticks = answers({ valueCoding: coding('a') }, { valueCoding: coding('b') })
    expect(isEnabled(item([when('=', { answerCoding: coding('a') })]), ticks)).toBe(true)
    expect(isEnabled(item([when('!=', { answerCoding: coding('a') })]), ticks)).toBe(true)
    expect(isEnabled(item([when('=', { answerCoding: coding('c') })]), ticks)).toBe(false)
  })

  // R4 compares numbers by value: the validator enables `= 2.50` for an
  // answer of 2.5, and formancy's CEL agrees (measured 17 October 2026).
  // Compared as text, or through a double, 2.50 and 2.5 or 2^53 + 1 and
  // 2^53 would be told apart wrongly.
  test('compares numbers by value, exactly', () => {
    expect(isEnabled(item([when('=', { answerDecimal: decimal('2.50', at) })]), answers({ valueDecimal: decimal('2.5', at) }))).toBe(true)
    expect(isEnabled(item([when('>=', { answerDecimal: decimal('150', at) })]), answers({ valueDecimal: decimal('149.99', at) }))).toBe(false)
    expect(isEnabled(item([when('>', { answerInteger: integer('2', at) })]), answers({ valueInteger: integer('3', at) }))).toBe(true)
    expect(isEnabled(item([when('<=', { answerInteger: integer('2', at) })]), answers({ valueInteger: integer('3', at) }))).toBe(false)
    expect(isEnabled(item([when('<', { answerDecimal: decimal('9007199254740993', at) })]), answers({ valueDecimal: decimal('9007199254740992', at) }))).toBe(
      true,
    )
  })

  // A date, a time and a date and time are compared in formancy's fixed
  // width, in which text orders as the calendar and the clock do, and in
  // which both sides of every comparison here are written.
  test('compares dates and times in their order', () => {
    expect(isEnabled(item([when('>', { answerDate: date('2008-10-17', at) })]), answers({ valueDate: date('2010-01-01', at) }))).toBe(true)
    expect(isEnabled(item([when('<=', { answerTime: time('07:30:00', at) })]), answers({ valueTime: time('07:31:00', at) }))).toBe(false)
  })

  test('compares text and booleans for equality', () => {
    expect(isEnabled(item([when('!=', { answerString: 'keine' })]), answers({ valueString: 'Asthma' }))).toBe(true)
    expect(isEnabled(item([when('!=', { answerString: 'keine' })]), answers({ valueString: 'keine' }))).toBe(false)
    expect(isEnabled(item([when('=', { answerDate: date('2008-10-17', at) })]), answers({ valueDate: date('2008-10-17', at) }))).toBe(true)
    expect(isEnabled(item([when('=', { answerBoolean: true })]), answers({ valueBoolean: false }))).toBe(false)
  })

  // all is every condition, any is one of them; one condition alone has
  // no behaviour, and is itself.
  test('joins its conditions as enableBehavior says', () => {
    const both = [when('=', { answerBoolean: true }), when('=', { answerString: 'x' }, 'r')]
    const written = new Map([['q', [{ valueBoolean: true }]]])
    expect(isEnabled(item(both, 'all'), written)).toBe(false)
    expect(isEnabled(item(both, 'any'), written)).toBe(true)
  })

  // The mapping writes each condition's answer of its question's type; a
  // condition whose answer is of another type than the answer it reads is
  // a bug here, and the validator itself stops on one ("Expected answer
  // and actual answer have incompatible types", measured 17 October 2026).
  test('throws on a condition and an answer of different types', () => {
    expect(() => isEnabled(item([when('=', { answerBoolean: true })]), answers({ valueString: 'x' }))).toThrow(/types/)
    expect(() => isEnabled(item([when('<', { answerDecimal: decimal('1', at) })]), answers({ valueDate: date('2026-10-17', at) }))).toThrow(/types/)
    expect(() => isEnabled(item([when('=', { answerCoding: coding('BE') })]), answers({ valueBoolean: true }))).toThrow(/types/)
  })

  // The mapping writes R4's operators and none other; one it does not
  // write is a bug here, never read as false.
  test('throws on an operator the mapping never writes', () => {
    expect(() => isEnabled(item([when('contains', { answerString: 'x' })]), answers({ valueString: 'x' }))).toThrow(/operator/)
  })
})
