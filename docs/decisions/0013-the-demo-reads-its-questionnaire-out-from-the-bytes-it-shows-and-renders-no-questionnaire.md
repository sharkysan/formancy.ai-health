# 0013 — Read the demo's Questionnaire out from the bytes it shows, item by item in the page's language, each item leading to the field the form drew for it where formancy's renderer draws one with the id its engine mints; never from the form, and render no Questionnaire

- **Status:** accepted
- **Date:** 2026-10-18
- **Deciders:** Daniel Bacher
- **Verified by:** the demo's suite and its browser gate, which CI runs on
  every pull request. Each case was watched failing first on 18 October
  2026, its fault planted once and every file put back byte for byte, its
  SHA-256 compared before and after:
  - **`apps/demo/src/read-out.test.ts`** -- the read-out of the
    Questionnaires health-questionnaire, as built, makes of the demo's
    referral, the corpus's intake and its minimal form: every item in its
    order and nesting, by its linkId; its text in each of the page's
    languages, the resource's own where the page is in the resource's
    language and a translation extension's otherwise, and the resource's
    own, said to be and in the language the resource names, where it has
    no translation into the page's -- the intake has no English, the
    minimal form names no language, and the demo's title is untranslated;
    its type, whether it is required or repeats, and its options' displays
    beside their code systems and codes; every operator R4 has, as the
    intake writes them, each with the answer of its type, an option by its
    display, a decimal its digits as written; and the bytes, not the form:
    a text changed in the bytes is the text read out. A Questionnaire it
    cannot read whole is refused at the path where the reading stopped:
    no JSON, no Questionnaire; a member or an extension it does not know
    -- answers from a value set, an initial answer, a modifier extension,
    an expression that shows an item, an extension of a text other than a
    translation, a member of the resource, a condition, an option or its
    coding that the package does not write; an item type the package does
    not write, an operator R4 does not have; an answer of another type
    than its member names, a second answer or none, an operator given an
    answer it takes none of, `exists` and every ordering among them; a
    condition's option of another code system than its question's, or one
    its question does not offer; several conditions with no word for how
    they join, a word for joining one, or one R4 does not have; a
    condition on a question the resource does not hold, two items of one
    linkId; a `required` or `repeats` that is no yes or no, an item that is
    no object, an option with no code; and a translation of a text the
    item does not have, one with no text, a part other than its language
    and its text, or a second into one language -- each read in English,
    whichever language's translation is broken. Items nested deeper than
    the reading's recursion goes, which health-core's `readJson` reads,
    stop it at the root rather than throw. Failed with the translations
    ignored, any item type read, the nesting flattened, the bytes read
    with `JSON.parse`, and 27 faults planted in `read-out.ts` one at a
    time -- each refusal taken out or loosened, and a condition's option
    matched by its code alone, among them -- each failing its case but
    one, a translation's part with no url let through a check that the
    line after it makes all the same.
  - **`src/journey.test.tsx`**, **`src/read-out-view.test.tsx`** and
    **`src/failure.test.tsx`**, with axe -- under the Questionnaire's
    heading, every item named by the text the form gives its field, in the
    page's language and the form's order, as the reading of the bytes in
    the JSON region below it, and following a change of language; an
    item's linkId, its type in words beside its R4 code, whether it is
    required and whether it repeats, its options, and the condition that
    shows it, in words; the untranslated title marked with its language
    and said to be, and no title where the resource has none; nested items
    a heading level deeper inside their group's; every operator in words,
    a moment's ordering as a moment's; a condition's question and the
    option it names marked with their language, and a question with no
    text named by its linkId alone; each way to a field, pressed from the
    keyboard, scrolling the field to the middle of the window and then
    putting the keyboard on it with no scroll of the browser's own; a field
    a rule hides said not to be shown, with nothing to press, and led to
    again once shown; and a Questionnaire it cannot read said in its
    place, with no part of a form. Failed with the read-out in the form's
    language rather than the page's, the moments said as numbers, the
    nesting dropped, a text's language unmarked, an answered question
    said as unanswered, the hidden field still offered, the refusal drawn
    as an empty read-out, required and repeats drawn as no, the R4 code
    dropped, a condition's marks dropped, the title drawn where there is
    none, and the scroll dropped or left to the browser's focus.
  - **`src/engine.test.ts`** -- an item's way leads to the control
    formancy's engine names for the field of its key,
    `FieldSnapshot.ids.control`, and says whether the form shows it; to a
    key's one field under a group; none where two fields have the key, nor
    in a repeater's rows; and, measured on the DOM formancy 0.5.0's React
    renderer draws of a form of each field type and widget its spec has,
    containers included, only to the types and widgets it draws a control
    of that id for that takes the keyboard. Failed with the radio group led
    to, the list of the types it does not lead to that stood before it, a
    widget led to as its type, and the key matched at its path's first
    segment rather than its last.
  - **`src/words.test.ts`** -- in every language the read-out says it is
    read from the JSON below and not from the form, that the rest is in
    the JSON alone, a read-only or a hidden item's flag among it, that it
    is no FHIR renderer, validates nothing, and that Formancy Health draws
    no Questionnaire; the Questionnaire's step says its items are in the
    form's four languages and its title in one; the form's step says the
    form becomes the Questionnaire, its keys the linkIds; each way to a
    field is named by its visible words, then the field's (WCAG 2.2 SC
    2.5.3, Label in Name). Failed with the Italian step's sentence dropped,
    the French read-out saying it validates, and the English and French
    read-outs' and the English step's sentences as they stood before,
    which named neither flag and gave the title four languages.
  - **The browser gate's journey**,
    `apps/demo/scripts/gate-journey.mjs`, in every browser of
    `scripts/browsers.mjs`
    ([0014](0014-the-demos-browser-gate-runs-in-chromium-firefox-and-webkit-and-each-fact-the-browsers-disagree-on-is-named-and-held.md)),
    in every pass: the read-out names every item of the corpus's
    Questionnaire, read from its bytes by health-core's `readJson`, by
    the text the form's catalogue gives its field in the pass's language,
    in its order; each item's way, pressed from the keyboard, puts the
    keyboard on its field, the radio group having none; and that field
    and its label stand whole inside the window. Failed in every pass with
    the items reversed and the ways leading nowhere; the last check, with
    the way focusing the field alone, in every pass of WebKit 27.2 in
    Playwright's Linux image `v1.63.0-noble` and in two of Chromium's and
    Firefox's on Windows 11, and in every pass of Chromium there with the
    window scrolled to its foot after the focus.

  **Not mechanically enforced, and said:** the wording in each language,
  and the French and Italian, which no native reader has read; how a
  screen reader announces a named list item and a `<q>`, which no gate
  hears; and that the read-out's types, operators and words are R4's
  meaning, which review read against R4's Questionnaire page on
  18 October 2026.

