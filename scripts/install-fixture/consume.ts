/*
 * A consumer that knows nothing about the workspace.
 *
 * Copied into a temporary npm project by install-test.mjs, installed from the
 * packed tarballs, type-checked with skipLibCheck OFF and run under Node. What
 * is on trial is that the published entry points resolve, with the types that
 * shipped.
 */
import { createHash } from 'node:crypto'
import {
  FHIR_VERSION,
  Refusal,
  dateTime,
  decimal,
  fromBase64Binary,
  integer,
  language,
  readJson,
  toBase64Binary,
  writeJson,
  type FhirDecimal,
  type FhirInteger,
  type FhirJson,
} from '@formancy/health-core'
import { CH_ORF_DOCUMENT, GLN_SYSTEM, PROFILES, ahvn13, gln, toChOrfDocument, type ChOrfContext } from '@formancy/health-ch'
import {
  PROVED_PDF_PROFILES,
  toDocumentBundle,
  toDocumentReference,
  type Bundle,
  type DocumentContext,
  type DocumentReferenceContext,
} from '@formancy/health-document'
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
const translated =
  '"_text":{"extension":[{"url":"http://hl7.org/fhir/StructureDefinition/translation","extension":[{"url":"lang","valueCode":"fr"},{"url":"content","valueString":"Poids"}]}]}'
for (const part of [`"profile":["${SDC_QUESTIONNAIRE}"]`, '"code":"integer"', '"version":"1"', '"valueDecimal":0.5', translated]) {
  if (!written_questionnaire.includes(part)) throw new Error(`the Questionnaire lacks ${part}: ${written_questionnaire}`)
}

// A field version 1 does not map refuses the whole export with a Refusal
// of health-core's, the class a host already branches on: a dist that
// carried a second copy of health-core would fail the instanceof.
const signed = toQuestionnaire({ ...form, model: { fields: [{ key: 'drawn', type: 'signature' }] } }, host)
const [refusal] = signed.ok ? [] : signed.refusals
if (!(refusal instanceof Refusal) || refusal.rule !== 'unmapped' || refusal.path !== 'form.model.fields[0].type')
  throw new Error('a signature field was not refused as unmapped, by a Refusal')

// The answers to that form become a QuestionnaireResponse through the
// published entry, to the Questionnaire's url and version, and writeJson
// writes it: a dist that wrote a number answer other than as its double's
// shortest text, named another canonical, lost the profile, or declared a
// response writeJson's types do not take, fails here.
const answering: ResponseContext = {
  questionnaire: host,
  status: 'completed',
  authored: '2026-10-17T10:00:00+02:00',
  subject: { reference: 'Patient/synthetic-1' },
}
const replied = toQuestionnaireResponse(form, { weight: 70.5 }, answering)
if (!replied.ok) throw new Error(`toQuestionnaireResponse refused answers it writes: ${replied.refusals.map((refusal) => refusal.message).join('; ')}`)
const response: QuestionnaireResponse = replied.questionnaireResponse
const written_response = writeJson(response)
for (const part of [
  `"profile":["${SDC_QUESTIONNAIRE_RESPONSE}"]`,
  `"questionnaire":"${questionnaire.url}|1"`,
  '"item":[{"linkId":"weight","answer":[{"valueDecimal":70.5}]}]',
]) {
  if (!written_response.includes(part)) throw new Error(`the QuestionnaireResponse lacks ${part}: ${written_response}`)
}

// An answer formancy's step admits and R4's integer does not is refused,
// by health-core's Refusal, naming where and never the value.
const counted: Parameters<typeof toQuestionnaireResponse>[0] = { ...form, model: { fields: [{ key: 'children', type: 'number', step: 1 }] } }
const stepped = toQuestionnaireResponse(counted, { children: 2.0000001 }, answering)
const [stepRefusal] = stepped.ok ? [] : stepped.refusals
if (
  !(stepRefusal instanceof Refusal) ||
  stepRefusal.rule !== 'grammar' ||
  stepRefusal.path !== 'answers.children' ||
  stepRefusal.message.includes('2.0000001')
) {
  throw new Error('a fraction on an integer item was not refused by a Refusal at its path')
}

