import { describe, expect, test } from 'vitest'
import { decode, occursIn, steadied, strings } from './aria-text.mjs'

/**
 * The decoder a README picture's quotes are checked through (0016). A
 * caption quotes what a person reads; the record holds Playwright's
 * accessibility snapshot, which is YAML-escaped text. Matched against the
 * escaped form, a quote with a quotation mark or a colon in it would miss
 * although the page shows it, or hit a run that only exists in the
 * escaping.
 *
 * Each line says where it came from: printed by `locator.ariaSnapshot()`
 * (Playwright 1.64.1, Chromium 156.0.8078.4) on a region of the built demo,
 * served at http://demo.invalid/health/, 2026-10-20, or made by hand for a
 * shape no pictured part has.
 */

describe('decode', () => {
  // A plain value is the text as written: decoding it must not touch it.
  test('reads a plain value as written', () => {
    // The form's region.
    expect(decode('  - textbox "Practice phone for questions": 000 000 00 00')).toEqual([
      { depth: 1, role: 'textbox', name: 'Practice phone for questions', value: '000 000 00 00' },
    ])
  })

  // Playwright quotes a value that holds a colon before a space, a quotation
  // mark or a control character, and escapes `\"` and `\xHH`; JSON knows the
  // first and not the second. A decoder that left them would make every
  // refusal unquotable, and a \x escape a line it cannot read.
  test('reads a double-quoted value, with an escaped quotation mark and a \\x escape', () => {
    // The response's region, its answers refused.
    expect(decode('  - paragraph: "Refused by @formancy/health-questionnaire:"')).toEqual([
      { depth: 1, role: 'paragraph', name: undefined, value: 'Refused by @formancy/health-questionnaire:' },
    ])
    // The response's JSON region: a value with quotation marks in it.
    expect(decode('    - region "The answers as JSON": "{ \\"status\\": \\"completed\\" }"')).toEqual([
      { depth: 2, role: 'region', name: 'The answers as JSON', value: '{ "status": "completed" }' },
    ])
    // Made by hand: no pictured part has a DEL character. The escaped
    // backslash before "x41" keeps that "x41" text, not an escape.
    expect(decode('- text: "a\\x7fb \\\\x41"')).toEqual([{ depth: 0, role: 'text', name: undefined, value: 'a\u007fb \\x41' }])
  })

  // A key with ": " in it is single-quoted, with '' for an apostrophe. Read
  // without stripping them, the name would be lost to the YAML.
  test("reads a single-quoted key, with '' standing for '", () => {
    // The Questionnaire's region: an item's way to its field.
    expect(decode(`          - 'button "To the field in the form: Specialty"': To the field in the form`)).toEqual([
      { depth: 5, role: 'button', name: 'To the field in the form: Specialty', value: 'To the field in the form' },
    ])
    // Made by hand: the same shape with an apostrophe in the name.
    expect(decode(`- 'button "To the field in the form: The patient''s language"'`)).toEqual([
      { depth: 0, role: 'button', name: "To the field in the form: The patient's language", value: undefined },
    ])
  })

  // A name is JSON.stringify's output, so an escaped quotation mark in it is
  // the mark itself, and the attributes after it are not part of it.
  test('reads a name with an escaped quotation mark, and its attributes apart from it', () => {
    // The form's region: a name and its attribute.
    expect(decode('    - radio "Français" [checked]')).toEqual([{ depth: 2, role: 'radio', name: 'Français', value: undefined }])
    // Made by hand: no pictured name has a straight quotation mark.
    expect(decode('- heading "Say \\"hi\\"" [level=3]:')).toEqual([{ depth: 0, role: 'heading', name: 'Say "hi"', value: undefined }])
  })

  // A link's address is a property, not text a heading or a field says; it
  // is read, under its own key, rather than refused.
  test('reads a property line', () => {
    // The response's region, as the camera records it.
    expect(decode('    - /url: blob:http://demo.invalid/<uuid>')).toEqual([
      { depth: 2, role: '/url', name: undefined, value: 'blob:http://demo.invalid/<uuid>' },
    ])
  })

  // A line the format above does not describe would otherwise be skipped, and
  // a quote it holds would be "missing" for a reason nobody could see.
  test.each([
    ['no list marker', 'status: Saved.'],
    ['an odd indentation', ' - status: Saved.'],
    ['an unclosed value', '- status: "Saved.'],
    ['a key that is not a role', '- Saved.'],
    ['an unclosed single-quoted key', `- 'option "None: x"`],
    ['trailing text after a name', '- button "Save" now'],
  ])('refuses a line with %s', (_, line) => {
    expect(() => decode(line)).toThrow(/line 1 is not an accessibility snapshot line/)
  })
})

