/**
 * The resources this package writes, typed with health-core's primitives
 * (0004: resources are typed by the packages that build them): CH Core's
 * Patient, Practitioner, Organization and PractitionerRole, and CH ORF's
 * ServiceRequest. The Composition and the Bundle are health-document's,
 * the QuestionnaireResponse health-questionnaire's.
 *
 * Only what the package writes is here, in the order R4 lists each element,
 * which is the order it is written in (https://hl7.org/fhir/R4/patient.html,
 * practitioner.html, organization.html, practitionerrole.html and
 * servicerequest.html, read on 17 October 2026).
 */
import type { FhirCode, FhirDate, FhirDateTime, FhirReference, FhirUri } from '@formancy/health-core'
import type { Claims } from '@formancy/health-document'

/** A coding fixed by a profile's pattern: its system and code, no display. */
export type Coding = {
  readonly system: FhirUri
  readonly code: FhirCode
}

/** An identifier: its type where the profile's slice fixes one, its system and its value. */
export type Identifier = {
  readonly type?: { readonly coding: readonly [Coding] }
  readonly system: FhirUri
  readonly value: string
}

/** A reference by name, to an entry of the same document. */
export type Reference = {
  readonly reference: FhirReference
}

/** A person's name, as the host gives its parts. */
export type HumanName = {
  readonly family: string
  readonly given?: readonly string[]
  readonly prefix?: readonly string[]
}

export type Patient = {
  readonly resourceType: 'Patient'
  readonly meta: Claims
  readonly identifier?: readonly Identifier[]
  readonly name?: readonly [HumanName]
  readonly gender?: FhirCode
  readonly birthDate?: FhirDate
}

export type Practitioner = {
  readonly resourceType: 'Practitioner'
  readonly meta: Claims
  readonly identifier?: readonly [Identifier]
  readonly name: readonly [HumanName]
}

export type Organization = {
  readonly resourceType: 'Organization'
  readonly meta: Claims
  readonly identifier?: readonly [Identifier]
  readonly name: string
}

export type PractitionerRole = {
  readonly resourceType: 'PractitionerRole'
  readonly meta: Claims
  readonly practitioner: Reference
  readonly organization?: Reference
}

export type ServiceRequest = {
  readonly resourceType: 'ServiceRequest'
  readonly meta: Claims
  readonly identifier: readonly [Identifier]
  readonly status: FhirCode
  readonly intent: FhirCode
  readonly priority?: FhirCode
  readonly subject: Reference
  readonly authoredOn?: FhirDateTime
  readonly requester: Reference
}
