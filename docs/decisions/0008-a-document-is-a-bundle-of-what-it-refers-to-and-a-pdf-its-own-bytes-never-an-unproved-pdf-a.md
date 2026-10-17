# 0008 — Assemble a document from the host's resources, the Composition first and only what it refers to, every reference resolved; attach a PDF by its own bytes; and refuse a PDF profile nothing here has proved

- **Status:** accepted
- **Date:** 2026-10-17
- **Deciders:** Daniel Bacher
- **Verified by:** the tests of `@formancy/health-document`,
  `@formancy/health-corpus` and `@formancy/health-core`, run by their
  `test:coverage` jobs in CI; the validator gate; guards in
  `pnpm test:repo`; and the install gate:
  - **The PDF**: health-document's `pdf.test.ts` holds each header ISO
    32000 defines and each end-of-line after `%%EOF` accepted, and refused
    as `not-pdf` no bytes, an HTML page, a byte-order mark, versions 1.8
    and 3.0, a header that runs on, a file cut short, a marker not alone
    on its line, bytes after it and an empty line after it; every PDF/A
    level refused as `unproved`, PDF/UA and misspellings as `unmapped`,
    `PROVED_PDF_PROFILES` exactly `['PDF']`, and the bytes kept as a copy,
    made by calling nothing the bytes bring -- not a `slice` that shares
    their memory, as Node's Buffer's does, nor one that answers with
    other bytes.
    `sha1.test.ts` holds the digest to FIPS 180-2's vectors, to Node's
    crypto at each length either side of the block boundaries, and the
    length's two words past 2^29 bytes; health-core's `base64.test.ts`
    holds RFC 4648's vectors, every byte value at every place in a
    quantum, `/`, one canonical spelling, and the base64 of six million
    bytes checked and read back, every byte.
  - **The DocumentReference**: `document-reference.test.ts` holds the
    resource written exactly, with the size and SHA-1 of the bytes; a PDF
    of some 300,000 bytes, every byte value among them, decoded from what was
    written and compared byte for byte; the Binary named by the
    attachment's url; each of status, type, subject, date and title
    refused when absent; each element refused for what it is; every
    refusal at once, none quoting a value; the same bytes for the same
    input, whatever order the context names things in.
  - **The document**: `bundle.test.ts` holds the Bundle written exactly,
    the Composition first and the timestamp as `meta.lastUpdated`; the same
    bytes for the same input, whatever order the context names things in,
    and none of the host's objects kept; each thing the document must be
    given; a dangling reference, a `Type/id` in the Composition and in an
    entry, an address, a contained and a versioned reference, a target
    type R4 does not allow, a type the reference states and does not
    resolve to, an attachment url to nothing or to no Binary; an entry the Composition
    does not reach, a Provenance among them; two entries of one name; an
    entry's resource health-core cannot write, refused at its path under
    the entry's; a uri R4 calls reference read as none; and every refusal
    at once, in the document's order, none quoting a value; and a
    DocumentReference refused for the size and SHA-1 of another PDF's
    Binary, for a media type its Binary does not state, for data that is
    not the bytes its size and hash describe, and for bytes it cannot
    read, and one that states neither size nor hash taken, its bytes
    unread.
  - **The PDF Report renders, attached**: health-corpus's `pdf.test.ts`
    holds the referral letter's definition to Report's own validator, its
    PDF rendered by `@formancy/report-render-pdf` 0.1.0, to the same bytes
    twice, accepted as a plain PDF and refused declared PDF/A-1b or -2b,
    and the corpus stopped, naming code and place and no value, when Report
    refuses its data;
    `documents.test.ts` reads the Bundle back from its JSON text and holds
    the bytes, in the attachment and in a Binary, decoded by Node's own
    base64, to every byte Report rendered, with Node's SHA-1 and their
    size; the bytes of a Node Buffer the host reuses after handing it
    over, from a getter read after the check, attached as they were
    checked; byte-identical JSON for the same input; and the document refused
    for each dangling reference without its patient, and for the size
    and hash of another letter's Binary put in place of its own. It holds
    health-document's SHA-1 to Node's for every length from 16 to 156
    bytes.
  - **Conformance**, on the package's output: `node scripts/validator.mjs`
    judges three documents health-document makes of that PDF -- the bytes
    in the attachment, in a Binary, and beside the intake's
    QuestionnaireResponse of 0007, judged against its Questionnaire --
    against R4 4.0.1, and accepts them with no error and no warning but
    dom-6; and nine made of them with one thing taken out or put back --
    no identifier (bdl-9), no timestamp (bdl-10), the Composition not
    first (bdl-11), no Composition.date, the patient taken out, an entry
    nothing reaches, a size and a SHA-1 that are not the bytes' -- which
    the validator must refuse for exactly that.
  - **The corpus covers what the packages write**:
    `scripts/validator/corpus.test.mjs` derives the resource types each
    package's exports write from the exports themselves, fails when an
    export writes one no probe asks about, and fails when a resource type
    the packages write, or a place health-document puts a PDF's bytes,
    stands in no resource the gate accepts; and when a corpus document is
    not the package's.
  - **The guards**: `scripts/exact-and-reproducible.test.mjs` walks
    health-document and health-core's `base64.ts`, its floor naming them,
    and not health-corpus; `scripts/dependency-licences.test.mjs` finds
    health-document published, health-corpus and Report not;
    `scripts/ci-test-jobs.test.mjs`, `codecov-config.test.mjs`,
    `trademark.test.mjs` and `source-size.test.mjs` find both packages.
  - **From outside**: `pnpm test:e2e:install` packs health-document,
    never health-corpus, writes a DocumentReference and a document from
    the tarballs, holds the attachment to Node's base64 and SHA-1, and
    catches the refusals of a PDF/A declaration and of a dangling
    reference as health-core's `Refusal`; its type-check fails if the
    declarations admit a string as bytes or `PDF/A` as a profile.

  On 17 October 2026 each was watched failing, the file restored byte for
  byte after, by a script that planted one change at a time and ran the
  suite: the seven new rules of health-core before they existed; in
  base64, the bits padding leaves unchecked, either way, base64url's
  alphabet, no bytes and no Uint8Array accepted, a third byte dropped, the
  reader skipping the check; in SHA-1, the block boundary at 55, a round
  constant, the schedule unrotated, the length's high word dropped -- which
  first failed nothing, since no test hashes half a gigabyte, and is now
  a function the tests reach; in health-document, the header, the trailer
  and the marker's line unchecked, PDF/A and an unknown profile accepted,
  the bytes not copied, the size off by one, the hash of other bytes, the
  status binding, the subject's types, a dangling reference and a dangling
  attachment url accepted, reachability, duplicates, target types and a
  stated type unchecked, the timestamp not written as lastUpdated, the
  Composition not first, a uri and an Expression's reference read as
  references, the attachment url not followed, a host's resource not
  copied, its type and id unchecked, a refusal's path not re-rooted, a
  section without entries, a Composition's id unchecked and a title of
  spaces accepted. Two changes first failed nothing, which showed two
  tests missing, written then: the links of one resource taken out of
  order, and a Composition author's types unchecked for a `Type/id`. In
  health-corpus, against packages built with a third byte dropped, the
  SHA-1's length in bytes, the size counted after base64 and a Binary's
  bytes written in the attachment too. In the guards: the test matrix
  without either package, `codecov.yml` without health-document, a
  `Number()`, a `crypto`, a `new Date()` and a unary plus planted in
  health-document's and health-core's new sources, and health-document's
  manifest declaring Apache-2.0, which `verify-licenses.mjs` refused. In
  the corpus guard: the document with a Binary taken out, every document
  taken out, an export no probe knows, and a corpus document that is not
  the package's. In the gate, with the identifier, the patient or the
  right size left in, each broken document was said to be "broken for
  …, and the gate accepted it: nothing is watching that".

  In review the same day, each the same way: the bytes copied by their
  own `slice`, which let a Buffer reused after the check put an HTML page
  in the attachment as the PDF, failed the two new cases of `pdf.test.ts`
  and, built, health-corpus's Buffer case; a coding written in the order
  the host named its parts failed the two cases of the context's order;
  and a `Type/id` in an entry accepted as resolved, which before failed
  nothing, failed its new case. Measuring the document's time on a 5 MB
  PDF found base64Binary's regex out of stack on four megabytes' base64:
  the case of six million bytes failed with a RangeError before the check
  read character by character, and each of its parts -- the padding's
  bits, a partial quantum, a character past the alphabet -- planted back
  failed the cases that hold it. The attachments' check was written
  test-first, its four refusals failing before it existed, and each of
  its six parts planted back failed its case: the media type, the size,
  the hash, a Binary's bytes not read, unreadable bytes passed over, and
  bytes read with nothing to check; health-corpus's case of another
  letter's Binary failed against the package built without it.

