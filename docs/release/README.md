# What a release is judged against, and the report it carries

Two kinds of register live here. Those a conformance claim rests on
([0005](../decisions/0005-a-fhir-resource-is-proved-by-the-hl7-validator-against-pinned-guide-packages.md)),
which the validator gate runs on, the letter's bytes among them, and those
the release report reads
([0011](../decisions/0011-a-release-report-is-derived-from-the-run-that-gated-it.md),
as formancy.ai-report 0014 has them). Every one is held by `pnpm test:repo`.

## The validator's registers

Each is read by the validator gate, `scripts/validator.mjs`, by
`scripts/compatibility.mjs`, which renders the README's compatibility
table from them, and by the release report, which holds the gate's verdict
to them.

- **[`validator.json`](validator.json)**: the HL7 FHIR validator the gate
  runs, one release's `validator_cli.jar`, by its version, the address of
  the asset, its SHA-256, its size, and the Java it needs.
- **[`ig-packages.json`](ig-packages.json)**: every FHIR package the
  validator loads, by exact version, with packages.fhir.org's address for
  it, its SHA-256, its canonical and its licence as its package.json
  states them, and which registered packages declare it.

Each file's `$comment` says what its fields mean. A download that is not
the registered bytes is refused before anything runs it; a run that loads
a package the register does not name, or does not load one it names, fails
the gate.

### Moving a pin

A new validator release or a guide version is a commit that changes the
register, with a CHANGELOG line saying why, and goes through the gate:

1. Run the new validator once, online, into an empty cache, with the
   guides the gate asks for, and read its `Package Summary`: that list,
   and nothing typed from a guide's page, is what the register holds.
2. Take each package's SHA-256 from the bytes packages.fhir.org serves,
   and its `canonical`, `licence` and dependencies from its own
   package.json; `declaredBy` is every registered package that declares it.
3. Run `node scripts/validator.mjs`, then `node scripts/compatibility.mjs
   --write`. The validator job runs `scripts/validator/registers.test.mjs`
   against what it downloaded, which fails when a field says other than
   the package does.

A guide in ballot is never chosen. A ballot a released guide declares is
registered all the same, because the guide depends on it: SDC 4.0.0 and
CH Core 6.0.0 declare a ballot of the R4 extensions pack. The register's
check refuses a prerelease the gate asks for, and one no registered
package declares.

A manifest may declare a range, as CH Core 6.0.0 declares CH Term
`3.3.x`; the register pins the one release of it the validator loads,
with a note naming the range, and the registers' test fails on a range
it does not read, or two releases one range admits.

A licence the dependency policy refuses is a decision's to admit, for one
entry at its exact version, never a field's: 0009 admits CC-BY-4.0 for
`ihe.formatcode.fhir#1.4.0`, which CH Term declares and the gate only
downloads (`ADMITTED_LICENCES` in `scripts/validator/registers.mjs`).

Held by `scripts/validator/registers.test.mjs`, in `pnpm test:repo` and,
against the downloads and the run, in the validator job.

### The letter's bytes

**[`letter.json`](letter.json)** registers the referral letter's PDF,
which health-corpus renders with Formancy Report, by its size and SHA-256,
and the Report releases that rendered it. It is the PDF the corpus's
document Bundles carry and the one the demo's build carries into its page,
and each renders it on a machine of its own: the gate on GitHub's runner,
the demo's build on Cloudflare's, both through Report's renderer and the
zlib of that machine's Node. So both take it through
`scripts/validator/letter.mjs`, which refuses a render of other bytes:
the gate stops before it writes the corpus, and the build before it writes
a page, rather than one PDF being judged and another served. A new Report
release or a changed letter is measured where the gate runs and registered
in a commit of its own. Held by `scripts/validator/letter.test.mjs`, in
`pnpm test:repo`, which also renders the letter on its own machine and
holds `renderedBy` to health-corpus's manifest.

## The release report

Every run of the gates ends in a report of what that run was tested on and
what it found. It is a build output of the run, never a committed
document: a report typed by hand would describe a run nobody can find.

- **On a pull request or a push to main**, it is the `release-report`
  artefact of the CI run and the run's summary page.
- **On a release**, it is attached to the GitHub release as
  `formancy-health-<tag>-release-report.md` and `.json`, each with a
  `.sigstore` bundle signed by the workflow that ran the gates, beside the
  SBOM; the release body carries its summary.

Each job of `.github/workflows/gates.yml` collects what it found into one
results file (`scripts/release-report/collect.mjs`) and uploads it; the
last job, `report`, builds the report from all of them
(`scripts/release-report/report.mjs`).

### What it holds

1. **Subject:** the version, the release (a tag, `dry-run` or none), the
   commit, the run, and each job's attempt, runner image and Node.
