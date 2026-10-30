/**
 * The orders a CH ORF document carries, as CH ORF 3.0.2's ServiceRequest
 * profiles them (StructureDefinition `ch-orf-servicerequest`, on CH Core's
 * `ch-core-servicerequest`, read from the ch.fhir.ig.ch-orf 3.0.2 package
 * on 17 October 2026) (0009):
 *
 * - `identifier:placerOrderIdentifier`, 1..1, typed v2-0203 `PLAC` by its
 *   pattern, its value 1..1: the placer's number, under the host's system.
 *   The filler's (`FILL`) is the filler's to add, and is not written.
 * - `status` and `intent`, 1..1, R4's RequestStatus and RequestIntent,
 *   bound as required; `priority`, R4's RequestPriority, where the host
 *   gives one.
 * - `subject`, 1..1, a ch-core-patient: the document's patient.
 * - `requester`, a ch-core-practitionerrole: the author's role, always,
 *   since CH ORF has the author order.
 * - `authoredOn`, where the host gives it.
 *
 * Not written: the profile's coverage, notes, locations and times,
 * encounter details, category and code; a member of the host's context
 * that would say one is refused, never left out.
 */
import {
  codeOf,
  dateTime,
  known,
  member,
  needed,
  optional,
  readItems,
  uuid,
  valueAt,
  type FhirReference,
  type FhirUuid,
  type Refusals,
} from '@formancy/health-core'
import { CONTEXT, REQUEST_INTENTS, REQUEST_PRIORITIES, REQUEST_STATUSES } from './context.js'
import { localIdentifierAt } from './identifiers.js'
import type { Written } from './people.js'
import { PLACER_ORDER, PROFILES } from './profiles.js'
import type { ServiceRequest } from './resource.js'

/** Where the orders stand in what the host handed over. */
const SERVICE_REQUESTS = member(CONTEXT, 'serviceRequests')

/** Whom the orders are of and from: the entries of the patient and of the author's role, where they could be read. */
export interface Parties {
  readonly patient: FhirUuid | undefined
  readonly requester: FhirUuid | undefined
}

function serviceRequestAt(orders: readonly unknown[], index: string, path: string, parties: Parties, refusals: Refusals): Written<ServiceRequest> | undefined {
  const given = valueAt(orders, index)
  const before = refusals.count
  if (!known(given, ['fullUrl', 'placer', 'status', 'intent', 'priority', 'authoredOn'], path, refusals)) return undefined
  const at = (name: string) => member(path, name)
  const fullUrl = needed(given, 'fullUrl', at('fullUrl'), refusals, uuid)
  const placer = localIdentifierAt(given, 'placer', at('placer'), refusals)
  const status = needed(given, 'status', at('status'), refusals, codeOf(REQUEST_STATUSES))
  const intent = needed(given, 'intent', at('intent'), refusals, codeOf(REQUEST_INTENTS))
  const priority = optional(given, 'priority', at('priority'), refusals, codeOf(REQUEST_PRIORITIES))
  const authoredOn = optional(given, 'authoredOn', at('authoredOn'), refusals, dateTime)
  const { patient, requester } = parties
  if (
    refusals.count > before ||
    fullUrl === undefined ||
    placer === undefined ||
    status === undefined ||
    intent === undefined ||
    patient === undefined ||
    requester === undefined
  )
    return undefined
  const resource: ServiceRequest = {
    resourceType: 'ServiceRequest',
    meta: { profile: [PROFILES.serviceRequest] },
    identifier: [{ type: { coding: [PLACER_ORDER] }, ...placer }],
    status,
    intent,
    ...(priority === undefined ? {} : { priority }),
    subject: { reference: patient as string as FhirReference },
    ...(authoredOn === undefined ? {} : { authoredOn }),
    requester: { reference: requester as string as FhirReference },
  }
  return { fullUrl, resource }
}

/**
 * The orders `holder` holds under `serviceRequests`, at least one, each a
 * CH ORF ServiceRequest of `parties`; undefined, with every reason in
 * `refusals`, where they cannot be.
 */
export function serviceRequestsOf(holder: unknown, parties: Parties, refusals: Refusals): Written<ServiceRequest>[] | undefined {
  const given = valueAt(holder, 'serviceRequests')
  if (!Array.isArray(given) || given.length === 0) return refusals.add('absent', SERVICE_REQUESTS)
  const orders = readItems(given, SERVICE_REQUESTS, (index, path) => serviceRequestAt(given, index, path, parties, refusals))
  return orders.every((order) => order !== undefined) ? orders : undefined
}
