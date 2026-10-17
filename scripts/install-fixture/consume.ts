/*
 * A consumer that knows nothing about the workspace.
 *
 * Copied into a temporary npm project by install-test.mjs, installed from the
 * packed tarballs, type-checked with skipLibCheck OFF and run under Node. What
 * is on trial is that the published entry points resolve, with the types that
 * shipped.
 */
import {
  FHIR_VERSION,
  Refusal,
  dateTime,
  decimal,
  integer,
  language,
  readJson,
  writeJson,
  type FhirDecimal,
  type FhirInteger,
  type FhirJson,
} from '@formancy/health-core'
import {
  SDC_QUESTIONNAIRE,
  SDC_QUESTIONNAIRE_RESPONSE,
  toQuestionnaire,
  toQuestionnaireResponse,
  type Questionnaire,
  type QuestionnaireContext,
  type QuestionnaireResponse,
  type ResponseContext,
} from '@formancy/health-questionnaire'

// The published code carries the FHIR version the package emits, and its
// declaration says exactly which: a dist that lost the constant fails the
// run, and a declaration that widened it to `string` fails the type-check,
// here rather than in a host that switches on it. Held in a `let` first:
// a declaration emitted as `= "4.0.1"` rather than `: "4.0.1"` is a literal
// that widens to `string` there, and assigned straight to the literal type
// it would pass.
let held = FHIR_VERSION
const version: '4.0.1' = held
if (version !== '4.0.1') throw new Error(`FHIR_VERSION is ${String(version)}, not 4.0.1`)

// A host builds a resource from exact values and gets their digits back,
// the trailing zero included, through the published writer and reader. A
// dist that wrote a decimal through a double prints 70.5 here, and one
// whose reader lost a digit fails the round trip.
const weight: FhirDecimal = decimal('70.50', 'Observation.valueQuantity.value')
const observation: FhirJson = {
  resourceType: 'Observation',
  status: 'final',
  effectiveDateTime: dateTime('2026-10-17T10:00:00+02:00', 'Observation.effectiveDateTime'),
  valueQuantity: { value: weight, unit: 'kg' },
}
const written = writeJson(observation)
const expected = '{"resourceType":"Observation","status":"final","effectiveDateTime":"2026-10-17T10:00:00+02:00","valueQuantity":{"value":70.50,"unit":"kg"}}'
if (written !== expected) throw new Error(`writeJson wrote ${written}`)
if (writeJson(readJson(written)) !== written) throw new Error('readJson and writeJson did not round-trip the observation')

// A refusal is a class a host can catch and branch on by its rule, from
// outside the package: a dist that threw a plain Error, or lost the rule
// or the path, fails here.
try {
  integer('2147483648', 'Observation.valueInteger')
  throw new Error('integer() accepted a value past 32 bits')
} catch (error) {
  if (!(error instanceof Refusal) || error.rule !== 'range' || error.path !== 'Observation.valueInteger') throw error
}

// A language is a tag in its canonical case, from outside too: a dist that
// lost the check would let `de-ch` through, which the HL7 validator
// refuses as a resource's language.
if (language('de-CH', 'Questionnaire.language') !== 'de-CH') throw new Error('language() did not keep de-CH')
try {
  language('de-ch', 'Questionnaire.language')
  throw new Error('language() accepted de-ch')
} catch (error) {
  if (!(error instanceof Refusal) || error.rule !== 'language-tag') throw error
}

// The declarations hold a host to exact values: a JavaScript number is not
// FHIR JSON, and an integer is not a decimal. Each directive fails tsc if
// the line after it compiles, so a declaration that loosened either would
// be found here. Never called: the types are what is on trial.
export function refusedByTheTypes(): void {
  // @ts-expect-error a JavaScript number is not a FHIR JSON value
  writeJson({ valueQuantity: { value: 70.5 } })
  const count: FhirInteger = integer('7', 'Observation.valueInteger')
  // @ts-expect-error an integer was checked as an integer, not as a decimal
  const asDecimal: FhirDecimal = count
  void asDecimal
}

