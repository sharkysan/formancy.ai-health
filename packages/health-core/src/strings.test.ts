import { describe, expect, expectTypeOf, test } from 'vitest'
import { code, date, dateTime, id, instant, time, uri, uuid, type FhirDate, type FhirDateTime } from './strings.js'
import { refusalOf } from './test-support.js'

describe('date', () => {
  // R4's three precisions of a date are each a value of their own: a year
  // of birth is not a first of January.
  test.each(['2026', '2026-10', '2026-10-17', '0001-01-01', '2024-02-29', '2000-02-29'])('keeps %s', (text) => {
    expect(date(text, 'Patient.birthDate')).toBe(text)
  })

  // R4's regex admits the 31st of every month, and R4 says "Dates SHALL be
  // valid dates" and that the regexes need additional validation: a day
  // that does not exist would reach a receiver whose calendar refuses it.
  // 1900 is not a leap year and 2000 is, which a check by four alone gets
  // wrong.
  test.each(['2026-02-29', '1900-02-29', '2026-04-31', '2026-06-31', '2026-09-31', '2026-11-31'])('refuses %s, a day the calendar does not have', (text) => {
    expect(refusalOf(() => date(text, 'Patient.birthDate'))).toMatchObject({ rule: 'calendar', path: 'Patient.birthDate' })
  })

  // A date has no time and no zone in R4, and a year has four digits from
  // 0001: what a host's formatting produces otherwise is refused.
  test.each(['0000', '26', '2026-1-7', '2026-13', '2026-10-17T10:00:00Z', '2026-10-17Z', '17.10.2026', ''])('refuses %j by its form', (text) => {
    expect(refusalOf(() => date(text, 'Patient.birthDate'))).toMatchObject({ rule: 'grammar' })
  })

  // A JavaScript Date is an instant in the host's zone; which day it is
  // depends on where the code runs. It is not a FHIR date, and is refused
  // rather than formatted in a zone nobody chose.
  test('refuses what is not text', () => {
    expect(refusalOf(() => date(new Date(0) as never, 'Patient.birthDate'))).toMatchObject({ rule: 'grammar' })
  })
})

describe('dateTime', () => {
  // Each precision R4 gives a dateTime, a leap second and both ends of the
  // zone's range are values of their own: a check that refused one would
  // make a host round a form's answer to a precision it did not have.
  test.each(['2026', '2026-10', '2026-10-17', '2026-10-17T10:00:00+02:00', '2026-10-17T08:00:00.000Z', '2026-12-31T23:59:60Z', '2026-10-17T10:00:00-13:59', '2026-10-17T10:00:00+14:00'])('keeps %s', (text) => {
    expect(dateTime(text, 'Observation.effectiveDateTime')).toBe(text)
  })

  // The plan's regression case: a date and time with no zone is refused,
  // not guessed. R4 requires one once hours and minutes are given; which
  // zone a form was filled in is the host's to say, and a default here
  // would move the time by hours without a trace.
  test.each(['2026-10-17T10:00:00', '2026-10-17T10:00:00.123'])('refuses %s, a time without its zone', (text) => {
    expect(refusalOf(() => dateTime(text, 'Observation.effectiveDateTime'))).toMatchObject({ rule: 'zone', path: 'Observation.effectiveDateTime' })
  })

  // Hours and minutes alone, 24:00, an offset past R4's +14:00 and a space
  // in place of the T are each outside R4's form.
  test.each(['2026-10-17T10:00Z', '2026-10-17T24:00:00Z', '2026-10-17T10:00:00+15:00', '2026-10-17 10:00:00Z', '2026-10-17T10:00:00+0200'])('refuses %s by its form', (text) => {
    expect(refusalOf(() => dateTime(text, 'Observation.effectiveDateTime'))).toMatchObject({ rule: 'grammar' })
  })

  // The calendar holds once a time follows the day too: a check that read
  // only a bare date's length would let 30 February through with a time.
  test('refuses a day the calendar does not have, with a time', () => {
    expect(refusalOf(() => dateTime('2026-02-30T10:00:00Z', 'Observation.effectiveDateTime'))).toMatchObject({ rule: 'calendar' })
  })
})

