# Changelog

All notable changes to Formancy Health. Every package moves on one version
number. The versions of the upstream `@formancy/*` packages this repository
depends on are a separate line, and a change to one is called out explicitly.

Loosely [Keep a Changelog](https://keepachangelog.com), with reasons attached —
a line that says only *what* changed is rarely the line you need six months
later.

## Unreleased

**A referral by form is a CH ORF document, in CH Core's and CH ORF's
profiles** ([0009](docs/decisions/0009-a-ch-orf-document-is-the-hosts-referral-in-ch-core-and-ch-orf-the-questionnaire-by-canonical-and-swiss-identifiers-checked-here.md)):
`@formancy/health-ch`, new. `toChOrfDocument(context)` writes a CH ORF
3.0.2 document Bundle of what the host says of a referral -- its patient,
its author as a PractitionerRole of a Practitioner at an Organization,
its orders as ServiceRequests, and the answers health-questionnaire wrote
of the form -- each resource claiming its CH ORF or CH Core 6.0.0
profile with the guide's version, and the Bundle claiming
`ch-orf-document` unversioned, because CH ORF's Submit Bundle says the
Bundle "shall include" that value and a receiver matching it would not
find it with a version after it. The Questionnaire is named by its
versioned canonical and not carried, as the plan's acceptance has it: the
host publishes it, and a response that names it without a version is
refused. That leaves two of CH ORF's SHALLs unmet -- its Submit Bundle's
"one Questionnaire resource" and its document's "Other resources that
these referenced resources refer to shall also be included" -- which the
profile, `entry:Questionnaire` 0..1, does not hold, so a receiver that
follows the prose resolves the canonical itself. The answers must claim CH ORF's response profile, which the
host passes to `toQuestionnaireResponse` as `profiles`, because the
validator holds a response to CH ORF only when it claims it -- measured,
answers whose subject was the Practitioner were accepted unclaimed -- and
they must be the patient's, written down and given by entries of the
document, and hold nothing `toQuestionnaireResponse` does not write -- a
`basedOn`, an `encounter`, a `partOf`, which CH ORF types and nothing
here would check. The answers are copied once by health-core, and the
copy is what is checked and carried, so that a host's object that reads
one way and copies another cannot pass as one response and arrive as
another. A member of the context it does not name -- an address, a
telecom, a second category -- is refused rather than left out, and so is
a hole in a list of it. Nothing is sent: CH ORF's Submit Bundle is the
host's to make.

**A GLN and an AHV number are held to their systems and check digits
here**, because every one of CH Core's checks of them is a warning, which
the validator raises and nothing else refuses: `gln()` takes thirteen
digits and GS1's check digit, a GLN that does not start 76 included, and
`ahvn13()` 756, nine digits and GS1's check digit, without points -- the
printed form is refused, not read. Each writes its own system, and a
host's own identifier under one of CH Core's seven Swiss systems, in
any case -- `URN:OID:2.51.1.3` is the GLN's system to a receiver that
normalises it, as RFC 8141 lets it -- is refused, so that an identifier
checked here by name cannot pass unchecked under its system. A refusal
of one never names a digit.

**A document's Composition has a narrative, and a document and its
Composition claim the profiles a host names**, because CH ORF requires
`Composition.text` and the Bundle's claim: health-document writes a
`generated` narrative of the Composition's title and its sections'
titles, escaped by health-core, refusing a title XML cannot carry, and
`DocumentContext.profile` and `CompositionContext.profile`. Every
document's bytes change, H06's included. 0008 decided no narrative; 0009
narrows it to every resource but the Composition. The narrative is
headings: it meets CH ORF's 1..1 and not R4's definition, a narrative
"clinically safe" for a human to read alone, which 0009 records.

**health-document and health-questionnaire refuse a member of their
context they do not name, and a hole in a list**, where they left the
member out without a word or walked past the hole into a gap: a
Composition's confidentiality, a coding's version, a section's mode, an
entry's search, a reference's display, a PDF's file name, a response
context's encounter or basedOn, each refused as `unmapped` at the
object that holds it, its name not repeated; a hole in the authors, the
categories, the sections or the entries refused at its index, where one
among the entries threw a TypeError. A context that is no object is
refused as `absent`, where health-questionnaire threw. A host that
passed one of these and had it dropped is refused now (0006, 0007 and
0008 narrowed by 0009).

**A QuestionnaireResponse claims the profiles a host names beside SDC's**:
`ResponseContext.profiles` in health-questionnaire, written once each in
the one place a response's meta is written (0007 narrowed).

**health-core reads a host's context for every package, and escapes a
narrative's text**: `valueAt`, `needed`, `optional`, `text` and `codeOf`
move from health-document, which reads its context with them as
health-ch does, and `known`, `objectAt` and `readItems` are new, the one
place an object is read for its members and a list at every index;
`xhtmlText` escapes `&`, `<` and `>` and refuses what XML 1.0 cannot
carry, and `text` now refuses the same characters -- a control character
but the tab and the line breaks, a surrogate alone, U+FFFE, U+FFFF -- as
a string's `grammar`, because a family name with a bell in it was
written into a Patient while the same title was refused in a narrative.
R4 says only that a string "SHOULD not" hold the control characters. Four rules are new -- `identifier`, `check-digit`,
`profile`, `unversioned` -- and `reference` covers a type the guide does
not allow, as well as R4.

**The validator gate judges CH ORF documents, and loads seven more
packages**: CH ORF 3.0.2, CH Core 6.0.0, SDC 3.0.0, which CH ORF is built
on, HL7 Terminology 7.0.1 and 6.3.0, IHE's formatCode 1.4.0 and CH Term
**3.3.0**, not the plan's 3.4.0, because CH Core declares `3.3.x` and the
validator cannot load it with 3.4.0 alone. IHE's package says CC-BY-4.0,
which the dependency policy refuses; the register admits it for that
package at that version alone, because there is no CH Core without it,
the gate only downloads it, and no package of this product carries it.
The corpus's CH ORF document is accepted with no error and no warning but
dom-6 and `gln-startswith76`, registered because the corpus's GLNs are
under GS1's prefix 952, kept for examples; eleven documents broken from
it are refused for their reasons, among them a GLN's and an AHV number's
wrong check digits, whose warnings are not registered.

**LOINC's notice stands in NOTICE, LOINC's name beside its code, and a
guard holds the code systems the packages write**, because health-ch
writes the repository's first code of a third party's terminology, LOINC
93037-0, which CH ORF fixes. LOINC's licence asks a program that carries
LOINC content to carry the code's display name with it, so 93037-0 is
written with its long common name, "Portable medical order form", in the
source and in the Bundle, as CH ORF's own StructureMap writes it.
`scripts/terminology.test.mjs` fails on a code system that is not HL7's
own or a host's under a domain reserved for examples, a LOINC code not
recorded, without its recorded name or without the notice, and any
SNOMED CT code, which none is.

**No file holds an AHV number that passes its check, and a guard holds
it**, because health-ch's tests, its README and the install fixture
held the AHV number printed as an example in many places, whose check
digit is valid -- as four older tests of health-core and
health-questionnaire did -- while their texts said no valid AHV number
was written. Each is now a number whose check digit is wrong. `scripts/synthetic-identifiers.test.mjs` fails on a valid AHV
number in any file, however its digits are separated, and on a GLN of
the validator's corpus that is under another prefix than GS1's 952 for
examples.

**A PDF is attached to a document Bundle by its own bytes, and a PDF/A
declaration is refused** ([0008](docs/decisions/0008-a-document-is-a-bundle-of-what-it-refers-to-and-a-pdf-its-own-bytes-never-an-unproved-pdf-a.md)):
`@formancy/health-document`, new. `toDocumentReference(pdf, context)`
writes an R4 DocumentReference of a PDF whose `application/pdf`
attachment carries the bytes as base64, or names a Binary that holds
them, with their size and their SHA-1 -- computed here, since a hash a
host gave and nothing checked would be a claim nobody made, and the HL7
validator recomputes both from the data. The host declares what the PDF
is: a plain PDF is attached when its first line is a PDF header and its
last `%%EOF`, which is all that can be read without a parser; every PDF/A
level is refused as unproved, because nothing here proves that a
producer makes PDF/A until veraPDF arrives on a Report release that
writes it, and a receiver archives a document as PDF/A on its sender's
word. `toDocumentBundle(context)` writes a document of the host's
resources: its identifier and timestamp the host's, the timestamp as
`meta.lastUpdated` too, which documents.html calls the document date and
makes mandatory, the Composition first, then only what it refers to;
every reference is resolved before output, and a dangling one, an entry
the Composition does not reach and two entries of one name each refuse
it whole, every refusal at once, because a document "SHALL include only"
what it refers to and a receiver cannot show one whose reference names
nothing. That is stricter than R4 in two ways a host meets: a reference
from an entry -- a DocumentReference's author by `Practitioner/<id>` --
must resolve inside the document too, where R4 lets it point outside;
and a DocumentReference's status, type, subject, date and title, and a
Composition's subject and sections, are required where R4 makes them
optional, since none is made up here. Every DocumentReference's
attachment in a document is held to its bytes: a size, a hash or a media
type that its data or the Binary it names does not have refuses the
document as `mismatch`, because a host can pair a DocumentReference with
another PDF's Binary and the HL7 validator does not look inside a Binary
an attachment names; it costs about 0.1 s a megabyte, measured. The
PDF's bytes are copied when checked by calling nothing they bring, so a
Node Buffer reused after it was handed over changes nothing attached.

**health-core writes bytes, and holds every package's refusals**:
`toBase64Binary`, `base64Binary` and `fromBase64Binary` write, check and
read R4's base64Binary in RFC 4648's one canonical spelling -- R4's own
regex leaves `/` out -- because a PDF's bytes and their hash are
base64Binary and the next package to write one should not write it
again. `Refusals`, `member` and `item`, health-questionnaire's collector
and path writers, move to health-core, so every package names where in
one form; health-questionnaire writes what it wrote. Eight rules are
new: `not-bytes`, `not-pdf`, `unproved`, `absent`, `dangling`,
`unreferenced`, `duplicate-entry`, `mismatch`. `base64Binary` and
`fromBase64Binary` read the text once, character by character, because
a regex of repeated quanta ran out of stack on the base64 of a 4 MB PDF
and threw a RangeError instead of answering.

**`@formancy/health-corpus`, private and never published, takes
`@formancy/report-spec`, `@formancy/report-runtime` and
`@formancy/report-render-pdf` at exactly 0.1.0**, Formancy Report's first
release, to render a synthetic referral letter's PDF with Report's own
renderer, so that the acceptance -- Report's bytes attached and read back
unchanged -- is shown on Report's output and not on a hand-made PDF. No
published package depends on Report. The validator gate now judges three
documents of that PDF and nine broken ones, and its corpus guard fails
when a resource type the packages write stands in no resource it accepts.
The validator's runner and synthetic forms stay in `scripts/validator/`:
moving them would need dependencies health-corpus does not have.

**A formancy submission is exported as a QuestionnaireResponse, or refused
whole**
([0007](docs/decisions/0007-a-formancy-submission-is-a-questionnaireresponse-of-the-same-mapping-refused-whole-where-an-answer-cannot-be-one.md)):
`toQuestionnaireResponse(form, answers, context)` in
`@formancy/health-questionnaire`, walked from the Questionnaire
`toQuestionnaire` writes of the same form and context, so that the two
cannot disagree on an item, a type, an option or a condition. The answers
are formancy's submission, the value its engine holds; the response names
the Questionnaire's url and version, and takes its status, its time and
its subject, author and source from the host, by name. A number answer is
written as the shortest text that reads back as the double formancy holds,
because formancy stores a JSON number and the text a person typed is gone
before any export sees it; an integer item's answer is refused when it is
not whole -- formancy's step admits 2.0000001 -- or past 32 bits, never
rounded or wrapped. No answer is formancy's own, absent, null, blank or an
empty list, and is not written; a value on a page a skip rule walks past,
which formancy keeps, is left out, since R4 gives a disabled item no
answer; a value on an item a visible rule hides, which formancy's engine
clears when the rule hides it, is refused, because one there was set while
the item was hidden, which no form a person fills does, or the two readings
of the rule disagree. A value of another
type than the field's, which formancy's engine accepts in a field with no
bound, an option not offered, a value past a bound, a name the form does
not have, a required item a completed response leaves unanswered, and a
subject given as an address, each refuse the whole export, every refusal
at once, quoting no answer. The SDC response profile is claimed only with
a subject and a versioned Questionnaire, where it validates.

**A `!=` in a Questionnaire is written with its unanswered case**, and is
refused under `&&`, as is a skip rule of `||` or of a list holding a
value; the Questionnaires of forms with a `!=` change. Because the HL7
validator, judging the first responses, reads R4's `!=` as "an answer that
differs" and disables an item whose question is unanswered, where formancy
shows it: an answer a person gave there was refused
(`Questionnaire_QR_Item_NotEnabled2`). With the unanswered case beside it,
the validator's reading and R5's agree with formancy's (0007 supersedes
0006 in this).

