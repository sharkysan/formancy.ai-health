# 0006 — Export a formancy form as an SDC Questionnaire, field by field, and refuse it whole where an item cannot say what the field says

- **Status:** accepted; its mapping of `!=`, of a repeater's `minItems`, of a computed field a visible rule can hide and of a comparison with whitespace superseded by [0007](0007-a-formancy-submission-is-a-questionnaireresponse-of-the-same-mapping-refused-whole-where-an-answer-cannot-be-one.md)
- **Date:** 2026-10-17
- **Deciders:** Daniel Bacher
- **Verified by:** the tests of `@formancy/health-questionnaire`, run by
  its `test:coverage` job in CI; the validator gate; guards in
  `pnpm test:repo`; and the install gate:
  - **The mapping**: `items.test.ts` holds each field type's item, each
    refused type, and each property written, refused or not carried, and
    reads `@formancy/spec`'s own `FIELD_TYPES` at run time: each is one
    item, or refused at its type, and exactly version 1's five are refused;
    `conditions.test.ts` each visibility and skip rule written as
    `enableWhen`, each refused, and a decimal literal past a double's
    digits refused; `texts.test.ts` the translations and
    their refusals, a default locale that is no language tag among them;
    `questionnaire.test.ts` the resource's own elements,
    its bytes through `writeJson`, the refusal of an unknown spec version
    and of a form formancy's validator refuses, a language asked for that
    is no language tag, and that no refusal of any kind quotes a value,
    over values shaped like a person's; `cel.test.ts` what is read of a
    rule's CEL and what is not. health-core's `strings.test.ts` holds
    `language()` to the tags the validator was measured to accept and
    refuse. `questionnaire.test.ts` also fails when `@formancy/spec`'s
    `SPEC_VERSIONS` is not the list this package maps.
  - **Conformance**, on the package's output: `node scripts/validator.mjs`
    judges the Questionnaires the package, as built, makes of the
    synthetic forms in `scripts/validator/forms.mjs` -- a spec 4 form in
    Swiss German with French and Italian, and a spec 1 form -- against SDC
    4.0.0 on R4 4.0.1, and refuses either for an error or an unregistered
    warning; and four Questionnaires of the package's, each with one
    thing this record leaves out put back, which the validator must refuse
    for exactly that.
  - **The corpus covers the mapping**: `scripts/validator/corpus.test.mjs`
    derives from the package as built every field type, item type and
    rule kind it maps, offering each of `@formancy/spec`'s in a form of
    one field, and every enableWhen operator and answer type it writes,
    offering every operator and a pool of literals to each mapped field
    type as a rule's question, and fails when a corpus Questionnaire holds
    none of one; it also
    fails when the intake is not translated into every language its
    context asks for, and when a corpus Questionnaire is not the package's.
  - **Exactness, from outside**: `scripts/exact-and-reproducible.test.mjs`
    walks the package's source (its floor names two of its files);
    `pnpm test:e2e:install` exports a form from the packed tarballs, writes
    it with health-core's `writeJson`, finds the profile, the version
    algorithm, a decimal bound's digits and a translation in it, and
    catches a refusal as health-core's `Refusal`.

  On 17 October 2026 each was watched failing, the file restored byte for
  byte after: in the package, an unknown spec version read as mapped; the
  version algorithm left out; every number a decimal; an integer bound
  wrapped to 32 bits; a time without its seconds; a missing translation
  filled from the default language; an ordering without its unanswered
  case; a question on a skipped page read; `clearOnHide: false` not
  refused; `minOccurs` on an item not required; an option coded without a
  system; a computed field not read-only; a message read off a catalogue's
  prototype; formancy's validator not asked; a skip rule not negated; an
  ordering inside a chain; a pattern left out; a required static text and
  a required checkbox exported; a signature exported as text; a question
  after the item it enables read; a language asked for twice translated
  twice; a status R4 does not have. Removing the number tokenizer's
  lookahead failed nothing, which showed the grammar already refuses what
  it guarded against, and it was taken out. In the gate, the two warnings
  registered here, each unregistered in turn, refused the intake. In the
  guards: the test matrix without the package, `codecov.yml` without its
  component, a `Number` and a `Date.now()` planted in the package's
  source, the compatibility table stale, a corpus form without its `time`
  field and without its skip rule, and the intake translated into one
  language fewer. And the install gate failed on a dist that dropped
  translations. That no FHIRPath is written is held by the mapping
  writing none and by review: nothing searches the output for one, beyond
  the computed-field case, which does.

  In review the same day, four gaps were found and closed, each watched
  failing first and every file restored byte for byte. A default locale
  or a language asked for was held only as a FHIR code, so `Deutsch`,
  `de_CH` and `de-ch` were exported, and the validator refuses each as a
  Questionnaire's language, with errors; the new tests failed until
  `language()` existed, and health-core's again with its pattern's case
  loosened. A decimal literal kept digits CEL does not: the case failed
  until the literal was held to fifteen significant digits, and again with
  either bound moved by one. The gate had judged no enableWhen with a
  string, integer, date, time or dateTime answer, nor `<`, `<=` or `>`:
  the corpus guard failed naming exactly those until the intake held one
  of each, and the gate then accepted the intake. And the case reading
  `FIELD_TYPES` failed on a planted `ranking` dropped without a refusal;
  the sweep of refusals on an option's value planted in its path, and on
  formancy's own message planted in one.