// A host attaches a PDF's bytes to a DocumentReference through the
// published entry, and health-core's writeJson writes it: a dist that
// encoded a byte wrongly, counted the bytes otherwise, or hashed anything
// but the bytes -- held here to Node's own base64 and SHA-1 -- fails here.
// The PDF is the smallest one health-document attaches, and synthetic.
const pdfBytes = new Uint8Array(Buffer.from('%PDF-1.4\n%synthetic\n%%EOF\n', 'latin1'))
const names = {
  composition: 'urn:uuid:00000000-0000-4000-8000-000000000001',
  patient: 'urn:uuid:00000000-0000-4000-8000-000000000002',
  documentReference: 'urn:uuid:00000000-0000-4000-8000-000000000003',
}
const consultation = { system: 'http://terminology.hl7.org/CodeSystem/v2-0270', code: 'CN', display: 'Consultation' }
const referenceContext: DocumentReferenceContext = {
  status: 'current',
  type: consultation,
  subject: { reference: names.patient },
  date: '2026-10-17T10:00:00+02:00',
  title: 'Zuweisung',
}
const attached = toDocumentReference({ bytes: pdfBytes, profile: 'PDF' }, referenceContext)
if (!attached.ok) throw new Error(`toDocumentReference refused a plain PDF: ${attached.refusals.map((refusal) => refusal.message).join('; ')}`)
const written_reference = writeJson(attached.documentReference)
const sha1 = createHash('sha1').update(pdfBytes).digest('base64')
const attachment = `"attachment":{"contentType":"application/pdf","data":"${Buffer.from(pdfBytes).toString('base64')}","size":${String(pdfBytes.length)},"hash":"${sha1}","title":"Zuweisung"}`
if (!written_reference.includes(attachment)) throw new Error(`the DocumentReference lacks ${attachment}: ${written_reference}`)
if (!Buffer.from(fromBase64Binary(toBase64Binary(pdfBytes, 'data'), 'data')).equals(Buffer.from(pdfBytes)))
  throw new Error('health-core did not read back the bytes it encoded')
if (PROVED_PDF_PROFILES.join() !== 'PDF') throw new Error(`the published package attaches ${PROVED_PDF_PROFILES.join()}, not a plain PDF alone`)

// The document Bundle through the published entry: the Composition first,
// the timestamp written as meta.lastUpdated too, the host's entries after.
const document: DocumentContext = {
  identifier: { system: 'urn:ietf:rfc:3986', value: 'urn:uuid:00000000-0000-4000-8000-000000000009' },
  timestamp: '2026-10-17T10:05:00+02:00',
  composition: {
    fullUrl: names.composition,
    status: 'final',
    type: consultation,
    subject: { reference: names.patient },
    date: '2026-10-17T10:00:00+02:00',
    author: [{ reference: names.patient }],
    title: 'Zuweisung',
    section: [{ title: 'Zuweisung', entry: [{ reference: names.documentReference }] }],
  },
  entries: [
    { fullUrl: names.patient, resource: { resourceType: 'Patient', name: [{ family: 'Beispiel' }] } },
    { fullUrl: names.documentReference, resource: attached.documentReference },
  ],
}
const assembled = toDocumentBundle(document)
if (!assembled.ok) throw new Error(`toDocumentBundle refused a document it assembles: ${assembled.refusals.map((refusal) => refusal.message).join('; ')}`)
const bundle: Bundle = assembled.bundle
const written_bundle = writeJson(bundle)
const head = `{"resourceType":"Bundle","meta":{"lastUpdated":"2026-10-17T10:05:00+02:00"},"identifier":{"system":"urn:ietf:rfc:3986","value":"urn:uuid:00000000-0000-4000-8000-000000000009"},"type":"document","timestamp":"2026-10-17T10:05:00+02:00","entry":[{"fullUrl":"${names.composition}","resource":{"resourceType":"Composition"`
if (!written_bundle.startsWith(head) || !written_bundle.includes(attachment)) throw new Error(`the Bundle is not the document: ${written_bundle.slice(0, 400)}`)