**A computed field a visible rule can hide is refused in a
Questionnaire**, and so is a rule comparing with a text of nothing but
whitespace; forms with either, which 0006 exported, are refused. Because
formancy computes the field while the rule hides it and keeps the value,
which R4 gives a disabled item no answer for, so that every response to
such a form would be refused; and because formancy holds a text of spaces
and shows what a rule comparing with it enables, where the response,
reading formancy's own "no answer", writes none (0007, found in review).

**A repeater's `minItems` is no longer `questionnaire-minOccurs`**: one,
on a required repeater, is what `required` says already, and one above is
refused. Because the validator counts a repeating group's minimum against
the answers of each row, which a group never has, so that no response to
such a Questionnaire validated (0007).

**health-core compares numbers and holds references**: `compareNumbers(a,
b)`, exact and by value, for reading an enableWhen against an answer;
`reference(value, path, types?)`, a reference by name, `Type/id` or a
`urn:uuid:`, never an address; and the rules `answer-type`, `option`,
`bound`, `unknown`, `disabled`, `required` and `reference`, so that a host
branches on the answers' refusals as on every other.

**A formancy form is exported as an SDC Questionnaire, or refused whole**
([0006](docs/decisions/0006-a-formancy-form-is-an-sdc-questionnaire-refused-whole-where-it-cannot-be-one.md)):
`@formancy/health-questionnaire` and its `toQuestionnaire(form, context)`,
the first package that writes a resource. One item per field, its key as
the linkId, since formancy's key is the answer's identity, unique across
the form and changed only by a declared rename; the url from the host's
canonical base and the form's id; the version formancy published, with
the `integer` version algorithm SDC's sdc-2 asks for, since formancy
numbers its versions and semver would claim meanings they lack; texts in
the form's default language with R4's translation extension for each
language the host asks for. Because a Questionnaire that admits what the
form refuses, or shows one German question to a reader who asked for
French, would be wrong without saying so, the whole export is refused,
with every reason at once, for a field type version 1 does not map
(signature, ranking, matrix, richtext, file), a constraint SDC cannot
state (a pattern, a format, a mask, a step other than one, a sourced
option list, a required checkbox), a rule beyond a simple comparison, and
a text missing in a language asked for. A visibility rule is `enableWhen`
only where both say the same on an untouched form; a computed field is
read-only, never a calculated item; no FHIRPath is written.