describe('instant', () => {
  // An offset and Z, with and without a fraction of a second, are each an
  // instant R4 admits, and a Bundle's timestamp the host gave.
  test.each(['2026-10-17T10:00:00+02:00', '2026-10-17T08:00:00.239Z'])('keeps %s', (text) => {
    expect(instant(text, 'Bundle.timestamp')).toBe(text)
  })

  // An instant is a moment, to the second, with its zone: R4 requires both.
  test('refuses an instant without its zone', () => {
    expect(refusalOf(() => instant('2026-10-17T10:00:00', 'Bundle.timestamp'))).toMatchObject({ rule: 'zone' })
  })

  // A date, or a time without its seconds, is a dateTime and not an
  // instant: taken as one, it would claim a moment the host never gave.
  test.each(['2026-10-17', '2026-10-17T10:00Z', '2026'])('refuses %s, which is not to the second', (text) => {
    expect(refusalOf(() => instant(text, 'Bundle.timestamp'))).toMatchObject({ rule: 'grammar' })
  })

  // An instant names a day too, and R4's dates SHALL be valid dates: a
  // calendar check left to date and dateTime would pass 29 February 2026
  // here.
  test('refuses a day the calendar does not have', () => {
    expect(refusalOf(() => instant('2026-02-29T10:00:00Z', 'Bundle.timestamp'))).toMatchObject({ rule: 'calendar' })
  })
})

describe('time', () => {
  // Midnight, a fraction of a second and a leap second are each a time R4
  // admits: a check that refused one would refuse a form's answer.
  test.each(['00:00:00', '23:59:59.999', '23:59:60'])('keeps %s', (text) => {
    expect(time(text, 'Observation.valueTime')).toBe(text)
  })

  // A time of day has no zone in R4 and never reads 24:00.
  test.each(['24:00:00', '10:00', '10:00:00Z', '10:00:00+02:00'])('refuses %s', (text) => {
    expect(refusalOf(() => time(text, 'Observation.valueTime'))).toMatchObject({ rule: 'grammar' })
  })
})

describe('id, code, uri and uuid', () => {
  // A Resource.id is the host's, never made here, and held to R4's form:
  // letters, digits, '-' and '.', 64 at most.
  test('id keeps a host\'s id and refuses what R4 does not admit', () => {
    expect(id('patient-1.a', 'Patient.id')).toBe('patient-1.a')
    expect(id('a'.repeat(64), 'Patient.id')).toBe('a'.repeat(64))
    for (const text of ['a'.repeat(65), 'patient_1', 'patient 1', 'pätient', '']) {
      expect(refusalOf(() => id(text, 'Patient.id'))).toMatchObject({ rule: 'grammar', path: 'Patient.id' })
    }
  })

  // R4's normative words: at least one character, no leading or trailing
  // whitespace, and no whitespace but single spaces inside. A tab passes
  // R4's informative regex and not its words, and a no-break space is
  // whitespace to both.
  test('code keeps single spaces and refuses any other whitespace', () => {
    expect(code('final', 'Observation.status')).toBe('final')
    expect(code('a b', 'Observation.status')).toBe('a b')
    for (const text of ['', ' a', 'a ', 'a  b', 'a\tb', 'a b']) {
      expect(refusalOf(() => code(text, 'Observation.status'))).toMatchObject({ rule: 'grammar' })
    }
  })

  // R4 calls its uri regex very permissive, and this check is that regex
  // and no more; FHIR JSON never carries an empty string, so neither does
  // a uri.
  test('uri refuses whitespace and nothing', () => {
    expect(uri('http://snomed.info/sct', 'Coding.system')).toBe('http://snomed.info/sct')
    for (const text of ['', 'http://example.org/a b', 'urn:x ']) {
      expect(refusalOf(() => uri(text, 'Coding.system'))).toMatchObject({ rule: 'grammar' })
    }
  })

  // A Bundle entry's fullUrl comes from a UUID the host supplies, so that
  // the same input gives the same Bundle. R4 says a UUID in a URI SHALL be
  // lowercase: an uppercase one is refused rather than lowercased, which
  // would quietly change the host's identifier.
  test('uuid keeps a lowercase urn:uuid and refuses any other spelling', () => {
    const text = 'urn:uuid:c757873d-ec9a-4326-a141-556f43239520'
    expect(uuid(text, 'Bundle.entry[0].fullUrl')).toBe(text)
    for (const other of [text.toUpperCase(), 'urn:uuid:C757873D-ec9a-4326-a141-556f43239520', 'c757873d-ec9a-4326-a141-556f43239520', 'urn:uuid:c757873d-ec9a-4326-a141-556f4323952', 'urn:uuid:c757873dec9a4326a141556f43239520']) {
      expect(refusalOf(() => uuid(other, 'Bundle.entry[0].fullUrl'))).toMatchObject({ rule: 'grammar' })
    }
  })
})

describe('a checked string', () => {
  // A dateTime is a string a host can print, compare and store as it is,
  // and still a type of its own: a date where a dateTime was checked, or a
  // bare string, does not compile. tsc holds it; expectTypeOf does nothing
  // at run time.
  test('is a string whose type says which check it passed', () => {
    expectTypeOf(dateTime('2026', 'value')).toEqualTypeOf<FhirDateTime>()
    expectTypeOf<FhirDateTime>().toMatchTypeOf<string>()
    expectTypeOf<string>().not.toMatchTypeOf<FhirDate>()
    expectTypeOf<FhirDate>().not.toMatchTypeOf<FhirDateTime>()
  })
})
