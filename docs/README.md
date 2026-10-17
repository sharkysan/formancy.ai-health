# Formancy Health — architecture and decision documentation

Engineering documentation for the people who need to understand *why*
Formancy Health is built the way it is: contributors, evaluators, and the
vendors who would ship it inside their own products.

Nothing here is a tutorial but one: the
[getting-started guide](getting-started.md), from an empty npm project to a
CH ORF document, which the install gate compiles and runs. How to call a
package is the [README](../README.md) and each package's own; what changed,
and why, is
[`CHANGELOG.md`](../CHANGELOG.md); the rules a change is held to are
[`CLAUDE.md`](../CLAUDE.md).

## Start here

| If you are… | Read |
|---|---|
| Deciding whether to build on 0.1.0 | The README's [What 0.1.0 is](../README.md#what-010-is), its [Not in 0.1.0](../README.md#not-in-010) and its [Intended purpose](../README.md#intended-purpose), then the release report the release attaches |
| New to the repository | [Introduction and goals](architecture/01-introduction-and-goals.md), then [Solution strategy](architecture/04-solution-strategy.md) — the ideas everything else follows from |
| Looking for where something lives | [Building blocks](architecture/05-building-blocks.md) |
| Calling a package from your application | The [getting-started guide](getting-started.md), the [README](../README.md), the package's README, and [Deployment](architecture/07-deployment-view.md) for what a host supplies |
| Asking what a conformance claim covers | [Verification](architecture/10-verification.md#103-what-a-conformance-claim-covers), then [0005](decisions/0005-a-fhir-resource-is-proved-by-the-hl7-validator-against-pinned-guide-packages.md) |
| Asking what a release was tested on | The release report it attaches, which [`release/`](release/README.md) describes, then [0011](decisions/0011-a-release-report-is-derived-from-the-run-that-gated-it.md) |
| Wondering why an obvious simpler thing was not done | The [decision records](decisions/README.md) |
| About to change something load-bearing | [Risks and technical debt](architecture/11-risks-and-debt.md), and the record behind it |

## Architecture

The architecture is written as [arc42](https://arc42.org), and its
decisions as architecture decision records (ADRs). It is in the files
formancy.ai's architecture uses, so that a reader who knows either finds
things without being told, and those depart from arc42 in one place:
arc42's section 9, the decisions, is the records in
[`decisions/`](decisions/README.md), so 9 here is arc42's quality
requirements and 10 is verification, a section of formancy.ai's that arc42
does not have.

| | |
|---|---|
| [1. Introduction and goals](architecture/01-introduction-and-goals.md) | What Formancy Health is and is not, its quality goals, its scope and who it is for |
| [2. Constraints](architecture/02-constraints.md) | What was not chosen: FHIR's digits, formancy's doubles and CEL, Report's PDF, HL7's marks, a library with no Node, CH Core's warnings and range, the terminologies' licences |
| [3. Context and scope](architecture/03-context-and-scope.md) | The host, upstream, the Swiss guides and identifiers, the gate's downloads, and what is outside the boundary |
| [4. Solution strategy](architecture/04-solution-strategy.md) | The ideas the rest follows from |
| [5. Building blocks](architecture/05-building-blocks.md) | The layers, what each package may import, then inside each package and beside them |
| [6. Runtime view](architecture/06-runtime-view.md) | A form, a submission, a document, a CH ORF document, a gate run, a release |
| [7. Deployment view](architecture/07-deployment-view.md) | What a release publishes and where, what a host needs, where the gates run |
| [8. Cross-cutting concepts](architecture/08-crosscutting-concepts.md) | Exact values, refusals, health data, untrusted input, identity and the Swiss identifiers, determinism, no network, licences, marks and terminology, languages, the user interface there is not, no clinical logic |
| [9. Quality requirements](architecture/09-quality-requirements.md) | Scenarios, each stated so it can fail, with what fails: arc42's section 10 |
| [10. Verification](architecture/10-verification.md) | The gates, what each proves, and what it does not: formancy.ai's, not arc42's |
| [11. Risks and technical debt](architecture/11-risks-and-debt.md) | The larger accepted risks with their records, the known debt, what is planned |
| [12. Glossary](architecture/12-glossary.md) | Terms that mean something specific here |

[`scripts/architecture.test.mjs`](../scripts/architecture.test.mjs), in
`pnpm test:repo`, holds these files to the repository
([0010](decisions/0010-the-architecture-is-documented-in-arc42s-sections-held-to-the-repository-by-a-guard.md)): it fails when a section is missing, when a
workspace package is not named in the building blocks, when a decision
record is linked from no section, when a relative link here, or the
heading it points at, no longer exists, and when a path written here as
code names no file git would commit. Whether a sentence is still true of
what it links or names, whether a record is linked from the section it
changes, which file a bare name means where several end in it, and the
links into other repositories, which it does not follow, are review's.

## Decisions

The records in [`decisions/`](decisions/README.md) are every decision
somebody could helpfully undo, in the order they were made. Each carries a
**Verified by** line naming the test or gate that fails when it is violated,
or saying plainly that review holds it; where a decision rests on one made
in formancy.ai, Formancy Data or Formancy Report, it cites that record by
repository and number. Each is linked from the section of the architecture
it changes: that it is linked from a section, the guard holds; that the
section is the one it changes, review.

[`release/`](release/README.md) holds the registers a conformance claim
rests on -- the validator the gate runs, and every package it loads -- and
the two every release report reads: the release gates, and the known
limitations of each record
([0011](decisions/0011-a-release-report-is-derived-from-the-run-that-gated-it.md)).

---

HL7, FHIR and the FHIR [FLAME DESIGN] are the registered trademarks of
Health Level Seven International and their use does not constitute
endorsement by HL7.

Source-available, not open source: see [`LICENSE.md`](../LICENSE.md).
