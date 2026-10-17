/**
 * A CH ORF document: what the host says of a referral, as CH ORF 3.0.2's
 * document Bundle on CH Core 6.0.0, assembled by health-document (0009).
 *
 * CH ORF's document (StructureDefinition `ch-orf-document`, on CH Core's
 * `ch-core-document`) asks an identifier under `urn:ietf:rfc:3986`, a
 * timestamp, the Composition first, at least one ServiceRequest, and at
 * most one QuestionnaireResponse; its Composition (`ch-orf-composition`)
 * a narrative, one category, a ch-core-patient as its subject, a
 * ch-core-practitionerrole as its only author, and the order-referral
 * section, coded LOINC 93037-0, holding at least one ServiceRequest and at
 * most one response (read from the ch.fhir.ig.ch-orf 3.0.2 package on
 * 17 October 2026). The Questionnaire is carried by its canonical, which
 * the response names with its version and the host publishes; the
 * profile's place for it inside the Bundle is left empty, though CH ORF's
 * prose asks a document to include what the resources it refers to refer
 * to (0009 names that cost).
 *
 * How it is made, each part decided once:
 *
 * - **health-ch** reads its own context: the people, the orders and the
 *   identifiers, which it writes as CH Core's and CH ORF's resources; the
 *   host's answers, held to what CH ORF asks of them; every entry's name,
 *   each a `urn:uuid:` given once, since its references are written from
 *   them; and which members a part may have. Its refusals come all at
 *   once.
 * - **health-document**, given a context health-ch accepted, assembles the
 *   Bundle and its Composition, deciding what the Composition's own values
 *   must be -- its status, type, category, date, titles and its narrative
 *   -- and the document's timestamp, resolving every reference, and
 *   copying the host's answers. Its refusals of the host's own values are
 *   given at the host's paths (`reRooted`); one of anything health-ch
 *   wrote is a bug, and thrown as one. A context wrong for both is
 *   refused for health-ch's reasons first.
 *
 * The entries stand in the order CH ORF's own example Bundle has them
 * (`Bundle-bundle-order-referral-form.json`): the Composition, the
 * patient, the answers, the orders, the author's role, the practitioner
 * and the organisation. Nothing is sent: CH ORF's "Submit Bundle [CH
 * ORF-1]" is the host's to make.
 */
import { item, known, member, needed, objectAt, Refusal, Refusals, uuid, valueAt, type FhirJsonObject, type FhirUuid } from '@formancy/health-core'
import { toDocumentBundle, type Bundle, type Coded, type CompositionContext, type DocumentContext, type DocumentEntry } from '@formancy/health-document'
import { CONTEXT, type ChOrfContext } from './context.js'
import { authorOf, patientOf, type Authored, type Written } from './people.js'
import { CH_ORF_DOCUMENT, DOCUMENT_IDENTIFIER_SYSTEM, ORDER_REFERRAL_SECTION, PROFILES } from './profiles.js'
import type { Patient, ServiceRequest } from './resource.js'
import { responseOf } from './response.js'
import { serviceRequestsOf } from './service-request.js'

export type ChOrfDocumentExport = { readonly ok: true; readonly bundle: Bundle } | { readonly ok: false; readonly refusals: readonly Refusal[] }

const at = (name: string) => member(CONTEXT, name)
const COMPOSITION = at('composition')

/** The members of each part of the context that is no resource of its own. */
const CONTEXT_MEMBERS = ['identifier', 'timestamp', 'composition', 'patient', 'author', 'serviceRequests', 'response']
const COMPOSITION_MEMBERS = ['fullUrl', 'status', 'type', 'category', 'date', 'title', 'sectionTitle']

/** Every part of the context health-ch read and accepted. */
interface Parts {
  readonly identifier: FhirUuid
  readonly composition: { readonly fullUrl: FhirUuid; readonly given: object }
  readonly patient: Written<Patient>
  readonly author: Authored
  readonly orders: readonly Written<ServiceRequest>[]
  readonly response: Written<FhirJsonObject> | undefined
}

/**
 * Every name the context gives an entry, as given, with the type of the
 * resource it names, in the document's order: what the host's answers may
 * refer to. Read before anything is checked, so that a name refused for
 * its form is still the name a reference to it gives, and is refused once,
 * for its form.
 */
