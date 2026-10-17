# Architecture decision records

Every decision here was actually made, in the order the numbers suggest, while
building Formancy Health. Where a decision was reversed or narrowed later, the
record says so and points at the one that superseded it. Where a decision rests
on one made in formancy.ai, in Formancy Data or in Formancy Report, the record
cites it as `formancy.ai NNNN`, `formancy.ai-data NNNN` or
`formancy.ai-report NNNN` with a link, and does not restate it.

## Why these exist

Two audiences:

1. **Contributors**, who need to know why the obvious simpler thing was not
   done, so they do not helpfully undo it.
2. **Customers and evaluators**, deciding whether to build on this module, who
   want the reasoning and not just the result — especially about the licence,
   about the standard's name and its owner's marks, and about what the module
   refuses to do with the health data it is given and the resources it
   produces.

## Format

The format is formancy.ai-report's, which is formancy.ai-data's:
[MADR](https://adr.github.io/madr/)-shaped, trimmed to what is load-bearing.

```markdown
# NNNN — Title in the imperative

- **Status:** accepted | superseded by NNNN | reversed
- **Date:** YYYY-MM-DD
- **Deciders:** who
- **Verified by:** the tests, gates or files that hold this decision in place

## Context

The forces. What was true when the decision was made.

## Decision

What was decided, in one or two sentences.

## Consequences

What this buys, what it costs, and what it forecloses. The cost paragraph is
not optional: a record with no downside is marketing, not a decision.

## Alternatives considered

Each with the reason it lost.
```

**Verified by** is the field that distinguishes a decision record from an
opinion. If a decision is load-bearing, something in the repository fails when
it is violated — a test, a CI gate, a script the workflow runs. A record whose
only enforcement is "we remember" says so plainly.

## Index

| # | Decision | Status |
|---|---|---|
| [0001](0001-a-paid-module-in-its-own-repository.md) | A paid module lives in its own repository, under Formancy Data's and Formancy Report's terms, in force before a lawyer has read them; the whole export is this product, its generic core included | accepted |
| [0002](0002-depend-on-upstream-never-copy-it.md) | Depend on released formancy, Formancy Report and Formancy Data packages at exact versions; never copy them, formancy's admin stylesheet included | accepted |
| [0003](0003-the-product-name-carries-no-hl7-mark.md) | The product is Formancy Health: no name of it carries an HL7 mark, FHIR is named only as the standard, and HL7's notice for use without permission is the only one it carries | accepted |
| [0004](0004-fhir-json-is-written-and-read-exactly-with-primitives-of-its-own.md) | FHIR JSON is written and read exactly, by a writer and a parser of health-core's own; its primitives are types of the package's own, a number held as its text and never as a JavaScript number, the rest as checked strings; no package's source converts a value through a number or reads a clock or a random source | accepted |
| [0005](0005-a-fhir-resource-is-proved-by-the-hl7-validator-against-pinned-guide-packages.md) | A FHIR resource is proved by the HL7 FHIR validator, at a release pinned by SHA-256, against exactly the guide packages a register pins by SHA-256, offline, on the JSON a package wrote; an error or an unregistered warning fails the gate, and each resource broken on purpose must be refused for exactly what it breaks | accepted; where its corpus and registers live kept by [0008](0008-a-document-is-a-bundle-of-what-it-refers-to-and-a-pdf-its-own-bytes-never-an-unproved-pdf-a.md); a CC-BY-4.0 guide package admitted to its register by [0009](0009-a-ch-orf-document-is-the-hosts-referral-in-ch-core-and-ch-orf-the-questionnaire-by-canonical-and-swiss-identifiers-checked-here.md) |
| [0006](0006-a-formancy-form-is-an-sdc-questionnaire-refused-whole-where-it-cannot-be-one.md) | A formancy form is an SDC 4.0.0 Questionnaire, one item per field with its key as the linkId, identified by the host's base and formancy's published version with the integer algorithm; what an item cannot say as the field says it -- a field type, a constraint, a rule beyond a simple comparison, a text missing in a language asked for -- refuses the whole export with health-core's Refusal; no FHIRPath, no calculated item, no narrative | accepted; `!=`, a repeater's `minItems`, a computed field a visible rule can hide and a comparison with whitespace superseded by [0007](0007-a-formancy-submission-is-a-questionnaireresponse-of-the-same-mapping-refused-whole-where-an-answer-cannot-be-one.md); where its corpus lives kept by [0008](0008-a-document-is-a-bundle-of-what-it-refers-to-and-a-pdf-its-own-bytes-never-an-unproved-pdf-a.md); a member its context does not name refused by [0009](0009-a-ch-orf-document-is-the-hosts-referral-in-ch-core-and-ch-orf-the-questionnaire-by-canonical-and-swiss-identifiers-checked-here.md) |
| [0007](0007-a-formancy-submission-is-a-questionnaireresponse-of-the-same-mapping-refused-whole-where-an-answer-cannot-be-one.md) | A formancy submission is a QuestionnaireResponse walked from the Questionnaire's own mapping, to its url and version, its references by name from the host; a number answer is the double formancy holds, written as its shortest text, an integer only when whole and within 32 bits; no answer is formancy's own, a value on a skipped page is left out and one on an item a visible rule disables refused; a `!=` carries its unanswered case, a repeater's minimum is its `required`, and a computed field a visible rule can hide is refused; what an answer cannot say as the item takes it refuses the whole export | accepted; a response claims the host's profiles beside SDC's, and a member its context does not name is refused, by [0009](0009-a-ch-orf-document-is-the-hosts-referral-in-ch-core-and-ch-orf-the-questionnaire-by-canonical-and-swiss-identifiers-checked-here.md) |
| [0008](0008-a-document-is-a-bundle-of-what-it-refers-to-and-a-pdf-its-own-bytes-never-an-unproved-pdf-a.md) | A document is a Bundle of type document, the host's identifier and timestamp, the Composition first and then only what it refers to, every reference resolved before output and a dangling one or an entry nothing reaches refusing it; a PDF is attached by its own bytes, in the attachment or a Binary, with their size and a SHA-1 computed here and held to them when a document is assembled; a PDF/A declaration is refused until a gate proves a producer, and a plain PDF is checked by its first and last lines alone; base64Binary and the refusal collector live in health-core; health-corpus, private, renders the corpus's PDF with Report 0.1.0, and the validator's corpus stays in scripts/ | accepted; a Composition narrative of its titles and the host's profile claims added, and a member a context does not name and a hole in a list refused, by [0009](0009-a-ch-orf-document-is-the-hosts-referral-in-ch-core-and-ch-orf-the-questionnaire-by-canonical-and-swiss-identifiers-checked-here.md) |
| [0009](0009-a-ch-orf-document-is-the-hosts-referral-in-ch-core-and-ch-orf-the-questionnaire-by-canonical-and-swiss-identifiers-checked-here.md) | A CH ORF 3.0.2 document of the host's referral, in CH Core 6.0.0's profiles, assembled by health-document: the host's patient, author and orders written by health-ch, the host's answers claiming CH ORF's response profile, the Questionnaire by its versioned canonical and not in the Bundle; a GLN and an AHV number held to their systems and GS1's check digit here, since the validator only warns, and an identifier of the host's under none of CH Core's systems, in any case; a member a context does not name, a hole in a list and a response member toQuestionnaireResponse does not write refused, in every package; no SNOMED CT, LOINC 93037-0 alone with its LOINC name and LOINC's notice, a terminology guard, and a guard that no file holds a valid AHV number; the gate loads CH Term 3.3.0, which CH Core's range answers, and admits IHE's CC-BY-4.0 formatCode package to its register alone; nothing is sent | accepted |
