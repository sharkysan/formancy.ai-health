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
 * The Composition's own narrative is written here, and never taken from a
 * host (0009): a guide may require one -- CH ORF makes Composition.text
 * 1..1 -- and R4 presents a document by the Composition's narrative and
 * its sections'. It is R4's `generated`, "entirely generated from the
 * core elements in the content": the Composition's title as a heading,
 * and each section's title as one below it, escaped by health-core's
 * xhtmlText, and nothing else. It shows what the Composition says of
 * itself and nothing of the resources it refers to, which carry no
 * narrative of their own (0006, 0008); a receiver renders those.
 *
 * The references are checked as references by name here; what each names
 * is the Bundle's to resolve (bundle.ts), and the types R4 allows an
 * author are checked there, against the entry it resolves to.
 */
import {
  code,
  codeOf,
  dateTime,
  id,
  item,
  known,
  member,
  needed,
  optional,
  readItems,
  text,
  uri,
  uuid,
  valueAt,
  xhtmlText,
  type FhirUuid,
  type Refusals,
} from '@formancy/health-core'
import { conceptAt, conceptsAt, CONTEXT, identifierAt, referenceAt, referencesAt, type ByName, type Coded } from './context.js'
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
  /** The profile the Composition claims, a canonical the host names, such as a guide's with its version: never fetched. */
  readonly profile?: string
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

/** The members of what the host says of the Composition, each by R4's name, and of a section. */
const COMPOSITION_MEMBERS = ['fullUrl', 'id', 'profile', 'identifier', 'status', 'type', 'category', 'subject', 'date', 'author', 'title', 'section']
const SECTION_MEMBERS = ['title', 'code', 'entry']

function sectionAt(sections: readonly unknown[], index: string, path: string, refusals: Refusals): CompositionSection | undefined {
  const given = valueAt(sections, index)
  if (!known(given, SECTION_MEMBERS, path, refusals)) return undefined
  const title = needed(given, 'title', member(path, 'title'), refusals, text)
  const sectionCode = valueAt(given, 'code') === undefined ? undefined : conceptAt(given, 'code', member(path, 'code'), refusals)
  const entry = referencesAt(given, 'entry', member(path, 'entry'), refusals)
  if (title === undefined || entry === undefined) return undefined
  return { title, ...(sectionCode === undefined ? {} : { code: sectionCode }), entry }
}

/** The XHTML namespace R4 requires of a narrative's div. */
const XHTML = 'http://www.w3.org/1999/xhtml'

/**
 * The Composition's narrative, of its title and its sections' titles,
 * each escaped. Every title was read by health-core's `text`, which
 * refuses, where the title stands, each character XML cannot carry, by
 * the one rule `xhtmlText` holds too (characters.ts): escaping one cannot
 * fail here.
 */
function narrativeOf(title: string, sections: readonly CompositionSection[]): Composition['text'] {
  const headings = sections
    .map((section, index) => `<h2>${xhtmlText(section.title, member(item(member(COMPOSITION, 'section'), index), 'title'))}</h2>`)
    .join('')
  const div = `<div xmlns="${XHTML}"><h1>${xhtmlText(title, member(COMPOSITION, 'title'))}</h1>${headings}</div>`
  return { status: code('generated', 'Composition.text.status'), div }
}

function sectionsAt(context: object, refusals: Refusals): CompositionSection[] | undefined {
  const given = valueAt(context, 'section')
  if (!Array.isArray(given) || given.length === 0) return refusals.add('absent', member(COMPOSITION, 'section'))
  const sections = readItems(given, member(COMPOSITION, 'section'), (index, at) => sectionAt(given, index, at, refusals))
  return sections.every((section) => section !== undefined) ? sections : undefined
}

/** The Composition `context` says, or what of it could be read, with every reason it cannot be in `refusals`. */
export function compositionOf(context: CompositionContext | undefined, refusals: Refusals): Composed {
  const before = refusals.count
  if (!known(context, COMPOSITION_MEMBERS, COMPOSITION, refusals)) return { fullUrl: undefined, composition: undefined }
  const at = (name: string) => member(COMPOSITION, name)
  const fullUrl = needed(context, 'fullUrl', at('fullUrl'), refusals, uuid)
  const resourceId = optional(context, 'id', at('id'), refusals, id)
  const profile = optional(context, 'profile', at('profile'), refusals, uri)
  const identifier = valueAt(context, 'identifier') === undefined ? undefined : identifierAt(context, 'identifier', at('identifier'), refusals)
  const status = needed(context, 'status', at('status'), refusals, codeOf(COMPOSITION_STATUSES))
  const type = conceptAt(context, 'type', at('type'), refusals)
  const category = conceptsAt(context, 'category', at('category'), refusals)
  const subject = referenceAt(context, 'subject', at('subject'), refusals)
  const date = needed(context, 'date', at('date'), refusals, dateTime)
  const author = referencesAt(context, 'author', at('author'), refusals, targetsOf('Composition.author'))
  const title = needed(context, 'title', at('title'), refusals, text)
  const section = sectionsAt(context, refusals)
  if (
    refusals.count > before ||
    status === undefined ||
    type === undefined ||
    subject === undefined ||
    date === undefined ||
    author === undefined ||
    title === undefined ||
    section === undefined
  ) {
    return { fullUrl, composition: undefined }
  }
  const composition: Composition = {
    resourceType: 'Composition',
    ...(resourceId === undefined ? {} : { id: resourceId }),
    ...(profile === undefined ? {} : { meta: { profile: [profile] } }),
    text: narrativeOf(title, section),
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
