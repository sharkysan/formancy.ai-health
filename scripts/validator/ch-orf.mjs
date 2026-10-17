// The CH ORF documents the validator gate judges (0009): what
// `@formancy/health-ch`, as built, makes of a synthetic referral -- the
// intake's urgent answers, made by `@formancy/health-questionnaire` and
// claiming CH ORF's response profile, a synthetic patient, author and
// order -- against CH ORF 3.0.2 on CH Core 6.0.0; and, each broken for
// one thing, that document with what CH ORF requires taken out, or what
// health-ch refuses put back, so the gate shows the validator refusing
// it. The intake's Questionnaire, which the response names by its
// versioned canonical, is the corpus's own definition
// (`questionnaire-referral-intake.json`): the document carries it by
// canonical and not inside, as 0009 decides.
//
// The people are synthetic and their identifiers nobody's, as can be
// shown: the patient's number and the order's under ITU-T's example arc
// 2.999 and as a urn:uuid; the GLNs under GS1's prefix 952, "used for
// demonstrations and examples of the GS1 system" (GS1 General
// Specifications 26.0, Table 1-4), which CH Core's gln-startswith76 warns
// of and the warnings register accepts with that reason. No valid AHV
// number appears: the one AHVN13 here has a wrong check digit, which
// makes it no AHVN13 (0009), and scripts/synthetic-identifiers.test.mjs
// fails on a valid one in any file and on a GLN of the corpus under
// another prefix. The Composition's type and category are HL7's own
// codes, which the validator holds offline, where a host would send CH
// Term's SNOMED CT ones: the corpus holds no SNOMED CT code, which
// scripts/terminology.test.mjs holds.
//
// A wrong check digit is health-ch's refusal; the validator only warns of
// one (CH Core's gln-modulus-10 and ahvn13-digit-check are warnings).
// Here the warning is not registered, so the gate refuses the document
// all the same, and the corpus shows the validator sees it.

import { intake, intakeResponseContext, intakeUrgent } from './forms.mjs'

/** Each entry's name, and the document's identifier: lowercase urn:uuids, as a host gives them. */
export const CH_ORF_NAMES = {
  document: 'urn:uuid:9f4b2c71-3e8d-4a6f-b5c0-7d1e2f3a4b00',
  composition: 'urn:uuid:9f4b2c71-3e8d-4a6f-b5c0-7d1e2f3a4b01',
  patient: 'urn:uuid:9f4b2c71-3e8d-4a6f-b5c0-7d1e2f3a4b02',
  response: 'urn:uuid:9f4b2c71-3e8d-4a6f-b5c0-7d1e2f3a4b03',
  serviceRequest: 'urn:uuid:9f4b2c71-3e8d-4a6f-b5c0-7d1e2f3a4b04',
  role: 'urn:uuid:9f4b2c71-3e8d-4a6f-b5c0-7d1e2f3a4b05',
  practitioner: 'urn:uuid:9f4b2c71-3e8d-4a6f-b5c0-7d1e2f3a4b06',
  organization: 'urn:uuid:9f4b2c71-3e8d-4a6f-b5c0-7d1e2f3a4b07',
  order: 'urn:uuid:9f4b2c71-3e8d-4a6f-b5c0-7d1e2f3a4b10',
}

/**
 * The intake's urgent answers as a CH ORF document carries them: of the
 * patient, written down by the author's role, given by the patient, and
 * claiming CH ORF's response profile, which health-ch requires.
 */
export function chOrfResponse(toQuestionnaireResponse, { PROFILES }) {
  const context = {
    ...intakeResponseContext,
    subject: { reference: CH_ORF_NAMES.patient },
    author: { reference: CH_ORF_NAMES.role },
    source: { reference: CH_ORF_NAMES.patient },
    profiles: [PROFILES.questionnaireResponse],
  }
  const result = toQuestionnaireResponse(intake, intakeUrgent, context)
  if (!result.ok) throw new Error(`the package refused a corpus submission: ${result.refusals.map((refusal) => refusal.message).join('; ')}`)
  return result.questionnaireResponse
}

