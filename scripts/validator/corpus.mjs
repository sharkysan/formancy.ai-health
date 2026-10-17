// What the validator gate judges (0005): FHIR resources written by
// `@formancy/health-core`, as built, with what each must make of the gate.
//
// Two kinds. **Package output**: the Questionnaires
// `@formancy/health-questionnaire`, as built, makes of the synthetic forms
// in scripts/validator/forms.mjs (0006), which between them hold every
// field type and rule version 1 maps, and the QuestionnaireResponses it
// makes of the synthetic submissions there (0007), which between them hold
// every answer type it writes -- scripts/validator/corpus.test.mjs derives
// both sets from the package and holds the forms and submissions to them
// -- and the document Bundles `@formancy/health-document`, as built, makes
// of the referral letter `@formancy/health-corpus` renders with Formancy
// Report 0.1.0 (0008): the PDF in the DocumentReference's attachment, the
// PDF in a Binary beside it, and the PDF beside a QuestionnaireResponse of
// the intake; and, each broken for one thing, the package's output with
// what a decision of 0006, 0007 or 0008 left out or refuses put back, so
// the gate shows why. A response is judged against its Questionnaire,
// which the gate loads as a definition. **Built by hand** from
// health-core's primitives and written by its `writeJson`: a collection
// Bundle, which no package builds, the Questionnaire and the
// QuestionnaireResponse it holds, which predate the package's, and the
// resources broken to show each of the gate's checks watching. A decimal
// goes in as `decimal('70.50')` and comes out as the number token 70.50,
// and the validator reads that.
//
// Every entry is one file the validator judges, with `expect`:
//
// - `'accepted'`: the gate must accept it -- no error, no warning the
//   register (scripts/validator/warnings.json) does not name.
// - a list of issues, each `{ severity, id | code, expression }`: the gate
//   must refuse it for exactly these and nothing else. `id` is the message
//   id the validator gives an issue; `code` the issue type, for the few the
//   validator gives no id (a JSON parser error); `expression` where the
//   validator says it is. A broken entry is one accepted entry with one
//   thing broken, named in `why`, so that the gate refusing it says the
//   check is watching that thing.
//
// `definition: true` loads the file into the validator as a definition
// too, so that a QuestionnaireResponse is checked against its
// Questionnaire (`-questionnaire check`).
//
// Everything is synthetic: no person, no real code. The one code from an
// external code system, in `questionnaire-code-unchecked-offline.json`, is
// a LOINC code that does not exist: tx.fhir.org called it "Unknown code
// '0000-0' in the CodeSystem 'http://loinc.org' version '2.82'" on
// 17 October 2026, and it carries no LOINC content. The documents' codes
// are HL7's own, from code systems the registered packages hold, which the
// validator checks offline.

import { intake, intakeContext, intakeResponseContext, intakeRoutine, intakeUrgent, minimal, minimalAnswers, minimalContext, minimalResponseContext } from './forms.mjs'

/** The canonical base of the hand-built corpus: IANA's example domain, never fetched. */
const BASE = 'http://example.org'

const SDC = 'http://hl7.org/fhir/uv/sdc/StructureDefinition'

/**
 * The Questionnaire `toQuestionnaire` makes of `form` in `context`; the
 * gate stops on a refusal, which is the package refusing a form the corpus
 * says it maps.
 */
function exported(toQuestionnaire, form, context) {
  const result = toQuestionnaire(form, context)
  if (!result.ok) throw new Error(`the package refused a corpus form: ${result.refusals.map((refusal) => refusal.message).join('; ')}`)
  return result.questionnaire
}

/** A deep copy of a package's Questionnaire, to break: FhirNumbers are kept as they are, frozen and shared. */
function copy(value) {
  if (Array.isArray(value)) return value.map(copy)
  if (typeof value !== 'object' || value === null || Object.getPrototypeOf(value) !== Object.prototype) return value
  return Object.fromEntries(Object.entries(value).map(([name, inner]) => [name, copy(inner)]))
}

