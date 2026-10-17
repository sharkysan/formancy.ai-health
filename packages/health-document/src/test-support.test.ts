import { describe, expect, test } from 'vitest'
import { bytesOf, refusedAs } from './test-support.js'

describe("the tests' helpers", () => {
  // Every refusal case rests on refusedAs. If it answered for an export
  // that was accepted, a check removed from the code would leave its test
  // passing, and the test would have proved nothing.
  test('refusedAs fails on an export that was not refused', () => {
    expect(() => refusedAs({ ok: true })).toThrow(/expected the export to be refused/)
  })

  // A PDF's header and trailer are bytes; a character past 255 would be
  // two bytes or a question mark, and a test of the header would test
  // something else.
  test('bytesOf takes only characters below 256', () => {
    expect([...bytesOf('%PDF')]).toEqual([0x25, 0x50, 0x44, 0x46])
    expect(() => bytesOf(String.fromCharCode(0x2030))).toThrow(/below 256/)
  })
})