**The first upstream dependency: `@formancy/spec` 0.5.0, exact**
([0002](docs/decisions/0002-depend-on-upstream-never-copy-it.md)), for
health-questionnaire alone: a form means what formancy's own types and
validator say, so it is read through them and never re-implemented. It
brings `ajv` and `@noble/hashes`, MIT both, which the dependency-licence
guard now walks and admits.

**health-core's `Refusal` refuses mappings too**: the rules `version`,
`invalid`, `unmapped` and `missing`, and the `language` a text is missing
in, so that a host branches on one class across every package rather than
on a second diagnostic type with the same rule and path.

**A language is a BCP 47 tag in its canonical case**: health-core's
`language(value, path)`, refusing as `language-tag`, and every language
the Questionnaire names -- the form's default locale, and each a host asks
for -- is held by it. formancy names a catalogue with any text, and as
`Questionnaire.language` the HL7 validator refuses `Deutsch`, `de_CH` and
even `de-ch` with errors, while a translation's language it does not check
offline at all; held only as a FHIR code, each was exported as if it
conformed. Whether a subtag is registered is still not checked: `zz` has
the form, is exported, and the validator refuses it.

**A rule's decimal literal of more than fifteen significant digits is
refused**, because CEL compares an answer with the double nearest it and
R4 with its digits: `weight == 0.30000000000000001` shows its field for
0.3 in formancy, and would hide it in a Questionnaire.

