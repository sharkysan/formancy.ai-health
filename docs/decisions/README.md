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
