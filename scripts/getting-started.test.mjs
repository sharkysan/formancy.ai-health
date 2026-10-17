import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, test } from 'vitest'
import { fencedBlocks, importedPackages, readGuide } from './getting-started.mjs'
import { GUIDE_HOSTS, HOSTS } from './install-hosts.mjs'
import { committable, linkProblems, linksIn } from './markdown.mjs'

/**
 * docs/getting-started.md and the install gate, held to each other without
 * running the gate (0011; formancy.ai-report 0015). The gate compiles and
 * runs what the guide hands it; this holds that the guide hands it
 * everything -- no block of code escapes, and the module the gate writes is
 * type-checked and run there -- that section 1 tells a reader to install
 * what the code imports and exactly what the gate installs, and that every
 * link the guide gives lands on a file and a heading. Each guard was watched
 * failing against the guide with the defect it names put in by hand.
 */

const repo = join(dirname(fileURLToPath(import.meta.url)), '..')
const GUIDE = 'docs/getting-started.md'
const guide = readFileSync(join(repo, GUIDE), 'utf8')
const fixture = join(repo, 'scripts', 'install-fixture')

/** A file's text, or undefined when there is none. */
function textOf(file) {
  try {
    return readFileSync(join(repo, file), 'utf8')
  } catch {
    return undefined
  }
}

/** The published packages' manifests, by name: what the gate packs into every project. */
function published() {
  const root = join(repo, 'packages')
  return new Map(
    readdirSync(root)
      .map((name) => JSON.parse(readFileSync(join(root, name, 'package.json'), 'utf8')))
      .filter((manifest) => manifest.private !== true)
      .map((manifest) => [manifest.name, manifest]),
  )
}

/** The host of HOSTS that builds `kind`'s part of the guide, by its name. */
const hostOf = (kind) => Object.entries(HOSTS).find(([, host]) => host.guide?.kind === kind)

/** What the guide gives each host, as the gate reads it. */
const read = () => readGuide(guide, GUIDE_HOSTS)

