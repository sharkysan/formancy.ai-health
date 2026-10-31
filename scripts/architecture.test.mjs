import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join, posix } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, test } from 'vitest'
import YAML from 'yaml'
import { CODE_SPAN, anchorsOf, committable, isRelative, linkProblems, linksIn, resolveLink, shown } from './markdown.mjs'

/**
 * The architecture documentation held to the repository it describes:
 * docs/README.md, the entry, and docs/architecture/, which is arc42 in the
 * files formancy.ai's docs/architecture/ gives it. Those depart from arc42
 * in one place: arc42's section on decisions is the records in
 * docs/decisions/, and 09 and 10 are the quality requirements and
 * formancy.ai's verification, which arc42 does not have.
 *
 * Prose does not break, so five ways of it quietly describing another
 * repository fail here instead:
 *
 * (a) a section or the entry missing, the entry not linking every section,
 *     or a file in docs/architecture/ that is none of them;
 * (b) a workspace package or app that the building blocks do not name,
 *     read from pnpm-workspace.yaml's globs and each manifest's `name`, so
 *     that a package is placed in section 5 by the pull request that adds
 *     it; a manifest with no name is named nowhere;
 * (c) a decision record that no section links to, so that a new record is
 *     placed in the architecture by the pull request that writes it;
 * (d) a relative link in the entry or a section that names no file git
 *     would commit -- one deleted from the disk and not yet from the index
 *     included -- or a fragment that names no heading of the Markdown file
 *     it points into, as GitHub anchors headings. The sections link the
 *     modules, scripts and workflows they name, so a rename fails here too;
 * (e) a path the entry or a section writes as code that names no file git
 *     would commit: a span with a slash, or with the extension of a kind of
 *     file the repository holds, read from the document when it starts at
 *     `./` or `../` and otherwise as the end of a committed path, whole
 *     segments, a directory or a glob included. So a test, a module or a
 *     script named and not linked, or named otherwise than its link, fails
 *     when it is renamed too.
 *
 * Everything is read from the files: the manifests, the directory listings,
 * the links and code spans as Markdown writes them, and the names and
 * headings as GitHub shows them, so nothing inside a fenced block or an
 * HTML comment counts. Nothing here matches a phrase of the prose. What none
 * of it can see is review's: whether a sentence is still true of what it
 * links or names, whether a package is described where it is named and a
 * record linked from the section it changes, which file a bare name means
 * where several end in it, a name with neither a slash nor an extension --
 * `NOTICE` -- which is read as a word, and the links into other
 * repositories, which are not followed. Headings are read as `#` headings;
 * an underlined heading's anchor is not seen, so a link to one is refused,
 * which is the safe side. The reading of Markdown -- where a fence or a
 * comment is, a link and a heading's anchor -- is scripts/markdown.mjs's,
 * which the getting-started guide's guard shares (0011), so the two cannot
 * read one document two ways.
 */
const repo = join(dirname(fileURLToPath(import.meta.url)), '..')

/** The entry: who reads what, the sections, the decisions. */
const ENTRY = 'docs/README.md'

const ARCHITECTURE = 'docs/architecture'

/** The sections, by the names formancy.ai's docs/architecture/ gives them. */
const SECTIONS = [
  '01-introduction-and-goals.md',
  '02-constraints.md',
  '03-context-and-scope.md',
  '04-solution-strategy.md',
  '05-building-blocks.md',
  '06-runtime-view.md',
  '07-deployment-view.md',
  '08-crosscutting-concepts.md',
  '09-quality-requirements.md',
  '10-verification.md',
  '11-risks-and-debt.md',
  '12-glossary.md',
]

const BUILDING_BLOCKS = `${ARCHITECTURE}/05-building-blocks.md`

const DECISIONS = 'docs/decisions'

/** A decision record's file name: its number, then its title. */
const RECORD = /^\d{4}-.+\.md$/

/** A file's text, or undefined when there is none. */
function textOf(file) {
  try {
    return readFileSync(join(repo, file), 'utf8')
  } catch (error) {
    if (error.code === 'ENOENT' || error.code === 'EISDIR') return undefined
    throw error
  }
}