/**
 * The package's output, accepted and broken: what
 * `@formancy/health-questionnaire` writes of the synthetic forms, and that
 * output with one thing a decision of 0006 refuses to write put back.
 */
function packageOutput(core, { toQuestionnaire }) {
  const { code, uri } = core
  const made = exported(toQuestionnaire, intake, intakeContext)
  const broken = (change) => {
    const resource = copy(made)
    change(resource)
    return resource
  }
  return [
    // Definitions too: the responses below are judged against them. The
    // broken copies after them share the intake's url and version and are
    // not definitions; with a copy validated and the original loaded as a
    // definition, the validator judges a response against the definition
    // (measured with 7.0.2 on 17 October 2026).
    { file: 'questionnaire-referral-intake.json', expect: 'accepted', definition: true, resource: made },
    { file: 'questionnaire-minimal-v1.json', expect: 'accepted', definition: true, resource: exported(toQuestionnaire, minimal, minimalContext) },
    {
      file: 'questionnaire-option-without-system.json',
      why: "an option coded without a system, as formancy's options are: 'A code with no system has no defined meaning', which is why the package names one under the Questionnaire's url",
      expect: [{ severity: 'warning', id: 'TERMINOLOGY_TX_SYSTEM_NO_CODE', expression: 'Questionnaire.item[0].item[8].answerOption[0].value.ofType(Coding)' }],
      resource: broken((resource) => {
        delete resource.item[0].item[8].answerOption[0].valueCoding.system
      }),
    },
    {
      file: 'questionnaire-version-without-algorithm.json',
      why: "a version without its algorithm: SDC's sdc-2, which the package meets by writing formancy's version number with the integer algorithm",
      expect: [{ severity: 'error', id: 'http://hl7.org/fhir/uv/sdc/StructureDefinition/sdc-questionnairecommon#sdc-2', expression: 'Questionnaire' }],
      resource: broken((resource) => {
        delete resource.extension
      }),
    },
    {
      file: 'questionnaire-page-item-control.json',
      why: "SDC's page item control on a page, which R4's code system of item controls does not have, and which the package therefore does not write",
      expect: [
        { severity: 'error', id: 'Unknown_Code_in_Version', expression: 'Questionnaire.item[0].extension[0].value.ofType(CodeableConcept).coding[0].code' },
        { severity: 'warning', id: 'Terminology_TX_NoValid_2_CC', expression: 'Questionnaire.item[0].extension[0].value.ofType(CodeableConcept)' },
      ],
      resource: broken((resource) => {
        const control = { coding: [{ system: uri('http://hl7.org/fhir/questionnaire-item-control', 'corpus'), code: code('page', 'corpus') }] }
        resource.item[0].extension = [{ url: uri('http://hl7.org/fhir/StructureDefinition/questionnaire-itemControl', 'corpus'), valueCodeableConcept: control }]
      }),
    },
    {
      file: 'questionnaire-min-occurs-not-required.json',
      why: "a minimum of answers on an item that is not required, which R4 allows minOccurs only on, and which the package refuses rather than writes",
      expect: [{ severity: 'error', id: 'Profile_EXT_Not_Here', expression: 'Questionnaire.item[0].item[12]' }],
      resource: broken((resource) => {
        delete resource.item[0].item[12].required
      }),
    },
  ]
}

/**
 * The QuestionnaireResponse `toQuestionnaireResponse` makes of `answers` to
 * `form` in `context`; the gate stops on a refusal, which is the package
 * refusing a submission the corpus says it writes.
 */
function answered(toQuestionnaireResponse, form, answers, context) {
  const result = toQuestionnaireResponse(form, answers, context)
  if (!result.ok) throw new Error(`the package refused a corpus submission: ${result.refusals.map((refusal) => refusal.message).join('; ')}`)
  return result.questionnaireResponse
}

