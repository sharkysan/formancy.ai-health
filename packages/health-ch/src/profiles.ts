/**
 * The guides a CH ORF document is written for, the profiles it claims, and
 * the codes those profiles fix (0009). Changes when a CH ORF or CH Core
 * version moves, and with it the register the validator gate loads
 * (docs/release/ig-packages.json), which pins exactly these.
 *
 * Every resource claims its profile with the guide's version, as every
 * claim here does (0005): a profile without one names whatever version a
 * receiver happens to hold. The Bundle is the one exception: CH ORF 3.0.2's
 * "Submit Bundle [CH ORF-1]" says "The FHIR Bundle.meta.profile shall
 * include the value http://fhir.ch/ig/ch-orf/StructureDefinition/ch-orf-document"
 * (https://fhir.ch/ig/ch-orf/3.0.2/index.html, Volume 2, read on
 * 17 October 2026), and a receiver that looks for that value would not
 * find it with `|3.0.2` after it. The validator resolves both the same
 * (measured the same day).
 */
import { code, uri } from '@formancy/health-core'
import type { Coding } from './resource.js'

/** The release of CH ORF, Order & Referral by Form, the document is written for (ch.fhir.ig.ch-orf, of 16 December 2025). */
export const CH_ORF_VERSION = '3.0.2' as const

/** The release of CH Core its patient, practitioner and organisation are written for (ch.fhir.ig.ch-core, of 16 December 2025). */
export const CH_CORE_VERSION = '6.0.0' as const

const CH_ORF = 'http://fhir.ch/ig/ch-orf/StructureDefinition'
const CH_CORE = 'http://fhir.ch/ig/ch-core/StructureDefinition'

/** CH ORF's document profile, unversioned, as CH ORF asks the Bundle to claim it. */
export const CH_ORF_DOCUMENT = `${CH_ORF}/ch-orf-document` as const

/** A profile a resource claims: a canonical, as health-document's `Claims` holds one. */
const claim = (canonical: string) => uri(canonical, 'meta.profile')

/** The profile each resource the document holds claims, with its guide's version. */
export const PROFILES = {
  composition: claim(`${CH_ORF}/ch-orf-composition|${CH_ORF_VERSION}`),
  serviceRequest: claim(`${CH_ORF}/ch-orf-servicerequest|${CH_ORF_VERSION}`),
  questionnaireResponse: claim(`${CH_ORF}/ch-orf-questionnaireresponse|${CH_ORF_VERSION}`),
  patient: claim(`${CH_CORE}/ch-core-patient|${CH_CORE_VERSION}`),
  practitionerRole: claim(`${CH_CORE}/ch-core-practitionerrole|${CH_CORE_VERSION}`),
  practitioner: claim(`${CH_CORE}/ch-core-practitioner|${CH_CORE_VERSION}`),
  organization: claim(`${CH_CORE}/ch-core-organization|${CH_CORE_VERSION}`),
} as const

/**
 * The code of CH ORF's order-referral section: LOINC 93037-0, which
 * ch-orf-composition's slice `Composition.section:orderReferral` fixes by
 * its pattern on `code`, a system and a code (patternCodeableConcept), so
 * that no CH ORF document is without it. The one LOINC code this package
 * writes, recorded here with that reason.
 *
 * With its LOINC display name, always: LOINC's licence asks that LOINC
 * content a software program carries "must always be associated with the
 * corresponding identifier from LOINC ... and include the corresponding
 * LOINC display name" -- its fully-specified name, its short name, its
 * long common name or its display name (https://loinc.org/license/,
 * section 10, last updated 6 August 2026, read on 17 October 2026). This
 * is its long common name, "Portable medical order form", in LOINC 2.82,
 * read from HL7's terminology server's `$lookup` of the code the same
 * day, since loinc.org refused the request. The pattern takes a display
 * beside its system and code, and CH ORF's own StructureMap
 * `OrfQrToBundle` writes the same; so the Bundle carries it too. The
 * licence's clause for messages, codes used "in conjunction with
 * laboratory test results and clinical observations", encourages the
 * name there and does not ask it; whether a referral's section code is
 * such a use is not read here, and the name meets either reading.
 * LOINC's notice is in NOTICE and the README (plan 15.3).
 */
export const ORDER_REFERRAL_SECTION = { system: 'http://loinc.org', code: '93037-0', display: 'Portable medical order form' } as const

/** HL7's v2 identifier types, table 0203, which the terminology package holds under CC0. */
const IDENTIFIER_TYPE = uri('http://terminology.hl7.org/CodeSystem/v2-0203', 'Identifier.type.coding.system')

/** The placer's order number: ch-orf-servicerequest's `identifier:placerOrderIdentifier` fixes this type by its pattern. */
export const PLACER_ORDER: Coding = { system: IDENTIFIER_TYPE, code: code('PLAC', 'Identifier.type.coding.code') }

/** A medical record number: ch-core-patient's `identifier:LocalPid` fixes this type by its pattern. */
export const MEDICAL_RECORD: Coding = { system: IDENTIFIER_TYPE, code: code('MR', 'Identifier.type.coding.code') }

/** The system CH ORF fixes `Bundle.identifier.system` to: a URI, here the document's `urn:uuid:`. */
export const DOCUMENT_IDENTIFIER_SYSTEM = 'urn:ietf:rfc:3986' as const
