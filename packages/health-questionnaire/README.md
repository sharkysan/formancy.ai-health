# @formancy/health-questionnaire

A formancy form as a Structured Data Capture (SDC) 4.0.0 Questionnaire for
the HL7® FHIR® standard, R4 4.0.1: one item per field, with its key as the
linkId, its texts in the form's default language and translated into the
languages the host asks for; and a submission of it as a
QuestionnaireResponse to that Questionnaire. What a resource cannot say as
the form or the submission says it is refused, naming where, and the whole
export with it: never a part of one. No framework, no Node, no network.
Decisions
[0006](../../docs/decisions/0006-a-formancy-form-is-an-sdc-questionnaire-refused-whole-where-it-cannot-be-one.md)
and
[0007](../../docs/decisions/0007-a-formancy-submission-is-a-questionnaireresponse-of-the-same-mapping-refused-whole-where-an-answer-cannot-be-one.md)
say why each part is as it is, and what it costs.

```ts
import { writeJson } from '@formancy/health-core'
import { toQuestionnaire } from '@formancy/health-questionnaire'

const result = toQuestionnaire(form, {
  base: 'https://forms.example.ch/fhir', // a name, never fetched
  version: '3', // the number formancy published this version as
  status: 'active',
  languages: ['de-CH', 'fr', 'it'],
})

if (result.ok) send(writeJson(result.questionnaire))
else for (const refusal of result.refusals) log(refusal.rule, refusal.path, refusal.language)
```

The form is read through `@formancy/spec` 0.5.0, as formancy defines it:
a spec version this package does not map (it maps 1 to 4) is refused
first and alone, and a form formancy's own validator refuses is refused at
each of its errors' paths. A refusal is health-core's `Refusal`: a `rule`
(`version`, `invalid`, `unmapped`, `missing`, or a primitive's, such as
`range`), a `path` from `form` or `context` (`form.model.fields[2].step`),
the `language` a text is missing in, and a message made of those and never
of a value. Every refusal is returned at once.

## What the host supplies

| `context` | Becomes |
| --- | --- |
| `base` | `Questionnaire.url`: the base, `/Questionnaire/` and the form's id; and, under that url, each choice field's code system, `<url>/<field key>` |
| `version` | `Questionnaire.version`, with the version algorithm `integer`, which SDC's sdc-2 asks for beside a version: the number formancy's server published this version as, as text or a bigint. Absent, there is neither |
| `status` | `Questionnaire.status`: `draft`, `active`, `retired` or `unknown` |
| `languages` | a translation of every text into each, beside the form's default language; each a BCP 47 tag in its canonical case, `de-CH` and never `de-ch` or `de_CH`, as health-core's `language()` holds it, and so must the form's default locale be, which becomes `Questionnaire.language` |

Nothing is made here: no id, no date, no publisher. The same form and
context give the same resource, and `writeJson` the same bytes. A member
the context does not name -- a publisher, a title -- is refused as
`unmapped` at the context, its name not repeated, and a context that is
no object as `absent`, by health-core's `known`
([0009](../../docs/decisions/0009-a-ch-orf-document-is-the-hosts-referral-in-ch-core-and-ch-orf-the-questionnaire-by-canonical-and-swiss-identifiers-checked-here.md)).

## The mapping

| formancy | Questionnaire item |
| --- | --- |
| `text`, `textarea`, `hidden` | `string`, `text`, `string` with `questionnaire-hidden` |
| `number` | `integer` when its step is one from a whole minimum; `decimal` without a step; refused with any other step |
| `checkbox` | `boolean` |
| `select`, `radio`; `selectboxes` | `choice` with a coding per option, its value the code and its label the display; `selectboxes` repeats |
| `date`, `time`, `datetime` | `date`, `time` (a minute, `HH:MM:00`), `dateTime` (UTC, as formancy stores it) |
| `static` | `display` |
| `group`, `page`; `repeater` | `group`; `repeater` repeats |
| `signature`, `ranking`, `matrix`, `richtext`, `file` | refused in version 1 |

