# 0007 — Export a formancy submission as a QuestionnaireResponse walked from the Questionnaire's own mapping, its numbers exactly the doubles formancy holds, and refuse it whole where an answer cannot be one

- **Status:** accepted
- **Date:** 2026-10-17
- **Deciders:** Daniel Bacher
- **Verified by:** the tests of `@formancy/health-questionnaire` and
  `@formancy/health-core`, run by their `test:coverage` jobs in CI; the
  validator gate; guards in `pnpm test:repo`; the type-check; and the
  install gate:
  - **The answers**: `answers.test.ts` holds each mapped type's answer[x],
    a number answer written as its double's shortest text (`-0` included)
    and an integer one from its BigInt, a fraction and a value past 32 bits
    on an integer item refused, every value of the wrong type formancy's
    engine was measured to accept refused, an option not offered and one
    ticked twice, each bound, formancy's "no answer" in each of its forms,
    and a choice's coding without the option's translations.
    `enablement.test.ts` holds the reading of enableWhen the validator was
    measured to have; `response.test.ts` the resource's own elements and
    bytes, the canonical, the profile only where it validates, the host's
    references, the nesting of groups, pages and rows, the Questionnaire's
    order, every response item an item of the Questionnaire, names a form
    does not have refused unnamed, a value on a disabled item refused, a
    skipped page left out, empty rows, the required items of a completed
    response, and no answer quoted in any refusal of any kind.
    health-core's `numbers.test.ts` holds `compareNumbers`,
    `references.test.ts` `reference()`, `refusal.test.ts` the new rules.
  - **The corrections to 0006**: `conditions.test.ts` holds `!=` written
    with its unanswered case, refused under all, a list not holding a
    value refused, and a comparison with a text of nothing but whitespace
    refused; `items.test.ts` a repeater's `minItems`, and a computed rule
    on a field a visible rule can hide refused, and on a skipped page not.
  - **Conformance**, on the package's output: `node scripts/validator.mjs`
    judges the QuestionnaireResponses the package, as built, writes of the
    synthetic submissions in `scripts/validator/forms.mjs` -- an urgent and
    a routine intake and the minimal form's answers -- against their
    Questionnaires, which it loads as definitions, and refuses any of them
    for an error or an unregistered warning; and the package's responses,
    each with one thing this record refuses or leaves out put back -- an
    answer on an item a visible rule disables among them -- which the
    validator must refuse for exactly that. The routine intake answers an
    item that a `!=` and an ordering each enable by their unanswered case.
  - **The corpus covers the answers**: `scripts/validator/corpus.test.mjs`
    derives from the package as built every answer[x] it writes and
    whether it nests and repeats items, offering a pool of values as the
    answer to every field type it maps, and fails when the corpus's
    responses hold none of one; and it fails when a corpus response is not
    the package's.
  - **Exactness, from outside**: `scripts/exact-and-reproducible.test.mjs`
    walks the package's source, `answers.ts` and `enablement.ts` among its
    floor; `pnpm test:e2e:install` writes a response from the packed
    tarballs, finds the profile, the Questionnaire's canonical with its
    version and a decimal answer's digits in it, and catches the refusal
    of a fraction on an integer item as health-core's `Refusal`, at its
    path, quoting nothing.

  On 17 October 2026 each was watched failing, the file restored byte for
  byte after, by a script that planted one change at a time and ran the
  package's suite: a disabled value omitted rather than refused; a skipped
  page written; an empty row written; required unchecked on a question,
  and on a repeater; a repeater's maximum unchecked; names unchecked; a
  row's `_id` read as an answer; the profile claimed without a version;
  the canonical without its version; inherited names read as answers;
  answers that are no object read anyway; every status taken as complete;
  an author of any type; whitespace and an empty list taken for answers; a
  tick twice and an option not offered accepted; the count of ticks
  unchecked; every bound unchecked; every type unchecked; a static text's
  value dropped; -0 written `0`; an integer answer rounded; `!=` read as
  R5 words it; numbers compared as text; a coding compared without its
  system; all read as any; the option's translations copied into the
  response. In 0006's mapping: `!=` written without its unanswered case,
  allowed under all, and a list not holding a value written as `!=`; a
  repeater's minimum written as minOccurs, and one above one written. Five
  changes first failed nothing, which showed four tests missing -- a row's
  required fields in an empty row, a hidden repeater of padded rows, a
  field keyed `constructor`, an empty required list -- and one guard
  nothing could observe, the recording of a row's answer for conditions
  that never read one, which was taken out. The time's place in the
  context's narrowing failed `tsc` and no test, which holds it. In the
  guards: the urgent submission without its time answer and the corpus
  without two rows failed `corpus.test.mjs`, naming `valueTime` and
  repeated items; a `Number()` planted in `answers.ts` failed the
  exactness guard. In the gate, with the package's repeater minimum
  written again and a skipped page written, the validator refused both
  intake responses, `QUESTIONNAIRE_QR_ITEM_MIN_OCCURS` on every row and
  `Questionnaire_QR_Item_NotEnabled2` on the contact page; with `!=`
  written bare, the package itself refused the routine submission, its
  reading of the Questionnaire being the validator's.

  In review the same day, each new case was watched failing before its
  change: the computed rule on a field a visible rule can hide, exported
  read-only; the comparison with a text of two spaces, exported as an
  enableWhen. In the gate, the answer on an item a visible rule disables,
  expected to be accepted, failed it, refused for
  `Questionnaire_QR_Item_NotEnabled2` at that item and nothing else.

