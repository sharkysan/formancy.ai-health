import { Refusals, uuid, writeJson } from '@formancy/health-core'
import { describe, expect, test } from 'vitest'
import { serviceRequestsOf } from './service-request.js'
import { NAMES, serviceRequest } from './test-support.js'

/** The ServiceRequests `given` makes, of the patient and the author's role in `NAMES`, and the refusals as `rule path`. */
function reading(given: unknown) {
  const refusals = new Refusals()
  const made = serviceRequestsOf({ serviceRequests: given }, { patient: uuid(NAMES.patient, 'patient'), requester: uuid(NAMES.role, 'role') }, refusals)
  return { made, refused: refusals.list.map((refusal) => `${refusal.rule} ${refusal.path}`) }
}

describe('the orders', () => {
  // CH ORF's ServiceRequest: its profile with CH ORF's version; the
  // placer's number, typed v2-0203 PLAC as the slice
  // identifier:placerOrderIdentifier fixes it by its pattern, 1..1; R4's
  // status and intent, which the profile requires; the patient as its
  // subject; and the author's role as its requester, which CH ORF types
  // ch-core-practitionerrole, as it does the author. Written in R4's
  // order, in the host's order of orders.
  test('are CH ORF ServiceRequests, written exactly, in the host order', () => {
    const { made, refused } = reading([serviceRequest(), serviceRequest(NAMES.secondServiceRequest, NAMES.secondOrder)])
    expect(refused).toEqual([])
    expect(made?.map((entry) => entry.fullUrl)).toEqual([NAMES.serviceRequest, NAMES.secondServiceRequest])
    expect(writeJson(made?.[0]?.resource as never)).toBe(
      '{"resourceType":"ServiceRequest","meta":{"profile":["http://fhir.ch/ig/ch-orf/StructureDefinition/ch-orf-servicerequest|3.0.2"]},' +
        `"identifier":[{"type":{"coding":[{"system":"http://terminology.hl7.org/CodeSystem/v2-0203","code":"PLAC"}]},"system":"urn:ietf:rfc:3986","value":"${NAMES.order}"}],` +
        `"status":"active","intent":"order","priority":"routine","subject":{"reference":"${NAMES.patient}"},"authoredOn":"2026-10-17T10:00:00+02:00","requester":{"reference":"${NAMES.role}"}}`,
    )
  })

  // R4 makes priority and authoredOn optional, and so does CH ORF: an
  // order without them is written without them.
  test('write no priority and no time the host does not give', () => {
    const { priority: _, authoredOn: __, ...plain } = serviceRequest()
    expect(writeJson(reading([plain]).made?.[0]?.resource as never)).toContain('"status":"active","intent":"order","subject"')
  })

  // CH ORF's document asks at least one ServiceRequest, in the Bundle and
  // in the order-referral section (ch-orf-document, Bundle.entry:ServiceRequest
  // 1..*; ch-orf-composition, its section's entry:ServiceRequest 1..*).
  test.each([[undefined], [[]], [serviceRequest()]])('are refused as absent when there is no list of them: %j', (given) => {
    expect(reading(given).refused).toEqual(['absent context.serviceRequests'])
  })

  // Each refused where it stands: a status, an intent or a priority R4
  // does not have, which the profile binds as required; a time without its
  // zone; a placer number under a system of CH Core's, or with no value;
  // and a member CH ORF's ServiceRequest has and this document does not
  // write, a filler's number, which would be left out without a word.
  test.each([
    ['a status R4 does not have', { status: 'open' }, 'unmapped context.serviceRequests[0].status'],
    ['an intent R4 does not have', { intent: 'referral' }, 'unmapped context.serviceRequests[0].intent'],
    ['a priority R4 does not have', { priority: 'high' }, 'unmapped context.serviceRequests[0].priority'],
    ['a time without its zone', { authoredOn: '2026-10-17T10:00:00' }, 'zone context.serviceRequests[0].authoredOn'],
    [
      'a placer under the GLN system',
      { placer: { system: 'urn:oid:2.51.1.3', value: '9520000000011' } },
      'identifier context.serviceRequests[0].placer.system',
    ],
    ['a placer without its value', { placer: { system: 'urn:ietf:rfc:3986' } }, 'absent context.serviceRequests[0].placer.value'],
    ['no placer', { placer: undefined }, 'absent context.serviceRequests[0].placer'],
    ['no status', { status: undefined }, 'absent context.serviceRequests[0].status'],
    ['no intent', { intent: undefined }, 'absent context.serviceRequests[0].intent'],
    ['a fullUrl in capitals', { fullUrl: NAMES.serviceRequest.toUpperCase() }, 'grammar context.serviceRequests[0].fullUrl'],
    ['a filler number it does not write', { filler: { system: 'urn:ietf:rfc:3986', value: NAMES.order } }, 'unmapped context.serviceRequests[0]'],
  ])('are refused with %s', (_, change, refusal) => {
    const order = Object.fromEntries(Object.entries({ ...serviceRequest(), ...change }).filter(([, value]) => value !== undefined))
    expect(reading([order]).refused).toEqual([refusal])
  })

  // Every refusal of every order at once, in their order.
  test('are refused for everything wrong with each, at once', () => {
    expect(reading([{ ...serviceRequest(), status: 'open' }, 'order']).refused).toEqual([
      'unmapped context.serviceRequests[0].status',
      'absent context.serviceRequests[1]',
    ])
  })

  // A hole in the host's list of orders, which JSON never has, walked
  // past, left a gap the document's names tripped on with a TypeError. It
  // is refused where it stands, and a placer number with a character no
  // resource can carry where that stands.
  test('are refused for a hole in the list, at its index', () => {
    const orders: unknown[] = [serviceRequest()]
    orders[2] = serviceRequest(NAMES.secondServiceRequest, NAMES.secondOrder)
    expect(reading(orders).refused).toEqual(['absent context.serviceRequests[1]'])
    expect(reading([{ ...serviceRequest(), placer: { system: 'urn:ietf:rfc:3986', value: '\udc00' } }]).refused).toEqual([
      'grammar context.serviceRequests[0].placer.value',
    ])
  })
})
