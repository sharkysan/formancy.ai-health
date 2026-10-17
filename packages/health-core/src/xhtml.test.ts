import { describe, expect, test } from 'vitest'
import { refusalOf } from './test-support.js'
import { xhtmlText } from './xhtml.js'

describe('xhtmlText', () => {
  // A narrative is XHTML, and a title a host wrote is text inside it: an
  // ampersand or an angle bracket written as it is would be markup, and
  // the validator would refuse the div, or read a tag the host never
  // wrote. The three are escaped, and nothing else is changed.
  test('escapes the characters that would be markup, and keeps every other', () => {
    expect(xhtmlText('Zuweisung & Bericht <dringend> "heute"', 'Composition.title')).toBe('Zuweisung &amp; Bericht &lt;dringend&gt; "heute"')
    expect(xhtmlText('Überweisung, Ärztin: Grüezi ✓ 𝄞', 'Composition.title')).toBe('Überweisung, Ärztin: Grüezi ✓ 𝄞')
    expect(xhtmlText('&amp;', 'Composition.title')).toBe('&amp;amp;')
  })

  // A tab, a line feed and a carriage return are XML's own whitespace and
  // stay; every other control character, and the two non-characters at
  // the end of the BMP, XML 1.0 cannot carry at all: the div would not be
  // XML, and the validator would refuse it. They are refused here, naming
  // the path and never the text.
  test('keeps the whitespace XML allows', () => {
    expect(xhtmlText('Zeile\teins\nzwei\r', 'Composition.title')).toBe('Zeile\teins\nzwei\r')
  })

  test.each([
    ['a null', 'Zuweisung\u0000'],
    ['a vertical tab', 'Zuweisung\u000b'],
    ['an escape', 'Zuweisung\u001b'],
    ['U+FFFE', 'Zuweisung￾'],
    ['U+FFFF', 'Zuweisung￿'],
    ['a high surrogate alone', 'Zuweisung\ud834'],
    ['a low surrogate alone', '\udd1eZuweisung'],
  ])('refuses %s, which XML cannot carry', (_, value) => {
    const refusal = refusalOf(() => xhtmlText(value, 'Composition.title'))
    expect(refusal).toMatchObject({ rule: 'grammar', path: 'Composition.title', type: 'xhtml' })
    expect(refusal.message).not.toContain('Zuweisung')
  })

  // Asked of text only: anything else would be converted to a string
  // through code the value brings.
  test('refuses what is not text', () => {
    expect(refusalOf(() => xhtmlText({ toString: () => 'Zuweisung' } as never, 'Composition.title'))).toMatchObject({ rule: 'grammar', type: 'xhtml' })
  })
})
