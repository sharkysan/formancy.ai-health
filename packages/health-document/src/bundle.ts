/**
 * A document: R4's Bundle of type `document`, its Composition first and
 * then only what the Composition refers to, every reference resolved
 * before anything is written (0008).
 *
 * R4's rules for one (https://hl7.org/fhir/R4/bundle.html and
 * documents.html, read on 17 October 2026), and how each is held:
 *
 * - **bdl-9, bdl-10, bdl-11**: an identifier with a system and a value, a
 *   timestamp, a Composition first. The identifier "is never re-used" and
 *   is the host's, as the timestamp is; nothing here makes either.
 * - **When it was assembled.** documents.html calls `meta.lastUpdated`
 *   "The document date (mandatory)", which "identifies when the document
 *   bundle was assembled"; R4's `Bundle.timestamp` is "the date/time that
 *   the bundle was assembled", which bdl-10 asks for. One moment, given
 *   once: the host's timestamp is written as both, and the two cannot
 *   disagree.
 * - **Every resource referred to is in it**, "directly or indirectly (e.g.
 *   recursively)", and **only those**. R4 asks only what the Composition
 *   refers to to be included, and lets what those resources refer to be
 *   left out; here every reference in every entry is resolved, to an
 *   entry's `urn:uuid:`, or refused -- as `dangling` when it names
 *   nothing the Bundle holds, a `Type/id` included, since entries named by
 *   `urn:uuid:` answer to no other name; as `reference` when it is an
 *   address or names a type R4 does not allow there. Then every entry the
 *   Composition does not reach, following references forwards, is refused
 *   as `unreferenced`: never dropped. R4 also admits a stylesheet Binary
 *   and a Provenance that targets the Composition or another of its
 *   resources; H06 writes neither, and refuses both as unreferenced.
 * - **Names** are the host's `urn:uuid:`s, one per entry, so the same
 *   input gives the same Bundle and the same bytes; every Resource.id the
 *   host gives is held to R4's id grammar.
 *
 * Nothing here reads a clock or a random source, and the Bundle is
 * written by health-core's `writeJson`, which the host calls.
 */
import { id, instant, member, Refusals, reference, code, type FhirJsonObject, type Refusal } from '@formancy/health-core'
import { checkAttachments } from './attachments.js'
import { compositionOf, type Composed, type CompositionContext } from './composition.js'
import { CONTEXT, identifierAt, needed, optional, valueAt } from './context.js'
import { entriesOf, type DocumentEntry, type Entry } from './entries.js'
import { linksOf, type Link } from './links.js'
import type { Bundle, BundleEntry } from './resource.js'
import { targetsOf } from './targets.js'

/** What the host says of a document, and what it holds. */
export interface DocumentContext {
  /** The Bundle's id, when the host names it: R4's id. */
  readonly id?: string
  /** The document's identifier, globally unique and never re-used: the host's, with its system and its value. */
  readonly identifier: { readonly system: string; readonly value: string }
  /** When the document was assembled, an instant with its zone: written as its timestamp and its meta.lastUpdated. */
  readonly timestamp: string
  readonly composition: CompositionContext
  /** Every other resource of the document, each under its name, in the order the Bundle holds them. */
  readonly entries: readonly DocumentEntry[]
}

export type DocumentBundleExport = { readonly ok: true; readonly bundle: Bundle } | { readonly ok: false; readonly refusals: readonly Refusal[] }

/** What a name in the Bundle stands for: its resource type, or undefined for an entry whose resource was refused. */
type Names = ReadonlyMap<string, string | undefined>

/** The entries' names, each once: a second entry of a name is refused, and the first keeps it. */
function namesOf(composed: Composed, entries: readonly Entry[], refusals: Refusals): Names {
  const names = new Map<string, string | undefined>()
  if (composed.fullUrl !== undefined) names.set(composed.fullUrl, 'Composition')
  for (const entry of entries) {
    if (entry.fullUrl === undefined) continue
    if (names.has(entry.fullUrl)) refusals.add('duplicate-entry', member(entry.path, 'fullUrl'))
    else names.set(entry.fullUrl, entry.type)
  }
  return names
}

