import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterAll, describe, expect, test } from 'vitest'
import { ASSETS, headersFor } from './demo-headers.mjs'
import { BUILD, configProblems, demoBase, demoUrl, headersFile, indexProblems, readDemoConfig, stageDemo, WRANGLER } from './demo.mjs'

/**
 * The demo at formancy.ai/health/ (0012), as formancy.ai-report's
 * scripts/demo.test.mjs holds Report's Studio at /report/: README.md's
 * "Try it" held to the manifests and the demo's Vite config it depends
 * on; the Worker's config held to one path of formancy.ai; the headers
 * every file is served with held to a policy that allows the page no
 * connection and nothing but its own assets, written by the one function
 * `vite preview`, the gate and the deploy read, for each one's address; what
 * the deploy stages; and the records of what nothing here can
 * read -- the Worker's build settings in Cloudflare's dashboard, the
 * Wrangler a person logs in with -- held to the deploy they describe.
 * Prose names a script, a port, an address and a Worker; none breaks when
 * a manifest or a config moves, so this does.
 */
const repo = join(dirname(fileURLToPath(import.meta.url)), '..')
const text = (file) => readFileSync(join(repo, file), 'utf8').replaceAll('\r\n', '\n')
const readme = text('README.md')
const root = JSON.parse(text('package.json'))
const demo = JSON.parse(text('apps/demo/package.json'))
const config = text('apps/demo/vite.config.ts')
const wrangler = readDemoConfig()
/** The demo's address on formancy.ai, which the deploy writes the headers for. */
const PAGE = demoUrl(wrangler)

/** The text under `## <title>`, up to the next heading of that level. */
function section(title) {
  const start = readme.indexOf(`\n## ${title}\n`)
  if (start === -1) return ''
  const end = readme.indexOf('\n## ', start + 1)
  return readme.slice(start, end === -1 ? undefined : end)
}

/** The port the config gives `server` or `preview`, which strictPort keeps from wandering. */
function port(block) {
  const match = new RegExp(`\\b${block}: \\{ port: (\\d+), strictPort: true\\b`).exec(config)
  return match === null ? undefined : Number(match[1])
}

describe("README.md's Try it", () => {
  const tryIt = section('Try it')
  const commands = [...tryIt.matchAll(/```bash\n([\s\S]*?)```/g)].flatMap((match) => match[1].split('\n')).filter((line) => line.trim() !== '')

  // A section renamed or its block reformatted would leave the checks below
  // reading nothing and passing.
  test('is a section with one block of commands, ending in pnpm demo', () => {
    expect(tryIt).not.toBe('')
    expect(commands.at(-1)).toBe('pnpm demo')
  })

  // A root script renamed or dropped would leave the README telling a
  // newcomer to run a command pnpm does not have, the first thing they try.
  test("names only pnpm's own install and the root's scripts", () => {
    for (const line of commands.filter((each) => each.startsWith('pnpm '))) {
      const [, name] = line.split(' ')
      expect(name === 'install' || Object.hasOwn(root.scripts, name), line).toBe(true)
    }
  })

  // The demo a reader runs is the build formancy.ai serves, served by
  // Vite's preview with the demo's own config. A demo that ran the dev
  // server would show a page under no policy, whose client opens the
  // WebSocket the policy refuses.
  test('runs the build and then serves the built demo', () => {
    expect(root.scripts.demo).toBe('pnpm build && pnpm --filter @formancy/health-demo preview')
    expect(demo.name).toBe('@formancy/health-demo')
    expect(demo.scripts.preview).toBe('vite preview')
  })

  // A port changed in the config would leave the README sending a reader to
  // an address nothing answers; every port the README names is the demo's.
  test("names only the demo's port, for both the demo and the dev server", () => {
    const preview = port('preview')
    expect(preview).toBeDefined()
    expect(port('server')).toBe(preview)
    expect(tryIt).toContain(`http://localhost:${String(preview)}`)
    const named = [...readme.matchAll(/(?:localhost:|\bport )(\d{2,5})\b/g)].map((match) => Number(match[1]))
    expect(named.length).toBeGreaterThan(0)
    for (const each of named) expect(each).toBe(preview)
  })

  // A route moved in the Worker's config would leave the README sending a
  // reader to formancy.ai's 404 while the demo answered somewhere else.
  test("sends a reader to the address the demo's Worker is routed at", () => {
    expect(tryIt).toContain(demoUrl(wrangler))
  })
})

