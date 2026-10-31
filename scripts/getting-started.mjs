/**
 * docs/getting-started.md, read as the install gate and the repository's
 * guard read it: one reading, so the two cannot disagree about which blocks
 * there are or where each goes (0011; formancy.ai-report 0015, whose
 * reading this is, for Health's one kind of host).
 *
 * Every fenced block names its language. A block of code is handed to the
 * gate by its info string, and the gate compiles TypeScript only:
 *
 *   ```ts guide=node        the program, in the order the guide shows it
 *   ```text guide=node      what the program prints
 *   ```sh guide=node        npm install lines, and npm pkg set type=module
 *   ```json                 a tool's configuration, tsconfig.json, untagged
 *
 * A host is a kind of application the gate builds from the guide, each the
 * `guide` of a host in install-hosts.mjs. Its blocks are one module, in the
 * order the guide shows them, which is the order a reader types them in. A
 * block the gate would not run is refused, with its line, rather than
 * skipped: a guide whose code nothing compiles drifts silently.
 *
 * Where a fence is, and what GitHub shows, is scripts/markdown.mjs's, which
 * the architecture's guard reads with too. What it cannot tell apart is
 * refused rather than guessed: an HTML comment, whose content GitHub hides,
 * and a line indented as code after a blank line, which GitHub draws as an
 * indented code block -- with no info string to tag -- unless it is a
 * list's paragraph.
 */

import { fences, lettered, outsideFences, shown } from './markdown.mjs'

const GUIDE = 'docs/getting-started.md'

/** Languages that are code a reader copies and runs. */
const CODE = new Set(['ts', 'tsx', 'typescript', 'mts', 'cts', 'js', 'jsx', 'javascript', 'mjs', 'cjs', 'node'])

/**
 * The one language a block may be written in without a guide= tag: a tool's
 * own configuration file a reader edits, tsconfig.json, which the guard
 * holds to the gate's. Everything else names its host, or is refused -- an
 * untagged shell block could tell a reader to install what the gate never
 * installs, and an untagged output block show what nothing compares.
 */
const UNTAGGED = new Set(['json'])

/** What an info string may say after its language. */
const ATTRIBUTES = new Set(['guide'])

/**
 * `npm install` and the packages it names, each with a version or without,
 * one flag before them: `--save-dev` for the tools a project builds with,
 * at their ranges, or `--save-exact` for what the application imports,
 * saved as the release it installs rather than npm's default range; and the
 * one setting a project needs, `npm pkg set type=module`. Nothing else is a
 * line of an install block.
 */
const INSTALL = /^npm install(?: +(--save-dev|--save-exact))?((?: +[@a-z0-9][\w.@~^/-]*)+)$/
const SETTING = /^npm pkg set (type)=(module)$/

/** Every quote marker a line opens with, and the space after each. */
const QUOTES = /^(?: {0,3}> ?)*/

/**
 * Every fenced block in `markdown`, in order, where GitHub draws one -- in
 * a list item and in a quote too: the line its fence opens on (from 1), its
 * language, the attributes its info string gives (split on any whitespace,
 * a tab included), its code, whether it was closed, and `lead`, the prose
 * just before it, which says what the block is and which file it goes in: a
 * reader of the rendered guide sees no info string.
 */
export function fencedBlocks(markdown) {
  const source = markdown.replaceAll('\r\n', '\n')
  const visible = shown(source).split('\n')
  return fences(source).map((block) => {
    const [language = '', ...words] = block.info.split(/\s+/).filter((word) => word !== '')
    const attributes = new Map(words.map((word) => [word.split('=')[0], word.includes('=') ? word.slice(word.indexOf('=') + 1) : '']))
    return { line: block.open + 1, language, attributes, words, code: block.code, closed: block.close !== undefined, lead: leadOf(visible, block.open) }
  })
}

/** The run of non-blank lines `visible` shows before line `open`, blank lines between them and it skipped. */
function leadOf(visible, open) {
  let at = open - 1
  while (at >= 0 && visible[at].trim() === '') at -= 1
  const lines = []
  for (; at >= 0 && visible[at].trim() !== ''; at -= 1) lines.unshift(visible[at].trim())
  return lines.join('\n')
}

/**
 * What GitHub hides or draws as code with no info string, refused with its
 * line: an HTML comment outside code -- a declaration in one would make the
 * code shown compile against code nobody is shown -- and a line indented
 * four columns after a blank line.
 */
function refuseHidden(source) {
  const text = outsideFences(source)
  const comment = lettered(text).indexOf('<!--')
  if (comment !== -1) {
    throw new Error(
      `${GUIDE} line ${String(text.slice(0, comment).split('\n').length)}: an HTML comment, which GitHub does not show, so what it holds is in the source and not in the guide a reader follows; delete it`,
    )
  }
  const lines = text.split('\n').map((line) => line.replace(QUOTES, ''))
  for (const [at, line] of lines.entries()) {
    if (/^(?: {4}|\t)/.test(line) && line.trim() !== '' && (at === 0 || lines[at - 1].trim() === '')) {
      throw new Error(
        `${GUIDE} line ${String(at + 1)}: a line indented as code after a blank line, which GitHub draws as an indented code block with no info string to tag, unless it is a list's paragraph, which this reading does not tell apart; fence it, or indent it less`,
      )
    }
  }
}