/** The name `link` resolves to in the Bundle, or undefined with its refusal recorded. */
function resolve(link: Link, names: Names, refusals: Refusals): string | undefined {
  if (link.attachment) {
    if (!names.has(link.target)) return refusals.add('dangling', link.path)
  } else {
    const checked = refusals.take(() => reference(link.target, link.path))
    if (checked === undefined) return undefined
    if (!names.has(checked)) return refusals.add('dangling', link.path)
  }
  // An entry whose resource was refused has no type to hold the link to;
  // it was refused for what it is.
  const type = names.get(link.target)
  if (type === undefined) return link.target
  const allowed = targetsOf(link.element)
  if ((allowed !== undefined && !allowed.includes(type)) || (link.declared !== undefined && link.declared !== type)) return refusals.add('reference', link.path)
  return link.target
}

/**
 * Every link of the Composition and the entries resolved, and every entry
 * the Composition does not reach refused -- when there is a Composition
 * and every entry was read, since otherwise what it reaches is not known.
 */
function checkLinks(composed: Composed, entries: readonly Entry[], refusals: Refusals): void {
  const names = namesOf(composed, entries, refusals)
  const from = new Map<string, string[]>()
  const documented = [
    ...(composed.composition === undefined ? [] : [{ fullUrl: composed.fullUrl, resource: composed.composition as FhirJsonObject, path: member(CONTEXT, 'composition') }]),
    ...entries.map((entry) => ({ fullUrl: entry.fullUrl, resource: entry.resource, path: member(entry.path, 'resource') })),
  ]
  for (const { fullUrl, resource, path } of documented) {
    if (resource === undefined) continue
    const targets = linksOf(resource, path).flatMap((link) => resolve(link, names, refusals) ?? [])
    if (fullUrl !== undefined) from.set(fullUrl, [...(from.get(fullUrl) ?? []), ...targets])
  }
  if (composed.fullUrl === undefined || composed.composition === undefined || entries.some((entry) => entry.resource === undefined || entry.fullUrl === undefined)) return
  const reached = new Set<string>([composed.fullUrl])
  const queue: string[] = [composed.fullUrl]
  for (let next = queue.shift(); next !== undefined; next = queue.shift()) {
    for (const target of from.get(next) ?? []) {
      if (reached.has(target)) continue
      reached.add(target)
      queue.push(target)
    }
  }
  for (const entry of entries) if (entry.fullUrl !== undefined && !reached.has(entry.fullUrl)) refusals.add('unreferenced', entry.path)
}

/**
 * The document `context` says, as a Bundle; or every reason it cannot be
 * one, each naming where in the context, and never a value.
 */
export function toDocumentBundle(context: DocumentContext): DocumentBundleExport {
  const refusals = new Refusals()
  const at = (name: string) => member(CONTEXT, name)
  const bundleId = optional(context, 'id', at('id'), refusals, id)
  const identifier = identifierAt(context, 'identifier', at('identifier'), refusals)
  const timestamp = needed(context, 'timestamp', at('timestamp'), refusals, instant)
  const composed = compositionOf(valueAt(context, 'composition') as CompositionContext | undefined, refusals)
  const entries = entriesOf(valueAt(context, 'entries'), refusals)
  if (entries !== undefined) {
    checkLinks(composed, entries, refusals)
    checkAttachments(entries, refusals)
  }
  const { fullUrl, composition } = composed
  if (refusals.count > 0 || identifier === undefined || timestamp === undefined || fullUrl === undefined || composition === undefined || entries === undefined) {
    return { ok: false, refusals: refusals.list }
  }
  // Every entry was read when nothing was refused.
  const rest = entries.map((entry) => ({ fullUrl: entry.fullUrl, resource: entry.resource }) as BundleEntry<FhirJsonObject>)
  const bundle: Bundle = {
    resourceType: 'Bundle',
    ...(bundleId === undefined ? {} : { id: bundleId }),
    meta: { lastUpdated: timestamp },
    identifier,
    type: code('document', 'Bundle.type'),
    timestamp,
    entry: [{ fullUrl, resource: composition }, ...rest],
  }
  return { ok: true, bundle }
}
