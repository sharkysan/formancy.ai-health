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

None. Version 1 is a library with no page, and the *About* field stays empty
until something of this module's is live. A page of its own, if it ever has
one, takes an address without HL7's marks in it (0003).

## Secrets the workflows expect

Neither is set yet: on 16 October 2026 both are the maintainer's to add.

| Secret | Used by | Without it |
|---|---|---|
| `CODECOV_TOKEN` | `gates.yml`'s coverage upload, passed by `ci.yml` and never by `release.yml`. A repository secret | The upload step is skipped, visibly; with the token set, a failed upload fails that package's `test` job |
| `NPM_TOKEN` | `release.yml`'s `npm-token` and `publish` jobs, on a tag only. A secret of the **`npm` environment**, not of the repository, so a workflow pushed to any other branch or tag cannot read it | A tag push is red in `npm-token`, which runs beside the gates rather than after them, and nothing is published; a rehearsal does not need it |

Both jobs that read `NPM_TOKEN` name the `npm` environment, which
`scripts/workflows.test.mjs` holds. The environment's deployment policy is a
setting of the repository, which no test here can read.
