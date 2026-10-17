# @formancy/health-ch

Formancy Health for Switzerland: the CH ORF document of a referral by form,
for the HL7® FHIR® standard, R4 4.0.1, in the profiles of CH ORF 3.0.2 (Order
& Referral by Form) and CH Core 6.0.0. The host's patient, its author and the
author's organisation, its orders and the answers to its form, as
health-questionnaire wrote them, assembled by health-document into one
Bundle, the Questionnaire named by its versioned canonical. Every value is the
host's -- identifiers, names, dates, codes, each entry's `urn:uuid:` -- and
nothing is made up, sent or fetched: CH ORF's "Submit Bundle" is the host's
to make. A GLN and an AHV number are held to their systems and check digits
here, since the validator only warns of them. What the document cannot say
in CH ORF's and CH Core's profiles is refused whole, every refusal at once,
naming where and never a value. No framework, no Node, no network. Decision
[0009](../../docs/decisions/0009-a-ch-orf-document-is-the-hosts-referral-in-ch-core-and-ch-orf-the-questionnaire-by-canonical-and-swiss-identifiers-checked-here.md)
says why each part is as it is, and what it costs.

```ts
import { writeJson } from '@formancy/health-core'
import { PROFILES, toChOrfDocument } from '@formancy/health-ch'
import { toQuestionnaireResponse } from '@formancy/health-questionnaire'

const answered = toQuestionnaireResponse(form, submission, {
  questionnaire: { base: 'https://forms.example.ch/fhir', version: '3', status: 'active' },
  status: 'completed',
  authored: '2026-10-17T10:00:00+02:00',
  subject: { reference: patientUrl }, // the patient's urn:uuid in the document
  author: { reference: roleUrl },
  profiles: [PROFILES.questionnaireResponse], // CH ORF's response profile, which the document requires
})
if (!answered.ok) throw answered.refusals[0]

const result = toChOrfDocument({
  identifier: 'urn:uuid:…', // the document's, never re-used
  timestamp: '2026-10-17T10:05:00+02:00',
  composition: { fullUrl: 'urn:uuid:…', status: 'final', type, category, date: '2026-10-17T10:00:00+02:00', title: 'Zuweisung', sectionTitle: 'Auftrag' },
  patient: { fullUrl: patientUrl, ahvn13: '756…', identifier: [{ system: 'urn:oid:…', value: '…' }], name: { family: '…', given: ['…'] }, gender: 'female', birthDate: '1980-02-29' },
  author: {
    fullUrl: roleUrl,
    practitioner: { fullUrl: 'urn:uuid:…', gln: '760…', name: { family: '…', given: ['…'], prefix: ['Dr. med.'] } },
    organization: { fullUrl: 'urn:uuid:…', gln: '760…', name: '…' },
  },
  serviceRequests: [{ fullUrl: 'urn:uuid:…', placer: { system: 'urn:oid:…', value: '…' }, status: 'active', intent: 'order' }],
  response: { fullUrl: 'urn:uuid:…', questionnaireResponse: answered.questionnaireResponse },
})
if (result.ok) post(writeJson(result.bundle)) // the host's to send
else for (const refusal of result.refusals) log(refusal.rule, refusal.path)
```

## The document

| Entry | Profile | What it holds |
| --- | --- | --- |
| Bundle | `ch-orf-document`, unversioned, as CH ORF's Submit Bundle says the Bundle "shall include" it | the host's `identifier` under `urn:ietf:rfc:3986`, its timestamp |
| Composition | `ch-orf-composition` 3.0.2 | a narrative of its title and its section's, the host's status, type, one category, date and title; the patient as subject, the role as its one author; the order-referral section, coded LOINC 93037-0 with its LOINC name, holding the answers and then the orders |
| Patient | `ch-core-patient` 6.0.0 | the AHV number under `urn:oid:2.16.756.5.32`; the host's own numbers, typed MR; a family and a given name; gender, but never `unknown`; birth date |
| QuestionnaireResponse | `ch-orf-questionnaireresponse` 3.0.2, as the host's answers claim it | the host's, as health-questionnaire wrote them, copied once and carried as checked |
| ServiceRequest | `ch-orf-servicerequest` 3.0.2 | the placer's number, typed PLAC; status, intent, priority; the patient; the role as requester; authoredOn |
| PractitionerRole | `ch-core-practitionerrole` 6.0.0 | its practitioner and organisation |
| Practitioner | `ch-core-practitioner` 6.0.0 | a GLN under `urn:oid:2.51.1.3`; a name with its family name |
| Organization | `ch-core-organization` 6.0.0 | a GLN; a name |

In that order, which is CH ORF's own example's; one or more orders, in the
host's order; the answers and the organisation where the host gives them.
The same context gives the same bytes, whatever order its names are in.

## The identifiers

- **GLN**: thirteen digits, the last GS1's check digit of the others,
  refused as `identifier` or `check-digit`. One that does not start 76 is a
  GLN all the same.
