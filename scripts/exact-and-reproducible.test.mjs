import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'
import { describe, expect, test } from 'vitest'

/**
 * No published package's source turns a value into a JavaScript number, or
 * reads a clock or a random source (0004).
 *
 * The first is CLAUDE.md's exactness rule: a decimal or a large integer
 * travels as its text and is never converted through `Number`, because a
 * double keeps neither 0.10's trailing zero nor 2^53 + 1. The second is what
 * makes the same input give the same bytes, and what keeps identity the
 * host's: an id, a fullUrl or a timestamp made here from the clock or a
 * random source would differ on every run, and come from nobody.
 *
 * Read from each package's syntax tree, as TypeScript parses it, so a
 * comment or a string that names one of these is not a use of it, and a
 * unary plus is told from an addition exactly. Forbidden:
 *
 * - `Number` as a value -- a call, `new Number`, `Number.call`,
 *   `globalThis.Number`, an alias -- though not its statics that read no
 *   text, such as `Number.isSafeInteger`; `parseFloat` and `parseInt` in any
 *   spelling, `Number.parseFloat` too; `JSON.parse`, which reads every number
 *   in its text into a double; the global `isNaN` and `isFinite`, which
 *   convert their argument first; and a unary plus.
 * - `Date`, `performance` and `crypto` in any use, `Math.random` and
 *   `Temporal.Now`.
 *
 * What it cannot see: a conversion spelled as arithmetic or a comparison
 * (`text * 1`, `text | 0`, `Math.round(text)`, `'10' > 9`), and one reached
 * by a computed name or a destructuring (`JSON['parse']`,
 * `const { random } = Math`). Each of those that loses a digit
 * fails health-core's `exactness.test.ts`, whose every value is one a double
 * cannot hold; one that loses nothing is review's.
 *
 * Which packages: every one whose manifest is not private, read from
 * `packages/`, as the install gate finds them. Which files: their `src/`,
 * tests excluded, since a test may build a Date to show it refused.
 */
const repo = join(dirname(fileURLToPath(import.meta.url)), '..')

/** Every publishable package's directory, from its manifest. */
function publishable() {
  const root = join(repo, 'packages')
  return readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .flatMap((entry) => {
      let manifest
      try {
        manifest = JSON.parse(readFileSync(join(root, entry.name, 'package.json'), 'utf8'))
      } catch {
        return []
      }
      return manifest.private === true ? [] : [join(root, entry.name)]
    })
}

const TEST = /\.test\.ts$|\.d\.ts$/

/** A package's TypeScript sources, tests and declarations excluded, as repository paths. */
function sourcesOf(directory) {
  const found = []
  const walk = (at) => {
    for (const entry of readdirSync(at, { withFileTypes: true })) {
      const full = join(at, entry.name)
      if (entry.isDirectory()) walk(full)
      else if (entry.isFile() && entry.name.endsWith('.ts') && !TEST.test(entry.name)) found.push(relative(repo, full).replaceAll('\\', '/'))
    }
  }
  walk(join(directory, 'src'))
  return found
}

/** Names forbidden in any use, and why. */
const NAMES = new Map([
  ['parseFloat', 'parseFloat, which reads text into a double'],
  ['parseInt', 'parseInt, which reads text into a double'],
  ['Date', 'Date, which reads the clock or stands for an instant in the host\'s zone'],
  ['performance', 'performance, whose now() is a clock'],
  ['crypto', 'crypto, whose randomUUID() and getRandomValues() are random sources'],
])

/**
 * Number's own statics that read no text. Everything else reached through
 * Number is the conversion: `Number.call` and `Number.apply` call it, and
 * `Number.parseFloat` and `Number.parseInt` are refused by NAMES besides.
 */
const NUMBER_STATICS = new Set([
  'EPSILON',
  'MAX_SAFE_INTEGER',
  'MAX_VALUE',
  'MIN_SAFE_INTEGER',
  'MIN_VALUE',
  'NaN',
  'NEGATIVE_INFINITY',
  'POSITIVE_INFINITY',
  'isFinite',
  'isInteger',
  'isNaN',
  'isSafeInteger',
])

/** Each forbidden use in `code`, as "line: what". */
function findings(code, name = 'source.ts') {
  const file = ts.createSourceFile(name, code, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS)
  const found = []
  const report = (node, what) => found.push(`${String(file.getLineAndCharacterOfPosition(node.getStart(file)).line + 1)}: ${what}`)
  const visit = (node) => {
    if (ts.isIdentifier(node)) {
      const parent = node.parent
      const access = parent !== undefined && ts.isPropertyAccessExpression(parent)
      const isObject = access && parent.expression === node
      if (node.text === 'Number' && !(isObject && NUMBER_STATICS.has(parent.name.text))) report(node, 'Number, which turns a value into a double')
      if (NAMES.has(node.text)) report(node, NAMES.get(node.text))
      const isGlobal = !(access && parent.name === node)
      if (isGlobal && (node.text === 'isNaN' || node.text === 'isFinite')) report(node, `the global ${node.text}, which turns its argument into a double`)
    }
    if (ts.isPropertyAccessExpression(node) && ts.isIdentifier(node.expression)) {
      const pair = `${node.expression.text}.${node.name.text}`
      if (pair === 'JSON.parse') report(node, 'JSON.parse, which reads every number in its text into a double')
      if (pair === 'Math.random') report(node, 'Math.random, a random source')
      if (pair === 'Temporal.Now') report(node, 'Temporal.Now, a clock')
    }
    if (ts.isPrefixUnaryExpression(node) && node.operator === ts.SyntaxKind.PlusToken) report(node, 'a unary plus, which turns its operand into a double')
    ts.forEachChild(node, visit)
  }
  visit(file)
  return found
}

