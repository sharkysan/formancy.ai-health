# Repository metadata

Kept here because GitHub's description, topics and settings live in the
repository's settings, not in the tree. This file is the reviewable source for
what should be set there. Nothing in the repository can read those settings,
so nothing fails when they drift from this file; it is held by review.

## Description

> Export formancy forms and Formancy Report PDFs to the HL7® FHIR® standard,
> shaped to each country's profiles: CH Core and CH ORF first, then Germany,
> the UK, Austria and HL7 Europe. Source-available; free to evaluate and
> develop, paid in production.

FHIR and HL7 appear in the description and the topics only to name the
standard and the guides the module implements, never as the product's name
([0003](../docs/decisions/0003-the-product-name-carries-no-hl7-mark.md)).
`scripts/trademark.test.mjs` holds the names in the tree; this file and
review hold the ones GitHub keeps.

## Topics

```
healthcare
fhir
hl7
questionnaire
ehealth
typescript
self-hosted
source-available
formancy
```

## Apply

```bash
gh repo edit sharkysan/formancy.ai-health \
  --description "Export formancy forms and Formancy Report PDFs to the HL7® FHIR® standard, shaped to each country's profiles: CH Core and CH ORF first, then Germany, the UK, Austria and HL7 Europe. Source-available; free to evaluate and develop, paid in production." \
  --add-topic healthcare --add-topic fhir --add-topic hl7 \
  --add-topic questionnaire --add-topic ehealth --add-topic typescript \
  --add-topic self-hosted --add-topic source-available --add-topic formancy \
  --delete-branch-on-merge
```

## Settings

As formancy.ai-report's, set on 2026-10-16:

| Setting | Value | Why |
|---|---|---|
| Delete branch on merge | on | A merged branch is deleted by the merge, never by hand (formancy.ai-data 0036) |
| Ruleset *Protect* | on the default branch: no deletion, no force-push, no bypass, no required check | `main`'s history cannot be rewritten or removed; GOVERNANCE.md says what it does not do |
| Secret scanning and push protection | on | A credential pushed by mistake is refused or reported |
| Dependabot alerts, and with them the dependency graph | on | `security.yml`'s dependency review refuses to run without the graph ("Dependency review is not supported on this repository") |
| Private vulnerability reporting | on | `SECURITY.md` sends reporters to "Report a vulnerability", which exists only when this is on |
| Label `accessibility` | present | As in formancy.ai, formancy.ai-data and formancy.ai-report |
| Environment `npm` | deployment policy: tags `v*` only | The only place `NPM_TOKEN` lives (below) |

## Website

https://formancy.ai/health/, the demo ([0012](../docs/decisions/0012-a-demo-at-formancy-ai-health-fills-a-synthetic-referral-in-the-browser-served-by-a-worker-of-its-own.md)), once it answers there. The
address holds no HL7 mark, and neither does the Worker's name (0003):

```bash
gh repo edit sharkysan/formancy.ai-health --homepage https://formancy.ai/health/
```

## The demo's Worker on Cloudflare

The demo is a Cloudflare Worker connected to this repository by Workers
Builds, as formancy.ai-report's Studio is to its own (formancy.ai-report
0018). Its settings are in Cloudflare's dashboard, under the Worker's
*Settings › Build*, where nothing here can read them.
`scripts/demo.test.mjs` holds the Worker, the repository, the root
directory, the branch, the two commands and the build variables below to
`apps/demo/wrangler.json`, the packages' manifests and
`pnpm demo:deploy`. Review holds the rest.

| Setting | Value | Why |
|---|---|---|
| Worker | `formancy-health-demo` | The name `apps/demo/wrangler.json` gives it, which must be the dashboard's: Workers Builds deploys the config it builds |
| Git repository | `sharkysan/formancy.ai-health` | |
| Production branch | `main` | The demo is main's |
| Builds for non-production branches | off | A branch's build would upload a version of the Worker from code no review has merged |
| Root directory | `/` | The workspace's root, where its lockfile is and `pnpm build` builds every package the demo imports |
| Build command | `pnpm build` | |
| Deploy command | `node scripts/demo.mjs` | It stages the demo's build under `/health/`, the notices the build wrote among it, writes `_headers` from `scripts/demo-headers.mjs` for https://formancy.ai/health/ beside it, and runs the pinned Wrangler with `apps/demo/wrangler.json` |
| Build variables | none | Node from `.node-version`, the major every workflow sets up, and no `NODE_VERSION` beside it; pnpm the version `packageManager` names, which the image's pnpm switches to |
| API token | the one Workers Builds generates | No Cloudflare token is held in GitHub |

The Worker was connected by 18 October 2026, before `main` held the demo:
its build of that `main` stopped at the deploy command, which found no
`scripts/demo.mjs`. The first build of a `main` that holds the demo is the
first that can deploy it.

## Search engines

None. The demo says `noindex`, in an `X-Robots-Tag` on every file it
serves, which `scripts/demo.test.mjs` holds, and in its page's `robots`
meta; Health has no page meant to be found ([0012](../docs/decisions/0012-a-demo-at-formancy-ai-health-fills-a-synthetic-referral-in-the-browser-served-by-a-worker-of-its-own.md)).

## Secrets the workflows expect

Neither was set on 17 October 2026, and both are the maintainer's to add before the first
release ([`RELEASING.md`](../RELEASING.md#before-the-first-release)): read
with `gh api` on 17 October 2026, the repository holds no secret and the
`npm` environment none, its deployment policy admitting tags `v*` alone.

| Secret | Used by | Without it |
|---|---|---|
| `CODECOV_TOKEN` | `gates.yml`'s coverage upload, passed by `ci.yml` and never by `release.yml`. A repository secret | The upload step is skipped, visibly; with the token set, a failed upload fails that package's `test` job |
| `NPM_TOKEN` | `release.yml`'s `npm-token` and `publish` jobs, on a tag only. A secret of the **`npm` environment**, not of the repository, so a workflow pushed to any other branch or tag cannot read it | A tag push is red in `npm-token`, which runs beside the gates rather than after them, and nothing is published; a rehearsal does not need it |

Both jobs that read `NPM_TOKEN` name the `npm` environment, which
`scripts/workflows.test.mjs` holds. The environment's deployment policy is a
setting of the repository, which no test here can read.
