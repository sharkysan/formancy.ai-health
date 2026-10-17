/**
 * A PDF the host hands over, and what it declares the PDF to be.
 *
 * The bytes come from the host: in practice from Formancy Report, which
 * health-corpus proves, but from any producer, since this package does not
 * depend on the renderer (plan section 9). The declaration is checked,
 * never assumed (0008):
 *
 * - **A profile is proved or refused.** The host says what the PDF is: a
 *   plain PDF, or one of the PDF/A conformance levels ISO 19005 defines.
 *   PDF/A is what the Swiss and German records ask for, and a receiver
 *   archives a document as one because its sender said so. At H06 no gate
 *   here proves that any producer makes PDF/A -- veraPDF arrives with H09,
 *   on a Report release that writes it -- so every PDF/A declaration is
 *   refused, naming why, whatever the bytes claim of themselves; nothing
 *   here ever writes one. A name that is no profile here, PDF/UA among
 *   them, is refused as unmapped.
 * - **A plain PDF is checked only as far as no parser is needed**: its
 *   first line is a header ISO 32000 defines, `%PDF-1.0` to `%PDF-1.7` or
 *   `%PDF-2.0`, at the first byte, and its last line is `%%EOF` alone,
 *   ended by one end-of-line or by nothing. That tells a PDF from an HTML
 *   error page, a truncated download or bytes appended to a PDF; it does
 *   not tell a well-formed PDF from a broken one, which only a parser
 *   could, and parsing untrusted PDFs is no part of this package. ISO
 *   32000 lets a reader look for the header in the first 1024 bytes and
 *   the marker in the last; a writer puts each at the edge, and nothing
 *   is searched for here.
 *
 * The bytes are copied once, when checked, and every later step -- the
 * size, the hash, the base64 -- reads the copy. The copy is made by
 * Uint8Array's own constructor, which reads the bytes and calls nothing
 * the value brings: not its `slice`, which on Node's Buffer shares the
 * Buffer's memory instead of copying it.
 */
import { known, member, type Refusals } from '@formancy/health-core'

/** Where a refusal of the PDF points: what the host handed over. */
export const PDF = 'pdf'

/** What a host may declare a PDF to be: plain, or an ISO 19005 conformance level. */
export const PDF_PROFILES = ['PDF', 'PDF/A-1a', 'PDF/A-1b', 'PDF/A-2a', 'PDF/A-2b', 'PDF/A-2u', 'PDF/A-3a', 'PDF/A-3b', 'PDF/A-3u', 'PDF/A-4', 'PDF/A-4e', 'PDF/A-4f'] as const

export type PdfProfile = (typeof PDF_PROFILES)[number]

/**
 * The declarations this package attaches a PDF under: those a gate here
 * has proved a producer makes. Only a plain PDF, which needs no proof
 * beyond the header and the trailer.
 */
export const PROVED_PDF_PROFILES: readonly PdfProfile[] = ['PDF']

/** The PDF a host attaches: its bytes, and what it declares them to be. */
export interface Pdf {
  readonly bytes: Uint8Array
  readonly profile: PdfProfile
}

const KNOWN: ReadonlySet<unknown> = new Set(PDF_PROFILES)
const PROVED: ReadonlySet<unknown> = new Set(PROVED_PDF_PROFILES)

/** ISO 32000's headers: PDF 1.0 to 1.7, and 2.0. */
const HEADERS = ['%PDF-1.0', '%PDF-1.1', '%PDF-1.2', '%PDF-1.3', '%PDF-1.4', '%PDF-1.5', '%PDF-1.6', '%PDF-1.7', '%PDF-2.0']

const CR = 0x0d
const LF = 0x0a
const MARKER = '%%EOF'

/** Whether `bytes` hold `text`, ASCII, at `at`. */
function holds(bytes: Uint8Array, text: string, at: number): boolean {
  if (at < 0 || at + text.length > bytes.length) return false
  for (let index = 0; index < text.length; index += 1) if (bytes[at + index] !== text.charCodeAt(index)) return false
  return true
}

const isEndOfLine = (byte: number | undefined) => byte === CR || byte === LF

/** Whether the first line is a header and the last `%%EOF` alone, as above. */
function looksLikeAPdf(bytes: Uint8Array): boolean {
  const header = HEADERS.find((text) => holds(bytes, text, 0))
  if (header === undefined || !isEndOfLine(bytes[header.length])) return false
  const last = bytes.length
  // One end-of-line after the marker, or none: CR LF, LF or CR.
  const after = bytes[last - 2] === CR && bytes[last - 1] === LF ? 2 : isEndOfLine(bytes[last - 1]) ? 1 : 0
  const marker = last - after - MARKER.length
  return marker > header.length && holds(bytes, MARKER, marker) && isEndOfLine(bytes[marker - 1])
}

/**
 * The PDF's bytes, copied, if they look like a PDF and their profile is
 * one this package attaches; undefined otherwise, with every reason in
 * `refusals`. Paths start at `pdf`.
 */
export function checkPdf(pdf: Pdf, refusals: Refusals): Uint8Array | undefined {
  const given: Partial<Pdf> = typeof pdf === 'object' && pdf !== null ? pdf : {}
  const before = refusals.count
  // A member the PDF is not read for -- a file name, a title -- is the
  // host's to say elsewhere, and would be left out without a word.
  if (given === pdf) known(pdf, ['bytes', 'profile'], PDF, refusals)
  const profile: unknown = given.profile
  const profileAt = member(PDF, 'profile')
  if (profile === undefined) refusals.add('absent', profileAt)
  else if (!KNOWN.has(profile)) refusals.add('unmapped', profileAt)
  else if (!PROVED.has(profile)) refusals.add('unproved', profileAt)
  const bytes: unknown = given.bytes
  const bytesAt = member(PDF, 'bytes')
  if (!(bytes instanceof Uint8Array)) return refusals.add('not-bytes', bytesAt)
  const copy = new Uint8Array(bytes)
  if (!looksLikeAPdf(copy)) return refusals.add('not-pdf', bytesAt)
  return refusals.count > before ? undefined : copy
}
