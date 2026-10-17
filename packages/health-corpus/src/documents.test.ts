import { createHash } from 'node:crypto'
import { readJson, writeJson, type FhirJson } from '@formancy/health-core'
import { toDocumentBundle, toDocumentReference, type Bundle } from '@formancy/health-document'
import { describe, expect, test } from 'vitest'
import { NAMES, referralContext, referralDocument, referralDocumentContext, type Placement } from './documents.js'
import { renderReferral } from './pdf.js'
import { REFERRAL_DATA } from './referral.js'

const pdf = await renderReferral()

/** The document of the corpus's PDF, which health-document must not refuse. */
function bundled(placement: Placement, response?: Parameters<typeof referralDocument>[0]['response']): Bundle {
  const result = referralDocument({ pdf, placement, ...(response === undefined ? {} : { response }) })
  if (!result.ok) throw new Error(`refused: ${result.refusals.map((refusal) => refusal.message).join('; ')}`)
  return result.bundle
}

type Read = { readonly [name: string]: FhirJson }

/**
 * The bundle as written, read back from its text by health-core: every
 * check below reads what a receiver reads, never the object that was
 * written.
 */
const readBack = (bundle: Bundle) => readJson(writeJson(bundle)) as Read

/** The resource of the entry named `fullUrl` in a bundle read back. */
function entry(bundle: Read, fullUrl: string): Read {
  const found = (bundle['entry'] as readonly Read[]).find((each) => each['fullUrl'] === fullUrl)
  if (found === undefined) throw new Error(`no entry ${fullUrl}`)
  return found['resource'] as Read
}

/** The DocumentReference's attachment, read back. */
const attachmentOf = (bundle: Read) => ((entry(bundle, NAMES.documentReference)['content'] as readonly Read[])[0] as Read)['attachment'] as Read

/** The text of a FhirNumber read back. */
const digits = (value: FhirJson) => (value as { readonly text: string }).text

const sha1 = (bytes: Uint8Array) => createHash('sha1').update(bytes).digest('base64')

