import { Refusals } from '@formancy/health-core'
import { describe, expect, test } from 'vitest'
import { checkPdf, PDF_PROFILES, PROVED_PDF_PROFILES, type Pdf } from './pdf.js'
import { bytesOf, minimalPdf } from './test-support.js'

/** What checkPdf says of `pdf`: the bytes it keeps, and every refusal as `rule path`. */
function checked(pdf: Pdf) {
  const refusals = new Refusals()
  const bytes = checkPdf(pdf, refusals)
  return { bytes, refused: refusals.list.map((refusal) => `${refusal.rule} ${refusal.path}`) }
}

describe('a plain PDF', () => {
  // What can be read without a parser, and is: the header ISO 32000 puts
  // on the first line and the end-of-file marker it puts on the last. A
  // PDF that has both is attached; nothing here says more of it.
  test.each(['%PDF-1.0', '%PDF-1.3', '%PDF-1.4', '%PDF-1.7', '%PDF-2.0'])('with the header %s is attached', (header) => {
    expect(checked({ bytes: minimalPdf(header), profile: 'PDF' })).toEqual({ bytes: minimalPdf(header), refused: [] })
  })

  // ISO 32000 ends a line with CR, LF or CR LF, and the last line may
  // have its end-of-line or not: each writer chooses.
  test.each([
    ['nothing', ''],
    ['LF', '\n'],
    ['CR', '\r'],
    ['CR LF', '\r\n'],
  ])('ending %%%%EOF with %s is attached', (_, after) => {
    expect(checked({ bytes: bytesOf(`%PDF-1.4\n%%EOF${after}`), profile: 'PDF' }).refused).toEqual([])
  })

  // Each of these is not what ISO 32000 calls a PDF's first and last
  // lines, and an attachment declared application/pdf would be bytes a
  // receiver's viewer refuses -- an HTML error page saved as .pdf, a
  // truncated download, a PDF with something appended after it.
  test.each([
    ['no bytes at all', ''],
    ['an HTML page', '<html>%%EOF\n'],
    ['a header after a byte-order mark', `${String.fromCharCode(0xef, 0xbb, 0xbf)}%PDF-1.4\n%%EOF\n`],
    ['a version ISO 32000 does not have', '%PDF-1.8\n%%EOF\n'],
    ['a version past 2.0', '%PDF-3.0\n%%EOF\n'],
    ['a header that runs on into the next line', '%PDF-1.4 %%EOF\n'],
    ['no end-of-file marker: a file cut short', '%PDF-1.4\n1 0 obj\n'],
    ['a marker that is not alone on its line', '%PDF-1.4\nx%%EOF\n'],
    ['bytes after the marker', '%PDF-1.4\n%%EOF\nappended'],
    ['an empty line after the marker', '%PDF-1.4\n%%EOF\n\n'],
  ])('refuses %s, as not a PDF', (_, text) => {
    expect(checked({ bytes: bytesOf(text), profile: 'PDF' })).toEqual({ bytes: undefined, refused: ['not-pdf pdf.bytes'] })
  })

  // A string of a PDF's text is not its bytes; neither is a Node Buffer's
  // shape copied into an object.
  test.each([
    ['a string', '%PDF-1.4\n%%EOF\n'],
    ['no bytes given', undefined],
    ['an array of numbers', [...bytesOf('%PDF-1.4\n%%EOF\n')]],
  ])('refuses %s, as not bytes', (_, bytes) => {
    expect(checked({ bytes, profile: 'PDF' } as never).refused).toEqual(['not-bytes pdf.bytes'])
  })

  // The bytes kept are a copy, taken once: a host that reused its buffer
  // after handing it over would otherwise change a document already
  // checked, hashed and encoded.
  test('is kept as a copy of the bytes, taken when checked', () => {
    const given = minimalPdf('%PDF-1.4')
    const kept = checkPdf({ bytes: given, profile: 'PDF' }, new Refusals())
    given.fill(0)
    expect(kept).toEqual(minimalPdf('%PDF-1.4'))
  })

  // Node's Buffer is a Uint8Array whose slice shares its memory rather
  // than copying it, and a Buffer is what a Node host reads a PDF into.
  // Copied by slice, a Buffer the host reused -- or changed from a getter
  // on the context, read after the check -- would put bytes nobody
  // checked into the attachment, hashed and encoded as the PDF.
  test("is kept as a copy of bytes whose slice shares their memory, as Node's Buffer's does", () => {
    const given = minimalPdf('%PDF-1.4')
    Object.defineProperty(given, 'slice', { value: () => given })
    const kept = checkPdf({ bytes: given, profile: 'PDF' }, new Refusals())
    given.fill(0)
    expect(kept).toEqual(minimalPdf('%PDF-1.4'))
  })

  // The bytes are copied by calling nothing they bring: a slice of the
  // host's own that answers with a PDF would have an HTML page attached
  // as one.
  test('is copied without calling anything the bytes bring', () => {
    const given = bytesOf('<html>not a pdf</html>')
    Object.defineProperty(given, 'slice', { value: () => minimalPdf('%PDF-1.4') })
    expect(checked({ bytes: given, profile: 'PDF' })).toEqual({ bytes: undefined, refused: ['not-pdf pdf.bytes'] })
  })
})

describe('the declared profile', () => {
  // At H06 nothing has proved that a producer makes PDF/A (veraPDF comes
  // with H09), so a PDF/A declaration is refused, whatever the bytes say
  // of themselves: a receiver that files a document as PDF/A because this
  // package said so would archive what nobody checked.
  test.each(PDF_PROFILES.filter((profile) => profile !== 'PDF'))('%s, unproved, is refused', (profile) => {
    expect(checked({ bytes: minimalPdf('%PDF-1.4'), profile })).toEqual({ bytes: undefined, refused: ['unproved pdf.profile'] })
  })

  // The list of what is accepted is one entry long, and that is the claim
  // the package makes: a second entry is a decision 0008 does not make.
  test('accepts a plain PDF and nothing else', () => {
    expect(PROVED_PDF_PROFILES).toEqual(['PDF'])
  })

  // A profile nothing here names is not a lesser one: PDF/UA, a
  // misspelling, a lowercase pdf are each refused for what they are.
  test.each(['PDF/UA-1', 'pdf', 'PDF/A-2B', 'PDF/A'])('%s, unknown, is refused as unmapped', (profile) => {
    expect(checked({ bytes: minimalPdf('%PDF-1.4'), profile } as never).refused).toEqual(['unmapped pdf.profile'])
  })

  test('given as nothing, is refused as absent', () => {
    expect(checked({ bytes: minimalPdf('%PDF-1.4') } as never).refused).toEqual(['absent pdf.profile'])
  })

  // Every refusal at once: a host fixes both in one pass.
  test('is refused beside the bytes, both at once', () => {
    expect(checked({ bytes: bytesOf('not a pdf'), profile: 'PDF/A-2b' }).refused).toEqual(['unproved pdf.profile', 'not-pdf pdf.bytes'])
  })

  // Read from the object the host handed over, and from nothing else: a
  // pdf that is no object is refused for both of its parts.
  test('of a pdf that is no object, is refused with the bytes', () => {
    expect(checked(undefined as never).refused).toEqual(['absent pdf.profile', 'not-bytes pdf.bytes'])
  })
})