## Context

H04 is the first package output: a formancy form as an SDC Questionnaire.
Its acceptance, from the plan: every version 1 row of section 8.1 produces
a Questionnaire the validator accepts against SDC 4.0.0; every refused row
refuses with a diagnostic naming the field; an unknown spec version is
refused; linkId stability decided; translations for de-CH, fr and it.

The plan's table was a proposal. Read on 17 October 2026 against
`@formancy/spec` 0.5.0 as installed (its `dist` declarations, its JSON
Schema and its README), formancy.ai at `v0.5.0` for the semantics the
types do not state, `@formancy/core` 0.5.0 run on a probe form, R4 4.0.1's
and SDC 4.0.0's packages as the gate registers them, and the validator's
own verdicts on prototypes:

- **The form has no version.** `FormSchema` is `specVersion`, `id`,
  `title`, `model`, `logic`, `i18n` and `layouts`. A version's identity is
  formancy's server's: `form_versions.version`, an integer counting from
  one per form, unique with the form, and the content hash `schemaHash`
  (formancy.ai 0026). SDC 4.0.0's sdc-2 refuses a version without
  `artifact-versionAlgorithm`, and its sdc-3 prefers `semver`, as a
  warning.
- **A form's id is "the form's stable identifier"**, `[A-Za-z0-9][A-Za-z0-9._-]*`,
  at most 128 characters. Its `name` would have to match cnl-0's
  `^[A-Z]([A-Za-z0-9_]){1,254}$`, which an id need not.
- **A field's key is its identity "forever"** (formancy.ai 0011): a rename
  is declared with `renamedFrom`, and keys are unique "across the whole
  form, not just within the container", which formancy's validator
  holds. A key is at most 64 characters, `[A-Za-z_][A-Za-z0-9_]*`; SDC's
  que-15 allows a linkId 255, and R4's que-2 asks them unique.
- **Field types**: spec 1's text, textarea, number, checkbox, select,
  radio, date, hidden, static, group, page, repeater; spec 2's
  selectboxes, time, datetime, file, richtext; spec 3's signature; spec
  4's ranking and matrix. Each spec version is a superset of the one
  before, and 0.5.0 reads 1 to 4.
- **Numbers are doubles.** `min`, `max` and `step` are `number`, and a
  number answer is a JSON number (`@formancy/core` refuses any other).
  There is no integral flag: only a step says which numbers count,
  "counted from `min` when there is one, and from zero when there is
  not", compared with a tolerance of a millionth of a step.
- **Times.** A date is `YYYY-MM-DD`; a time `HH:MM`, "no seconds, no
  zone"; a datetime `YYYY-MM-DDTHH:MM:SSZ`, "always UTC". R4's time is
  `hh:mm:ss`. So a formancy datetime never lacks its zone, and the plan's
  refusal of one that does has nothing to refuse in a form.
- **Options** have a value and a label and no code system. SDC's
  sdc-base-2 says "If code exists, system must exist"; offline, the
  validator warns of a code without one, `TERMINOLOGY_TX_SYSTEM_NO_CODE`:
  "A code with no system has no defined meaning".
