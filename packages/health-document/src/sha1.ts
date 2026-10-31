/**
 * SHA-1, for R4's Attachment.hash: "The calculated hash of the data using
 * SHA-1. Represented using base64", calculated "on the data prior to
 * base64 encoding" (https://hl7.org/fhir/R4/datatypes.html#Attachment,
 * read on 17 October 2026).
 *
 * Computed here, as FIPS 180-4 gives it, because nothing this package may
 * use computes it: the platform's is `crypto.subtle`, which is
 * asynchronous, absent outside a secure context, and reached through
 * `crypto`, whose random values the exact-and-reproducible guard refuses
 * by name; Node's is Node's, which this package does not have. R4 says the
 * hash "is not intended to support digital signatures", and it is not
 * used for one here: it lets a receiver check that the bytes it read are
 * the bytes that were attached, which the HL7 validator does. SHA-1 is
 * broken for collision resistance, and nothing here relies on it.
 *
 * The words are 32-bit, held in JavaScript numbers by the bitwise
 * operators, which work on exactly 32 bits: nothing here is a value from a
 * document, only the bytes' arithmetic.
 */

/** The bytes' SHA-1 digest, 20 bytes. `bytes` is read and never written. */
export function sha1(bytes: Uint8Array): Uint8Array {
  const state = [0x67452301, 0xefcdab89, 0x98badcfe, 0x10325476, 0xc3d2e1f0]
  const schedule = new Array<number>(80)
  const whole = bytes.length - (bytes.length % 64)
  for (let at = 0; at < whole; at += 64) compress(state, schedule, bytes, at)

  // The rest of the bytes, a 1 bit, zeros, and the length in bits as 64
  // bits: one block, or two when the rest leaves fewer than 9 bytes.
  const rest = bytes.length - whole
  const tail = new Uint8Array(rest < 56 ? 64 : 128)
  tail.set(bytes.subarray(whole))
  tail[rest] = 0x80
  const [high, low] = bitLength(bytes.length)
  const end = tail.length
  for (const [offset, word] of [
    [end - 8, high],
    [end - 4, low],
  ] as const) {
    tail[offset] = word >>> 24
    tail[offset + 1] = (word >>> 16) & 0xff
    tail[offset + 2] = (word >>> 8) & 0xff
    tail[offset + 3] = word & 0xff
  }
  for (let at = 0; at < tail.length; at += 64) compress(state, schedule, tail, at)

  const digest = new Uint8Array(20)
  state.forEach((word, index) => {
    digest[index * 4] = word >>> 24
    digest[index * 4 + 1] = (word >>> 16) & 0xff
    digest[index * 4 + 2] = (word >>> 8) & 0xff
    digest[index * 4 + 3] = word & 0xff
  })
  return digest
}

/**
 * A length of `length` bytes in bits, as the 64 bits SHA-1 ends with: the
 * high and the low word. The high word is past zero from 2^29 bytes, a
 * length no test hashes; this is what they test instead.
 */
export function bitLength(length: number): readonly [number, number] {
  return [Math.floor(length / 0x20000000), (length << 3) >>> 0]
}

/** `word` rotated left by `count` bits. */
const rotate = (word: number, count: number) => (word << count) | (word >>> (32 - count))

/** FIPS 180-4's compression of the 64-byte block of `block` at `at` into `state`. */
function compress(state: number[], schedule: number[], block: Uint8Array, at: number): void {
  for (let index = 0; index < 16; index += 1) {
    const offset = at + index * 4
    schedule[index] =
      ((block[offset] as number) << 24) | ((block[offset + 1] as number) << 16) | ((block[offset + 2] as number) << 8) | (block[offset + 3] as number)
  }
  for (let index = 16; index < 80; index += 1) {
    schedule[index] = rotate(
      (schedule[index - 3] as number) ^ (schedule[index - 8] as number) ^ (schedule[index - 14] as number) ^ (schedule[index - 16] as number),
      1,
    )
  }
  let [a, b, c, d, e] = state as [number, number, number, number, number]
  for (let index = 0; index < 80; index += 1) {
    const [mixed, constant] =
      index < 20
        ? [(b & c) | (~b & d), 0x5a827999]
        : index < 40
          ? [b ^ c ^ d, 0x6ed9eba1]
          : index < 60
            ? [(b & c) | (b & d) | (c & d), 0x8f1bbcdc]
            : [b ^ c ^ d, 0xca62c1d6]
    const next = (rotate(a, 5) + mixed + e + constant + (schedule[index] as number)) | 0
    e = d
    d = c
    c = rotate(b, 30)
    b = a
    a = next
  }
  state[0] = ((state[0] as number) + a) >>> 0
  state[1] = ((state[1] as number) + b) >>> 0
  state[2] = ((state[2] as number) + c) >>> 0
  state[3] = ((state[3] as number) + d) >>> 0
  state[4] = ((state[4] as number) + e) >>> 0
}
