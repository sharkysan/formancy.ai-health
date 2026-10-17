/**
 * A document's Composition, from what the host says of it (0008).
 *
 * R4 asks of a Composition its status, type, date, author and title;
 * section 9 of the plan asks its subject too, and sections of entries,
 * since a document of nobody's, or of nothing, is not one this package
 * assembles. Every part is the host's -- its codes, its references by
 * name, its date from the host's clock -- and checked where it stands in
 * the context, whose names are R4's: `section`, `entry`, `author`. A
 * section is its title, its code where the host gives one, and its
 * entries: no narrative, which a section's text would be, and which the
 * resources it refers to say in their own way (0006 decided the same of a
 * Questionnaire). cmp-1 then holds by the entries.
 *
 * The references are checked as references by name here; what each names
 * is the Bundle's to resolve (bundle.ts), and the types R4 allows an
 * author are checked there, against the entry it resolves to.
 */
import { dateTime, id, item, member, uuid, type FhirUuid, type Refusals } from '@formancy/health-core'
import { codeOf, conceptAt, conceptsAt, CONTEXT, identifierAt, needed, optional, referenceAt, referencesAt, text, valueAt, type ByName, type Coded } from './context.js'
import type { Composition, CompositionSection } from './resource.js'
import { targetsOf } from './targets.js'

/** R4's CompositionStatus, the codes `Composition.status` is bound to, required. */
export const COMPOSITION_STATUSES = ['preliminary', 'final', 'amended', 'entered-in-error'] as const

/** A section of the document: its title, its code when the host gives one, and the entries it holds, by name. */
export interface SectionContext {
  readonly title: string
  readonly code?: Coded
  readonly entry: readonly ByName[]
}

/** What the host says of the document's Composition. */
export interface CompositionContext {
  /** The Composition's name in the Bundle: a `urn:uuid:` the host gives, as every entry's. */
  readonly fullUrl: string
  readonly id?: string
  /** The Composition's own identifier, the same for every document made of it; R4 makes it optional, as here. */
  readonly identifier?: { readonly system: string; readonly value: string }
  readonly status: (typeof COMPOSITION_STATUSES)[number]
  readonly type: Coded
  readonly category?: readonly Coded[]
  /** Whose document it is: the `urn:uuid:` of an entry. */
  readonly subject: ByName
  /** When the author last changed it, a dateTime with its zone: the host's clock, never read here. */
  readonly date: string
  readonly author: readonly ByName[]
  readonly title: string
  readonly section: readonly SectionContext[]
}

/** The Composition, checked: its name and the resource, each undefined where it was refused. */
export interface Composed {
  readonly fullUrl: FhirUuid | undefined
  readonly composition: Composition | undefined
}

/** Where the Composition's context stands in what the host handed over. */
export const COMPOSITION = member(CONTEXT, 'composition')

function sectionAt(sections: readonly unknown[], index: number, refusals: Refusals): CompositionSection | undefined {
  const path = item(member(COMPOSITION, 'section'), index)
  const given = sections[index]
  if (typeof given !== 'object' || given === null) return refusals.add('absent', path)
  const title = needed(given, 'title', member(path, 'title'), refusals, text)
  const sectionCode = valueAt(given, 'code') === undefined ? undefined : conceptAt(given, 'code', member(path, 'code'), refusals)
  const entry = referencesAt(given, 'entry', member(path, 'entry'), refusals)
  if (title === undefined || entry === undefined) return undefined
  return { title, ...(sectionCode === undefined ? {} : { code: sectionCode }), entry }
}

function sectionsAt(context: object, refusals: Refusals): CompositionSection[] | undefined {
  const given = valueAt(context, 'section')
  if (!Array.isArray(given) || given.length === 0) return refusals.add('absent', member(COMPOSITION, 'section'))
  const sections = given.map((_, index) => sectionAt(given, index, refusals))
  return sections.every((section) => section !== undefined) ? sections : undefined
}

/** The Composition `context` says, or what of it could be read, with every reason it cannot be in `refusals`. */
export function compositionOf(context: CompositionContext | undefined, refusals: Refusals): Composed {
  if (typeof context !== 'object' || context === null) return { fullUrl: refusals.add('absent', COMPOSITION), composition: undefined }
  const before = refusals.count
  const at = (name: string) => member(COMPOSITION, name)
  const fullUrl = needed(context, 'fullUrl', at('fullUrl'), refusals, uuid)
  const resourceId = optional(context, 'id', at('id'), refusals, id)
  const identifier = valueAt(context, 'identifier') === undefined ? undefined : identifierAt(context, 'identifier', at('identifier'), refusals)
  const status = needed(context, 'status', at('status'), refusals, codeOf(COMPOSITION_STATUSES))
  const type = conceptAt(context, 'type', at('type'), refusals)
  const category = conceptsAt(context, 'category', at('category'), refusals)
  const subject = referenceAt(context, 'subject', at('subject'), refusals)
  const date = needed(context, 'date', at('date'), refusals, dateTime)
  const author = referencesAt(context, 'author', at('author'), refusals, targetsOf('Composition.author'))
  const title = needed(context, 'title', at('title'), refusals, text)
  const section = sectionsAt(context, refusals)
  if (refusals.count > before || status === undefined || type === undefined || subject === undefined || date === undefined || author === undefined || title === undefined || section === undefined) {
    return { fullUrl, composition: undefined }
  }
  const composition: Composition = {
    resourceType: 'Composition',
    ...(resourceId === undefined ? {} : { id: resourceId }),
    ...(identifier === undefined ? {} : { identifier }),
    status,
    type,
    ...(category === undefined ? {} : { category }),
    subject,
    date,
    author,
    title,
    section,
  }
  return { fullUrl, composition }
}