## Context

H06's acceptance, from the plan: the Bundle and Composition rules of
section 9 validated; PDF bytes from `@formancy/report-render-pdf` 0.1.0 in
the corpus attached and read back unchanged; a declared PDF profile
without proof is refused; dangling references refuse the Bundle. Read on
17 October 2026:

- **R4's document.** Bundle's invariants bdl-9, "A document must have an
  identifier with a system and a value", bdl-10, "A document must have a
  date" (`timestamp`), and bdl-11, "A document must have a Composition as
  the first resource". documents.html: the identifier "is never re-used";
  "The document date (mandatory). This is found in Bundle.meta.lastUpdated
  and identifies when the document bundle was assembled from the
  underlying resources" -- mandatory by documents.html's words, which no
  invariant states and the validator does not check; "Resources
  referenced by the Composition as listed below SHALL be included" --
  its subject, encounter, author, attester party, custodian, event
  detail, and a section's author, focus and entries -- while "Other
  resources that these referenced resources refer to may also be
  included"; the bundle "SHALL include only" the Composition "and any
  resources directly or indirectly (e.g. recursively) referenced from
  it", a stylesheet Binary, and "Provenance Resources that have a target
  of Composition or another resource included in the document"; "its
  content can never be changed". Bundle.timestamp is "the date/time that
  the bundle was assembled", which "should be equal or earlier than the
  .meta.lastUpdated on the Bundle itself". Composition.identifier is 0..1,
  and documents.html says it "is the same for all documents that are
  derived from this composition". Composition asks status, type, date,
  author and title; its subject is 0..1; cmp-1 asks a section's text,
  entries or sections.
