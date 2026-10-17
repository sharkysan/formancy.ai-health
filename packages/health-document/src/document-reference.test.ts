import { fromBase64Binary, Refusal, writeJson } from '@formancy/health-core'
import { describe, expect, test } from 'vitest'
import { toDocumentReference, type DocumentReferenceContext } from './document-reference.js'
import { bytesOf, CLINICAL_DOCUMENT, CONSULTATION, minimalPdf, NAMES, refusedAs } from './test-support.js'

/** What a host says of a referral letter's PDF: every element the package writes. */
const context: DocumentReferenceContext = {
  status: 'current',
  type: CONSULTATION,
  category: [CLINICAL_DOCUMENT],
  subject: { reference: NAMES.patient },
  date: '2026-10-17T10:00:00+02:00',
  author: [{ reference: NAMES.practitioner }],
  title: 'Zuweisung',
}

const pdf = { bytes: minimalPdf(), profile: 'PDF' } as const

/** The export, which must not be refused. */
function made(given: DocumentReferenceContext = context, attached = pdf) {
  const result = toDocumentReference(attached, given)
  if (!result.ok) throw new Error(`refused: ${result.refusals.map((refusal) => refusal.message).join('; ')}`)
  return result
}

describe('a DocumentReference of a PDF, its bytes in the attachment', () => {
  // The resource whole, as written: R4's elements in R4's order, the
  // media type application/pdf, the bytes as base64, their number and
  // their SHA-1 of the bytes themselves -- computed by Node's crypto for
  // these 26 bytes on 17 October 2026 -- and nothing the host did not say.
  test('is written exactly', () => {
    const { documentReference, binary } = made()
    expect(binary).toBeUndefined()
    expect(writeJson(documentReference)).toBe(
      '{"resourceType":"DocumentReference","status":"current",' +
        '"type":{"coding":[{"system":"http://terminology.hl7.org/CodeSystem/v2-0270","code":"CN","display":"Consultation"}]},' +
        '"category":[{"coding":[{"system":"http://terminology.hl7.org/CodeSystem/v3-ActClass","code":"DOCCLIN","display":"clinical document"}]}],' +
        `"subject":{"reference":"${NAMES.patient}"},"date":"2026-10-17T10:00:00+02:00","author":[{"reference":"${NAMES.practitioner}"}],` +
        '"content":[{"attachment":{"contentType":"application/pdf","data":"JVBERi0xLjcKJXN5bnRoZXRpYwolJUVPRgo=","size":26,"hash":"/uM6h4nE1frFPR+t4N4HN8WfAfI=","title":"Zuweisung"}}]}',
    )
  })

  // The acceptance's own words: the bytes are read back unchanged. Every
  // byte, decoded from what was written, compared with what was handed
  // over: a PDF of a few hundred kilobytes, every byte value among them.
  test('gives back every byte it was handed, read from the JSON it wrote', () => {
    const body = new Uint8Array(300_000).map((_, index) => (index * 31 + (index >> 9)) & 0xff)
    const bytes = new Uint8Array([...bytesOf('%PDF-1.4\n'), ...body, ...bytesOf('\n%%EOF\n')])
    const { documentReference } = made(context, { bytes, profile: 'PDF' })
    const attachment = documentReference.content[0].attachment
    expect(attachment.data).toBeDefined()
    const read = fromBase64Binary(attachment.data as string, 'content[0].attachment.data')
    expect(read.length).toBe(bytes.length)
    expect(read.every((byte, index) => byte === bytes[index])).toBe(true)
    expect(attachment.size.text).toBe(String(bytes.length))
  })

  // Only what the host says: a DocumentReference with no category and no
  // author, which R4 allows, has neither, and gains no default.
  test('writes no category and no author where the host gives none', () => {
    const { category: _category, author: _author, ...bare } = context
    const written = writeJson(made(bare).documentReference)
    expect(written).not.toContain('"category"')
    expect(written).not.toContain('"author"')
  })

  // A host that names its resource gets that id, held to R4's grammar.
  test("carries the host's id", () => {
    expect(made({ ...context, id: 'referral-letter-1' }).documentReference.id).toBe('referral-letter-1')
  })
})

