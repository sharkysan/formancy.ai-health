import { describe, expect, test } from 'vitest'
import { anchorsOf, fences, linkProblems, outsideFences } from './markdown.mjs'

/**
 * Where a fenced code block is, decided once for the two guards that read
 * Markdown as GitHub shows it: the architecture's
 * (scripts/architecture.test.mjs, 0010), which reads no link, heading or
 * path inside one, and the getting-started guide's
 * (scripts/getting-started.test.mjs, 0011), which hands every one to the
 * install gate or refuses it. Each case is a fence GitHub draws as code
 * that a reading of fences at the top level alone would have missed: in
 * the guide, a block of code nobody compiles; in the architecture, a
 * "link" inside code checked as one. scripts/architecture.test.mjs holds
 * the rest of the reading -- links, headings, comments, code spans.
 */
describe('fences', () => {
  // A fence at the top level, with backticks or tildes and an info string,
  // its code without the fence's own indentation; the shape every
  // document here writes.
  test('reads a fence, its info string and its code', () => {
    expect(fences('Prose.\n\n```ts guide=node\nconst a = 1\n  const b = 2\n```\n\n~~~text\nok\n~~~\n')).toEqual([
      { open: 2, close: 5, marker: '```', info: 'ts guide=node', code: 'const a = 1\n  const b = 2' },
      { open: 7, close: 9, marker: '~~~', info: 'text', code: 'ok' },
    ])
  })

  // GitHub draws a fence inside a list item or a quote as code. Read at the
  // top level alone, the guide's block in a list item would compile
  // nowhere, and a quoted one would be prose to the architecture's link
  // check.
  test('reads a fence in a list item and in a quote, without their indentation or markers', () => {
    expect(fences('- a step\n\n  ```ts\n  const listed = 1\n    nested()\n  ```\n')).toEqual([{ open: 2, close: 5, marker: '```', info: 'ts', code: 'const listed = 1\n  nested()' }])
    expect(fences('> ```ts\n> const quoted = 2\n> ```\n')).toEqual([{ open: 0, close: 2, marker: '```', info: 'ts', code: 'const quoted = 2' }])
  })

  // Only the fence's own character, at least as long, alone on its line,
  // closes it; a shorter run, the other character, or a run with text after
  // it is code. A fence never closed runs to the end, as CommonMark has it.
  test('closes a fence only as CommonMark closes it, and runs one never closed to the end', () => {
    const markdown = ['````md', '```', '~~~~', '``` not a close', '````', 'after', '```', 'unclosed'].join('\n')
    expect(fences(markdown)).toEqual([
      { open: 0, close: 4, marker: '````', info: 'md', code: '```\n~~~~\n``` not a close' },
      { open: 6, close: undefined, marker: '```', info: '', code: 'unclosed' },
    ])
  })

  // A backtick run with a backtick in its info string is inline code, not a
  // fence; and a `>` that opens a line of code in a top-level fence is code,
  // not a quote marker to take off.
  test('reads inline code as no fence, and keeps a quote marker that is code', () => {
    expect(fences('```a` inline```\n')).toEqual([])
    expect(fences('```sh\n> prompt\n```\n')).toEqual([{ open: 0, close: 2, marker: '```', info: 'sh', code: '> prompt' }])
  })

  // A fence in a quote ends with its quote: the line that lacks the marker
  // is prose on GitHub, and read as code it would be compiled, or hidden
  // from the link check.
  test('ends a quoted fence where its quote ends', () => {
    expect(fences('> ```ts\n> const a = 1\nprose [x](y.md)\n')).toEqual([{ open: 0, close: 2, marker: '```', info: 'ts', code: 'const a = 1', ended: 'quote' }])
    expect(outsideFences('> ```ts\n> const a = 1\nprose [x](y.md)\n').split('\n')).toEqual(['', '', 'prose [x](y.md)', ''])
  })

  // A Windows checkout is the same document.
  test('reads CRLF as LF', () => {
    expect(fences('```ts\r\nconst a = 1\r\n```\r\n')).toEqual([{ open: 0, close: 2, marker: '```', info: 'ts', code: 'const a = 1' }])
  })
})

describe('the reading the guards share', () => {
  // Blanked whole, and nothing else: a heading or a link in a fence is
  // none, one after it is, and every line keeps its number, which the
  // refusals name.
  test('blanks every fence, nested ones too, and keeps the lines', () => {
    const markdown = ['# Seen', '- item', '  ```md', '  ## Hidden', '  [x](gone.md)', '  ```', '## After']
    expect(outsideFences(markdown.join('\n')).split('\n')).toEqual(['# Seen', '- item', '', '', '', '', '## After'])
    expect([...anchorsOf(markdown.join('\n'))]).toEqual(['seen', 'after'])
    expect(linkProblems('docs/x.md', markdown.join('\n'), new Set(['docs/x.md']), () => '')).toEqual([])
  })
})