## Context

H05's acceptance, from the plan: answers for every mapped type validated;
missing, null and suppressed answers kept distinct; the exactness of
number answers established against `@formancy/spec` 0.5.0 and stated.

**What formancy holds.** `@formancy/spec` 0.5.0 types no submission. It
says what an answer looks like only in constants: a list type's empty
answer is `[]`, never null (`LIST_VALUED_FIELD_TYPES`); a date, a time
and a date and time have one fixed-width shape each (`TEMPORAL_SHAPES`);
a repeater's row carries its identity under `_id` (`ROW_ID`). The answers
are the engine's value, read on `@formancy/core` 0.5.0 on 17 October 2026
in a probe outside the repository:

- **An object by data path.** A group's answers in an object under its
  key, a repeater's rows in a list of objects each with `_id`, a page's
  beside it, since a page scopes no data. A field nobody touched is
  absent, or null once cleared.
- **The engine checks less than its own type checker assumes.** Its
  expression checker declares a text answer a string, a number a double, a
  checkbox a bool and a hidden field a string, as "what the engine already
  promises about the shape of a stored answer"; its validation holds a
  number to a number only when the field has a bound or a step, and then
  reports `min`, `max` or `step`, never a type. Validated without a
  complaint: `'abc'` in a number field, `42` in a text field, `'yes'` in a
  checkbox, `7` in a hidden field, a value under a static text, a key the
  form does not have, `2026-02-30` in a date field, the same tick twice,
  and on a step of one `2.0000001` and `3e9`. 0006 read that a number
  answer is a JSON number "(`@formancy/core` refuses any other)"; it does
  not, except as just said.
- **No answer** is `unanswered`: absent, null, a text that trims to
  nothing, an empty list; for a checkbox anything but true, since a
  required checkbox is a consent gate.
- **Hiding.** A visible rule that hides a field clears its value, even one
  handed in as the form's initial value. A skip rule hides a page's fields
  and keeps their values, so that going back finds them, and does not
  validate them. Measured in review the same day: a value set while a
  visible rule already hides its field stays, which no renderer does,
  since none offers a hidden field, but a host's `setValue` can; and a
  computed field is computed while hidden, so a name typed after the rule
  hid it puts the computed value into the submission, in a hidden group
  too, and the field shows none.
- **Lists in a rule.** A list field nobody touched is absent from the
  value and read as empty by a rule: `'a' in topics` is false. Set to
  null, the same rule cannot evaluate and its field shows.
