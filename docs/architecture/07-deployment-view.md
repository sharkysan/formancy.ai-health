# 7. Deployment view

## What exists today

As of 17 October 2026 nothing is released. 0.1.0, a developer preview, is ready to tag
([README](../../README.md#what-010-is)), and what a release reads that
only the maintainer can set -- `NPM_TOKEN` in the `npm` environment, whose
policy admits tags `v*` alone, `CODECOV_TOKEN`, a public repository -- is
[`RELEASING.md`](../../RELEASING.md#before-the-first-release)'s, as read
with `gh api` on 17 October 2026: the policy and the visibility set, neither
token. What a release would publish, and how, is fixed by
[`.github/workflows/release.yml`](../../.github/workflows/release.yml):

| Artefact | Where | Notes |
|---|---|---|
| Every workspace package whose manifest is not private | npm, under `@formancy/health-*`, with provenance | Exactly the tarballs the install gate packed, installed and ran, held to the install gate's record in the release report and pinned by SHA-256 before anything is published. Each declares `SEE LICENSE IN LICENSE.md` and carries `LICENSE.md` and `NOTICE`, which [`scripts/sync-licenses.mjs`](../../scripts/sync-licenses.mjs) copies in at `pnpm build`, and [`scripts/verify-licenses.mjs`](../../scripts/verify-licenses.mjs) and [`scripts/release/pins.mjs`](../../scripts/release/pins.mjs) refuse otherwise ([0001](../decisions/0001-a-paid-module-in-its-own-repository.md)) |
| The release report, as Markdown and as JSON | the GitHub release, each signed keyless with cosign; on every pull request, the run's summary and its `release-report` artefact | What the run that gated the release was tested on, what each job found, the validator gate's verdict held to the registers, each tarball's build identity, the release gates and the known limitations ([0011](../decisions/0011-a-release-report-is-derived-from-the-run-that-gated-it.md), [`docs/release/`](../release/README.md)). A build output of that run, never committed; `check` refuses one that is not that run's, green and whole, and pins it |
| A CycloneDX SBOM | the GitHub release, signed keyless with cosign | What a consumer installs: the tarballs `check` pinned, installed by npm in a project of their own outside the checkout, with no lifecycle script run and no peer, read by cdxgen with `--required-only` -- the published packages at the release's version, `@formancy/spec` and what it brings. `check` installs no workspace, holds the SBOM to the report -- every published package at the version, every upstream package a consumer's install brings at the version the suites loaded -- and to npm's lockfile of the install it read, no component more or less, and pins it before the signature ([0011](../decisions/0011-a-release-report-is-derived-from-the-run-that-gated-it.md), as [formancy.ai-report 0017](https://github.com/sharkysan/formancy.ai-report/blob/main/docs/decisions/0017-the-sbom-describes-what-a-consumer-installs.md)); [§11](11-risks-and-debt.md#113-known-debt) says what that leaves |
| The release notes | the GitHub release's body | This version's section of [`CHANGELOG.md`](../../CHANGELOG.md) and the report's summary, built and measured by the gates' report job ([`scripts/release-notes.mjs`](../../scripts/release-notes.mjs)), and pinned with the report |
| `@formancy/health-corpus` | nowhere | Private: never packed, never published ([0008](../decisions/0008-a-document-is-a-bundle-of-what-it-refers-to-and-a-pdf-its-own-bytes-never-an-unproved-pdf-a.md)) |
| The demo, `apps/demo` | https://formancy.ai/health/, from `main` | Private, never packed: a Cloudflare Worker of static files and no code, built and deployed by Cloudflare's Workers Builds on every push to `main` ([below](#the-demo), [0012](../decisions/0012-a-demo-at-formancy-ai-health-fills-a-synthetic-referral-in-the-browser-served-by-a-worker-of-its-own.md)) |
| A container image, a server | none | Version 1 is a library; the demo serves files and runs no code |

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
  gate runs the packed packages in a browser or another engine, so that is
  not claimed. The demo's browser gate runs them in Chromium, Firefox and
  WebKit as its page bundles them from the workspace ([below](#the-demo)),
  which shows a browser can run them and is not a host's install.
- **What it supplies**: a form, as `@formancy/spec` reads it, which comes
  with health-questionnaire at the exact version it depends on, 0.6.0 in
  0.1.0 -- a host that runs Formancy Report 0.1.0 too holds Report's own
  0.5.0 beside it, which hashes only Report's definitions
  ([0015](../decisions/0015-the-demo-wears-formancy-ais-room-imported-from-formancy-0-6-0-and-the-packages-read-forms-through-the-same-release.md)); a
  submission, as formancy's engine holds it; a PDF's bytes as a
  `Uint8Array`; and the context each export names, in its package's
  README. For a CH ORF document, the referral's patient, author and orders
  as health-ch's context names them, and the answers health-questionnaire
  wrote, claiming CH ORF's response profile; the host publishes the
  Questionnaire at the canonical the response names, which the Bundle does
  not carry ([0009](../decisions/0009-a-ch-orf-document-is-the-hosts-referral-in-ch-core-and-ch-orf-the-questionnaire-by-canonical-and-swiss-identifiers-checked-here.md)). Identity, transport, storage and signing are the host's
  ([§3](03-context-and-scope.md#what-is-deliberately-outside-the-boundary)).
- **What it is for.** The README's
  [intended purpose](../../README.md#intended-purpose): converting what the
  host holds into FHIR resources and assembling documents of them, for a
  software vendor's product; not intended as a medical device, and a host
  whose product computes a clinical result from its own forms carries the
  duty that brings
  ([0011](../decisions/0011-a-release-report-is-derived-from-the-run-that-gated-it.md)).
- **Licences.** A production licence for this product, and for Formancy
  Report's or Formancy Data's packages where it runs them in production too
  ([README](../../README.md#licence-in-one-table)).
- **A first program.** [`docs/getting-started.md`](../getting-started.md)
  takes a Node host from an empty npm project to a CH ORF document. Its
  section 1 is what such a host installs, each package saved as the
  release it installs, and its `tsconfig.json` what it is checked under;
  the install gate builds a project of the same packages at the same
  releases, the published ones from their tarballs, and runs the program in it ([0011](../decisions/0011-a-release-report-is-derived-from-the-run-that-gated-it.md)).

## The demo

```
push to main ──▶ Cloudflare Workers Builds: pnpm build, then node scripts/demo.mjs
                     │  the build refuses a letter that is not the registered bytes;
                     │  the deploy refuses a checkout with changes, a Worker config
                     │  that is not the demo's, a page that asks for a file by an
                     │  absolute path, and a _headers of the build's own
                     ▼
                 the demo's Worker: static assets, no code,
                 routed at formancy.ai/health and formancy.ai/health/*
                     ├─ _headers     one rule, /*, from scripts/demo-headers.mjs,
                     │               written for https://formancy.ai/health/
                     └─ health/      the built demo, THIRD-PARTY-NOTICES.txt beside its page

formancy.ai's own Worker serves everything else, Formancy Report's Studio at /report/ beside it
```

The demo is built with a relative base, so one build is right under
`/health/` and at the root of `pnpm demo`; `scripts/demo.mjs` stages it
under the path read from `apps/demo/wrangler.json`, writes the headers
`scripts/demo-headers.mjs` decides for the demo's address there as the
`_headers` file Cloudflare reads
at the root of what Wrangler uploads, and deploys with the Wrangler it
pins, as
[formancy.ai-report 0018](https://github.com/sharkysan/formancy.ai-report/blob/main/docs/decisions/0018-the-studio-demo-is-served-at-formancy-ai-report.md)
deploys Report's Studio. `pnpm demo` serves the build under the same
headers, from the same function, written for http://localhost:4395/, and
the browser gate under those it writes for its own address; the three
differ in that address alone, since the policy admits the build's
scripts, styles and faces from there and from nowhere else. The Worker's build settings live in
Cloudflare's dashboard, recorded by hand in
[`.github/REPO-METADATA.md`](../../.github/REPO-METADATA.md#the-demos-worker-on-cloudflare)
and held there to the deploy by
[`scripts/demo.test.mjs`](../../scripts/demo.test.mjs). What that costs: the
demo is `main`'s, ahead of any release; a push deploys without waiting for
that commit's CI; Cloudflare builds on its own machine, whose Node must
render the letter's registered bytes or the build stops; and nothing in this repository checks
that a deploy happened or what the address serves, which
[`RELEASING.md`](../../RELEASING.md#the-demo-on-formancyai) checks by hand
([0012](../decisions/0012-a-demo-at-formancy-ai-health-fills-a-synthetic-referral-in-the-browser-served-by-a-worker-of-its-own.md)).

What the demo needs of a visitor is a browser that runs a module script;
of Cloudflare, a Worker of its own on formancy.ai's zone, with the build
settings REPO-METADATA records and no token in GitHub; and of nothing
else, since the page asks no other site for anything, its faces included.

## Where the gates run

| Gate | Where | What it needs |
|---|---|---|
| `verify`, `test`, `install` | GitHub's `ubuntu-latest`, the Node the README's [table](../../README.md#what-it-is-built-and-judged-against) names, pnpm through corepack | The lockfile; the `test` job's matrix names every package with a suite, which [`scripts/ci-test-jobs.test.mjs`](../../scripts/ci-test-jobs.test.mjs) holds. The install gate reaches the registry, unlocked, for its projects' tools and for what the guide installs beside the tarballs: `@formancy/spec`, and Formancy Report's runtime and renderer with what they bring |
| `validator` | The same, with Temurin, at the Java the validator's register asks for, from a `setup-java` pinned to a commit | GitHub's release asset and packages.fhir.org, reached only to download what the registers pin; a download cache in CI alone, keyed on the registers and never restored by a release ([0005](../decisions/0005-a-fhir-resource-is-proved-by-the-hl7-validator-against-pinned-guide-packages.md)). The register holds the Swiss guides and what they declare -- `ch.fhir.ig.ch-orf`, `ch.fhir.ig.ch-core`, `ch.fhir.ig.ch-term`, the `hl7.fhir.uv.sdc` release CH ORF is built on, `ihe.formatcode.fhir`, admitted under CC-BY-4.0 for that entry alone, and the `hl7.terminology.r4` releases they name -- each at the release [`ig-packages.json`](../release/ig-packages.json) pins ([0009](../decisions/0009-a-ch-orf-document-is-the-hosts-referral-in-ch-core-and-ch-orf-the-questionnaire-by-canonical-and-swiss-identifiers-checked-here.md)) |
| `browser` | GitHub's `ubuntu-24.04`, pinned for the fonts and libraries the browsers draw with, one leg per browser of [`browsers.mjs`](../../scripts/browsers.mjs) | The lockfile; the build of the leg's browser the installed Playwright pins -- Chromium's headless shell, Firefox, WebKit -- downloaded by `playwright install <browser>` without `--with-deps`, its download cached in CI alone by the browser and the lockfile; in WebKit's leg alone, WebKit's system libraries, by `playwright install-deps webkit`, through apt; nothing reached from the page, which the gate fails if it asks anything of another origin ([0012](../decisions/0012-a-demo-at-formancy-ai-health-fills-a-synthetic-referral-in-the-browser-served-by-a-worker-of-its-own.md), [0014](../decisions/0014-the-demos-browser-gate-runs-in-chromium-firefox-and-webkit-and-each-fact-the-browsers-disagree-on-is-named-and-held.md)) |
| `report` | GitHub's `ubuntu-latest`, after every other job, unless the run was cancelled | The lockfile, installed and not built, and the whole history, for a document's last change; every other job's `release-results-<key>` artefact, each uploaded by that job's collect step however the job ended ([0011](../decisions/0011-a-release-report-is-derived-from-the-run-that-gated-it.md)) |
| By hand | Any machine with a Java at least as new as the register asks | `pnpm build`, then `node scripts/validator.mjs --java <path>`, which downloads into the cache directory [`.gitignore`](../../.gitignore) keeps out of git; and a report of that machine's runs, as [`RELEASING.md`](../../RELEASING.md#the-release-report) says |

Every job is [`.github/workflows/gates.yml`](../../.github/workflows/gates.yml),
which [`ci.yml`](../../.github/workflows/ci.yml) calls on every pull request
and `release.yml` before it publishes, so a release passes exactly what CI
does, and its report describes the run that gated it.
