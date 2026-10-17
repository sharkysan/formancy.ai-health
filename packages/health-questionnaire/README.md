# @formancy/health-questionnaire

A formancy form as a Structured Data Capture (SDC) 4.0.0 Questionnaire for
the HL7® FHIR® standard, R4 4.0.1: one item per field, with its key as the
linkId, its texts in the form's default language and translated into the
languages the host asks for. What the Questionnaire cannot say as the form
says it is refused, naming where, and the whole export with it: never a
part of one. No framework, no Node, no network. Decision
[0006](../../docs/decisions/0006-a-formancy-form-is-an-sdc-questionnaire-refused-whole-where-it-cannot-be-one.md)
says why each part is as it is, and what it costs.

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
context give the same resource, and `writeJson` the same bytes.

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
on another. `pattern`, `format`, `mask` and an `optionsSource` are refused.
A whole-number bound past R4's 32 bits is refused, never wrapped.

Rules: a `visible` rule is `enableWhen` where its CEL is a comparison of a
field at the top of the form, before the item, with a literal -- `==`,
`!=`, a list holding a value, a chain of those joined by one of `&&` or
`||`, or one ordering alone, written with its unanswered case, since
formancy shows a field whose rule cannot evaluate. A number literal keeps
its digits, and one of more than fifteen significant digits is refused,
since CEL compares the double nearest it and R4 the digits. A `skip` rule is the
page's `enableWhen`, negated. A `computed` field is `readOnly`, and never a
`calculatedExpression`. Every other rule, and every other expression, is
refused: no FHIRPath is written anywhere.

Not carried, because they say how a form looks and not what it collects:
widgets, layouts, a datagrid's columns, a repeater's button labels, an
option's picture. Nor `renamedFrom`. A translation is R4's `translation`
extension on the text's element; a text missing in a language asked for is
refused. The form's title is a plain string in `@formancy/spec` 0.5.0 and
is written untranslated.

## What it does not prove

That a Questionnaire conforms is the validator gate's to say (0005), and it
says it of the Questionnaires this package makes of the corpus's synthetic
forms: SDC 4.0.0 on R4 4.0.1, the HL7 FHIR validator 7.0.2, offline.
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