- **What a computed rule stores** is its expression's value, of whatever
  type: a number in a text or a hidden field validates.
- **Rows.** A repeater is padded with empty rows to its `minItems`, and a
  required repeater of one empty row validates.

**What the HL7 validator does with a response**, measured with 7.0.2 on
Java 25.0.4.1 on 17 October 2026, with the gate's own command line, on
probe Questionnaires and responses outside the repository:

- **Every operator but `exists` asks whether some answer meets it.** An
  item enabled by `!=` with its question unanswered is disabled, and an
  answer to it refused, `Questionnaire_QR_Item_NotEnabled2`; `!= a` holds
  for the answers [a, b]. R4's own words for `!=` are garbled; R5's, "no
  answer is equal", say the opposite on both. Numbers compare by value:
  `= 2.50` holds for 2.5.
- **A repeating group's minOccurs is counted against the answers of each
  repetition**, which a group never has: two rows of a group with
  `questionnaire-minOccurs` 1 are refused twice,
  `QUESTIONNAIRE_QR_ITEM_MIN_OCCURS`, "this has 0 answers". Its maxOccurs
  is never exceeded: three rows against two pass.
- **Required.** A completed or amended response without a required
  item's answer is an error, an in-progress, stopped or entered-in-error
  one a warning; that issue's message id is its message, the linkId in
  it. A required item inside a group that is absent is not checked; inside
  an empty group item it is, and an empty row is
  `QUESTIONNAIRE_QR_ITEM_GROUP_REQUIRED`, "No sub-items found for required
  group". An item with neither an answer nor items passes.
- **Against the Questionnaire**: items out of its order, a linkId it
  lacks, an answer of another type than its item's, an answer to a display
  item, an option it does not offer, and a value past a bound it states
  -- decimal, integer, date and time, and a text's length -- are each an
  error. A coding's display is not compared. An empty item list is an
  error of the JSON.
- **SDC's response profile** with no subject warns, sdcqr-1; with a
  Questionnaire canonical without a version it passes, though SDC says the
  canonical "SHALL be the version-specific URL of the form".
- **It stops.** An answer of another type than its item's, on a question
  an enableWhen reads, ends the whole run with an exception, "Expected
  answer and actual answer have incompatible types", and no outcome for
  any file.
- **Two Questionnaires of one canonical**, one loaded as a definition and
  the other only validated: a response is judged against the definition.
- **Measured in review the same day**, on the package's own output: an
  answer on an item a visible rule disables is
  `Questionnaire_QR_Item_NotEnabled2`; a decimal answer in exponent
  notation, `1e+21`, `1e-7`, `5e-324` or `1.7976931348623157e+308`, and
  `-0`, pass; a text answer with leading or trailing whitespace is a
  warning, `Type_Specific_Checks_DT_String_WS`, whose message quotes the
  answer, and a line break in a `string` item's answer a warning with no
  message id, "The answer should not contain new line characters".

## Decision

`@formancy/health-questionnaire` exports `toQuestionnaireResponse(form,
answers, context)`, which answers `{ ok: true, questionnaireResponse }` or
`{ ok: false, refusals }`, never both and never a part of a response.

- **One reading of the form.** The form is mapped by the function
  `toQuestionnaire` uses, `mapForm`, which hands back the Questionnaire and
  each field beside the item it became; the response is walked from those
  items, in their order. Its linkIds, nesting, types, options and
  conditions are the Questionnaire's, and a form the mapping refuses
  refuses its answers with the mapping's refusals.
- **Identity from the host.** `context.questionnaire` is the context
  `toQuestionnaire` takes for that Questionnaire, and the response's
  `questionnaire` is that Questionnaire's url and, where it has one, `|`
  and its version, exactly. `status` is one of R4's five; `authored` a
  dateTime the host's clock gave; `subject`, `author` and `source`
  references by name, held by health-core's new `reference()` -- `Type/id`
  or a `urn:uuid:`, never an absolute URL, and an author or a source of a
  type R4 allows there. No id, identifier, item text, language or
  narrative is written: none is the submission's, and an item's text is
  the Questionnaire's, translated.