Beside its type: `required` is `required`, except on a checkbox (a consent
gate only a tick satisfies, where R4 takes false for an answer), a group, a
page and a static text, where it is refused. `maxLength` is `maxLength`;
`minLength`, `min`, `max`, `earliest` and `latest` are R4's `minLength`,
`minValue` and `maxValue` extensions; `maxItems` is `questionnaire-maxOccurs`, and
`minItems` above zero `questionnaire-minOccurs` on a required item, refused
on another. A repeater's `minItems` is not `questionnaire-minOccurs`, which
the HL7 validator counts against each row's answers, so that no response
would validate: one, on a required repeater, is what `required` says
already, and one above is refused. `pattern`, `format`, `mask` and an
`optionsSource` are refused.
A whole-number bound past R4's 32 bits is refused, never wrapped.

Rules: a `visible` rule is `enableWhen` where its CEL is a comparison of a
field at the top of the form, before the item, with a literal -- `==`,
`!=`, a list holding a value, a chain of those joined by one of `&&` or
`||`, or one ordering alone. An ordering is written with its unanswered
case, since formancy shows a field whose rule cannot evaluate, and so is a
`!=`, which formancy holds for an unanswered field and the validator does
not; under `&&` a `!=` is refused, since its unanswered case cannot be
nested there. A number literal keeps
its digits, and one of more than fifteen significant digits is refused,
since CEL compares the double nearest it and R4 the digits. A `skip` rule is the
page's `enableWhen`, negated, with the same refusals: a list holding a
value, negated, is refused. A comparison with a text of nothing but
whitespace is refused, since formancy shows what it enables and the
response, reading formancy's "no answer", never writes such a text. A
`computed` field is `readOnly`, and never a `calculatedExpression`; on a
field a visible rule can hide it is refused, as `clearOnHide: false` is
there, since formancy computes the field while it is hidden and keeps the
value. Every other rule, and every other expression, is refused: no
FHIRPath is written anywhere.

Not carried, because they say how a form looks and not what it collects:
widgets, layouts, a datagrid's columns, a repeater's button labels, an
option's picture. Nor `renamedFrom`. A translation is R4's `translation`
extension on the text's element; a text missing in a language asked for is
refused. The form's title is a plain string in `@formancy/spec` 0.5.0 and
is written untranslated.

## The answers

```ts
import { writeJson } from '@formancy/health-core'
import { toQuestionnaireResponse } from '@formancy/health-questionnaire'

const result = toQuestionnaireResponse(form, engine.value(), {
  questionnaire: context, // what toQuestionnaire was given for this form
  status: 'completed',
  authored: '2026-10-17T10:00:00+02:00', // the host's clock, never read here
  subject: { reference: 'Patient/7' }, // a name, never an address
})

if (result.ok) send(writeJson(result.questionnaireResponse))
else for (const refusal of result.refusals) log(refusal.rule, refusal.path)
```

The answers are formancy's submission, the value its engine holds: a
group's answers in an object under its key, a repeater's rows in a list,
each with formancy's `_id`, a page's beside it. The response is walked from
the Questionnaire's own items, so its linkIds, nesting, types, options and
conditions are the Questionnaire's; a form `toQuestionnaire` refuses
refuses its answers with the same refusals.

| `context` | Becomes |
| --- | --- |
| `questionnaire` | `QuestionnaireResponse.questionnaire`: `url\|version` of the Questionnaire `toQuestionnaire` writes with it, or its url alone when it has no version |
| `status` | `in-progress`, `completed`, `amended`, `entered-in-error` or `stopped`; a completed or amended response must answer every enabled required item |
| `authored` | a FHIR dateTime, with its zone where it has a time |
| `subject`, `author`, `source` | references by name, `Patient/7` or a `urn:uuid:`, never an absolute URL; an author or a source of a type R4 allows there |
| `profiles` | `meta.profile`, after SDC's: canonicals the response claims beside it, each a uri, each once -- a country's response profile, such as CH ORF's, which the validator holds a response to only when it claims it |