/**
 * The guide as the gate builds it, for `hosts` -- each host's guide, by its
 * kind: `{ kind, entry, prints }` -- as a map from kind to what it gets:
 * `code`, its module's code; `output`, the lines its program is shown
 * printing, or null; `installs`, every package its install lines name, with
 * the version given or null, `dev` for a tool and `exact` for one saved as
 * its release; `settings`, what `npm pkg
 * set` sets; and `blocks`, the line every block it was given opens on.
 * Throws, naming the line, on any block the gate would not run, and on a
 * host given no code.
 */
export function readGuide(markdown, hosts) {
  const source = markdown.replaceAll('\r\n', '\n')
  refuseHidden(source)
  const known = new Map(hosts.map((host) => [host.kind, host]))
  const read = new Map(hosts.map((host) => [host.kind, { code: null, output: null, installs: [], settings: {}, blocks: [] }]))
  for (const block of fencedBlocks(source)) {
    const where = `${GUIDE} line ${String(block.line)}`
    if (!block.closed) throw new Error(`${where}: a fence never closed, which runs to the end of the guide on GitHub, prose and all; close it`)
    const language = block.language.toLowerCase()
    if (language === '') throw new Error(`${where}: a fence with no language, so nothing can say whether it is code the gate should run`)
    const unknown = block.words.filter((word) => !ATTRIBUTES.has(word.split('=')[0]) || !word.includes('='))
    if (unknown.length > 0) throw new Error(`${where}: ${unknown.join(' ')} is not something a block's info string says here; it says guide=`)
    const tag = block.attributes.get('guide')
    if (tag === undefined) {
      if (CODE.has(language)) throw new Error(`${where}: a ${block.language} block with no guide= tag, which the install gate would never compile or run`)
      if (!UNTAGGED.has(language))
        throw new Error(
          `${where}: a ${block.language} block with no guide= tag; only ${[...UNTAGGED].join(', ')} may go untagged, so an install line or an output nothing checks cannot slip in`,
        )
      continue
    }
    const kinds = tag.split(',')
    for (const kind of kinds) {
      if (!known.has(kind)) throw new Error(`${where}: guide=${kind} is no host the install gate builds; it builds ${[...known.keys()].join(', ')}`)
    }
    if (new Set(kinds).size !== kinds.length) throw new Error(`${where}: guide=${tag} names a host twice`)
    for (const kind of kinds) read.get(kind).blocks.push(block.line)

    if (language === 'ts') {
      for (const kind of kinds) {
        const entry = read.get(kind)
        entry.code = entry.code === null ? block.code : `${entry.code}\n\n${block.code}`
      }
    } else if (language === 'tsx') {
      throw new Error(`${where}: a tsx block; ${kinds[0]} compiles ${known.get(kinds[0]).entry}, which is TypeScript without JSX`)
    } else if (CODE.has(language)) {
      throw new Error(`${where}: a ${block.language} block; the install gate compiles TypeScript, so write it as ts`)
    } else if (language === 'text') {
      for (const kind of kinds) {
        if (!known.get(kind).prints) throw new Error(`${where}: ${kind}'s run compares no output, so an output block for it is a claim nothing checks`)
        const entry = read.get(kind)
        entry.output = entry.output === null ? block.code : `${entry.output}\n${block.code}`
      }
    } else if (language === 'sh') {
      for (const line of block.code
        .split('\n')
        .map((text) => text.trim())
        .filter((text) => text !== '')) {
        const setting = SETTING.exec(line)
        const installs = setting === null ? installLine(line, where) : []
        for (const kind of kinds) {
          if (setting !== null) read.get(kind).settings[setting[1]] = setting[2]
          read.get(kind).installs.push(...installs)
        }
      }
    } else {
      throw new Error(`${where}: guide= on a ${block.language} block, which the gate neither compiles, compares nor installs`)
    }
  }
  for (const [kind, entry] of read) {
    if (entry.code === null) throw new Error(`${GUIDE} gives ${kind} no ${known.get(kind).entry}, the module the install gate runs for it`)
  }
  return read
}

/**
 * The packages an `npm install` line names, each `{ name, version, dev,
 * exact }`: the version null when the line gives none, `dev` for a tool
 * installed with --save-dev, `exact` for a package saved with --save-exact.
 */
function installLine(line, where) {
  const match = INSTALL.exec(line)
  if (match === null) throw new Error(`${where}: ${line} is not an npm install line or npm pkg set type=module, which is all an install block holds`)
  const dev = match[1] === '--save-dev'
  const exact = match[1] === '--save-exact'
  return match[2]
    .trim()
    .split(/ +/)
    .map((spec) => {
      const at = spec.indexOf('@', 1)
      return at === -1 ? { name: spec, version: null, dev, exact } : { name: spec.slice(0, at), version: spec.slice(at + 1), dev, exact }
    })
}

/**
 * The package each import of `code` names -- `@formancy/spec` for
 * `@formancy/spec/validate` -- and `node:` for a Node built-in; relative
 * imports are none.
 */
export function importedPackages(code) {
  const specifiers = [...code.matchAll(/\bfrom\s+['"]([^'"]+)['"]|\bimport\s+['"]([^'"]+)['"]|\bimport\(\s*['"]([^'"]+)['"]\s*\)/g)].map(
    (match) => match[1] ?? match[2] ?? match[3],
  )
  const packages = specifiers
    .filter((specifier) => !specifier.startsWith('.'))
    .map((specifier) => {
      if (specifier.startsWith('node:')) return 'node:'
      const parts = specifier.split('/')
      return specifier.startsWith('@') ? parts.slice(0, 2).join('/') : parts[0]
    })
  return [...new Set(packages)].sort()
}
