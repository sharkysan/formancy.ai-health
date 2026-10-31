/**
 * The people of a CH ORF document, as CH Core 6.0.0 profiles them: the
 * patient, and the author as CH ORF has every author, a PractitionerRole
 * of a Practitioner at an Organization (0009).
 *
 * What each profile asks, read from its StructureDefinition in the
 * ch.fhir.ig.ch-core 6.0.0 package on 17 October 2026, and how it is held:
 *
 * - **ch-core-patient** requires nothing. Its identifier slices are by
 *   value: `AHVN13` under `urn:oid:2.16.756.5.32`, and `LocalPid`, typed
 *   v2-0203 `MR` by its pattern, with a system and a value. Its warnings
 *   are held here as refusals: ch-pat-1, a name with a family and a given
 *   name, so a name has both; ch-pat-2, gender `unknown` "is currently not
 *   used in Switzerland", so it is refused and the host leaves an unknown
 *   gender out.
 * - **ch-core-practitioner**: ch-pract-1, an error, "If a HumanName is
 *   provided, at least one HumanName must have a family name"; a GLN under
 *   `urn:oid:2.51.1.3` (slice `GLN`, 0..1).
 * - **ch-core-organization**: a GLN (slice `GLN`, 0..1); R4's org-1 asks
 *   an identifier or a name, and the name, which a receiver shows, is
 *   required here.
 * - **ch-core-practitionerrole** requires nothing: its practitioner and
 *   its organisation, each by the `urn:uuid:` of its entry. No code and no
 *   specialty: CH Core binds them, preferred, to CH Term's ValueSets
 *   `HCProfessional.hcProfession`, of codes under
 *   `urn:oid:2.16.756.5.30.1.127.3.10.9` and SNOMED CT's, and
 *   `HCProfessional.hcSpecialisation`, of codes under
 *   `urn:oid:2.16.756.5.30.1.127.3.5` (`PractitionerRole.code` and
 *   `.specialty` in ch-core-practitionerrole; the ValueSets in
 *   ch.fhir.ig.ch-term 3.3.0, read the same day), and a context member
 *   that would say one is refused.
 *
 * Every GLN and AHV number is held to its system here (identifiers.ts),
 * since CH Core's checks of them are warnings. Each resource claims its
 * profile with CH Core's version, and is written in R4's order.
 */
import {
  codeOf,
  date,
  known,
  member,
  needed,
  objectAt,
  optional,
  readItems,
  text,
  uri,
  uuid,
  valueAt,
  type FhirReference,
  type FhirUuid,
  type Refusals,
} from '@formancy/health-core'
import { CONTEXT, GENDERS } from './context.js'
import { ahvn13, AHVN13_SYSTEM, gln, GLN_SYSTEM, localIdentifierAt } from './identifiers.js'
import { MEDICAL_RECORD, PROFILES } from './profiles.js'
import type { HumanName, Identifier, Organization, Patient, Practitioner, PractitionerRole } from './resource.js'

/** A resource health-ch wrote, under the name the host gave it. */
export interface Written<R> {
  readonly fullUrl: FhirUuid
  readonly resource: R
}

/** The author's three resources: the role, its practitioner and, where the host names one, its organisation. */
export interface Authored {
  readonly role: Written<PractitionerRole>
  readonly practitioner: Written<Practitioner>
  readonly organization: Written<Organization> | undefined
}

/** Where the patient and the author stand in what the host handed over. */
const PATIENT = member(CONTEXT, 'patient')
const AUTHOR = member(CONTEXT, 'author')

/** A list of texts the host gives, each something but whitespace, at every index; undefined, refused, where it is not one. */
function textsAt(holder: object, name: string, path: string, refusals: Refusals): string[] | undefined {
  const given = valueAt(holder, name)
  if (!Array.isArray(given) || given.length === 0) return refusals.add('absent', path)
  const texts = readItems(given, path, (index, at) => needed(given, index, at, refusals, text))
  return texts.every((each) => each !== undefined) ? texts : undefined
}

/** The same, where the host may give none. */
const optionalTextsAt = (holder: object, name: string, path: string, refusals: Refusals) =>
  valueAt(holder, name) === undefined ? undefined : textsAt(holder, name, path, refusals)

/** The patient's name: a family and given names, both, as ch-pat-1 asks. */
function patientNameAt(holder: object, path: string, refusals: Refusals): HumanName | undefined {
  const name = objectAt(holder, 'name', ['family', 'given'], path, refusals)
  if (name === undefined) return undefined
  const family = needed(name, 'family', member(path, 'family'), refusals, text)
  const given = textsAt(name, 'given', member(path, 'given'), refusals)
  return family === undefined || given === undefined ? undefined : { family, given }
}

/** The practitioner's name: a family, as ch-pract-1 requires, and given names and prefixes where the host gives them. */
function practitionerNameAt(holder: object, path: string, refusals: Refusals): HumanName | undefined {
  const name = objectAt(holder, 'name', ['family', 'given', 'prefix'], path, refusals)
  if (name === undefined) return undefined
  const family = needed(name, 'family', member(path, 'family'), refusals, text)
  const given = optionalTextsAt(name, 'given', member(path, 'given'), refusals)
  const prefix = optionalTextsAt(name, 'prefix', member(path, 'prefix'), refusals)
  return family === undefined ? undefined : { family, ...(given === undefined ? {} : { given }), ...(prefix === undefined ? {} : { prefix }) }
}

