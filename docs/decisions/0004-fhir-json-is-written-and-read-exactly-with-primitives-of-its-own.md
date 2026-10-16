# 0004 — Write and read FHIR JSON exactly, with primitive types of this package's own, held as checked text

- **Status:** accepted
- **Date:** 2026-10-17
- **Deciders:** Daniel Bacher
- **Verified by:** the tests of `@formancy/health-core`, run by its
  `test:coverage` job in CI, a guard in `pnpm test:repo`, and the install
  gate:
  - **Exactness**, release gate G3's evidence: `exactness.test.ts`. Every
    value of a corpus a double cannot hold as written -- `0.10`, `-0.0`,
    `1E+2`, thirty-digit values, 2^53 + 1, `1E+400` -- survives `readJson`
    and `writeJson`, and `decimal()` and `writeJson`, digit for digit; the
    same input gives byte-identical JSON; and the reader and the writer
    refuse the same breaks of FHIR JSON's rules.
  - **The primitives**: `numbers.test.ts` holds R4's decimal grammar, each
    integer type refused one past either end of its range, a JavaScript
    number refused, and a text longer than any value in range refused
    before BigInt reads it; `strings.test.ts` holds date, dateTime,
    instant and time to R4's forms and the calendar, a time without its
    zone refused as such, and id, code, uri and uuid.
  - **FHIR JSON**: `json-write.test.ts` and `json-read.test.ts` hold a
    JavaScript number refused at its path, a name given twice, empty
    values, a null outside an array, an object that is not plain data, a
    value that contains itself, and nesting deeper than a call stack.
  - **No health data in a refusal**: `refusal.test.ts`, over synthetic
    values each refusal would otherwise quote.
  - **No conversion, clock or random source in a package's source**:
    `scripts/exact-and-reproducible.test.mjs`, which reads every
    publishable package's syntax tree for `Number` as a value,
    `Number.call` included, `parseFloat`, `parseInt`, `JSON.parse`, the
    global `isNaN` and `isFinite`, a unary plus, `Date`, `performance`,
    `crypto`, `Math.random` and `Temporal.Now`.
  - **From outside**: `pnpm test:e2e:install` builds a resource with
    `decimal()` and `dateTime()` from the packed tarball, writes it, reads
    it back and catches a `Refusal`; its type-check fails if the published
    declarations admit a JavaScript number as FHIR JSON or an integer as a
    decimal.

  On 17 October 2026 each of these was watched failing, the file restored
  byte for byte afterwards: a decimal's text sent through `Number`; the
  duplicate-name check removed; a JavaScript number written; the calendar
  check, the zone's own refusal, and the leap-year rule cut to "divisible
  by four"; emptiness unchecked in the writer; null unchecked in the
  reader; `__proto__` assigned rather than defined; a refusal given the
  value in its path; the length bound before BigInt removed; `Number()`, a
  unary plus and `Date.now()` planted in the source; the guard's unary-plus
  rule removed; and `writeJson`'s parameter loosened to `unknown`. In
  review the same day, two gaps found and closed, each watched failing
  first: a `\u` escape's hex digits read in lowercase only, which no test
  saw, and `Number.call` and `Temporal.Now`, which the guard did not.

## Context

Plan H01 is the first product code: FHIR R4 JSON that keeps every digit,
primitives held to their ranges, identity from the host, byte-identical
output for the same input, and the choice of TypeScript types recorded.
The forces, read on 17 October 2026:

