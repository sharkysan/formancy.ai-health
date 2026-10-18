// @vitest-environment node
import { readJson, writeJson, type FhirJson } from '@formancy/health-core'
import { describe, expect, test } from 'vitest'
import { letterOf, sampleOf } from './build/plugin.js'
import { byFile, firstOf } from './exports.js'
import { pretty } from './pretty.js'

/** `text` without the whitespace between JSON's tokens: the string literals kept as they are, everything else stripped of space and line breaks. */
function compacted(text: string): string {
  return text.replace(/("(?:[^"\\]|\\.)*")|\s+/g, (match, string: string | undefined) => string ?? '')
}

const first = byFile(firstOf(sampleOf(), await letterOf()))
const written = [...first.values()].flatMap((outcome) => (outcome.kind === 'made' ? [outcome.json] : []))

describe('JSON laid out for reading', () => {
  // The page shows the laid-out text and downloads writeJson's bytes: if
  // the layout changed a token, what a visitor reads would say other than
  // what they download -- a decimal's trailing zero, a string's content.
  test('says what the bytes say, token for token, for every resource the page shows', () => {
    expect(written).toHaveLength(5)
    for (const json of written) {
      expect(compacted(pretty(json))).toBe(json)
      expect(writeJson(readJson(pretty(json)))).toBe(json)
    }
  })

  // A string is the one place a brace, a comma or a colon is not JSON's:
  // broken there, a canonical or a person's answer would be split across
  // lines that are not in it. An escaped quote must not end the string.
  test('adds nothing inside a string, escapes included', () => {
    const json = writeJson({ resourceType: 'Basic', text: 'a {b}, [c]: "d" \\ e' } as FhirJson)
    expect(pretty(json)).toBe('{\n  "resourceType": "Basic",\n  "text": "a {b}, [c]: \\"d\\" \\\\ e"\n}')
  })

  // writeJson writes no whitespace: shown as written, a CH ORF document is
  // one line of thousands of characters, which nobody reads.
  test('puts each member and item on a line of its own, indented by its depth', () => {
    expect(pretty('{"a":[{"b":true},"c"]}')).toBe('{\n  "a": [\n    {\n      "b": true\n    },\n    "c"\n  ]\n}')
  })
})