/** What a synthetic host says of its referral: everything a CH ORF document of health-ch's holds. */
export function chOrfContext(questionnairePackage, ch) {
  return {
    identifier: CH_ORF_NAMES.document,
    timestamp: '2026-10-17T10:05:00+02:00',
    composition: {
      fullUrl: CH_ORF_NAMES.composition,
      status: 'final',
      type: { system: 'http://terminology.hl7.org/CodeSystem/v2-0270', code: 'CN', display: 'Consultation' },
      category: { system: 'http://terminology.hl7.org/CodeSystem/v3-ActClass', code: 'DOCCLIN', display: 'clinical document' },
      date: '2026-10-17T10:00:00+02:00',
      title: 'Zuweisung',
      sectionTitle: 'Auftrag',
    },
    patient: {
      fullUrl: CH_ORF_NAMES.patient,
      identifier: [{ system: 'urn:oid:2.999.756.1', value: 'P-0001' }],
      name: { family: 'Beispiel', given: ['Synthetica'] },
      gender: 'female',
      birthDate: '1980-02-29',
    },
    author: {
      fullUrl: CH_ORF_NAMES.role,
      practitioner: { fullUrl: CH_ORF_NAMES.practitioner, gln: '9520000000011', name: { family: 'Muster', given: ['Probus'], prefix: ['Dr. med.'] } },
      organization: { fullUrl: CH_ORF_NAMES.organization, gln: '9520000000028', name: 'Praxis Synthetica' },
    },
    serviceRequests: [{ fullUrl: CH_ORF_NAMES.serviceRequest, placer: { system: 'urn:ietf:rfc:3986', value: CH_ORF_NAMES.order }, status: 'active', intent: 'order', priority: 'urgent', authoredOn: '2026-10-17T10:00:00+02:00' }],
    response: { fullUrl: CH_ORF_NAMES.response, questionnaireResponse: chOrfResponse(questionnairePackage.toQuestionnaireResponse, ch) },
  }
}

/** The CH ORF document health-ch makes of the synthetic referral; the gate stops on a refusal, which is the package refusing a document the corpus says it writes. */
export function chOrfDocument(questionnairePackage, ch) {
  const result = ch.toChOrfDocument(chOrfContext(questionnairePackage, ch))
  if (!result.ok) throw new Error(`the package refused a corpus document: ${result.refusals.map((refusal) => refusal.message).join('; ')}`)
  return result.bundle
}

/**
 * The CH ORF documents, accepted and broken. `copy` deep-copies the
 * package's output to break, keeping FhirNumbers as they are; `core` is
 * health-core's exports.
 */