**The validator gate judges package output.** Its corpus holds the
Questionnaires health-questionnaire makes of synthetic forms, between them
every field type, rule, enableWhen operator and answer type it maps --
`scripts/validator/corpus.test.mjs` derives that set from the package and
fails when a form lacks one -- and
four of its Questionnaires each broken for one thing 0006 leaves out, so
the gate shows why. Two warnings are registered, each with its reason:
`TERMINOLOGY_TX_WARNING`, since offline the validator cannot validate
`Questionnaire.language` in full, and SDC's sdc-3, which prefers semver. A registered warning is
accepted wherever the corpus raises it, which 0006 counts as a cost.

**The United Kingdom is among the formats it targets, after Germany and
before Austria**: UK Core and, for England, the NHS Booking and Referral
Standard (BaRS), on the same FHIR R4 4.0.1 as CH Core. After Germany
because a BaRS referral is a message rather than a document and no
released UK Core profiles a Questionnaire; before Austria because BaRS is
a national standard in service. Like Austria's and Europe's, it is built
only when a customer pays for it, and nothing for it is built yet.

**Formancy Health is source-available, on Formancy Data's and Formancy
Report's terms, and the licence is in force before a lawyer has read it**
([0001](docs/decisions/0001-a-paid-module-in-its-own-repository.md)).
Free to read, fork, evaluate, develop and test, including in companies and
without an expiry; a paid licence to run in production; a separate agreement
to redistribute. Customer data, the health records the module is given and
the FHIR resources it generates remain the customer's. `LICENSE.md`
Version 1 is in force from 16 October 2026 and says at the top that no
lawyer has reviewed it. Its terms are Formancy Data's Version 1.1 and
Formancy Report's Version 1, so a Report + Health bundle is one kind of
agreement rather than a compatibility review between licence families. The
whole export is this product, the mapping of a form to the HL7 Structured
Data Capture guide included: a generic core of it in Apache-2.0 formancy was
considered and not taken, so formancy itself exports nothing to FHIR, and
its promise that a self-hoster never hits a paywall is untouched.

