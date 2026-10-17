/**
 * FHIR R4's base64Binary: bytes, written as base64, and read back.
 *
 * R4 says a base64Binary is "a stream of bytes, base64 encoded (RFC 4648)"
 * (https://hl7.org/fhir/R4/datatypes.html, read on 17 October 2026). Its
 * regex, `(\s*([0-9a-zA-Z\+\=]){4}\s*)+`, is informative, as every R4
 * regex is, and leaves `/` out of the alphabet, so it refuses a third of
 * all base64 a document carries; it admits whitespace, which the HL7
 * validator warns of ("Base64 encoded values SHOULD not contain any
 * whitespace (per RFC 4648)"). So the type here is RFC 4648's base64, in
 * its one canonical spelling: the standard alphabet, whole quanta of four
 * characters, `=` padding at the end and nowhere else, the bits the
 * padding leaves zero (RFC 4648, section 3.5, says an encoder sets them to
 * zero), no whitespace, and never empty, since FHIR JSON carries no empty
 * string. One text for one sequence of bytes: a reader lenient about any
 * of these would read bytes nobody wrote, and give one document two
 * spellings.
 *
 * Bytes are a `Uint8Array`, the type the platform gives them in every
 * engine, without Node's Buffer or the DOM's atob, which this package
 * does not have. Nothing here converts a string or an array of numbers
 * into bytes: a string's characters past 255 would be bytes nobody gave.
 */
import { Refusal } from './refusal.js'

declare const encoded: unique symbol

/** A text that is canonical base64, and is still a string. */
export type FhirBase64Binary = string & { readonly [encoded]: 'base64Binary' }

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'

/** Each character's six bits, by its UTF-16 code. */
const SEXTETS: ReadonlyMap<number, number> = new Map([...ALPHABET].map((character, index) => [character.charCodeAt(0), index]))

/**
 * Whether `text` is canonical base64: whole quanta of the alphabet, the
 * last one either whole, or two characters and `==` with the second's low
 * four bits zero, or three and `=` with the third's low two bits zero.
 * Read once, character by character: a regex of repeated quanta
 * backtracks on a stack that grows with the text, and the base64 of a
 * PDF of four megabytes ran V8's out (17 October 2026).
 */
function isCanonical(text: string): boolean {
  if (text.length === 0 || text.length % 4 !== 0) return false
  const padding = text.endsWith('==') ? 2 : text.endsWith('=') ? 1 : 0
  let last = 0
  for (let at = 0; at < text.length - padding; at += 1) {
    const value = SEXTETS.get(text.charCodeAt(at))
    if (value === undefined) return false
    last = value
  }
  // The bits the padding leaves over, which an encoder sets to zero.
  return (last & (padding === 2 ? 0x0f : padding === 1 ? 0x03 : 0)) === 0
}

/** `value`, if it is canonical base64; refused at `path` as `grammar` otherwise, never quoted. */
export function base64Binary(value: string, path: string): FhirBase64Binary {
  // Asked of text only: anything else would be read through code the
  // value brings.
  if (typeof value !== 'string' || !isCanonical(value)) throw new Refusal('grammar', path, { type: 'base64Binary' })
  return value as FhirBase64Binary
}

/** The character of the six bits of `quantum` that end `shift` bits from its right. */
const sextet = (quantum: number, shift: number) => ALPHABET.charAt((quantum >>> shift) & 0x3f)

/**
 * `bytes` as base64, in the canonical spelling `base64Binary` holds. Refused
 * at `path` as `not-bytes` when they are not a Uint8Array, and as `empty`
 * when there are none, which FHIR JSON could not carry.
 */
export function toBase64Binary(bytes: Uint8Array, path: string): FhirBase64Binary {
  if (!(bytes instanceof Uint8Array)) throw new Refusal('not-bytes', path)
  if (bytes.length === 0) throw new Refusal('empty', path)
  const quanta: string[] = []
  for (let at = 0; at < bytes.length; at += 3) {
    const left = bytes.length - at
    // Each byte read once; a byte past the end is zero, and its characters are padding.
    const quantum = ((bytes[at] as number) << 16) | ((left > 1 ? (bytes[at + 1] as number) : 0) << 8) | (left > 2 ? (bytes[at + 2] as number) : 0)
    quanta.push(`${sextet(quantum, 18)}${sextet(quantum, 12)}${left > 1 ? sextet(quantum, 6) : '='}${left > 2 ? sextet(quantum, 0) : '='}`)
  }
  return quanta.join('') as FhirBase64Binary
}

/** The bytes `value` encodes, if it is canonical base64; refused at `path` as `base64Binary` refuses it otherwise. */
export function fromBase64Binary(value: string, path: string): Uint8Array {
  const text = base64Binary(value, path)
  const padding = text.endsWith('==') ? 2 : text.endsWith('=') ? 1 : 0
  const bytes = new Uint8Array((text.length / 4) * 3 - padding)
  let written = 0
  for (let at = 0; at < text.length; at += 4) {
    let quantum = 0
    for (let offset = 0; offset < 4; offset += 1) quantum = (quantum << 6) | (SEXTETS.get(text.charCodeAt(at + offset)) ?? 0)
    for (const shift of [16, 8, 0]) if (written < bytes.length) bytes[written++] = (quantum >>> shift) & 0xff
  }
  return bytes
}