export function chOrfOutput(core, questionnairePackage, ch, copy) {
  const made = chOrfDocument(questionnairePackage, ch)
  const broken = (change) => {
    const resource = copy(made)
    change(resource)
    return resource
  }
  const at = (bundle, fullUrl) => bundle.entry.findIndex((entry) => entry.fullUrl === fullUrl)
  const resourceOf = (bundle, fullUrl) => bundle.entry[at(bundle, fullUrl)].resource
  return [
    { file: 'bundle-ch-orf-referral.json', expect: 'accepted', resource: made },
    {
      file: 'bundle-ch-orf-without-narrative.json',
      why: "a Composition without its narrative, which ch-orf-composition makes 1..1 and health-document writes from the Composition's titles",
      // The Composition's own minimum, and the Bundle's Composition slice it no longer matches (measured).
      expect: [
        { severity: 'error', id: 'Validation_VAL_Profile_Minimum', expression: 'Bundle.entry[0].resource/*Composition/null*/' },
        { severity: 'error', id: 'Validation_VAL_Profile_Minimum_SLICE', expression: 'Bundle' },
      ],
      resource: broken((bundle) => {
        delete bundle.entry[0].resource.text
      }),
    },
    {
      file: 'bundle-ch-orf-section-code-other.json',
      why: "the order-referral section under another code than LOINC 93037-0, which its slice fixes and health-ch always writes: here 0000-0, a LOINC code that does not exist, and so without 93037-0's name",
      // The Composition's orderReferral slice, then the Bundle's Composition slice (measured).
      expect: [
        { severity: 'error', id: 'Validation_VAL_Profile_Minimum_SLICE', expression: 'Bundle.entry[0].resource/*Composition/null*/' },
        { severity: 'error', id: 'Validation_VAL_Profile_Minimum_SLICE', expression: 'Bundle' },
      ],
      resource: broken((bundle) => {
        bundle.entry[0].resource.section[0].code.coding[0] = { system: core.uri('http://loinc.org', 'corpus'), code: core.code('0000-0', 'corpus') }
      }),
    },
    {
      file: 'bundle-ch-orf-without-category.json',
      why: 'a Composition without its category, which ch-orf-composition makes 1..1 and health-ch requires of the host',
      expect: [
        { severity: 'error', id: 'Validation_VAL_Profile_Minimum', expression: 'Bundle.entry[0].resource/*Composition/null*/' },
        { severity: 'error', id: 'Validation_VAL_Profile_Minimum_SLICE', expression: 'Bundle' },
      ],
      resource: broken((bundle) => {
        delete bundle.entry[0].resource.category
      }),
    },
    {
      file: 'bundle-ch-orf-identifier-system-other.json',
      why: "a document identifier under another system than urn:ietf:rfc:3986, which ch-orf-document fixes and health-ch always writes",
      expect: [
        { severity: 'error', id: '_DT_Fixed_Wrong', expression: 'Bundle.identifier.system' },
      ],
      resource: broken((bundle) => {
        bundle.identifier.system = core.uri('urn:oid:2.999.756.2', 'corpus')
      }),
    },
    {
      file: 'bundle-ch-orf-author-practitioner.json',
      why: 'a Composition whose author is the Practitioner, where ch-orf-composition admits a ch-core-practitionerrole alone, as health-ch writes it',
      expect: [
        { severity: 'error', id: 'Reference_REF_BadTargetType', expression: 'Bundle.entry[0].resource/*Composition/null*/.author[0]' },
        { severity: 'error', id: 'Validation_VAL_Profile_Minimum_SLICE', expression: 'Bundle' },
      ],
      resource: broken((bundle) => {
        bundle.entry[0].resource.author[0].reference = CH_ORF_NAMES.practitioner
      }),
    },
    {
      file: 'bundle-ch-orf-without-placer.json',
      why: "an order without the placer's number, which ch-orf-servicerequest's placerOrderIdentifier slice makes 1..1 and health-ch requires of the host",
      // The order's identifier and its placer slice, the section's ServiceRequest
      // slice it no longer matches, and the Bundle's Composition and
      // ServiceRequest slices, both at Bundle (measured).
      expect: [
        { severity: 'error', id: 'Validation_VAL_Profile_Minimum', expression: 'Bundle.entry[3].resource' },
        { severity: 'error', id: 'Validation_VAL_Profile_Minimum_SLICE', expression: 'Bundle.entry[3].resource' },
        { severity: 'error', id: 'Validation_VAL_Profile_Minimum_SLICE', expression: 'Bundle.entry[0].resource/*Composition/null*/.section[0]' },
        { severity: 'error', id: 'Validation_VAL_Profile_Minimum_SLICE', expression: 'Bundle' },
      ],
      resource: broken((bundle) => {
        delete resourceOf(bundle, CH_ORF_NAMES.serviceRequest).identifier
      }),
    },
    {
      file: 'bundle-ch-orf-without-service-request.json',
      why: 'a document without an order, where ch-orf-document and its order-referral section ask at least one ServiceRequest, which health-ch requires of the host',
      expect: [
        { severity: 'error', id: 'Validation_VAL_Profile_Minimum_SLICE', expression: 'Bundle.entry[0].resource/*Composition/null*/.section[0]' },
        { severity: 'error', id: 'Validation_VAL_Profile_Minimum_SLICE', expression: 'Bundle' },
      ],
      resource: broken((bundle) => {
        bundle.entry.splice(at(bundle, CH_ORF_NAMES.serviceRequest), 1)
        bundle.entry[0].resource.section[0].entry = bundle.entry[0].resource.section[0].entry.filter((entry) => entry.reference !== CH_ORF_NAMES.serviceRequest)
      }),
    },
    {
      file: 'bundle-ch-orf-practitioner-without-family.json',
      why: "a Practitioner's name without a family name, CH Core's ch-pract-1, an error, which health-ch refuses",
      // ch-pract-1 at the Practitioner, and every reference that a
      // ch-core-practitionerrole or ch-core-practitioner no longer matches:
      // the Composition's author, the answers' author, the order's
      // requester and the role's practitioner, and the slices of the
      // section and of the Bundle (measured).
      expect: [
        { severity: 'error', id: 'http://fhir.ch/ig/ch-core/StructureDefinition/ch-core-practitioner#ch-pract-1', expression: 'Bundle.entry[5].resource/*Practitioner/null*/' },
        { severity: 'error', id: 'Reference_REF_CantMatchChoice', expression: 'Bundle.entry[0].resource/*Composition/null*/.author[0]' },
        { severity: 'error', id: 'Reference_REF_CantMatchChoice', expression: 'Bundle.entry[2].resource.author' },
        { severity: 'error', id: 'Reference_REF_CantMatchChoice', expression: 'Bundle.entry[3].resource.requester' },
        { severity: 'error', id: 'Reference_REF_CantMatchChoice', expression: 'Bundle.entry[4].resource/*PractitionerRole/null*/.practitioner' },
        { severity: 'error', id: 'Validation_VAL_Profile_Minimum_SLICE', expression: 'Bundle.entry[0].resource/*Composition/null*/.section[0]' },
        { severity: 'error', id: 'Validation_VAL_Profile_Minimum_SLICE', expression: 'Bundle' },
      ],
      resource: broken((bundle) => {
        delete resourceOf(bundle, CH_ORF_NAMES.practitioner).name[0].family
      }),
    },
    {
      file: 'bundle-ch-orf-response-subject-practitioner.json',
      why: "answers whose subject is the Practitioner, where ch-orf-questionnaireresponse admits a ch-core-patient alone, which health-ch refuses",
      expect: [
        { severity: 'error', id: 'Reference_REF_BadTargetType', expression: 'Bundle.entry[2].resource.subject' },
      ],
      resource: broken((bundle) => {
        resourceOf(bundle, CH_ORF_NAMES.response).subject.reference = CH_ORF_NAMES.practitioner
      }),
    },
    {
      file: 'bundle-ch-orf-gln-check-digit-wrong.json',
      why: "a GLN whose check digit is not GS1's, which health-ch refuses and CH Core's gln-modulus-10 only warns of: unregistered, the warning refuses it here",
      expect: [
        { severity: 'warning', id: 'http://fhir.ch/ig/ch-core/StructureDefinition/ch-core-gln-identifier#gln-modulus-10', expression: 'Bundle.entry[5].resource/*Practitioner/null*/.identifier[0].value' },
      ],
      resource: broken((bundle) => {
        resourceOf(bundle, CH_ORF_NAMES.practitioner).identifier[0].value = '9520000000012'
      }),
    },
    {
      file: 'bundle-ch-orf-ahvn13-check-digit-wrong.json',
      why: "an AHV number whose check digit is not GS1's, which health-ch refuses and CH Core's ahvn13-digit-check only warns of: unregistered, the warning refuses it here. 7561234567890 has the wrong check digit, which makes it no AHVN13 and nobody's",
      expect: [
        { severity: 'warning', id: 'http://fhir.ch/ig/ch-core/StructureDefinition/ch-core-ahvn13-identifier#ahvn13-digit-check', expression: 'Bundle.entry[1].resource/*Patient/null*/.identifier[0].value' },
      ],
      resource: broken((bundle) => {
        resourceOf(bundle, CH_ORF_NAMES.patient).identifier.unshift({ system: core.uri('urn:oid:2.16.756.5.32', 'corpus'), value: '7561234567890' })
      }),
    },
  ]
}