2. **Tested on:** every runtime dependency of every published package --
   none today -- and the upstream `@formancy/*` packages, each as declared,
   as the suites loaded it, as a consumer's clean `npm install` of the
   tarballs alone resolved it, and, in a column of its own, as the guide's
   project resolved it beside what the guide installs, with those a
   consumer's install brings marked shipped;
   Node as each job ran it and the install gate's npm; pnpm and the tools;
   Playwright and the build it pins for each browser
   [`scripts/browsers.mjs`](../../scripts/browsers.mjs) names, beside the
   browsers the demo's gate launched and the axe-core it put in the page;
   and the tuple the README's compatibility table states -- the FHIR
   version, the validator the gate pins and the packages it loads -- beside
   the validator the gate ran and the Java it ran on.
3. **Results:** a row per package with a suite -- files, tests, what did not
   pass, the task's wall time from turbo, vitest's span, and coverage,
   reported and never gated -- then the repository's guards, and the install
   gate with each project it ran, what that project installed beside the
   tarballs, the guide's blocks it built, and what the guide's run said.
   Each suite is held to every test file the checkout holds for it,
   known by its name as vitest's default include knows one and not by the
   suite's own include, which is what is on trial.
4. **Validator:** the gate's verdict, from the file it writes however it
   ends: the validator and the Java it ran, the packages registered and
   loaded, the resources judged, to accept and broken to refuse, the issues
   counted and the warnings accepted by id; and the validator job's run of
   the registers' test after the gate.
5. **Browser:** the demo's browser gate ([0012](../decisions/0012-a-demo-at-formancy-ai-health-fills-a-synthetic-referral-in-the-browser-served-by-a-worker-of-its-own.md)), from the file it writes
   however it ends, in each browser the gates run in: what it launched, the
   Playwright that launched it, its checks passed and failed, the passes it
   made of those it planned, the widths, the axe-core it ran and its wall
   time, each leg of the `browser` job's file read under its browser's
   key; and the table of what the browsers disagree on, each row with each
   browser's answer and the checks that hold it
   ([0014](../decisions/0014-the-demos-browser-gate-runs-in-chromium-firefox-and-webkit-and-each-fact-the-browsers-disagree-on-is-named-and-held.md)). It runs the packages as the workspace
   builds them, bundled into the demo's page, and never the tarballs,
   which a derived limitation says.
6. **Build identity:** each published package's tarball as the install gate
   packed, installed and ran it, by sha256, and the hash of its built files
   against the `dist/` every job built.
7. **Release gates:** from [`gates.json`](gates.json). No gate rests on
   the demo's browser gate, which is evidence about the demo, a page no
   release publishes.
8. **Known limitations:** those the run shows, as fixed sentences with the
   run's facts, then those the decision records state, from
   [`limitations.json`](limitations.json).
9. **How this report was made:** where each section comes from.
10. **Problems:** what fails the run. Empty on a green run, and the report
   says so.

### What fails it

A job of the gates that ended other than success; a job's results missing,
twice, under another job's name, or from another commit or run; a
published package with no suite; a package with no results, no tests, a
test that failed, a file that failed, or vitest calling the run
unsuccessful; a test that did not run -- skipped is not passed -- unless it
is a case the validator job's run passed, the same test of the same file,
which is how the registers' cases `verify` cannot read are accounted for
(0005); a test file the checkout holds that its suite did not run; a
coverage summary or a turbo task of another run than the suite's
`vitest.json`; the install gate missing, failed, packing other than one
tarball per published package, or packing one at another version than the
root manifest's, or, though it says it passed, missing a project
`scripts/install-hosts.mjs` plans, recording one it does not, a project
that did not finish npm's install or a step, ran other steps than its plan,
or was given the guide's blocks where the plan gives them to another; the
validator gate missing, failed, or, though it says it passed, recording a
problem, judging nothing, judging a resource otherwise than the corpus
expects -- by its verdict or by the row's own counts -- reporting another
validator or another JAR than [`validator.json`](validator.json) pins, run
against another register than [`ig-packages.json`](ig-packages.json),
loading anything else, or not recording an offline run, each as the gate
measured it while it ran; the validator job's run of the registers
failing; the demo's browser gate leaving no results in a browser
`scripts/browsers.mjs` names, ending in an error, failing a check, not
making a pass it planned or making one with no check in it, launching
another browser or build than the one the installed Playwright pins, or
otherwise than headless, or run by another Playwright; the browser gate
making another check in one browser than in another, by pass and name,
or another list of passes, or making a check that holds a row of
`scripts/browsers.mjs`'s table in no pass of a browser; a browser gate's
file whose browser, asked for or launched, is not the one it is filed
under; the install gate's record, a browser gate's file or the
validator's files in another job's results; a gate's file that records
no start; a published package whose `dist/` no
job recorded; two builds of one package that differ, or a tarball whose
built files are not every job's; a gate whose evidence did not pass, or a
limitation whose `heldBy` test did not; either register not holding; and,
for a release, a tag that is not the root manifest's version, a version
with no changelog section, or a body longer than the 125,000 characters
GitHub accepts. A local report also fails on results of more than one
commit or run, or one key twice, and on guards that started before the
validator gate finished.

