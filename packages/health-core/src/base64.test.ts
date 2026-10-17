import { describe, expect, expectTypeOf, test } from 'vitest'
import { base64Binary, fromBase64Binary, toBase64Binary, type FhirBase64Binary } from './base64.js'
import { refusalOf } from './test-support.js'

/** The bytes of a string of ASCII, as RFC 4648's vectors are given. */
const ascii = (text: string) => new Uint8Array([...text].map((character) => character.charCodeAt(0)))

/** RFC 4648, section 10: the test vectors of base64. */
const VECTORS = [
  ['f', 'Zg=='],
  ['fo', 'Zm8='],
  ['foo', 'Zm9v'],
  ['foob', 'Zm9vYg=='],
  ['fooba', 'Zm9vYmE='],
  ['foobar', 'Zm9vYmFy'],
] as const

describe('toBase64Binary', () => {
  // A PDF attached to a DocumentReference is its bytes, base64 encoded
  // (R4's Attachment.data). An encoder off by one bit in a padding case
  // writes a document whose last byte is another, which nothing reading
  // the JSON alone would notice.
  test.each(VECTORS)('writes %j as RFC 4648 does, %s', (text, written) => {
    expect(toBase64Binary(ascii(text), 'Attachment.data')).toBe(written)
  })

  // The two characters past the letters and digits are where a base64url
  // encoder, or R4's informative regex, which leaves `/` out, would differ.
  test('writes the last two characters of the alphabet as + and /', () => {
    expect(toBase64Binary(new Uint8Array([0xfb, 0xff]), 'Attachment.data')).toBe('+/8=')
  })

  // Every byte value, at every place in a quantum: an encoder that
  // mishandled a high bit, or one offset, would lose a byte somewhere a
  // three-letter vector never reaches.
  test('gives back every byte value, at every place in a quantum, through fromBase64Binary', () => {
    const bytes = new Uint8Array(256 * 3).map((_, index) => (index * 7 + (index >> 8)) & 0xff)
    for (const length of [bytes.length, bytes.length - 1, bytes.length - 2]) {
      const part = bytes.slice(0, length)
      expect([...fromBase64Binary(toBase64Binary(part, 'Binary.data'), 'Binary.data')]).toEqual([...part])
    }
  })

  // No bytes are no base64Binary: FHIR JSON never carries an empty string,
  // and writeJson would refuse it later, at a path the host did not hand over.
  test('refuses no bytes at all, as empty', () => {
    expect(refusalOf(() => toBase64Binary(new Uint8Array(0), 'pdf.bytes'))).toMatchObject({ rule: 'empty', path: 'pdf.bytes' })
  })

  // A string of the PDF's text, or an array of numbers, is not the bytes:
  // encoded through a conversion, a string's characters past 255 would be
  // bytes nobody gave.
  test.each([
    ['a string', '%PDF-1.4'],
    ['an array of numbers', [37, 80, 68, 70]],
    ['an ArrayBuffer', new ArrayBuffer(4)],
    ['a Uint16Array', new Uint16Array(4)],
  ])('refuses %s, as not bytes', (_, value) => {
    expect(refusalOf(() => toBase64Binary(value as never, 'pdf.bytes'))).toMatchObject({ rule: 'not-bytes', path: 'pdf.bytes' })
  })

  // The result is typed as what it was checked as, so a string that was
  // never encoded here does not stand where an encoded one is expected.
  test('is typed a FhirBase64Binary, which a plain string is not', () => {
    expectTypeOf(toBase64Binary(ascii('f'), 'Attachment.data')).toEqualTypeOf<FhirBase64Binary>()
    expectTypeOf<string>().not.toExtend<FhirBase64Binary>()
  })
})

describe('base64Binary', () => {
  test.each(VECTORS)('keeps the encoding of %j, %s', (_, written) => {
    expect(base64Binary(written, 'Attachment.hash')).toBe(written)
  })

  // R4's base64Binary is RFC 4648's base64. Its regex, `(\s*([0-9a-zA-Z\+\=]){4}\s*)+`,
  // is informative, and leaves `/` out: held to it, a third of all PDFs
  // would be refused.
  test("keeps a /, which R4's informative regex leaves out", () => {
    expect(base64Binary('+/8=', 'Attachment.data')).toBe('+/8=')
  })

  // One spelling for one value: a text that decodes to the same bytes as
  // another but is not written the same would give two hashes of the
  // document's JSON for one document, and a reader lenient about one of
  // these would read bytes nobody wrote.
  test.each([
    ['', 'nothing, which FHIR JSON never carries'],
    ['Zg', 'a quantum without its padding'],
    ['Zm9', 'three characters'],
    ['Zh==', 'bits the padding leaves that are not zero'],
    ['Zm9=', 'bits a single padding character leaves that are not zero'],
    ['Z===', 'three padding characters'],
    ['=Zg=', 'padding before the end'],
    ['Zg==Zg==', 'padding inside the text'],
    ['Zm9v\n', 'a line break, which R4 allows and the validator warns of'],
    ['Zm 9v', 'a space'],
    ['Zm-_', "base64url's alphabet"],
    ['====', 'padding alone'],
    ['Zg=A', 'a character after the padding'],
    ['Zm9\u00e9', 'a character past ASCII'],
  ])('refuses %j: %s', (text) => {
    expect(refusalOf(() => base64Binary(text, 'Attachment.hash'))).toMatchObject({ rule: 'grammar', path: 'Attachment.hash', type: 'base64Binary' })
  })

  // Asked of text only: anything else would be converted to a string
  // first, by code the value brings.
  test('refuses what is not a string', () => {
    expect(refusalOf(() => base64Binary(42 as never, 'Attachment.hash'))).toMatchObject({ rule: 'grammar', type: 'base64Binary' })
  })
})

describe('fromBase64Binary', () => {
  // A host reading a Binary back, and the tests that read an attached PDF
  // back, get the bytes that were written, every one.
  test.each(VECTORS)('reads %j back from %s', (text, written) => {
    expect([...fromBase64Binary(written, 'Binary.data')]).toEqual([...ascii(text)])
  })

  // A decoder that skipped what it does not know would read a document
  // nobody wrote; it refuses as the check does, at the path it was given,
  // and never quotes the text.
  test('refuses a text that is not canonical base64, quoting none of it', () => {
    const refusal = refusalOf(() => fromBase64Binary('Zm9vYmFy!', 'Binary.data'))
    expect(refusal).toMatchObject({ rule: 'grammar', path: 'Binary.data', type: 'base64Binary' })
    expect(refusal.message).not.toContain('Zm9vYmFy')
  })

  // A PDF of a few megabytes is what a document carries, and its base64
  // is millions of characters. A check that grows the stack with each
  // quantum, as a backtracking regex does, ran out of it on the base64 of
  // 4,000,000 bytes (5,333,336 characters, Node 24.21, 17 October 2026),
  // and threw a RangeError -- no Refusal, and no bytes back.
  test('checks and reads back the base64 of a PDF of several megabytes, every byte', () => {
    const bytes = new Uint8Array(6_000_000).map((_, index) => (index * 31 + (index >> 11)) & 0xff)
    const read = fromBase64Binary(toBase64Binary(bytes, 'Binary.data'), 'Binary.data')
    expect(read.length).toBe(bytes.length)
    expect(read.every((byte, index) => byte === bytes[index])).toBe(true)
  })
})