- **R4's attachment.** `contentType` is required beside `data` (att-1);
  `size` is "the number of bytes of data ... (before base64 encoding, if
  that is done)", an unsignedInt; `hash` is "the calculated hash of the
  data using SHA-1. Represented using base64", calculated "on the data
  prior to base64 encoding". A base64Binary is "a stream of bytes, base64
  encoded (RFC 4648)", and its informative regex,
  `(\s*([0-9a-zA-Z\+\=]){4}\s*)+`, leaves `/` out. A string "SHOULD always
  contain non-whitespace content".
- **What the validator checks of them**, measured with 7.0.2 offline on
  the corpus. With the bytes in `data`, it decodes them and refuses a size
  (`TYPE_SPECIFIC_CHECKS_DT_ATT_SIZE_CORRECT`) and a SHA-1
  (`TYPE_SPECIFIC_CHECKS_DT_ATT_HASH_MISMATCH`) that are not theirs, and
  accepted the package's. With the bytes in a Binary, it checks neither:
  "Attachment content was not checked: urn:uuid:… is not a directly
  accessible link", information. It follows an attachment's url to the
  Binary when it looks for entries nothing reaches, which it refuses as
  an error (`Bundle_BUNDLE_Entry_Orphan_DOCUMENT`); a urn:uuid in no entry
  is an error (`Bundle_BUNDLE_Entry_NotFound`, placed at the entry after
  the Composition while its message names Composition.subject) and a
  warning at each reference (`Bundle_BUNDLE_Not_Local`); a Composition
  moved from first is bdl-11, `Bundle_BUNDLE_Entry_Document` and two
  entries unreachable forwards (`BUNDLE_BUNDLE_ENTRY_REVERSE_R4`). A media
  type is information, unchecked offline. Codes of HL7's v2 document type
  table and v3 act classes, which the registered packages hold, raised
  nothing. An attachment url that names no entry -- the in-Binary
  document with its Binary taken out -- it accepts: "Can't find
  'urn:uuid:…' in the bundle", `Bundle_BUNDLE_Entry_NotFound` as
  information, and no error (measured in review on 17 October 2026, on a
  probe beside the corpus, with the gate's command line); only the
  package's `dangling` refuses it.
- **What Report 0.1.0 renders**: `renderPdf(document, { maxPages })`, Node
  entry, pdfmake 0.3.11 with Roboto embedded, the creation date the
  caller's, "the same document renders to the same bytes". The corpus's
  one-page letter is 18,938 bytes, its header `%PDF-1.3`, its last line
  `%%EOF` and a line feed. No PDF/A option exists at 0.1.0 (plan 14).
- **What this package may use.** health-core, no Node and no DOM: no
  Buffer, no atob, no `crypto`. `@noble/hashes`, which `@formancy/spec`
  brings, is no dependency of health-document's, and manifests are not
  changed in H06.

## Decision

`@formancy/health-document` builds a DocumentReference of a PDF and a
document Bundle from what the host hands over, and nothing else; every
refusal is health-core's `Refusal`, at a path from `pdf` or `context`,
collected by health-core's `Refusals` and answered all at once.

- **A PDF by its own bytes.** `toDocumentReference(pdf, context)` copies
  the bytes once and writes from the copy `application/pdf`, the bytes as
  base64 in `data` -- or, given `binary`, a Binary that holds them and the
  attachment's `url` naming its `urn:uuid:` -- their `size`, and their
  SHA-1, computed here by FIPS 180-4 and base64-encoded; the title and
  everything else are the host's. The SHA-1 is computed, not taken from
  the host: to check a host's hash would mean computing it anyway, and a
  hash a host gave and nothing checked is a claim nobody made. The media
  type is not an input: the function is for a PDF.
- **A profile is proved or refused.** The host declares `PDF` or one of
  ISO 19005's PDF/A levels. `PDF` is attached when its first line is a
  header ISO 32000 defines and its last `%%EOF` alone -- what can be read
  without a parser; every PDF/A level is refused as `unproved`, since no
  gate here proves a producer of PDF/A until H09, and any other name as
  `unmapped`. Nothing writes a PDF/A claim. `PROVED_PDF_PROFILES` is what
  is attached.
- **What the host must say.** A DocumentReference's status, type,
  subject, date and title, and a Composition's status, type, subject,
  date, authors, title and sections of entries, are refused as `absent`
  when missing; R4 makes the subject optional in both and much of the
  DocumentReference too, and none of them is made up here. A
  Composition's identifier and categories are the host's to give or not,
  as R4 has them.
- **A document of what it refers to.** `toDocumentBundle(context)`
  writes type `document`, the host's identifier and timestamp, the
  timestamp as `meta.lastUpdated` too -- the document date documents.html
  makes mandatory, and R4 calls each the moment the document was
  assembled -- and the Composition first under the host's `urn:uuid:`,
  then the host's entries in its order. Every reference in every entry is
  resolved first -- each `reference` of a Reference, and a
  DocumentReference's attachment url -- and refused as `dangling` when it
  names no entry, a `Type/id` included, or as `reference` when it is no
  reference by name or names a type R4 does not allow there, read from
  one table; then every entry the Composition does not reach forwards is
  refused as `unreferenced`, and a second entry of a name as
  `duplicate-entry`. A Provenance and a stylesheet, which R4 admits, are
  refused as unreferenced: H06 writes neither. Then every attachment of
  a DocumentReference's content is held to its bytes, in its data or in
  the Binary its url names: a size or a SHA-1 it states that the bytes do
  not have, or a media type the Binary does not state, is refused as
  `mismatch`, and bytes it cannot read as base64Binary as `grammar`. A
  document is the host's resources, and a host can pair a
  DocumentReference with another PDF's Binary; the validator does not
  look inside a Binary an attachment names, so nothing else would see
  it.
- **The host's resources are FHIR JSON, copied.** Each entry's resource
  is written and read back by health-core, which refuses what FHIR JSON
  cannot carry under the entry's path, and the Bundle holds the copy, so
  it shares nothing with the host's objects; its type is held to a
  resource type's form and its id to R4's.
- **One decision in one place.** base64Binary is a primitive of
  health-core's (`toBase64Binary`, `base64Binary`, `fromBase64Binary`),
  in RFC 4648's one canonical spelling; the collector `Refusals` and the
  path writers `member` and `item` move from health-questionnaire to
  health-core, which already wrote its paths with them, so that every
  package names where in one form. health-core gains eight rules:
  `not-bytes`, `not-pdf`, `unproved`, `absent`, `dangling`,
  `unreferenced`, `duplicate-entry`, `mismatch`.
- **`@formancy/health-corpus`**, private and never published, renders
  the corpus's PDF with Report's released packages at exactly 0.1.0 --
  report-spec, report-runtime, report-render-pdf -- from a synthetic
  referral letter in Swiss German, and makes the documents the gate
  judges. It is the only package that depends on Report, and as test
  support; no published package does (0002), and the dependency-licence
  guard, which walks published packages, never reads it. The validator's
  runner, its synthetic forms and the registers stay in `scripts/` and
  `docs/release/`: the forms need `@formancy/spec` and
  health-questionnaire, which health-corpus does not depend on; the runner
  is a gate the `validator` job and its workflow guard run by its path;
  the registers are what a claim and the release report cite. 0005 and
  0006 said they would move with health-corpus; that move is not clean,
  and is not made.

## Consequences

**What it buys.**
- **The acceptance, on the output.** The PDF Report renders is attached
  and read back unchanged, every byte, decoded by Node from the JSON
  text; the validator recomputes the size and SHA-1 of the bytes in the
  attachment and accepts them; a PDF/A declaration is refused; a dangling
  reference refuses the Bundle, here and in the validator, and an
  attachment url to nothing, which the validator lets through, here.
- **Nothing silently left out of a document.** An entry nothing reaches
  is refused, not dropped, and so is a reference that would leave a
  receiver unable to show the document.
- **The same input, the same bytes**, which the tests assert on the PDF
  rendered twice.
- **A PDF from anywhere.** health-document depends on no renderer; a
  host that renders elsewhere attaches its own PDF under the same checks.

**What it costs.**
- **A plain PDF is not proved to be one.** The header and the trailer
  tell a PDF from an error page or a cut download, and nothing more: a
  PDF broken inside is attached. A writer that puts a comment or
  whitespace after `%%EOF`, which ISO 32000's readers tolerate, is refused.
- **No PDF/A, at all, until H09**, and so no CH EPR or ePA document,
  which ask for it. Report 0.1.0 writes none.
- **SHA-1 and base64 are this repository's to maintain**: a few dozen
  lines each, held to FIPS 180's and RFC 4648's vectors and to Node's own
  in health-corpus; together, about 0.1 s a megabyte, as above.
- **No bound on a PDF's size.** None was measured, so none is set: R4's
  unsignedInt stops `size` at 2^31 - 1 bytes, and a PDF whose base64 is
  longer than the engine's longest string fails with the engine's error,
  not a Refusal.
- **In a Binary, only this package checks the size and hash**: the
  validator says it did not, and does not refuse an attachment url that
  names no Binary either; `toDocumentBundle` holds both, and
  health-corpus's tests hold its output to Node's base64 and SHA-1.
- **The bytes are read again when the document is assembled.** Holding
  each attachment to its bytes decodes and hashes them once more:
  measured on 17 October 2026 under Windows 11 and Node 24.21, on the
  machine 0005 names, `toDocumentBundle` took about 0.53 s with a 5 MB
  PDF and 2.7 s with 25 MB, against 0.03 s and 0.14 s without the check;
  `toDocumentReference` takes about as long again. An attachment that
  states neither a size nor a hash is not read.
- **What the host must give is more than R4 asks** -- a subject, a
  section -- so a valid R4 document without them is refused here. So is
  one whose entries refer beyond it: documents.html asks the Bundle to
  hold what the Composition refers to, and says what those resources
  refer to "may also be included"; here every reference of every entry
  must name an entry, so a DocumentReference whose author is a
  `Practitioner/<id>` on the receiver's server is refused as dangling.
- **Links are found by name.** A Reference is a string `reference` in an
  object; three uris of that name are told apart by their element or by
  an Expression's `language`; an Attachment's url is followed only in a
  DocumentReference's content, so a Binary named by a Patient's photo is
  refused as unreferenced. A reference's target type is checked where
  the table names its element -- Composition.author, DocumentReference's
  subject and author, the attachment url -- and elsewhere only against a
  type it states. Canonicals are identifiers and are not resolved.
- **The host's entries are copied**, written and read once more than
  they need be; and a number in one comes back typed a decimal, written
  with the same digits.
- **Not here**: a narrative, attesters, a custodian, an encounter,
  confidentiality, events; a DocumentReference's format code, context and
  security labels; Provenance and stylesheets; reading a document back;
  the MHD provide Bundle; a guard that recognises a real person's data in
  the corpus, which review holds.
- **health-questionnaire changed** where it took its collector and path
  writers, with no change to what it writes.
- **The gate's time.** The corpus is thirty-five resources, eleven of
  them documents of about 27 kB, each carrying the PDF. With the package
  cache kept, the gate took 25.9, 23.6 and 29.6 seconds of validator on
  Java 25.0.4.1 (19.5 loading and 4.7 validating the first, 21.0 and 5.2
  the last), and 28.4 on Java 17.0.4 (21.1 and 5.4), on 17 October 2026
  under Windows 11, on the machine 0005 names. The first run that day
  took 237.9, as 0006 and 0007 saw on a first run, cause unknown. In
  review the same day, on Java 25.0.4.1, the first run took 340.3 (295.1
  loading, 42.2 validating) and the next two 24.6 (18.1 and 4.8) and
  31.5 (24.0 and 5.5). A CI runner has not been measured with this
  corpus.

**What it forecloses.**
- A PDF/A claim nothing proved, and a profile taken on trust.
- A document that holds a reference it cannot resolve, or an entry it
  does not refer to.
- An identifier, a fullUrl or a timestamp made here.

## Alternatives considered

**Take the SHA-1 from the host, and check it.** Rejected: checking it is
computing it, and taking it unchecked would write a claim about the bytes
nobody made.

**`crypto.subtle.digest`.** The platform's SHA-1. Rejected: asynchronous,
absent outside a secure context, and reached through `crypto`, which the
exactness guard refuses by name for its random values; this package
promises no Node and no DOM.

**`@noble/hashes`**, MIT, already in the tree through `@formancy/spec`.
Rejected for H06: a production dependency of a package whose only one is
health-core, for some sixty lines held to FIPS's vectors; and no manifest
changes in H06.

**base64 in health-document.** Rejected: base64Binary is one of R4's
primitives, and the next package that writes one -- a signature, a
country pack's Binary -- would write it again; one spelling, in one place.

**Check a PDF with a parser**, or with Report's corpus reader. Rejected:
parsing untrusted PDFs is a library's attack surface this package does
not need, and Report proves its own PDFs on the PDF (formancy.ai-report
0003); what H09 brings is veraPDF, in a gate, not in a package.

**A `proof` field on the PDF**, accepted at H06 from some verdict.
Rejected: there is no prover to accept a verdict from; a field that is
always refused would promise what does not exist. H09 decides its shape
with the gate that proves a producer.

**Leave what an attachment says of a Binary to the receiver.** The
validator does. Rejected: the attachment's size and hash are this
package's claim when it writes them, and a document assembled from a
DocumentReference and another PDF's Binary would carry that claim about
bytes it does not hold, where a receiver that does not check would show
one PDF under another's title.

**Drop an entry nothing reaches.** Rejected: a host's mistake -- a
reference left out of a section -- would vanish without a word.

**Resolve a `Type/id` against an entry's resource type and id.** A host
could then write `Patient/1` for an entry it names `urn:uuid:…`. Rejected:
R4 resolves a relative reference against the base of the entry's
fullUrl, and a urn:uuid has none; the validator would not find it, and a
receiver need not.

**Two inputs, a timestamp and a lastUpdated.** Rejected: R4 calls each
the moment the document was assembled, and two inputs for one moment are
two places to disagree.

**Require Composition.identifier**, as plan section 10 proposed.
Rejected: R4 makes it optional and the document's identity is the
Bundle's; requiring it would refuse valid documents for an element
documents.html says stays the same across them.

**Move the validator's runner and forms into health-corpus now**, as 0005
and 0006 foresaw. Rejected above: it needs dependencies health-corpus
does not have, and the gate's path, which the workflow runs and its guard
holds.
