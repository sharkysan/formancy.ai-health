# @formancy/health-document

A PDF's bytes as an R4 DocumentReference, in its attachment or in a Binary
beside it, and a document Bundle for the HL7® FHIR® standard, R4 4.0.1:
the host's Composition first, then only what it refers to, every reference
resolved before anything is written. Every part of it is the host's --
identifiers, names, dates, codes, the PDF -- and nothing is made up, sent
or fetched. What a document cannot be is refused whole, every refusal at
once, naming where and never a value. No framework, no Node, no network,
and no dependency but health-core, whose readers of a host's context it
reads the context with. Decision
[0008](../../docs/decisions/0008-a-document-is-a-bundle-of-what-it-refers-to-and-a-pdf-its-own-bytes-never-an-unproved-pdf-a.md)
says why each part is as it is, and what it costs.

```ts
import { writeJson } from '@formancy/health-core'
import { toDocumentBundle, toDocumentReference } from '@formancy/health-document'

const attached = toDocumentReference(
  { bytes: pdf, profile: 'PDF' }, // a Uint8Array, and what the host says it is
  {
    status: 'current',
    type: { system: 'http://terminology.hl7.org/CodeSystem/v2-0270', code: 'CN', display: 'Consultation' },
    subject: { reference: 'urn:uuid:…' }, // by name, never an address
    date: '2026-10-17T10:00:00+02:00', // the host's clock
    title: 'Zuweisung',
    binary: { fullUrl: 'urn:uuid:…' }, // leave out to put the bytes in the attachment
  },
)
if (!attached.ok) throw attached.refusals[0]

const result = toDocumentBundle({
  identifier: { system: 'urn:ietf:rfc:3986', value: 'urn:uuid:…' }, // never re-used
  timestamp: '2026-10-17T10:05:00+02:00',
  composition: { fullUrl: 'urn:uuid:…', status: 'final', type, subject, date, author, title, section },
  entries: [
    { fullUrl: 'urn:uuid:…', resource: patient },
    { fullUrl: 'urn:uuid:…', resource: attached.documentReference },
    { fullUrl: 'urn:uuid:…', resource: attached.binary },
  ],
})
if (result.ok) send(writeJson(result.bundle))
else for (const refusal of result.refusals) log(refusal.rule, refusal.path)
```

## The PDF

`toDocumentReference(pdf, context)` writes `content.attachment` from the
bytes themselves: `contentType` `application/pdf`; the bytes as base64 in
`data`, or, with `binary`, a Binary that holds them and a `url` that names
it; `size`, their number; `hash`, their SHA-1 as R4 asks, base64,
computed here; and the host's `title`. The bytes are copied once, when
checked, by calling nothing they bring -- a Node Buffer's `slice` shares
its memory, so a Buffer the host reuses afterwards changes nothing
attached -- and read back unchanged: the tests decode what was written and
compare every byte, and health-corpus does the same with Node's base64 on
the PDF Formancy Report renders.

What the host says the PDF is, `profile`, is checked, never assumed:

| Declared | Here |
| --- | --- |
| `PDF` | Attached, when its first line is a header ISO 32000 defines (`%PDF-1.0` to `%PDF-1.7`, `%PDF-2.0`) and its last `%%EOF` alone. Nothing else of it is read: no parser, and nothing said of whether it is well formed. |
| `PDF/A-1a` to `PDF/A-4f` | Refused, as `unproved`: no gate here has proved that a producer makes PDF/A, and a receiver archives a document as PDF/A because its sender said so. veraPDF arrives with H09, on a Report release that writes it. |
| Anything else, `PDF/UA-1` among them | Refused, as `unmapped`. |

`PROVED_PDF_PROFILES` is the list of what is attached: `['PDF']`.

The context gives the DocumentReference's `status` (`current`,
`superseded`, `entered-in-error`), `type` and `category` by one coding
each, `subject` and `author` by name, `date`, an instant with its zone,
and `title`. R4 makes most of them optional; each of status, type,
subject, date and title is refused as `absent` when missing, since a
DocumentReference without one says nothing a receiver files it by.

## The document

