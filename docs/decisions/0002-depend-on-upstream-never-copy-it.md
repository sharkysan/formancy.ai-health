# 0002 — Depend on released formancy, Formancy Report and Formancy Data packages at exact versions; never copy them, stylesheets included

- **Status:** accepted; its page waits for no stylesheet formancy has not released, and wears `@formancy/themes` 0.5.0's workbench and Blueprint until a release ships formancy.ai's room, by [0012](0012-a-demo-at-formancy-ai-health-fills-a-synthetic-referral-in-the-browser-served-by-a-worker-of-its-own.md)
- **Date:** 2026-10-16
- **Deciders:** Daniel Bacher
- **Verified by:** `scripts/upstream-deps.mjs`, through
  `scripts/upstream-deps.test.mjs` in `pnpm test:repo`, which CI runs on every
  pull request. It refuses any `@formancy/*` dependency that is not a
  workspace sibling and is not an exact released version. A range, a
  `workspace:` link, or a `link:`, `file:` or git specifier each fail, and the
  test proves each on a fixture before checking the real tree. Formancy
  Report's and Formancy Data's packages share the scope, so a
  `@formancy/report-*` or `@formancy/data-*` dependency taken from a checkout
  fails too. That no upstream **source** is copied is held by review, and
  that includes a stylesheet: nothing mechanical distinguishes a copied file
  from a written one. That no published package depends on Report or Data
  before a record admits it is held by `scripts/dependency-licences.mjs`,
  which refuses a production dependency whose licence is not permissive
  ([formancy.ai-report 0006](https://github.com/sharkysan/formancy.ai-report/blob/main/docs/decisions/0006-dependencies-and-fonts-allow-public-source-and-licensed-production.md)
  is the rule it adapts), and theirs are not.

## Context

Health builds on three repositories, each of which publishes packages with
provenance.

**formancy.ai.** `@formancy/*` 0.5.0 was released on 11 October 2026, under
Apache-2.0, and its README says the APIs are not frozen before 1.0. Its form
spec version 4 is the newest. Health reads a form through `@formancy/spec`:
its types, its field types and its own validator, which decides what a form
means before anything here maps it.

**Formancy Report.** 0.1.0 was released on 16 October 2026 as a developer
preview, eight packages under its own source-available licence. Its renderer
draws the PDFs a document Bundle carries. A renderer that produces PDF/A,
the form in which the Swiss and German electronic patient records accept an
unstructured document, would be a Report release, not something built here.

**Formancy Data.** 0.1.0 was released on 16 October 2026. Health has no use
for it of its own: Data's records reach Health through a host, or through a
report Report rendered from them.

[formancy.ai-data 0002](https://github.com/sharkysan/formancy.ai-data/blob/main/docs/decisions/0002-depend-on-upstream-never-copy-it.md)
and
[formancy.ai-report 0002](https://github.com/sharkysan/formancy.ai-report/blob/main/docs/decisions/0002-depend-on-upstream-never-copy-it.md)
faced the same choice and chose released packages at exact versions. A copy
that diverged by one validation rule would have produced a form one side
accepts and the other refuses.

Both also copy one thing by hand. Their apps wear formancy.ai's admin colours,
the `:root` variables of `apps/admin/src/admin.css`, which no package
carries, and a palette guard holds every copy to the values at a pinned
upstream commit
([formancy.ai-report 0013](https://github.com/sharkysan/formancy.ai-report/blob/main/docs/decisions/0013-the-studio-is-the-same-room-and-its-pictures-are-taken-by-a-script.md)).
Report's guard says what it cannot see: "admin.css moving without anybody
noticing, which is formancy.ai-data's gap too".

## Decision

Depend on the published `@formancy/*` packages, formancy's, Report's and
Data's, at **exact** versions, and carry none of their code. A version moves
by hand, in a commit whose CHANGELOG line says which release was adopted and
why. Anything Health needs that an upstream does not offer is proposed
there, through that repository's own contribution rules, and this repository
waits for the release.

**That includes formancy's admin colour stylesheet**, by the maintainer's
instruction of 16 October 2026. Health copies none of it and has no palette
guard. Version 1 has no page. If Health ever has one, its colours come from a
released formancy package at an exact version, and since none carries them
at 0.5.0, that means proposing them upstream and waiting.

Which package may depend on Report in production is decided by the record
that brings it, as formancy.ai-report 0016 decided it for Data, and until
one does, no published package here depends on Report. Health has no Data
dependency.

## Consequences

**What it buys.**
- **One meaning of each thing.** A form means what formancy's validator says
  it means, here as in the formancy server, and a PDF is what Report's
  released renderer drew. A copied validator would map a form the formancy
  server refuses.
- **0001 stays honest.** A repository that contains no upstream code cannot
  be a proprietary edition of it.
- **Nothing drifts unnoticed.** With no copy, there is no copy to fall behind
  upstream: the gap Report's and Data's palette guards say they cannot
  close does not exist here.

**What it costs.**
- **Latency.** A generic improvement goes through another repository's review
  before Health can use it. That includes a stable identity for a form's
  fields, if the mapping finds formancy's keys insufficient.
- **Bug fixes by commit.** An upstream fix arrives through a commit somebody
  makes, not through `pnpm install`.
- **PDF/A waits for Report.** Health cannot declare a PDF/A document until a
  Report release produces one and a gate here has proved it, however far
  Report's source has got.
- **A page waits for formancy.** No page of Health's can ship before formancy
  releases its admin colours in a package, and Health cannot change a colour
  on its own.

**What it forecloses.**
- Patching upstream behaviour locally "just for now". There is no mechanism
  for it, by design.
- Widening the form spec to hold what a FHIR profile asks for. That mapping
  is this module's.
- A hand-copied palette, and a guard to hold it.

## Alternatives considered

**Vendor formancy's spec, or Report's renderer.** Rejected, for two reasons:

- **Divergence.** A copy drifts from the original, one rule at a time.
- **Licence.** Vendoring formancy would make this repository a proprietary
  edition of Apache-2.0 code, which 0001 exists to avoid. Vendoring Report
  would be a second copy of a renderer that Report proves on the PDFs it
  produces and this repository would not.

**Ranges with a lockfile.** Rejected, as in Data and Report: `pnpm update`
moves a range without anybody reading upstream's changelog. An exact version
has to be edited, and an edit is a diff.

**A workspace link to a Report checkout, so PDF/A can be tried before Report
releases it.** Rejected for anything this repository builds. The build would
depend on what one machine had checked out, and the install gate would test
something no customer installs.

**Copy admin.css's variables under a palette guard, as Data and Report do.**
Rejected by the maintainer. A guard that pins a copy to a commit sees the
copy differ from that commit; it never sees upstream move after it. And
version 1 has no page to wear them.