describe("the corpus's PDF, attached to a document", () => {
  // The acceptance: PDF bytes from @formancy/report-render-pdf 0.1.0,
  // attached and read back unchanged. Decoded here by Node's own base64,
  // not by health-core's, from the JSON text the Bundle was written as,
  // and compared byte for byte.
  test('in the attachment, reads back as every byte Report rendered', () => {
    const attachment = attachmentOf(readBack(bundled('data')))
    const read = Buffer.from(attachment['data'] as string, 'base64')
    expect(read.length).toBe(pdf.length)
    expect(read.equals(Buffer.from(pdf))).toBe(true)
    expect(attachment['contentType']).toBe('application/pdf')
    expect(attachment['url']).toBeUndefined()
  })

  // R4's size and SHA-1 are of the bytes, before base64; Node's crypto
  // computes the hash here, independently of health-document's own.
  test('in the attachment, says the size and the SHA-1 of those bytes', () => {
    const attachment = attachmentOf(readBack(bundled('data')))
    expect(digits(attachment['size'] as FhirJson)).toBe(String(pdf.length))
    expect(attachment['hash']).toBe(sha1(pdf))
  })

  // A Node host reads a PDF into a Buffer, whose slice shares its memory
  // rather than copying it. The bytes attached are a copy taken when they
  // were checked, so a Buffer the host reuses after handing it over --
  // here from the context's title, which is read after the check --
  // changes nothing in the attachment or its hash.
  test('in the attachment, keeps the bytes of a Buffer the host reuses after handing it over', () => {
    const buffer = Buffer.from(pdf)
    const context = referralContext('data')
    const reusing = Object.defineProperty({ ...context }, 'title', {
      enumerable: true,
      get: () => {
        buffer.fill(0x20)
        return context.title
      },
    })
    const result = toDocumentReference({ bytes: buffer, profile: 'PDF' }, reusing)
    const attachment = result.ok ? result.documentReference.content[0].attachment : undefined
    expect(Buffer.from(attachment?.data ?? '', 'base64').equals(Buffer.from(pdf))).toBe(true)
    expect(attachment?.hash).toBe(sha1(pdf))
  })

  // In a Binary of the same Bundle, which the attachment's url names:
  // the bytes once, in the Binary, and the size and hash in the
  // attachment that a receiver checks the Binary against.
  test('in a Binary, reads back as every byte Report rendered, named by the attachment', () => {
    const bundle = readBack(bundled('binary'))
    const attachment = attachmentOf(bundle)
    expect(attachment['data']).toBeUndefined()
    expect(attachment['url']).toBe(NAMES.binary)
    const binary = entry(bundle, NAMES.binary)
    expect(binary['contentType']).toBe('application/pdf')
    expect(Buffer.from(binary['data'] as string, 'base64').equals(Buffer.from(pdf))).toBe(true)
    expect(digits(attachment['size'] as FhirJson)).toBe(String(pdf.length))
    expect(attachment['hash']).toBe(sha1(pdf))
  })

  // Section 10: the same input gives byte-identical JSON. The PDF is
  // rendered again, the document assembled again, and the two texts are
  // the same, every byte.
  test.each(['data', 'binary'] as const)('with its bytes in %s, gives byte-identical JSON for the same input', async (placement) => {
    const again = await renderReferral()
    const result = referralDocument({ pdf: again, placement })
    expect(result.ok && writeJson(result.bundle)).toBe(writeJson(bundled(placement)))
  })

  // Two letters Report rendered, their Binaries swapped: the document
  // would describe one PDF and carry the other, and the validator does not
  // look inside a Binary an attachment names. health-document holds the
  // attachment to the Binary's bytes, and refuses.
  test("with another letter's Binary in place of its own, is refused for the size and the hash", async () => {
    const other = await renderReferral({ ...REFERRAL_DATA, header: { ...REFERRAL_DATA.header, question: 'Eine andere synthetische Fragestellung, länger als die erste.' } })
    const swapped = referralDocumentContext({ pdf: other, placement: 'binary' }).entries.find((each) => each.fullUrl === NAMES.binary)
    const context = referralDocumentContext({ pdf, placement: 'binary' })
    const entries = context.entries.map((each) => (each.fullUrl === NAMES.binary && swapped !== undefined ? swapped : each))
    const result = toDocumentBundle({ ...context, entries })
    expect(result.ok ? [] : result.refusals.map((refusal) => `${refusal.rule} ${refusal.path}`)).toEqual([
      'mismatch context.entries[2].resource.content[0].attachment.size',
      'mismatch context.entries[2].resource.content[0].attachment.hash',
    ])
  })

  // The acceptance: a dangling reference refuses the Bundle. Without the
  // patient's entry, the Composition's subject and the DocumentReference's
  // name nothing the document holds.
  test('without the patient it refers to, is refused for each dangling reference', () => {
    const context = referralDocumentContext({ pdf, placement: 'data' })
    const result = toDocumentBundle({ ...context, entries: context.entries.filter((each) => each.fullUrl !== NAMES.patient) })
    expect(result.ok ? [] : result.refusals.map((refusal) => `${refusal.rule} ${refusal.path}`)).toEqual([
      'dangling context.composition.subject.reference',
      'dangling context.entries[1].resource.subject.reference',
    ])
  })

  // A QuestionnaireResponse the host made of a form beside the letter,
  // in a section of its own, its subject and author the document's.
  test('carries a QuestionnaireResponse beside the PDF, in a section of its own', () => {
    const response = { resourceType: 'QuestionnaireResponse', status: 'completed', subject: { reference: NAMES.patient }, author: { reference: NAMES.practitioner } }
    const bundle = readBack(bundled('data', response))
    expect(writeJson(entry(bundle, NAMES.response))).toBe(writeJson(response))
    const sections = entry(bundle, NAMES.composition)['section'] as readonly Read[]
    expect(writeJson(sections[1] as Read)).toBe(`{"title":"Formular","entry":[{"reference":"${NAMES.response}"}]}`)
  })
})

describe("health-document's SHA-1, from outside", () => {
  // The hash is computed by health-document's own SHA-1, which its tests
  // hold to FIPS 180's vectors; here every length across the first block
  // boundaries, where the padding and the length move, is held to Node's
  // crypto (OpenSSL) on PDFs of that many bytes.
  test("is Node's for every length from the smallest PDF to past two blocks", () => {
    const differ: number[] = []
    for (let extra = 0; extra <= 140; extra += 1) {
      const bytes = Buffer.from(`%PDF-1.4\n${'x'.repeat(extra)}\n%%EOF\n`, 'latin1')
      const result = toDocumentReference({ bytes: new Uint8Array(bytes), profile: 'PDF' }, referralContext('data'))
      const hash = result.ok ? result.documentReference.content[0].attachment.hash : undefined
      if (hash !== sha1(bytes)) differ.push(bytes.length)
    }
    expect(differ).toEqual([])
  })
})