`toDocumentBundle(context)` writes R4's document: `type` `document`, the
host's `identifier` with its system and value (bdl-9), its `timestamp`
(bdl-10), written as `meta.lastUpdated` too, the document date
documents.html makes mandatory, since R4 calls each the moment the document
was assembled; the Composition first (bdl-11), under the
`urn:uuid:` the host gives it; then the host's entries, in its order. The
Composition takes, in R4's names, its `status`, `type`, `category`,
`subject`, `date`, `author`, `title` and `section`s, each a title, a code
where given and its `entry` references; and its `identifier` where the host
gives one. A section has no narrative. The Composition has one, written
here and never taken from the host: `generated`, a `div` in the XHTML
namespace of its title as a heading and each section's title as one below
it, escaped by health-core's `xhtmlText`, and nothing else -- what R4
calls "entirely generated from the core elements in the content". A title
XML cannot carry is refused where it stands. A guide may ask for it, as CH
ORF makes `Composition.text` 1..1; R4 presents a document by its
Composition's narrative and its sections'. Headings alone meet a guide's
1..1 and not R4's definition of a narrative "clinically safe" for a
human to read alone, which 0009 records as a cost
([0009](../../docs/decisions/0009-a-ch-orf-document-is-the-hosts-referral-in-ch-core-and-ch-orf-the-questionnaire-by-canonical-and-swiss-identifiers-checked-here.md)).
The host may name the profile the Bundle claims, `profile`, written in its
`meta` after `lastUpdated`, and the one the Composition claims,
`composition.profile`: canonicals, never fetched, each held to R4's uri.

Every reference in every entry is resolved before output: to the
`urn:uuid:` of an entry, or refused -- `dangling` when it names nothing
the Bundle holds, a `Type/id` included, since entries named by `urn:uuid:`
answer to no other name; `reference` when it is an address, contained or
versioned, or names a type R4 does not allow at its element. A
DocumentReference's attachment `url` must name a Binary entry. Then every
entry the Composition does not reach, following references forwards, is
refused as `unreferenced`, and two entries of one name as
`duplicate-entry`. Every attachment of a DocumentReference's content is
held to its bytes, in its data or in the Binary its url names: a size or
a SHA-1 they do not have, or a media type the Binary does not state, is
refused as `mismatch`, so a DocumentReference that states one PDF's size
or hash is never written beside another PDF's Binary; an attachment that
states neither is not read. That reads and hashes the bytes again, about
0.1 s a megabyte (25 MB in 2.7 s, measured on 17 October 2026). Each
entry's resource is written and read back by health-core, which refuses
what FHIR JSON cannot carry at its path, and
the Bundle holds that copy: a host that changes its objects afterwards
does not change the document. Every Resource.id is R4's id. The same
input gives the same bytes, whatever order the context names things in;
the host's resources are written in the order the host gave them.

That is stricter than R4, which asks the Bundle to hold what the
Composition refers to and lets what those resources refer to be left
out: here a DocumentReference whose author is `Practitioner/<id>` on the
receiver's server is refused as dangling.

Paths start at `pdf` or `context` and walk the host's names:
`context.entries[2].resource.subject.reference`.

Each part of the context, and the PDF, is read for the members it names
and no others, by health-core's `known`: one more -- a Composition's
confidentiality, a coding's version, a reference's display, an entry's
search, a PDF's file name -- is something the host meant to say, and is
refused as `unmapped` at the object that holds it, its name not
repeated. A part that is no object is refused as `absent`, and a hole in
a list, which a host's array may have and JSON never does, at its index
(0009).

## What it does not prove, and does not do

The validator gate judges what this package makes of health-corpus's
referral letter against R4 4.0.1, with the HL7 FHIR validator 7.0.2,
offline, and accepts it with no error and no warning but dom-6, which
every resource but the Composition raises, having no narrative; it
checks the attachment's size and SHA-1 against its data, and with the
bytes in a Binary says it did not check them ("not a directly accessible
link"), which `toDocumentBundle` does, and health-corpus's tests on its
output. An attachment `url` that names no entry it accepts, with only
an information that it cannot find it (measured on 17 October 2026):
this package's `dangling` is what refuses it. A media type is not checked
offline.

Not here: a narrative of any resource but the Composition, or one of more
than its titles; a Provenance or a stylesheet, which R4 admits in a
document and which are refused as unreferenced; Composition's encounter,
attester, custodian, confidentiality and events, refused where given; DocumentReference's
format code, context and security labels; a bound on the PDF's size,
which nothing has measured; reading a document back; and the MHD provide
Bundle, which comes with CH EPR. An Attachment's url is followed only in a
DocumentReference's content. A reference's target type is checked where
this package knows its element -- Composition.author, DocumentReference's
subject and author -- and elsewhere only against a type the reference
itself states.

HL7, FHIR and the FHIR [FLAME DESIGN] are the registered trademarks of
Health Level Seven International and their use does not constitute
endorsement by HL7.

Source-available, not open source: see [`LICENSE.md`](../../LICENSE.md).