describe('occursIn', () => {
  // The response's region with the question cleared, as printed.
  const snapshot = [
    '- region "The answers, as a QuestionnaireResponse":',
    '  - heading "The answers, as a QuestionnaireResponse" [level=2]',
    '  - paragraph: "Refused by @formancy/health-questionnaire:"',
    '  - list:',
    '    - listitem:',
    '      - code: required',
    '      - text: "answers.question: its item is required, and a completed response holds no answer to it that R4 counts"',
  ].join('\n')

  // A quote is held by what one element says: a run that only exists when two
  // lines are read together is not something a person reads in one place.
  test('finds a quote inside one name or value, and not across two', () => {
    expect(occursIn('answers.question: its item is required', snapshot)).toBe(true)
    expect(occursIn('Refused by @formancy/health-questionnaire:', snapshot)).toBe(true)
    expect(occursIn('required', snapshot)).toBe(true)
    expect(occursIn('required answers.question', snapshot)).toBe(false)
  })

  // The escaping is not text: a quote of a quotation mark finds the mark, and
  // the backslash Playwright put before it finds nothing.
  test('matches the decoded text, not the escaping', () => {
    const escaped = '- region "The answers as JSON": "{ \\"status\\": \\"completed\\" }"'
    expect(occursIn('"status": "completed"', escaped)).toBe(true)
    expect(occursIn('\\"status', escaped)).toBe(false)
  })
})

describe('strings', () => {
  // Every name and value, in order: what a reader of a part's text reads.
  test('lists every decoded name and value, in order', () => {
    expect(strings('- textbox "Language to interpret": Französisch\n- button "To the resources"')).toEqual([
      'Language to interpret',
      'Französisch',
      'To the resources',
    ])
  })
})

describe('steadied', () => {
  // Printed by `locator.ariaSnapshot()` (Playwright 1.64.1, Chromium
  // 156.0.8078.4) on 2026-10-20, of the response's download link on an
  // http://demo.invalid page; the UUIDs are two such prints'.
  const printed = (uuid) => ['- link "Download questionnaireresponse-demo-referral.json":', `  - /url: blob:http://demo.invalid/${uuid}`].join('\n')

  // The browser draws a new UUID for every object URL, so a part holding a
  // download link would be recorded with one walk's UUID and differ from it
  // on every walk after: the check would fail with nothing changed, and a
  // retake would change the record each time.
  test("says a link's object URL without the UUID drawn for it", () => {
    expect(steadied(printed('fd7f70cf-fa5b-4a86-9e6c-4b53d7f33342'))).toBe(steadied(printed('503cad91-bbe5-4be8-b4e2-d87300d88171')))
    expect(steadied(printed('fd7f70cf-fa5b-4a86-9e6c-4b53d7f33342'))).toBe(
      ['- link "Download questionnaireresponse-demo-referral.json":', '  - /url: blob:http://demo.invalid/<uuid>'].join('\n'),
    )
  })

  // Made by hand: anything else is what the page says, and a record that
  // smoothed it would hold a change nobody saw -- another address, or text
  // that only looks like an object URL.
  test('leaves every other address and every text as printed', () => {
    const other = [
      '- link "Skip to the demo":',
      '  - /url: "#demo"',
      '- link "Download":',
      '  - /url: https://demo.invalid/fd7f70cf-fa5b-4a86-9e6c-4b53d7f33342',
      '- paragraph: blob:http://demo.invalid/fd7f70cf-fa5b-4a86-9e6c-4b53d7f33342',
    ].join('\n')
    expect(steadied(other)).toBe(other)
  })
})
