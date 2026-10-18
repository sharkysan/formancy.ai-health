import { execFileSync } from 'node:child_process'
import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, test } from 'vitest'
import YAML from 'yaml'
// HL7's notice, as its licence page gives it, and its marks in a name:
// scripts/notices.mjs, which the demo's page renders and its browser gate reads.
import { HL7_NOTICE, MARK } from './notices.mjs'

/**
 * Nothing names the product with HL7's marks, nothing claims HL7's
 * permission, and NOTICE and the README carry the notice HL7 asks of a use
 * without it (0003).
 *
 * HL7 lets anybody name the FHIR standard, and lets nobody put FHIR in a
 * product's name without a Product License, which this product has not
 * applied for. So it is Formancy Health, FHIR is named only as the standard,
 * and three things would undo that without a reviewer noticing:
 *
 * - NOTICE, README.md or a published package's README losing HL7's notice
 *   for use without permission, or a word of it, as HL7's licence page
 *   gives it;
 * - a file claiming HL7's permission, as a notice for a use HL7 has licensed
 *   does ("used with the permission of HL7", and the like), which would be a
 *   false statement about this product;
 * - an HL7 mark, `fhir` or `hl7` in any case, in a package's name, in the
 *   licence's title, in the README's first heading, or in the demo's
 *   Worker, its routes or its page's title (0012).
 *
 * Each is read from the files: every workspace manifest pnpm-workspace.yaml
 * names, the headings as written, the demo's Worker config and page, and
 * every file git would commit -- tracked, or new and not ignored, so a file
 * is held before its first commit. The checks hold no list of the names
 * they expect; only each guard on a guard names what is there today, to
 * show the walk read it. What none of it can see is review's: the names
 * GitHub and Cloudflare keep outside the tree, which
 * .github/REPO-METADATA.md records, and prose that uses FHIR as a brand
 * without holding any of these words.
 */
const repo = join(dirname(fileURLToPath(import.meta.url)), '..')

/**
 * Where the notice must stand: NOTICE, which every tarball carries, the
 * README, and the README of every package npm publishes, which is the page
 * npm shows of it.
 */