describe('the demo on formancy.ai (0012)', () => {
  const base = { ...wrangler, routes: wrangler.routes.map((route) => ({ ...route })), assets: { ...wrangler.assets } }

  // The Worker as committed: the built demo at one path of formancy.ai, and
  // at no address beside it.
  test("the demo's Wrangler config serves the built demo at /health/ of formancy.ai and nowhere else", () => {
    expect(configProblems(wrangler)).toEqual([])
    expect(demoBase(wrangler)).toBe('/health/')
    expect(demoUrl(wrangler)).toBe('https://formancy.ai/health/')
  })

  // Each would put the demo somewhere the README and the gate do not say, or
  // put more than the built demo there: a workers.dev address beside the
  // route, a route on another site, code at the edge, a path without its
  // slash answered by formancy.ai's 404, the staging directory another than
  // the one the deploy fills, or a page answering for a file the build does
  // not hold.
  test.each([
    ['a workers.dev address', { ...base, workers_dev: true }, 'workers_dev'],
    ['a preview address per version', { ...base, preview_urls: true }, 'preview_urls'],
    ['code that runs at the edge', { ...base, main: 'worker.js' }, 'main'],
    ['a route on another zone', { ...base, routes: [{ pattern: 'formancy.ai/health/*', zone_name: 'example.com' }, base.routes[1]] }, 'zone'],
    ['no route for the path without its slash', { ...base, routes: [base.routes[0]] }, 'formancy.ai/health'],
    ['a route for the whole site', { ...base, routes: [{ pattern: 'formancy.ai/*', zone_name: 'formancy.ai' }, { pattern: 'formancy.ai', zone_name: 'formancy.ai' }] }, 'path'],
    ['a custom domain', { ...base, routes: [...base.routes, { pattern: 'health.formancy.ai', custom_domain: true }] }, 'custom_domain'],
    ['assets staged elsewhere', { ...base, assets: { ...base.assets, directory: './dist' } }, '.cloudflare'],
    ['no redirect from /health to /health/', { ...base, assets: { ...base.assets, html_handling: 'none' } }, 'auto-trailing-slash'],
    ['the page for a path it does not hold', { ...base, assets: { ...base.assets, not_found_handling: 'single-page-application' } }, 'not_found_handling'],
  ])('refuses %s', (_name, given, says) => {
    const problems = configProblems(given)
    expect(problems.length).toBeGreaterThan(0)
    expect(problems.join('\n')).toContain(says)
  })

  // A page built with an absolute base asks formancy.ai for /assets/…, the
  // site's own directory: the demo is a blank page while every log says it
  // deployed (formancy.ai-report 0018). The deploy refuses it before
  // anything is uploaded.
  test('refuses a built page that asks for a file by an absolute path, and only that', () => {
    expect(indexProblems('<script type="module" crossorigin src="./assets/index-a.js"></script><link rel="stylesheet" crossorigin href="./assets/index-b.css">')).toEqual([])
    expect(indexProblems('<link rel="icon" href="data:," /><a href="https://github.com/sharkysan/formancy.ai-health">')).toEqual([])
    expect(indexProblems('<script type="module" crossorigin src="/assets/index-a.js"></script>')).toEqual(['src="/assets/index-a.js"'])
    expect(indexProblems('<link rel="modulepreload" crossorigin href="/health/assets/c.js">')).toEqual(['href="/health/assets/c.js"'])
  })

  // The deploy is the root's script, after the same build `pnpm demo` makes,
  // and with the Wrangler the script names, never whatever npx finds newest.
  test('is deployed by the root script, after the build, with a pinned Wrangler', () => {
    expect(root.scripts['demo:deploy']).toBe('pnpm build && node scripts/demo.mjs')
    expect(WRANGLER).toMatch(/^wrangler@\d+\.\d+\.\d+$/)
  })

  // Cloudflare's Workers Builds runs the commands its dashboard holds, which
  // nothing here can read; REPO-METADATA.md records them. Recorded apart
  // from `pnpm demo:deploy`, the two would drift, and the demo deployed on
  // a push to main would be built or checked otherwise than one deployed by
  // hand. The Worker's name is the dashboard's too, and Workers Builds
  // refuses a config that names another: written here as well, a rename is
  // a change to the config, the record and this test together, never to
  // one of them alone.
  test("REPO-METADATA.md's Workers Builds settings are pnpm demo:deploy's halves, for the demo's Worker and this repository", () => {
    const metadata = text('.github/REPO-METADATA.md')
    const setting = (name) => new RegExp(`^\\| ${name} \\| \`([^\`]+)\` \\|`, 'm').exec(metadata)?.[1]
    expect(wrangler.name).toBe('formancy-health-demo')
    expect(setting('Worker')).toBe(wrangler.name)
    const repository = JSON.parse(text('packages/health-core/package.json')).repository.url
    expect(`git+https://github.com/${String(setting('Git repository'))}.git`).toBe(repository)
    expect(setting('Root directory')).toBe('/')
    expect(setting('Production branch')).toBe('main')
    expect(`${String(setting('Build command'))} && ${String(setting('Deploy command'))}`).toBe(root.scripts['demo:deploy'])
  })

  // Workers Builds takes Node from .node-version or .nvmrc, or a build
  // variable, and says nothing of which wins (developers.cloudflare.com,
  // workers/ci-cd/builds/build-image, read on 2026-10-18); its default is
  // another major. .node-version is the one scripts/workflows.test.mjs
  // holds every workflow to; a second file, or a variable the record does
  // not say is absent, could have the demo built on a Node no gate builds
  // on, and its letter rendered by another zlib.
  test('Cloudflare builds the demo on the Node every gate runs, named by one file and no variable', () => {
    expect(text('.node-version').trim()).not.toBe('')
    expect(existsSync(join(repo, '.nvmrc'))).toBe(false)
    expect(text('.github/REPO-METADATA.md')).toMatch(/^\| Build variables \| none \| Node from `\.node-version`/m)
  })

  // A Wrangler bumped in the script and not in RELEASING.md would have the
  // rightsholder log in with one version and deploy with another.
  test('RELEASING.md names only the Wrangler the deploy runs', () => {
    const named = [...text('RELEASING.md').matchAll(/\bwrangler@[\w.-]+/g)].map((match) => match[0])
    expect(named.length).toBeGreaterThan(0)
    for (const each of named) expect(each).toBe(WRANGLER)
  })
})