function namesOf(context: unknown): Map<string, string> {
  const names = new Map<string, string>()
  const name = (holder: unknown, type: string) => {
    const fullUrl = valueAt(holder, 'fullUrl')
    // The first of two of one name keeps it, as the document's entries do.
    if (typeof fullUrl === 'string' && !names.has(fullUrl)) names.set(fullUrl, type)
  }
  name(valueAt(context, 'composition'), 'Composition')
  name(valueAt(context, 'patient'), 'Patient')
  name(valueAt(context, 'response'), 'QuestionnaireResponse')
  const orders = valueAt(context, 'serviceRequests')
  for (const order of Array.isArray(orders) ? orders : []) name(order, 'ServiceRequest')
  const author = valueAt(context, 'author')
  name(author, 'PractitionerRole')
  name(valueAt(author, 'practitioner'), 'Practitioner')
  name(valueAt(author, 'organization'), 'Organization')
  return names
}

/**
 * The Composition's part of the context, read for what health-ch holds of
 * it: its members, its name, and the one category CH ORF requires, which
 * health-document takes as optional. Its values are health-document's to
 * check. Undefined, refused, where it cannot be read.
 */
function compositionOf(context: unknown, refusals: Refusals): { readonly fullUrl: FhirUuid | undefined; readonly given: object } | undefined {
  const given = objectAt(context, 'composition', COMPOSITION_MEMBERS, COMPOSITION, refusals)
  if (given === undefined) return undefined
  const fullUrl = needed(given, 'fullUrl', member(COMPOSITION, 'fullUrl'), refusals, uuid)
  // One coding each: a list is several, which CH ORF's one category and
  // R4's one type do not say, and is refused as more than the document
  // writes; what else is wrong with one -- a member a coding does not
  // have among them -- is health-document's to say.
  for (const name of ['type', 'category']) if (Array.isArray(valueAt(given, name))) refusals.add('unmapped', member(COMPOSITION, name))
  if (valueAt(given, 'category') === undefined) refusals.add('absent', member(COMPOSITION, 'category'))
  return { fullUrl, given }
}

/**
 * Every entry's name given once: the later of two of one name refused as a
 * duplicate, where it stands. Asked when every part was read, since a part
 * refused has no name to compare.
 */
function checkNames({ composition, patient, author, orders, response }: Parts, refusals: Refusals): void {
  const named = [
    { fullUrl: composition.fullUrl, path: COMPOSITION },
    { fullUrl: patient.fullUrl, path: at('patient') },
    ...(response === undefined ? [] : [{ fullUrl: response.fullUrl, path: at('response') }]),
    ...orders.map((order, index) => ({ fullUrl: order.fullUrl, path: item(at('serviceRequests'), index) })),
    { fullUrl: author.role.fullUrl, path: at('author') },
    { fullUrl: author.practitioner.fullUrl, path: member(at('author'), 'practitioner') },
    ...(author.organization === undefined ? [] : [{ fullUrl: author.organization.fullUrl, path: member(at('author'), 'organization') }]),
  ]
  const seen = new Set<string>()
  for (const { fullUrl, path } of named) {
    if (seen.has(fullUrl)) refusals.add('duplicate-entry', member(path, 'fullUrl'))
    seen.add(fullUrl)
  }
}

/** Every part of `context`, read and checked by health-ch; undefined, with every reason in `refusals`, where one cannot be. */
function partsOf(context: unknown, refusals: Refusals): Parts | undefined {
  if (!known(context, CONTEXT_MEMBERS, CONTEXT, refusals)) return undefined
  const identifier = needed(context, 'identifier', at('identifier'), refusals, uuid)
  const composition = compositionOf(context, refusals)
  const patient = patientOf(valueAt(context, 'patient'), refusals)
  const author = authorOf(valueAt(context, 'author'), refusals)
  const orders = serviceRequestsOf(context, { patient: patient?.fullUrl, requester: author?.role.fullUrl }, refusals)
  const response = responseOf(context, namesOf(context), refusals)
  if (refusals.count > 0 || identifier === undefined || composition?.fullUrl === undefined || patient === undefined || author === undefined || orders === undefined) return undefined
  const parts: Parts = { identifier, composition: { fullUrl: composition.fullUrl, given: composition.given }, patient, author, orders, response }
  checkNames(parts, refusals)
  return refusals.count > 0 ? undefined : parts
}

