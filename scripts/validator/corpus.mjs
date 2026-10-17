// What the validator gate judges (0005): FHIR resources written by
// `@formancy/health-core`, as built, with what each must make of the gate.
//
// Two kinds. **Package output**: the Questionnaires
// `@formancy/health-questionnaire`, as built, makes of the synthetic forms
// in scripts/validator/forms.mjs (0006), which between them hold every
// field type and rule version 1 maps -- scripts/validator/corpus.test.mjs
// derives that set from the package and holds the forms to it -- and, each
// broken for one thing, the package's output with what a decision of 0006
// left out put back, so the gate shows why it is left out. **Built by
// hand** from health-core's primitives and written by its `writeJson`: a
// QuestionnaireResponse and a Bundle, which no package builds yet (H05,
// H06), the Questionnaire they answer, and the resources broken to show
// each of the gate's checks watching. A decimal goes in as
// `decimal('70.50')` and comes out as the number token 70.50, and the
// validator reads that.
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
// 17 October 2026, and it carries no LOINC content.

import { intake, intakeContext, minimal, minimalContext } from './forms.mjs'

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
    { file: 'questionnaire-referral-intake.json', expect: 'accepted', resource: made },
    { file: 'questionnaire-minimal-v1.json', expect: 'accepted', resource: exported(toQuestionnaire, minimal, minimalContext) },
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
 * The corpus, built with `core`, health-core's exports, and `questionnaire`,
 * health-questionnaire's: `{ file, expect, why?, definition?, resource }` each.
 */
export function corpus({ core, questionnaire: questionnairePackage }) {
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
