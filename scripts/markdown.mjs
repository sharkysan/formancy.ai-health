// Markdown as GitHub shows it, read once for every guard here that follows
// a link, an anchor or a block of code: the architecture's
// (scripts/architecture.test.mjs, 0010), the getting-started guide's,
// whose reading the install gate shares (scripts/getting-started.mjs,
// 0011), and the README's (scripts/readme.test.mjs, 0011). Two copies of where a fence is, or of the anchor a heading gets,
// could disagree -- formancy.ai-report found three of its copies of the
// anchor rule doing so -- and a link one passed would be one the other
// refused, or one GitHub lands at the top of the page.
//
// No Markdown parser: the reading is line by line, and every refusal it
// feeds names a line. What it reads as GitHub does: a fence opening a line
// after any quote markers and any indentation, so one in a list item or a
// quote is a fence; a fence closed by its own character, at least as long,
// alone on its line, by the end of its quote, or by the end of the
// document; an HTML comment outside code spans, to its end; a link inline
// or by definition; a heading's anchor from the text it renders. What it
// does not: a fence in a list item is read to its closing line even where
// a line indented less ends the item on GitHub, and an underlined heading
// is no heading here, so a link to one is refused, the safe side.

import { execFileSync } from 'node:child_process'
import { posix } from 'node:path'

/** One quote marker: up to three spaces, `>`, and the one space after it that belongs to it. */
const QUOTE_MARKER = /^ {0,3}> ?/

/** `line` with up to `depth` quote markers taken off, and how many there were. */
function unquoted(line, depth = Infinity) {
  let rest = line
  let markers = 0
  while (markers < depth) {
    const marker = QUOTE_MARKER.exec(rest)
    if (marker === null) break
    rest = rest.slice(marker[0].length)
    markers += 1
  }
  return { rest, markers }
}

/** A fence's opening, once its line's quote markers and indentation are off: three or more backticks or tildes, and its info string. */
const OPENING = /^(`{3,}|~{3,})(.*)$/

/**
 * Every fenced code block of `markdown`, in order: `{ open, close, marker,
 * info, code }`, `open` and `close` the lines (from 0) of its fences --
 * `close` undefined when it runs to the end, and `ended: 'quote'` where its
 * quote ended it, at the first line outside it -- `info` its info string,
 * trimmed, and `code` its lines without their quote markers and without
 * the opening fence's own indentation, as CommonMark takes it off.
 */
export function fences(markdown) {
  const lines = markdown.replaceAll('\r\n', '\n').split('\n')
  const found = []
  let block
  for (let at = 0; at < lines.length; at += 1) {
    if (block !== undefined) {
      const { rest, markers } = unquoted(lines[at], block.depth)
      if (markers < block.depth) {
        found.push({ ...shape(block), close: at, ended: 'quote' })
        block = undefined
      } else {
        const closing = /^[ \t]*(`{3,}|~{3,})[ \t]*$/.exec(rest)
        if (closing !== null && closing[1][0] === block.marker[0] && closing[1].length >= block.marker.length) {
          found.push({ ...shape(block), close: at })
          block = undefined
        } else {
          block.lines.push(rest.replace(new RegExp(`^ {0,${String(block.indent)}}`), ''))
        }
        continue
      }
    }
    const { rest, markers } = unquoted(lines[at])
    const content = rest.trimStart()
    const opening = OPENING.exec(content)
    if (opening === null || (opening[1][0] === '`' && opening[2].includes('`'))) continue
    block = { open: at, marker: opening[1], info: opening[2].trim(), depth: markers, indent: rest.length - content.length, lines: [] }
  }
  if (block !== undefined) found.push({ ...shape(block), close: undefined })
  return found
}

/** What `fences` says of a block. */
const shape = (block) => ({ open: block.open, marker: block.marker, info: block.info, code: block.lines.join('\n') })

/** `markdown` with every fenced block's lines blanked, its fences included, so nothing inside one is read as a heading or a link. */
export function outsideFences(markdown) {
  const lines = markdown.replaceAll('\r\n', '\n').split('\n')
  for (const block of fences(markdown)) {
    const last = block.close === undefined ? lines.length - 1 : block.ended === 'quote' ? block.close - 1 : block.close
    for (let at = block.open; at <= last; at += 1) lines[at] = ''
  }
  return lines.join('\n')
}

