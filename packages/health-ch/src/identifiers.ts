/**
 * The Swiss identifiers a CH ORF document carries, held to their systems
 * here, because the validator does not hold them (0009).
 *
 * CH Core 6.0.0 gives each identifier system a profile of Identifier
 * (StructureDefinition `ch-core-gln-identifier` and
 * `ch-core-ahvn13-identifier`, element `Identifier.value`) whose
 * constraints are warnings: `gln-length`, `gln-modulus-10`,
 * `ahvn13-length`, `ahvn13-digit-check`. The HL7 validator raises a
 * warning for a wrong check digit and no error (measured 17 October
 * 2026), so a document with one would reach a receiver that routes or
 * matches by it. Here each is refused instead, by health-core's rules
 * `identifier` and `check-digit`, naming the path and never a digit.
 *
 * - **GLN** (`urn:oid:2.51.1.3`): thirteen digits, the last GS1's check
 *   digit of the twelve before it. One that does not start 76, which CH
 *   Core warns of "for Swiss HCP" (`gln-startswith76`), is a GLN all the
 *   same -- an author who practises outside Switzerland has one, and the
 *   corpus's are under GS1's prefix 952 -- and is kept.
 * - **AHVN13** (`urn:oid:2.16.756.5.32`): 756, ISO 3166's number for
 *   Switzerland, nine digits and GS1's check digit of the twelve before
 *   it, written without points, as CH Term's NamingSystem `ahvn13` says
 *   it "shall not contain point characters for separation". The printed
 *   form with points is refused, not read.
 *
 * GS1's check digit is "identical for all fixed length numeric GS1 data
 * structures (including GDTI, GLN, GRAI, etc.)": the digits before it
 * weighted 3 and 1 alternately from the right, "subtract sum from nearest
 * equal or higher multiple of ten" (GS1 General Specifications, Release
 * 26.0, section 7.9.1 and Table 7-8). CH Core's ahvn13-digit-check is the
 * same over the AHVN13's twelve digits, with the 756 summed in advance as
 * 28. Each digit is read from its character's code, never by converting
 * the identifier to a number, which would lose none of thirteen digits
 * but is refused here all the same (0004).
 *
 * A host's own identifiers -- a patient's number in its records, an
 * order's -- stand under the host's system, which is any uri but the
 * seven CH Core gives a form of its own, in any case: RFC 8141 makes the
 * "urn" scheme and its namespace identifier case-insensitive, and an
 * OID's digits have none, so `URN:OID:2.51.1.3` is the GLN's system to a
 * receiver that normalises it. An identifier this package does not check
 * cannot pass under a system whose identifiers it checks, or would check,
 * by name.
 */
import { known, member, needed, Refusal, text, uri, valueAt, type FhirUri, type Refusals } from '@formancy/health-core'

/** The GLN's system, as CH Core's ch-core-gln-identifier fixes it. */
export const GLN_SYSTEM = 'urn:oid:2.51.1.3'

/** The AHVN13's system, as CH Core's ch-core-ahvn13-identifier fixes it. */
export const AHVN13_SYSTEM = 'urn:oid:2.16.756.5.32'

/**
 * Every system CH Core 6.0.0 profiles an Identifier of, each with a form
 * of its own: GLN, AHVN13, EPR-SPID, the insurance card number (VEKA),
 * ZSR, BER and UIDB (ch-core-*-identifier, Identifier.system; the same
 * OIDs as CH Term 3.3.0's NamingSystems). Only the first two are taken
 * here, by name; the others not at all.
 */
export const CH_SYSTEMS = [
  GLN_SYSTEM,
  AHVN13_SYSTEM,
  'urn:oid:2.16.756.5.30.1.127.3.10.3',
  'urn:oid:2.16.756.5.30.1.123.100.1.1.1',
  'urn:oid:2.16.756.5.30.1.123.100.2.1.1',
  'urn:oid:2.16.756.5.45',
  'urn:oid:2.16.756.5.35',
] as const

declare const checked: unique symbol

/** A GLN that passed its check, and is still its text. */
export type Gln = string & { readonly [checked]: 'GLN' }

/** An AHVN13 that passed its check, and is still its text. */
export type Ahvn13 = string & { readonly [checked]: 'AHVN13' }

/** The code of the character `0`: a digit's value is its code less this one. */
const ZERO = '0'.charCodeAt(0)

/**
 * GS1's check digit of `digits`, a string of digits already checked to be
 * nothing else: each weighted 3 and 1 alternately from the right, and the
 * sum taken from the next multiple of ten.
 */
export function gs1CheckDigit(digits: string): number {
  let sum = 0
  for (let index = 0; index < digits.length; index += 1) {
    const weight = (digits.length - index) % 2 === 1 ? 3 : 1
    sum += (digits.charCodeAt(index) - ZERO) * weight
  }
  return (10 - (sum % 10)) % 10
}

/** `value` held to `form` and GS1's check digit over all its digits but the last, at `path`. */
function checkedKey(value: string, form: RegExp, path: string): string {
  // Asked of text only: a regex would convert anything else to a string first.
  if (typeof value !== 'string' || !form.test(value)) throw new Refusal('identifier', path)
  if (gs1CheckDigit(value.slice(0, -1)) !== value.charCodeAt(value.length - 1) - ZERO) throw new Refusal('check-digit', path)
  return value
}

/** A GLN: thirteen digits and GS1's check digit, at `path`. */
export function gln(value: string, path: string): Gln {
  return checkedKey(value, /^[0-9]{13}$/, path) as Gln
}

/** An AHVN13: 756, nine digits and GS1's check digit, without points, at `path`. */
export function ahvn13(value: string, path: string): Ahvn13 {
  return checkedKey(value, /^756[0-9]{10}$/, path) as Ahvn13
}

/** The system of a host's own identifier: a uri, and none of CH Core's, whatever its case. */
function localSystem(value: string, path: string): FhirUri {
  const system = uri(value, path)
  if ((CH_SYSTEMS as readonly string[]).includes(system.toLowerCase())) throw new Refusal('identifier', path)
  return system
}

/** A host's own identifier, `{ system, value }`, under `name` of `holder`; undefined, refused at `path`, where it cannot be one. */
export function localIdentifierAt(holder: unknown, name: string, path: string, refusals: Refusals): { readonly system: FhirUri; readonly value: string } | undefined {
  const given = valueAt(holder, name)
  const before = refusals.count
  if (!known(given, ['system', 'value'], path, refusals)) return undefined
  const system = needed(given, 'system', member(path, 'system'), refusals, localSystem)
  const value = needed(given, 'value', member(path, 'value'), refusals, text)
  return refusals.count > before || system === undefined || value === undefined ? undefined : { system, value }
}