## Context

- Asked of the demo as it went live: "the demo shows no forms?", and then
  "Questionnaire ist kein form?". The page drew the form, in formancy's
  React renderer, in every browser; beside it, the Questionnaire showed a
  line saying who made it, a button that opens its JSON and a download.
  Nothing on the page said that the Questionnaire is the form, as the
  HL7® FHIR® standard writes a form down, and a reader who did not open
  the JSON could not see it.
- Formancy Health exports: a formancy form becomes a Questionnaire
  ([0006](0006-a-formancy-form-is-an-sdc-questionnaire-refused-whole-where-it-cannot-be-one.md)),
  its key each item's linkId. It renders no Questionnaire; the plan names
  LHC-Forms and Helsenorge's renderer as other products, never as parts.
- The page's resources are the bytes `writeJson` wrote, the very ones its
  JSON region shows and its download saves; the first are the validator
  corpus's, byte for byte
  ([0012](0012-a-demo-at-formancy-ai-health-fills-a-synthetic-referral-in-the-browser-served-by-a-worker-of-its-own.md)).
- formancy 0.5.0's engine mints each field's ids, deterministic, as
  `FieldSnapshot.ids.control`, and its renderers draw a control with that
  id, which its own submit and error summary move the keyboard by. Its
  React renderer draws a radio group's and a set of tick boxes' options
  with ids of its own making, `<control id>:<value>`, and no element of
  the engine's id; a ranking's and a matrix's fieldset has the id and
  takes no focus; a file, a signature, a hidden field and a static text
  draw no control of it that does; and a group, a page and a repeater are
  no field of the engine's `fieldPaths` (read in its `dist` and measured
  in jsdom on 18 October 2026).
