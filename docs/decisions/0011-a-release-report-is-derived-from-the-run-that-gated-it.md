# 0011 — Derive a release report from the run that gated the release, hold the validator gate to the registers in it, and say what it did not test; compile and run the getting-started guide in the install gate; make the SBOM of what a consumer installs; and say in the README what 0.1.0 is, what is not in it, and what it is for, in CLAUDE.md's words

- **Status:** accepted; its report reads a fifth job, `browser`, the demo's gate, and its register's areas gain `demo`, by [0012](0012-a-demo-at-formancy-ai-health-fills-a-synthetic-referral-in-the-browser-served-by-a-worker-of-its-own.md); its report reads the README pictures' check in the browser job's Chromium leg, and fails a run in which it did not walk a scene `scripts/pictures/scenes.json` gives, by [0016](0016-the-readmes-pictures-of-the-demo-are-taken-by-a-script-and-held-to-the-text-they-show.md)
- **Date:** 2026-10-17
- **Deciders:** Daniel Bacher
- **Verified by:** the `report` job in `.github/workflows/gates.yml`, which
  `ci.yml` runs on every pull request and every push to main and
  `release.yml` runs before its `check` and `publish` jobs: it builds the
  report from every other job's results and fails the run on anything in
  its problems. Not proved by a CI run as of 17 October 2026: this
  record's pull request is the first run of it on GitHub. Built on one
  machine that day from the synthetic run the tests use, and from a real
  local run (below).

  In `pnpm test:repo`, each case watched failing first, with its rule
  removed, its module absent or its file changed, and every file put back
  byte for byte, its SHA-256 compared before and after:
  - `scripts/release-report/report.test.mjs` -- a green run, local and in
    CI, has no problems, and each defect gives exactly its sentence: a
    package's results removed, a test skipped, a test failed, a file failed
    with every test passed, vitest's `success: false`, a suite of no tests,
    a test file the checkout holds that its suite did not run, results that
    do not list the checkout's test files, a file collect did not find and
    one it refused, a published package with no suite, the guards' results
    missing unless verify is allowed missing; the registers' case `verify`
    skips accounted for by the validator job's pass of it and by nothing
    else -- the validator job skipping it too, another case of the same file
    skipped, a failed case, a skip in a file the validator job does not run
    -- and allowed on a machine only with the validator allowed missing and
    only in the files the validator job runs; the install gate's record
    missing unless install is allowed missing, the gate failed, a tarball
    missing or at another version; the validator gate's file missing, a gate
    that did not pass, said with its own problems alone, one that says it
    passed with problems, judged nothing, or judged a resource otherwise
    than the corpus expects, another validator reported, another JAR,
    another register, a load other than the register, nothing recorded as
    loaded, a run not offline, and its job's run of the registers failing;
    two jobs' `dist/` differing, a tarball's `dist/` differing, a published
    package whose `dist/` no job recorded; a `heldBy` test that did not run,
    a limitations register that does not hold; a job of the gates that
    ended `failure`, a job the needs do not name, the validator job's
    artefact missing, an artefact twice, an artefact no job leaves, one
    holding another job's results, results of another run and of another
    commit; a gate's evidence file that did not run, a gate's job that
    failed, a gate's job that has no result on a machine unless that job is
    allowed missing, a partly evidenced gate whose evidence failed, a gates
    register out of order, a document stated and not failed; a tag that is
    not the root manifest's version, a version with no changelog section, a
    rehearsal with neither its version's section nor Unreleased, a body past
    125,000 characters on a release but not in CI; and a local report's
    results of two commits, of two runs, or holding one key twice. Planted
    one at a time in `results.mjs` and `problems.mjs`, each of these failed
    the tests that hold it: no skip accounted for, which failed the green
    run and every test built on it; a skip accounted for by its file alone;
    a failure accounted for; the validator's rows not read again; the
    register, the JAR and the offline run not compared; the registers' run
    not read as a suite; and the tarballs not counted.
  - `scripts/release-report/gates.test.mjs` -- the committed register
    holds; G1 to G7, `licences`, `trademark`, `rehearsal` and `legal` in
    order; at least one of evidence and a reason; no empty list of
    evidence; file evidence a test of a package with a suite or of the
    repository's guards; a job one of gates.yml's; a document committed; no
    browser gate, which Health has no page for; no `says`; a gate whose
    only evidence is a document `stated`, never `passed`; a gate with a
    reason `open` whatever its evidence, and `failed` when that evidence did
    not pass. Failed first with its module absent, and on the real register
    with G2's registers' test renamed.
  - `scripts/release-report/limitations.test.mjs` -- an entry for every
    record and a record for every entry, each read as the record stands, one
    of limitations and `none`, none for a superseded record, a known area,
    each line a non-empty one ending in a full stop -- whether it is one
    sentence is review's -- no line twice, a `heldBy` that is a test a run reports
    on, a stamp that rewrites one hash and nothing else, and `--changed` and
    `--missing` naming what the register test names. Its case on the real
    register failed until the register and this record existed, then with
    a space added to 0005's Deciders line, and with a `heldBy` pointed at a
    source file.
  - `scripts/release-report/render.test.mjs` -- each derived limitation:
    Node as each job ran it, no runtime dependency or one published as a
    range, a clean install past the suites, the packed packages run under
    Node alone or not at all, the validator the gate ran with its Java and
    what it judged, or that it did not run, the jobs that built every
    published package, each open and each stated gate; and the Markdown's
    "not measured" cells, the guards' skips with those the validator job
    passed or a machine allowed, the upstream packages with what ships, the
    tuple, the Validator section, a Status line's links made absolute, the
    method, a local run's banner and dirty mark, and the summary's counts.
    Two templates removed, the validator's and where the packages ran, each
    failed its test.
  - `scripts/release-report/collect.test.mjs` -- a test's meta and the
    coverage map left out, the `dist/` of every published package and no
    private one, each suite's test files listed from the checkout by name and
    not by its include, a turbo replay and a missing summary listed, a
    coverage summary or a turbo task of another run refused, each job's
    files read by its reader and one not found filed under it -- the
    validator's file and the registers' run under `validator` -- a job with
    no reader refused, a gate's file that records no start refused, the
    gate's path equal to `scripts/validator.mjs`'s, a stale file refused on
    a machine, and a local run reading the guards, the install gate and the
    validator gate but not the registers' run. With the module absent, then
    with the registers' run and the no-start rule each removed, and with
    the gate's path moved, each failed.
  - `scripts/release-report/tested-on.test.mjs` -- every runtime dependency
    of every published package named, today none; the upstream packages
    loaded at the versions declared, those a consumer's install brings
    marked shipped and Formancy Report's, which only health-corpus declares,
    not; the tuple the README's compatibility table states; the Node every
    workflow sets up and the tools as the catalog declares them. With the
    shipped rule loosened and the FHIR version changed, each failed.
  - `scripts/release-report/verify-publish.test.mjs`,
    `scripts/release/pins.test.mjs` and `scripts/release/publish.test.mjs`
    -- a report of another commit, run, release or version, partial, local,
    or with problems; a report directory holding another file; a tarball
    missing, of no published package, or not byte for byte the install
    gate's; a body missing or too long; a pin keyed by file name alone, so a
    file moved between the report's directory and the tarballs' passes;
    check's command line handed a report of another run, a tarball the gate
    did not install, or no body; the downloads not holding the report's
    directory to its pin; and the npm step not holding the report or each
    tarball to the install gate's record. Against main's `pins.mjs` and
    `publish.mjs`, every new case failed.
  - `scripts/workflows.test.mjs` -- gates.yml's four jobs and the report,
    the report's needs every other job and its run unless cancelled, the
    report built from every job's results with the needs and the release,
    its results downloaded into a directory each, every job's collect step
    and upload under the key collect gives, unless cancelled, one key per
    job and package, a job without a collect step or collecting as another
    refused, the validator job collecting after its run of the registers
    and naming that file; release.yml's `check` downloading the report and
    the tarballs and holding them before cdxgen runs, building no body of
    its own, `publish` downloading the report, signing it after the SBOM and
    before npm, holding it and each tarball in the npm step, attaching both
    files and their signatures, the body the report job's; and
    `continue-on-error` on the report's signing step. Each failed before the
    workflows changed, and again, in the real workflows, with the validator
    job collecting as verify, the report not waiting for the validator, the
    report's signing step renamed, and `check` holding the tarballs without
    the report.
  - `scripts/licence-status.test.mjs` -- the legal gate given evidence,
    without its reason, and missing from the register, while `LICENSE.md`
    says no lawyer has reviewed it. Failed first with the register absent,
    and with the real register's legal gate given `LICENSE.md` as evidence.
  - `scripts/release-notes.test.mjs` -- the body is the section and the
    report's summary. `scripts/validator.test.mjs` -- a gate that stopped
    leaves a file saying when it started and stopped. Each failed first.

  The getting-started guide (formancy.ai-report 0015), each guard watched
  failing with its defect put into the real file, and every file put back
  byte for byte, its SHA-256 compared:
  - `pnpm test:e2e:install`, the `install` job: `docs/getting-started.md`
    is read by `scripts/getting-started.mjs` before anything is packed, and
    its blocks are one program, `referral.ts`, in a project of its own
    that `scripts/install-hosts.mjs` plans -- the tarballs, and what the
    guide's section 1 installs beside them -- type-checked with
    `skipLibCheck` off against Node's types and run by
    `scripts/install-fixture/guide-node.ts`, which fails unless it prints
    exactly the lines the guide shows and writes `document.json` and
    `ch-orf.json`, each a document Bundle. Watched failing with an output
    line saying 5 answers where the program prints 4 ("docs/getting-started.md
    shows its program printing ... and it printed"), with `maxPages`
    written `pages` ("error TS2353: Object literal may only specify known
    properties, and 'pages' does not exist in type 'RenderOptions'"), with
    a `publisher` the Questionnaire's context does not have (TS2353 on
    `QuestionnaireContext`), and with `consume.ts` importing Report's
    runtime, which the consumer's project, holding the tarballs alone, does
    not resolve ("error TS2307: Cannot find module
    '@formancy/report-runtime'"). The guide's output was the program's on
    its first run, so the comparison was watched failing by the first plant
    and not by a guide written ahead of it.
  - `scripts/getting-started.test.mjs`, in `pnpm test:repo`, for what the
    gate cannot see: every block of code tagged (watched failing with the
    first block's tag removed: "docs/getting-started.md line 117: a ts
    block with no guide= tag, which the install gate would never compile or
    run"); the program importing only what section 1 installs (with
    `@formancy/expressions` imported); section 1 installing exactly what
    the gate installs into the guide's project, at the versions it pins
    (with `@formancy/themes@0.5.0` added, `@formancy/spec@0.4.0` pinned,
    `@formancy/spec` left out, `@formancy/health-document` left out); the
    project set up as the gate's, its `tsconfig.json` the gate's settings
    (with `exactOptionalPropertyTypes` taken out); every relative link
    landing on a file git would commit and a heading of it (with an anchor
    reworded, and a file named that is not there); the file a block goes in
    named in the prose before it (with `referral.ts` taken out of a lead);
    the guide's module in its project's type-check (with `guide` taken out
    of the include); the consumer's project holding the tarballs alone (with
    Report's runtime put in it); and no HTML comment (with one added at
    line 48). The reading's refusals are held on fixtures, written before
    the reading and failing with it absent, and two of them watched failing
    with their rule taken out of `getting-started.mjs`: the comment's and the
    indented line's.
  - `scripts/markdown.test.mjs` -- where a fence is, read once for this
    guard and the architecture's: in a list item and in a quote, closed as
    CommonMark closes one, ended by its quote, never closed, a backtick
    run that is inline code, CRLF. Failed first with the module absent,
    then with fences read at the top level alone, as the architecture's
    guard read them before: the quoted fence's cases, and the guide's
    reading of a quoted block, each failed.

  The SBOM (formancy.ai-report 0017):
  - `scripts/workflows.test.mjs` -- `check` installs no workspace and runs
    no pnpm; it makes the SBOM in a directory under `RUNNER_TEMP`, a
    `package.json` naming `formancy-health` written there, the pinned
    tarballs installed with `npm install --ignore-scripts
    --legacy-peer-deps`, then cdxgen with `--required-only` over that
    directory, writing into the workspace; it holds the SBOM to the report
    before it pins it; and its scripts, now run without an install, import
    only Node's built-ins. Each failed against the workflow as it stood, and
    again with the old step put back, with `pnpm install` put back in
    `check`, with `--ignore-scripts` taken out, and with the SBOM pinned
    without `--report`.
  - `scripts/release-report/verify-publish.test.mjs` and
    `scripts/release/pins.test.mjs` -- an SBOM refused without a published
    package at the release's version, without `@formancy/spec`, which
    health-questionnaire depends on, with another version of it than the
    suites loaded, without a runtime dependency or with another version of
    one, and when it names nothing; not asked for Formancy Report's
    packages, which only health-corpus declares; `pins.mjs sbom` pinning
    nothing it refuses, and nothing without `--report`. Failed first with
    the functions absent; then with every upstream package asked for,
    shipped or not, with a published package passed at any version, and
    with the stage holding the SBOM to its format alone.
  - **By hand, on 17 October 2026**, on Windows 11 with Node 24.21.0 and
    npm 11.19.0: the new step's commands over the four tarballs the install
    gate packed and kept gave 11 components -- the four packages at 0.1.0,
    `@formancy/spec` 0.5.0, and what it brings, ajv 8.20.0, its four
    dependencies and `@noble/hashes` 2.4.0 -- which `pins.mjs sbom`
    accepted against a report of that machine's run. The old step, cdxgen
    over this checkout, gave 10: four of Formancy Report's packages,
    `@formancy/expressions`, `@formancy/spec`, TypeScript 6.0.3 and
    5.6.1-rc, vitest and yaml, and none of the four packages; `pins.mjs
    sbom` refused it, one sentence for each package missing.

  The README (plan H08's last part):
  - `scripts/readme.test.mjs`, in `pnpm test:repo` -- the README's
    `Intended purpose` section holding, word for word, the one sentence of
    CLAUDE.md's first section that names a medical device, read from
    CLAUDE.md, whitespace flattened; that sentence as CLAUDE.md says it
    today; a fixture's sentence found however its lines break, and not
    with "is not a medical device" for "is not intended as a medical
    device", a semicolon for a comma, or the sentence in the Status alone;
    no such sentence or two in CLAUDE.md, no `Intended purpose` heading or
    two in the README, refused rather than guessed; the section read to the
    next heading of its level, past its own sub-headings, with fences
    blanked; and every relative link of the README landing on a file git
    would commit and on a heading of it, the guide, `docs/release/`,
    `LICENSE.md`, `NOTICE` and `RELEASING.md` among them. Failed first with
    the README holding no `Intended purpose` section, then on the README's
    link to RELEASING.md's `Before the first release` before that section
    was written. Planted one at a time in the real files: "is not a
    medical device" in the README, "meant as" for "intended as" in
    CLAUDE.md, the README's heading taken out, an anchor reworded, and
    every link to the guide made absolute, each failing its case; and in
    the guard's reading, lines compared unflattened, a section cut at any
    heading, the first of two sentences taken, and fences read as text,
    each failing its fixture.
  - `scripts/trademark.test.mjs`, passing on the new README: HL7's notice
    stands in it word for word, and its first heading holds no mark.

  The revert round, once every part of H08 was in: each guard H08 added
  watched failing again with one defect planted in the real file it holds,
  every file put back byte for byte and its SHA-256 compared, and every
  file git would commit hashed before and after the round. The limitations
  register, with a space after 0008's Deciders and with the README's line
  held by a source file; the gates register, with G3's evidence renamed,
  and with the legal gate given evidence, which `licence-status.test.mjs`
  refuses too; the report, with every skip accounted for in `results.mjs`;
  collect, with a file that records no start read as fresh; render, with
  where the packages ran dropped from its sentence; tested-on, with every
  upstream package marked shipped; the SBOM's check, with a published
  package passed at any version in `verify-publish.mjs`, and with the
  `sbom` stage of `pins.mjs` holding the format alone; publish, with the
  report not held; the release body, with the report's summary dropped;
  the validator's stopped results, with their start dropped; the
  workflows, with the SBOM's install running lifecycle scripts, and with
  the report not waiting for the validator; the guide's guard, with
  `@formancy/spec` pinned at 0.4.0 in section 1, and with an output
  block's tag taken off; the Markdown reading, with fences in quotes not
  read; the architecture's guard, with section 10's link to
  `readme.test.mjs` renamed, and with 01's anchor into the README
  reworded; the trademark guard, with a letter of HL7's notice gone from
  the README; and the install gate, with the guide showing five items
  where its program prints four ("docs/getting-started.md shows its
  program printing ... and it printed").

  After three reviews of that build, the same day, each new case written
  first and watched failing against the code as it stood -- all but the
  trademark guard's, which holds a walk that was right -- then watched
  failing again with its defect planted in the real file and the file put
  back byte for byte, every file git would commit hashed before and after:
  - `report.test.mjs` -- the install gate held to the projects
    `scripts/install-hosts.mjs` plans, as `installPlanOf` reads them: a
    project with no record, one the plan does not name, one recorded
    twice, one whose npm install or a step did not finish, one that ran
    other steps or none, the guide's blocks given to no project or to the
    consumer's, each with `passed` left true; the synthetic plan held to the
    real one. A row the validator gate marked as expected and whose own
    counts say otherwise -- an accepted resource with errors, with an
    unregistered warning, refused for something, a broken one refused for
    other issues than the corpus expects. The install record, the gate's
    file and the registers' run found in another job's results: not read,
    and a problem. Planted: the plan's check dropped, the job ignored, the
    row's counts not read.
  - `render.test.mjs` -- Tested on shows a consumer's clean install from
    the project that holds the tarballs alone and the guide's project in a
    column of its own, so Formancy Report's packages are never shown as a
    consumer's; the install gate's projects in a table, with what the
    guide's run said. Planted: every project read as a consumer's, and
    "one plain npm project" typed back.
  - `collect.test.mjs` -- on a machine, guards that started before the
    validator gate finished are refused as another run's. Planted: the
    check skipped.
  - `scripts/validator.test.mjs` -- what the gate records of its offline
    run is read from the command line it spawns (`offlineOf`), so a line
    without `-no-http-access`, or naming a terminology server, records
    that. Planted: the record a constant again. The JAR's SHA-256 and the
    packages laid out are measured in `main`, which only a run shows (below).
  - `verify-publish.test.mjs`, `scripts/release/pins.test.mjs` and
    `scripts/workflows.test.mjs` -- the SBOM held to npm's lockfile of the
    install it describes: a component that install does not hold, one it
    holds and leaves out, one with no npm package URL, and an install of
    nothing are refused; `pins.mjs sbom` needs `--installed`; `check` passes
    the lockfile of the directory its SBOM step installs into. Planted: the
    check returning nothing, and `--installed` taken out of `release.yml`.
  - `gates.test.mjs` -- G1 open with its reason beside its evidence.
    Planted: the reason taken out of `docs/release/gates.json`.
  - `scripts/getting-started.test.mjs` -- every application install line
    saves exactly; the reading reads `--save-exact`, and refuses two flags.
    Planted: one install line of the guide without it.
  - `scripts/trademark.test.mjs` -- the guard on the guard names all four
    published READMEs. Planted: a walk that skips health-questionnaire,
    which the case as it stood, naming three, would have let through.
  - The install gate, `node scripts/install-test.mjs`: the guide's first
    line reads the languages from the Questionnaire's translations, and
    with the form's `languages: ['fr']` taken out the gate failed
    ("docs/getting-started.md shows its program printing ... and it
    printed"), where the line as it stood typed "and fr" and would have
    printed it all the same.

  **Not mechanically enforced, and said:** that a gate's evidence is the
  right evidence for it, and that a register line is a fair summary of its
  record and still true -- each held by review, and a line can outlive its
  truth until its record changes; that `scripts/install-test.mjs` and
  `scripts/validator.mjs` write what the report reads, which only a run of
  each shows, though collect refuses the validator's file when it records
  no start; that a test is in a file named as vitest names one, which is
  what a test file is known by here; the guide's prose where no code is
  under it, and that the resources its program writes conform, which the
  validator gate says of its own corpus and not of them; that the SBOM's
  closure beyond the packages the report names is what a consumer would
  resolve on another day; and everything the publish job does, which had
  not run by 17 October 2026, and the SBOM step, which had run on one
  machine and not on a runner by then; that the README's purpose describes what the packages do, that
  no other page claims a clinical purpose, and that nothing shipped
  computes a clinical result; the Status's facts, which are one day's; and
  the settings RELEASING.md read with `gh api`, which nothing reads again.

## Context

Plan H08 asks for the release report and its registers before 0.1.0, as
Formancy Report built them for its first release
([formancy.ai-report 0014](https://github.com/sharkysan/formancy.ai-report/blob/main/docs/decisions/0014-a-release-report-is-derived-from-the-run-that-gated-it.md),
which is [formancy.ai-data 0035](https://github.com/sharkysan/formancy.ai-data/blob/main/docs/decisions/0035-a-release-report-is-derived-from-the-run-that-gated-it.md)'s),
with a gates register seeded from the plan's release gates and a
limitations register with an entry per decision record. Before this:

- `release.yml` ran the gates, checked the tarballs, built the release body
  from the changelog in `check`, made an SBOM, pinned what it checked, and
  published only what was pinned. Nothing said which versions a release was
  tested with, or which gates it had passed.
- The install gate already wrote `test-results/install.json` -- each
  tarball's sha256 and `dist/` hash -- every suite its
  `test-results/vitest.json`, and the validator gate its results, for a
  report that did not exist yet ([0005](0005-a-fhir-resource-is-proved-by-the-hl7-validator-against-pinned-guide-packages.md)).
- The README's compatibility table already derived the tuple the packages
  are built and judged against, from the registers, health-core's
  `FHIR_VERSION` and the toolchain (`scripts/compatibility.mjs`).
- The limitations the records state were spread across their cost
  paragraphs, none of them where a customer would look; 0010 noted the
  register this repository did not have.
- `pnpm test:repo` in `verify` skips six cases of
  `scripts/validator/registers.test.mjs`, by design: they read the
  validator's downloads and its run, which `verify` has not got, and the
  `validator` job runs the file again after the gate, where none may skip
  (0005). Report's rule -- a skipped test fails the run -- would fail every
  run here.

Report's report has a browser gate, README pictures and install hosts at
both ends of its builders' peer ranges; Health has no page and one kind of
host, Node. What Health has, Report does not: the validator gate, whose
verdict is the conformance claim.

H08 asks for two more things Report built for its first release: a
getting-started guide whose code the install gate compiles and runs
([formancy.ai-report 0015](https://github.com/sharkysan/formancy.ai-report/blob/main/docs/decisions/0015-the-getting-started-guide-is-compiled-and-run-by-the-install-gate.md)),
and an SBOM of what a consumer installs
([formancy.ai-report 0017](https://github.com/sharkysan/formancy.ai-report/blob/main/docs/decisions/0017-the-sbom-describes-what-a-consumer-installs.md)).
Before this record:

- There was no guide. The package READMEs' examples are prose that nothing
  compiles, and `consume.ts`, which the install gate runs, is a test, not a
  program a reader would write.
- The install gate ran one project, holding the tarballs alone, with
  `strict` and nothing stricter. A guide whose program renders its PDF
  with Formancy Report needs Report's runtime and renderer installed, and
  with them `@formancy/expressions` and pdfmake; in the consumer's project
  those would resolve, and a package's import of one it never declared
  would pass -- Report's reason, in 0015, for giving its guide's React
  page a host of its own.
- The SBOM was cdxgen's reading of the checkout, after a `pnpm install` in
  `check`. Run on this checkout on 17 October 2026 it named ten
  components: four of Formancy Report's packages, which only the private
  health-corpus declares, `@formancy/expressions`, `@formancy/spec`,
  TypeScript twice, one of them a release candidate, vitest and yaml; and
  none of the four packages a release publishes, nor ajv, which
  `@formancy/spec` brings to every consumer. Report's v0.1.0 tag was
  refused for an SBOM made the same way.
- Report's gate and guard read its guide with marked's lexer. No Markdown
  parser is a dependency of this workspace's scripts; the architecture's
  guard read Markdown line by line, fences at the top level alone, with an
  anchor rule of its own.

H08's last part is the README, with its status, its scope, what is not in
0.1.0, its intended purpose and HL7's notice. Before it:

- The README's Status said Health was started on 16 October 2026 and
  nothing released, and ended "Next is the readiness of a first developer
  preview". What was planned was one sentence of its Packages section, and
  nothing said what 0.1.0 is.
- No file stated an intended purpose. CLAUDE.md says the product "is not
  intended as a medical device", and arc42's introduction and the guide say
  it in their own words; the plan asks the README to state the purpose,
  and a lawyer to confirm its wording before the paid release. Nothing
  compared any of them.
- HL7's notice stood in the README, word for word, held by
  `scripts/trademark.test.mjs` (0003).
- No guard read the README's links. The architecture's guard reads
  `docs/README.md` and the sections, the guide's guard the guide.
- RELEASING.md said, of 16 October 2026, that the npm token was not set,
  and nowhere what the maintainer sets before the first release.

## Decision

The gates workflow's every job collects what it found into one results
file and uploads it, and its last job builds the release report from all of
them and fails the run on its problems. The report is a build output of
that run, never a committed document: a CI artefact and job summary on every
pull request, and, on a release, an asset signed by the workflow that ran
the gates, as in formancy.ai-report 0014.

- **Four readers.** `scripts/release-report/collect.mjs` reads `verify`'s
  guards, each `test` job's suite with its coverage and turbo's own timing,
  `install`'s record, and `validator`'s two files: the gate's results and
  the job's run of the registers' test after it. A job gates.yml gains is
  refused until it has a reader, and a results file that records no start
  is refused as no run's. The install record and the validator's files are
  read only from the job that leaves them; found in another job's results,
  each is a problem. On a machine, guards that started before the gate
  finished are another run's.
- **A skip is accounted for by a pass, test by test.** A test skipped in a
  suite is no problem only when the validator job's run passed the same
  test of the same file; any other skip fails the run, as in Report. On a
  machine that did not run the validator, a report that allows it missing
  allows the skips of the files the validator job's step names, read from
  gates.yml, and says so in its banner. A failed test is never accounted
  for.
- **The validator gate, held to the checkout.** The gate's file records
  what the run used, measured as it ran: the offline options read from the
  command line it spawned, the SHA-256 of the JAR it ran, and the packages
  laid out in the validator's cache. The report reads that file whatever
  its `passed` says, and holds it again: it judged something, every
  resource as the corpus expects -- by the gate's verdict and by each row's
  own counts -- the validator version and JAR `docs/release/validator.json`
  pins, the register `docs/release/ig-packages.json` holds, exactly what
  the validator loaded, offline. A gate that did not pass is said with its
  own problems.
- **The install gate, held to its plan.** Every project
  `scripts/install-hosts.mjs` plans has a record and no other does, each
  ran exactly its planned steps to the end, and the guide's blocks went to
  the project the plan gives them to; the gate's own `passed` is not
  rested on, as formancy.ai-report 0014 does not rest on its hosts'.
- **Tested on** is the run's: the published packages' runtime dependencies
  (none today), upstream `@formancy/*` with what a consumer's install
  brings marked shipped -- a consumer's install being the project of the
  tarballs alone, and the guide's project shown in a column of its own --
  Node as each job ran it, npm, pnpm and the tools,
  and the tuple, read through `scripts/compatibility.mjs` so the README's
  table and the report cannot say two things of it, beside the validator
  and the Java the gate ran.
- **Results, build identity, gates, limitations** as in Report: each suite
  held to every test file the checkout holds for it; each tarball's built
  files against every job's `dist/`; the gates of `docs/release/gates.json`
  -- the plan's G1 to G7, 0.1.0's dependency-licence guard, trademark guard
  and rehearsal, and the legal review -- each passed, stated, open or
  failed and never met; and the limitations the run shows, then those of
  `docs/release/limitations.json`, held to the records by hash.
- **A release.** `check` holds the report to this run, green and whole,
  each tarball to the install gate's record in it, and the body the report
  job built, and pins them before cdxgen runs; `publish` refuses a
  download that is not what was pinned, or a report that is not this
  run's, signs the report beside the SBOM, and attaches both with their
  signatures. The body is the version's changelog section and the report's
  summary.
- **The getting-started guide is compiled and run by the install gate**, as
  formancy.ai-report 0015 has Report's, for one kind of host.
  `docs/getting-started.md` takes a Node application from an empty npm
  project to a Questionnaire of a formancy form, a QuestionnaireResponse of
  a submission, a document Bundle carrying a PDF Formancy Report rendered,
  and a CH ORF document, from synthetic data. Every block of code names its
  host in its info string, `ts guide=node`, and one reading,
  `scripts/getting-started.mjs`, serves the gate and the guard: a block the
  gate would not run is refused with its line, and so is what the reading
  cannot tell from code -- an HTML comment, a line indented as code. The
  gate writes the blocks, in order, into a project of their own, `guide`:
  the tarballs and what section 1 installs beside them, `@formancy/spec` at
  the release health-questionnaire reads forms through and Report's runtime
  and renderer at the release health-corpus renders with, each read from
  those manifests. It is type-checked there with `skipLibCheck` off and
  run, and its output is compared exactly with the guide's. The consumer's
  project keeps the tarballs alone; both are checked under one strict
  tsconfig, the one the guide shows, exact optional properties and checked
  indices included. What the gate cannot see, `scripts/getting-started.test.mjs`
  holds: no block escapes the reading, the program imports what section 1
  installs, section 1 installs exactly what the gate installs at the
  versions it pins, and every link lands. Where a fence is and the anchor a
  heading gets are read once, in `scripts/markdown.mjs`, for this guard
  and the architecture's.
- **The SBOM describes what a consumer installs**, as formancy.ai-report
  0017 has Report's. `check` installs no workspace. It writes a
  `package.json` naming `formancy-health` at the release's version in a
  directory under `RUNNER_TEMP`, installs the tarballs it pinned there with
  `npm install --ignore-scripts --legacy-peer-deps`, and runs cdxgen
  12.8.4 with `--required-only` over it. `pins.mjs sbom --report` holds
  the SBOM to the report before pinning it: every package this release
  publishes at its version, every runtime dependency and every upstream
  package the report marks shipped -- `@formancy/spec` -- and each package
  the report names at the version the suites loaded. Report's packages,
  which only health-corpus declares, are not asked of it. `--installed`
  holds it to npm's lockfile of the same install: no component that
  install does not hold, and none it holds left out.
- **The README says what 0.1.0 is, what is not in it, and what it is
  for.** Its Status is dated, and says 0.1.0 is ready to tag and not
  released, what has not run on GitHub and what is left to the maintainer.
  `What 0.1.0 is` says whom it is for, what it publishes and depends on,
  and the gates `docs/release/gates.json` holds it to; `Not in 0.1.0`
  lists what the plan leaves out of it; `Intended purpose` says what it
  converts and assembles, for whom, and holds CLAUDE.md's sentence -- "It
  is not an EHR, a FHIR server or a terminology service, and it is not
  intended as a medical device." -- word for word, with the customer's duty
  for a product that computes a clinical result from its own forms.
  `scripts/readme.test.mjs` reads that sentence from CLAUDE.md and holds the
  README's section to it, and holds every relative link of the README, and
  the heading it names, through `scripts/markdown.mjs`. RELEASING.md says
  what the maintainer sets before the first release, each as read with
  `gh api` on the day it names.

## Consequences

**What it buys.**
- **A release names what it was tested on, from the run that tested it**,
  and what its validator judged, against what.
- **npm receives what the gates installed and ran**, and the report shows
  each tarball's built files equal to the `dist/` every job built.
- **The validator's skips are neither ignored nor fatal.** Each case
  `verify` skips is shown passed in the validator job, by name, and one that
  ran nowhere fails the run.
- **A gate is said, never assumed**, and a changed record cannot leave a
  stale limitation unread.
- **The report is derivable on one machine**, from a synthetic run or from
  that machine's own.
- **A guide that is the packed packages' as a reader installs them.** An
  option renamed, an export moved, a context member taken away or a
  refusal reworded fails the install job, in the project the guide's
  code is for, and section 1's install lines are held to the code and to
  the gate.
- **An SBOM that describes the artefact**: the four packages at the
  release's version and what their install brings, and no tool this
  repository tests with; and a check that a correct SBOM passes and the old
  one does not.

**What it costs.** Measured on 17 October 2026 on the machine 0005 names
(Intel Core i9-10900K, 32 GB, Windows 11), with Node 24.21.0, not on CI,
over that machine's results of the validator gate, the repository's guards
run with `VALIDATOR_GATE_RAN` after it, every package's suite and the
install gate, timed with the shell's clock three times each: collecting
them took 393, 616 and 470 ms, and building the report from them 777, 772
and 775 ms, `pnpm`'s and TypeScript's loading included; the collected
results were 371,749 bytes, the report's JSON 90,898 bytes and its Markdown
68,482 bytes; and the body built from the Unreleased section, this
change's entry in it, to be measured only, was 35,444 characters of
GitHub's 125,000, and 41,984 once the README's entry and the opening of
0.1.0's section were in it. Building the report from the synthetic run took 7.7 and
8.0 ms, the first build in each of two processes. That report allowed
verify, install and validator missing, which a machine must for the gates
that rest on those jobs, and found no problem. The validator gate of that
run, its package cache unpacked fresh, took 4 minutes 22 seconds, 111.4 of
them the validator's, on Java 25.0.4.1. The report job's wall time on CI,
the artefacts' sizes there and the seconds each collect step adds are not
measured yet; the job's limit is verify's fifteen minutes, whose install it
shares, until three green runs give a slowest time to triple.

After review, the same day and machine, a whole local run again, each
step timed once with the shell's clock: the validator gate, its package
cache kept, 6 min 11.7 s, 369 s of them the validator's, recording its
offline options, the JAR's hash and the 22 packages of its cache as
measured; every package's suite, fresh, 8.8 s by turbo's clock; the
install gate with `--keep-tarballs`, 47.0 s; collecting 0.41 s and
building the report 0.71 s. The report, again allowing verify, install
and validator missing, found no problem once the register was stamped; it
had found 0011 changed since its stamp, and the guards' failure on it,
first, as it should. The release body, built from the Unreleased section
to be measured only, was 44,052 characters. The SBOM step's commands,
run by hand as `release.yml` runs them over the tarballs that install
gate kept, gave 11 components in cdxgen's 26.1 s, which `pins.mjs sbom
--report --installed` accepted against that report and npm's lockfile of
the install.

Every new record needs a register entry, and any edit to a record, a typo
included, needs a re-read and a stamp; the fence detects change, not
meaning, and a rubber-stamped hash passes. A job added to gates.yml needs a
collect step and a reader in `collect.mjs`, or the job fails. Every file
named as vitest names a test must run in the suite of the package it is in,
or in the guards' when it is in none, so a local report after one file run
alone fails, by design. On a machine the root `test-results/vitest.json` is
the guards' and the validator job's run of the registers' test has no file
of its own, so a local report accounts for the registers' skips only when
the guards ran with `VALIDATOR_GATE_RAN` after the gate, in which nothing
skips, or allows the validator missing. A local report cannot pass a gate
that rests on a job, because a job's result is the gates run's `needs`; it
says so, and allows the job missing only when asked, in its banner.

The install gate is held to its plan: the report imports
`scripts/install-hosts.mjs`, so a manifest that no longer declares an
exact `@formancy/spec` or Report package stops the report job with the
same error that stops the install job, and the job writes no report. A
project the plan adds is a project the report expects. The gate records,
per project, the `@formancy/*` packages its clean install resolved, and
no third-party runtime dependency, of which no published package has one;
one added later is "not reported" until the gate records it. A
consumer's clean install, in Tested on, is the projects that build no
part of the guide, the tarballs alone; were a consumer's host ever to
install a peer beside them, as Report's builders' hosts do, that reading
would want looking at again.

The validator gate's file now records what the run used, measured: the
offline options from the command line it spawned, the JAR's SHA-256 --
hashed once more before the run: 0.81, 0.78 and 0.75 s for its 204,412,235
bytes on the machine above, by `sha256File` alone, on 17 October 2026 --
and the packages in the validator's cache, read from its
directory. In CI the register check compares a cache laid out from the
same commit's register, so it fails only on a gate that laid out other
packages than it read; on a machine it also fails on a register edited
after the gate ran. That `main` writes those values is shown by a run of
the gate, not by a test: `offlineOf` alone is.

**The guide's project.** On the machine above, npm's cache warm, by `time`
three runs each: the gate as it stood took 10.8, 11.1 and 11.7 s over
`node scripts/install-test.mjs`; with the guide's project, 24.3 to 25.0 s
over `pnpm test:e2e:install`, and 26.8, 39.3 and 114.5 s over `node
scripts/install-test.mjs`, the waits on the registry varying run to run;
later that day, once the README was in, 63.7 s with a guide line planted
wrong and 207.2 s over `pnpm test:e2e:install`, against the job's fifteen
minutes. The guide's project installs Report's runtime and renderer, and pdfmake and
what it brings, from the registry and unlocked, as the tools already are;
nothing compares what they resolve to with what health-corpus's suite
loaded but the report's Tested on, which prints both. A message changed in
a package changes the guide: its output blocks quote the refusals' rules,
paths and two of their messages, so the gate fails until the guide shows
the new one, which is the point and still an edit. The guide's program is
run, not judged: the validator gate's claim is about its corpus, made by
the same packages of other synthetic input, and the guide says so. The
consumer's project is now checked with exact optional properties and
checked indices too, which `consume.ts` passed unchanged; a declaration
that holds only under looser settings now fails there.

**The reading.** Without a Markdown parser, the guide's reading refuses
what it cannot tell apart rather than guessing: any HTML comment, and any
line indented four columns after a blank line, which on GitHub is an
indented code block or a list's paragraph. The guide is written around
both. A fence in a list item is read to its closing fence, where GitHub
ends it at a line indented less than the item; such a line would be
compiled, and fail the gate. The architecture's guard reads fences as the
guide's does now -- in a quote and at any indentation -- which blanks a
little more of the sections than before: a link or a path inside a fence in
a quote or a list is no longer read, which is GitHub's reading.

**The SBOM.** Its closure beyond the report's packages -- ajv and what
`@formancy/spec` brings with it -- is the one npm resolved during the run,
unlocked, as cdxgen's own dependencies are; the check holds the published
packages, the runtime dependencies and the upstream packages to the report,
and every component to npm's lockfile of the install it was read from, so
nothing that install does not hold is named and nothing it holds is left
out -- what it cannot say is that the closure npm resolved that day is the
one a consumer resolves on another. It names no peer, of which no
published package has one. Its top-level component is `formancy-health`,
the root manifest's private name, as Report's is `formancy-report`: an
unscoped npm name nobody here has published, which a package URL resolves
to whatever npm holds under it. The step adds an npm install of four
tarballs and their closure, 3.8 s by hand, and cdxgen's 21.6 s, on the
machine above; on a runner it had not run by 17 October 2026. The published
packages' ranges accept versions no run tested -- `@formancy/spec` is
exact, Node and TypeScript are not -- and nothing in the product refuses an
untested version: tested on is not accepted by. A package's own suites run
its source, not its `dist/`; only the install gate runs the tarballs, and
only under Node.

**The README.** A reader finds what 0.1.0 is for and what it lacks before
the packages, and the purpose is one sentence in two files that cannot
part unnoticed. In exchange CLAUDE.md's sentence is load-bearing twice:
rewording it fails `pnpm test:repo` until the README says the same, and a
second sentence naming a medical device in CLAUDE.md's first section stops
the guard until one is chosen. The guard holds one sentence of one file:
the guide, the architecture and the package READMEs say the same in their
own words, which review holds, and so it holds that no page claims a
clinical purpose, a negative no reading of words can prove. Under the MDR
and the MepV a device's intended purpose is what its maker says of it
everywhere, labels and promotional material included; this holds one
paragraph of that, worded as the maintainer read the plan, and no lawyer
has read it. The Status is one day's, and its facts -- nothing on npm,
no tag, a report of one machine's runs finding no problem with the three
jobs' results allowed missing, as a machine must -- go stale with the first
run, the first secret and the tag, with nothing failing when they do; so
does RELEASING.md's table of settings. On that machine `pnpm check:pkg`
stopped before it checked anything: publint packs with `pnpm pack`, and the
pnpm it reached under corepack, 12.14.0 by its own message, refused the
project's 12.4.2 (`ERR_PNPM_BAD_PM_VERSION`). Run by hand in each published
package, `publint --pack npm` said "All good!" and `attw --pack . --profile
esm-only` exited 0, for all four; CI's `verify` runs `check:pkg` as it
stands. The guard's file took 924 ms, 788
ms and 1.59 s under vitest on the machine above, its case over the links
227 to 421 ms of that, most of it git listing the files twice.

**What only GitHub can show, and had not by 17 October 2026.** The first pull request run:
that `toJSON(needs)` in a reusable workflow gives the test matrix's one
aggregate result, that the download puts each artefact in a directory of
its own, that the validator job's root `test-results/vitest.json` is the
registers' run, and that separate runners build byte-identical `dist/` for
each published package, which only one machine's builds have shown. A
rehearsal: that `check` can download the report and the tarballs, that the
SBOM step's commands run on a runner as they ran by hand, and that its
outputs reach `publish`. The first tag: everything `publish` does.

**Not held by anything:** that the open reasons of G1 and G4 to G7, the rehearsal
and the legal review are still true; the `npm` environment's deployment
policy, which is the repository's setting; and whether "Verified by" paths
resolve.

**What it forecloses:** publishing on evidence another workflow produced;
publishing bytes no gate installed; a skip excused by a file's name; and a
release body, a tuple of tested versions or a report typed by hand.

## Alternatives considered

- **A committed per-version report.** It cannot hold its own run's results,
  and a typed copy of a CI log is the drift this repository forbids
  (formancy.ai-report 0014's reason, which is formancy.ai-data 0035's).
- **The tagged commit's CI artefacts.** The release would publish on
  evidence it did not produce, from a run that may have expired or never
  happened.
- **Report's rule as it stands: a skip fails the run.** Every run would fail
  on the six cases `verify` cannot read, so the rule would be switched off,
  or `verify` would need the validator's downloads and Java, which is the
  validator job.
- **Skips excused by file name**, every skip of registers.test.mjs allowed.
  A case added there that nothing runs would pass unseen, and so would a
  validator job that skipped the same cases.
- **The validator gate held to its own `passed`.** One flag its writer
  sets; a run against another register, or one that judged nothing, would
  be printed as a pass. The report reads the rows and the registers again.
- **A tested-with block of the report's own in the README**, as Report's
  `readme.mjs` writes. Health's README already derives the tuple; a second
  block would be a second reading of the same facts. The report reads the
  one that exists.
- **Porting Report's browser and pictures sections.** Each would be a
  section with nothing to show, and a report that prints empty tables
  reads as one that checked something. Its install hosts are ported as the
  gate's projects, with no peer range to hold them to.
- **The install gate held to its own `passed`**, as this record's first
  build held it. A gate that dropped the guide's project, or ran no step
  of one, would still say passed; the plan is one import away.
- **The validator gate's record copied from the registers**, as it was. The
  report's checks of the offline run, the JAR and the register would then
  compare a file with the file it was copied from, and pass whatever ran.
- **The SBOM held to the report alone.** It says what the SBOM must name
  and not what it must not, so an SBOM that named the workbench beside the
  packages, the defect behind formancy.ai-report 0017, would pass.
- **The SBOM's top-level component under a scoped name**, which nobody
  but the scope's owner can publish. It would name a package that does not
  exist under a scope that does, where `formancy-health` is the root
  manifest's own name and Report's SBOM does the same; whether either
  moves is the maintainer's to say, and nothing here depends on it.
- **The plan's gate sentences in the register.** The plan is a working
  document kept out of the repository; the report prints the gate's id with
  its evidence, and a `says` key fails the register's guard.
- **The guide's program in the consumer's project.** One install fewer,
  and Report's packages, `@formancy/expressions` and pdfmake would resolve
  where `consume.ts` checks that each package resolves only what it
  declares; formancy.ai-report 0015's reason for its React page's host.
- **A guide that attaches a PDF read from a file**, with no Report. It
  would need a PDF the gate supplies and a reader does not have, and the
  product's case is a PDF Report rendered; the guide says that a host with
  its own PDF needs neither of Report's packages.
- **The guide read with a Markdown parser**, as Report's is with marked's
  lexer. None is a dependency of the workspace's scripts; the line reading
  the architecture's guard already had reads fences in lists and quotes
  now, and refuses the two shapes it cannot tell from code.
- **Examples in the package READMEs compiled instead.** They are
  fragments by design -- `form`, `send` and `log` are the reader's -- and
  compiling them would mean writing what they leave out around each.
- **The SBOM kept on the workspace, held to the report.** It would be
  refused at the first rehearsal: the workspace names none of the packages
  a release publishes, only links to them, and names its test tools as
  required.
- **The plan's wording of the intended purpose**, not intended for the
  diagnosis, prevention, monitoring, prediction, prognosis, treatment or
  alleviation of disease, the MDR's own list. It says more than CLAUDE.md,
  which every change is held to, and a lawyer is to confirm the words
  before the paid release; the README holds CLAUDE.md's until then.
- **The intended purpose in every published package's README too**, as
  HL7's notice is. npm's page of each would carry it, and each would be
  one more copy of words no lawyer has read, to change with them; the plan
  asks for it in the README.
- **A guard that refuses a clinical claim in any file**, as the trademark
  guard refuses a claim of HL7's permission. A clinical purpose has no
  fixed shape -- "helps triage", "flags a risk" -- so a list of phrases
  would pass the next one and refuse a sentence saying none is made.
- **The Status's facts derived**, the version from the manifests and "not
  released" from the changelog. It is dated prose of one day, as CLAUDE.md
  asks of it, and the release rewrites every sentence a guard would hold.
- **CHANGELOG.md's Unreleased renamed to 0.1.0 now**, as Formancy Report's
  readiness did. The heading carries the release's date, which is the
  tag's; the section opens as the release's will, and the rename is
  RELEASING.md's second step, which a tag without it fails in the report
  job.

## Older records

None is superseded. [0005](0005-a-fhir-resource-is-proved-by-the-hl7-validator-against-pinned-guide-packages.md)'s
results are now read by the report, timed, and record what the run used,
and its skipped cases are accounted for there, which its Status line now
says; [0001](0001-a-paid-module-in-its-own-repository.md)'s legal review
and [0003](0003-the-product-name-carries-no-hl7-mark.md)'s trademark review
are the register's `legal` gate, which `scripts/licence-status.test.mjs`
keeps open while `LICENSE.md` says no lawyer has reviewed it.
[0010](0010-the-architecture-is-documented-in-arc42s-sections-held-to-the-repository-by-a-guard.md)'s
guard reads Markdown through `scripts/markdown.mjs` now, the guide's
guard's reading, and reads fences in quotes and at any indentation as
GitHub does; what it holds is unchanged, and its Status line says so.
