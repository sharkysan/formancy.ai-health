import { describe, expect, test } from 'vitest'
import { exported, form, onlyItem, refused } from './test-support.js'

describe('the test support', () => {
  // Every case of this package rests on these. If `refused` answered for a
  // form that was exported, a refusal removed from the code would leave
  // its test passing; if `exported` answered for one refused, a case
  // could pass on a resource that was never made.
  test('fails a case that expects a refusal when the form is exported, and the other way round', () => {
    expect(() => refused(form([{ key: 'reason', type: 'text' }]))).toThrow(/expected the export to be refused/)
    expect(() => exported(form([{ key: 'drawn', type: 'signature' }]))).toThrow(/refused: form\.model\.fields\[0\]\.type: /)
  })

  // A case about one field's item reads the item of that field, and fails
  // when there is none to read.
  test('reads the one item of a form of one field, and fails when it is refused', () => {
    expect(onlyItem({ key: 'step', type: 'page', fields: [{ key: 'a', type: 'text' }] }).linkId).toBe('step')
    expect(() => onlyItem({ key: 'notice', type: 'static' })).toThrow(/refused/)
  })
})