- A control's own `focus()` scrolls only as far as the control: with the
  way focusing the field alone, the browser gate found its label above
  the window in every pass of WebKit 27.2 in Playwright's Linux image --
  the control's top cut too, the question's at -10 to 50 pixels and its
  label at -36 to -16 at 320 pixels wide, and in one pass a field 2,397
  to 2,439 pixels above the window -- and in two of the eight passes of
  Chromium 156 and Firefox 157 on Windows 11, at 1025 and 1440 pixels
  wide, the question's label at -19 to 1 (18 October 2026).
- The page puts nothing in its address but the skip link's fragment,
  which the browser gate checks (0012).

## Decision

- **A read-out under the Questionnaire's heading, above its JSON.** Its
  title, then each item in its order and nesting: its text in the page's
  language, its linkId, its type in words beside its R4 code, whether it
  is required and whether it repeats, its options by their displays, and
  the conditions that show it -- the question by its text and linkId, the
  operator in words, the answer -- and how several join.
- **From the bytes shown, never from the form.**
  `apps/demo/src/read-out.ts`, a pure function of the bytes the JSON
  region holds, read by health-core's `readJson`, so a number is its
  digits (0004), and of the page's language. It reads what
  health-questionnaire writes, the members its `resource.ts` types and
  the extensions it writes, and refuses the rest whole -- a member or an
  extension it does not know among it -- at the path where it stopped,
  and the page then shows the JSON alone: no part of a form the resource
  may not say. A condition names an option by its code system and its
  code, as R4 matches a Coding.
- **The page's language, or the resource's own, said to be.** A text is
  the resource's own where the page is in the resource's language, a
  translation extension's where it has one into the page's, and
  otherwise the resource's own, marked with the language the resource
  names, `lang=""` where it names none, and said to be untranslated.
- **A way to each field, where there is one to lead to.** A button, not a
  link: it scrolls the control to the middle of the window and moves the
  keyboard to it by the engine's id, with no scroll of the browser's own,
  and puts nothing in the address. Only for the one input field whose key
  the linkId is, outside a repeater's rows, of a type, or a type with a
  widget, the renderer draws as a control of that id which takes the
  keyboard (`targetOf` in `apps/demo/src/engine.ts`): not a radio group or
  tick boxes, a ranking or a matrix, a file or a signature, a hidden field
  or a static text, nor a key two fields share, where a way would lead
  nowhere or be a guess. Where the form does not show the field, the item
  says so and offers nothing to press.
- **No Questionnaire renderer.** The read-out says, in each language, that
  it is read from the JSON below and not from the form, is no FHIR
  renderer and validates nothing, and that Formancy Health makes
  Questionnaires of formancy forms and draws none. The form's own step
  says that the form is what becomes the Questionnaire, each field an
  item, its key the item's linkId.

## Consequences

**What it buys.**
- A reader sees the Questionnaire as the form it is, in their language,
  without opening its JSON, and from each item reaches the field it came
  from, with its label in view.
- The read-out cannot drift from the resource: it is the resource's
  reading, and it reads nothing it passes over. A mapping that went wrong
  would show on the page as what the resource says, not as what the form
  meant.
