import { toDocumentReference } from '@formancy/health-document'
import { validateReport } from '@formancy/report-spec'
import { describe, expect, test } from 'vitest'
import { referralContext, referralDocumentContext } from './documents.js'
import { renderReferral } from './pdf.js'
import { REFERRAL_DATA, REFERRAL_REPORT } from './referral.js'

const pdf = await renderReferral()

describe("the corpus's PDF", () => {
  // The definition is one Report's own validator accepts: a corpus report
  // Report refuses would prove nothing about the PDFs Report makes.
  test("is of a report Report's validator accepts", () => {
    const outcome = validateReport(REFERRAL_REPORT)
    expect(outcome.valid ? [] : outcome.errors.map((error) => `${error.code} ${error.path}`)).toEqual([])
  })

  // Rendered by @formancy/report-render-pdf 0.1.0's Node entry: a PDF, by
  // its first and last lines, of the size a one-page letter in one
  // embedded font has. What its pages say is Report's to prove, on the
  // PDF, with PDF.js (formancy.ai-report 0003).
  test('renders as a PDF', () => {
    const text = Buffer.from(pdf).toString('latin1')
    expect(text.startsWith('%PDF-1.3\n')).toBe(true)
    expect(text.endsWith('\n%%EOF\n')).toBe(true)
    expect(pdf.length).toBeGreaterThan(1_000)
  })

  // Report says the same document renders to the same bytes, its creation
  // date the caller's: the corpus rests on it, since the Bundle that
  // carries the PDF is asserted byte for byte.
  test('renders to the same bytes every time', async () => {
    expect(Buffer.from(await renderReferral()).equals(Buffer.from(pdf))).toBe(true)
  })

  // health-document's check of a plain PDF accepts what Report's renderer
  // writes: a header it knows and %%EOF on a line of its own.
  test('is a plain PDF to health-document', () => {
    const result = toDocumentReference({ bytes: pdf, profile: 'PDF' }, referralContext('data'))
    expect(result.ok).toBe(true)
  })

  // The acceptance: a declared PDF profile without proof is refused. Report
  // 0.1.0 writes no PDF/A, and nothing here has proved it would (plan 14),
  // so its PDF declared PDF/A is refused, naming the declaration and
  // nothing of the PDF.
  test.each(['PDF/A-1b', 'PDF/A-2b'] as const)('declared %s, is refused as unproved', (profile) => {
    const result = toDocumentReference({ bytes: pdf, profile }, referralContext('data'))
    expect(result.ok ? [] : result.refusals.map((refusal) => `${refusal.rule} ${refusal.path}`)).toEqual(['unproved pdf.profile'])
  })

  // The corpus's report must render: data Report refuses stops the corpus
  // loudly, naming each error's code and place and none of the data -- the
  // letter's names are made up, and a host's would not be.
  test("refused by Report, stops naming each error's code and place, and no value", async () => {
    const { patient: _left, ...header } = REFERRAL_DATA.header ?? {}
    const refused = renderReferral({ ...REFERRAL_DATA, header })
    await expect(refused).rejects.toThrow(/data missing-field at \/header\/patient/)
    await expect(refused).rejects.not.toThrow(/Synthetica|Probus/)
  })

  // And a PDF health-document refuses stops it the same way, before any
  // document is assembled of it.
  test('refused by health-document, stops before a document is assembled', () => {
    expect(() => referralDocumentContext({ pdf: new Uint8Array([0x25]), placement: 'data' })).toThrow(/refused the corpus's DocumentReference: pdf\.bytes: its bytes/)
  })
})
