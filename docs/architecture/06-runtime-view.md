# 6. Runtime view

What a host calls comes first: synchronous calls in its own process, which
read no clock, no random source and no network. Then how what they write is
judged, and how it is released.

## 6.1 A form becomes a Questionnaire

```
host ── toQuestionnaire(form, { base, version, status, languages })
   │
   ├─ the context first: a base, a version, a status, each language a BCP 47 tag
   │  in its canonical case                each wrong ──▶ refused, at its path
   ├─ a spec version the mapping reads?   no ──▶ refused at form.specVersion, the form's
   │                                             only refusal: nothing is known of what
   │                                             such a form means
   ├─ formancy's own validateSchema       each error ──▶ `invalid`, at its path
   ├─ the context refused?                yes ──▶ no field mapped: options are named
   │                                             under the url the host's base makes
   ▼
mapForm, each field in the model's order
   ├─ one item, its linkId the field's key, its type from one table
   ├─ its rules: visible → enableWhen, where it is a simple comparison of a
   │  top-level field before it, on no page a skip rule passes; skip → its page's
   │  enableWhen, negated; computed → readOnly; any other → refused
   └─ its texts: the default language's, and a translation for each language
      asked for; a text missing in one → `missing`, with that language
   │
   ├─ any refusal ──▶ { ok: false, refusals }: every one found, the context's first,
   │                  each a rule and a path
   ▼
{ ok: true, questionnaire } ── host: writeJson(questionnaire) ──▶ the same bytes for the same form and context
```

[`questionnaire.ts`](../../packages/health-questionnaire/src/questionnaire.ts)
is the order; its test holds the context's refusals beside a version's, and
no field mapped under a refused context.