/** A code span: a run of backticks, text that crosses no blank line, and the same run again. */
export const CODE_SPAN = /(`+)((?:(?!\n[ \t]*\n)[\s\S])*?[^`])\1(?!`)/g

/** Inline code turned to letters, line breaks kept: a bracket inside a code span is no link, and a link around one is still a link. */
export const lettered = (text) => text.replace(CODE_SPAN, (span) => span.replace(/[^\n]/g, 'x'))

/**
 * `markdown` as GitHub shows it: every fenced block and HTML comment
 * blanked, line breaks and code spans kept. A comment is looked for outside
 * code spans, and one never closed runs to the end, as an HTML block does.
 */
export function shown(markdown) {
  const text = outsideFences(markdown)
  let at = 0
  let out = ''
  for (const comment of lettered(text).matchAll(/<!--[\s\S]*?(?:-->|$)/g)) {
    const end = comment.index + comment[0].length
    out += text.slice(at, comment.index) + text.slice(comment.index, end).replace(/[^\n]/g, ' ')
    at = end
  }
  return out + text.slice(at)
}

/** An inline link or image: its text, which may wrap and hold one level of brackets, and its destination, with an optional title. */
const LINK = /!?\[((?:[^[\]]|\[[^[\]]*\])*)\]\(\s*(<[^<>\n]*>|[^\s()<>]*(?:\([^\s()]*\)[^\s()<>]*)*)(?:\s+(?:"[^"]*"|'[^']*'))?\s*\)/g

/** A link reference definition: `[label]: destination`. */
const DEFINITION = /^ {0,3}\[[^\]\n]+\]:[ \t]*(<[^<>\n]*>|\S+)/gm

/** Every link `markdown` shows, inline or by definition, by its destination as written. */
export function linksIn(markdown) {
  const text = lettered(shown(markdown))
  return [...text.matchAll(LINK), ...text.matchAll(DEFINITION)].map((found) => found.at(-1).replace(/^<(.*)>$/, '$1'))
}

/** Whether a destination is relative: no scheme, and not `//host`. */
export const isRelative = (href) => !/^[a-z][a-z0-9+.-]*:/i.test(href) && !href.startsWith('//')

/**
 * The anchor GitHub gives a heading's text: a link read as its text, code as
 * its letters, lowercased, everything but letters, marks, digits, `_`, `-`
 * and spaces dropped, and each space a hyphen.
 */
const slug = (text) =>
  text
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/`/g, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{M}\p{N}\p{Pc}\- ]/gu, '')
    .replace(/ /g, '-')

/** The anchors of the `#` headings a Markdown file shows, a repeated one with -1, -2 after it, as GitHub numbers them. */
export function anchorsOf(markdown) {
  const seen = new Map()
  const anchors = new Set()
  for (const line of shown(markdown).split('\n')) {
    const heading = /^ {0,3}#{1,6}(?:[ \t]+(.*?))?(?:[ \t]+#+)?[ \t]*$/.exec(line)
    if (heading === null) continue
    const base = slug(heading[1] ?? '')
    const count = seen.get(base) ?? 0
    seen.set(base, count + 1)
    anchors.add(count === 0 ? base : `${base}-${String(count)}`)
  }
  return anchors
}

/**
 * Where a relative link in `file` leads: `{ target, fragment }`, the target a
 * `/`-separated path from the repository's root -- `file` itself for a bare
 * fragment -- or `{ outside: true }` past the root.
 */
export function resolveLink(file, href) {
  const at = href.indexOf('#')
  const path = decodeURIComponent(at === -1 ? href : href.slice(0, at))
  const fragment = at === -1 ? undefined : decodeURIComponent(href.slice(at + 1))
  const target = path === '' ? file : posix.normalize(posix.join(posix.dirname(file), path)).replace(/\/$/, '')
  return target === '..' || target.startsWith('../') ? { outside: true } : { target, fragment }
}

/**
 * What is wrong with `file`'s relative links, one sentence each: a target
 * past the root, one git would not commit -- a directory, an ignored file,
 * none at all -- a fragment into a file that is not Markdown, and one that
 * names no heading. `files` is what git would commit, and `read` a file's
 * text, so that a fixture can stand in for the repository.
 */
export function linkProblems(file, markdown, files, read) {
  return linksIn(markdown)
    .filter(isRelative)
    .flatMap((href) => {
      const link = resolveLink(file, href)
      if (link.outside) return [`${file}: ${href} leads out of the repository`]
      if (!files.has(link.target)) {
        const directory = [...files].some((path) => path.startsWith(`${link.target}/`))
        return [`${file}: ${href} names ${link.target}, ${directory ? 'a directory: link its README.md' : 'which is no file git would commit'}`]
      }
      if (link.fragment === undefined || link.fragment === '') return []
      if (!link.target.endsWith('.md')) return [`${file}: ${href} has a fragment into a file that is not Markdown, which nothing here can check`]
      return anchorsOf(read(link.target) ?? '').has(link.fragment) ? [] : [`${file}: ${href} names no heading of ${link.target}`]
    })
}

/** `git ls-files` with `flags`, in `repo`, as `/`-separated paths. */
const gitFiles = (repo, ...flags) =>
  execFileSync('git', ['ls-files', '-z', ...flags], { cwd: repo, encoding: 'utf8' })
    .split('\0')
    .filter((file) => file !== '')

/**
 * Every file git would commit in `repo`, `/`-separated: tracked and still on
 * the disk, and new but not ignored. A file deleted and not yet staged is
 * still in the index, and its deletion is what the next commit would hold.
 */
export function committable(repo) {
  const deleted = new Set(gitFiles(repo, '--deleted'))
  return new Set(gitFiles(repo, '--cached', '--others', '--exclude-standard').filter((file) => !deleted.has(file)))
}