/**
 * The package's responses, accepted and broken: what
 * `@formancy/health-questionnaire` writes of the synthetic submissions, and
 * that output with one thing 0007 refuses or leaves out put back. Each
 * break is found by linkId, so the expressions follow the items.
 */
function responseOutput(core, { toQuestionnaireResponse }) {
  const { integer } = core
  const urgent = answered(toQuestionnaireResponse, intake, intakeUrgent, intakeResponseContext)
  const routine = answered(toQuestionnaireResponse, intake, intakeRoutine, intakeResponseContext)
  const broken = (made, change) => {
    const resource = copy(made)
    change(resource)
    return resource
  }
  const about = (resource) => resource.item[0].item
  const familyName = about(urgent).findIndex((item) => item.linkId === 'family_name')
  const row = about(routine).findIndex((item) => item.linkId === 'contacts')
  // The reason for urgency comes right after the topics in the Questionnaire.
  const topics = about(routine).findIndex((item) => item.linkId === 'topics')
  return [
    { file: 'questionnaireresponse-referral-intake-urgent.json', expect: 'accepted', resource: urgent },
    { file: 'questionnaireresponse-referral-intake-routine.json', expect: 'accepted', resource: routine },
    { file: 'questionnaireresponse-minimal-v1.json', expect: 'accepted', resource: answered(toQuestionnaireResponse, minimal, minimalAnswers, minimalResponseContext) },
    {
      file: 'questionnaireresponse-answer-wrong-type.json',
      why: "an answer of another type than its item's, a number on a text item, which formancy's engine accepts in a text field and the package refuses; on a question no enableWhen reads, since the validator stops the whole run on one that does ('Expected answer and actual answer have incompatible types', measured)",
      expect: [{ severity: 'error', id: 'Questionnaire_QR_Item_WrongType', expression: `QuestionnaireResponse.item[0].item[${String(familyName)}].answer[0].value.ofType(integer)` }],
      resource: broken(urgent, (resource) => {
        about(resource)[familyName].answer = [{ valueInteger: integer('7', 'corpus') }]
      }),
    },
    {
      file: 'questionnaireresponse-answer-on-skipped-page.json',
      why: 'an answer on an item the other answers disable: the contact page the routine intake skips, whose phone number formancy keeps and the package leaves out',
      expect: [{ severity: 'error', id: 'Questionnaire_QR_Item_NotEnabled2', expression: 'QuestionnaireResponse.item[1]' }],
      resource: broken(routine, (resource) => {
        resource.item.push({ linkId: 'contact_page', item: [{ linkId: 'contact_phone', answer: [{ valueString: intakeRoutine.contact_phone }] }] })
      }),
    },
    {
      file: 'questionnaireresponse-answer-on-disabled-item.json',
      why: "an answer on an item a visible rule disables: the reason for urgency the routine intake's answers hide, which formancy's engine clears when its rule hides it, and which the package refuses as disabled",
      expect: [{ severity: 'error', id: 'Questionnaire_QR_Item_NotEnabled2', expression: `QuestionnaireResponse.item[0].item[${String(topics + 1)}]` }],
      resource: broken(routine, (resource) => {
        about(resource).splice(topics + 1, 0, { linkId: 'urgent_reason', answer: [{ valueString: 'Synthetischer Grund' }] })
      }),
    },
    {
      file: 'questionnaireresponse-linkid-not-in-questionnaire.json',
      why: 'an item of a linkId the Questionnaire lacks, which a submission\'s name its form does not have would be, and which the package refuses',
      expect: [{ severity: 'error', id: 'Questionnaire_QR_Item_NotFound', expression: 'QuestionnaireResponse' }],
      resource: broken(urgent, (resource) => {
        resource.item.push({ linkId: 'not_in_form', answer: [{ valueString: 'Synthetic' }] })
      }),
    },
    {
      file: 'questionnaireresponse-empty-row.json',
      why: 'a row of the required repeater that holds nothing, which formancy pads a repeater with and counts, and which the package does not write',
      expect: [
        { severity: 'error', id: 'QUESTIONNAIRE_QR_ITEM_GROUP_REQUIRED', expression: `QuestionnaireResponse.item[0].item[${String(row + 1)}]` },
        // The validator gives this issue its message as its id, with the
        // linkId in it (measured): no other id is there to match.
        { severity: 'error', id: "No response answer found for required item 'contact_name'", expression: `QuestionnaireResponse.item[0].item[${String(row + 1)}]` },
      ],
      resource: broken(routine, (resource) => {
        about(resource).splice(row + 1, 0, { linkId: 'contacts' })
      }),
    },
  ]
}