/** A directory's entries, or none when it is not there. */
function listing(directory) {
  try {
    return readdirSync(join(repo, directory), { withFileTypes: true })
  } catch (error) {
    if (error.code === 'ENOENT') return []
    throw error
  }
}

/**
 * Every workspace package and app, as `{ file, name }`: the directories
 * pnpm-workspace.yaml names, each `<directory>/*` or a directory, and the
 * `name` each one's manifest gives. The root is the workspace, not one of
 * its packages. Another pattern throws rather than being read as matching
 * nothing.
 */
function workspacePackages() {
  const workspace = YAML.parse(textOf('pnpm-workspace.yaml') ?? '') ?? {}
  const directories = []
  for (const pattern of workspace.packages ?? []) {
    const each = /^([\w.-]+(?:\/[\w.-]+)*)\/\*$/.exec(pattern)
    if (each === null && !/^[\w.-]+(?:\/[\w.-]+)*$/.test(pattern)) {
      throw new Error(`pnpm-workspace.yaml: ${pattern} is not <directory>/* or a directory, which is all this guard reads; teach it`)
    }
    if (each === null) directories.push(pattern)
    else for (const entry of listing(each[1])) if (entry.isDirectory()) directories.push(`${each[1]}/${entry.name}`)
  }
  return directories.flatMap((directory) => {
    const text = textOf(`${directory}/package.json`)
    if (text === undefined) return []
    const { name } = JSON.parse(text)
    return [{ file: `${directory}/package.json`, name: typeof name === 'string' ? name : '' }]
  })
}

/** Every decision record's path, from the directory listing. */
const decisionRecords = () =>
  listing(DECISIONS)
    .filter((entry) => entry.isFile() && RECORD.test(entry.name))
    .map((entry) => `${DECISIONS}/${entry.name}`)

/** Whether `text` names `name` whole: not as a part of a longer name. No name is named by any text. */
function names(text, name) {
  if (name === '') return false
  const escaped = name.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')
  return new RegExp(`(?<![\\w@./-])${escaped}(?![\\w/-]|\\.\\w)`).test(text)
}

/** Each of `packages` that `markdown` does not show by name, as `name (file)`. */
function unnamed(markdown, packages) {
  const text = shown(markdown)
  return packages.filter(({ name }) => !names(text, name)).map(({ file, name }) => `${name === '' ? 'a package with no name' : name} (${file})`)
}

/** The text of every code span `markdown` shows, as CommonMark gives it: a line break read as a space, and one space taken from each end of a span that has one at both. */
function spansIn(markdown) {
  return [...shown(markdown).matchAll(CODE_SPAN)].map((span) => {
    const text = span[2].replace(/\n/g, ' ')
    return /^ .* $/.test(text) && text.trim() !== '' ? text.slice(1, -1) : text
  })
}

/**
 * The extensions a bare file name is read as a path by: those of the files
 * the repository holds. A test below fails when git would commit a file of
 * another kind.
 */
const EXTENSIONS = new Set(['.css', '.html', '.json', '.md', '.mjs', '.mts', '.ts', '.tsx', '.webp', '.yaml', '.yml'])

/**
 * Whether a code span is a path: segments of letters, digits, `_`, `.`, `-`
 * and the wildcard `*`, perhaps after `./` or `../`, with a `/` in it or an
 * extension of EXTENSIONS at its end. No space, no scheme, no `@` and no
 * leading `/`, so a command, an address, a package's specifier and a URL's
 * path are not one.
 */
const isPath = (text) => /^(?:\.\.?\/)*[\w.*-]+(?:\/[\w.*-]+)*\/?$/.test(text) && (text.includes('/') || EXTENSIONS.has(posix.extname(text)))

