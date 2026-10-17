import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, test } from 'vitest'
import { committable, isRelative, linkProblems, linksIn, resolveLink, shown } from './markdown.mjs'

/**
 * The README is the page an evaluator, an integrator and a regulator read
 * first, and two things on it are relied on (0011):
 *
 * - its intended purpose, which says that the product is not intended as a
 *   medical device in CLAUDE.md's words, word for word. CLAUDE.md is the
 *   rule every change is held to; a README that worded the purpose
 *   otherwise would be a second statement of it that nobody compared, and
 *   the purpose a device is judged by is what its maker says it is for. A
 *   lawyer's reading of the words is the legal gate's, not this guard's;
 * - its links, to the getting-started guide, the records and the registers,
 *   each of which a rename leaves pointing at nothing, or at the top of a
 *   page whose heading moved.
 *
 * The sentence is read from CLAUDE.md's first section, the one that says
 * what the product is and is not, as the one sentence there that names a
 * medical device; nothing here types it but the guard on the guard, which
 * names what is there today to show the reading found it. The README's
 * section is the one under its `Intended purpose` heading. Headings and
 * links are read by scripts/markdown.mjs, the reading the architecture's
 * guard and the guide's share. What none of it can see is review's: that the
 * purpose describes what the packages do, that no other page claims a
 * clinical purpose, and the links into other repositories, which it does
 * not follow.
 */
const repo = join(dirname(fileURLToPath(import.meta.url)), '..')

/** A file's text, or undefined when there is none. */
function textOf(file) {
  try {
    return readFileSync(join(repo, file), 'utf8')
  } catch {
    return undefined
  }
}

/** Every run of whitespace as one space: a sentence a line break splits is still the sentence. */
const flat = (text) => text.replace(/\s+/g, ' ').trim()

