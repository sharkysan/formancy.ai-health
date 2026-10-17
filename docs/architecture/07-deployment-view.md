# 7. Deployment view

## What exists today

Nothing is released ([`RELEASING.md`](../../RELEASING.md)). What a release
would publish, and how, is fixed by
[`.github/workflows/release.yml`](../../.github/workflows/release.yml):

| Artefact | Where | Notes |
|---|---|---|
| Every workspace package whose manifest is not private | npm, under `@formancy/health-*`, with provenance | Exactly the tarballs the install gate packed, installed and ran, pinned by SHA-256 before anything is published. Each declares `SEE LICENSE IN LICENSE.md` and carries `LICENSE.md` and `NOTICE`, which [`scripts/sync-licenses.mjs`](../../scripts/sync-licenses.mjs) copies in at `pnpm build`, and [`scripts/verify-licenses.mjs`](../../scripts/verify-licenses.mjs) and [`scripts/release/pins.mjs`](../../scripts/release/pins.mjs) refuse otherwise ([0001](../decisions/0001-a-paid-module-in-its-own-repository.md)) |
| A CycloneDX SBOM | the GitHub release, signed keyless with cosign | Made by cdxgen from the checked-out workspace's production dependencies, and pinned before the signature; [§11](11-risks-and-debt.md#113-known-debt) says what that leaves |
| The release notes | the GitHub release | This version's section of [`CHANGELOG.md`](../../CHANGELOG.md), which [`scripts/release-notes.mjs`](../../scripts/release-notes.mjs) checks is there and short enough before anything is published; not pinned |
| `@formancy/health-corpus` | nowhere | Private: never packed, never published ([0008](../decisions/0008-a-document-is-a-bundle-of-what-it-refers-to-and-a-pdf-its-own-bytes-never-an-unproved-pdf-a.md)) |
| A container image, a server | none | Version 1 is a library |

## Where it runs: inside the host

```
the vendor's application
┌─────────────────────────────────────────────────────────────┐
│ its composition root: identity it verified, the canonical   │
│ base, the version formancy published, the clock, the PDF    │
│            │                                                │
│            ▼                                                │
│ @formancy/health-ch, a CH ORF document, built on:           │
│ @formancy/health-questionnaire ──┐                          │
│   └─ @formancy/spec (exact)      ├──▶ @formancy/health-core │
│ @formancy/health-document ───────┘                          │
│                                                             │
│ optional: Formancy Report, rendering the PDF                │       the host's transport
└──────────────────────────────┬──────────────────────────────┘ ──────────────────────▶ receiving system
                               │ FHIR JSON
```

What a host needs:

- **ESM.** There is no CommonJS build; `check:pkg` holds each package's
  exports with `attw`'s `esm-only` profile.
- **Node, as the gates run it.** The packages compile against the
  ECMAScript library alone and name no Node and no DOM API
  ([§2](02-constraints.md#technical-constraints)), but the install gate
  runs them under Node alone, the Node the README's
  [table](../../README.md#what-it-is-built-and-judged-against) names; no
  gate runs them in a browser or another engine, so that is not claimed.
- **What it supplies**: a form, as `@formancy/spec` reads it, which comes
  with health-questionnaire at the exact version it depends on; a
  submission, as formancy's engine holds it; a PDF's bytes as a
  `Uint8Array`; and the context each export names, in its package's
  README. For a CH ORF document, the referral's patient, author and orders
  as health-ch's context names them, and the answers health-questionnaire
  wrote, claiming CH ORF's response profile; the host publishes the
  Questionnaire at the canonical the response names, which the Bundle does
  not carry ([0009](../decisions/0009-a-ch-orf-document-is-the-hosts-referral-in-ch-core-and-ch-orf-the-questionnaire-by-canonical-and-swiss-identifiers-checked-here.md)). Identity, transport, storage and signing are the host's
  ([§3](03-context-and-scope.md#what-is-deliberately-outside-the-boundary)).
- **Licences.** A production licence for this product, and for Formancy
  Report's or Formancy Data's packages where it runs them in production too
  ([README](../../README.md#licence-in-one-table)).

## Where the gates run

| Gate | Where | What it needs |
|---|---|---|
| `verify`, `test`, `install` | GitHub's `ubuntu-latest`, the Node the README's [table](../../README.md#what-it-is-built-and-judged-against) names, pnpm through corepack | The lockfile; the `test` job's matrix names every package with a suite, which [`scripts/ci-test-jobs.test.mjs`](../../scripts/ci-test-jobs.test.mjs) holds |
| `validator` | The same, with Temurin, at the Java the validator's register asks for, from a `setup-java` pinned to a commit | GitHub's release asset and packages.fhir.org, reached only to download what the registers pin; a download cache in CI alone, keyed on the registers and never restored by a release ([0005](../decisions/0005-a-fhir-resource-is-proved-by-the-hl7-validator-against-pinned-guide-packages.md)). The register holds the Swiss guides and what they declare -- `ch.fhir.ig.ch-orf`, `ch.fhir.ig.ch-core`, `ch.fhir.ig.ch-term`, the `hl7.fhir.uv.sdc` release CH ORF is built on, `ihe.formatcode.fhir`, admitted under CC-BY-4.0 for that entry alone, and the `hl7.terminology.r4` releases they name -- each at the release [`ig-packages.json`](../release/ig-packages.json) pins ([0009](../decisions/0009-a-ch-orf-document-is-the-hosts-referral-in-ch-core-and-ch-orf-the-questionnaire-by-canonical-and-swiss-identifiers-checked-here.md)) |
| By hand | Any machine with a Java at least as new as the register asks | `pnpm build`, then `node scripts/validator.mjs --java <path>`, which downloads into the cache directory [`.gitignore`](../../.gitignore) keeps out of git |

Every job is [`.github/workflows/gates.yml`](../../.github/workflows/gates.yml),
which [`ci.yml`](../../.github/workflows/ci.yml) calls on every pull request
and `release.yml` before it publishes, so a release passes exactly what CI
does.
