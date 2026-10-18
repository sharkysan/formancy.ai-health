// The sentence that says what Formancy Health is not, read from CLAUDE.md
// (0011): the rule every change is held to says the product's intended
// purpose in one sentence of its first section, the README's *Intended
// purpose* holds it word for word (scripts/readme.test.mjs), and the demo's
// page shows it as its build reads it here (0012), so no page states the
// purpose in words nobody compared with CLAUDE.md's.
//
// Read through scripts/markdown.mjs, as the README's links are: a heading
// inside a fence is code, not a section.

import { shown } from './markdown.mjs'

/** Every run of whitespace as one space: a sentence a line break splits is still the sentence. */
export const flat = (text) => text.replace(/\s+/g, ' ').trim()

/** A heading line as GitHub shows one: its level and its text. */
const HEADING = /^ {0,3}(#{1,6})[ \t]+(.*?)(?:[ \t]+#+)?[ \t]*$/

/**
 * The text under `title`'s heading in `markdown`, to the next heading of its
 * level or above, fences and comments blanked. Throws unless exactly one
 * heading has that text: a section nobody wrote holds nothing, and of two,
 * either could be the one a reader finds.
 */
export function sectionOf(markdown, title, file) {
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
export const WHAT_IT_IS = 'What this is, and what it is not'

/**
 * The sentence of CLAUDE.md's first section that names a medical device.
 * Throws when there is none or more than one: either way, which words the
 * README must hold would be a guess.
 */
export function intendedPurpose(claude) {
  const naming = sentencesOf(sectionOf(claude, WHAT_IT_IS, 'CLAUDE.md')).filter((sentence) => /medical device/i.test(sentence))
  if (naming.length !== 1) throw new Error(`CLAUDE.md's "${WHAT_IT_IS}" names a medical device in ${String(naming.length)} sentences, and this guard reads exactly one`)
  return naming[0]
}
