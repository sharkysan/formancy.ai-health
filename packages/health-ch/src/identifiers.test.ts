import { Refusal, Refusals } from '@formancy/health-core'
import { describe, expect, test } from 'vitest'
import { AHVN13_SYSTEM, ahvn13, CH_SYSTEMS, GLN_SYSTEM, gln, gs1CheckDigit, localIdentifierAt } from './identifiers.js'

/** The refusal `act` throws; one that accepts fails the test. */
function refusalOf(act: () => unknown): Refusal {
  try {
    act()
  } catch (error) {
    if (error instanceof Refusal) return error
    throw error
  }
  throw new Error('expected a refusal, and the value was accepted')
}

/**
 * `stem`, twelve digits, with the check digit GS1's rule gives it, or
 * with `wrong` added to it, mod 10. Computed here from the digits' codes,
 * as the package does, so that a valid AHVN13 is never written into this
 * file: one that passes the check may be a person's (BSV, "Die
 * AHV-Nummer": "völlig anonym und zufallsgeneriert", no range reserved
 * for tests), and is kept only in memory, never in a fixture, a snapshot
 * or a message (0009).
 */
function withCheckDigit(stem: string, wrong = 0): string {
  return `${stem}${String((gs1CheckDigit(stem) + wrong) % 10)}`
}

describe("GS1's check digit", () => {
  // GS1 General Specifications, Release 26.0, Table 7-9: the 17 digits
  // 37610425002123456 have the check digit 9, by weights 3 and 1 from
  // the right. One rule for every fixed-length GS1 key (section 7.9.1),
  // a GLN's among them, and CH Core's ahvn13-digit-check over its twelve
  // digits.
  test("is GS1's own example's", () => {
    expect(gs1CheckDigit('37610425002123456')).toBe(9)
  })

  // A sum that is already a multiple of ten has the check digit 0, not
  // 10: "subtract sum from nearest equal or higher multiple of ten".
  test('is 0 where the sum is a multiple of ten', () => {
    // 9·1 + 5·3 + 2·1 + 8·3 = 50.
    expect(gs1CheckDigit('952000000008')).toBe(0)
    expect(gs1CheckDigit('000000000000')).toBe(0)
  })
})

describe('gln', () => {
  // GS1's prefix 952 is "used for demonstrations and examples of the GS1
  // system" (General Specifications 26.0, Table 1-4), so no company and
  // no person holds a GLN under it: these are nobody's.
  test('keeps a GLN of thirteen digits whose check digit GS1 gives', () => {
    expect(gln('9520000000011', 'context.author.practitioner.gln')).toBe('9520000000011')
    expect(gln('9520000000028', 'context.author.organization.gln')).toBe('9520000000028')
  })

  // CH Core's gln-modulus-10 is a warning, which the validator raises and
  // nothing else: a GLN with a wrong digit reaches a receiver that routes
  // by it unless this refuses it.
  test('refuses a GLN whose check digit is not the one its digits give, naming no digit', () => {
    const refusal = refusalOf(() => gln('9520000000012', 'context.author.practitioner.gln'))
    expect(refusal).toMatchObject({ rule: 'check-digit', path: 'context.author.practitioner.gln' })
    expect(refusal.message).not.toContain('952')
  })

  // gln-length: thirteen digits, no separators, nothing else; and text,
  // never a number, whose digits a double would not keep.
  test.each([['952000000001'], ['95200000000111'], ['952 0000 0000 11'], ['952000000001A'], [''], [9520000000011 as never]])('refuses %j by its form', (value) => {
    expect(refusalOf(() => gln(value, 'context.author.practitioner.gln'))).toMatchObject({ rule: 'identifier', path: 'context.author.practitioner.gln' })
  })

  // A GLN that does not start 76 is a GLN: CH Core warns of one only "for
  // Swiss HCP" (gln-startswith76), and a referral's author may practise
  // outside Switzerland. GS1's prefix 952 is such a prefix, and nobody's;
  // a GLN under another country's prefix may be somebody's, and is in no
  // file here (scripts/synthetic-identifiers.test.mjs).
  test('keeps a GLN that does not start 76', () => {
    expect(gln(withCheckDigit('952000000005'), 'context.author.organization.gln')).toMatch(/^952/)
  })
})