/** Where the host's own values stand in the context health-ch hands health-document, and where they stand in the host's. */
const PLACES: readonly (readonly [RegExp, string])[] = [
  [/^context\.timestamp$/, 'context.timestamp'],
  [/^context\.composition\.(status|type|date|title)(?=$|[.[])/, 'context.composition.$1'],
  [/^context\.composition\.category\[0\](?=$|[.[])/, 'context.composition.category'],
  [/^context\.composition\.section\[0\]\.title$/, 'context.composition.sectionTitle'],
]

/**
 * `refusal`, of the context health-ch handed health-document, at the place
 * the host gave the value: a Composition's value or the timestamp, or
 * within the host's answers, the entry at `responseAt` where the document
 * holds them. Anything else is a value health-ch wrote, and a refusal of
 * it a bug: thrown, not given to the host as its mistake.
 */
export function reRooted(refusal: Refusal, responseAt: number | undefined): Refusal {
  const places = responseAt === undefined ? PLACES : [...PLACES, [new RegExp(String.raw`^context\.entries\[${String(responseAt)}\]\.resource(?=$|[.[])`), 'context.response.questionnaireResponse'] as const]
  const place = places.find(([from]) => from.test(refusal.path))
  if (place === undefined) throw new Error(`health-document refused ${refusal.path}, a value health-ch wrote: ${refusal.rule}`)
  const context = { ...(refusal.type === undefined ? {} : { type: refusal.type }), ...(refusal.offset === undefined ? {} : { offset: refusal.offset }), ...(refusal.language === undefined ? {} : { language: refusal.language }) }
  return new Refusal(refusal.rule, refusal.path.replace(place[0], place[1]), context)
}

/** An entry of the document: a resource health-ch wrote, or the host's answers. */
const entry = ({ fullUrl, resource }: Written<object>): DocumentEntry => ({ fullUrl, resource: resource as DocumentEntry['resource'] })
const named = ({ fullUrl }: Written<unknown>) => ({ reference: fullUrl })

/**
 * What health-document is asked to assemble of `parts`, and where among
 * its entries the host's answers stand. The Composition's values are the
 * host's, handed on unchecked for health-document to check; the rest is
 * health-ch's. The entries stand in CH ORF's example's order.
 */
function documentOf(context: object, { identifier, composition, patient, author, orders, response }: Parts): { readonly document: DocumentContext; readonly responseAt: number | undefined } {
  const given = (name: string) => valueAt(composition.given, name)
  const section = { title: given('sectionTitle') as string, code: ORDER_REFERRAL_SECTION, entry: [...(response === undefined ? [] : [named(response)]), ...orders.map(named)] }
  const referral: CompositionContext = {
    fullUrl: composition.fullUrl,
    profile: PROFILES.composition,
    status: given('status') as CompositionContext['status'],
    type: given('type') as Coded,
    category: [given('category') as Coded],
    subject: named(patient),
    date: given('date') as string,
    author: [named(author.role)],
    title: given('title') as string,
    section: [section],
  }
  const answers = response === undefined ? undefined : entry(response)
  const entries = [
    entry(patient),
    ...(answers === undefined ? [] : [answers]),
    ...orders.map(entry),
    entry(author.role),
    entry(author.practitioner),
    ...(author.organization === undefined ? [] : [entry(author.organization)]),
  ]
  const document: DocumentContext = {
    profile: CH_ORF_DOCUMENT,
    identifier: { system: DOCUMENT_IDENTIFIER_SYSTEM, value: identifier },
    timestamp: valueAt(context, 'timestamp') as string,
    composition: referral,
    entries,
  }
  return { document, responseAt: answers === undefined ? undefined : entries.indexOf(answers) }
}

/**
 * The CH ORF document `context` says, as a Bundle; or every reason it
 * cannot be one, each naming where in the context, and never a value.
 */
export function toChOrfDocument(context: ChOrfContext): ChOrfDocumentExport {
  const refusals = new Refusals()
  const parts = partsOf(context, refusals)
  if (parts === undefined) return { ok: false, refusals: refusals.list }
  const { document, responseAt } = documentOf(context, parts)
  const assembled = toDocumentBundle(document)
  if (assembled.ok) return assembled
  return { ok: false, refusals: assembled.refusals.map((refusal) => reRooted(refusal, responseAt)) }
}
