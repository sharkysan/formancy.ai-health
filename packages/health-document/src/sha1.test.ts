import { describe, expect, test } from 'vitest'
import { bitLength, sha1 } from './sha1.js'

const hex = (bytes: Uint8Array) => [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('')
const ascii = (text: string) => new Uint8Array([...text].map((character) => character.charCodeAt(0)))

describe('sha1', () => {
  // R4's Attachment.hash is "the calculated hash of the data using SHA-1",
  // and the HL7 validator recomputes it from the data and refuses one that
  // differs (TYPE_SPECIFIC_CHECKS_DT_ATT_HASH_MISMATCH). A digest off by
  // one bit is a document every receiver that checks refuses.
  test.each([
    ['', 'da39a3ee5e6b4b0d3255bfef95601890afd80709', 'no bytes: one block of padding alone'],
    ['abc', 'a9993e364706816aba3e25717850c26c9cd0d89d', "FIPS 180-2's one-block example"],
    [
      'abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq',
      '84983e441c3bd26ebaae4aa1f95129e5e54670f1',
      "FIPS 180-2's two-block example, 56 bytes, whose length no longer fits its first block",
    ],
  ])('of %j is %s: %s', (text, digest) => {
    expect(hex(sha1(ascii(text)))).toBe(digest)
  })

  // Where the padding and the 64-bit length fall: a byte either side of
  // the 56 bytes after which the length takes a block of its own, and of
  // the 64 bytes of a whole block. Digests from Node's crypto (OpenSSL) on
  // 17 October 2026, bytes of the letter a.
  test.each([
    [55, 'c1c8bbdc22796e28c0e15163d20899b65621d65a'],
    [56, 'c2db330f6083854c99d4b5bfb6e8f29f201be699'],
    [63, '03f09f5b158a7a8cdad920bddc29b81c18a551f5'],
    [64, '0098ba824b5c16427bd7a1122a5a442a25ec644d'],
    [65, '11655326c708d70319be2610e8a57d9a5b959d3b'],
    [119, 'ee971065aaa017e0632a8ca6c77bb3bf8b1dfc56'],
    [120, 'f34c1488385346a55709ba056ddd08280dd4c6d6'],
  ])('of %i bytes is %s', (length, digest) => {
    expect(hex(sha1(new Uint8Array(length).fill(0x61)))).toBe(digest)
  })

  // FIPS 180-2's million letters: a length of many blocks, where a word
  // carried as a signed number or a schedule reused from the block before
  // would show.
  test("of a million a's is FIPS 180-2's digest", () => {
    expect(hex(sha1(new Uint8Array(1_000_000).fill(0x61)))).toBe('34aa973cd4c4daa4f61eeb2bdbad27316534016f')
  })

  // Read, never written: the host's bytes are the document, and a hash
  // that padded them in place would change what it hashed.
  test('leaves the bytes it hashes as they were', () => {
    const bytes = ascii('abc')
    sha1(bytes)
    expect([...bytes]).toEqual([0x61, 0x62, 0x63])
  })
})

describe("a message's length in bits", () => {
  // SHA-1 ends a message with its length in bits, as 64 bits. Past 2^29
  // bytes -- half a gigabyte, more than a test hashes -- the bits no longer
  // fit the low word; a length kept in 32 bits would hash such a PDF as
  // another length's. R4's unsignedInt size stops at 2^31 - 1 bytes.
  test.each([
    [0, [0, 0]],
    [26, [0, 208]],
    [0x1fffffff, [0, 0xfffffff8]],
    [0x20000000, [1, 0]],
    [0x20000001, [1, 8]],
    [0x7fffffff, [3, 0xfffffff8]],
  ] as const)('of %i bytes is the words %j', (length, words) => {
    expect(bitLength(length)).toEqual(words)
  })
})
