# @formancy/health-core

The core of Formancy Health: the release of the HL7® FHIR® standard every
resource the module writes is written for, FHIR R4's primitives held to
their types, and FHIR JSON written and read without losing a digit. No
framework, no Node, no network, and no production dependency.

```ts
import { FHIR_VERSION, dateTime, decimal, readJson, writeJson } from '@formancy/health-core'

FHIR_VERSION // '4.0.1': R4, with its technical correction

const json = writeJson({
  resourceType: 'Observation',
  status: 'final',
  effectiveDateTime: dateTime('2026-10-17T10:00:00+02:00', 'Observation.effectiveDateTime'),
  valueQuantity: { value: decimal('70.50', 'Observation.valueQuantity.value'), unit: 'kg' },
})
// {"resourceType":"Observation","status":"final","effectiveDateTime":"2026-10-17T10:00:00+02:00","valueQuantity":{"value":70.50,"unit":"kg"}}

writeJson(readJson(json)) === json // true: every digit, every name in its place
```

## The FHIR version

`FHIR_VERSION` is written as R4's FHIRVersion code system writes it, the
form a `CapabilityStatement` states its release in, and its type is the
literal `'4.0.1'`, not `string`. It is independent of this package's npm
version: it changes only when the module writes for another FHIR release,
and that is a breaking change.

## Numbers are their digits

FHIR R4 says a decimal's precision is part of its value: "0.010 is
regarded as different to 0.01". A JavaScript number keeps neither a
trailing zero nor more than about seventeen significant digits. So a FHIR
number here is a `FhirNumber`: its type and its text, checked once when it
is made, and never a JavaScript number.

| Function | Admits |
| --- | --- |
| `decimal(value, path)` | R4's decimal grammar, which is JSON's number grammar: `0.10`, `-0.0`, `1E+2` and a thirty-digit value, each kept as written |
| `integer(value, path)` | -2147483648 to 2147483647 |
| `positiveInt(value, path)` | 1 to 2147483647 |
| `unsignedInt(value, path)` | 0 to 2147483647 |

`value` is a string or a bigint. A JavaScript number is refused: by the
time it arrives, 0.10 is 0.1 and 2^53 + 1 is 2^53, and nothing can tell.
Build a decimal from the text your form or database gave you. An integer
type admits what both R4's regex and JSON's number grammar admit: no
leading `+`, no `-0`, no exponent. Ranges are compared as BigInt.

`FhirNumber.text` is the text; `isFhirNumber(value)` tells one from any
other object, a Questionnaire item with a `type` and a `text` included.
`compareNumbers(a, b)` answers -1, 0 or 1 as R4 compares two numbers, by
value and exactly: `2.5` and `2.50` are equal, `-0` and `0` too, and 2^53 +
1 is greater than 2^53, which a double cannot tell. It is for reading what
a number means -- an enableWhen and the answer it compares -- and never
for writing one, which keeps its text.
`JSON.stringify` of a `FhirNumber` throws rather than write an object
where the number was: FHIR JSON is written by `writeJson`.

## The other primitives are checked strings

`date`, `dateTime`, `instant`, `time`, `id`, `code`, `uri` and `uuid`
each take a string and a path and return it unchanged, typed as what it
was checked as (`FhirDateTime` and so on), or refuse it.

- **date, dateTime, instant, time** to R4's regexes, and a real day on the
  calendar. A dateTime with a time, and every instant, needs its zone: one
  without is refused as `zone`, and never given a default.
- **id** as R4 gives it: letters, digits, `-` and `.`, at most 64.
- **code** as R4's words give it: no leading, trailing or doubled
  whitespace, single spaces between words.
- **uri** as R4's permissive regex gives it, and not empty. Nothing else of
  RFC 3986 is checked, and nothing is ever fetched.
- **uuid** as `urn:uuid:` and a lowercase UUID, as R4 requires; an
  uppercase one is refused, not lowercased.

`language(value, path)` is a code that is also a BCP 47 language tag, as
R4 binds every language to: a language of two or three letters, then a
script, a region and variants, each in the case RFC 5646 gives it --
`de-CH`, `gsw`, `zh-Hant-TW`. It is refused as `language-tag` otherwise:
`de_CH`, `Deutsch`, an extension or a private use, and `de-ch`, which BCP
47 would accept and the HL7 validator refuses as a resource's language
([0006](../../docs/decisions/0006-a-formancy-form-is-an-sdc-questionnaire-refused-whole-where-it-cannot-be-one.md)).
Whether a subtag is registered is not checked: `zz` passes.

