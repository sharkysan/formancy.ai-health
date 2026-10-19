# Getting started: a formancy form, its answers and a Report PDF as FHIR resources, and a CH ORF referral

This guide takes an application developer from an empty npm project to
what Formancy Health 0.1.0 exports: a formancy form as an SDC
Questionnaire, a person's answers to it as a QuestionnaireResponse, a PDF
that Formancy Report rendered in a document Bundle, and a referral as a CH
ORF document, each FHIR® R4 JSON written exactly. It is written for the
0.1.0 developer preview: the packages are the ones
[README.md](../README.md#packages) lists, under Node. Nothing in them sends
anything: your application gets the JSON back and sends it itself.
Formancy Health is not an EHR, a FHIR server or a terminology service, and
it is not intended as a medical device: the packages write what your
application hands them and compute no clinical result -- no score, no
clinical warning, no therapy suggested.

To see what the packages make of a referral before installing anything,
the demo at https://formancy.ai/health/ runs them in your browser on a
synthetic one, as the README's [Try it](../README.md#try-it) says; this
guide is what your own application does with them.

Formancy Health is source-available, not open source: evaluating and
developing with it, as this guide does, is free, and running it in
production takes a paid licence. The
[licence table](../README.md#licence-in-one-table) says what is free, what
is not, and where a production licence is requested. Formancy Report's
packages, which section 4 renders its PDF with, are on the same terms, and
running them in production takes Report's licence as well.

**How this guide is kept true.** Every TypeScript block below is one
program, `referral.ts`, compiled by the install gate,
`pnpm test:e2e:install`, against the packages as `pnpm pack` packs them,
installed with what section 1 installs into a plain npm project of its
own, type-checked with `skipLibCheck` off against Node's types, and run:
it must print exactly the lines this guide shows it printing, and write
`document.json` and `ch-orf.json`, each a document Bundle. CI runs the gate
on every pull request and before every release
([0011](./decisions/0011-a-release-report-is-derived-from-the-run-that-gated-it.md)).
`scripts/getting-started.test.mjs`, in `pnpm test:repo`, fails when a
block of code is not handed to the gate, when the program imports a package
section 1 does not tell you to install, when section 1 installs other than
what the gate installs or at another version, and when a link here no
longer lands. What neither checks: that the resources the program writes
conform -- the validator gate judges its own corpus, made by the same
packages of synthetic forms and a synthetic referral
([the validator gate](../README.md#the-validator-gate)), and not this
program's output -- and whatever your application does with them after.

Everything in it is made up: the form, the answers, the patient, the
practitioner and every identifier. No AHV number is written here, since any
number that passes its check may be a person's.

## 1. Install

The program is TypeScript, run by Node through `tsx`. In a new npm project
(`npm init -y`), make the project one of ES modules -- the packages are,
and the program awaits at its top level -- and add the tools, at the
releases the install gate builds it with:

```sh guide=node
npm pkg set type=module
npm install --save-dev typescript@~6.0.3 tsx@^4.20.3 @types/node@^22.10.0
```

Then the packages. They are ES modules with an `exports` map; import their
entry points, never a file under `dist/`. `--save-exact` saves each as the
release it installs, as the gate's project names them, rather than as
npm's default range:

```sh guide=node
npm install --save-exact @formancy/health-core @formancy/health-questionnaire @formancy/health-document @formancy/health-ch @formancy/spec@0.6.0
```

`@formancy/spec` is formancy's, under Apache-2.0: the form's types, at the
release health-questionnaire reads forms through. Install that release
and no other, so that the form your program types and the form the package
reads are one copy.

To render the PDF section 4 attaches, Formancy Report's runtime and
renderer, at the release the corpus renders with:

```sh guide=node
npm install --save-exact @formancy/report-runtime@0.1.0 @formancy/report-render-pdf@0.1.0
```

Report 0.1.0 brings an `@formancy/spec` of its own, 0.5.0, which npm
installs under `@formancy/report-spec`, beside the 0.6.0 above: Report
hashes its own definitions with it, and none of its types is the form's,
so nothing of it reaches the form your program types. An application that
has its PDF already needs neither: health-document takes a PDF's bytes,
from wherever they came.

Last, a `tsconfig.json` with the settings the gate type-checks the program
under -- strict, the library declaration files checked too, and Node's
types:

```json
{
  "compilerOptions": {
    "strict": true,
    "exactOptionalPropertyTypes": true,
    "noUncheckedIndexedAccess": true,
    "skipLibCheck": false,
    "target": "ES2023",
    "module": "NodeNext",
    "moduleResolution": "nodenext",
    "lib": ["ES2023"],
    "types": ["node"],
    "noEmit": true
  },
  "include": ["*.ts"]
}
```

Write the program in `referral.ts`, check it with `npx tsc`, and run it
with `npx tsx referral.ts`. What the packages are built and judged against
-- FHIR, the guides, the validator, Node and TypeScript -- is the table
under
[*What it is built and judged against*](../README.md#what-it-is-built-and-judged-against)
in the README.

## 2. A Questionnaire from a formancy form

A formancy form is formancy's JSON, typed by `@formancy/spec`: its fields,
their rules, and its texts in each language. This one is a short referral
in Swiss German, with its French texts: a question, an urgency, a reason
shown only when the referral is urgent, and a weight. Your application
publishes it under a canonical base it names -- a name, never fetched --
and as the version formancy published. In `referral.ts`:

```ts guide=node
import type { FormSchema } from '@formancy/spec'
import { writeJson } from '@formancy/health-core'
import { toQuestionnaire, type QuestionnaireContext } from '@formancy/health-questionnaire'

const form: FormSchema = {
  specVersion: '4',
  id: 'referral',
  title: 'Zuweisung',
  model: {
    fields: [
      { key: 'question', type: 'textarea', label: { $t: 'question' }, required: true, maxLength: 2000 },
      {
        key: 'urgency',
        type: 'radio',
        label: { $t: 'urgency' },
        required: true,
        options: [
          { value: 'routine', label: { $t: 'routine' } },
          { value: 'urgent', label: { $t: 'urgent' } },
        ],
      },
      { key: 'reason', type: 'text', label: { $t: 'reason' } },
      { key: 'weight', type: 'number', label: { $t: 'weight' }, min: 0.5, max: 300 },
    ],
  },
  logic: { rules: [{ target: 'reason', kind: 'visible', cel: "urgency == 'urgent'" }] },
  i18n: {
    defaultLocale: 'de-CH',
    messages: {
      'de-CH': { question: 'Fragestellung', urgency: 'Dringlichkeit', routine: 'Normal', urgent: 'Dringend', reason: 'Grund der Dringlichkeit', weight: 'Gewicht in Kilogramm' },
      fr: { question: 'Question posée', urgency: 'Urgence', routine: 'Normale', urgent: 'Urgente', reason: "Motif de l'urgence", weight: 'Poids en kilogrammes' },
    },
  },
}

const published: QuestionnaireContext = { base: 'https://forms.example.org/fhir', version: '3', status: 'active', languages: ['fr'] }

const made = toQuestionnaire(form, published)
if (!made.ok) throw new Error(made.refusals.map((refusal) => `${refusal.rule} at ${refusal.path}`).join('; '))
const { questionnaire } = made
// The languages the first item's text is translated into, from its translation extensions.
const translated = (questionnaire.item?.[0]?._text?.extension ?? []).flatMap((translation) => (translation.extension ?? []).filter((part) => part.url === 'lang').map((part) => String(part.valueCode)))
console.log(`Questionnaire ${questionnaire.url}|${String(questionnaire.version)}: ${String(questionnaire.item?.length)} items, in ${String(questionnaire.language)} and ${translated.join(', ')}`)

// The same form with a signature field, which version 1 does not map.
const signed = toQuestionnaire({ ...form, model: { fields: [...form.model.fields, { key: 'signed', type: 'signature', label: { $t: 'question' } }] } }, published)
if (!signed.ok) for (const refusal of signed.refusals) console.log(`refused: ${refusal.rule} at ${refusal.path}`)
```

This prints:

```text guide=node
Questionnaire https://forms.example.org/fhir/Questionnaire/referral|3: 4 items, in de-CH and fr
refused: unmapped at form.model.fields[4].type
```

Each field is an item whose linkId is its key; the visible rule is the
reason's `enableWhen`; the French texts are R4's translation extension on
each text; the version is written with the version algorithm SDC asks for
beside it. `writeJson(questionnaire)` is the JSON to send: health-core's
writer, never `JSON.stringify`, which would throw on a bound like `0.5`,
held as its digits. What an item cannot say as the field says it refuses
the whole export, every refusal at once, each a `rule` and a `path` and
never a value
([the mapping](../packages/health-questionnaire/README.md#the-mapping)).

## 3. A QuestionnaireResponse from a submission

A submission is what formancy's engine holds when the person submits:
its `value()`, a number as the double it holds. The response is walked from
the Questionnaire's own mapping, so its linkIds, types and conditions are
the Questionnaire's, and it names the Questionnaire by its url and version.
The patient is named as your application names the entry it will put the
patient in -- a `urn:uuid:`, here -- and never by an address. Still in
`referral.ts`:

```ts guide=node
import { toQuestionnaireResponse, type ResponseContext } from '@formancy/health-questionnaire'

const names = {
  patient: 'urn:uuid:5c0e9a3f-2b7d-4e18-9f61-0a4b3c2d1e01',
  practitioner: 'urn:uuid:5c0e9a3f-2b7d-4e18-9f61-0a4b3c2d1e02',
  response: 'urn:uuid:5c0e9a3f-2b7d-4e18-9f61-0a4b3c2d1e03',
}

const submission = { question: 'Synthetische Fragestellung, ohne klinische Bedeutung.', urgency: 'urgent', reason: 'Synthetischer Grund', weight: 70.5 }
const answering: ResponseContext = { questionnaire: published, status: 'completed', authored: '2026-10-17T10:00:00+02:00', subject: { reference: names.patient } }

const answered = toQuestionnaireResponse(form, submission, answering)
if (!answered.ok) throw new Error(answered.refusals.map((refusal) => `${refusal.rule} at ${refusal.path}`).join('; '))
const response = answered.questionnaireResponse
console.log(`QuestionnaireResponse to ${response.questionnaire}: ${String(response.item?.length)} answers`)
console.log(`weight: ${writeJson(response.item?.[3] ?? null)}`)

// An option the question does not offer, a reason that answer leaves hidden, and a weight past its bound.
const wrong = toQuestionnaireResponse(form, { ...submission, urgency: 'tomorrow', weight: 3000 }, answering)
if (!wrong.ok) for (const refusal of wrong.refusals) console.log(`refused: ${refusal.rule} at ${refusal.path}`)
```

This prints:

```text guide=node
QuestionnaireResponse to https://forms.example.org/fhir/Questionnaire/referral|3: 4 answers
weight: {"linkId":"weight","answer":[{"valueDecimal":70.5}]}
refused: option at answers.urgency
refused: disabled at answers.reason
refused: bound at answers.weight
```

A number answer is exactly the double formancy holds, written as its
shortest text: `70.50` typed is 70.5 before the package sees it. The
authored time is your application's clock, never read here. Every refusal
names where in the answers, and never the answer
([the answers](../packages/health-questionnaire/README.md#the-answers)).

## 4. A document Bundle with a Report PDF attached

A PDF travels as its own bytes. Here Formancy Report renders the referral
letter -- a definition and its data, resolved and drawn in Node -- and
health-document attaches the bytes to a DocumentReference, with their size
and SHA-1 computed from them, and assembles a document Bundle of what its
Composition refers to. In `referral.ts`:

```ts guide=node
import { createHash } from 'node:crypto'
import { writeFile } from 'node:fs/promises'
import { resolveReport, type ReportData, type ReportDefinition } from '@formancy/report-runtime'
import { renderPdf } from '@formancy/report-render-pdf'

const letter: ReportDefinition = {
  reportSpecVersion: '0',
  id: 'referral-letter',
  title: 'Zuweisung',
  locale: 'de-CH',
  page: { size: 'A4', orientation: 'portrait', margins: { top: 56.69, right: 56.69, bottom: 56.69, left: 56.69 } },
  styles: [{ id: 'title', size: 16, bold: true }],
  datasets: {
    header: {
      id: 'referral',
      fields: [
        { id: 'patient', type: 'string', label: 'Patientin', nullable: false },
        { id: 'question', type: 'string', label: 'Fragestellung', nullable: false },
      ],
    },
  },
  parameters: [],
  assets: [],
  aggregates: [],
  regions: {
    reportHeader: [{ id: 'title', kind: 'text', style: 'title', content: [{ kind: 'text', text: 'Zuweisung' }] }],
    pageHeader: [],
    body: [
      { id: 'patient', kind: 'text', content: [{ kind: 'text', text: 'Patientin: ' }, { kind: 'field', field: { dataset: 'header', field: 'patient' } }] },
      { id: 'question', kind: 'text', content: [{ kind: 'field', field: { dataset: 'header', field: 'question' } }] },
    ],
    summary: [],
    pageFooter: [],
  },
}

const letterData: ReportData = {
  header: { patient: 'Synthetica Beispiel', question: submission.question },
  completeness: { complete: true, captured: 0 },
  consistency: 'host-captured',
}

const resolution = resolveReport(letter, letterData, { mode: 'final', creationDate: '2026-10-17T08:00:00Z', timeZone: 'Europe/Zurich' })
if (!resolution.ok) throw new Error(resolution.errors.map((error) => `${error.code} at ${error.path}`).join('; '))
const pdf = await renderPdf(resolution.document, { maxPages: 2 })
```

The creation date and the zone are yours to fix: the same report, data and
date print the same PDF. Then, still in `referral.ts`, attach it, and
assemble the document from your application's resources -- the patient,
the practitioner, the letter and the answers of section 3:

```ts guide=node
import { toDocumentBundle, toDocumentReference, type DocumentReferenceContext } from '@formancy/health-document'

const consultation = { system: 'http://terminology.hl7.org/CodeSystem/v2-0270', code: 'CN', display: 'Consultation' }
const filing: DocumentReferenceContext = { status: 'current', type: consultation, subject: { reference: names.patient }, date: '2026-10-17T10:00:00+02:00', title: 'Zuweisung' }

const attached = toDocumentReference({ bytes: pdf, profile: 'PDF' }, filing)
if (!attached.ok) throw new Error(attached.refusals.map((refusal) => `${refusal.rule} at ${refusal.path}`).join('; '))
const { attachment } = attached.documentReference.content[0]
if (attachment.size.text !== String(pdf.length) || attachment.hash !== createHash('sha1').update(pdf).digest('base64')) throw new Error('the attachment does not describe the PDF')

const letterNames = {
  document: 'urn:uuid:5c0e9a3f-2b7d-4e18-9f61-0a4b3c2d1e10',
  composition: 'urn:uuid:5c0e9a3f-2b7d-4e18-9f61-0a4b3c2d1e11',
  letter: 'urn:uuid:5c0e9a3f-2b7d-4e18-9f61-0a4b3c2d1e12',
}

const assembled = toDocumentBundle({
  identifier: { system: 'urn:ietf:rfc:3986', value: letterNames.document },
  timestamp: '2026-10-17T10:05:00+02:00',
  composition: {
    fullUrl: letterNames.composition,
    status: 'final',
    type: consultation,
    subject: { reference: names.patient },
    date: '2026-10-17T10:00:00+02:00',
    author: [{ reference: names.practitioner }],
    title: 'Zuweisung',
    section: [{ title: 'Zuweisung', entry: [{ reference: letterNames.letter }, { reference: names.response }] }],
  },
  entries: [
    { fullUrl: names.patient, resource: { resourceType: 'Patient', name: [{ family: 'Beispiel', given: ['Synthetica'] }] } },
    { fullUrl: names.practitioner, resource: { resourceType: 'Practitioner', name: [{ family: 'Muster', given: ['Probus'], prefix: ['Dr. med.'] }] } },
    { fullUrl: letterNames.letter, resource: attached.documentReference },
    { fullUrl: names.response, resource: response },
  ],
})
if (!assembled.ok) throw new Error(assembled.refusals.map((refusal) => `${refusal.rule} at ${refusal.path}`).join('; '))
await writeFile('document.json', writeJson(assembled.bundle))
console.log(`document: ${assembled.bundle.entry.map((entry) => String(entry.resource['resourceType'])).join(', ')}`)
console.log(`attached: ${attachment.contentType}, "${attachment.title}", with the size and SHA-1 of the bytes Report rendered`)

// The same PDF declared PDF/A, which no gate here has proved Report writes.
const archived = toDocumentReference({ bytes: pdf, profile: 'PDF/A-2b' }, filing)
if (!archived.ok) for (const refusal of archived.refusals) console.log(`refused: ${refusal.rule} at ${refusal.path}: ${refusal.message}`)
```

This prints:

```text guide=node
document: Composition, Patient, Practitioner, DocumentReference, QuestionnaireResponse
attached: application/pdf, "Zuweisung", with the size and SHA-1 of the bytes Report rendered
refused: unproved at pdf.profile: pdf.profile: it declares a PDF profile that no gate here has proved its producer makes, and a declaration is never taken on trust: until one is proved, only a plain PDF is attached
```

The Composition comes first, then your entries in your order, every
reference resolved before anything is written: an entry the Composition
does not reach, a reference to one the Bundle lacks, or an attachment whose
size or hash are not its bytes' refuses the document whole
([the document](../packages/health-document/README.md#the-document)). The
bytes may go in a Binary beside the DocumentReference instead, by giving
`filing` a `binary` and the document the Binary `toDocumentReference`
returns as an entry. Every identifier and every `urn:uuid:` is yours, and
so is keeping the document's identifier unique: the same input gives the
same Bundle, identifier included.

## 5. A CH ORF document

For Switzerland, health-ch writes a referral in CH ORF 3.0.2's and CH Core
6.0.0's profiles: your application's patient, author and order, and the
answers health-questionnaire wrote, claiming CH ORF's response profile and
written down by the author's role. A GLN is held to GS1's check digit here,
since the validator only warns of a wrong one; the GLNs below are under
GS1's prefix 952, kept for examples. In `referral.ts`:

```ts guide=node
import { PROFILES, toChOrfDocument, type ChOrfContext } from '@formancy/health-ch'

const orf = {
  document: 'urn:uuid:5c0e9a3f-2b7d-4e18-9f61-0a4b3c2d1e20',
  composition: 'urn:uuid:5c0e9a3f-2b7d-4e18-9f61-0a4b3c2d1e21',
  role: 'urn:uuid:5c0e9a3f-2b7d-4e18-9f61-0a4b3c2d1e22',
  organization: 'urn:uuid:5c0e9a3f-2b7d-4e18-9f61-0a4b3c2d1e23',
  order: 'urn:uuid:5c0e9a3f-2b7d-4e18-9f61-0a4b3c2d1e24',
}

const forOrf = toQuestionnaireResponse(form, submission, { ...answering, author: { reference: orf.role }, profiles: [PROFILES.questionnaireResponse] })
if (!forOrf.ok) throw new Error(forOrf.refusals.map((refusal) => `${refusal.rule} at ${refusal.path}`).join('; '))

const referral: ChOrfContext = {
  identifier: orf.document,
  timestamp: '2026-10-17T10:05:00+02:00',
  composition: {
    fullUrl: orf.composition,
    status: 'final',
    type: consultation,
    category: { system: 'http://terminology.hl7.org/CodeSystem/v3-ActClass', code: 'DOCCLIN', display: 'clinical document' },
    date: '2026-10-17T10:00:00+02:00',
    title: 'Zuweisung',
    sectionTitle: 'Auftrag',
  },
  patient: { fullUrl: names.patient, identifier: [{ system: 'urn:oid:2.999.756.1', value: 'P-0001' }], name: { family: 'Beispiel', given: ['Synthetica'] }, gender: 'female', birthDate: '1980-02-29' },
  author: {
    fullUrl: orf.role,
    practitioner: { fullUrl: names.practitioner, gln: '9520000000011', name: { family: 'Muster', given: ['Probus'], prefix: ['Dr. med.'] } },
    organization: { fullUrl: orf.organization, gln: '9520000000028', name: 'Praxis Synthetica' },
  },
  serviceRequests: [{ fullUrl: orf.order, placer: { system: 'urn:ietf:rfc:3986', value: 'urn:uuid:5c0e9a3f-2b7d-4e18-9f61-0a4b3c2d1e25' }, status: 'active', intent: 'order', priority: 'urgent', authoredOn: '2026-10-17T10:00:00+02:00' }],
  response: { fullUrl: names.response, questionnaireResponse: forOrf.questionnaireResponse },
}

const chOrf = toChOrfDocument(referral)
if (!chOrf.ok) throw new Error(chOrf.refusals.map((refusal) => `${refusal.rule} at ${refusal.path}`).join('; '))
await writeFile('ch-orf.json', writeJson(chOrf.bundle))
console.log(`CH ORF document: ${chOrf.bundle.entry.map((entry) => String(entry.resource['resourceType'])).join(', ')}`)
console.log(`claiming ${String(chOrf.bundle.meta.profile?.[0])}`)

// The practitioner's GLN with its last digit mistyped.
const mistyped = toChOrfDocument({ ...referral, author: { ...referral.author, practitioner: { ...referral.author.practitioner, gln: '9520000000012' } } })
if (!mistyped.ok) for (const refusal of mistyped.refusals) console.log(`refused: ${refusal.rule} at ${refusal.path}: ${refusal.message}`)
```

This prints:

```text guide=node
CH ORF document: Composition, Patient, QuestionnaireResponse, ServiceRequest, PractitionerRole, Practitioner, Organization
claiming http://fhir.ch/ig/ch-orf/StructureDefinition/ch-orf-document
refused: check-digit at context.author.practitioner.gln: context.author.practitioner.gln: its check digit is not the one its identifier system computes from its other digits
```

The patient's own number is under your system -- here under 2.999, the
joint ISO/ITU-T arc for examples -- and an AHV number goes in `patient.ahvn13`, thirteen digits
without points, held to its check digit as a GLN is. The answers name the
Questionnaire by its versioned canonical, which your application publishes,
and the Bundle does not carry it, against two SHALLs of CH ORF's prose,
which decision
[0009](./decisions/0009-a-ch-orf-document-is-the-hosts-referral-in-ch-core-and-ch-orf-the-questionnaire-by-canonical-and-swiss-identifiers-checked-here.md)
records as a cost. Nor does it carry the PDF of section 4: in 0.1.0 a CH
ORF document holds the answers and not the letter. What else it refuses,
and what CH ORF asks of a document that this one does not write, is
[health-ch's README](../packages/health-ch/README.md#what-is-refused).

## 6. What this does not do

- **Send.** No package reaches the network: a canonical is a name, a
  Questionnaire is never fetched, and `document.json` and `ch-orf.json`
  are yours to send, by the transport the receiver asks for.
- **Prove conformance of your resources.** The validator gate judges the
  corpus's resources, made by these packages, against pinned guide
  packages, offline; a claim about a resource names that guide, that
  validator and that corpus, and nothing more. Offline, a LOINC, SNOMED CT
  or UCUM code and a language tag's registration are not checked
  ([0005](./decisions/0005-a-fhir-resource-is-proved-by-the-hl7-validator-against-pinned-guide-packages.md)).
- **Archive.** A PDF is attached as a plain PDF, checked by its first and
  last lines; PDF/A is refused until a gate proves a producer writes it
  ([0008](./decisions/0008-a-document-is-a-bundle-of-what-it-refers-to-and-a-pdf-its-own-bytes-never-an-unproved-pdf-a.md)).
- **Decide anything clinical.** What a resource says is what your
  application handed over.

---

HL7, FHIR and the FHIR [FLAME DESIGN] are the registered trademarks of
Health Level Seven International and their use does not constitute
endorsement by HL7.