describe('a DocumentReference of a PDF, its bytes in a Binary', () => {
  // The bytes once, in the Binary; the attachment names it by the
  // urn:uuid the Bundle will carry it under, with the same size and hash,
  // so that a receiver can check the Binary it resolves.
  test('names the Binary by its urn:uuid, and the Binary holds the bytes', () => {
    const { documentReference, binary } = made({ ...context, binary: { fullUrl: NAMES.binary, id: 'referral-letter-pdf' } })
    expect(writeJson(documentReference.content[0].attachment)).toBe(
      `{"contentType":"application/pdf","url":"${NAMES.binary}","size":26,"hash":"/uM6h4nE1frFPR+t4N4HN8WfAfI=","title":"Zuweisung"}`,
    )
    expect(binary).toBeDefined()
    expect(writeJson(binary as never)).toBe('{"resourceType":"Binary","id":"referral-letter-pdf","contentType":"application/pdf","data":"JVBERi0xLjcKJXN5bnRoZXRpYwolJUVPRgo="}')
  })

  // An address is where to fetch a person's record, which is the host's
  // to decide and never this package's; and a UUID in capitals is not one
  // R4 allows in a URI.
  test.each(['https://documents.synthetic.invalid/1', 'urn:uuid:5F3C2A10-8B4E-4C1D-9F6A-0D2E7B9C1A01'])("refuses %s as the Binary's name", (fullUrl) => {
    expect(refusedAs(toDocumentReference(pdf, { ...context, binary: { fullUrl } }))).toEqual(['grammar context.binary.fullUrl'])
  })

  // The Binary is an object of its name and its id; a bare name, or one
  // without its fullUrl, says nowhere to put the bytes.
  test('refuses a Binary given as a bare name, or without its fullUrl', () => {
    expect(refusedAs(toDocumentReference(pdf, { ...context, binary: NAMES.binary as never }))).toEqual(['absent context.binary'])
    expect(refusedAs(toDocumentReference(pdf, { ...context, binary: { id: 'referral-letter-pdf' } as never }))).toEqual(['absent context.binary.fullUrl'])
  })
})

describe('what the host says of a PDF beyond what is written', () => {
  // A member the context does not name -- a language, a Binary's media
  // type, a PDF's file name, a coding's version -- is something the host
  // meant to say, and the DocumentReference left it out without a word.
  // Each is refused as unmapped at the object that holds it, by
  // health-core's `known`, the member's name not repeated.
  test.each([
    ['the context', { ...context, language: 'de-CH' }, pdf, 'unmapped context', 'language'],
    ['the Binary', { ...context, binary: { fullUrl: NAMES.binary, contentType: 'application/pdf' } }, pdf, 'unmapped context.binary', 'contentType'],
    ['the type', { ...context, type: { ...CONSULTATION, version: '2.9' } }, pdf, 'unmapped context.type', 'version'],
    ['the subject', { ...context, subject: { reference: NAMES.patient, display: 'Synthetica Beispiel' } }, pdf, 'unmapped context.subject', 'display'],
    ['the PDF', context, { ...pdf, filename: 'zuweisung.pdf' }, 'unmapped pdf', 'filename'],
  ])('refuses a member %s does not name', (_, given, attached, refused, name) => {
    const result = toDocumentReference(attached as never, given as DocumentReferenceContext)
    expect(refusedAs(result)).toEqual([refused])
    expect(result.ok ? '' : result.refusals[0]?.message).not.toContain(name)
  })

  // A hole in a host's list, which JSON never has, is refused where it
  // stands rather than walked past.
  test('refuses a hole in a list, at its index', () => {
    const categories: unknown[] = [CLINICAL_DOCUMENT]
    categories[2] = CLINICAL_DOCUMENT
    expect(refusedAs(toDocumentReference(pdf, { ...context, category: categories as never }))).toEqual(['absent context.category[1]'])
  })
})