- **AHV number** (AHVN13): 756, nine digits and GS1's check digit, without
  points. The printed form, `756.XXXX.XXXX.XX`, is refused, not read.
- **The host's own** -- a patient's number in its records, an order's -- are
  under the host's system, which may be none of CH Core's seven, in any
  case: GLN, AHVN13, EPR-SPID, VEKA, ZSR, BER, UIDB. An identifier checked
  here by name cannot pass unchecked under its system.

`gln(value, path)` and `ahvn13(value, path)` check one alone. A refusal of
one never names a digit of it.

## What is refused

Each as health-core's `Refusal`, at a path from `context`, every one at
once:

- what CH ORF requires and the context lacks: a category, a patient, an
  author, an order;
- an identifier not of its form or its check digit;
- a name without its parts, a gender CH Core does not use, a status, intent
  or priority R4 does not have; a text with a character no resource can
  carry -- a control character but the tab and the line breaks, a
  surrogate alone;
- answers that do not claim CH ORF's response profile, that are not the
  patient's, whose author or source is no entry of the document, that
  name their Questionnaire without its version, or that hold a member
  `toQuestionnaireResponse` does not write -- `basedOn`, `encounter`,
  `partOf`, which CH ORF types, an id, a narrative;
- a name given to two entries;
- any member the context does not name -- an address, a telecom, a second
  category -- refused as `unmapped` at the object that holds it, since the
  document would leave it out without a word; and a hole in a list of it,
  at its index.

The answers are copied once, by health-core's writer and reader, and the
copy is what is checked and carried: a host's object that reads one way
and copies another cannot pass as one response and arrive as another. A
refusal never quotes a value. One inside the answers, below their own
members, carries health-core's path, which repeats the names it passed
through (0004): FHIR's, where `toQuestionnaireResponse` wrote them.

What health-document decides of a Composition -- its status, type, date,
titles and narrative -- and of the timestamp, it refuses, and its refusals
are given at the host's paths. It is asked only of a context health-ch
accepts, so a context wrong for both is refused for health-ch's reasons
first.

## What it does not prove, and does not do

The validator gate judges the document this package makes of a synthetic
referral against CH ORF 3.0.2 and CH Core 6.0.0, with CH Term 3.3.0, with
the HL7 FHIR validator 7.0.2, offline, and accepts it with no error and no
warning but dom-6, which every resource without a narrative raises, and
CH Core's `gln-startswith76`, which the corpus's GLNs under GS1's prefix 952
raise. Offline, nothing checks the Composition's type and category against
CH Term's SNOMED CT value sets -- a made-up SNOMED CT code raises nothing
there -- nor the LOINC section code beyond its pattern; and every check of a
GLN's or an AHV number's form or digit is a warning, which is why they are
held here. The corpus's type and category are HL7's own codes, where a host
sends CH Term's SNOMED CT ones under its own licence. The gate judges no
AHV number it should accept: the corpus's one has a wrong check digit, and
a valid one may be a person's, so the AHV number's acceptance rests on this
package's tests.

Two things the guide asks more of than this package writes. The narrative
is headings, the Composition's title and its section's: it meets CH ORF's `Composition.text`
1..1 and not R4's definition of a narrative "clinically safe" for a human
to read alone, and a viewer that shows only the narrative shows an empty
referral. The Questionnaire is not in the Bundle, which CH ORF's prose asks
twice -- "one Questionnaire resource", and that "Other resources that these
referenced resources refer to shall also be included in the Bundle" -- and
its profile, `entry:Questionnaire` 0..1, does not: a receiver that follows
the prose resolves the response's canonical itself.

Not here: the Questionnaire inside the Bundle; a PDF, as a DocumentReference
or as CH ORF's original representation; the Composition's receivers, urgent
contacts, data enterer, initiator, precedent document, episode and consent;
the filler's number; Coverage, Appointment, Encounter, RelatedPerson and
Location; addresses and telecoms; EPR-SPID, VEKA, ZSR, BER and UIDB; a
response's `basedOn`, `encounter` and `partOf`; the CSS stylesheet CH ORF's
prose mentions, which no profile and no example of it holds; and CH ORF's
"generic elements" of a Questionnaire, which no profile encodes. A context
that holds one of them is refused. Nothing is sent.

HL7, FHIR and the FHIR [FLAME DESIGN] are the registered trademarks of
Health Level Seven International and their use does not constitute
endorsement by HL7.

This package writes LOINC's code 93037-0, which CH ORF fixes, with its
LOINC long common name, "Portable medical order form". This material
contains content from LOINC (http://loinc.org). LOINC is copyright ©
Regenstrief Institute, Inc. and the Logical Observation Identifiers Names
and Codes (LOINC) Committee and is available at no cost under the license at
http://loinc.org/license. LOINC® is a registered United States trademark of
Regenstrief Institute, Inc.

Source-available, not open source: see [`LICENSE.md`](../../LICENSE.md).