// A path as a regular expression's source: `**/` any directories, `**` anything, `*` anything within one segment.
const globSource = (path) =>
  path.replace(/\/$/, '').replace(/\*\*\/|\*\*|\*|[.+?^${}()|[\]\\]/g, (token) => ({ '**/': '(?:[^/]+/)*', '**': '.*', '*': '[^/]*' })[token] ?? `\\${token}`)

/**
 * What is wrong with each path `file` writes as code, one sentence each: a
 * path past the root, and one that names nothing in `files`, what git would
 * commit. A path that starts at `./` or `../` is read from the document;
 * any other names every file it is the end of, whole segments, so that
 * `json-read.ts` and `health-core/src/json-read.ts` both find health-core's
 * reader. One that ends at `/` is a directory, and a directory is named by
 * any file below it. `files` stands in for the repository in a fixture.
 */
function pathProblems(file, markdown, files) {
  return [...new Set(spansIn(markdown))].filter(isPath).flatMap((span) => {
    const fromDocument = /^\.\.?\//.test(span)
    const path = fromDocument ? posix.normalize(posix.join(posix.dirname(file), span)) : span
    if (path === '..' || path.startsWith('../')) return [`${file}: \`${span}\` leads out of the repository`]
    const pattern = new RegExp(`${fromDocument ? '^' : '(?:^|/)'}${globSource(path)}${span.endsWith('/') ? '/' : '(?:/|$)'}`)
    return [...files].some((committed) => pattern.test(committed)) ? [] : [`${file}: \`${span}\` names no file or directory git would commit`]
  })
}

/** The entry and every Markdown file in docs/architecture/, by path. */
const documents = () => [
  ENTRY,
  ...listing(ARCHITECTURE)
    .filter((entry) => entry.isFile() && entry.name.endsWith('.md'))
    .map((entry) => `${ARCHITECTURE}/${entry.name}`),
]