describe('what the host must say of a PDF', () => {
  // R4 makes each of these optional. A DocumentReference without one says
  // nothing a receiver files it by -- what it is, whose, when, under what
  // title -- and each is the host's, so a missing one is refused rather
  // than written without (0008).
  test.each(['status', 'type', 'subject', 'date', 'title'] as const)('refuses a DocumentReference without its %s', (name) => {
    const { [name]: _left, ...rest } = context
    expect(refusedAs(toDocumentReference(pdf, rest as DocumentReferenceContext))).toEqual([`absent context.${name}`])
  })

  // Each refused for what it is, at its path: a status R4's required
  // binding does not have, a date without its zone, which an instant
  // needs, an address for a subject, a type R4 does not allow as an
  // author, a code with no system, a title of nothing but spaces.
  test.each([
    ['a status R4 does not have', { status: 'final' }, 'unmapped context.status'],
    ['a date without its zone', { date: '2026-10-17T10:00:00' }, 'zone context.date'],
    ['a date without its time', { date: '2026-10-17' }, 'grammar context.date'],
    ['a subject by address', { subject: { reference: 'https://records.synthetic.invalid/Patient/1' } }, 'reference context.subject.reference'],
    ['a subject of a type R4 does not allow', { subject: { reference: 'Observation/1' } }, 'reference context.subject.reference'],
    ['an author of a type R4 does not allow', { author: [{ reference: 'Observation/1' }] }, 'reference context.author[0].reference'],
    ['no author in a list of them', { author: [] }, 'absent context.author'],
    ['a type without its system', { type: { code: 'CN' } }, 'absent context.type.system'],
    ['a category without its code', { category: [{ system: CLINICAL_DOCUMENT.system }] }, 'absent context.category[0].code'],
    ['an empty list of categories', { category: [] }, 'absent context.category'],
    ['a display of nothing', { type: { ...CONSULTATION, display: ' ' } }, 'absent context.type.display'],
    ['a title of spaces', { title: '   ' }, 'absent context.title'],
    ['an id R4 does not allow', { id: 'referral letter' }, 'grammar context.id'],
  ])('refuses %s', (_, change, refused) => {
    expect(refusedAs(toDocumentReference(pdf, { ...context, ...change } as DocumentReferenceContext))).toEqual([refused])
  })

  // A relative reference of a type R4 allows is a reference the receiver
  // resolves against its own base: the DocumentReference need not stand
  // in a Bundle.
  test('takes a subject and an author by Type/id', () => {
    const { documentReference } = made({ ...context, subject: { reference: 'Patient/synthetic-1' }, author: [{ reference: 'PractitionerRole/synthetic-2' }] })
    expect(documentReference.subject.reference).toBe('Patient/synthetic-1')
  })

  // Every refusal at once, the PDF's beside the context's, and none of
  // them a value: the title, the subject's address and the bytes are what
  // a host's log must not hold.
  test('refuses every thing at once, and quotes none of them', () => {
    const result = toDocumentReference(
      { bytes: bytesOf('Synthetischer Befund'), profile: 'PDF/A-2b' },
      { ...context, status: 'final' as never, subject: { reference: 'https://records.synthetic.invalid/Patient/Synthetica' }, title: '' },
    )
    expect(refusedAs(result)).toEqual(['unproved pdf.profile', 'not-pdf pdf.bytes', 'unmapped context.status', 'reference context.subject.reference', 'absent context.title'])
    const messages = result.ok ? [] : result.refusals.map((refusal) => refusal.message)
    for (const value of ['Synthetischer Befund', 'Synthetica', 'records.synthetic.invalid']) for (const message of messages) expect(message).not.toContain(value)
    expect(result.ok ? undefined : result.refusals[0]).toBeInstanceOf(Refusal)
  })

  // Nothing read from a clock, a random source or the host's other state:
  // the same PDF and the same context give the same bytes.
  test('gives the same bytes for the same input', () => {
    expect(writeJson(made().documentReference)).toBe(writeJson(made({ ...context }, { bytes: minimalPdf(), profile: 'PDF' }).documentReference))
  })

  // Written in R4's order whatever order the host names things in: a
  // context built another way -- a spread, a row's columns -- gives the
  // same resource, byte for byte, its Binary included.
  test("gives the same bytes whatever order the context's names are in", () => {
    const reversed = (value: unknown): unknown =>
      Array.isArray(value) ? value.map(reversed) : typeof value === 'object' && value !== null ? Object.fromEntries(Object.entries(value).reverse().map(([name, each]) => [name, reversed(each)])) : value
    const given = { ...context, id: 'referral-letter-1', binary: { fullUrl: NAMES.binary, id: 'referral-letter-pdf' } }
    const [ordered, backwards] = [made(given), made(reversed(given) as DocumentReferenceContext, { profile: 'PDF', bytes: minimalPdf() })]
    expect(writeJson(backwards.documentReference)).toBe(writeJson(ordered.documentReference))
    expect(writeJson(backwards.binary as never)).toBe(writeJson(ordered.binary as never))
  })
})