The SDC QuestionnaireResponse profile, `sdc-questionnaireresponse|4.0.0`,
is claimed with a subject and a versioned Questionnaire, where it
validates; the host's `profiles` are claimed after it, or alone where it
is not
([0009](../../docs/decisions/0009-a-ch-orf-document-is-the-hosts-referral-in-ch-core-and-ch-orf-the-questionnaire-by-canonical-and-swiss-identifiers-checked-here.md));
any other response is plain R4. No id, identifier, item text or
narrative is written: an item's text is the Questionnaire's. A member of
the context, of its `questionnaire` or of a reference it does not name
-- an `encounter`, a `basedOn`, a reference's display -- is refused as
`unmapped` where it stands, its name not repeated, and a context that is
no object as `absent`, as `toQuestionnaire` refuses its context's.

| formancy holds | The response writes |
| --- | --- |
| a text, a textarea's, a hidden field's | `valueString`, as it is |
| a number | `valueDecimal`, the shortest text that reads back as the double formancy holds, `-0` included; on an integer item `valueInteger`, refused unless whole and within 32 bits |
| a checkbox's true or false | `valueBoolean` |
| a select's, a radio's value; checkboxes' ticks | `valueCoding`, the Questionnaire's option's system, code and display, without its translations; a tick each, in formancy's order |
| a date, a time, a date and time | `valueDate`; `valueTime`, `HH:MM:00`; `valueDateTime`, in UTC |
| a group's object; a repeater's rows; a page's fields | the item's items; an item per row, of the repeater's linkId; the page's items |

**A number answer is exactly the double formancy holds.** formancy stores
a JSON number, so `70.50` typed is 70.5 before this package sees it; what
is written reads back as the same double, with no digit added or lost, and
not the text a person typed.

**No answer** is formancy's own: absent, null, a text of nothing but
whitespace, an empty list. Such an item is not written, nor a group, a page
or a row with nothing answered in it; a checkbox left false is answered
false. **A value on a disabled item**, read as the validator reads the
Questionnaire's enableWhen: on a page a skip rule walks past, formancy
keeps it, and it is left out; on an item a visible rule hides, formancy
clears it when the rule hides it, so one there was set while the item was
hidden, and is refused, as `disabled`. A text answer is written as
formancy holds it: leading or trailing whitespace, and a line break in a
`text` field's answer, which is a `string` item, are kept, and the
validator warns of each, quoting the answer in the first warning.

Refused, every one at once, at a path from `answers` and never quoting a
value: `answer-type`, a value of another type than its item's -- formancy's
engine accepts `'abc'` in a number field with no bound, `42` in a text
field, `'yes'` in a checkbox; `option`, a value no option has, or a tick
twice; `bound`, past `min`, `max`, `earliest`, `latest`, `minLength`,
`maxLength`, `minItems` or `maxItems`; `unknown`, a name the form gives no
answer, refused at the object that holds it and never repeated;
`disabled`; `required`; `reference`; and a primitive's `grammar`,
`calendar` or `range` -- a fraction on an integer item, which formancy's
step admits within its tolerance, a date the calendar lacks, a whole
number past 32 bits.

## What it does not prove

That a Questionnaire or a response conforms is the validator gate's to say
(0005), and it says it of the Questionnaires this package makes of the
corpus's synthetic forms, and of the responses it makes of the corpus's
synthetic submissions, each against its Questionnaire: SDC 4.0.0 on R4
4.0.1, the HL7 FHIR validator 7.0.2, offline. Every corpus response is
complete: an incomplete one is a warning the gate cannot register by
linkId, and is judged nowhere.
Offline, a translation's language is not checked there at all, the
Questionnaire's own only as far as the validator's built-in reading of a
tag goes, and the code systems of the options not at all; a tag here is
held to its form, and an unregistered one, such as `zz`, is exported and
refused by the validator.

The form is read with formancy's validator, and not with its engine,
which this package does not depend on: a form the engine would refuse to
build -- a field keyed with a word CEL reserves, such as `if` or `int`, read
by a rule -- is exported all the same, though formancy's publish gate,
by `@formancy/core` 0.5.0's own account of `engineRefusal`, refuses it.
Nothing here checks that a form computes no clinical result: a
customer's form is the customer's (plan 15.2).

HL7, FHIR and the FHIR [FLAME DESIGN] are the registered trademarks of
Health Level Seven International and their use does not constitute
endorsement by HL7.

Source-available, not open source: see [`LICENSE.md`](../../LICENSE.md).