// A PDF declared PDF/A, which nothing has proved, and a reference to an
// entry the document does not hold, are refused by health-core's Refusal,
// the class a host already branches on: a dist with a second copy of
// health-core would fail the instanceof.
const declared = toDocumentReference({ bytes: pdfBytes, profile: 'PDF/A-2b' }, referenceContext)
const [unproved] = declared.ok ? [] : declared.refusals
if (!(unproved instanceof Refusal) || unproved.rule !== 'unproved' || unproved.path !== 'pdf.profile')
  throw new Error('a PDF/A declaration was not refused as unproved')
const dangling = toDocumentBundle({ ...document, entries: document.entries.slice(1) })
const [unresolved] = dangling.ok ? [] : dangling.refusals
if (!(unresolved instanceof Refusal) || unresolved.rule !== 'dangling' || unresolved.path !== 'context.composition.subject.reference')
  throw new Error('a dangling reference was not refused')

// The declarations hold a host to bytes and to the profiles named: a
// string is not bytes, and a profile that is none does not compile.
export function refusedByTheDocumentTypes(): void {
  // @ts-expect-error a PDF's bytes are a Uint8Array, not its text
  toDocumentReference({ bytes: '%PDF-1.4', profile: 'PDF' }, referenceContext)
  // @ts-expect-error PDF/A without its conformance level names no profile
  toDocumentReference({ bytes: pdfBytes, profile: 'PDF/A' }, referenceContext)
}

// A CH ORF document from the tarballs: the answers health-questionnaire
// writes, claiming CH ORF's response profile as the host passes it, and
// the host's patient, author and order, which health-ch writes in CH
// Core's and CH ORF's profiles and health-document assembles. A dist that
// lost a profile, the LOINC section code CH ORF fixes or its LOINC name, a
// GLN's system or the entries' order fails here; and one whose
// health-document or health-questionnaire were second copies would refuse
// what the other wrote. The GLNs are under GS1's prefix 952, kept for
// examples, so nobody's; no valid AHV number is written here, nor in any
// file, which scripts/synthetic-identifiers.test.mjs holds.
const chNames = {
  document: 'urn:uuid:00000000-0000-4000-8000-0000000000c0',
  composition: 'urn:uuid:00000000-0000-4000-8000-0000000000c1',
  patient: 'urn:uuid:00000000-0000-4000-8000-0000000000c2',
  response: 'urn:uuid:00000000-0000-4000-8000-0000000000c3',
  order: 'urn:uuid:00000000-0000-4000-8000-0000000000c4',
  role: 'urn:uuid:00000000-0000-4000-8000-0000000000c5',
  practitioner: 'urn:uuid:00000000-0000-4000-8000-0000000000c6',
}
const chAnswers = toQuestionnaireResponse(
  form,
  { weight: 70.5 },
  { ...answering, subject: { reference: chNames.patient }, author: { reference: chNames.role }, profiles: [PROFILES.questionnaireResponse] },
)
if (!chAnswers.ok) throw new Error(`toQuestionnaireResponse refused CH ORF's claim: ${chAnswers.refusals.map((refusal) => refusal.message).join('; ')}`)
const referral: ChOrfContext = {
  identifier: chNames.document,
  timestamp: '2026-10-17T10:05:00+02:00',
  composition: {
    fullUrl: chNames.composition,
    status: 'final',
    type: consultation,
    category: { system: 'http://terminology.hl7.org/CodeSystem/v3-ActClass', code: 'DOCCLIN' },
    date: '2026-10-17T10:00:00+02:00',
    title: 'Zuweisung',
    sectionTitle: 'Auftrag',
  },
  patient: { fullUrl: chNames.patient, identifier: [{ system: 'urn:oid:2.999.756.1', value: 'P-0001' }], name: { family: 'Beispiel', given: ['Synthetica'] } },
  author: { fullUrl: chNames.role, practitioner: { fullUrl: chNames.practitioner, gln: '9520000000011', name: { family: 'Muster' } } },
  serviceRequests: [
    {
      fullUrl: chNames.order,
      placer: { system: 'urn:ietf:rfc:3986', value: 'urn:uuid:00000000-0000-4000-8000-0000000000c7' },
      status: 'active',
      intent: 'order',
    },
  ],
  response: { fullUrl: chNames.response, questionnaireResponse: chAnswers.questionnaireResponse },
}
const chOrf = toChOrfDocument(referral)
if (!chOrf.ok) throw new Error(`toChOrfDocument refused a referral it writes: ${chOrf.refusals.map((refusal) => refusal.message).join('; ')}`)
const chOrfBundle: Bundle = chOrf.bundle
const written_ch_orf = writeJson(chOrfBundle)
const chOrfHead = `{"resourceType":"Bundle","meta":{"lastUpdated":"2026-10-17T10:05:00+02:00","profile":["${CH_ORF_DOCUMENT}"]},"identifier":{"system":"urn:ietf:rfc:3986","value":"${chNames.document}"}`
for (const part of [
  chOrfHead,
  `"meta":{"profile":["${PROFILES.composition}"]}`,
  '"code":{"coding":[{"system":"http://loinc.org","code":"93037-0","display":"Portable medical order form"}]}',
  `{"system":"${GLN_SYSTEM}","value":"9520000000011"}`,
  `"profile":["${PROFILES.patient}"]`,
]) {
  if (!written_ch_orf.includes(part)) throw new Error(`the CH ORF document lacks ${part}: ${written_ch_orf.slice(0, 400)}`)
}
const chOrfTypes = chOrf.bundle.entry.map((entry) => entry.resource['resourceType']).join()
if (chOrfTypes !== 'Composition,Patient,QuestionnaireResponse,ServiceRequest,PractitionerRole,Practitioner')
  throw new Error(`the CH ORF document's entries are ${chOrfTypes}`)