**The product is Formancy Health, and no name of it carries an HL7 mark**
([0003](docs/decisions/0003-the-product-name-carries-no-hl7-mark.md)).
It was Formancy FHIR, in `formancy.ai-fhir`, until 16 October 2026, before
the first commit. HL7 forbids its marks in a product's name without its
written consent, grants that consent product by product, and says a name
holding FHIR could never be a registered trademark; the maintainer chose a
name that needs no consent rather than apply for one. The repository, the
`@formancy/health-*` packages, the licence and the README's heading say
Formancy Health. FHIR is named only for the standard the module implements,
and `NOTICE` and the README carry HL7's notice for use without
permission, word for word.

**The repository has Formancy Report's pipeline**
([0002](docs/decisions/0002-depend-on-upstream-never-copy-it.md)), as
Report's first pull request brought it and with what Report has fixed in it
since. It brings:

- **Contributions under a CLA**, checked on every pull request against the
  hash of the text signed.
- **Workflows.** `gates.yml` with a `verify` job, a `test` job per package and
  an `install` job, called by `ci.yml` and by a `release.yml` that publishes
  only the tarballs the install gate ran, pinned by hash, with provenance and
  a signed SBOM. CodeQL and dependency review run in `security.yml`.
- **Guards**, each watched failing first. In `verify`, the licence field and
  files of every package, by `scripts/verify-licenses.mjs`. Under
  `pnpm test:repo`, exact upstream versions, a generated `codecov.yml`, the
  README's licence sentence generated from `LICENSE.md`, the 600-line source
  budget, the test matrix against the workspace, and the workflows' shape.
  And one Report has no need of:
  `scripts/trademark.test.mjs`, which fails when `NOTICE` or the README
  loses HL7's notice, when a tracked file claims a licence from HL7 for its
  marks, and when a package's name, the licence's title or the README's
  first heading holds an HL7 mark.
- **The licences of what a published package needs in production**, read
  in `verify` by `scripts/dependency-licences.mjs` and refused unless
  permissive (formancy.ai-report 0006).

Left out until there is something for them to prove: the HL7 FHIR
validator's gate, Report's release report and its registers, and the
getting-started guide's gate. Left out for good, by 0002: a copy of
formancy.ai's admin colour stylesheet and the palette guard that would hold
it, which Data and Report keep. Version 1 has no page, so there is no
browser gate, no README picture and no demo either.