- **Texts** are a string or a reference into the message catalogues; the
  default locale's has every message, the others "may be partial", and
  formancy's renderers fall back to the default text a message at a
  time. No region falls back to its language (`resolvedLocale`). The
  form's title is a plain string, with no translation at all.
- **Rules** are CEL. Measured on `@formancy/core` 0.5.0 with
  `@marcbachmann/cel-js` 8.0.0: an unanswered field is null, so
  `x == 'a'` is false and `x != 'a'` true; an ordering on null is an
  error, and a visibility rule that errors shows its field ("Fail OPEN");
  a field inside a group is read through a map that may lack it, an error
  too. A skip rule that errors does not skip. A skipped page hides its
  fields without clearing them, so rules still read their values.
- **`required`** is `unanswered` in `@formancy/core`: the same as R4's for
  most fields, but "a required checkbox is a consent gate: only an actual
  tick satisfies it", and a group is answered by any object.
- **R4 and the validator**, measured offline on prototypes: R4 4.0.1's
  item-control code system has no `page` ("Unknown code 'page' in the
  CodeSystem 'http://hl7.org/fhir/questionnaire-item-control' version
  '4.0.1'"); `questionnaire-minOccurs` is refused on an item that is not
  required (`Profile_EXT_Not_Here`); an `enableWhen` whose question comes
  after its item is a warning with no message id ("The target of this
  enableWhen rule ... comes after the question itself"); a code system
  under `http://example.org` is an error; and `Questionnaire.language`,
  a BCP 47 tag, is a warning, `TERMINOLOGY_TX_WARNING`, where a
  translation's `lang` is information.
- **Language tags, measured in review** with the gate's own command line
  on Questionnaires the package made: as `Questionnaire.language`, `de-CH`,
  `it-CH`, `gsw`, `rm`, `zh-Hant-TW`, `sr-Latn-RS`, `de-CH-1996`, `zh-yue`
  and `de-ZZ` passed, and `Deutsch`, `french`, `abcd`, `de_CH`, `de-ch`,
  `DE-ch`, `en-gb`, `zh-hant`, `en-US-u-ca-gregory`, `x-private`,
  `i-klingon`, `sgn-CH-DE`, `zz` and `qaa` were each an error,
  `INVALID_DISPLAY_NAME`, repeated at every coded element whose display the
  validator reads in that language, with `Terminology_TX_NoValid_16` beside
  some. The validator reads case BCP 47 ignores, and knows subtags: `zz`
  is well-formed and refused. A translation's `lang` was information for
  every one of them, `french` and `de_CH` included: offline, nothing in the
  gate checks it. formancy names a catalogue with any text of two to
  thirty-five characters.
- **R4's operators are worded wrongly.** R4 4.0.1's own code system says
  `>` is "True if whether at least no answer has a value that is greater
  than the enableWhen answer", and so for `<`, `>=`, `<=` and `!=`; read
  as written, `>` would mean "none greater". R5 rewords them: "at least
  one answer" for an ordering, "no answer ... equal" for `!=`. The mapping
  reads R4 as R5 words it, which is what the operators are for.
- **A CEL number literal is a double.** On `@formancy/core` 0.5.0,
  `weight == 0.30000000000000001` shows its field for an answer of 0.3:
  the literal is read as the double nearest it.
- **formancy's validator is not its engine.** `validateSchema` accepts a
  field keyed `if`, `as`, `let` or `int`, and a rule reading it; the
  engine refuses to build such a form ("'if' is a reserved name", "'int'
  is already registered"), and formancy's publish gate builds one.

## Decision

`@formancy/health-questionnaire` exports `toQuestionnaire(form, context)`,
which answers `{ ok: true, questionnaire }` or `{ ok: false, refusals }`,
never both and never a part of a Questionnaire.

- **Reading.** A spec version other than 1 to 4 is refused first and
  alone, at `form.specVersion`: nothing about such a form's meaning is
  known. Then formancy's own `validateSchema` decides what the form is,
  and each of its errors is a refusal at its path. Then every field, rule
  and text is mapped or refused, and every refusal is returned at once.
- **Refusals are health-core's `Refusal`**, which gains four rules for
  what an input says and a resource cannot -- `version`, `invalid`,
  `unmapped`, `missing` -- and a `language` for a text missing in one, so
  that a host branches on one class across every package. A path starts
  at `form` or `context` and walks the form's property names and indices;
  no message holds a value.
- **Identity from the host.** `url` is the host's canonical base,
  `/Questionnaire/` and the form's id: a name, never fetched
  (formancy.ai 0077). `version` is the number formancy published this
  version as, with the `artifact-versionAlgorithm` extension and the
  algorithm `integer`, which is how formancy's numbers order; sdc-3's
  preference for semver is registered with that reason. No `name`, no id,
  no date: none is the form's, and none is made here.
- **linkId is the field's key.** formancy's key is stable enough: it is
  the answer's identity in formancy itself, unique across the form, and
  changed only by a declared rename. No upstream identity is proposed.
- **The profile**: every Questionnaire claims
  `http://hl7.org/fhir/uv/sdc/StructureDefinition/sdc-questionnaire|4.0.0`,
  versioned, which the gate holds on every one the corpus has the package
  write.
- **Items.** The mapping of section 8.1, as corrected in the plan: one
  item per field in the model's order; `number` an `integer` with a step
  of one from a whole minimum, a `decimal` without a step, refused with
  any other; options as codings in a code system named
  `<Questionnaire.url>/<field key>`; a page a plain `group`; a time bound
  with `:00`; a number bound from its double's shortest text, a whole one
  from its BigInt, held to 32 bits. Refused: `signature`, `ranking`,
  `matrix`, `richtext` and `file`; `pattern`, `format`, `mask`,
  `optionsSource`; `required` on a checkbox, group, page or static text;
  `minItems` above zero on an item that is not required; an empty
  container; a static text without its text; and `clearOnHide: false` on a
  field a rule can hide. Not carried: widgets, layouts, a datagrid's
  columns, a repeater's button labels, an option's picture, `renamedFrom`.
- **Rules.** A `visible` rule is `enableWhen` where its CEL is a
  comparison of a field at the top of the submission, before the item and
  on no page a skip rule walks past, with a literal of its type: `==`,
  `!=`, `'v' in list`, or a chain of those under one of `&&` (`all`) or
  `||` (`any`); or one ordering alone, written with `exists` false under
  `any`, so that it shows unanswered as formancy does. A decimal literal
  is written as its digits, and refused where a double does not keep them
  -- more than fifteen significant digits, or a first one past the 307th
  place after the point, where a double is subnormal -- since CEL compares
  the double nearest it and R4 the digits; up to fifteen, the literal is
  the shortest text of that double, and the two agree. A `skip` rule is
  the page's `enableWhen`, negated, `&&` and `||` swapped. A `computed`
  field is `readOnly`. Every other rule kind, and every other expression,
  is refused: SDC states them in FHIRPath, and none is written.
- **Translations.** The texts are the default catalogue's, and the
  Questionnaire says its language. Every language -- the form's default
  locale, and each the host asks for -- is held by health-core's
  `language()`: a BCP 47 tag of a language, script, region and variants,
  each in its canonical case, which is what the validator was measured to
  read, and refused as `language-tag` otherwise. Each language the host asks for is R4's
  `translation` extension on every text's element -- an item's text, an
  option's display. **A text missing in a language asked for is refused,
  not omitted**: a reader who asked for French and is shown one German
  question among French ones may answer what they did not understand, and
  nothing in the resource would say that item was not translated;
  formancy's fallback happens in front of a reader who can see the page
  change language. The title, a plain string, is written untranslated.
- **No narrative.** A Questionnaire is written without `Resource.text`:
  its items are what a renderer shows, and a narrative made of them would
  be a second rendering of the same texts that could disagree with them
  and that nothing checks. dom-6 stays registered, with that reason.
- **The corpus stays in `scripts/validator/`.** The plan's
  `health-corpus` package, which 0005 expected with this record, is not
  made: a workspace package changes the lockfile, and the corpus still
  needs no dependency of its own -- it reads the packages as built. It
  arrives when it needs one, Report's renderer for H06's PDFs.

## Consequences

**What it buys.**
- **A Questionnaire the validator has judged**, for every construct the
  package maps, written by the package itself: the claim names SDC 4.0.0,
  R4 4.0.1, the validator 7.0.2 and the corpus, and nothing more.
- **One reading of a form.** What a form is, is formancy's validator's to
  say, and what its rules do was measured on formancy's engine; what is
  mapped is what that engine and R4 say the same, and where they would
  disagree, the export says so rather than choose.
- **Refusals a host and an author can act on**: every one at once, each a
  rule and a path, in one class with health-core's.
- **Nothing computed.** No calculated item, no FHIRPath, no clinical logic
  in the mapping (plan 15.2).

**What it costs.**
- **Forms refused that formancy publishes.** A field with a pattern, an
  email or URL format, a mask, a step other than one, a sourced option
  list, a required checkbox; a rule that validates, checks, requires,
  disables, reads a grouped field, reads one that comes after, or orders
  inside a chain: each refuses the whole export until the author changes
  the form. That is the price of never exporting a constraint the
  Questionnaire would not keep.
- **A rename is a new item.** A key changed with `renamedFrom` is a new
  linkId in the next Questionnaire version; answers already exported keep
  their version's linkId, and mapping them across is the host's, with
  formancy's diff. Nothing here carries the rename.
- **A page is an item.** formancy calls a field moved to another page no
  change at all, since a page scopes no data; here a page is a group, so
  the same move puts the item, with its unchanged linkId, under another
  group in the next version, and its answer under another in a
  QuestionnaireResponse. A receiver that finds an answer by its linkId
  alone sees no change; one that walks the nesting does.
- **Bounds are doubles.** A bound written `0.10` in a form's JSON is 0.1
  before this package sees it, and is written as 0.1. Answers are doubles
  too in 0.5.0, which H05 must say.
- **An integer item is stricter than formancy's step.** formancy accepts
  2.0000001 on a step of one, within its tolerance; R4's integer does not,
  so such an answer is refused when the answers are exported (H05), never
  rounded. An integer field with no bounds can take answers past 32 bits,
  refused there as well.
- **An empty row.** formancy counts a repeater with an empty row as
  answered; R4's required repeating group needs an answer in one. A
  submission like that cannot be exported as answers that validate (H05).
- **Option systems nobody publishes.** `<url>/<key>` names a code system
  no CodeSystem resource defines; the validator says so, as information,
  and a receiver cannot look the codes up. A host whose base is under
  `http://example.org` gets systems the validator refuses. A country pack
  that requires coded answers in a national code system must refuse these.
- **A version is the host's word.** Nothing checks that the version a host
  gives is the one formancy published this form as, nor that the content
  is that version's: `schemaHash` is not carried.
- **Warnings accepted by id, across the corpus.** `TERMINOLOGY_TX_WARNING`
  is registered for `Questionnaire.language` and sdc-3 for the integer
  algorithm, and the register accepts each wherever the corpus raises it:
  a `TERMINOLOGY_TX_WARNING` about another code, or sdc-3 on a
  Questionnaire that should have used semver, would pass unseen. Review of
  #3 named that cost of matching by id; it grows with each id registered.
- **A language is held to its form, not to the registry.** `language()`
  refuses `de_CH`, `Deutsch` and `de-ch`, but `zz` and `qaa` have the form
  and are exported; the validator refuses either as `Questionnaire.language`,
  and as a translation's `lang` nothing offline checks either. A host must
  name languages in their canonical case, `de-CH`, though BCP 47 ignores
  case, because the validator does not; and a form whose catalogue is
  named otherwise is refused until its author renames it.
- **A form formancy's engine refuses is not refused here.** This package
  reads a form with `validateSchema` and does not depend on
  `@formancy/core`; a field keyed with a word CEL reserves, read by a rule,
  is exported, though formancy's publish gate would refuse the form.
- **What the validator only warns of is exported.** A text with leading or
  trailing whitespace (`Type_Specific_Checks_DT_String_WS`) or a control
  character (`UNICODE_XML_BAD_CHARS`), which formancy allows in a label or
  a title, is written as it is: nothing here trims or drops a character.
  The gate would refuse such a Questionnaire until the warning was
  registered, and no corpus form holds one.
- **A skipped page keeps its answers.** On `@formancy/core` 0.5.0 the
  engine's value keeps what was typed on a page a skip rule then walks
  past (measured in review); R4 drops a disabled item's answers. The
  Questionnaire says the page is disabled; the answers' export (H05) must
  not carry what it holds.
- **The title is not translated**, because formancy 0.5.0 cannot hold a
  translated title. A French reader sees the default language's title.
- **Presentation is lost**: widgets, layouts, the screens of a paged form.
  A renderer of the Questionnaire draws it its own way.
- **The gate's time.** With the package cache kept, a run over this
  corpus of sixteen resources took 23 to 26 seconds of validator on Java
  25.0.4.1 and 27.5 on Java 17.0.4, on 17 October 2026 under Windows 11,
  17 to 21 of them loading and about 4 validating, where 0005 measured
  about 2 validating its smaller corpus. Two runs that day, one on each
  Java, took 300.9 and 277.7 seconds, more than four minutes of it
  loading in each, cause unknown, as 0005 saw one of 69. In review the
  same day, with the intake's five more conditions, the gate took 23.3
  seconds of validator on Java 25.0.4.1 (16.5 loading, 4.4 validating)
  and 29.3 on Java 17.0.4 (22.2 and 5.2); two runs before them, on Java 25,
  took 315.2 and 300.6, with 4 minutes 30 and 4 minutes 19 seconds
  loading and about 40 validating, while the whole machine was slow --
  the cache's packages were unchanged, and a plain `find` over them
  stalled too. A CI runner has not been measured with this corpus.

**What it forecloses.**
- An SDC `calculatedExpression`, `enableWhenExpression` or any FHIRPath
  written by this package, until a record admits a FHIRPath engine.
- A partial Questionnaire, a guessed translation, a guessed version or
  name.
- A second mapping of a field to an item anywhere else: a country pack
  profiles this package's output and does not remap a field.

## Alternatives considered

**Omit a missing translation.** formancy's own behaviour, and fewer
refusals. Rejected for the reason above: a Questionnaire gives no signal
that one item is in another language.

**The content hash as the version.** `schemaHash` is formancy's identity
of a version's content, and needs nothing from the host. Rejected: a
version algorithm says how two versions order, and no code of R5's
version-algorithm code system orders hashes; a FHIRPath algorithm is
refused here.

**Semver from formancy's number**, `3.0.0` for version 3, which sdc-3
prefers. Rejected: it would claim that a change of major means a breaking
change, which formancy's number does not say; formancy's diff classifies
changes, and its number only counts them.

**A name from the form's id.** Rejected: an id need not match cnl-0, and
rewriting it into one is a second identity two forms could share.

**The data path as linkId**, `address.city`, `items[].qty`. Rejected: the
key is already unique across the form, and the data path changes when a
field moves into a group, which formancy calls a removal and an addition
but which need not change what is asked.

**`valueString` options**, which need no system. Rejected: the stored
value would be the only text, and the label a person reads lost.

**SDC's `page` item control.** Proposed by the plan. Rejected: R4's code
system lacks it, and the validator refuses it.

**SDC's `regex` extension for a pattern, a format or a mask.** Rejected:
formancy's pattern is a JavaScript regular expression, its formats and
masks its own checks, and the extension states no dialect; a translation
nobody checked would be an approximation.

**Map every comparison, ordering included, as it reads.** Simpler.
Rejected: formancy shows a field whose ordering cannot evaluate, R4 hides
it, and the two would disagree on every untouched form.

**A CEL engine to read rules.** Rejected: no dependency is needed to read
the few rules enableWhen can say, and anything an engine could evaluate
beyond them is still refused.

**A diagnostic type of this package's own.** Rejected: a host would match
two shapes for one question, and health-core's `Refusal` already holds
the rule and the path without the value.

**A language tag held to BCP 47's grammar alone, in any case.** What RFC
5646 calls well-formed. Rejected: the validator refuses `de-ch` and
`en-gb` as a resource's language, and an extension or a private use, so a
tag that grammar admits would be exported and refused.

**A language tag held to the IANA registry.** It would refuse `zz` too.
Rejected for now: the registry is data this repository would copy and
keep current, under its own terms, and no record admits it.

**A decimal literal written as the shortest text of its double.** It would
always agree with CEL. Rejected: it converts a value through a JavaScript
number, which no package source does (0004), and `2.50` would lose the
zero its author wrote; refusing the few literals past fifteen digits costs
less.

**A page flattened into its fields**, so that moving a field between pages
changes nothing here either. Rejected: a skip rule would then be a
negated `enableWhen` on each of the page's fields, and the page's title,
which a reader of a paged form reads, would have no item to stand on.