describe('the architecture', () => {
  // A reader told the architecture is arc42 looks for a section by its
  // number. One missing, renamed, or never linked from the entry is a
  // section nobody finds; a file beside them is a section neither arc42
  // nor formancy.ai has, and the place one subject quietly goes.
  test("is the entry and formancy.ai's sections of arc42, each linked from the entry, and nothing else", () => {
    const missing = [ENTRY, ...SECTIONS.map((name) => `${ARCHITECTURE}/${name}`)].filter((file) => textOf(file) === undefined)
    expect(missing, 'write these; formancy.ai docs/architecture/ has the shape').toEqual([])
    const linked = new Set(
      linksIn(textOf(ENTRY))
        .filter(isRelative)
        .map((href) => resolveLink(ENTRY, href).target),
    )
    expect(
      SECTIONS.filter((name) => !linked.has(`${ARCHITECTURE}/${name}`)),
      `${ENTRY} does not link these`,
    ).toEqual([])
    const extra = listing(ARCHITECTURE)
      .map((entry) => entry.name)
      .filter((name) => !SECTIONS.includes(name))
    expect(extra, 'not one of the sections: fold it into the section it belongs to').toEqual([])
  })

  // A package added to the workspace and not to the building blocks leaves
  // section 5 drawing a repository with one package fewer, and nothing in
  // the package's own pull request would notice. Named only in a code
  // block or a comment, it is still not drawn for a reader; with no name
  // at all, it is drawn nowhere.
  test('names every workspace package and app in the building blocks', () => {
    expect(unnamed(textOf(BUILDING_BLOCKS) ?? '', workspacePackages()), `${BUILDING_BLOCKS} must name each, and say what it may import`).toEqual([])
  })

  // A decision changes what the architecture says. One cited nowhere in it
  // is a decision the sections were not edited for, and the record the
  // reader of a section would need is the one it does not point to.
  test('links every decision record from a section', () => {
    const cited = new Set(
      documents()
        .filter((file) => file !== ENTRY)
        .flatMap((file) =>
          linksIn(textOf(file) ?? '')
            .filter(isRelative)
            .map((href) => resolveLink(file, href).target),
        ),
    )
    expect(
      decisionRecords().filter((record) => !cited.has(record)),
      'place each in the section it changes, by a link to its file',
    ).toEqual([])
  })

  // A link to a file that moved, to one git ignores -- the plan, a build --
  // or to a heading since reworded opens on nothing, or on GitHub's 404,
  // and reads as true in the source.
  test('links only to files git would commit, and to headings they have', () => {
    const files = committable(repo)
    expect(documents().flatMap((file) => linkProblems(file, textOf(file) ?? '', files, textOf))).toEqual([])
  })

  // A file the sections name as code and do not link -- the test that
  // holds a scenario, a module in a table, a gate's script -- renamed or
  // deleted leaves the sentence citing nothing, and the link check above
  // never reads it.
  test('names as code only paths git would commit', () => {
    const files = committable(repo)
    expect(documents().flatMap((file) => pathProblems(file, textOf(file) ?? '', files))).toEqual([])
  })

  // A bare file name is read as a path by its extension, so a kind of file
  // the list does not hold, named as code by its name alone, would be read
  // as a word, and pass renamed. The list is written rather than derived
  // from the files, so that the last file of a kind deleted still leaves
  // its name read as a path, and refused.
  test('reads a bare name of every kind of file git would commit as a path', () => {
    const kinds = new Set([...committable(repo)].map((file) => posix.extname(file)).filter((extension) => extension !== ''))
    expect(
      [...kinds].filter((extension) => !EXTENSIONS.has(extension)),
      'add each to EXTENSIONS',
    ).toEqual([])
  })

  // A guard on the guard: each check above is about absence, so a walk that
  // read nothing -- no manifest found, no record listed, no link parsed, no
  // path read in a code span -- would pass them forever. What the files
  // hold today.
  test('reads the workspace, the records, the links and the paths at all', () => {
    const packages = workspacePackages().map(({ name }) => name)
    expect(packages).toEqual(
      expect.arrayContaining(['@formancy/health-core', '@formancy/health-questionnaire', '@formancy/health-document', '@formancy/health-corpus']),
    )
    expect(packages).not.toContain('formancy-health')
    expect(decisionRecords()).toContain(`${DECISIONS}/0001-a-paid-module-in-its-own-repository.md`)
    expect(decisionRecords()).not.toContain(`${DECISIONS}/README.md`)
    const links = documents().flatMap((file) =>
      linksIn(textOf(file) ?? '')
        .filter(isRelative)
        .map((href) => resolveLink(file, href))
        .filter((link) => link.outside !== true),
    )
    const targets = links.map((link) => link.target)
    expect(
      links.filter((link) => link.target.endsWith('.md') && (link.fragment ?? '') !== ''),
      'no anchor into Markdown was checked',
    ).not.toEqual([])
    expect(targets.filter((target) => target.startsWith(`${DECISIONS}/`))).not.toEqual([])
    expect(targets.filter((target) => target.startsWith('packages/health-core/src/'))).not.toEqual([])
    expect(targets.filter((target) => target.startsWith('scripts/'))).not.toEqual([])
    const paths = documents().flatMap((file) => spansIn(textOf(file) ?? '').filter(isPath))
    expect(
      paths.filter((path) => !path.includes('/')),
      'no bare file name was read as a path',
    ).not.toEqual([])
    expect(
      paths.filter((path) => path.startsWith('scripts/')),
      'no path into scripts/ was read',
    ).not.toEqual([])
  })
})

