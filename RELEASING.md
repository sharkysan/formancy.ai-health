# Releasing

Releases are cut by [`.github/workflows/release.yml`](.github/workflows/release.yml)
and nowhere else. A release built on a laptop cannot carry provenance — the
attestation is a statement *by GitHub* about which workflow, at which commit,
produced a tarball, and only the workflow can make it.

Nothing has been released yet. 0.1.0, a developer preview, is ready to
tag and not tagged, as the README's Status says on 19 October 2026: the
manifests say 0.1.0, the changelog's section is 0.1.0's, dated that day
(step 2), the settings below are set, and what is left is the
maintainer's -- the rehearsal and the tag, and the section's date moved to
the tag's day, through a pull request, if the tag is pushed on another.
The workflow
follows Formancy Report's, release report included (0011, as
formancy.ai-report 0014), without a server image, because there is no
server.

## Before the first release

The workflows read what only the maintainer can set, in the repository's
settings, which [`.github/REPO-METADATA.md`](.github/REPO-METADATA.md)
records and nothing in the repository can read:

| What | Where | Without it | On 19 October 2026 |
|---|---|---|---|
| `NPM_TOKEN`, an Automation or Granular Access token of an npm account that may publish under `@formancy` ([Secrets](#secrets)) | a secret of the **`npm` environment**, never of the repository | a tag's run is red in `npm-token`, beside the gates, and nothing is signed or published; a rehearsal does not read it | set |
| The `npm` environment's deployment policy, tags `v*` alone | the environment's settings | any ref's workflow that names the environment could read the token | set |
| `CODECOV_TOKEN` | a repository secret, which `ci.yml` passes to `gates.yml` and `release.yml` never does | each package's coverage upload is skipped, visibly; nothing else changes, and a release does not read it | set |
| A public repository | the repository's visibility | npm refuses provenance ([Provenance](#provenance)) | public |

The last column was read with `gh api` on 19 October 2026 -- the
repository, its secrets, and the `npm` environment, its secrets and its
deployment branch policy -- and goes stale the day one changes. The
release report has run on GitHub on every pull request and every push to
`main` since it arrived; the SBOM step had run on no runner by that day,
and the first rehearsal is its first run
([0011](docs/decisions/0011-a-release-report-is-derived-from-the-run-that-gated-it.md));
read both before the tag.

## Cutting one

```bash
# 1. Bump every package to the new version (one number across all of them).
#    For 0.1.0 the manifests already say it, and this changes nothing.
node scripts/bump.mjs 0.1.0

# 2. Rename "## Unreleased" in CHANGELOG.md to the version's heading, dated
#    the day of the tag -- "## 0.1.0 — 2026-10-19" -- and say what is
#    knowingly missing; for 0.1.0 the section opens by saying what the
#    release is and what is not in it, as the README does. What the release
#    was tested with is the release report's, from the run that gates it;
#    the body carries it. A tag whose version has no section fails the
#    report job before anything is published.

# 3. Verify locally — the workflow runs these again, but finding out here is cheaper
pnpm build && pnpm typecheck && pnpm test:coverage && pnpm check:pkg && pnpm test:repo
node scripts/verify-licenses.mjs
node scripts/dependency-licences.mjs
pnpm test:e2e:install
node scripts/validator.mjs --java <path to java 17 or later>
pnpm --filter @formancy/health-demo exec playwright install chromium firefox webkit   # once, the builds Playwright pins; WebKit runs on Linux alone
pnpm --filter @formancy/health-demo test:browser   # every browser this machine runs
#    and, to read the report of what ran on this machine, "The release report"
#    below

# 4. Get the release commit onto main, through a pull request like any other.

# 5. Rehearse on it, then read the run, its release report and the body it built.
gh workflow run release.yml --ref main

# 6. Tag that commit and push the tag, and nothing else.
git tag -a v0.1.0 -m "Formancy Health 0.1.0"
git push origin v0.1.0

# 7. Once the release is on npm and GitHub, say so, through a pull request,
#    everywhere a sentence says, as of 17 October 2026, that nothing is
#    released or that a run has not happened: the README's Status; this
#    file's first paragraph, "Before the first release" and the line on
#    the publish job under "If a step after npm fails"; the architecture's
#    introduction (01), runtime view (06) and deployment view (07), and
#    the rows of verification (10) and risks and debt (11) that say the
#    report, the SBOM step or the publish job has not run on GitHub;
#    .github/REPO-METADATA.md's secrets; and 0011's register line on the
#    publish job (docs/release/limitations.json), restamped if 0011 changes.
```

Pushing the tag is what starts the release. Everything after that is the
workflow's job, until step 7, which is a change like any other.

## What the workflow does

In this order, so that every check on what would be published runs before
anything that cannot be taken back:

1. **`tag`: decides once whether this run publishes** — only on the push of a
   `v*` tag — and refuses a tag that disagrees with the manifests. A tag
   saying `v0.2.0` on a tree saying `0.1.0` would publish the wrong version
   under the right name, which cannot be fixed afterwards.
2. **`npm-token`: the token must work, beside the gates.** Set, accepted by
   `npm whoami`, and a warning when the account wants a one-time password on
   writes. A missing or refused token is red while the gates are still
   running, not after them.
3. **`gates`: the gates CI runs, from
   [`gates.yml`](.github/workflows/gates.yml)** — build, types, packaging,
   licences and the repository guards; each package's suite on a runner of
   its own; the install gate, which packs, installs and runs the tarballs,
   and the getting-started guide's program beside them, and keeps them; and
   the validator gate, which fetches the pinned HL7 FHIR
   validator and guide packages from where their registers say and judges
   the corpus offline (0005); then the report job, which builds the release
   report of that run and the release body -- the version's changelog
   section and the report's summary -- and fails the run on any problem the
   report lists, and on a tag that is not the manifests' version, a version
   with no changelog section, or a body over the 125,000 characters GitHub
   accepts. Unlike CI, a release restores no Actions cache: a tag's run may
   restore one a main-branch run saved, and every job installs from the
   registry against the lockfile instead.
4. **`check`, in a job that holds `contents: read` and no secret:**
   - It refuses a report that is not this run's, green and whole: of
     another commit, run, release or version, partial, local, or with
     problems; and a report directory holding anything but the report and
     the body.
   - It refuses tarballs that are not at the release's version, that declare
     another licence field, that lack `LICENSE.md` or `NOTICE`, or that are
     not, byte for byte, the ones the report says the install gate
     installed and ran; and a body that is missing or too long.
   - It pins the sha256 of the report, the body and every tarball as its
     outputs. Only then does it make a CycloneDX SBOM of what a consumer
     installs: the tarballs it pinned, installed by npm into a project of
     their own under `RUNNER_TEMP`, with no lifecycle script run and no
     peer, read by cdxgen with `--required-only`. It refuses the SBOM
     unless it names every published package at the release's version and
     every upstream package a consumer's install brings, each at the
     version the suites loaded, and exactly the packages npm's lockfile of
     that install holds, and pins it too
     ([0011](docs/decisions/0011-a-release-report-is-derived-from-the-run-that-gated-it.md),
     as formancy.ai-report 0017).
   - It installs no workspace: the checks import Node's built-ins alone, so
     nothing can read the workspace in place of what ships.

   This job is not one that can write nothing. Every job of a run can write
   to the run's artefacts, this one uploads the SBOM, and neither cdxgen's
   own dependencies nor the closure npm resolves for the SBOM are locked.
   The pins are what tie what is published to what was checked.
5. **`publish`, only on a tag, the one job with write permissions and an OIDC
   identity.** In order:
   1. It refuses any file it downloaded that `check` did not pin, or pinned
      otherwise, and a report that is not this run's, green and whole. It
      does this before signing anything, and again in the step that holds
      the npm token, which also holds each tarball to the install gate's
      record in the report.
   2. It signs the SBOM, then the report's Markdown and JSON, with cosign,
      keylessly.
   3. It publishes the tarballs `check` passed to npm, with provenance and in
      dependency order. That step is the only one that holds the npm token
      or runs a package manager.
   4. It creates the GitHub release with the report's body, and the SBOM,
      the report and their signatures attached.

   No step in it carries a condition of its own: the job is the boundary.

`--access public` is about the registry's visibility of a scoped package;
`LICENSE.md` is what says what may be done with it.

## The release report

Every run of the gates ends in one, a release's included, and a release
attaches it signed ([`docs/release/`](docs/release/README.md) says what it
holds and what fails it). In short:
- which run it is;
- what that run was tested on -- the runtime dependencies (none today) and
  upstream `@formancy/*` as published, as the suites loaded them, as a
  consumer's clean install of the tarballs resolved them, and, apart, as
  the guide's project did; Node, npm, pnpm and TypeScript; the FHIR
  version, the validator the gate pins and the one it ran, with its Java;
- each package's results, held to every test file the checkout holds for
  it, a skip passing only where the validator job's run passed that test;
- the demo's browser gate, every pass it planned made and every check in
  it passed, in Chromium, Firefox and WebKit at the builds the installed
  Playwright pins, the same checks in each, and every row of
  `scripts/browsers.mjs`'s table held by its check;
- the install gate, each project held to what `scripts/install-hosts.mjs`
  plans, and the validator gate's verdict held to the registers;
- each tarball's built files against the `dist/` every job built;
- the release gates from [`gates.json`](docs/release/gates.json);
- the known limitations: the run's, then those the decision records state,
  from [`limitations.json`](docs/release/limitations.json);
- its problems, any one of which fails the run.

To build one on a machine, from that machine's own runs:

```bash
since=$(date -u +%Y-%m-%dT%H:%M:%SZ)
pnpm build
node scripts/validator.mjs --java <path to java 17 or later>
VALIDATOR_GATE_RAN=true pnpm test:repo                   # the guards, the registers' every case with them
pnpm exec turbo run test:coverage --force --summarize   # every package, fresh, with its wall time
pnpm --filter @formancy/health-demo test:browser        # the demo's browser gate, in every browser this machine runs
node scripts/install-test.mjs
node scripts/release-report/collect.mjs --local --since "$since"
node scripts/release-report/report.mjs --local --allow-missing verify,install,validator
```

It writes `release-report/release-report.md` and `.json`, and exits 1 on any
problem. Every file it reads must be from after `--since` and from the one
run that wrote its suite's results, and every test file of a package must
have run: a report after one file run alone fails, by design. The guards
run after the validator gate, as above: guards that started before the
gate finished read an earlier gate's file, and are refused as another
run's. `--allow-missing verify,install,validator` is for the gates that
rest on those jobs' results, which `gates.json` names, since a job's
result exists only in a gates run; the guards', the install gate's and the
validator gate's own files are read whatever it allows. On a machine
without a Java, leave out the validator and its `VALIDATOR_GATE_RAN`: the
registers' cases that read its downloads skip, and are allowed by
`--allow-missing validator` alone, which the banner says; on one without
the browsers, leave out the browser gate and add `browser`, and on one
that is not Linux, which runs no WebKit, add `browser` too: the files of
the browsers that ran are read and held all the same, and the banner says
the gate was allowed missing, WebKit's file with it (0014). The browser gate builds the demo itself, first; with its eight
passes in each browser in turn it ran, by its results files' start and
finish on a desktop on 18 October 2026 (Windows 11, Node 24.21.0), 51.0
and 51.4 s in Chromium and 85.1 and 76.1 s in Firefox, in two runs. A file that is
there from before `--since` is refused all the same -- run it again or
remove it. A release refuses a local report.

## Rehearsing

`gh workflow run release.yml --ref <branch>`, or **Run workflow** on the
Actions page, runs `tag`, `gates` and `check` on that branch: every gate,
the release report and body, the SBOM and every check on the report and the
tarballs, exactly as a tag would. It skips `npm-token` and `publish`, so it needs no secret and cannot
publish or sign; its jobs hold `contents: read` and nothing else. It names
the release `dry-run`. Its body uses the version's changelog section when
there is one and `Unreleased` otherwise, so a rehearsal on the release
commit renders the body that will be released.

Agents ask before dispatching it, and never tag or publish.

## If the run fails before `publish`

Nothing is signed or published until `publish` runs, so the tag names a
commit no release holds. Fix the cause on `main` through a pull request,
then move the tag to `main` and push it again:

```bash
git fetch origin
git tag -d v0.1.0
git push origin :refs/tags/v0.1.0
git tag -a v0.1.0 origin/main -m "Formancy Health 0.1.0"
git push origin v0.1.0
```

Formancy Report's first tag stopped in `check` and was moved that way. Once
`publish` has started, a tag is never moved: npm and Rekor may already hold
what it named.

## If a step after npm fails

Only the GitHub release comes after npm. Run the failed `publish` job again.
`scripts/release/publish.mjs` skips every version npm already holds with the
same bytes, refuses one npm holds with other bytes, and the release is then
created. Signatures are logged in Rekor before npm is reached, and those
entries stay even when a release never happens.

| Step | What cannot be taken back | Can fail on | Already done when it fails |
|---|---|---|---|
| `sign-sbom` | a Rekor log entry | Sigstore | nothing published |
| `sign-report` | a Rekor log entry each for the report's Markdown and JSON | Sigstore | the SBOM's signature |
| `npm-publish` | each version number on npm, forever | the registry; any one of the packages | the signatures |
| `github-release` | nothing: a release can be edited or deleted | the GitHub API | npm |

The publish job had not run by 17 October 2026. `scripts/workflows.test.mjs`
holds its shape; the first tag is the first time it runs.

## The demo on formancy.ai

Cloudflare deploys the demo at https://formancy.ai/health/ on every push
to `main`, through Workers Builds ([0012](docs/decisions/0012-a-demo-at-formancy-ai-health-fills-a-synthetic-referral-in-the-browser-served-by-a-worker-of-its-own.md)), as formancy.ai-report 0018
deploys Report's Studio at https://formancy.ai/report/. Its Worker is
connected to this repository. It builds with `pnpm build` and deploys
with `node scripts/demo.mjs`, the two halves of `pnpm demo:deploy`, with
the settings in
[REPO-METADATA.md](.github/REPO-METADATA.md#the-demos-worker-on-cloudflare).
So the demo is main's, not the latest release's, and a release needs
nothing more for it.

`node scripts/demo.mjs` refuses:
- a checkout with changes;
- a Worker config in `apps/demo/wrangler.json` that is not the demo's;
- a missing build;
- a built page that asks for a file by an absolute path;
- a build that holds a `_headers` or `_redirects` of its own, and a header
  `_headers` cannot carry as `scripts/demo-headers.mjs` states it.

Then it writes `_headers` from `scripts/demo-headers.mjs`, for
https://formancy.ai/health/, at the root of what it uploads, beside the
build and the `THIRD-PARTY-NOTICES.txt` the build wrote, and deploys
with the pinned Wrangler, with the commit in
the deployment's message. The build before it stops on a letter that is
not the bytes [`docs/release/letter.json`](docs/release/letter.json)
registers, so a machine whose Node renders other bytes deploys nothing. A
failed build leaves the last deployment serving. Its log is on the
Worker's page in Cloudflare's dashboard, and nothing in this repository
reads it.

The browser gate measures the build under the path and the headers the
deploy writes, for the gate's own address, in CI's `browser` job; it
never reads the address. After a deploy, read the build's log on the
Worker's page: Cloudflare's machine is the first to render the letter on
its Node, and a build that stopped there -- "the letter health-corpus
rendered here is not the one docs/release/letter.json registers" --
deployed nothing, the last deployment still serving. Then check what the
address serves, by hand; nothing else does:

```bash
curl -sI https://formancy.ai/health | grep -i '^location:'      # /health/, the path with its slash
curl -sI https://formancy.ai/health/ | grep -i -E '^(content-security-policy|permissions-policy|referrer-policy|x-content-type-options|x-robots-tag|cache-control):'
curl -s https://formancy.ai/health/ | grep -o '<script[^>]*>'     # one line, the build's module: src="./assets/index-….js"
curl -s https://formancy.ai/health/THIRD-PARTY-NOTICES.txt | head -1   # Third-party notices
```

The headers should be `scripts/demo-headers.mjs`'s for
https://formancy.ai/health/, each once, and the page should hold the
build's one script and no other: a second, from `/cdn-cgi/` or inline, is
one Cloudflare added, which the policy refuses to run and `no-transform`
asks it not to add. Then open the page, read the Questionnaire's read-out
and press one item's way to its field, change an answer, download each
file, open the PDF, and follow the footer's link to the notices.

By hand, from a clean checkout, with a Cloudflare login that can edit
Workers on formancy.ai's zone:

```bash
npx --yes wrangler@4.146.0 login     # once per machine
pnpm demo:deploy
```

`node scripts/demo.mjs --dry-run`, after `pnpm build`, does everything but
the upload, with no login. Agents run that, and never the deploy or the
login.

## Provenance

`npm publish --provenance` under `id-token: write` makes npm record a
[sigstore](https://www.sigstore.dev/) attestation binding each tarball to the
workflow run, the commit and the repository that built it. Anyone can check it:

```bash
npm audit signatures
```

**Requirements**: the repository is public, every manifest carries a
`repository` field matching it, and publishing happens from GitHub Actions.

## Secrets

`NPM_TOKEN` must be an Automation or Granular Access token. A classic token on
an account that enforces 2FA on writes demands a one-time password at publish
time, and the `npm-token` job checks for that beside the gates. A rehearsal
does not read it.

It is a secret of the `npm` environment, not of the repository. The two jobs
that read it, `npm-token` and `publish`, name that environment, and its
deployment policy admits only `v*` tags. So a workflow pushed to any other
branch or tag cannot read it, where a repository secret could be read by a
workflow on any branch a collaborator pushes. The environment and its policy
are repository settings ([REPO-METADATA.md](.github/REPO-METADATA.md)).
`scripts/workflows.test.mjs` holds that the jobs name the environment.
Nothing here can check that the policy is set, or the token; on 17 October
2026, read with `gh api`, the policy admits tags `v*` alone and the
environment holds no secret ([Before the first release](#before-the-first-release)).