- **The profile**, `sdc-questionnaireresponse|4.0.0`, is claimed only with
  a subject and a versioned Questionnaire, where it validates and SDC's
  SHALL holds; any other response is plain R4.
- **Answers.** Each field's value is its item's answer[x]: a string for
  text, textarea and hidden; a boolean for a checkbox, false included; a
  decimal or an integer for a number; a date, a time with `:00` and a
  dateTime as formancy's shapes are; a choice as the coding of the
  Questionnaire's option -- system, code, display, without the display's
  translations -- and checkboxes as one item with an answer per tick, in
  formancy's order. A group's answers are its item's items, a page's too,
  and a repeater's rows an item each of its linkId; a row's `_id` is not
  carried.
- **A number is the double formancy holds.** A decimal answer is written
  as the shortest text that reads back as that double -- ECMAScript's own
  for every double but -0, which is `-0` -- so the response holds exactly
  the value formancy stored, and no digit it did not. An integer item's
  answer is written from its BigInt, and refused when it is not whole
  (`grammar`, never rounded) or past R4's 32 bits (`range`).
- **Refused, every refusal at once, at a path from `answers` and never a
  value**, with health-core's `Refusal` and seven new rules: `answer-type`
  (another type than the item's, or a value where the item takes none),
  `option` (no option has it, or a tick twice), `bound` (past a bound the
  item states, compared as formancy compares: the same doubles and
  fixed-width texts, a text's length in UTF-16 units), `unknown` (a name
  its form gives no answer, refused at the object that holds it, the name
  never repeated), `disabled`, `required` and `reference`; and the
  primitives' `grammar`, `calendar` and `range`.
- **Missing, null and suppressed.** No answer is formancy's `unanswered`,
  but a checkbox's false, which is an answer; an item with none is not
  written, nor a group, a page or a row with nothing answered in it.
  Whether an item is enabled is its enableWhen, read as the validator
  reads it, over the answers written before it. A value on an item a skip
  rule's page disables is left out: formancy keeps it and neither shows
  nor validates it. A value on an item a visible rule disables is
  refused, `disabled`: formancy's engine clears it when the rule hides
  it, and no renderer offers a hidden field, so one there was set while
  it was hidden, by a host and not through a form, or the two readings of
  the rule disagree, and only a refusal would say which. A computed
  field's value, which formancy holds there in the ordinary course, never
  reaches this: the mapping refuses the form (below). A formancy `hidden`
  field is not suppressed: its value is the answer of its
  `questionnaire-hidden` item, which SDC lets carry one; whether a
  national profile wants it is that pack's to say.
- **Required.** A completed or amended response answers every enabled
  required item, a required repeater with a row that holds an answer, and
  the required fields of each row it writes; one that does not is refused.
  Other statuses write what there is.
- **Corrections to 0006's mapping**, which it marks superseded in those
  parts. A `!=` -- as written, or a skip rule's negated equality -- is
  written with its question's unanswered case beside it, `exists` false,
  under any, as 0006 writes an ordering; under all it is refused, since
  "this, and that differs or is unanswered" is a nesting enableWhen has
  not; and a list not holding a value, a skip rule's negated `in`, is
  refused, since `!=` on a repeating question means "some answer differs"
  to the validator. A repeater's `minItems` is no longer
  `questionnaire-minOccurs`: one, on a required repeater, is what
  `required` already says of a repeating group; above one it is refused.
  Found in review: a computed rule on a field a visible rule can hide,
  the field itself or a group or a repeater around it, is refused, as
  0006 refuses `clearOnHide` off there, since formancy computes it while
  hidden and keeps the value, which R4 gives a disabled item no answer
  for -- on a page a skip rule walks past it is left out with the rest;
  and a comparison with a text of nothing but whitespace is refused, since
  formancy holds such a text and shows what it enables, and its
  `unanswered`, which the response follows, reads the text as no answer.

## Consequences

**What it buys.**
- **Responses the validator has judged against their Questionnaire**,
  written by the package: every answer type it writes, groups, pages and
  rows, a value on a skipped page left out and one on a visible-rule item
  refused. The claim names SDC 4.0.0, R4 4.0.1, the validator 7.0.2 and
  the corpus, and nothing more.
- **A response that cannot disagree with its Questionnaire**: one mapping,
  one walk, one reading of each condition, and that reading the
  validator's.
- **Exactness stated, and held.** A number answer is the double formancy
  holds, written so that it reads back as that double; nothing here adds
  or removes a digit.
- **Faults in 0006 found by the first answers**: a `!=` an unanswered
  question disabled, a repeater minimum no response could meet, and, in
  review, a computed field a visible rule hides, and a comparison with
  whitespace, whose submissions formancy makes and no response could
  carry.

**What it costs.**
- **The exactness is the double's.** formancy holds a number answer as a
  JSON number, so a person's `70.50` is 70.5 before anything here sees it,
  and a value of more significant digits than a double keeps was rounded
  by the time it was stored. The response says what formancy stored, not
  what was typed; a host that wants the typed text must keep it, and
  nothing here can take it.
- **Answers a formancy server would store are refused**: a value of
  another type than the field's -- a computed rule's number in a text or
  a hidden field among them -- a date the calendar lacks, a tick twice,
  a fraction or a value past 32 bits on a step of one, a name the form
  does not have, a value on a visible-rule item -- each validates on
  `@formancy/core` 0.5.0. A host with such a submission gets refusals, and
  formancy's server is not changed by this record. A question refused
  is unanswered to the conditions after it, so a value on an item it
  would have enabled is refused as `disabled` beside it.
- **What the validator only warns of is written.** A text answer with
  leading or trailing whitespace, or a line break in a `string` item's
  answer, is written as formancy holds it: nothing here trims or drops a
  character. The validator warns, quoting the answer in the first
  warning's message; the corpus holds neither, and the gate would refuse
  one until the warning was registered.
- **What a skipped page holds is dropped from the response**, with no
  refusal and nothing in the result naming it: the response says the page
  is disabled, and that is all. A disagreement between formancy's and R4's
  reading of a skip rule would go unseen there.
- **An empty list and null are one** in the response, as R4 has no empty
  answer; formancy tells them apart for a rule (`'a' in topics` is false
  against `[]` and untouched, an error against null) and not for
  `required`. So a value on an item that rule enables, with the list set
  to null, is refused as `disabled`, though formancy showed the item. A
  text of nothing but whitespace is no answer, as formancy's `unanswered`
  reads it, though formancy stores it.
- **formancy's `unanswered` is restated here**, since `@formancy/core` is
  not a dependency (0006); nothing fails when formancy's next release
  changes it. The next adoption of `@formancy/*` must read it again.
- **Questionnaires change.** Every Questionnaire with a `!=` is written
  with one more condition than 0006 wrote, under the same version number
  a host gave; forms 0006 exported are now refused -- a `!=` under `&&`, a
  skip rule of `||` or of a list holding a value, a repeater minimum above
  one, a computed field a visible rule can hide, a comparison with a text
  of nothing but whitespace. A host that keeps a Questionnaire 0006 wrote
  holds one whose `!=` the validator reads otherwise than formancy.
- **A repeating group's maximum is not checked by the validator**, which
  counts answers there too; the package refuses rows past it, and only
  the package's tests show that.
- **Required is formancy's in a group**: a required field of a group that
  holds nothing is refused, where the validator would not look. A
  completed response cannot leave one out, which a formancy submission
  never could either.
- **A response that is not complete is not judged.** Missing a required
  answer, an in-progress, stopped or entered-in-error response is a
  warning whose id is its message, with the linkId in it; registering it
  would accept every such warning of one linkId, so the corpus has no such
  response, and the gate shows nothing about one.
- **The corpus avoids what stops the validator**: its wrong-typed answer
  is on a question no enableWhen reads, since one on a question an
  enableWhen reads ends the whole run. A package regression that wrote
  such an answer would stop the gate, loudly, rather than be judged.
- **The empty row is matched by a message used as an id**, with the
  linkId in it; a validator release that rewords it fails the gate.
- **A row's `_id` is not carried**: rows are in the submission's order, and
  a receiver that wants formancy's row identity has nothing to read it
  from.
- **A subject's type is held to a form, not to R4's list of types**:
  `Patiant/1` is a reference here.
- **The hand-built response stays** in the corpus beside the package's,
  inside the hand-built Bundle, until H06 builds one.
- **The gate's time.** With the package cache kept, the gate over this
  corpus of twenty-three resources took 24.3 seconds of validator on Java
  25.0.4.1 (17.8 loading, 4.5 validating) and 28.1 on Java 17.0.4 (20.7
  and 4.9), on 17 October 2026 under Windows 11. The first run that day,
  on Java 25 and a corpus one answer short of this one, took 296.5, 4
  minutes 15 seconds of it loading and 39 validating, as 0006 saw twice,
  cause unknown; the next, on the same corpus, 23.4. In review the same
  day, with the answer on a disabled item added and the routine intake's
  weight note, twenty-four resources, the gate took 23.1 and 27.5 seconds
  of validator on Java 25.0.4.1 (17.1 and 19.5 loading, 4.3 and 5.6
  validating) and 30.1 on Java 17.0.4 (22.2 and 5.5). A CI runner has not
  been measured with this corpus.

**What it forecloses.**
- A response that reads a form otherwise than its Questionnaire does: a
  second mapping of a field to an answer, here or in a country pack.
- A number answer written from anything but the double formancy holds,
  until formancy holds something else.
- A partial response, an answer guessed from a value of another type, a
  value rounded to fit an integer.

## Alternatives considered

**Omit a value on an item a visible rule disables**, as R4 gives it no
answer. Simpler, and no refusal for a host. Rejected: formancy's engine
clears such a value when the rule hides it, so one there was set while it
was hidden, which no form a person fills does, or comes of a reading of
the rule that disagrees with formancy's, and omitted, neither would ever
be found.

**Omit a computed value on an item a visible rule disables**, rather than
refuse the form. Every such form would export, and its responses would
carry what R4 allows. Rejected: it is the case 0006 refuses for
`clearOnHide` off, a value formancy keeps on a hidden field, and leaving
it out here would be the one place a value on a visible-rule item goes
silently, with any disagreement in the rule's reading going with it.

**Refuse a value on a skipped page.** Consistent with the above.
Rejected: formancy keeps it by design, so that a person going back finds
what they typed, and every submission whose answers changed the route
would be refused.

**Read `!=` as R5 words it** in the response. It is what 0006 assumed.
Rejected: the validator reads it otherwise, and refuses answers R5's
reading writes; writing the unanswered case makes both readings agree
with formancy's, and costs a condition.

**Keep a repeater's minItems as questionnaire-minOccurs**, which is what
the extension means. Rejected: the validator counts it against each
repetition's answers, so no response to the Questionnaire would validate.

**A number answer from text the host supplies**, so that `70.50` keeps its
zero. Rejected for now: formancy stores a double, so the host has no such
text from formancy; a submission that carried both would be two answers
to one question with no rule for which wins.

**The response's items with their text.** SDC marks it must-support.
Rejected: the Questionnaire's text, in every language asked for, is the
text; a copy in one language could disagree with it, and the validator
refuses one that does.

**A `suppressed` list in the result**, naming the paths left out.
Rejected: the Questionnaire already says which items the answers disable,
and a second account of it is a second place to disagree.

**`@formancy/core` as a dependency**, to read "no answer" and visibility
as formancy's engine does. Rejected: the response must agree with the
Questionnaire, whose conditions are R4's, and the engine's CEL is
another reading; and the engine is a dependency for one function.

**R4's data-absent-reason on an answer for null.** Rejected: formancy's
null is no answer, not an answer whose value is missing for a reason.