describe('the Markdown reader', () => {
  // Links are read as Markdown writes them. Wrapped text, an image, a title
  // and a definition are each a link GitHub follows; a link shown in a code
  // block or a code span is an example, and checking it would refuse the
  // documentation of a link.
  test('finds every link GitHub follows, and none inside code', () => {
    const markdown = [
      'See [a](one.md), ![b](two.png "a title") and [a link that\nwraps](three.md#part).',
      'Not `[c](four.md)`, and [`code` in its text](five.md).',
      '```text',
      '[d](six.md)',
      '```',
      '[e]: <seven.md>',
      '[f](https://example.org/x) and [g](#local).',
    ].join('\n')
    expect(linksIn(markdown)).toEqual(['one.md', 'two.png', 'three.md#part', 'five.md', 'https://example.org/x', '#local', 'seven.md'])
    expect(linksIn(markdown).filter(isRelative)).toEqual(['one.md', 'two.png', 'three.md#part', 'five.md', '#local', 'seven.md'])
  })

  // An anchor the reader computed otherwise than GitHub would refuse a
  // link that works, or pass one that opens at the top of the page. The
  // shapes the sections' headings take: a number, code, a link, a dash, a
  // heading given twice, and a `#` inside a fence, which is no heading.
  test("gives a heading GitHub's anchor", () => {
    const markdown = [
      '# 5. Building blocks',
      '## `@formancy/health-core`',
      '### [0005](x.md) and the gate',
      '## What it costs — and why ##',
      '## Notes',
      '## Notes',
      '```',
      '# not a heading',
      '```',
    ].join('\n')
    expect([...anchorsOf(markdown)]).toEqual(['5-building-blocks', 'formancyhealth-core', '0005-and-the-gate', 'what-it-costs--and-why', 'notes', 'notes-1'])
  })

  // Each way a link opens on nothing, refused with its reason, beside a
  // link that works: past the root, a directory, a file git ignores, a
  // line anchor into source, a heading that is not there.
  test('refuses each link that leads nowhere, and only those', () => {
    const files = new Set(['docs/architecture/01-a.md', 'docs/decisions/README.md', 'packages/x/src/y.ts'])
    const read = (file) => (file === 'docs/decisions/README.md' ? '# Index\n' : '## Here\n')
    const markdown =
      '[ok](../decisions/README.md#index) [self](#here) [code](../../packages/x/src/y.ts) [up](../../../elsewhere.md) [dir](../decisions/) [plan](../plan.md) [line](../../packages/x/src/y.ts#L3) [gone](../decisions/README.md#nothing)'
    expect(linkProblems('docs/architecture/01-a.md', markdown, files, read)).toEqual([
      'docs/architecture/01-a.md: ../../../elsewhere.md leads out of the repository',
      'docs/architecture/01-a.md: ../decisions/ names docs/decisions, a directory: link its README.md',
      'docs/architecture/01-a.md: ../plan.md names docs/plan.md, which is no file git would commit',
      'docs/architecture/01-a.md: ../../packages/x/src/y.ts#L3 has a fragment into a file that is not Markdown, which nothing here can check',
      'docs/architecture/01-a.md: ../decisions/README.md#nothing names no heading of docs/decisions/README.md',
    ])
  })

  // A span read as a path that is none -- a command, a specifier, a
  // member, a number -- would fail the sections for a word; a path not
  // read as one would pass renamed. A slash makes a path, `n/a` too, so a
  // span with one that names no file is written otherwise. A name with no
  // extension and no slash, `NOTICE` or `.npmrc`, is a word to this
  // reading, and an extension alone is no file.
  test('reads as a path what names one, and nothing else', () => {
    const paths = [
      'health-core/src/json-read.ts',
      'json-read.ts',
      'scripts/',
      '.github/workflows/gates.yml',
      '../decisions/',
      'scripts/**/*.test.mjs',
      'json-*.ts',
      'docs/release',
      'pnpm-workspace.yaml',
      'vitest.repo.config.mts',
      'n/a',
    ]
    const others = [
      '@formancy/health-*',
      '@types/node',
      'pnpm test:repo',
      '/Questionnaire/',
      '.mjs',
      '.npmrc',
      'NOTICE',
      'JSON.parse',
      'context.entries[2].resource.subject',
      '0.010',
      '7.0.2',
      'SEE LICENSE IN LICENSE.md',
      'urn:uuid:',
      'v*',
      '-tx n/a',
    ]
    expect(paths.filter((text) => !isPath(text))).toEqual([])
    expect(others.filter(isPath)).toEqual([])
  })

  // Each way a path written as code names nothing, refused with its
  // reason, beside the ways it names something: its whole path or the
  // segments it ends in, a directory, a glob, a path from the document.
  // Half a segment is not a file's name, and a file is not a directory.
  // A span in a code block or an HTML comment is an example and is not
  // read.
  test('finds a path where it ends, and refuses one that names nothing', () => {
    const files = new Set([
      'packages/health-core/src/json-read.ts',
      'packages/health-core/src/json-read.test.ts',
      'scripts/validator/corpus.test.mjs',
      'docs/release/validator.json',
      'docs/architecture/06-b.md',
    ])
    const good =
      '`packages/health-core/src/json-read.ts` `json-read.ts` `src/json-read.test.ts` `scripts/validator/` `docs/release` `json-*.ts` `scripts/**/*.test.mjs` `../release/validator.json` `./06-b.md` `` json-read.ts ``'
    expect(pathProblems('docs/architecture/05-a.md', good, files)).toEqual([])
    const bad = [
      '`json-reader.ts` `son-read.ts` `json-read.ts/` `dist/` `check-*.ts`',
      '`../../../outside.md` `../README.md`',
      '```text',
      '`fenced.ts`',
      '```',
      '<!-- `commented.ts` -->',
    ].join('\n')
    expect(pathProblems('docs/architecture/05-a.md', bad, files)).toEqual([
      'docs/architecture/05-a.md: `json-reader.ts` names no file or directory git would commit',
      'docs/architecture/05-a.md: `son-read.ts` names no file or directory git would commit',
      'docs/architecture/05-a.md: `json-read.ts/` names no file or directory git would commit',
      'docs/architecture/05-a.md: `dist/` names no file or directory git would commit',
      'docs/architecture/05-a.md: `check-*.ts` names no file or directory git would commit',
      'docs/architecture/05-a.md: `../../../outside.md` leads out of the repository',
      'docs/architecture/05-a.md: `../README.md` names no file or directory git would commit',
    ])
  })

  // A package's name inside a longer one is not that package: section 5
  // naming @formancy/health-core-ch alone must not count as naming
  // @formancy/health-core, nor health-core without its scope.
  test('finds a name whole, and not inside another', () => {
    expect(names('`@formancy/health-core` writes.', '@formancy/health-core')).toBe(true)
    expect(names('as @formancy/health-core.', '@formancy/health-core')).toBe(true)
    expect(names('`@formancy/health-core-ch`', '@formancy/health-core')).toBe(false)
    expect(names('health-core', '@formancy/health-core')).toBe(false)
    // A manifest with no name would otherwise be found in any text with a
    // space after a comma, which section 5 always has.
    expect(names('anything, at all', '')).toBe(false)
    expect(names('', '')).toBe(false)
  })

  // What GitHub does not show, a reader does not see: a package named only
  // in a code block or an HTML comment, a heading inside a comment, or a
  // link there, would let section 5 pass for a package it never shows, a
  // fragment pass into a heading nobody can open, or a record count as
  // cited. A `<!--` inside a code span starts no comment.
  test('reads no name, heading or link inside a code block or an HTML comment', () => {
    const markdown = [
      '| `@formancy/health-core` | yes |',
      '```text',
      '@formancy/health-ch',
      '```',
      '<!-- @formancy/health-de -->',
      '<!--',
      '## Hidden',
      '[e](eight.md)',
      '-->',
      'Shown: `<!-- no comment` and @formancy/health-at.',
      '## Seen',
      '<!-- never closed',
      '## Unseen',
    ].join('\n')
    const packages = ['@formancy/health-core', '@formancy/health-ch', '@formancy/health-de', '@formancy/health-at', ''].map((name, at) => ({
      file: `p${String(at)}`,
      name,
    }))
    expect(unnamed(markdown, packages)).toEqual(['@formancy/health-ch (p1)', '@formancy/health-de (p2)', 'a package with no name (p4)'])
    expect([...anchorsOf(markdown)]).toEqual(['seen'])
    expect(linksIn(markdown)).toEqual([])
    expect(shown(markdown).split('\n')).toHaveLength(markdown.split('\n').length)
  })
})
