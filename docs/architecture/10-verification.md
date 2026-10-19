# 10. Verification

What is checked, how, and what each check proves, the limits included. The
organising principle is that an export is proved on the resources it
produced ([0005](../decisions/0005-a-fhir-resource-is-proved-by-the-hl7-validator-against-pinned-guide-packages.md)),
as Formancy Report proves a report on the PDF it produced
([formancy.ai-report 0003](https://github.com/sharkysan/formancy.ai-report/blob/main/docs/decisions/0003-a-rendered-report-is-proved-on-the-pdf-it-produced.md)):
by the official HL7 FHIR validator, on the JSON the packages as built wrote,
never on their input and never through a mocked validator.

## 10.1 A check that has been seen to fail

A resource broken on purpose, for one thing, must be refused for exactly
that thing -- matched by severity, message id or issue type, and expression
-- or the gate fails, saying nothing is watching it. That is how a check of
the validator's is watched failing here. A record's **Verified by** line
names what holds it, as the [decisions' format](../decisions/README.md#format)
asks. Where its checks were watched failing, the line says so and what was
planted to make each fail, as in
[0004](../decisions/0004-fhir-json-is-written-and-read-exactly-with-primitives-of-its-own.md)
to [0008](../decisions/0008-a-document-is-a-bundle-of-what-it-refers-to-and-a-pdf-its-own-bytes-never-an-unproved-pdf-a.md);
all of those but 0005 also say that every file was restored byte for byte
after.

## 10.2 The gates

Every job is in [`gates.yml`](../../.github/workflows/gates.yml), which CI
runs on every pull request and a release before it publishes.

| Job | Command | What it proves | What it does not |
|---|---|---|---|
| `verify` | `pnpm build`, `pnpm typecheck` | The packages build; no published package names a Node or DOM global or imports what its manifest does not declare ([§5](05-building-blocks.md#what-holds-the-layers)) | A global reached by a cast; a manifest that declares more than a record admits |
| | `pnpm check:pkg` | publint and attw, ESM only: the commonest cause of a package that does not work in its host | That it runs: the install gate does that. On the machine 0011 was built on it stopped before it checked anything, publint's `pnpm pack` refused by corepack's pnpm, and each package passed run by hand ([0011](../decisions/0011-a-release-report-is-derived-from-the-run-that-gated-it.md)) |
| | `node scripts/verify-licenses.mjs` | Every published manifest declares the source-available terms, and every tarball carries `LICENSE.md` and `NOTICE` ([0001](../decisions/0001-a-paid-module-in-its-own-repository.md)) | That the licence's terms are Data's and Report's: nothing compares the texts |
| | `node scripts/dependency-licences.mjs` | Every production dependency of a published package, as installed, is under a permissive licence | Whether a licence's terms are what its identifier says; code a package vendors |
| | `pnpm test:repo` | The repository's guards, among them: exactness and no clock, HL7's notice and the names, upstream at exact versions, the size budget, the test matrix, `codecov.yml`, the CLA's hash, the README's generated parts, the workflows' shape, the validator's registers, verdict, command line and corpus coverage, the letter's PDF the registered bytes ([`letter.test.mjs`](../../scripts/validator/letter.test.mjs)), health-corpus's documents entry reaching workspace packages alone ([`corpus-documents.test.mjs`](../../scripts/corpus-documents.test.mjs)), the demo's deploy -- its Worker at one path of formancy.ai, what it stages, the headers' policy allowing the page no connection and nothing but its assets, the same at every address but for the address, and the one rule Cloudflare reads them from, and the README's *Try it*, the Worker's settings in REPO-METADATA and RELEASING's Wrangler held to it ([`demo.test.mjs`](../../scripts/demo.test.mjs)), the notices the demo's build writes and the licence policy it holds what it bundles to ([`third-party-notices.test.mjs`](../../scripts/third-party-notices.test.mjs)), the code systems the corpus writes, no valid AHV number in any file, this architecture ([0010](../decisions/0010-the-architecture-is-documented-in-arc42s-sections-held-to-the-repository-by-a-guard.md)), and the getting-started guide held to the install gate -- every block handed to it, section 1 installing what the gate installs, every link landing -- by [`getting-started.test.mjs`](../../scripts/getting-started.test.mjs), and the README's intended purpose holding CLAUDE.md's sentence that the product is not intended as a medical device, word for word, and its links landing, by [`readme.test.mjs`](../../scripts/readme.test.mjs), all three reading Markdown through [`markdown.mjs`](../../scripts/markdown.mjs) ([0011](../decisions/0011-a-release-report-is-derived-from-the-run-that-gated-it.md)) | What only a person reading prose can see: whether a sentence is true, the intended purpose's of what the packages do among them |
| `test` | each package's `test:coverage`, one job each, the demo's among them | Each package's suite, against the other packages as built. Coverage is reported, never gated. The demo's, in jsdom: the page's first resources the corpus's entries byte for byte, each refusal on purpose the package's for its rule, the journey by role and name with axe, the stylesheet with no colour or variable of its own, the banner once before the form, and the page's words saying nothing of cookies or tracking ([0012](../decisions/0012-a-demo-at-formancy-ai-health-fills-a-synthetic-referral-in-the-browser-served-by-a-worker-of-its-own.md)); the Questionnaire read out of its own bytes, every item in the page's language or marked and said to be the resource's own, refused whole where it cannot be read or holds what it does not know, and each item's way landing on its field, scrolled to the middle of the window, measured on the DOM formancy's renderer draws of every field type and widget ([0013](../decisions/0013-the-demo-reads-its-questionnaire-out-from-the-bytes-it-shows-and-renders-no-questionnaire.md)); the themes imported in the room's order, Blueprint's variables read inside its scope alone, the page's script writing no style, and one copy of each formancy package among what the page's dependencies bring, read from the install ([0015](../decisions/0015-the-demo-wears-formancy-ais-room-imported-from-formancy-0-6-0-and-the-packages-read-forms-through-the-same-release.md)) | That a suite covers what it should: [`ci-test-jobs.test.mjs`](../../scripts/ci-test-jobs.test.mjs) holds only that every suite runs |
| `browser` | `pnpm exec turbo run test:browser --filter=@formancy/health-demo`: the demo's gate, [`browser-test.mjs`](../../apps/demo/scripts/browser-test.mjs) with its [journey](../../apps/demo/scripts/gate-journey.mjs) and its [requests, storage and policy](../../apps/demo/scripts/gate-privacy.mjs) | In headless Chromium, Firefox and WebKit, a leg each, each at the build the installed Playwright pins ([`browsers.mjs`](../../scripts/browsers.mjs)), every check in every browser ([0014](../decisions/0014-the-demos-browser-gate-runs-in-chromium-firefox-and-webkit-and-each-fact-the-browsers-disagree-on-is-named-and-held.md)), on the page Vite builds, built first so it is React's production build, which the renderer's own report checks, served under `/health/` with the headers [`demo-headers.mjs`](../../scripts/demo-headers.mjs) decides for the gate's address: the page in formancy.ai's room, every custom property the installed `@formancy/themes/room.css` sets holding on `:root` as the browser computes it, compared as colours, in the room's colour scheme and on its ground ([0015](../decisions/0015-the-demo-wears-formancy-ais-room-imported-from-formancy-0-6-0-and-the-packages-read-forms-through-the-same-release.md)); at every width the stylesheets' breakpoints give, from 320 pixels to a wide screen, each in one of the page's four languages, nothing scrolls sideways or is past an edge, axe's rules and target size find nothing and contrast is decided, in every state the journey reaches; the skip link and the keyboard's way through the form; the resources the browser makes of the sample are the corpus entries, byte for byte, the Questionnaire is read out item by item in the page's language and each item's way puts the keyboard on its field, the field and its label whole inside the window, a change reaches them, a language switched keeps them, a required answer cleared is refused, and every download is the bytes shown, the letter's PDF those its Bundles carry; the notices the foot links to are the file the build wrote; once the page has settled it asks for nothing more, whatever is typed in whatever script, sets no cookie, stores nothing and puts nothing typed in its address, the policy refuses nothing the page did and its console logs no error, the journey long, and the policy refuses a planted markup sink and fetch, and an inline and a `/cdn-cgi/` script injected into the page as served; and what the browsers disagree on is named and held, each row of the table by a check of one name in every browser ([`gate-facts.mjs`](../../apps/demo/scripts/gate-facts.mjs)). Each of 41 faults planted in the page, its headers or the gate on 18 October 2026 failed its check, and every file was restored byte for byte ([0012](../decisions/0012-a-demo-at-formancy-ai-health-fills-a-synthetic-referral-in-the-browser-served-by-a-worker-of-its-own.md)); so did the read-out's checks the same day, with its items reversed and its ways leading nowhere, and the window's with the way focusing the field alone, in WebKit in every pass and in Chromium and Firefox in two ([0013](../decisions/0013-the-demo-reads-its-questionnaire-out-from-the-bytes-it-shows-and-renders-no-questionnaire.md)); and each row's check, with the table's values turned over, in every pass it is made in, in Chromium and in WebKit ([0014](../decisions/0014-the-demos-browser-gate-runs-in-chromium-firefox-and-webkit-and-each-fact-the-browsers-disagree-on-is-named-and-held.md)); the room's check failed in every pass in Chromium on the page before it wore the room and with the room imported before the workbench, and axe's contrast with the form's paper taken away, on 19 October 2026 ([0015](../decisions/0015-the-demo-wears-formancy-ais-room-imported-from-formancy-0-6-0-and-the-packages-read-forms-through-the-same-release.md)) | What the address serves, which is checked by hand ([RELEASING.md](../../RELEASING.md#the-demo-on-formancyai)); Safari, WebKit's ports but Linux's, a phone, a screen reader, or a person's eye on the layout; the packed packages, which the page bundles as the workspace builds them |
| `install` | `pnpm test:e2e:install` | The packed tarballs install into a plain npm project holding nothing else, type-check with `skipLibCheck` off against their published declarations, strictly, and run under Node: a decimal, a Questionnaire, a response, a document, and each package's `Refusal` caught. And in a project of its own, the tarballs beside what the guide's section 1 installs, the [getting-started guide](../getting-started.md)'s program, type-checked the same way and run: it must print exactly the lines the guide shows and write its two documents ([0011](../decisions/0011-a-release-report-is-derived-from-the-run-that-gated-it.md)) | Any host but Node; the registry's copy, which it never reads; that the guide's resources conform, which the validator says of its corpus alone |
| `validator` | `node scripts/validator.mjs`, then the registers' test against what it downloaded and ran | What the packages wrote of the corpus is accepted by the pinned validator, offline, against the registered packages, with no error and no warning but the registered ones; every broken resource is refused for what it breaks, the CH ORF documents among them; the registers are the bytes and the validator's own load | See 10.3 |
| `report` | `node scripts/release-report/report.mjs`, over what every other job's collect step uploaded | The run as a whole: every job ended in success and left its results, each section from the job that leaves it; every suite ran every test file the checkout holds for it, and nothing in it failed or was skipped but a registers' case the validator job's run passed; the demo's browser gate made every pass it planned with a check in each and failed none, in each browser, at the build Playwright pins for it, launched headless, with the same checks by pass and name in every browser and each row of the browsers' table held by its check; the install gate passed with one tarball per published package at the version, and ran every project [`install-hosts.mjs`](../../scripts/install-hosts.mjs) plans to its last step, the guide's blocks in the guide's project; the validator gate's verdict, read again from each row's counts and held, as the gate measured its run, to the registers the checkout pins; each tarball's built files the same bytes as every job's build; each release gate's evidence passed; each register holds ([0011](../decisions/0011-a-release-report-is-derived-from-the-run-that-gated-it.md)) | That a gate's evidence is the right evidence, or a register line still true: review's. It had not run on GitHub by 17 October 2026 |

Beside them, [`cla.yml`](../../.github/workflows/cla.yml) checks every pull
request's commit authors against the CLA record, and
[`security.yml`](../../.github/workflows/security.yml) runs CodeQL and
dependency review. A release runs `gates.yml` again, then checks and pins
what it would publish ([§6.6](06-runtime-view.md#66-a-release)).
[`workflows.test.mjs`](../../scripts/workflows.test.mjs) holds the
workflows to the shape that depends on: every third-party action pinned to
a commit, and the validator job's `setup-java` too, while GitHub's own,
those of its `actions` organisation, are taken by tag; no `${{ }}` in a script; no cache in a
release; the validator job's order and uploads; the browser job's
legs, one per browser, each installing its browser -- WebKit's alone its
system libraries -- before its gate, naming its browser to the gate and to
collect, and keeping the gate's file under its own name; every job's collect step
and upload, and the report waiting for all of them; and a release that
checks the report before it pins, makes the SBOM of the tarballs it pinned
-- installed by npm outside the checkout, no workspace installed -- and
holds it to the report and to npm's lockfile of that install, and signs
and attaches the report beside the SBOM
([`verify-publish.test.mjs`](../../scripts/release-report/verify-publish.test.mjs)
holds what the SBOM must name, and that it names nothing the install does
not hold).

## 10.3 What a conformance claim covers

The claim is the guide and its version, the validator and its version, and
the corpus, and nothing more ([0005](../decisions/0005-a-fhir-resource-is-proved-by-the-hl7-validator-against-pinned-guide-packages.md));
the README's [validator gate](../../README.md#the-validator-gate) states it
in full, and [its table](../../README.md#what-it-is-built-and-judged-against),
derived by [`scripts/compatibility.mjs`](../../scripts/compatibility.mjs),
the versions.

For a CH ORF document the corpus is
[`ch-orf.mjs`](../../scripts/validator/ch-orf.mjs) and the demo's
[`demo-referral.mjs`](../../scripts/validator/demo-referral.mjs): the
documents health-ch, as built, makes of their synthetic referrals, and the
demo's response alone, accepted against CH ORF on CH Core
with CH Term, with no error and no warning but dom-6 and CH Core's
`gln-startswith76`, which the corpus's GLNs under GS1's prefix for examples
raise, each registered with its reason; and documents made of the first with one
thing broken, the ones [0009](../decisions/0009-a-ch-orf-document-is-the-hosts-referral-in-ch-core-and-ch-orf-the-questionnaire-by-canonical-and-swiss-identifiers-checked-here.md) lists, each of which the validator must refuse
for exactly that. A wrong check digit is among them, which the validator
only warns of and the gate, that warning unregistered, refuses.

What it does not cover:

- **A resource the corpus does not hold.** The corpus is synthetic and
  [`corpus.test.mjs`](../../scripts/validator/corpus.test.mjs) holds it to
  every type and rule the packages write, not to every form a customer has.
- **Codes the registered packages do not hold.** LOINC, SNOMED CT, UCUM and
  a language tag's registration are unchecked offline; a code system nobody
  knows is information, which refuses nothing; a media type is unchecked.
- **A response that is not complete**, which the corpus has none of
  ([0007](../decisions/0007-a-formancy-submission-is-a-questionnaireresponse-of-the-same-mapping-refused-whole-where-an-answer-cannot-be-one.md)).
- **The bytes in a Binary.** The validator recomputes the size and SHA-1 of
  bytes in an attachment and not of those in a Binary, and lets an
  attachment url to nothing through; health-document refuses both, and
  health-corpus's tests hold its output to Node's base64 and SHA-1
  ([0008](../decisions/0008-a-document-is-a-bundle-of-what-it-refers-to-and-a-pdf-its-own-bytes-never-an-unproved-pdf-a.md)).
- **The PDF itself.** It is no PDF/A, and what its pages say is Report's to
  prove.
- **The codes a Swiss host sends.** Offline, a Composition's type and
  category draw nothing against CH Term's SNOMED CT value sets, a made-up
  code included, and the corpus holds HL7's own codes there; the LOINC
  section code is held by its pattern alone ([0009](../decisions/0009-a-ch-orf-document-is-the-hosts-referral-in-ch-core-and-ch-orf-the-questionnaire-by-canonical-and-swiss-identifiers-checked-here.md)).
- **An AHV number the gate should accept.** The corpus's one has a wrong
  check digit, since a valid one may be a person's, so that a valid number
  is held to its system rests on health-ch's tests and on CH Core's
  constraints as read, not on a verdict of the validator's ([0009](../decisions/0009-a-ch-orf-document-is-the-hosts-referral-in-ch-core-and-ch-orf-the-questionnaire-by-canonical-and-swiss-identifiers-checked-here.md)).
- **What CH ORF's prose asks beyond its profiles**: the Questionnaire inside
  the Bundle, a stylesheet, and R4's definition of a narrative "clinically
  safe" for a human to read alone, which a narrative of titles is not. The
  profiles do not ask them, and the gate accepts the document without them
  ([0009](../decisions/0009-a-ch-orf-document-is-the-hosts-referral-in-ch-core-and-ch-orf-the-questionnaire-by-canonical-and-swiss-identifiers-checked-here.md)).
- **A receiving system.** That one accepts a resource is shown by nothing
  here.

## 10.4 What is not verified yet

- **The release report on GitHub**, as of 17 October 2026. It is built in
  every test from a synthetic run, and was built from one machine's runs
  ([0011](../decisions/0011-a-release-report-is-derived-from-the-run-that-gated-it.md));
  that the artefacts arrive as it reads them, and that separate runners
  build the same bytes, only the first CI run shows; that the SBOM step
  runs on a runner as it ran by hand, only a rehearsal. Its gates register,
  [`gates.json`](../release/gates.json), keeps open the gates it gives a
  reason, each for that reason, some of them partly evidenced, and every
  report prints which and why.
- **PDF/A**: no gate proves a producer, so every declaration is refused; a
  gate for it waits for a Report release that writes PDF/A
  ([0008](../decisions/0008-a-document-is-a-bundle-of-what-it-refers-to-and-a-pdf-its-own-bytes-never-an-unproved-pdf-a.md)).
- **A browser, for the packages.** The demo's browser gate runs them in
  Chromium, Firefox and WebKit as the workspace builds them, bundled by
  Vite into its page; no gate runs the packed tarballs in a browser or
  bundles them for one, which is why G1 is open in part, and the report
  says so of every run. Its WebKit is the Linux port, not Safari
  ([0014](../decisions/0014-the-demos-browser-gate-runs-in-chromium-firefox-and-webkit-and-each-fact-the-browsers-disagree-on-is-named-and-held.md)).
- **The intended purpose.** The guard holds the README's to CLAUDE.md's
  sentence, and nothing to what the packages do or what another page says
  of them; no lawyer has read the words, which the legal gate of
  [`gates.json`](../release/gates.json) waits for, beside G7's review; and
  that a customer's product computing a clinical result carries the duty
  that brings is said by the README and not by `LICENSE.md`
  ([0011](../decisions/0011-a-release-report-is-derived-from-the-run-that-gated-it.md)).
- **The settings a release reads.** The `npm` environment's policy, its
  token, Codecov's and the repository's visibility were read with `gh api`
  on 17 October 2026 for
  [`RELEASING.md`](../../RELEASING.md#before-the-first-release), and nothing
  reads them again.
- **That a test never mocks the validator**, and that a fixture holds no
  real person's data: review's.
- **The demo, where no gate reaches** ([0012](../decisions/0012-a-demo-at-formancy-ai-health-fills-a-synthetic-referral-in-the-browser-served-by-a-worker-of-its-own.md)): what formancy.ai/health/
  serves, which [`RELEASING.md`](../../RELEASING.md#the-demo-on-formancyai)
  checks by hand after a deploy, and what Cloudflare's zone sets, measures
  or adds there, beyond the script the policy refuses; the Worker's
  settings in Cloudflare's dashboard; what the notices cannot see, which
  Vite folds into the bundle as text; whether the address owes a legal
  notice or a privacy statement, which is the lawyer's question; that the
  page's own source reads no clock or random source, which the
  exactness guard holds of the packages alone; that the built page holds
  no valid AHV number, which the identifiers guard holds of the files git
  would commit and not of a build; and the French and Italian words.