/** The patient's identifiers: the AHV number under its system, then the host's own, each typed MR as LocalPid fixes it. */
function patientIdentifiersOf(holder: object, refusals: Refusals): Identifier[] | undefined {
  const number = optional(holder, 'ahvn13', member(PATIENT, 'ahvn13'), refusals, ahvn13)
  const at = member(PATIENT, 'identifier')
  const given = valueAt(holder, 'identifier')
  let local: Identifier[] = []
  if (given !== undefined) {
    if (!Array.isArray(given) || given.length === 0) refusals.add('absent', at)
    else {
      const read = readItems(given, at, (index, where) => localIdentifierAt(given, index, where, refusals))
      local = read.flatMap((each) => (each === undefined ? [] : [{ type: { coding: [MEDICAL_RECORD] }, ...each }]))
    }
  }
  const identifiers: Identifier[] = [...(number === undefined ? [] : [{ system: uri(AHVN13_SYSTEM, 'Patient.identifier.system'), value: number }]), ...local]
  return identifiers.length === 0 ? undefined : identifiers
}

/** The patient the host names, as a CH Core Patient; undefined, with every reason in `refusals`, where it cannot be one. */
export function patientOf(given: unknown, refusals: Refusals): Written<Patient> | undefined {
  const before = refusals.count
  if (!known(given, ['fullUrl', 'ahvn13', 'identifier', 'name', 'gender', 'birthDate'], PATIENT, refusals)) return undefined
  const fullUrl = needed(given, 'fullUrl', member(PATIENT, 'fullUrl'), refusals, uuid)
  const identifier = patientIdentifiersOf(given, refusals)
  const name = valueAt(given, 'name') === undefined ? undefined : patientNameAt(given, member(PATIENT, 'name'), refusals)
  const gender = optional(given, 'gender', member(PATIENT, 'gender'), refusals, codeOf(GENDERS))
  const birthDate = optional(given, 'birthDate', member(PATIENT, 'birthDate'), refusals, date)
  if (refusals.count > before || fullUrl === undefined) return undefined
  const resource: Patient = {
    resourceType: 'Patient',
    meta: { profile: [PROFILES.patient] },
    ...(identifier === undefined ? {} : { identifier }),
    ...(name === undefined ? {} : { name: [name] }),
    ...(gender === undefined ? {} : { gender }),
    ...(birthDate === undefined ? {} : { birthDate }),
  }
  return { fullUrl, resource }
}

/** A GLN the host may give at `path`, as the identifier CH Core's GLN slice is. */
function glnIdentifier(holder: object, path: string, refusals: Refusals): readonly [Identifier] | undefined {
  const number = optional(holder, 'gln', member(path, 'gln'), refusals, gln)
  return number === undefined ? undefined : [{ system: uri(GLN_SYSTEM, 'Identifier.system'), value: number }]
}

function practitionerOf(holder: object, refusals: Refusals): Written<Practitioner> | undefined {
  const path = member(AUTHOR, 'practitioner')
  const before = refusals.count
  const given = objectAt(holder, 'practitioner', ['fullUrl', 'gln', 'name'], path, refusals)
  if (given === undefined) return undefined
  const fullUrl = needed(given, 'fullUrl', member(path, 'fullUrl'), refusals, uuid)
  const identifier = glnIdentifier(given, path, refusals)
  const name = practitionerNameAt(given, member(path, 'name'), refusals)
  if (refusals.count > before || fullUrl === undefined || name === undefined) return undefined
  return {
    fullUrl,
    resource: { resourceType: 'Practitioner', meta: { profile: [PROFILES.practitioner] }, ...(identifier === undefined ? {} : { identifier }), name: [name] },
  }
}

function organizationOf(holder: object, refusals: Refusals): Written<Organization> | undefined {
  const path = member(AUTHOR, 'organization')
  const before = refusals.count
  const given = objectAt(holder, 'organization', ['fullUrl', 'gln', 'name'], path, refusals)
  if (given === undefined) return undefined
  const fullUrl = needed(given, 'fullUrl', member(path, 'fullUrl'), refusals, uuid)
  const identifier = glnIdentifier(given, path, refusals)
  const name = needed(given, 'name', member(path, 'name'), refusals, text)
  if (refusals.count > before || fullUrl === undefined || name === undefined) return undefined
  return {
    fullUrl,
    resource: { resourceType: 'Organization', meta: { profile: [PROFILES.organization] }, ...(identifier === undefined ? {} : { identifier }), name },
  }
}

/**
 * The author the host names, as a CH Core PractitionerRole, its
 * Practitioner and its Organization; undefined, with every reason in
 * `refusals`, where they cannot be.
 */
export function authorOf(given: unknown, refusals: Refusals): Authored | undefined {
  const before = refusals.count
  if (!known(given, ['fullUrl', 'practitioner', 'organization'], AUTHOR, refusals)) return undefined
  const fullUrl = needed(given, 'fullUrl', member(AUTHOR, 'fullUrl'), refusals, uuid)
  const practitioner = practitionerOf(given, refusals)
  const organization = valueAt(given, 'organization') === undefined ? undefined : organizationOf(given, refusals)
  if (refusals.count > before || fullUrl === undefined || practitioner === undefined) return undefined
  const named = (entry: Written<unknown>) => ({ reference: entry.fullUrl as string as FhirReference })
  const role: PractitionerRole = {
    resourceType: 'PractitionerRole',
    meta: { profile: [PROFILES.practitionerRole] },
    practitioner: named(practitioner),
    ...(organization === undefined ? {} : { organization: named(organization) }),
  }
  return { role: { fullUrl, resource: role }, practitioner, organization }
}
