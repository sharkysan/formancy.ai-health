/**
 * The corpus's PDF: the referral letter, resolved by Formancy Report
 * 0.1.0's runtime and drawn by its renderer, `@formancy/report-render-pdf`'s
 * Node entry, with pdfmake (formancy.ai-report 0005, 0011). These are
 * Report's released packages at exact versions, test support only: no
 * published package here depends on Report (0002, 0008).
 *
 * What the PDF says is Report's to prove, on the PDF (formancy.ai-report
 * 0003): its corpus reads every rendered page back with PDF.js. What this
 * corpus proves is Health's side: that the bytes Report produced are
 * attached, and read back, unchanged.
 */
import { resolveReport, type ReportData } from '@formancy/report-runtime'
import { renderPdf } from '@formancy/report-render-pdf'
import { REFERRAL_DATA, REFERRAL_MAX_PAGES, REFERRAL_OPTIONS, REFERRAL_REPORT } from './referral.js'

/**
 * The referral letter's PDF, of `data`, the corpus's own unless a test
 * gives other. Throws when Report refuses to resolve or to render it,
 * naming each error's code and place, never a value: the corpus's report
 * is one Report must render.
 */
export async function renderReferral(data: ReportData = REFERRAL_DATA): Promise<Uint8Array> {
  const resolution = resolveReport(REFERRAL_REPORT, data, REFERRAL_OPTIONS)
  if (!resolution.ok)
    throw new Error(`Report refused the corpus's referral: ${resolution.errors.map((error) => `${error.stage} ${error.code} at ${error.path}`).join('; ')}`)
  return renderPdf(resolution.document, { maxPages: REFERRAL_MAX_PAGES })
}