/** The relative modules a fixture runner imports, statically or with import(), by specifier. */
const runnerImports = (runner) => [...readFileSync(join(fixture, runner), 'utf8').matchAll(/^import\s[^'"]*['"](\.[^'"]+)['"]|\bimport\(\s*['"](\.[^'"]+)['"]\s*\)/gm)].map((match) => match[1] ?? match[2])

describe('docs/getting-started.md', () => {
  // A block of code nothing compiles reads as true and drifts from the
  // packages unnoticed, which is the failure the guide's gate exists for.
  test('hands every block of code to a host the install gate builds', () => {
    const code = fencedBlocks(guide).filter((block) => /^(ts|tsx|typescript|mts|cts|js|jsx|javascript|mjs|cjs|node)$/i.test(block.language))
    expect(code.length).toBeGreaterThan(4)
    expect(code.filter((block) => !block.attributes.has('guide')).map((block) => block.line)).toEqual([])
    expect(() => read()).not.toThrow()
  })

  // A kind the guide writes for that no project builds would take its
  // blocks nowhere, and the gate would pass without them.
  test('is built by a project the gate plans, for every host a block names', () => {
    const used = new Set(fencedBlocks(guide).flatMap((block) => block.attributes.get('guide')?.split(',') ?? []))
    expect([...used].sort()).toEqual(GUIDE_HOSTS.map((host) => host.kind).sort())
    for (const kind of used) expect(hostOf(kind), kind).toBeDefined()
  })

  // An import of a package section 1 never names compiles in the gate --
  // npm put it there as something else's dependency -- and fails for the
  // reader who installed what the guide said.
  test('imports only what section 1 tells a reader to install', () => {
    for (const [kind, given] of read()) {
      const installed = new Set(given.installs.map((install) => install.name))
      const missing = importedPackages(given.code).filter((name) => name !== 'node:' && !installed.has(name))
      expect(missing, `${kind} imports what no install line names`).toEqual([])
    }
  })

  // The gate's project is the reader's: a package the guide installs that
  // the gate does not is one the gate never ran the guide beside, one the
  // gate installs that the guide does not is one the program may lean on
  // unseen, and a version the guide pins that is not the gate's is a
  // release nobody ran it with.
  test("tells a reader to install exactly what the gate installs into the guide's project, at the versions it installs", () => {
    const packages = published()
    for (const [kind, given] of read()) {
      const [name, host] = hostOf(kind)
      const application = given.installs.filter((install) => !install.dev)
      const gate = new Map([...[...packages].map(([package_, manifest]) => [package_, manifest.version]), ...Object.entries(host.with)])
      expect(application.map((install) => install.name).sort(), `${name} installs`).toEqual([...gate.keys()].sort())
      const pinned = application.filter((install) => install.version !== null)
      expect(pinned.map((install) => `${install.name}@${install.version}`), name).toEqual(pinned.map((install) => `${install.name}@${gate.get(install.name)}`))
      // Beside a published package, what the gate installs is pinned,
      // as the gate pins it: an unpinned one is whatever npm finds.
      expect(Object.keys(host.with).filter((package_) => !pinned.some((install) => install.name === package_)), `${name} pins`).toEqual([])
      // And saved as the gate saves it, exactly: npm saves `@formancy/spec@0.5.0`
      // as `^0.5.0`, and a reader's next install without the lockfile takes
      // 0.5.1 beside health-questionnaire's 0.5.0 -- two copies of the form's
      // types, the thing section 1 warns of.
      expect(application.filter((install) => !install.exact).map((install) => install.name), `${name} saves exactly`).toEqual([])
    }
  })

  // The program runs only in a project set up as the gate's: ES modules (it
  // awaits at its top level), the tools the gate builds it with, at their
  // ranges, and the compiler settings it is checked under -- skipLibCheck
  // off among them. A looser tsconfig would hide what the gate's shows.
  test("sets a reader's project up as the gate sets up its own", () => {
    for (const [kind, given] of read()) {
      const [, host] = hostOf(kind)
      expect(given.settings).toEqual({ type: 'module' })
      const tools = given.installs.filter((install) => install.dev)
      expect(Object.fromEntries(tools.map((install) => [install.name, install.version]))).toEqual(host.tools)
      const tsconfig = fencedBlocks(guide).filter((block) => block.language === 'json' && block.lead.includes('`tsconfig.json`'))
      expect(tsconfig.map((block) => block.line), 'one tsconfig.json block').toHaveLength(1)
      expect(JSON.parse(tsconfig[0].code).compilerOptions).toEqual(host.tsconfig.compilerOptions)
    }
  })

  // The guide leans on the package READMEs and the decision records -- a
  // refusal's rules, a context's members, what the validator judges -- and
  // a renamed heading there would break its link silently. Every relative
  // link must reach a file git would commit, and every anchor a heading of
  // it, by the one reading the architecture's guard uses (scripts/markdown.mjs).
  test('links only to files git would commit, and to headings they have', () => {
    const links = linksIn(guide).filter((href) => !/^[a-z][a-z0-9+.-]*:/i.test(href))
    expect(links.length).toBeGreaterThan(5)
    expect(links.filter((href) => /\.md#./.test(href)), 'no anchor into Markdown was checked').not.toEqual([])
    expect(linkProblems(GUIDE, guide, committable(repo), textOf)).toEqual([])
  })

  // A reader of the rendered guide sees no info string: the file a block
  // goes in must be said in the sentence that leads into it, or the reader
  // is left to guess where the code goes.
  test('names, in the prose before it, the file every block of code goes in', () => {
    const entries = new Map(GUIDE_HOSTS.map((host) => [host.kind, host.entry]))
    const unnamed = fencedBlocks(guide)
      .filter((block) => block.language === 'ts' && block.attributes.has('guide'))
      .filter((block) => !block.lead.includes(`\`${entries.get(block.attributes.get('guide'))}\``))
      .map((block) => `line ${String(block.line)}`)
    expect(unnamed).toEqual([])
  })

  // A module the gate writes and never compiles or runs is a block that
  // passes whatever it says.
  test("gives the guide's module to its project's type-check, its runner and a step", () => {
    for (const host of Object.values(HOSTS)) {
      if (host.guide === undefined) continue
      const { entry, runner } = host.guide
      expect(host.tsconfig.include).toContain('guide')
      expect(host.tsconfig.include).toContain(runner)
      expect(runnerImports(runner)).toContain(`./guide/${entry.replace(/\.ts$/, '.js')}`)
      expect(host.steps.some((step) => step.command.includes(runner)), `no step runs ${runner}`).toBe(true)
      expect(host.steps.some((step) => step.command[0] === 'tsc'), 'no step type-checks the guide').toBe(true)
    }
  })

  // The consumer's project holds the tarballs and nothing beside them, so
  // that a package's import of what it never declared fails there; the
  // guide's Report packages, and what they bring, would resolve in a
  // shared project and let it pass (formancy.ai-report 0015's reason for a
  // page of its own).
  test('leaves the consumer’s project holding the tarballs alone', () => {
    const consumers = Object.values(HOSTS).filter((host) => host.guide === undefined)
    expect(consumers.map((host) => host.consumer)).toEqual(['consume.ts'])
    expect(consumers.map((host) => host.with)).toEqual([{}])
  })
})

/** Two hosts: the guide's, which runs one module and compares its output, and one that compares none. */
const HOSTS_FIXTURE = [
  { kind: 'node', entry: 'referral.ts', prints: true },
  { kind: 'quiet', entry: 'quiet.ts', prints: false },
]
const guideOf = (...blocks) => blocks.join('\n\n')
const fence = (info, code) => `\`\`\`${info}\n${code}\n\`\`\``

describe("the guide's reading", () => {
  // The gate builds the program in the order a reader types it, so a block
  // that defines what a later one uses must come first in the module.
  test('appends each block to its host in order, a block for two hosts to both', () => {
    const given = readGuide(
      guideOf(
        '# A guide',
        fence('sh guide=node,quiet', 'npm install --save-exact @formancy/health-core @formancy/spec@0.5.0'),
        fence('ts guide=node', 'const a = 1'),
        fence('ts guide=quiet', 'export const b = 2'),
        fence('ts guide=node', 'console.log(a)'),
        fence('text guide=node', '1'),
        fence('json', '{}'),
      ),
      HOSTS_FIXTURE,
    )
    expect(given.get('node')).toEqual({
      code: 'const a = 1\n\nconsole.log(a)',
      output: '1',
      installs: [
        { name: '@formancy/health-core', version: null, dev: false, exact: true },
        { name: '@formancy/spec', version: '0.5.0', dev: false, exact: true },
      ],
      settings: {},
      blocks: [3, 7, 15, 19],
    })
    expect(given.get('quiet').code).toBe('export const b = 2')
    expect(given.get('quiet').blocks).toEqual([3, 11])
  })

  // A project set up as the guide tells a reader to: the module type and
  // the tools it builds with, kept apart from what the program imports, so
  // the guard can hold each to what the gate's project is given.
  test('reads the project setting and the tools a reader installs to build with', () => {
    const given = readGuide(guideOf(fence('sh guide=node', 'npm pkg set type=module\nnpm install --save-dev typescript@~6.0.3 tsx@^4.20.3'), fence('ts guide=node', 'const a = 1'), fence('ts guide=quiet', 'const q = 0')), HOSTS_FIXTURE)
    expect(given.get('node').settings).toEqual({ type: 'module' })
    expect(given.get('node').installs).toEqual([
      { name: 'typescript', version: '~6.0.3', dev: true, exact: false },
      { name: 'tsx', version: '^4.20.3', dev: true, exact: false },
    ])
  })

  // Whether a line saves what it installs exactly is read, so the guard can
  // hold every application line to it; an install line without the flag
  // is read as saving a range, which is npm's default.
  test('reads whether an install line saves its packages exactly', () => {
    const given = readGuide(guideOf(fence('sh guide=node', 'npm install @formancy/spec@0.5.0\nnpm install --save-exact @formancy/health-core'), fence('ts guide=node', 'const a = 1'), fence('ts guide=quiet', 'const q = 0')), HOSTS_FIXTURE)
    expect(given.get('node').installs).toEqual([
      { name: '@formancy/spec', version: '0.5.0', dev: false, exact: false },
      { name: '@formancy/health-core', version: null, dev: false, exact: true },
    ])
    expect(() => readGuide(guideOf(fence('sh guide=node', 'npm install --save-exact --save-dev tsx'), fence('ts guide=node', 'const a = 1'), fence('ts guide=quiet', 'const q = 0')), HOSTS_FIXTURE)).toThrow(/is not an npm install line/)
  })

  // Each of these is a block the gate would write and never run, or not
  // write at all; refused with its line, so the guide is fixed rather than
  // the block skipped.
  test.each([
    ['a TypeScript block with no tag', fence('ts', 'const a = 1'), /line 1: a ts block with no guide= tag/],
    ['a fence with no language', fence('', 'const a = 1'), /line 1: a fence with no language/],
    ['a JavaScript block, which the gate does not compile', fence('js guide=node', 'const a = 1'), /line 1: a js block; the install gate compiles TypeScript/],
    ['a TSX block, which no host here compiles', fence('tsx guide=node', 'const a = <p />'), /line 1: a tsx block; node compiles referral.ts/],
    ['a host the gate does not build', fence('ts guide=browser', 'const a = 1'), /guide=browser is no host the install gate builds; it builds node, quiet/],
    ['a host named twice', fence('ts guide=node,node', 'const a = 1'), /guide=node,node names a host twice/],
    ['an attribute the reading does not know', fence('ts guide=node file=other.ts', 'const a = 1'), /file=other.ts is not something a block's info string says here; it says guide=/],
    ['output for a host whose run compares none', fence('text guide=quiet', 'ok'), /quiet's run compares no output/],
    ['an install block holding something else', fence('sh guide=node', 'npm i left-pad'), /is not an npm install line/],
    ['a tag on a block the gate neither compiles, compares nor installs', fence('json guide=node', '{}'), /guide= on a json block/],
    ['an untagged TypeScript block in a list item', '- a step\n\n  ```ts\n  const a = 1\n  ```', /line 3: a ts block with no guide= tag/],
    ['an untagged TypeScript block in a quote', '> ```ts\n> const a = 1\n> ```', /line 1: a ts block with no guide= tag/],
    ['an indented code block, which has no info string to tag', 'Some prose.\n\n    const a = 1', /line 3: a line indented as code/],
    ['a node fence, which GitHub highlights as code', fence('node', 'const a = 1'), /a node block with no guide= tag/],
    ['an untagged install line', fence('sh', 'npm install @formancy/health-core'), /a sh block with no guide= tag; only json/],
    ['an untagged bash block', fence('bash', 'npm install @formancy/health-ch'), /a bash block with no guide= tag/],
    ['an untagged output nothing compares', fence('text', 'refused: unmapped'), /a text block with no guide= tag/],
    // What GitHub hides, a reader does not see: a declaration in a comment
    // would make the code shown compile against code nobody is shown.
    ['an HTML comment', '<!--\n```ts guide=node\nconst hidden = 4\n```\n-->', /line 1: an HTML comment/],
  ])('refuses %s', (_, markdown, message) => {
    expect(() => readGuide(guideOf(markdown, fence('ts guide=node', 'const z = 0'), fence('ts guide=quiet', 'const y = 0')), HOSTS_FIXTURE)).toThrow(message)
  })

  // A fence never closed runs to the end of the guide on GitHub, prose and
  // all; the gate would compile the prose, or a reader copy it.
  test('refuses a fence never closed', () => {
    expect(() => readGuide(guideOf(fence('ts guide=quiet', 'const y = 0'), '```ts guide=node\nconst a = 1\n\nprose'), HOSTS_FIXTURE)).toThrow(/line 5: a fence never closed/)
  })

  // A host given nothing to run would pass its runner's import only by
  // failing it, far from the guide that lost the block.
  test('refuses a guide that gives a host no module to run', () => {
    expect(() => readGuide(fence('ts guide=node', 'const a = 1'), HOSTS_FIXTURE)).toThrow(/gives quiet no quiet.ts/)
  })

  // The gate compiles the code a reader sees: a fence in a list item, in a
  // quote, or with a tab before its tag is code on GitHub and is compiled.
  test('reads code where GitHub shows it', () => {
    const given = readGuide(
      guideOf('- first\n\n  ```ts guide=node\n  const listed = 1\n  ```', '> ```ts guide=node\n> const quoted = 2\n> ```', '```ts\tguide=node\nconst tabbed = 3\n```', fence('ts guide=quiet', 'const y = 0')),
      HOSTS_FIXTURE,
    )
    expect(given.get('node').code).toBe('const listed = 1\n\nconst quoted = 2\n\nconst tabbed = 3')
    expect(given.get('node').blocks).toEqual([3, 7, 11])
  })

  // CRLF from a Windows checkout, and a tilde fence, are the same guide;
  // and the prose a block follows is what the guard reads its file in.
  test('reads fences as CommonMark does, line ends and tildes alike, each with the prose before it', () => {
    const blocks = fencedBlocks('In `referral.ts`:\r\n~~~ts guide=node\r\nconst a = 1\r\n~~~\r\n')
    expect(blocks.map(({ line, language, code, lead }) => ({ line, language, code, lead }))).toEqual([{ line: 2, language: 'ts', code: 'const a = 1', lead: 'In `referral.ts`:' }])
  })
})

describe('the packages a module imports', () => {
  // What section 1 must name: a package once, by its name, whatever subpath
  // or form of import names it.
  test('are named once each, without their subpath, Node built-ins as node:', () => {
    const code = [
      "import { writeJson } from '@formancy/health-core'",
      "import type { FormSchema } from '@formancy/spec'",
      "import '@formancy/spec/validate'",
      "import { writeFile } from 'node:fs/promises'",
      "import { c } from './other.js'",
      "export { d } from '@formancy/health-ch'",
      "const e = await import('@formancy/report-render-pdf')",
    ].join('\n')
    expect(importedPackages(code)).toEqual(['@formancy/health-ch', '@formancy/health-core', '@formancy/report-render-pdf', '@formancy/spec', 'node:'])
  })
})