`reference(value, path, types?)` is a reference by name, as a host
supplies one: `Patient/7`, a resource type and R4's id, which the receiver
resolves against its own base, or a `urn:uuid:` inside the Bundle that
carries both; of one of `types` where R4 allows only some. An absolute URL
is an address, and refused as `reference`, as is a version-specific or a
contained reference. That a type it allows anywhere is one R4 has is not
checked: `Patiant/1` has the form.

Nothing here makes an identifier, an id or a timestamp: identity is the
host's to supply, and no source in the package reads a clock or a random
source.

## Bytes are base64Binary

R4's `base64Binary` is "a stream of bytes, base64 encoded (RFC 4648)": an
attachment's data, a Binary's, a hash. Bytes are a `Uint8Array`, the type
every engine has, without Node's Buffer or the DOM's atob.

- `toBase64Binary(bytes, path)` writes them in RFC 4648's one canonical
  spelling, standard alphabet and `=` padding, as a `FhirBase64Binary`. A
  value that is no Uint8Array is refused as `not-bytes`, a string of a
  PDF's text included, and no bytes at all as `empty`, since FHIR JSON
  carries no empty string.
- `base64Binary(value, path)` checks a text is that spelling: whole
  quanta, padding at the end and nowhere else, the bits it leaves zero, no
  whitespace. R4's regex is informative and leaves `/` out of the
  alphabet; it is not the rule here.
- `fromBase64Binary(value, path)` reads the bytes back, after the same
  check: a reader lenient about a spelling would read bytes nobody wrote.

Health-document writes a PDF's bytes and its SHA-1 with it
([0008](../../docs/decisions/0008-a-document-is-a-bundle-of-what-it-refers-to-and-a-pdf-its-own-bytes-never-an-unproved-pdf-a.md)).

## A host's context, read

What a host hands over is read the same way by every package
([0009](../../docs/decisions/0009-a-ch-orf-document-is-the-hosts-referral-in-ch-core-and-ch-orf-the-questionnaire-by-canonical-and-swiss-identifiers-checked-here.md)):
`valueAt(holder, name)` is an object's own property and never one it
inherits; `needed(holder, name, path, refusals, make)` is `make` of it, or
`absent` when there is none, a null handed to `make`, which refuses it;
`optional(...)` is undefined when the host gives none; `text(value, path)`
is a string with something in it but whitespace, refused as `absent`
otherwise, and with no character a resource cannot carry -- the same
ones a narrative refuses, below -- refused as a string's `grammar`;
`codeOf(allowed)` is a code of R4's required binding, refused as
`unmapped` when it is not one of `allowed`. `known(holder, names, path,
refusals)` reads an object for `names` and no others: refused as
`absent` when it is no object, an array included, and once as `unmapped`
when it holds a member `names` does not name, which is not repeated;
`objectAt(...)` is the object a holder holds under a name, read so.
`readItems(list, path, read)` reads every index of a list, a hole's
too, which `map` walks past: a host's array may have one, and JSON never
does. health-document reads a document's context with them,
health-questionnaire a Questionnaire's and a response's, and health-ch a
CH ORF document's.

## Text in a narrative

`xhtmlText(value, path)` is a host's text as the content of an XHTML
element, as a narrative R4 calls "Limited xhtml content" carries it: `&`,
`<` and `>` written as `&amp;`, `&lt;` and `&gt;`, and nothing else
changed. What XML 1.0 cannot carry at all -- a control character but the
tab, the line feed and the carriage return, a surrogate alone, U+FFFE and
U+FFFF -- is refused as `grammar` of the type `xhtml`, by the one rule
`text` holds a host's string to. R4 says only that a string "SHOULD not"
hold the control characters; a surrogate alone UTF-8 cannot encode. It
writes and never reads: no markup is ever taken from a host.
health-document writes a Composition's narrative with it (0009).

## writeJson and readJson

`writeJson(value)` writes FHIR JSON: numbers from their digits, unquoted;
strings as `JSON.stringify` escapes them; names in the order the object
gives them, never sorted; no whitespace. The same value gives the same
bytes. It refuses, naming the path from `$`:

- a JavaScript number, undefined, a function, a symbol, a bigint, a Date or
  any object that is not plain data, and a value that contains itself;
- a getter, which is refused unrun, a hidden or symbol-named property, a
  hole in an array, a proxy that throws;
- what FHIR JSON forbids: an empty object, array or string, a null except
  as an array's item, and a name that is a whole number, which JavaScript
  would move to the front of the object.

