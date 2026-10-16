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

Nothing here makes an identifier, an id or a timestamp: identity is the
host's to supply, and no source in the package reads a clock or a random
source.

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
`syntax`), the `path`, the FHIR `type` for a primitive, and the `offset`
for text. Its message is made of those and nothing else: it never quotes
the value, which may be a person's. A path repeats the names of the
document it passed through, element names in FHIR JSON; text that is not
FHIR JSON may use anything as a name, and the path carries it.

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