- Every item type, operator, member and extension the package writes has
  its reading, and one it came to write stops the read-out of the
  corpus's Questionnaires in a test before any page shows half of it.

**What it costs.**
- **Not every fact.** The resource's canonical, version, status, profile
  and version algorithm, and an item's length, bounds, read-only and
  hidden flags and how often it may be answered, are in the JSON alone;
  the read-out says that the rest is there, the read-only and the hidden
  flag among it.
- **No way to the patient's language**, a radio group, nor to tick boxes,
  a ranking, a matrix, a file or a signature: formancy 0.5.0's React
  renderer draws none of them as a control of the engine's id that takes
  the keyboard, and the page does not guess at the ids it makes of its
  own. A renderer release that changes which do fails `engine.test.ts`,
  and the way follows. The demo's form has only the first.
- **Only what the package writes.** A Questionnaire of another maker's --
  another item type, an extension it relies on -- is not read out at
  all; the page shows only its own, so this is the boundary and not a
  gap.
- **Words in four languages**, translated, the French and Italian read by
  no native reader, like the rest of the page (0012).
- **The page's weight**: one chunk of 757.21 kB minified and 224.00 kB
  gzipped, as `vite build` (Vite 8.3.4) reported it on 18 October 2026,
  18.13 kB more than 0012 measured the same day, of which the source map
  gives `read-out.ts` 5.2 kB and `read-out-view.tsx` 4.2 kB, and the
  words in four languages most of the rest. `apps/demo/vite.config.ts`
  states the figures with the read-out.

**What it forecloses.**
- Reading the page's Questionnaire out of the formancy form.
- Rendering a Questionnaire, the demo's or any other, with a renderer of
  this repository's or someone else's in the page.
- A link that writes a field's id into the address.

## Alternatives considered

- **Reading the form out instead**, through formancy's engine or its
  catalogue, which the page already holds. Rejected: it would agree with
  the Questionnaire only while the mapping is right, and nobody would see
  the day it was not; the point of the panel is the resource.
- **Rendering the Questionnaire with a FHIR renderer**, LHC-Forms or
  Helsenorge's, beside formancy's. Rejected: two renderers of one form
  invite a reader to compare renderers, not to see the resource; it would
  bring another renderer's code, licence and network policy into the
  page; and it would blur what Health is, an export, with what those
  products are.
- **Saying it in a sentence and leaving the JSON as it was.** Rejected: a
  sentence that the Questionnaire is the form, beside a button, asks the
  reader to believe what the page could show.
- **Reading what it knows and passing over the rest.** Rejected: an
  extension that shows an item by an expression, or answers taken from a
  value set, read out as an item always shown with no options, is a form
  the resource does not say.
- **A link to `#<control id>`.** Rejected: it would write the id into the
  address, where the page writes nothing but the skip link's fragment,
  and the gate holds that.
- **The control's own `focus()` alone.** Rejected: it left the field's
  label above the window, in WebKit in every pass of the gate and in
  Chromium and Firefox in two.
- **formancy's own way to a field**, its `focusControl`, which first sends
  a `formancy-reveal` event to open a tab the field is in. Rejected: it
  is not among `@formancy/react` 0.5.0's exports, the event is its own
  and documented nowhere, and the demo's form has no tabs for it to open.
- **A way to a radio group by its options' ids**, `<control id>:<value>`.
  Rejected: an id the renderer makes of its own and documents nowhere is
  a guess that a renderer release can break without anything here
  failing but a button.

## Older records

- [0012](0012-a-demo-at-formancy-ai-health-fills-a-synthetic-referral-in-the-browser-served-by-a-worker-of-its-own.md)
  still decides the page; what it shows of the Questionnaire gains the
  read-out, and its figures for the page's weight are of the page before
  it. Read again and stamped
  (`node scripts/release-report/limitations.mjs --stamp 0012`), its
  Status line naming this record.