The Questionnaire's url is the host's base, `/Questionnaire/` and the
form's id, a name that is never fetched; its version is the number formancy
published, with the `integer` version algorithm SDC's sdc-2 asks for beside
one; it claims the SDC Questionnaire profile at its version
([0006](../decisions/0006-a-formancy-form-is-an-sdc-questionnaire-refused-whole-where-it-cannot-be-one.md)).
A linkId is the field's key because formancy's key is the answer's identity
there, changed only by a declared rename
([formancy.ai 0011](https://github.com/sharkysan/formancy.ai/blob/main/docs/decisions/0011-declared-renames.md)).

## 6.2 A submission becomes a QuestionnaireResponse

```
host ── toQuestionnaireResponse(form, answers, { questionnaire, status, authored, subject, … })
   │
   ├─ the context first, each wrong element refused at its path, a member it does
   │  not name as `unmapped`; the Questionnaire's own refused leaves the form
   │  unmapped, as in 6.1
   ├─ mapForm(form), the same mapping as 6.1 ── refused? ──▶ the context's refusals and
   │                                                         the mapping's
   ▼
walk the Questionnaire's items in their order, reading each field's value by its data path
   │
   ├─ no answer, as formancy's `unanswered` reads it  ──▶ nothing written
   ├─ enabled? read as the validator reads enableWhen, over the answers before it
   │     ├─ on a page a skip rule passes  ──▶ left out: formancy keeps it, and shows it to nobody
   │     └─ hidden by a visible rule      ──▶ refused, `disabled`: formancy clears it there,
   │                                          so a value means two readings disagree
   ├─ the value as its item's answer[x]: a number exactly the double formancy holds,
   │  an option as the Questionnaire's coding, a group's and a row's answers nested
   │     └─ another type, an option not offered, past a bound ──▶ refused
   ├─ a name the form does not have ──▶ `unknown`, at the object that holds it, unnamed
   └─ completed or amended: every enabled required item answered, or `required`
   │
   ▼
{ ok: true, questionnaireResponse }: to the Questionnaire's url|version; the SDC
response profile claimed only with a subject and a versioned Questionnaire; the
host's profiles after it, each once, and alone where SDC's is not
```

Missing, null and suppressed stay distinct: absent and null are no answer;
a skipped page's value is left out; a hidden item's value is refused
([0007](../decisions/0007-a-formancy-submission-is-a-questionnaireresponse-of-the-same-mapping-refused-whole-where-an-answer-cannot-be-one.md)).

## 6.3 A PDF becomes a document

```
host ── toDocumentReference({ bytes, profile }, { status, type, subject, date, title, binary? })
   │
   ├─ the PDF and the context read for the members they name   one more ──▶ `unmapped`
   ├─ profile: 'PDF' ── or a PDF/A level ──▶ `unproved`; any other name ──▶ `unmapped`
   ├─ bytes: a Uint8Array, copied once; first line a PDF header, last line %%EOF
   ├─ size and SHA-1 computed from the copy
   ▼
DocumentReference: application/pdf, the bytes as base64 in the attachment,
or in a Binary the attachment names by urn:uuid

host ── toDocumentBundle({ profile?, identifier, timestamp, composition, entries })
   │
   ├─ every object read for the members it names     one more ──▶ `unmapped`, unnamed
   ├─ every list read at each index                  a hole ──▶ `absent`, at its index
   ├─ each entry's resource written and read back by health-core: a copy
   ├─ every reference resolved to an entry's urn:uuid    else `dangling`, or `reference`
   ├─ every entry reached from the Composition           else `unreferenced`
   ├─ every name given once                               else `duplicate-entry`
   ├─ every attachment's size, hash and media type its bytes'   else `mismatch`
   ▼
Bundle of type document: the host's identifier and timestamp, the timestamp as
meta.lastUpdated too, the Composition first, then the host's entries in its order;
the profiles the host names claimed by the Bundle and the Composition; and the
Composition's narrative, generated, of its title and its sections' titles as
headings, each escaped by xhtmlText
```

Every refusal of both comes at once, at a path from `pdf` or `context`
([0008](../decisions/0008-a-document-is-a-bundle-of-what-it-refers-to-and-a-pdf-its-own-bytes-never-an-unproved-pdf-a.md)).
Holding each attachment to its bytes reads and hashes them again; what that
costs, measured, is in the record. The narrative, the claims and the
refusal of a member no context names are [0009](../decisions/0009-a-ch-orf-document-is-the-hosts-referral-in-ch-core-and-ch-orf-the-questionnaire-by-canonical-and-swiss-identifiers-checked-here.md)'s.

## 6.4 A referral becomes a CH ORF document

```
host ── toQuestionnaireResponse(form, answers, { …, profiles: [PROFILES.questionnaireResponse] })  (6.2)
host ── toChOrfDocument({ identifier, timestamp, composition, patient, author, serviceRequests, response })
   │
   ├─ health-ch's own reading, every refusal at once:
   │    every object for the members it names           one more ──▶ `unmapped`, unnamed
   │    the Composition's name, and the one category CH ORF requires
   │    the patient, and the author's role, practitioner and organisation, as CH Core
   │    profiles them: a GLN's or an AHV number's form   ──▶ `identifier`
   │                   its check digit                   ──▶ `check-digit`, no digit named
   │                   a host's number under a Swiss system ──▶ `identifier`
   │                   gender unknown, a name without its parts ──▶ refused
   │    each order: the placer's number, R4's status and intent; a hole ──▶ at its index
   │    the answers, copied once by health-core and held as copied:
   │       CH ORF's claim                                else `profile`
   │       the patient its subject; its author and source entries of the document,
   │       of the types CH ORF allows                    else `reference`, `dangling`
   │       the Questionnaire by url|version              else `unversioned`
   │       a member toQuestionnaireResponse does not write ──▶ `unmapped`, unnamed
   ├─ any refusal ──▶ { ok: false, refusals }: health-document is not asked
   ├─ then every entry's name given once                 else `duplicate-entry`
   ▼
health-document's toDocumentBundle (6.3), of the host's Composition values and what
health-ch wrote, claiming CH ORF's document profile, unversioned
   │
   ├─ a refusal of the host's value ──▶ { ok: false, refusals }, at the host's path
   ├─ a refusal of anything health-ch wrote ──▶ thrown, as a bug
   ▼
{ ok: true, bundle }: the Composition, its section coded LOINC 93037-0 with its name;
then the patient, the answers, the orders, the role, the practitioner, the organisation
```

[`document.ts`](../../packages/health-ch/src/document.ts) is the order,
and the order is a cost [0009](../decisions/0009-a-ch-orf-document-is-the-hosts-referral-in-ch-core-and-ch-orf-the-questionnaire-by-canonical-and-swiss-identifiers-checked-here.md) states. health-document is asked only of a
context health-ch accepts, so a context wrong in health-ch's way and in the
Composition's is refused for the first, and for the second on the next
attempt; and a name given to two entries is looked for only once every part
was read. health-document stays the one place that decides what a
Composition's values must be: health-ch checking them too was rejected as
a second place, which would drift from the first.

The Questionnaire is not in the Bundle. The response names it by its
versioned canonical, which the host publishes; CH ORF's profile allows the
Bundle without it, and its prose asks for it, which 0009 quotes and names
as a cost. Nothing is sent: CH ORF's Submit Bundle is the host's to
make.

## 6.5 The validator gate judges what the packages wrote

```
pnpm build                                  the corpus is written by the packages as built
node scripts/validator.mjs --java <java>
   │
   ├─ 1. the registers checked                       a wrong one ──▶ nothing runs
   ├─ 2. the Java: as new as the pin asks            older ──▶ nothing runs
   ├─ 3. the JAR and every package fetched into .fhir-cache/,
   │     each refused unless its SHA-256 is the registered one;
   │     the validator's package cache holds those and no others
   ├─ 4. the corpus made: Questionnaires and responses of the synthetic forms,
   │     documents of the referral letter Report renders, the CH ORF document of a
   │     synthetic referral, resources built by hand,
   │     and resources broken on purpose, then checked   a wrong one ──▶ the validator
   │     and each written by writeJson                               is not run
   ├─ 5. the validator run once, offline: -tx n/a -txCache n/a -no-http-access,
   │     -locale en-US -jurisdiction uv
   ├─ 6. judged: an error, or a warning warnings.json does not name, fails;
   │     a broken resource accepted, or refused for something else, fails;
   │     a package loaded and not registered, or registered and not loaded, fails
   ▼
test-results/validator.json, with the corpus, the outcomes and the console beside it
```

[`scripts/validator.mjs`](../../scripts/validator.mjs) is the runner;
[0005](../decisions/0005-a-fhir-resource-is-proved-by-the-hl7-validator-against-pinned-guide-packages.md)
says why each step is there.

## 6.6 A release

```
push of a v* tag
   │
   ├─ tag      the tag and the manifests' one version agree
   ├─ gates    exactly the jobs CI runs (gates.yml), with no secret; each collects
   │           what it found, and the report job builds the release report and
   │           the release body from all of it, failing the run on its problems
   ├─ check    no workspace installed · the report, this run's, green and whole;
   │           the install job's tarballs, at the version, carrying their
   │           licence, byte for byte the ones the report says the install gate
   │           ran; the body, short enough for GitHub -- all pinned by SHA-256 ·
   │           then the SBOM: those tarballs installed by npm outside the
   │           checkout, no script run, cdxgen over that install, held to the
   │           report's packages and versions and to npm's lockfile of that
   │           install, and pinned
   ▼
publish    what was downloaded is, byte for byte, what check pinned, and the
           report this run's · the SBOM and the report signed, keyless · npm,
           with provenance · the GitHub release, with the body, the SBOM and
           the report and their signatures
```

[`.github/workflows/release.yml`](../../.github/workflows/release.yml), and
[`RELEASING.md`](../../RELEASING.md) for the steps a person takes. The report
is [0011](../decisions/0011-a-release-report-is-derived-from-the-run-that-gated-it.md)'s:
every run of the gates ends in one, a pull request's included; so is the
SBOM's making, from what a consumer installs rather than from the
workspace. A dispatch rehearses everything but `publish`. As of 17 October
2026 nothing had been released: 0.1.0 is ready to tag, and what a release
reads that only the maintainer can set is RELEASING.md's
[Before the first release](../../RELEASING.md#before-the-first-release).

## 6.7 The demo's browser gate walks the page

```
pnpm --filter @formancy/health-demo test:browser      after the packages are built
   │
   ├─ 1. vite build, first, so the page is React's production build, as deployed
   ├─ 2. the plan: the widths every stylesheet the page wears gives, from 320 px
   │     to a wide screen, each in one of the page's languages      (gate-page.mjs)
   │     and the corpus made in Node by the packages as built
   ├─ 3. vite preview under /health/, with scripts/demo-headers.mjs's headers
   │     for the address it serves at
   ├─ 4. each browser FORMANCY_BROWSERS chooses, Chromium, Firefox and WebKit
   │     unset (WebKit on Linux alone), headless, at the build the installed
   │     Playwright pins, launched by its name, one after the other
   ├─ 5. in it, a pass per width, in a context of its own: settled, then the
   │     head, the skip link, the journey with layout and axe at each state
   │                                                            (gate-journey.mjs)
   │     and what the page asked for and kept, and its policy and console,
   │     but what the browsers' table says the browser does of its own
   │                                           (gate-privacy.mjs, gate-facts.mjs)
   │     against what is planted: a markup sink, a fetch, and the page served
   │     again with an inline script and a /cdn-cgi/ script in its HTML; and
   │     the table's rows, each by its check: a page of one select
   ▼
apps/demo/test-results/browser-<browser>.json, one per browser, written
however the run ends
```

[`browser-test.mjs`](../../apps/demo/scripts/browser-test.mjs) is the
runner, as formancy.ai-report's Studio's is; CI runs it once per browser,
a leg of the `browser` job each, and the release report reads each leg's
file under its browser's key ([0012](../decisions/0012-a-demo-at-formancy-ai-health-fills-a-synthetic-referral-in-the-browser-served-by-a-worker-of-its-own.md), [0014](../decisions/0014-the-demos-browser-gate-runs-in-chromium-firefox-and-webkit-and-each-fact-the-browsers-disagree-on-is-named-and-held.md)).

## 6.8 A visit to the demo

```
a visitor opens formancy.ai/health/
   │
   ├─ 1. static files only -- index.html, one script, one stylesheet, the faces --
   │     each with scripts/demo-headers.mjs's headers for formancy.ai/health/;
   │     every face asked for at once; THIRD-PARTY-NOTICES.txt, if its link is followed
   ├─ 2. the build's modules: the corpus's sample, the letter's bytes, the facts
   ├─ 3. formancy's engine from the sample's answers, its capabilities constants
   ├─ 4. made once: the Questionnaire, the letter's two Bundles, the inputs refused
   │     on purpose, each by the package named beside it; the Questionnaire read
   │     out of its own bytes, in the page's language                  (read-out.ts)
   ├─ 5. an answer changed ─▶ engine.subscribe ─▶ the response and the CH ORF
   │     document made again from engine.value(), or every refusal said
   ├─ 6. a language chosen ─▶ a new engine, from the answers the old one held,
   │     and the Questionnaire read out again in that language
   ├─ 7. an item's way pressed ─▶ the control the engine names for its key
   │     scrolled to the middle of the window, and the keyboard on it;
   │     nothing written in the address
   ├─ 8. a download: the bytes shown, from memory, as a Blob's object URL
   ▼
closed or reloaded: the answers are gone, and none was sent
```

Every resource is made by
[`exports.ts`](../../apps/demo/src/exports.ts), which the build runs on
the sample too, holding what it makes to the corpus's entries before the
page is written ([§5](05-building-blocks.md#formancyhealth-demo-private-the-demo)).
The read-out reads those bytes and never the form, so it says what the
resource says
([0013](../decisions/0013-the-demo-reads-its-questionnaire-out-from-the-bytes-it-shows-and-renders-no-questionnaire.md)).
Nothing in it stores anything, writes what is typed into the address or
asks the network for anything after the page has settled: the policy
allows no connection, and the browser gate watches each of these. That
nothing in the page's own source reads a clock or a random source is a
search's, not a gate's
([0012](../decisions/0012-a-demo-at-formancy-ai-health-fills-a-synthetic-referral-in-the-browser-served-by-a-worker-of-its-own.md)).
