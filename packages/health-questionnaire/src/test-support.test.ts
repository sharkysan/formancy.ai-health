import { describe, expect, test } from 'vitest'
import { answered, exported, form, onlyItem, refused, refusedAnswers } from './test-support.js'

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

  // The same of answers: a case expecting a refusal fails when they are
  // exported, and one expecting a response fails when they are refused.
  test('fails a case about answers that expects the other answer', () => {
    expect(() => refusedAnswers(form([{ key: 'reason', type: 'text' }]), {})).toThrow(/expected the answers to be refused/)
    expect(() => answered(form([{ key: 'reason', type: 'text' }]), { reason: 42 })).toThrow(/refused: answers\.reason: /)
  })
})