/**
 * The document `referralDocument` makes of `document`; the gate stops on a
 * refusal, which is the package refusing a document the corpus says it
 * assembles.
 */
function assembled(referralDocument, document) {
  const result = referralDocument(document)
  if (!result.ok) throw new Error(`the package refused a corpus document: ${result.refusals.map((refusal) => refusal.message).join('; ')}`)
  return result.bundle
}

/**
 * The intake's urgent answers as the response a document carries: the
 * same answers and Questionnaire as the corpus's response, its subject,
 * author and source the document's own entries, by their urn:uuid.
 */
export function documentResponse(toQuestionnaireResponse, names) {
  const context = { ...intakeResponseContext, subject: { reference: names.patient }, author: { reference: names.practitioner }, source: { reference: names.patient } }
  return answered(toQuestionnaireResponse, intake, intakeUrgent, context)
}

/**
 * The documents, accepted and broken: what `@formancy/health-document`
 * makes of `@formancy/health-corpus`'s referral letter, the PDF
 * `@formancy/report-render-pdf` 0.1.0 rendered, and that output with one
 * thing R4's document rules ask for taken out, or one thing the package
 * refuses put back (0008). A dangling reference and an entry the
 * Composition does not reach are refused by the package before it writes
 * a Bundle; here they are put back to show the validator refuses them too.
 */
