# 4. Solution strategy

The ideas the rest of the design follows from. Each links to the record
that argues it.

## 1. Map once, and refuse the whole export

What a resource cannot say as its input says it, the export refuses, every
refusal found at once ([§8.2](08-crosscutting-concepts.md#82-refusals)),
each a rule and a path, and never a part of a resource
([0006](../decisions/0006-a-formancy-form-is-an-sdc-questionnaire-refused-whole-where-it-cannot-be-one.md),
[0007](../decisions/0007-a-formancy-submission-is-a-questionnaireresponse-of-the-same-mapping-refused-whole-where-an-answer-cannot-be-one.md),
[0008](../decisions/0008-a-document-is-a-bundle-of-what-it-refers-to-and-a-pdf-its-own-bytes-never-an-unproved-pdf-a.md)).
A Questionnaire that validates and says less than the form -- a constraint
left out, an untranslated question among translated ones, a dropped answer
-- is the failure this product exists to prevent, because nothing
downstream can see it.

A field becomes an item in one place. The response is walked from the
items the Questionnaire's own mapping made, `mapForm`, so the two cannot
disagree about a linkId, a type, an option or a condition
([0007](../decisions/0007-a-formancy-submission-is-a-questionnaireresponse-of-the-same-mapping-refused-whole-where-an-answer-cannot-be-one.md)).
A country's package profiles that output and does not map a field again
([0006](../decisions/0006-a-formancy-form-is-an-sdc-questionnaire-refused-whole-where-it-cannot-be-one.md)):
health-ch, the first, carries the answers health-questionnaire wrote,
copied as written ([0009](../decisions/0009-a-ch-orf-document-is-the-hosts-referral-in-ch-core-and-ch-orf-the-questionnaire-by-canonical-and-swiss-identifiers-checked-here.md)).

The price is forms formancy publishes that are refused here, and the
refusals say which part: [§11](11-risks-and-debt.md) names it.

## 2. A number is its text

A FHIR number is a `FhirNumber` made from its text and written from it;
FHIR JSON is written and read by health-core's own writer and parser, and no
published package's source converts a value through a JavaScript number
([0004](../decisions/0004-fhir-json-is-written-and-read-exactly-with-primitives-of-its-own.md)).
Where the input is a double, as formancy's answers are, the output is
exactly that double and no digit more
([0007](../decisions/0007-a-formancy-submission-is-a-questionnaireresponse-of-the-same-mapping-refused-whole-where-an-answer-cannot-be-one.md)).

## 3. A resource is proved on the JSON a package wrote

A claim that an export conforms is the HL7 FHIR validator's, at a release
pinned by SHA-256, against exactly the guide packages a register pins, run
offline, on what the packages as built wrote of a synthetic corpus. Each
resource broken on purpose must be refused for exactly what it breaks, or
the gate fails ([0005](../decisions/0005-a-fhir-resource-is-proved-by-the-hl7-validator-against-pinned-guide-packages.md)).
It is Report's rule about PDFs applied to resources
([formancy.ai-report 0003](https://github.com/sharkysan/formancy.ai-report/blob/main/docs/decisions/0003-a-rendered-report-is-proved-on-the-pdf-it-produced.md)):
not the input, not hand-written JSON, not a mocked validator.

## 4. Everything that identifies is the host's

A canonical base, a version, a status, a reference, a date, a document's
identifier and timestamp, a PDF's bytes: the host gives each, and nothing
here makes one of its own, reads a clock or a random source, or fetches
anything a name points to. A GLN and an AHV number are the host's too,
checked here for their form and check digit and never looked up
([0009](../decisions/0009-a-ch-orf-document-is-the-hosts-referral-in-ch-core-and-ch-orf-the-questionnaire-by-canonical-and-swiss-identifiers-checked-here.md)). What is named here is named from the host's: a
Questionnaire's url is the host's base and the form's id, and its options'
systems are that url and a field's key ([0004](../decisions/0004-fhir-json-is-written-and-read-exactly-with-primitives-of-its-own.md),
[0006](../decisions/0006-a-formancy-form-is-an-sdc-questionnaire-refused-whole-where-it-cannot-be-one.md),
[0008](../decisions/0008-a-document-is-a-bundle-of-what-it-refers-to-and-a-pdf-its-own-bytes-never-an-unproved-pdf-a.md)).
A reference is a name, never an address
([formancy.ai 0077](https://github.com/sharkysan/formancy.ai/blob/main/docs/decisions/0077-options-may-come-from-a-named-source.md)).
What is computed here is what can be checked against the input: a PDF's
size and SHA-1 are computed from its bytes rather than taken on the host's
word ([0008](../decisions/0008-a-document-is-a-bundle-of-what-it-refers-to-and-a-pdf-its-own-bytes-never-an-unproved-pdf-a.md)).

## 5. A product of its own, built on released upstream

A repository and a licence of its own, so formancy's stays Apache-2.0 with
no paid edition ([0001](../decisions/0001-a-paid-module-in-its-own-repository.md));
formancy's and Report's released packages at exact versions, copied never
([0002](../decisions/0002-depend-on-upstream-never-copy-it.md)); and a name
that holds no HL7 mark ([0003](../decisions/0003-the-product-name-carries-no-hl7-mark.md)).

## 6. A country is a package on the generic ones

A country's guides are a package of their own, built on the generic ones,
which writes only what those guides add. health-ch writes CH Core's people,
CH ORF's orders and the Swiss identifiers, and carries the answers
health-questionnaire wrote; health-document assembles the Bundle and
decides what its Composition's values must be; health-core reads every
host's context. Where the country needs more of a generic package, the
generic package gains it -- a narrative for every Composition, which CH ORF
requires, and claims of a profile for the host to name on a Bundle, a
Composition and a response -- rather than the country's package rewriting
what another wrote: health-ch post-processing health-document's Bundle,
or checking the Composition's values a second time, were rejected as two
places deciding one thing ([0009](../decisions/0009-a-ch-orf-document-is-the-hosts-referral-in-ch-core-and-ch-orf-the-questionnaire-by-canonical-and-swiss-identifiers-checked-here.md)).

The price is two passes for two kinds of fault, which
[§6.4](06-runtime-view.md#64-a-referral-becomes-a-ch-orf-document) shows,
and generic packages that now refuse a member of their context they do not
name, which a host they took before may have passed
([§11](11-risks-and-debt.md#112-the-larger-accepted-risks)).

---

## The organising rules that follow

**One decision, one place.** How a field becomes an item is decided in
health-questionnaire; how a decimal is written, how bytes are spelt as
base64Binary and what a refusal is, in health-core, where 0008 moved the
collector and the path writers so that every package names where in one
form ([0008](../decisions/0008-a-document-is-a-bundle-of-what-it-refers-to-and-a-pdf-its-own-bytes-never-an-unproved-pdf-a.md));
how a host's context is read -- a value its own, an object for the members
it names, a list at every index, a text with nothing a resource cannot
carry -- in health-core too, where 0009 moved the readers; and what a
Composition says, in health-document, which health-ch asks and does not
repeat ([0009](../decisions/0009-a-ch-orf-document-is-the-hosts-referral-in-ch-core-and-ch-orf-the-questionnaire-by-canonical-and-swiss-identifiers-checked-here.md)).
The question is whether two copies that disagreed would be found
([`CLAUDE.md`](../../CLAUDE.md)).

**Fail closed.** A form of a spec version the mapping does not read, a
field type, rule or text an item cannot say, an answer of another type, a
reference that names nothing, a PDF profile nothing has proved, a member a
context does not name, a hole in a host's list, an identifier whose check
digit is wrong: each
refuses the whole resource, as
[formancy.ai 0022](https://github.com/sharkysan/formancy.ai/blob/main/docs/decisions/0022-fail-open-fail-closed.md)
says of validation, and as [`CLAUDE.md`](../../CLAUDE.md#secrets-health-data-and-untrusted-input)
asks of every version, profile and code system a later package meets. Where formancy itself fails open -- a visibility rule it
cannot evaluate shows its field -- the export does not decide otherwise: an
ordering is written with its unanswered case, so the Questionnaire shows
what formancy shows ([0006](../decisions/0006-a-formancy-form-is-an-sdc-questionnaire-refused-whole-where-it-cannot-be-one.md)),
and a `!=` too ([0007](../decisions/0007-a-formancy-submission-is-a-questionnaireresponse-of-the-same-mapping-refused-whole-where-an-answer-cannot-be-one.md)).