/** A heading line as GitHub shows one: its level and its text. */
const HEADING = /^ {0,3}(#{1,6})[ \t]+(.*?)(?:[ \t]+#+)?[ \t]*$/

/**
 * The text under `title`'s heading in `markdown`, to the next heading of its
 * level or above, fences and comments blanked. Throws unless exactly one
 * heading has that text: a section nobody wrote holds nothing, and of two,
 * either could be the one a reader finds.
 */
function sectionOf(markdown, title, file) {
  const lines = shown(markdown).split('\n')
  const at = lines.flatMap((line, index) => (HEADING.exec(line)?.[2] === title ? [index] : []))
  if (at.length !== 1) throw new Error(`${file} has ${String(at.length)} headings "${title}", and this guard reads exactly one`)
  const level = HEADING.exec(lines[at[0]])[1].length
  const end = lines.findIndex((line, index) => index > at[0] && (HEADING.exec(line)?.[1].length ?? Infinity) <= level)
  return lines.slice(at[0] + 1, end === -1 ? lines.length : end).join('\n')
}

/** The sentences of `text`, whitespace flattened: each ends at a full stop, a question or an exclamation mark before a space and a capital, a mark or a bracket. */
const sentencesOf = (text) => flat(text).split(/(?<=[.!?])\s+(?=[A-Z*`"(\[])/)

/** CLAUDE.md's section that says what the product is and is not. */
const WHAT_IT_IS = 'What this is, and what it is not'

/**
 * The sentence of CLAUDE.md's first section that names a medical device.
 * Throws when there is none or more than one: either way, which words the
 * README must hold would be a guess.
 */
function intendedPurpose(claude) {
  const naming = sentencesOf(sectionOf(claude, WHAT_IT_IS, 'CLAUDE.md')).filter((sentence) => /medical device/i.test(sentence))
  if (naming.length !== 1) throw new Error(`CLAUDE.md's "${WHAT_IT_IS}" names a medical device in ${String(naming.length)} sentences, and this guard reads exactly one`)
  return naming[0]
}

/** Whether `readme`'s Intended purpose section holds `claude`'s sentence word for word, wherever either's lines break. */
const holdsPurpose = (readme, claude) => flat(sectionOf(readme, 'Intended purpose', 'README.md')).includes(intendedPurpose(claude))

/** Fixtures: CLAUDE.md's first section and a README around a purpose. */
const claudeOf = (sentence) => `# Working in this repository\n\n## ${WHAT_IT_IS}\n\nIt is a library. ${sentence} More follows.\n\n## Next\n\nA candidate medical device is another section's.\n`
const readmeOf = (purpose, status = '') => `# A product\n\n> **Status.** ${status}\n\n## Intended purpose\n\n${purpose}\n\n## Licence\n\nTerms.\n`
const SENTENCE = 'It is not an EHR, a FHIR server or a terminology service, and it is not intended as a\nmedical device.'

describe("the README's intended purpose", () => {
  // The purpose a device is judged by is the one its maker states. Worded
  // otherwise in the README than in the rule every change is held to, it is
  // a second statement nobody compared with the first.
  test("holds CLAUDE.md's sentence naming a medical device, word for word, in its Intended purpose section", () => {
    expect(holdsPurpose(textOf('README.md') ?? '', textOf('CLAUDE.md') ?? ''), `README.md's "Intended purpose" must hold, word for word: ${intendedPurpose(textOf('CLAUDE.md') ?? '')}`).toBe(true)
  })

  // A guard on the guard: a reading that found the wrong sentence, or a
  // section cut at the wrong heading, would hold the README to nothing. The
  // sentence as CLAUDE.md says it today.
  test("is read from CLAUDE.md's first section, as it stands", () => {
    expect(intendedPurpose(textOf('CLAUDE.md') ?? '')).toBe('It is not an EHR, a FHIR server or a terminology service, and it is not intended as a medical device.')
  })

  // Word for word is the point, and wrapped prose is how both files hold
  // it. A reading that compared lines would fail every wrapped copy; one
  // that forgave a word would pass "is not a medical device", a claim about
  // what the product is that no one has made, or a purpose said only in
  // the Status, which a reader looking for it under its heading never sees.
  test('is found however its lines break, and not when a word differs or it stands elsewhere', () => {
    const claude = claudeOf(SENTENCE)
    expect(holdsPurpose(readmeOf(`Formancy Health exports.\n${SENTENCE.replace(' a\n', '\na ')} Its forms are the customer's.`), claude)).toBe(true)
    expect(holdsPurpose(readmeOf(SENTENCE.replace('is not intended as a', 'is not a')), claude)).toBe(false)
    expect(holdsPurpose(readmeOf(SENTENCE.replace('a terminology service, and', 'a terminology service; and')), claude)).toBe(false)
    expect(holdsPurpose(readmeOf('Formancy Health exports.', SENTENCE), claude)).toBe(false)
  })

  // Of no sentence, or two, which words the README must hold would be a
  // guess, and a guess here passes for the wrong reason; so would a README
  // with no section, or two, either of which a reader might find.
  test('refuses to guess: no sentence or two in CLAUDE.md, no section or two in the README', () => {
    expect(() => intendedPurpose(claudeOf('It is a format converter.'))).toThrow(/names a medical device in 0 sentences/)
    expect(() => intendedPurpose(claudeOf(`${SENTENCE} It is no medical device either.`))).toThrow(/names a medical device in 2 sentences/)
    expect(() => intendedPurpose('# Working in this repository\n\n## Elsewhere\n\nIt is not intended as a medical device.\n')).toThrow(/has 0 headings "What this is, and what it is not"/)
    expect(() => holdsPurpose('# A product\n\nNo purpose.\n', claudeOf(SENTENCE))).toThrow(/README.md has 0 headings "Intended purpose"/)
    expect(() => holdsPurpose(`${readmeOf(SENTENCE)}\n## Intended purpose\n\nAgain.\n`, claudeOf(SENTENCE))).toThrow(/README.md has 2 headings "Intended purpose"/)
  })

  // A heading inside a fence is code, not a section, and a section runs to
  // the next heading of its level or above, not to its own sub-headings.
  test('reads its section as GitHub shows it: to the next heading of its level, past its own sub-headings and fences', () => {
    const readme = `# A product\n\n## Intended purpose\n\nIt exports.\n\n### In more detail\n\n${SENTENCE}\n\n\`\`\`md\n## Licence\n\`\`\`\n\n## Licence\n\n${SENTENCE}\n`
    expect(flat(sectionOf(readme, 'Intended purpose', 'README.md'))).toBe(`It exports. ### In more detail ${flat(SENTENCE)}`)
  })
})

describe("the README's links", () => {
  // The first page's links to the guide, the records and the registers. A
  // record renamed, a heading reworded or the guide moved leaves a link to
  // nothing, or to the top of a page, and the README is read before any
  // other file here.
  test('each land on a file git would commit, and on a heading of it', () => {
    expect(linkProblems('README.md', textOf('README.md') ?? '', committable(repo), textOf)).toEqual([])
  })

  // A guard on the guard, and the README's promise: a reading that found no
  // link would pass the check above, and a README without the guide would
  // send a developer to the package READMEs' fragments.
  test('are read, the getting-started guide and the release registers among them', () => {
    const targets = linksIn(textOf('README.md') ?? '')
      .filter(isRelative)
      .map((href) => resolveLink('README.md', href).target)
    expect(targets).toEqual(expect.arrayContaining(['docs/getting-started.md', 'docs/release/README.md', 'LICENSE.md', 'NOTICE', 'RELEASING.md']))
  })
})