// A GLN whose check digit is not GS1's, and an AHV number in its printed
// form, are refused by health-core's Refusal at their paths, naming no
// digit: the validator only warns of either.
if (gln('9520000000011', 'gln') !== '9520000000011') throw new Error('gln() did not keep a GLN')
try {
  gln('9520000000012', 'context.author.practitioner.gln')
  throw new Error('gln() accepted a wrong check digit')
} catch (error) {
  if (!(error instanceof Refusal) || error.rule !== 'check-digit' || error.message.includes('952')) throw error
}
try {
  ahvn13('756.1234.5678.90', 'context.patient.ahvn13')
  throw new Error('ahvn13() accepted the printed form')
} catch (error) {
  if (!(error instanceof Refusal) || error.rule !== 'identifier' || error.path !== 'context.patient.ahvn13') throw error
}
const unchecked = toChOrfDocument({ ...referral, author: { ...referral.author, practitioner: { ...referral.author.practitioner, gln: '9520000000012' } } })
const [digit] = unchecked.ok ? [] : unchecked.refusals
if (!(digit instanceof Refusal) || digit.rule !== 'check-digit' || digit.path !== 'context.author.practitioner.gln')
  throw new Error('a wrong GLN was not refused in the document')

// The declarations hold a host to what CH Core uses: gender unknown,
// which CH Core says Switzerland does not use, does not compile.
export function refusedByTheChTypes(): void {
  // @ts-expect-error CH Core's ch-pat-2: gender unknown is not used in Switzerland
  toChOrfDocument({ ...referral, patient: { ...referral.patient, gender: 'unknown' } })
}

console.log(`ok: @formancy/health-core emits FHIR ${FHIR_VERSION}, and wrote ${written}`)
console.log(`ok: @formancy/health-questionnaire wrote a Questionnaire of ${String(written_questionnaire.length)} characters and refused a signature`)
console.log(
  `ok: @formancy/health-questionnaire wrote a QuestionnaireResponse of ${String(written_response.length)} characters and refused a fraction on an integer item`,
)
console.log(
  `ok: @formancy/health-document wrote a document Bundle of ${String(written_bundle.length)} characters carrying a PDF, and refused a PDF/A declaration and a dangling reference`,
)
console.log(
  `ok: @formancy/health-ch wrote a CH ORF document of ${String(written_ch_orf.length)} characters, and refused a GLN's wrong check digit and a printed AHV number`,
)