`readJson(text)` reads FHIR JSON with a parser of its own, not
`JSON.parse`, which reads every number into a double and keeps the last of
two properties of one name. Every number it reads is a `FhirDecimal` with
its source text, since an element's type is not known without its
definition; narrow one with `integer(number.text, path)`. It refuses what
`writeJson` refuses, a name given twice, and text that is not JSON, with
the offset. Both walk with their own stack, so nesting costs memory and
never throws a RangeError.

## Refusals

Every refusal is a `Refusal`, an `Error` with a `rule` to branch on
(`grammar`, `range`, `calendar`, `zone`, `javascript-number`, `not-json`,
`not-data`, `empty`, `null`, `digit-name`, `duplicate-name`, `cycle`,
`syntax`, `language-tag`), the `path`, the FHIR `type` for a primitive, and the `offset`
for text. Its message is made of those and nothing else: it never quotes
the value, which may be a person's.

The packages that map an input to a resource refuse with the same class,
so a host branches on one: `version`, an input in a version of its format
nothing reads; `invalid`, one its own format's validator refuses;
`unmapped`, something the resource cannot say as the input says it; and
`missing`, a text the resource needs and the input lacks, with the
`language` it is missing in
([0006](../../docs/decisions/0006-a-formancy-form-is-an-sdc-questionnaire-refused-whole-where-it-cannot-be-one.md)).
A submission's answers are refused with seven more: `answer-type`, a
value of another type than its item takes; `option`, one no option has,
or chosen twice; `bound`, past a bound its item states; `unknown`, a name
its form gives no answer, whose refusal names the object holding it and
never the name, which is the submission's and not the form's; `disabled`,
an answer to an item the other answers disable; `required`, a required
item a completed response leaves unanswered; and `reference`
([0007](../../docs/decisions/0007-a-formancy-submission-is-a-questionnaireresponse-of-the-same-mapping-refused-whole-where-an-answer-cannot-be-one.md)).
A document is refused with eight of its own: `not-bytes` and `not-pdf`,
bytes that are not bytes or not a PDF by its first and last lines;
`unproved`, a PDF profile no gate here has proved; `absent`, something the
resource needs from the host and was not given; `dangling`, a reference
to a resource the Bundle does not hold; `unreferenced`, an entry the
Composition does not reach; `duplicate-entry`, a second entry of one
name; and `mismatch`, an attachment whose size, hash or media type is not
that of the bytes it carries or names
([0008](../../docs/decisions/0008-a-document-is-a-bundle-of-what-it-refers-to-and-a-pdf-its-own-bytes-never-an-unproved-pdf-a.md)).
A country's profiles refuse with four more: `identifier`, an identifier
not of the form its system gives it, or one under a system whose
identifiers are taken only by their own name; `check-digit`, one whose
check digit its other digits do not give; `profile`, a resource the
document carries that is not of the type, or does not claim the profile,
its place asks for; and `unversioned`, a definition named by its
canonical without the version it was answered against
([0009](../../docs/decisions/0009-a-ch-orf-document-is-the-hosts-referral-in-ch-core-and-ch-orf-the-questionnaire-by-canonical-and-swiss-identifiers-checked-here.md)).
`reference` covers a type the guide a resource is written for does not
allow, as well as R4.
A path repeats the names of the
document it passed through, element names in FHIR JSON; text that is not
FHIR JSON may use anything as a name, and the path carries it.

`Refusals` collects the refusals of one export, so that every package
answers with all of them at once or with the resource: `add(rule, path)`
records one, `take(make)` records what a primitive refuses inside `make`
and throws on anything else, which is a bug. `member(path, name)` and
`item(path, index)` write a path as `writeJson` writes one --
`context.entries[2].resource.subject`, a name that is not plain quoted in
brackets -- so that every package's refusals name where in one form.

## What it does not do

It does not hold XML Schema's limits, which R4 applies to a JSON decimal:
a thirty-digit value and `1E+400` are kept as written. It does not refuse a
lone surrogate in a string, a string past R4's 1 MB, or a null in an array
where it lines nothing up, an array of resources or datatypes included. It
types no resource yet. Decision
[0004](../../docs/decisions/0004-fhir-json-is-written-and-read-exactly-with-primitives-of-its-own.md)
says why, and what each costs.

HL7, FHIR and the FHIR [FLAME DESIGN] are the registered trademarks of
Health Level Seven International and their use does not constitute
endorsement by HL7.

Source-available, not open source: see [`LICENSE.md`](../../LICENSE.md).