/** The keywords a Trusted Types directive takes, which are no source. */
const TRUSTED_TYPES = { 'require-trusted-types-for': "'script'", 'trusted-types': "'none'" }

/**
 * What is wrong with a Content-Security-Policy for the page at `page`, one
 * sentence each: a directive given twice, which a browser reads only the
 * first of; `'none'` beside a source, which a browser ignores; a source but
 * `'none'`, the build's assets directory at `page` and `data:` in img-src
 * alone -- never `'self'`, which admits all of the origin, `/cdn-cgi/`
 * included; each directive that must allow nothing allowing something; and
 * Trusted Types not required, or a policy of them allowed.
 */
function policyProblems(policy, page) {
  const directives = policy.split(';').map((each) => each.trim().split(/\s+/))
  const problems = []
  const seen = new Set()
  for (const [name, ...sources] of directives) {
    if (seen.has(name)) problems.push(`${name} is given twice, and a browser reads the first`)
    seen.add(name)
    if (Object.hasOwn(TRUSTED_TYPES, name)) continue
    if (sources.includes("'none'") && sources.length > 1) problems.push(`${name} holds 'none' beside a source, which a browser then ignores`)
    const allowed = name === 'img-src' ? ["'none'", 'data:'] : ["'none'", `${page}${ASSETS}`]
    for (const source of sources.filter((each) => !allowed.includes(each))) problems.push(`${name} allows ${source}`)
  }
  const sourcesOf = new Map(directives.map(([name, ...sources]) => [name, sources.join(' ')]))
  for (const name of ['default-src', 'connect-src', 'form-action', 'base-uri', 'frame-ancestors', 'object-src']) {
    if (sourcesOf.get(name) !== "'none'") problems.push(`${name} is not 'none'`)
  }
  for (const [name, value] of Object.entries(TRUSTED_TYPES)) if (sourcesOf.get(name) !== value) problems.push(`${name} is not ${value}`)
  return problems
}