function carrying() {
  const packages = readdirSync(join(repo, 'packages'), { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .flatMap((entry) => {
      const manifest = textOf(`packages/${entry.name}/package.json`)
      return manifest === undefined || JSON.parse(manifest).private === true ? [] : [`packages/${entry.name}/README.md`]
    })
  return ['NOTICE', 'README.md', ...packages.sort()]
}

const HL7 = String.raw`(?:HL7|Health\s+Level\s+Seven)`

/**
 * What a claim of HL7's permission says: the words a notice for a licensed
 * use is made of, and the other ways English says the same. HL7's own
 * wording of those notices is deliberately quoted nowhere here (0003), so
 * these are the shapes of the sentence, not a copy of one. Read with every
 * run of whitespace as one space, so a line break hides none of them.
 */
const CLAIMS = [
  new RegExp(String.raw`\bwith\s+(?:the\s+)?(?:express\s+)?(?:written\s+)?permission\s+(?:of|from)\s+${HL7}`, 'i'),
  new RegExp(String.raw`\bwith\s+${HL7}['’]s\s+(?:express\s+)?(?:written\s+)?permission\b`, 'i'),
  /\bused\s+with\s+(?:the\s+)?permission\b/i,
  new RegExp(String.raw`\bunder\s+(?:a\s+)?licen[cs]e\s+from\s+${HL7}`, 'i'),
]

/**
 * Files that state a claim in order to refuse it, by exact path, each with
 * its reason. An entry for a file git would not commit, or for one that holds
 * no claim, fails too, so an entry never outlives its reason.
 */
const STATES_THE_RULE = new Map([['scripts/trademark.test.mjs', 'its cases are the claims it must find']])

/** Every run of whitespace as one space: a sentence a line break splits is still the sentence. */
const flat = (text) => text.replace(/\s+/g, ' ')

/** Whether `text` holds HL7's notice word for word, wherever its lines break. */
const carriesNotice = (text) => flat(text).includes(HL7_NOTICE)

/** The claims of HL7's permission in `text`, as written there, whitespace flattened. */
const claimsIn = (text) => {
  const source = flat(text)
  return CLAIMS.flatMap((pattern) => {
    const found = pattern.exec(source)
    return found === null ? [] : [found[0]]
  })
}

/** Every file git would commit: tracked, and new but not ignored. */
function committable() {
  return execFileSync('git', ['ls-files', '-z', '--cached', '--others', '--exclude-standard'], { cwd: repo, encoding: 'utf8' })
    .split('\0')
    .filter((file) => file !== '')
}

/** A file's text, or undefined for one deleted from the working tree but not yet from the index. */
function textOf(file) {
  try {
    return readFileSync(join(repo, file), 'utf8')
  } catch (error) {
    if (error.code === 'ENOENT') return undefined
    throw error
  }
}

/**
 * Every workspace manifest, the root's first, as `{ file, name }`: the
 * directories pnpm-workspace.yaml names, each `<directory>/*` or a
 * directory. Another pattern throws rather than being read as matching
 * nothing.
 */
function workspaceNames() {
  const workspace = YAML.parse(readFileSync(join(repo, 'pnpm-workspace.yaml'), 'utf8')) ?? {}
  const directories = ['.']
  for (const pattern of workspace.packages ?? []) {
    const each = /^([\w.-]+(?:\/[\w.-]+)*)\/\*$/.exec(pattern)
    if (each === null && !/^[\w.-]+(?:\/[\w.-]+)*$/.test(pattern)) {
      throw new Error(`pnpm-workspace.yaml: ${pattern} is not <directory>/* or a directory, which is all this guard reads; teach it`)
    }
    if (each === null) {
      directories.push(pattern)
      continue
    }
    let entries = []
    try {
      entries = readdirSync(join(repo, each[1]), { withFileTypes: true })
    } catch (error) {
      if (error.code !== 'ENOENT') throw error
    }
    for (const entry of entries) if (entry.isDirectory()) directories.push(`${each[1]}/${entry.name}`)
  }
  return directories.flatMap((directory) => {
    const file = directory === '.' ? 'package.json' : `${directory}/package.json`
    const text = textOf(file)
    return text === undefined ? [] : [{ file, name: String(JSON.parse(text).name ?? '') }]
  })
}

/** The demo's Worker config and its page (0012). */
const WORKER = 'apps/demo/wrangler.json'
const PAGE = 'apps/demo/index.html'

/**
 * The demo's names, as `{ where, name }`: the Worker's name and every
 * route's pattern from its config, and the `<title>` its page is served
 * with. Throws when the page has no title or more than one: a title
 * nobody wrote is not one without a mark, and of two, either could be the
 * one a tab shows.
 */
function demoNames() {
  const worker = JSON.parse(readFileSync(join(repo, WORKER), 'utf8'))
  const titles = [...readFileSync(join(repo, PAGE), 'utf8').matchAll(/<title>([^<]*)<\/title>/g)].map((found) => found[1])
  if (titles.length !== 1) throw new Error(`${PAGE} has ${String(titles.length)} <title> elements, and this guard reads exactly one`)
  return [
    { where: `${WORKER}, its name`, name: String(worker.name ?? '') },
    ...(worker.routes ?? []).map((route) => ({ where: `${WORKER}, a route`, name: String(typeof route === 'string' ? route : route.pattern) })),
    { where: `${PAGE}, its title`, name: titles[0] },
  ]
}

/** The text of a Markdown file's first heading. Throws when it has none: a title nobody wrote is not one without a mark. */
function firstHeading(file) {
  const heading = readFileSync(join(repo, file), 'utf8')
    .split(/\r?\n/)
    .find((line) => /^#{1,6}\s/.test(line))
  if (heading === undefined) throw new Error(`${file} has no heading`)
  return heading.replace(/^#{1,6}\s+/, '').trim()
}

describe("HL7's notice", () => {
  // The notice is HL7's condition for naming its marks without its
  // permission. NOTICE travels in every tarball and the README is the first
  // page a reader sees; either losing it, or a word of it, names the
  // standard on terms HL7 does not offer.
  test("stands word for word in NOTICE, README.md and every published package's README", () => {
    const missing = carrying().filter((file) => !carriesNotice(textOf(file) ?? ''))
    expect(missing, `each must hold, word for word: ${HL7_NOTICE}`).toEqual([])
  })

  // A guard on the guard: a walk that found no published package would
  // hold two files and pass. The four packages published today, each by
  // name -- a walk that missed one would hold three and pass -- and not
  // the private corpus.
  test("is looked for in every published package's README", () => {
    expect(carrying()).toEqual(expect.arrayContaining(['packages/health-core/README.md', 'packages/health-questionnaire/README.md', 'packages/health-document/README.md', 'packages/health-ch/README.md']))
    expect(carrying()).not.toContain('packages/health-corpus/README.md')
  })

  // Word for word is the requirement, and wrapped prose is how both files
  // hold it. A check that compared lines would fail every wrapped copy; one
  // that forgave a word would pass a notice HL7 never wrote -- a singular
  // "trademark", the endorsement clause left off, an ® HL7's text has not.
  test('is found however its lines break, and not when a word of it differs', () => {
    expect(carriesNotice(`Intro.\n\nHL7, FHIR and the FHIR\n[FLAME DESIGN] are the registered trademarks of Health Level Seven\nInternational and their use does not constitute endorsement by HL7. More.`)).toBe(true)
    expect(carriesNotice(HL7_NOTICE.replace('trademarks', 'trademark'))).toBe(false)
    expect(carriesNotice(HL7_NOTICE.replace(' and their use does not constitute endorsement by HL7.', '.'))).toBe(false)
    expect(carriesNotice(HL7_NOTICE.replace('HL7, FHIR', 'HL7®, FHIR®'))).toBe(false)
  })
})

describe("a claim of HL7's permission", () => {
  // This product holds no licence from HL7. A licensee's notice says the
  // mark is used with HL7's permission; copied here from another product's
  // page, wrapped across lines or in capitals, it is a false statement about
  // this one, and must be found however it is written.
  test('is found however it is worded, cased or wrapped', () => {
    const claims = [
      'This export names FHIR®, which it uses with the permission of HL7.',
      'The marks shown on this page are used with permission.',
      'The FHIR mark is used\nwith the express written permission of\nHealth Level Seven International.',
      'FHIR is used here with HL7’s permission.',
      'FHIR® is used under licence from HL7.',
      'FHIR IS USED UNDER A LICENSE FROM HL7.',
    ]
    for (const claim of claims) expect(claimsIn(claim), claim).not.toEqual([])
  })

  // The notice for use without permission, and the sentences that explain
  // the rule, say the opposite of a claim. Read as one, they would make the
  // guard fail on NOTICE itself, and send somebody to allow-list the file
  // that most needs reading.
  test('is not the notice for use without permission, nor a sentence saying there is none', () => {
    const notClaims = [
      HL7_NOTICE,
      "HL7's notice for use without permission is the only one it carries.",
      'This product holds no licence from HL7, and applied for none.',
      'Use of the marks without the express written consent of Health Level Seven International is prohibited.',
      'The specification is licensed by HL7 under CC0.',
    ]
    for (const sentence of notClaims) expect(claimsIn(sentence), sentence).toEqual([])
  })

  // The real tree: every file git would commit, the ones a pull request
  // adds among them, so a claim is refused before its first commit and not
  // after.
  test('appears in no file git would commit, outside the files that state the rule', () => {
    const found = committable()
      .filter((file) => !STATES_THE_RULE.has(file))
      .flatMap((file) => claimsIn(textOf(file) ?? '').map((claim) => `${file}: "${claim}"`))
    expect(found, 'this product holds no licence from HL7; say what it does instead').toEqual([])
  })

  // A guard on the guard: the assertion above is about absence, so a walk
  // that read nothing -- git not found, a filter that dropped every file,
  // untracked files left out -- would pass it forever. It reads the files
  // the notice and the licence live in, and this one, which is new until
  // its first commit.
  test('is looked for in the files that matter, this one among them', () => {
    expect(committable()).toEqual(expect.arrayContaining(['NOTICE', 'README.md', 'LICENSE.md', 'package.json', 'scripts/trademark.test.mjs']))
  })

  // An exemption is a file that has to quote a claim to refuse it. One for a
  // file that is gone, or that no longer quotes one, would wave through
  // whatever is written there next.
  test('is exempt only where a file states one to refuse it', () => {
    const files = new Set(committable())
    const stale = [...STATES_THE_RULE].filter(([file]) => !files.has(file) || claimsIn(textOf(file) ?? '').length === 0).map(([file, reason]) => `${file} (${reason})`)
    expect(stale, 'remove these from STATES_THE_RULE').toEqual([])
  })
})

describe('the names', () => {
  // HL7 does not license its marks inside another name, and this product
  // applied for no licence at all. Spelled as the old working name, as a
  // coined compound or in another case, a mark is still a mark.
  test('are refused with an HL7 mark in them, in any case and inside a word', () => {
    for (const name of ['@formancy/fhir-core', 'Formancy FHIR', 'FormancyFhir', 'formancy-hl7', '@formancy/health-Hl7v2', 'Formancy FHIR Source-Available Licence']) {
      expect(MARK.test(name), name).toBe(true)
    }
    for (const name of ['formancy-health', '@formancy/health-core', 'Formancy Health', 'Formancy Health Source-Available Licence']) {
      expect(MARK.test(name), name).toBe(false)
    }
  })

  // The real names: every workspace package's, which npm publishes; the
  // licence's title, which a customer signs; the README's first heading,
  // which GitHub shows first. Any holding a mark brands the product with it.
  test("of every package, of the licence and of the README's heading hold no HL7 mark", () => {
    const names = [
      ...workspaceNames().map(({ file, name }) => ({ where: `${file}, its name`, name })),
      { where: 'LICENSE.md, its title', name: firstHeading('LICENSE.md') },
      { where: 'README.md, its first heading', name: firstHeading('README.md') },
    ]
    const marked = names.filter(({ name }) => MARK.test(name)).map(({ where, name }) => `${where}: ${name}`)
    expect(marked, 'the product is Formancy Health; FHIR names the standard and nothing else (0003)').toEqual([])
  })

  // The demo's names (0012): the Worker's, which Cloudflare's dashboard and
  // every deployment show; each route, which is an address of formancy.ai;
  // and the page's title as index.html sends it, which a tab, a bookmark
  // and a link's preview show before any script has run. Any of them
  // holding a mark would name a page of this product with it, which 0003
  // refuses for a page as for a package. The title each language sets once
  // the page runs, and its heading, the browser gate reads.
  test("of the demo's Worker, its routes and its page's title hold no HL7 mark", () => {
    const marked = demoNames()
      .filter(({ name }) => MARK.test(name))
      .map(({ where, name }) => `${where}: ${name}`)
    expect(marked, 'the demo is a page of Formancy Health; FHIR names the standard and nothing else (0003)').toEqual([])
  })

  // A guard on the guard: a walk that found no manifest, or a heading read
  // from the wrong line, would pass the check above by holding nothing to
  // check. The root, the first package, the demo, and the two headings, as
  // the files hold them today; and the demo's Worker, both its routes and
  // its title read, whatever they are named.
  test('are read from the manifests, the headings and the demo themselves', () => {
    const names = workspaceNames().map(({ name }) => name)
    expect(names[0]).toBe('formancy-health')
    expect(names).toContain('@formancy/health-core')
    expect(names).toContain('@formancy/health-questionnaire')
    expect(names).toContain('@formancy/health-document')
    expect(names).toContain('@formancy/health-ch')
    expect(names).toContain('@formancy/health-corpus')
    expect(names).toContain('@formancy/health-demo')
    expect(firstHeading('LICENSE.md')).toBe('Formancy Health Source-Available Licence')
    expect(firstHeading('README.md')).toBe('Formancy Health')
    const demo = demoNames()
    expect(demo.map(({ where }) => where)).toEqual([`${WORKER}, its name`, `${WORKER}, a route`, `${WORKER}, a route`, `${PAGE}, its title`])
    expect(demo.every(({ name }) => name.trim() !== '')).toBe(true)
  })
})
