import { describe, expect, test } from 'vitest'
import { readCondition } from './cel.js'

describe('readCondition', () => {
  // What it reads, it reads exactly: a key, an operator and a literal,
  // with the literal's text as written, so 2.50 keeps its zero.
  test('reads a comparison, and keeps a literal as written', () => {
    expect(readCondition("country == 'CH'")).toEqual({ comparisons: [{ key: 'country', operator: '==', literal: { kind: 'string', text: 'CH' } }], join: '&&' })
    expect(readCondition('weight>=-2.50')).toEqual({ comparisons: [{ key: 'weight', operator: '>=', literal: { kind: 'number', text: '-2.50' } }], join: '&&' })
    expect(readCondition('  consent != false  ')).toEqual({ comparisons: [{ key: 'consent', operator: '!=', literal: { kind: 'boolean', value: false } }], join: '&&' })
    expect(readCondition('"a b" in topics')).toEqual({ comparisons: [{ key: 'topics', operator: 'in', literal: { kind: 'string', text: 'a b' } }], join: '&&' })
  })

  test('reads a chain with one join throughout', () => {
    expect(readCondition("a == 1 || b == 'x' || c != true")?.comparisons.map((comparison) => comparison.key)).toEqual(['a', 'b', 'c'])
    expect(readCondition("a == 1 || b == 'x'")?.join).toBe('||')
  })

  // Everything else is not read, so that no rule is exported as a
  // comparison it is not. A tokenizer that let one of these through as a
  // shorter token would read `5u` as 5, `1e3` as 1, `it\'s` as `it`.
  test.each([
    '',
    'country',
    "country == 'CH' &&",
    "== 'CH'",
    "'CH' == country",
    'a == b',
    "a == 'x' && b == 'y' || c == 'z'",
    "!(a == 'x')",
    "(a == 'x')",
    "a.b == 'x'",
    "a[0] == 'x'",
    "size(a) > 1",
    "a == 'it\\'s'",
    "a == 'line\nbreak'",
    'a == 5u',
    'a == 1e3',
    'a == 0x1F',
    'a == 01',
    'a == 1.',
    'a == .5',
    'a == null',
    'null == null',
    "true == 'x'",
    "a in 'x'",
    "a == 'x' & b == 'y'",
    "a = 'x'",
    "a === 'x'",
    "a == 'x' 'y'",
    "a == 'unterminated",
  ])('does not read %j', (source) => {
    expect(readCondition(source)).toBeUndefined()
  })
})