describe('ahvn13', () => {
  // CH Core's ahvn13-length and ahvn13-digit-check, both warnings: 756,
  // nine digits and GS1's check digit over the twelve before it. The
  // valid number is computed and kept in memory alone.
  test("keeps 756, nine digits and the check digit GS1's rule gives them", () => {
    const valid = withCheckDigit('756000000001')
    expect(ahvn13(valid, 'context.patient.ahvn13') === valid).toBe(true)
  })

  // The same digits with any other check digit are no AHVN13 at all, and
  // a refusal of one names no digit of it.
  test.each([1, 2, 5, 9])('refuses one whose check digit is off by %i', (wrong) => {
    const refusal = refusalOf(() => ahvn13(withCheckDigit('756000000001', wrong), 'context.patient.ahvn13'))
    expect(refusal).toMatchObject({ rule: 'check-digit', path: 'context.patient.ahvn13' })
    expect(refusal.message).not.toContain('756')
  })

  // One spelling, as CH Core gives it and its NamingSystem says: "shall
  // not contain point characters for separation". The printed form with
  // points is refused, not stripped: nothing here guesses that a string
  // with points is the number. Nor is a number of another country, of
  // twelve or fourteen digits, or a JavaScript number.
  test.each([
    ['the printed form', '756.1234.5678.90'],
    ['another country', '2760000000017'],
    ['twelve digits', '756000000001'],
    ['fourteen digits', '75600000000010'],
    ['a space', '756 0000 0000 1'],
    ['a number', 7560000000010 as never],
  ])('refuses %s by its form', (_, value) => {
    expect(refusalOf(() => ahvn13(value, 'context.patient.ahvn13'))).toMatchObject({ rule: 'identifier', path: 'context.patient.ahvn13' })
  })
})

describe('a local identifier', () => {
  const read = (given: unknown) => {
    const refusals = new Refusals()
    const found = localIdentifierAt({ identifier: given }, 'identifier', 'context.patient.identifier[0]', refusals)
    return { found, refused: refusals.list.map((refusal) => `${refusal.rule} ${refusal.path}`) }
  }

  // A host's own number, under its own system: ITU-T's example arc 2.999
  // here, which nobody is assigned.
  test('keeps a system and a value', () => {
    expect(read({ system: 'urn:oid:2.999.756.1', value: 'P-0001' })).toEqual({ found: { system: 'urn:oid:2.999.756.1', value: 'P-0001' }, refused: [] })
  })

  // An identifier health-ch does not check cannot stand under a system
  // whose identifiers it checks by name: an AHVN13 or a GLN handed over as
  // a local identifier would reach the receiver unchecked, its check digit
  // only warned of. Each of CH Core's seven Swiss systems is refused there.
  test.each(CH_SYSTEMS)('refuses one under %s, a system CH Core gives a form of its own', (system) => {
    expect(read({ system, value: '1' }).refused).toEqual(['identifier context.patient.identifier[0].system'])
  })

  // RFC 8141: the "urn" scheme and the namespace identifier are
  // case-insensitive, and an OID's digits have no case. A receiver that
  // normalises would read `URN:OID:2.51.1.3` as the GLN's system, and the
  // number under it as a GLN nothing checked: each Swiss system is refused
  // whatever its case.
  test.each(CH_SYSTEMS)('refuses one under %s in capitals or mixed case', (system) => {
    expect(read({ system: system.toUpperCase(), value: '1' }).refused).toEqual(['identifier context.patient.identifier[0].system'])
    expect(read({ system: system.replace('urn:oid', 'Urn:OID'), value: '1' }).refused).toEqual(['identifier context.patient.identifier[0].system'])
  })

  test('names GLN and AHVN13 among those systems', () => {
    expect(CH_SYSTEMS).toEqual(expect.arrayContaining([GLN_SYSTEM, AHVN13_SYSTEM]))
    expect(CH_SYSTEMS).toHaveLength(7)
  })

  // Each part is the host's, and needed: CH Core's LocalPid asks a system
  // and a value. A member the context does not name -- a `use`, a period
  // -- would be left out without a word, and is refused instead.
  test.each([
    [{ value: 'P-0001' }, ['absent context.patient.identifier[0].system']],
    [{ system: 'urn:oid:2.999.756.1' }, ['absent context.patient.identifier[0].value']],
    [{ system: 'urn:oid:2.999.756.1', value: '   ' }, ['absent context.patient.identifier[0].value']],
    [{ system: 'not a uri', value: 'P-0001' }, ['grammar context.patient.identifier[0].system']],
    [{ system: 'urn:oid:2.999.756.1', value: 'P-0001', use: 'official' }, ['unmapped context.patient.identifier[0]']],
    ['P-0001', ['absent context.patient.identifier[0]']],
  ])('refuses %j', (given, refused) => {
    expect(read(given)).toEqual({ found: undefined, refused })
  })
})