function documentOutput(core, { toQuestionnaireResponse }, { NAMES, referralDocument, PRACTITIONER }, pdf) {
  const withData = assembled(referralDocument, { pdf, placement: 'data' })
  const inBinary = assembled(referralDocument, { pdf, placement: 'binary' })
  const withResponse = assembled(referralDocument, { pdf, placement: 'data', response: documentResponse(toQuestionnaireResponse, NAMES) })
  const broken = (made, change) => {
    const resource = copy(made)
    change(resource)
    return resource
  }
  const at = (bundle, fullUrl) => bundle.entry.findIndex((entry) => entry.fullUrl === fullUrl)
  const attachment = (bundle) => bundle.entry[at(bundle, NAMES.documentReference)].resource.content[0].attachment
  return [
    { file: 'bundle-document-pdf-as-data.json', expect: 'accepted', resource: withData },
    { file: 'bundle-document-pdf-in-binary.json', expect: 'accepted', resource: inBinary },
    { file: 'bundle-document-with-questionnaireresponse.json', expect: 'accepted', resource: withResponse },
    {
      file: 'bundle-document-without-identifier.json',
      why: "a document without its identifier, R4's bdl-9, which the package refuses to assemble without the host's",
      expect: [{ severity: 'error', id: 'http://hl7.org/fhir/StructureDefinition/Bundle#bdl-9', expression: 'Bundle' }],
      resource: broken(withData, (bundle) => {
        delete bundle.identifier
      }),
    },
    {
      file: 'bundle-document-without-timestamp.json',
      why: "a document without its timestamp, R4's bdl-10, which the package writes from the host's instant beside meta.lastUpdated",
      expect: [{ severity: 'error', id: 'http://hl7.org/fhir/StructureDefinition/Bundle#bdl-10', expression: 'Bundle' }],
      resource: broken(withData, (bundle) => {
        delete bundle.timestamp
      }),
    },
    {
      file: 'bundle-document-composition-not-first.json',
      why: "a document whose first entry is not its Composition, R4's bdl-11, which the package always writes first",
      // The validator says it three ways: bdl-11, its own check of the first
      // entry -- placed at the second, measured -- and the Composition and
      // the DocumentReference, which no longer come after it, unreachable
      // forwards from it, both placed at the last entry (measured).
      expect: [
        { severity: 'error', id: 'http://hl7.org/fhir/StructureDefinition/Bundle#bdl-11', expression: 'Bundle' },
        { severity: 'error', id: 'Bundle_BUNDLE_Entry_Document', expression: 'Bundle.entry[1].resource' },
        { severity: 'warning', id: 'BUNDLE_BUNDLE_ENTRY_REVERSE_R4', expression: 'Bundle.entry[5]' },
      ],
      resource: broken(withData, (bundle) => {
        bundle.entry.push(bundle.entry.shift())
      }),
    },
    {
      file: 'bundle-document-composition-without-date.json',
      why: "a Composition without its date, which R4 makes 1..1 and the package refuses to write without the host's",
      expect: [{ severity: 'error', id: 'Validation_VAL_Profile_Minimum', expression: 'Bundle.entry[0].resource/*Composition/null*/' }],
      resource: broken(withData, (bundle) => {
        delete bundle.entry[0].resource.date
      }),
    },
    {
      file: 'bundle-document-dangling-reference.json',
      why: 'a reference to a resource the document does not hold, the patient taken out, which the package refuses as dangling',
      // An error for the Composition's subject, which the validator places at
      // the entry after the Composition while its message names
      // Composition.subject, and a warning at each reference that the
      // urn:uuid is in no entry (measured).
      expect: [
        { severity: 'error', id: 'Bundle_BUNDLE_Entry_NotFound', expression: 'Bundle.entry[1].resource.subject' },
        { severity: 'warning', id: 'Bundle_BUNDLE_Not_Local', expression: 'Bundle.entry[0].resource/*Composition/null*/.subject' },
        { severity: 'warning', id: 'Bundle_BUNDLE_Not_Local', expression: 'Bundle.entry[2].resource/*DocumentReference/null*/.subject' },
      ],
      resource: broken(withData, (bundle) => {
        bundle.entry.splice(at(bundle, NAMES.patient), 1)
      }),
    },
    {
      file: 'bundle-document-unreferenced-entry.json',
      why: 'an entry the Composition does not reach, a second practitioner, which the package refuses as unreferenced',
      expect: [{ severity: 'error', id: 'Bundle_BUNDLE_Entry_Orphan_DOCUMENT', expression: 'Bundle.entry[5]' }],
      resource: broken(withData, (bundle) => {
        bundle.entry.push({ fullUrl: 'urn:uuid:2b0e6f3c-5d1a-4e8b-9c7f-1a2b3c4d5eff', resource: copy(PRACTITIONER) })
      }),
    },
    {
      file: 'bundle-document-attachment-size-wrong.json',
      why: "an attachment's size that is not its bytes', which the package counts from the bytes it encodes",
      expect: [{ severity: 'error', id: 'TYPE_SPECIFIC_CHECKS_DT_ATT_SIZE_CORRECT', expression: 'Bundle.entry[3].resource/*DocumentReference/null*/.content[0].attachment' }],
      resource: broken(withData, (bundle) => {
        attachment(bundle).size = core.unsignedInt(String(pdf.length + 1), 'corpus')
      }),
    },
    {
      file: 'bundle-document-attachment-hash-wrong.json',
      why: "an attachment's SHA-1 that is not its bytes' -- that of no bytes at all -- which the package computes from the bytes it encodes; the validator computes it too, and accepts the package's",
      expect: [{ severity: 'error', id: 'TYPE_SPECIFIC_CHECKS_DT_ATT_HASH_MISMATCH', expression: 'Bundle.entry[3].resource/*DocumentReference/null*/.content[0].attachment' }],
      resource: broken(withData, (bundle) => {
        attachment(bundle).hash = '2jmj7l5rSw0yVb/vlWAYkK/YBwk='
      }),
    },
  ]
}