- **A decimal's digits are its value.** R4's datatypes page: "The
  precision of the decimal value has significance: e.g. 0.010 is regarded
  as different to 0.01, and the original precision should be preserved",
  and "Implementations SHALL handle decimal values in ways that preserve
  and respect the precision of the value as represented for presentation
  purposes" ([datatypes](https://hl7.org/fhir/R4/datatypes.html)). Its JSON
  page warns that with `JSON.parse()` "trailing 0s after a decimal point
  will be lost e.g. 2.00 will be converted to 2", and that implementations
  "should consider using a custom parser"
  ([json](https://hl7.org/fhir/R4/json.html)). Formancy Data and Formancy
  Report already carry exact values as text with their type
  (formancy.ai-data 0008, formancy.ai-report 0010).
- **Both candidate type packages type a decimal as a JavaScript number.**
  `@types/fhir` 0.0.44 (MIT), generated from `hl7.fhir.r4.core` 4.0.1,
  declares `valueDecimal?: number | undefined` and `Quantity.value?:
  number | undefined`; `@medplum/fhirtypes` 5.2.5 (Apache-2.0, no
  dependencies) declares `valueDecimal?: number` and `value?: number`.
  Both type every integer as `number` and every date as `string`. Read
  from the tarballs npm serves for those versions. A host that follows
  either has turned 0.10 into 0.1 before any code here is called.
- **R4's regexes are informative.** "The regexes are provided to assist
  with tooling, but are informative, not normative", and "may allow a
  broader set of values than are actually valid (e.g. leap years)". Its
  integer regexes admit a leading `+`, which a JSON number cannot carry;
  its positiveInt regex is printed `+?[1-9][0-9]*`, which JavaScript
  refuses to compile ("Nothing to repeat"). Its decimal regex is RFC 8259's
  number grammar, character for character.
- **FHIR JSON has rules JSON does not.** "Property names SHALL be unique",
  "Objects are never empty", "String property values can never be empty",
  and properties "never have null values" except the nulls that line a
  repeating primitive up with its extensions.
- **Identity is the host's, and the same input gives the same bytes**
  (CLAUDE.md; plan section 10). An identifier or a timestamp made here
  from a clock or a random source would be nobody's and differ on every
  run.
- **Health data stays out of errors** (CLAUDE.md), and any value a
  refusal could quote may be a person's.

## Decision

`@formancy/health-core` has TypeScript types of its own for FHIR R4's
primitives, and for nothing else yet: resources are typed by the packages
that build them, from H02 on.

- **A number is its text.** `decimal()`, `integer()`, `positiveInt()` and
  `unsignedInt()` take a string or a bigint and the path the value will
  stand at, check it once, and return a frozen `FhirNumber` that holds the
  text exactly. A decimal is R4's grammar, so `-0.0`, `1E+2` and a
  thirty-digit value are kept as written. An integer type is what R4's
  regex and JSON's number grammar both admit -- no `+`, no `-0`, no
  exponent -- within its 32-bit range, compared as BigInt. A JavaScript
  number is refused.
- **Every other primitive is a checked string**, branded with its type:
  date, dateTime, instant and time to R4's regexes and the calendar, a
  time without its zone refused as such; id to R4's regex; code to R4's
  words, which are stricter than its regex; uri to its regex, non-empty;
  uuid as a lowercase `urn:uuid:`. Nothing is converted, completed or
  normalised: a zone, a day, a lowercase UUID are the host's to supply.
- **`writeJson`** writes a `FhirNumber`'s text unquoted, a string as
  `JSON.stringify` escapes it, names in the order the object gives them,
  and no whitespace. It reads a host's objects through their property
  descriptors and refuses, with the path: a JavaScript number; undefined,
  a function, a symbol, a bigint, a Date or any object that is not plain;
  a getter, a hidden or symbol-named property, a hole or a throwing proxy;
  a value that contains itself; and FHIR JSON's breaks -- an empty object,
  array or string, a null outside an array, a name that is a whole number,
  which JavaScript would reorder.
- **`readJson`** is a parser of this package's, not `JSON.parse`. It reads
  RFC 8259 left to right with its own stack, makes every number with
  `decimal()` from its source text, and refuses what `writeJson` refuses,
  a name given twice, and text that is not JSON, with the offset.
- **A refusal** is one class, `Refusal`, with a rule, a path and, for text,
  an offset. Its message is made of those and fixed words, and never of
  the value.
- **No package source converts a value through a JavaScript number, or
  reads a clock or a random source**, which the guard holds.

Two parts of the design H01 started from were changed by the code. **The
numbers are not branded strings**: `writeJson` must know at run time which
values to write unquoted, and a branded string is a plain string at run
time. A `FhirNumber` is told apart by a private field no other object can
have; a Questionnaire item, `{ type: 'decimal', text: ... }`, has the same
shape and must be written as the object it is. And **`readJson` does not
use `JSON.parse`'s source text access**. The engines were not the obstacle:
MDN's browser-compat-data 8.1.6 gives the reviver's context argument to
Node from 21, Chrome 114, Firefox 135 and Safari 18.4, and Node 22.13 is
this repository's floor. On Node 24.21.0, `JSON.parse('{"a":1,"a":2}')` is
`{ a: 2 }` before any reviver runs, so a name given twice could not be
refused; it still reads every number into a double, which no test could
show is never used; and with a reviver it threw a RangeError on an array
nested 100,000 deep, which a parser with its own stack reads.

## Consequences

**What it buys.**
- **Every digit, both ways.** A decimal a host built from text, or that
  `readJson` read, is written as that text; nothing on the way is a double.
- **How a number is written is decided once**, here, as CLAUDE.md asks:
  later packages hand `FhirNumber`s to `writeJson` and decide nothing about
  digits.
- **Refusals a host can branch on and log**: a rule and a path, no value.
- **No production dependency.** The core stays without one, and without
  Node.

**What it costs.**
- **Types to maintain by hand.** Each resource and datatype a later
  package builds is typed in this repository against R4's definitions,
  where `@types/fhir` types all of them. A mistake in one is this
  repository's, and only the validator gate (H03) can find what tsc
  cannot.
- **A host must keep its text.** One whose data holds a decimal as a
  JavaScript number must go back to where the text was -- a form's answer,
  a database's numeric -- since 0.10 cannot be recovered from 0.1, and
  nothing here tries.
- **A parser to maintain** where `JSON.parse` is the platform's, and its
  speed beside `JSON.parse` was not measured.
- **XML Schema's limits are not held.** R4 says a JSON decimal is
  "restricted to the precision limits documented in XML schema for
  xs:double and xs:decimal". A thirty-digit value is kept, though a
  processor need support only eighteen digits of an `xs:decimal`, and
  `1E+400` is kept, though no `xs:double` holds it. What the HL7 validator
  says of them is measured with its gate, not here.
- **What is not checked yet**: a lone surrogate, which `readJson` reads
  from a `\ud800` escape and `writeJson` writes back as one, though FHIR's
  strings are Unicode characters in UTF-8; a uri beyond its permissive
  regex, RFC 3986 not at all; a string's 1 MB limit; and whether a null in
  an array lines up with a repeating primitive, which needs the element's
  definition.
- **A path repeats the document's names.** In FHIR JSON each is an
  element's, which FHIR defines; text that is not FHIR JSON may use
  anything as a name, a person's too, and a refusal's path would carry it.
  Telling an element's name from another needs the element's definition,
  which comes with the resources.
- **A number read has no FHIR type but decimal.** Which type an element is
  needs its definition; `integer()` narrows a read number from its text.
- **The guard sees spellings, not every conversion.** Arithmetic and
  comparison convert too (`text * 1`, `'10' > 9`); the exactness corpus
  catches each that loses a digit, and review the rest.

**What it forecloses.**
- A JavaScript number as a FHIR value anywhere in this package's API.
- `JSON.stringify` of a resource that holds a `FhirNumber`, whose `toJSON`
  throws rather than write an object where the number was.
- A FHIR type package's primitives. Its resource types could still be
  admitted later, by a record, if they were mapped to these primitives.

## Alternatives considered

**`@types/fhir` 0.0.44 (MIT).** Every R4 resource, generated from the core
package. Rejected for the primitives: a decimal and an integer are
`number`, so a host following the types loses `0.10`'s zero and 2^53 + 1's
last digit before the writer is called, and a date is any string. Mapping
its resource types onto these primitives remains possible, and would be
the way to take its resources later.

**`@medplum/fhirtypes` 5.2.5 (Apache-2.0).** The same `number` for decimal
and integer and `string` for dates, beside resource types of Medplum's own
platform. Rejected for the same reason.

**A double with its precision beside it.** R4 names "a combination of a
(64 bit) floating point value with a precision field" as one way to meet
its rule. Rejected: it keeps a trailing zero, but no digit past about the
seventeenth, so 2^53 + 1 and a thirty-digit value are lost all the same;
and two fields that must agree are two places to disagree.

**`JSON.parse` with source text access.** Rejected above: a name given
twice is gone before a reviver runs, the double is made regardless, and a
reviver's walk recurses.

**A recursive parser and writer with a bound on nesting.** Easier to read.
Rejected: the bound would be a number to measure against each engine's
stack, and R4 gives none; with their own stack, nesting costs memory and
the text's length is the only bound.

**The numbers as branded strings**, as H01's design proposed. Rejected
above: a writer cannot tell one from a string at run time.