**`@formancy/health-core` names the FHIR version it emits.**
`FHIR_VERSION` is `'4.0.1'`, R4, independent of every package version. It
is the package that proves the pipeline: build, packaging checks, the
licence in the tarball and the install gate all run on it. Nothing exports
a resource yet.

**`@formancy/health-core` writes and reads FHIR JSON exactly, and holds
R4's primitives to their types**
([0004](docs/decisions/0004-fhir-json-is-written-and-read-exactly-with-primitives-of-its-own.md)).
FHIR says a decimal's precision is part of its value -- 0.010 is not 0.01
-- and a JavaScript number keeps neither a trailing zero nor more than
about seventeen digits. So a number is its text: `decimal()`, `integer()`,
`positiveInt()` and `unsignedInt()` take a string or a bigint, check it
against R4's grammar and, for the integers, their 32-bit range, and refuse
a JavaScript number. `date()`, `dateTime()`, `instant()`, `time()`, `id()`,
`code()`, `uri()` and `uuid()` check the rest; a date and time without its
zone is refused, not guessed, and a day the calendar lacks is refused.
`writeJson()` writes a number's digits unquoted, the names in the order
given, the same bytes for the same input; `readJson()` is a parser of the
package's own, because `JSON.parse` reads every number into a double and
keeps the last of two properties of one name without a word. Both refuse
breaks of FHIR JSON's rules -- an empty value, a null outside an array, a
name given twice, a JavaScript number -- with a `Refusal` that names the path
and the rule and never quotes the value, which may be a person's. The
types are the package's own: `@types/fhir` and `@medplum/fhirtypes` both
type a decimal as a JavaScript number. And a new guard,
`scripts/exact-and-reproducible.test.mjs`, fails when a package's source
converts a value through a number or reads a clock or a random source,
which would make the same input give other bytes or an identity nobody
supplied.

**FHIR resources are judged by the HL7 FHIR validator, offline, against
pinned guide packages**
([0005](docs/decisions/0005-a-fhir-resource-is-proved-by-the-hl7-validator-against-pinned-guide-packages.md)).
A new `validator` job in the gates runs `scripts/validator.mjs`: validator
**7.0.2**, the newest release on 17 October 2026, fetched from its GitHub
release and refused unless its SHA-256 is the one
`docs/release/validator.json` pins, on Java 17, its floor; and FHIR R4
4.0.1 with Structured Data Capture **4.0.0**, together with every package
the validator loads with them, each fetched from packages.fhir.org by exact
version and refused unless its SHA-256 is the one
`docs/release/ig-packages.json` registers. That list was read from the
validator's own load, not from a guide's page: it includes R5 terminology
the validator loads for itself and a ballot SDC 4.0.0 declares. Run by
default, the validator downloads packages, asks a registry for the newest
version of two of them on every run and checks codes on tx.fhir.org, so
its verdict would depend on the day; here it runs with no terminology
server and no HTTP at all, and the same commit gets the same verdict. What
that costs is said where it is measured: codes from LOINC, SNOMED CT or
UCUM, and language tags, are not checked offline, and the validator's
warning that says so refuses a resource until it is registered with a
reason; a code system nothing knows draws only information, online and
offline, which the gate accepts. An error fails the job, and so does any warning
`scripts/validator/warnings.json` does not name. The corpus is written by
health-core's `writeJson`, and the resources broken on purpose in it
are each refused for exactly what they break: a missing required
element, two cardinalities, a code outside a required binding, a decimal
written as a string, an unknown profile and an unchecked external code. No
package builds a resource yet, so the corpus is built by hand, and the gate
shows the pipeline judges health-core's output, not that an export
conforms. Its first run found a rule the first Questionnaire will need:
SDC's sdc-2, a version only with its version algorithm.

**The README says what the packages are built and judged against**, in a
table `scripts/compatibility.mjs` derives from health-core's
`FHIR_VERSION`, the two registers, the workspace's manifests and the
toolchain, and `scripts/compatibility.test.mjs` fails when it is stale --
the plan's compatibility tuple, recorded where a test holds it.

**The dependency-licence guard says that FHIRPath is refused today**, and a
case holds it: `fhirpath` 5.2.1 and the `@lhncbc/ucum-lhc` 7.1.10 it brings
each declare a licence of their own that no allowed identifier names, so a
package that took FHIRPath for an `enableWhenExpression` or for template
extraction fails `verify` until the maintainer admits a version by a
reviewed exception.
