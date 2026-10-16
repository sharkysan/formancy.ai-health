import { describe, expect, test } from 'vitest'
import { Refusal } from './refusal.js'
import { refusalOf } from './test-support.js'

describe('refusalOf', () => {
  // Every refusal case in this package rests on it. If it answered when
  // the call accepted the value, a check removed from the code would leave
  // its test passing, and the test would have proved nothing.
  test('fails when the call accepts the value', () => {
    expect(() => refusalOf(() => 'accepted')).toThrow(/expected a refusal/)
  })

  // A bug's TypeError is not a refusal: taken for one, a crash in the code
  // under test would pass as the rule it was meant to show.
  test('rethrows what is not a Refusal', () => {
    const bug = new TypeError('a bug')
    expect(() =>
      refusalOf(() => {
        throw bug
      }),
    ).toThrow(bug)
    const refusal = new Refusal('grammar', 'value')
    expect(
      refusalOf(() => {
        throw refusal
      }),
    ).toBe(refusal)
  })
})