describe('the headers every file of the demo is served with (0012)', () => {
  /** A `_headers` file as Cloudflare reads it: each rule's path, and its headers by name. */
  const rules = (file) =>
    file
      .trimEnd()
      .split(/\n(?=\S)/)
      .map((block) => {
        const [path, ...lines] = block.split('\n')
        return { path, headers: Object.fromEntries(lines.map((line) => /^ {2}([^:]+): (.*)$/.exec(line)?.slice(1) ?? ['unreadable', line])) }
      })

  // The policy the browser gate measures is the one the deploy writes only
  // if the file Cloudflare reads says what headersFor says: one rule for
  // every path, every header in it and nothing else. Two rules would be
  // joined into one value nobody wrote.
  test('are written as one rule for every path, holding every header and nothing else', () => {
    expect(rules(headersFile(headersFor(PAGE)))).toEqual([{ path: '/*', headers: { ...headersFor(PAGE) } }])
  })

  // `pnpm demo`, the gate and the deploy serve the page at three addresses,
  // and a policy names the address its files may come from. Written for
  // each, they must differ in that and in nothing else, or the gate would
  // measure a policy formancy.ai is never sent.
  test('are the same at every address the page is served at, but for the address itself', () => {
    const at = (page) => JSON.parse(JSON.stringify(headersFor(page)).replaceAll(page, '<the page>'))
    expect(JSON.stringify(headersFor(PAGE))).toContain(`${PAGE}${ASSETS}`)
    expect(at('http://localhost:4395/')).toEqual(at(PAGE))
    expect(at('http://localhost:4395/health/')).toEqual(at(PAGE))
  })

  // A policy written for an address that is not a directory's would admit
  // files from where the page's relative files do not resolve, or from
  // a query nobody asked for: refused, rather than served.
  test.each(['https://formancy.ai/health', '/health/', 'https://formancy.ai/health/?x=1', 'https://formancy.ai/health/#demo', 'javascript:alert(1)//', 'HTTPS://FORMANCY.AI/health/'])('are refused for %s, which is no directory a page is served from', (page) => {
    expect(() => headersFor(page)).toThrow('the address of the directory its page is served from')
  })

  // A header the file cannot carry would be served otherwise than `vite
  // preview` and the gate serve it, or not at all: refused, naming it.
  test.each([
    ['a name the syntax reads as detaching a header', { '! Content-Security-Policy': 'x' }, 'not letters'],
    ['a value that breaks a line', { 'X-Robots-Tag': 'noindex\n/*\n  X-Other: y' }, 'breaks a line'],
    ['a line past the 2,000 characters Cloudflare reads', { 'Content-Security-Policy': `default-src 'none'; ${'a'.repeat(2000)}` }, 'past the 2000'],
  ])('refuses %s', (_name, headers, says) => {
    expect(() => headersFile(headers)).toThrow(says)
  })

  // What the policy holds is the page's one promise about what a visitor
  // types: it sends it nowhere. `connect-src 'none'` refuses every fetch,
  // XHR, WebSocket and beacon, `form-action 'none'` a form that posts; no
  // inline script or style and no eval; scripts, styles and faces from the
  // build's assets alone, so not a script Cloudflare serves under
  // /cdn-cgi/ of the same origin; no image from a file; and no string a
  // script hands to innerHTML parsed.
  test('hold a policy that allows the page no connection, no form action, nothing inline, nothing but its assets and no markup from a string', () => {
    expect(policyProblems(headersFor(PAGE)['Content-Security-Policy'], PAGE)).toEqual([])
  })

  // The reading itself, watched on what a change to the policy would most
  // likely be: a source admitted to make something work.
  const assets = `${PAGE}${ASSETS}`
  test.each([
    ["'self' in script-src, which admits a script under /cdn-cgi/", "script-src 'self'", "allows 'self'"],
    ["the page's directory, not its assets", `script-src ${PAGE}`, `allows ${PAGE}`],
    ["an image from the page's own origin", "img-src 'self' data:", "img-src allows 'self'"],
    ["'unsafe-inline' in style-src", `style-src ${assets} 'unsafe-inline'`, "allows 'unsafe-inline'"],
    ["'unsafe-eval' in script-src", `script-src ${assets} 'unsafe-eval'`, "allows 'unsafe-eval'"],
    ['another origin', `font-src ${assets} https://fonts.gstatic.com`, 'allows https://fonts.gstatic.com'],
    ['data: anywhere but img-src', `font-src ${assets} data:`, 'allows data:'],
    ['a connection to the page itself', "connect-src 'self'", "connect-src is not 'none'"],
    ['a directive given twice', "connect-src 'none'; connect-src *", 'given twice'],
    ["'none' beside a source", `connect-src 'none' ${assets}`, 'beside a source'],
    ['Trusted Types not required', 'require-trusted-types-for', "require-trusted-types-for is not 'script'"],
    ['a Trusted Types policy allowed', 'trusted-types default', "trusted-types is not 'none'"],
  ])('refuses %s', (_name, change, says) => {
    const name = change.split(' ')[0]
    const policy = headersFor(PAGE)
      ['Content-Security-Policy'].split('; ')
      .filter((each) => !each.startsWith(`${name} `))
      .concat(change === name ? [] : change)
      .join('; ')
    expect(policyProblems(policy, PAGE).join('\n')).toContain(says)
  })

  // Cloudflare rewrites a response it may transform: Rocket Loader, email
  // obfuscation and its analytics beacon each add a script. The policy
  // refuses each, and the gate watches it refuse one injected; `no-transform`
  // asks Cloudflare not to add them at all, and what the address serves is
  // checked by hand (RELEASING.md).
  test('ask Cloudflare to transform nothing, and every search engine to index nothing', () => {
    expect(headersFor(PAGE)['Cache-Control'].split(/,\s*/)).toContain('no-transform')
    expect(headersFor(PAGE)['X-Robots-Tag']).toBe('noindex')
  })

  // `pnpm demo` serves the build under the headers the deploy writes, for
  // the address `vite preview` serves it at, from the same function; a
  // copy in the config would drift from the one the deploy writes, and a
  // port of its own in it would admit the build's files from an address
  // nothing serves.
  test('are the ones `vite preview` serves the demo with, for its own address', () => {
    expect(config).toContain("import { headersFor } from '../../scripts/demo-headers.mjs'")
    expect(config).toContain(`headers: headersFor('http://localhost:${String(port('preview'))}/')`)
  })

  // Vite's default base is /, so a build that asks for /assets/… passes at
  // the root of `vite preview` and is a blank page under /health/, where
  // formancy.ai's own site answers /assets/; served under the demo's path,
  // with the headers the deploy writes, for the gate's address, every check
  // of the gate is a check of the demo as formancy.ai serves it
  // (formancy.ai-report 0018).
  test('are the ones the browser gate serves the built demo with, under the path the demo is served at', () => {
    const gate = text('apps/demo/scripts/browser-test.mjs')
    expect(gate).toMatch(/import \{[^}]*\bdemoBase\b[^}]*\breadDemoConfig\b[^}]*\} from '\.\.\/\.\.\/\.\.\/scripts\/demo\.mjs'/)
    expect(gate).toContain("import { headersFor } from '../../../scripts/demo-headers.mjs'")
    expect(gate).toContain('const base = demoBase(readDemoConfig())')
    expect(gate).toContain('const headers = headersFor(url)')
    expect(gate).toContain('server = await preview({ root: app, base, preview: { headers }')
    expect(demoBase(wrangler)).toBe('/health/')
  })
})

