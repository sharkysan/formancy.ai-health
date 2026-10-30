/**
 * What a document's DocumentReferences say of their PDFs' bytes, held to
 * the bytes they carry or name (0008).
 *
 * toDocumentReference computes an attachment's size and SHA-1 from the
 * bytes it encodes. A document, though, is assembled from the host's
 * resources, and a host can pair a DocumentReference with another PDF's
 * Binary -- two letters' Binaries swapped -- or hand over one written
 * elsewhere. The HL7 validator recomputes an attachment's size and hash
 * from its data, and not from a Binary its url names ("not a directly
 * accessible link", measured on 17 October 2026), so nothing else would
 * see a document that describes one PDF and carries another. Each
 * attachment of a DocumentReference's content is held here to its bytes:
 * a size or a hash it states must be theirs, and the media type it states
 * must be the one the Binary it names states. An attachment that states
 * neither size nor hash claims nothing of the bytes, as R4 lets it, and
 * bytes that are not base64Binary's one spelling cannot be counted or
 * hashed, so they are refused as health-core's `fromBase64Binary` refuses
 * them. An attachment url that names no Binary is the links' to refuse
 * (bundle.ts), and is not looked at here.
 */
import { fromBase64Binary, isFhirNumber, item, member, toBase64Binary, type FhirJson, type FhirJsonObject, type Refusals } from '@formancy/health-core'
import type { Entry } from './entries.js'
import { isObject } from './links.js'
import { sha1 } from './sha1.js'

/** A resource, and where it stands in what the host handed over. */
interface Placed {
  readonly resource: FhirJsonObject
  readonly path: string
}

/** The base64 text of the bytes `attachment` describes, and where it stands: its own data, or the data of the Binary it names. */
function describedBytes(attachment: FhirJsonObject, path: string, binary: Placed | undefined): { readonly text: string; readonly at: string } | undefined {
  const data = attachment['data']
  if (typeof data === 'string') return { text: data, at: member(path, 'data') }
  const held = binary?.resource['data']
  return binary !== undefined && typeof held === 'string' ? { text: held, at: member(binary.path, 'data') } : undefined
}

/** The attachment at `path`, held to the bytes it carries or names; every disagreement in `refusals`. */
function checkAttachment(attachment: FhirJsonObject, path: string, binaries: ReadonlyMap<FhirJson, Placed>, refusals: Refusals): void {
  const binary = binaries.get(attachment['url'] ?? '')
  if (binary !== undefined && attachment['contentType'] !== binary.resource['contentType']) refusals.add('mismatch', member(path, 'contentType'))
  const { size, hash } = attachment
  if (size === undefined && hash === undefined) return
  const described = describedBytes(attachment, path, binary)
  if (described === undefined) return
  const bytes = refusals.take(() => fromBase64Binary(described.text, described.at))
  if (bytes === undefined) return
  if (size !== undefined && !(isFhirNumber(size) && size.text === String(bytes.length))) refusals.add('mismatch', member(path, 'size'))
  if (hash !== undefined && hash !== toBase64Binary(sha1(bytes), member(path, 'hash'))) refusals.add('mismatch', member(path, 'hash'))
}

/** Every DocumentReference's attachments among `entries`, each held to its bytes, in the order the document holds them. */
export function checkAttachments(entries: readonly Entry[], refusals: Refusals): void {
  const binaries = new Map<FhirJson, Placed>()
  for (const { fullUrl, type, resource, path } of entries)
    if (fullUrl !== undefined && type === 'Binary' && resource !== undefined) binaries.set(fullUrl, { resource, path: member(path, 'resource') })
  for (const { type, resource, path } of entries) {
    const content = type === 'DocumentReference' ? resource?.['content'] : undefined
    if (!Array.isArray(content)) continue
    content.forEach((each: FhirJson, index: number) => {
      const attachment = isObject(each) ? each['attachment'] : undefined
      if (isObject(attachment)) checkAttachment(attachment, member(item(member(member(path, 'resource'), 'content'), index), 'attachment'), binaries, refusals)
    })
  }
}