/**
 * The corpus, built with `core`, health-core's exports; `questionnaire`,
 * health-questionnaire's; `documents`, health-corpus's, which make
 * health-document's Bundles; and `pdf`, the PDF health-corpus rendered with
 * Report: `{ file, expect, why?, definition?, resource }` each.
 */
export function corpus({ core, questionnaire: questionnairePackage, documents, pdf }) {
  const { code, dateTime, decimal, id, uri } = core

  // SDC 4.0.0's sdc-2: "If version is present, versionAlgorithm must be
  // present", and sdc-3 prefers semver. Found by this gate on its first
  // run, on a Questionnaire that had a version and no algorithm.
  const versionAlgorithm = () => ({
    url: uri('http://hl7.org/fhir/StructureDefinition/artifact-versionAlgorithm', 'Questionnaire.extension.url'),
    valueCoding: { system: uri('http://hl7.org/fhir/version-algorithm', 'Questionnaire.extension.valueCoding.system'), code: code('semver', 'Questionnaire.extension.valueCoding.code') },
  })

  const questionnaire = () => ({
    resourceType: 'Questionnaire',
    id: id('referral-intake', 'Questionnaire.id'),
    meta: { profile: [uri(`${SDC}/sdc-questionnaire`, 'Questionnaire.meta.profile')] },
    extension: [versionAlgorithm()],
    url: uri(`${BASE}/Questionnaire/referral-intake`, 'Questionnaire.url'),
    version: '1.0.0',
    name: 'ReferralIntake',
    title: 'Referral intake',
    status: code('draft', 'Questionnaire.status'),
    item: [
      { linkId: 'reason', text: 'Reason for referral', type: code('string', 'Questionnaire.item.type'), required: true },
      { linkId: 'weight', text: 'Body weight in kilograms', type: code('decimal', 'Questionnaire.item.type') },
    ],
  })

  const questionnaireResponse = () => ({
    resourceType: 'QuestionnaireResponse',
    id: id('referral-intake-answers', 'QuestionnaireResponse.id'),
    meta: { profile: [uri(`${SDC}/sdc-questionnaireresponse`, 'QuestionnaireResponse.meta.profile')] },
    questionnaire: uri(`${BASE}/Questionnaire/referral-intake|1.0.0`, 'QuestionnaireResponse.questionnaire'),
    status: code('completed', 'QuestionnaireResponse.status'),
    subject: { reference: 'Patient/synthetic-1' },
    authored: dateTime('2026-10-17T10:00:00+02:00', 'QuestionnaireResponse.authored'),
    item: [
      { linkId: 'reason', text: 'Reason for referral', answer: [{ valueString: 'Follow-up of a synthetic finding' }] },
      // The trailing zero is the point: FHIR keeps a decimal's precision,
      // and writeJson writes the digits it was given.
      { linkId: 'weight', text: 'Body weight in kilograms', answer: [{ valueDecimal: decimal('70.50', 'QuestionnaireResponse.item.answer.valueDecimal') }] },
    ],
  })

  const bundle = () => ({
    resourceType: 'Bundle',
    id: id('referral-intake-collection', 'Bundle.id'),
    type: code('collection', 'Bundle.type'),
    entry: [
      { fullUrl: uri('urn:uuid:8c1e5a52-3f43-4c2a-9a52-6b0e1b1f6a01', 'Bundle.entry.fullUrl'), resource: questionnaire() },
      { fullUrl: uri('urn:uuid:8c1e5a52-3f43-4c2a-9a52-6b0e1b1f6a02', 'Bundle.entry.fullUrl'), resource: questionnaireResponse() },
    ],
  })

  /** `make()` with `change` applied: an accepted resource with one thing broken. */
  const broken = (make, change) => {
    const resource = make()
    change(resource)
    return resource
  }

  return [
    ...packageOutput(core, questionnairePackage),
    ...responseOutput(core, questionnairePackage),
    ...documentOutput(core, questionnairePackage, documents, pdf),
    { file: 'questionnaire.json', expect: 'accepted', definition: true, resource: questionnaire() },
    { file: 'questionnaireresponse.json', expect: 'accepted', resource: questionnaireResponse() },
    { file: 'bundle.json', expect: 'accepted', resource: bundle() },
    {
      file: 'questionnaire-without-status.json',
      why: 'a required element missing: Questionnaire.status is 1..1',
      expect: [{ severity: 'error', id: 'Validation_VAL_Profile_Minimum', expression: 'Questionnaire' }],
      resource: broken(questionnaire, (resource) => {
        delete resource.status
      }),
    },
    {
      file: 'questionnaire-hidden-twice.json',
      why: 'a cardinality broken: SDC allows an item one questionnaire-hidden extension',
      expect: [{ severity: 'error', id: 'Validation_VAL_Profile_Maximum', expression: 'Questionnaire.item[1]' }],
      resource: broken(questionnaire, (resource) => {
        const hidden = () => ({ url: uri('http://hl7.org/fhir/StructureDefinition/questionnaire-hidden', 'Questionnaire.item.extension.url'), valueBoolean: true })
        resource.item[1].extension = [hidden(), hidden()]
      }),
    },
    {
      file: 'questionnaireresponse-two-answers.json',
      why: 'a cardinality broken against the Questionnaire: two answers to an item that does not repeat',
      expect: [{ severity: 'error', id: 'Questionnaire_QR_Item_OnlyOneA', expression: 'QuestionnaireResponse.item[1]' }],
      resource: broken(questionnaireResponse, (resource) => {
        resource.item[1].answer.push({ valueDecimal: decimal('71.00', 'QuestionnaireResponse.item.answer.valueDecimal') })
      }),
    },
    {
      file: 'questionnaire-unknown-item-type.json',
      why: 'a code outside a required binding: number is no QuestionnaireItemType',
      expect: [
        { severity: 'error', id: 'UNABLE_TO_INFER_CODESYSTEM', expression: 'Questionnaire.item[1].type' },
        { severity: 'error', id: 'Terminology_TX_NoValid_16', expression: 'Questionnaire.item[1].type' },
      ],
      resource: broken(questionnaire, (resource) => {
        resource.item[1].type = code('number', 'Questionnaire.item.type')
      }),
    },
    {
      file: 'questionnaireresponse-decimal-as-string.json',
      why: 'a decimal written as a string: the text handed over where a FhirNumber belongs, which writeJson writes quoted',
      expect: [{ severity: 'error', code: 'invalid', expression: 'QuestionnaireResponse.item[1].answer[0].value[x]' }],
      resource: broken(questionnaireResponse, (resource) => {
        resource.item[1].answer[0].valueDecimal = '70.50'
      }),
    },
    {
      file: 'questionnaire-unknown-profile.json',
      why: 'a profile canonical no registered package defines, which the validator only warns of, and an unregistered warning refuses',
      expect: [{ severity: 'warning', id: 'VALIDATION_VAL_PROFILE_UNKNOWN_ERROR', expression: 'Questionnaire.meta.profile[0]' }],
      resource: broken(questionnaire, (resource) => {
        resource.meta.profile = [uri(`${SDC}/sdc-questionnaire-misspelt`, 'Questionnaire.meta.profile')]
      }),
    },
    {
      file: 'questionnaire-code-unchecked-offline.json',
      why: 'a code in a code system no registered package holds, which offline the validator cannot check and says so in a warning, so the gate refuses it until the warning is registered',
      expect: [{ severity: 'warning', id: 'Error_validating_code_running_without_terminology_services', expression: 'Questionnaire.item[0].code[0]' }],
      resource: broken(questionnaire, (resource) => {
        resource.item[0].code = [{ system: uri('http://loinc.org', 'Questionnaire.item.code.system'), code: code('0000-0', 'Questionnaire.item.code.code') }]
      }),
    },
  ]
}
