import { describe, expect, test } from 'vitest'
import { answers, refusedAs } from './test-support.js'

describe("the tests' helpers", () => {
  // Every refusal case rests on refusedAs. If it answered for an export
  // that was accepted, a check removed from the code would leave its test
  // passing, and the test would have proved nothing.
  test('refusedAs fails on an export that was not refused', () => {
    expect(() => refusedAs({ ok: true })).toThrow(/expected the export to be refused/)
  })

  // The synthetic answers are health-questionnaire's, made afresh: a
  // context it refuses stops the test, rather than handing a document
  // answers nobody wrote.
  test('answers stops on a context health-questionnaire refuses', () => {
    expect(answers().resourceType).toBe('QuestionnaireResponse')
    expect(() => answers({ status: 'final' })).toThrow(/the synthetic answers were refused/)
  })
})