describe('what the deploy stages (0012)', () => {
  const made = []
  afterAll(() => {
    for (const directory of made) rmSync(directory, { recursive: true, force: true })
  })

  /** A directory holding `files`, each path with its text. */
  function tree(files) {
    const directory = mkdtempSync(join(tmpdir(), 'formancy-health-demo-'))
    made.push(directory)
    for (const [path, content] of Object.entries(files)) {
      mkdirSync(dirname(join(directory, path)), { recursive: true })
      writeFileSync(join(directory, path), content)
    }
    return directory
  }

  /** Every file under `directory`, as a path from it with forward slashes. */
  const listed = (directory) =>
    readdirSync(directory, { recursive: true, withFileTypes: true })
      .filter((entry) => entry.isFile())
      .map((entry) => relative(directory, join(entry.parentPath, entry.name)).replaceAll('\\', '/'))
      .sort()

  const built = (extra = {}) => tree({ 'index.html': '<script type="module" src="./assets/index-a.js"></script>', 'assets/index-a.js': '', ...extra })

  // Static assets are found by the request's whole path: a build staged at
  // the directory's root would answer /index.html, which no route sends
  // the Worker, and every path under /health/ with a 404. `_headers` is
  // read at the root of the directory and nowhere else; under the path it
  // would be a file served to anyone and the page would go out under no
  // policy.
  test('puts the build under the demo\'s path and the headers at the root of the directory Wrangler uploads', () => {
    const into = tree({})
    stageDemo(built(), into, PAGE)
    expect(listed(into)).toEqual(['_headers', 'health/assets/index-a.js', 'health/index.html'])
    expect(readFileSync(join(into, '_headers'), 'utf8')).toBe(headersFile(headersFor(PAGE)))
  })

  // Under the demo's path, a page that asks for /assets/index-a.js is
  // answered by formancy.ai's own site, and loads without its script.
  // Refused before anything is staged, naming the page and the path.
  test('refuses a page that asks for a file by an absolute path, naming it, and stages nothing', () => {
    const into = tree({})
    expect(() => stageDemo(built({ 'index.html': '<script type="module" src="/assets/index-a.js"></script>' }), into, PAGE)).toThrow(/index\.html asks for a file by an absolute path: src="\/assets\/index-a\.js"/)
    expect(listed(into)).toEqual([])
  })

  // A `_headers` in the app's public directory would be copied under the
  // path, served as a file and read as nothing; a second place deciding the
  // headers, beside the constant, whose rules never apply.
  test.each(['_headers', 'nested/_redirects'])('refuses a build that holds a file Cloudflare reads as rules, %s, and stages nothing', (file) => {
    const into = tree({})
    expect(() => stageDemo(built({ [file]: '/*\n  X-Robots-Tag: all\n' }), into, PAGE)).toThrow(`${file} is a file Cloudflare reads as rules`)
    expect(listed(into)).toEqual([])
  })

  // The deploy stages the demo's build from where the app's build writes
  // it, known by a file it always writes: a stale directory staged instead
  // would serve what no build of this commit made.
  test("stages the demo's build, where the app's build writes it", () => {
    expect(BUILD).toEqual({ app: 'apps/demo', writes: 'index.html' })
    expect(JSON.parse(text(`${BUILD.app}/package.json`)).scripts.build).toBe('vite build')
  })

  // The stage and Wrangler's state are written into the checkout. A deploy
  // stopped before it removed them, its files not ignored, leaves a
  // checkout the next deploy refuses as changed, and files a commit could
  // take in.
  test("leaves nothing git would see: the stage and Wrangler's state are ignored", () => {
    const paths = ['apps/demo/.cloudflare/_headers', 'apps/demo/.cloudflare/health/index.html', '.wrangler/tmp/x', 'apps/demo/.wrangler/tmp/x']
    const ignored = spawnSync('git', ['check-ignore', '--no-index', ...paths], { cwd: repo, encoding: 'utf8' })
    expect(ignored.stdout.trim().split('\n').sort()).toEqual([...paths].sort())
  })
})