### What a release does with it

`release.yml`'s `check` job, with read-only permissions and no secret,
refuses a report that is not this run's, green and whole -- of another
commit, run, release or version, partial, local, or with problems -- a
report directory holding anything but the report and the body, a tarball
that is not byte for byte the one the report says the install gate
installed, and a body that is missing or too long. It pins the report and
the tarballs by sha256 before cdxgen runs, then makes the SBOM of those
tarballs, installed by npm outside the checkout as a consumer installs
them, and holds it to the report -- every published package at the
release's version, every upstream package the report marks shipped at the
version the suites loaded -- and to npm's lockfile of that install, no
component more or less, before it pins it (formancy.ai-report 0017).
The `publish` job refuses anything it downloaded that is not what was
pinned, and the report again, before it signs the SBOM and the report and
before npm receives anything (`scripts/release/pins.mjs`, `publish.mjs`).

### The report's two registers

**[`limitations.json`](limitations.json)** has an entry for every decision
record: the costs it states that a user, integrator or operator of a release
will meet, one sentence each in the record's own terms, or, in `none`, why it
has none. Each entry's `reviewed` is the sha256 of its record as it was read,
so any edit to a record -- a later record changing its Status line included
-- fails until somebody reads it again:

```bash
node scripts/release-report/limitations.mjs --changed     # records edited since they were read
node scripts/release-report/limitations.mjs --missing     # records with no entry
node scripts/release-report/limitations.mjs --stamp 0011  # after reading 0011 again
```

The fence detects change, not meaning: a stamp without a reading passes. A
line can outlive its truth until its record changes, which is why CLAUDE.md
asks for a record whenever a decision changes. Where a test already shows
that a line still holds, `heldBy` names it, and the report fails a run in
which it did not pass.

**[`gates.json`](gates.json)** names, for each of the plan's gates by id --
G1 to G7, the three 0.1.0 adds (`licences`, `trademark`, `rehearsal`) and
the `legal` review -- the evidence a run must pass, the reason it is open,
or both. The plan is a working document kept out of the repository, so no
gate's wording is here. Evidence is a test `file` -- of a package with a
suite, or one of the repository's guards -- a gates.yml `job`, or a
`document`. A gate passes in a run when everything but its documents
passed; a document is shown as stated, with its last change and how many
commits it is behind, and never as passed in the run. A gate with a reason
is open whatever its evidence, and the evidence it has must pass all the
same; each reason is printed in every report and release body, so it says
what stays true on the release's own run. The `legal` gate waits for a
lawyer's review of `LICENSE.md`, the README's intended purpose and the
trademark position, and `scripts/licence-status.test.mjs` fails when it
is given evidence, or loses its reason, while the licence's version line
says no lawyer has reviewed it; that the reason still names the review is
held by review.

### Building one on a machine

[`RELEASING.md`](../../RELEASING.md#the-release-report) has the commands.
`--since` has no default. A results file left by an earlier run, read as this
one's, is the failure local mode has to rule out, and only the person running
it knows from when; a file that started before it is listed as stale and the
report fails, and so is one that records no start. Every file a suite's row
is built from is held to the suite's own run as well: a coverage summary
written before its `vitest.json` started, or a turbo task that does not span
that start, is another run's and is refused. A `vitest.json` of one file, run
after the whole suite, fails the report for every other test file of its
package, which did not run in it. On a machine the root `vitest.json` is the
guards': run them with `VALIDATOR_GATE_RAN=true` after the validator gate,
and none of the registers' cases skips -- guards that started before the
gate finished are refused, since one of those cases reads the gate's
file; without the validator, allow it missing, and the cases of the files
the validator job runs are allowed skipped, as the banner says. A gate
whose evidence names a job, as `gates.json` says which, has no result on
a machine, because a job's result is the gates run's `needs`: the report
says so unless that job is allowed missing. `--allow-missing` names collect's readers -- `verify`, `browser`,
`install`, `validator` -- whose files a machine did not write. A local report says
"local" at the top, names its commit "with uncommitted changes" when the
tree held any, names what it allowed missing when it is partial, and a
release refuses it.

Every test of the report builds it from `scripts/release-report/synthetic-run.mjs`,
a whole green run made by hand, so the report is derivable with no CI at
all.
