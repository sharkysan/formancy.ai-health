/**
 * Which characters a resource can carry in its text: XML 1.0's `Char`
 * (section 2.2) -- the tab, the line feed, the carriage return, and every
 * code point from U+0020 but a surrogate alone, U+FFFE and U+FFFF.
 *
 * R4 says a string "SHOULD not contain Unicode character points below
 * 32, except for u0009 (horizontal tab), u0010 (carriage return) and
 * u0013 (line feed)", decimal ten and thirteen meant
 * (https://hl7.org/fhir/R4/datatypes.html, read on 17 October 2026). A
 * narrative is XML, which cannot carry those, nor U+FFFE and U+FFFF; and
 * a surrogate alone is no character at all, which UTF-8 -- R4's XML and
 * its JSON are "exchanged using UTF-8 encoding", "always UTF-8" (xml.html
 * and json.html, read the same day) -- cannot encode. So a narrative's
 * text (xhtml.ts) and a host's text (host.ts) are held to the one rule
 * here, and refused, never cleaned, where it fails: the two cannot give
 * two answers to what a resource may say.
 */

/** Whether XML 1.0's `Char` production admits the code point `point`. */
function isXmlChar(point: number): boolean {
  if (point < 0x20) return point === 0x09 || point === 0x0a || point === 0x0d
  if (point >= 0xd800 && point <= 0xdfff) return false
  return point !== 0xfffe && point !== 0xffff
}

/**
 * Whether every character of `value` is one a resource can carry. Read by
 * code point: a pair of surrogates is one character, and one alone comes
 * out of the string on its own.
 */
export function carried(value: string): boolean {
  for (const character of value) if (!isXmlChar(character.codePointAt(0) as number)) return false
  return true
}