// A formancy form becomes a Questionnaire through the published entry, and
// health-core's writeJson writes it: a dist that wrote a bound through a
// double, lost the translation or the version algorithm, or declared a
// Questionnaire writeJson's types do not take, fails here. The form is
// synthetic and read through @formancy/spec as npm installed it.
const host: QuestionnaireContext = { base: 'https://forms.synthetic.invalid', version: '1', status: 'active', languages: ['fr'] }
// Typed as the parameter is, @formancy/spec's FormSchema as npm installed
// it, which a declaration that lost its import of the spec would fail.
const form: Parameters<typeof toQuestionnaire>[0] = {
  specVersion: '4',
  id: 'intake',
  title: 'Intake',
  model: { fields: [{ key: 'weight', type: 'number', label: { $t: 'weight' }, min: 0.5 }] },
  i18n: { defaultLocale: 'en', messages: { en: { weight: 'Weight' }, fr: { weight: 'Poids' } } },
}
const made = toQuestionnaire(form, host)
if (!made.ok) throw new Error(`toQuestionnaire refused a form it maps: ${made.refusals.map((refusal) => refusal.message).join('; ')}`)
const questionnaire: Questionnaire = made.questionnaire
const written_questionnaire = writeJson(questionnaire)
const translated = '"_text":{"extension":[{"url":"http://hl7.org/fhir/StructureDefinition/translation","extension":[{"url":"lang","valueCode":"fr"},{"url":"content","valueString":"Poids"}]}]}'
for (const part of [`"profile":["${SDC_QUESTIONNAIRE}"]`, '"code":"integer"', '"version":"1"', '"valueDecimal":0.5', translated]) {
  if (!written_questionnaire.includes(part)) throw new Error(`the Questionnaire lacks ${part}: ${written_questionnaire}`)
}

// A field version 1 does not map refuses the whole export with a Refusal
// of health-core's, the class a host already branches on: a dist that
// carried a second copy of health-core would fail the instanceof.
const signed = toQuestionnaire({ ...form, model: { fields: [{ key: 'drawn', type: 'signature' }] } }, host)
const [refusal] = signed.ok ? [] : signed.refusals
if (!(refusal instanceof Refusal) || refusal.rule !== 'unmapped' || refusal.path !== 'form.model.fields[0].type') throw new Error('a signature field was not refused as unmapped, by a Refusal')

// The answers to that form become a QuestionnaireResponse through the
// published entry, to the Questionnaire's url and version, and writeJson
// writes it: a dist that wrote a number answer other than as its double's
// shortest text, named another canonical, lost the profile, or declared a
// response writeJson's types do not take, fails here.
const answering: ResponseContext = { questionnaire: host, status: 'completed', authored: '2026-10-17T10:00:00+02:00', subject: { reference: 'Patient/synthetic-1' } }
const replied = toQuestionnaireResponse(form, { weight: 70.5 }, answering)
if (!replied.ok) throw new Error(`toQuestionnaireResponse refused answers it writes: ${replied.refusals.map((refusal) => refusal.message).join('; ')}`)
const response: QuestionnaireResponse = replied.questionnaireResponse
const written_response = writeJson(response)
for (const part of [`"profile":["${SDC_QUESTIONNAIRE_RESPONSE}"]`, `"questionnaire":"${questionnaire.url}|1"`, '"item":[{"linkId":"weight","answer":[{"valueDecimal":70.5}]}]']) {
  if (!written_response.includes(part)) throw new Error(`the QuestionnaireResponse lacks ${part}: ${written_response}`)
}

// An answer formancy's step admits and R4's integer does not is refused,
// by health-core's Refusal, naming where and never the value.
const counted: Parameters<typeof toQuestionnaireResponse>[0] = { ...form, model: { fields: [{ key: 'children', type: 'number', step: 1 }] } }
const stepped = toQuestionnaireResponse(counted, { children: 2.0000001 }, answering)
const [stepRefusal] = stepped.ok ? [] : stepped.refusals
if (!(stepRefusal instanceof Refusal) || stepRefusal.rule !== 'grammar' || stepRefusal.path !== 'answers.children' || stepRefusal.message.includes('2.0000001')) {
  throw new Error('a fraction on an integer item was not refused by a Refusal at its path')
}

console.log(`ok: @formancy/health-core emits FHIR ${FHIR_VERSION}, and wrote ${written}`)
console.log(`ok: @formancy/health-questionnaire wrote a Questionnaire of ${String(written_questionnaire.length)} characters and refused a signature`)
console.log(`ok: @formancy/health-questionnaire wrote a QuestionnaireResponse of ${String(written_response.length)} characters and refused a fraction on an integer item`)