describe('the exactness and reproducibility guard', () => {
  // A guard on the guard: the assertion that matters is about absence, so
  // a walk that found nothing would pass it forever.
  test('reads every publishable package\'s source', () => {
    const paths = publishable().flatMap(sourcesOf)
    expect(paths).toContain('packages/health-core/src/numbers.ts')
    expect(paths).toContain('packages/health-core/src/json-read.ts')
    expect(paths).toContain('packages/health-questionnaire/src/values.ts')
    expect(paths).toContain('packages/health-questionnaire/src/conditions.ts')
    // The answers' export reads a person's numbers and writes them (0007).
    expect(paths).toContain('packages/health-questionnaire/src/answers.ts')
    expect(paths).toContain('packages/health-questionnaire/src/enablement.ts')
    // The documents' bytes, their size and their hash, and the Bundle's
    // identity, which are the host's and never a clock's (0008).
    expect(paths).toContain('packages/health-document/src/sha1.ts')
    expect(paths).toContain('packages/health-document/src/document-reference.ts')
    expect(paths).toContain('packages/health-document/src/bundle.ts')
    expect(paths).toContain('packages/health-document/src/attachments.ts')
    expect(paths).toContain('packages/health-core/src/base64.ts')
    // The Swiss identifiers' check digits, read from their characters'
    // codes and never by converting the identifier to a number, and the
    // CH ORF document's identity, the host's (0009).
    expect(paths).toContain('packages/health-ch/src/identifiers.ts')
    expect(paths).toContain('packages/health-ch/src/document.ts')
    expect(paths).toContain('packages/health-ch/src/people.ts')
    expect(paths).toContain('packages/health-core/src/xhtml.ts')
    // Which characters a text may hold, read by code point, and the
    // readers of a host's context, which every package reads one with.
    expect(paths).toContain('packages/health-core/src/characters.ts')
    expect(paths).toContain('packages/health-core/src/host.ts')
    // health-corpus is private, never published: it renders with Report
    // and reads Node's Buffer and crypto, and nobody installs it.
    expect(paths.filter((path) => path.startsWith('packages/health-corpus/'))).toEqual([])
    expect(paths.filter((path) => TEST.test(path))).toEqual([])
  })

  // Each spelling it promises to see, seen: a detector that missed one
  // would let it in while this file says otherwise.
  test.each([
    ['Number(text)', 'a call'],
    ['new Number(text)', 'a construction'],
    ['const toDouble = Number', 'an alias'],
    ['globalThis.Number(text)', 'a property of the global object'],
    ['Number.call(undefined, text)', 'a call through Function.prototype'],
    ['Number.apply(undefined, [text])', 'a call through Function.prototype'],
    ['Number.parseFloat(text)', 'a static that reads text'],
    ['parseFloat(text)', 'the global parseFloat'],
    ['parseInt(text, 10)', 'the global parseInt'],
    ['JSON.parse(text)', 'JSON.parse'],
    ['isNaN(text)', 'the global isNaN'],
    ['isFinite(text)', 'the global isFinite'],
    ['const n = +text', 'a unary plus'],
    ['f(+text)', 'a unary plus as an argument'],
    ['Date.now()', 'the clock'],
    ['new Date()', 'the clock, as a Date'],
    ['Date()', 'the clock, as a string'],
    ['performance.now()', 'a monotonic clock'],
    ['Temporal.Now.instant()', 'the clock, as a Temporal instant'],
    ['Math.random()', 'a random source'],
    ['crypto.randomUUID()', 'a random identifier'],
  ])('finds %s, %s', (code) => {
    expect(findings(code)).not.toEqual([])
  })

  // And it does not mistake what only looks like one: a static that reads
  // no text, an addition, a regex's '+', or a name inside a comment or a
  // string, which a check on the text would.
  test.each([
    'Number.isSafeInteger(length)',
    'const sum = a + b; index += 1',
    'const sign = /[+-]/',
    '// Number(text), parseFloat, JSON.parse, Date.now()',
    "const message = 'not through Number() or JSON.parse'",
    'const n = BigInt(text)',
    'value.isNaN',
  ])('finds nothing in %s', (code) => {
    expect(findings(code)).toEqual([])
  })

  // The rule itself: in no publishable package's source, said as each file
  // and line, so a failure names where to look.
  test('finds no conversion, clock or random source in a publishable package', () => {
    const found = publishable()
      .flatMap(sourcesOf)
      .flatMap((path) => findings(readFileSync(join(repo, path), 'utf8'), path).map((finding) => `${path}:${finding}`))
    expect(found).toEqual([])
  })
})
