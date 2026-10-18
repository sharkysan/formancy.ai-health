import { readdirSync, readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'
import { describe, expect, test } from 'vitest'

/**
 * The demo's stylesheets, held to what 0002 and 0012 decide: nothing of
 * formancy's is copied, so the page states no colour of its own and
 * declares no variable; every colour is one @formancy/themes declares, as
 * the release the manifest pins ships it, imported and never copied, in
 * the order its README gives.
 *
 * It reads the stylesheets and main.tsx's imports, which is what it is
 * about. A colour is found as the browser would take it: each word of a
 * declaration's value set as a colour on a jsdom style, and kept when the
 * style accepts it, so a named colour no list here holds is caught as
 * surely as a hex. What jsdom cannot do -- lay out, compute a colour, a
 * contrast -- is the browser gate's.
 */
const src = dirname(fileURLToPath(import.meta.url))
const themes = (file: string): string => readFileSync(createRequire(import.meta.url).resolve(`@formancy/themes/${file}`), 'utf8')

/** Every file under `directory` whose name `pattern` matches, from src/. */
function filesIn(directory: string, pattern: RegExp): string[] {
  return readdirSync(directory, { withFileTypes: true, recursive: true })
    .filter((entry) => entry.isFile() && pattern.test(entry.name))
    .map((entry) => relative(src, join(entry.parentPath, entry.name)).replaceAll('\\', '/'))
    .sort()
}

const withoutComments = (css: string): string => css.replace(/\/\*[\s\S]*?\*\//g, '')
const stylesheets = filesIn(src, /\.css$/).map((file) => ({ file, css: withoutComments(readFileSync(join(src, file), 'utf8')) }))

/** CSS's own keywords, which a colour property takes and which are no colour. */
const WIDE = new Set(['inherit', 'initial', 'unset', 'revert', 'revert-layer'])

/** Whether the browser would take `word` as a colour: a hex, a colour function, or a colour keyword. */
function isColour(word: string): boolean {
  if (WIDE.has(word.toLowerCase())) return false
  const style = document.createElement('i').style
  style.color = word
  return style.color !== ''
}

/**
 * The words and functions of `value` a colour could be: each hex, each
 * function by its name and arguments, each identifier. A `var()` is a
 * theme's variable and no colour of the page's, which the style would take
 * as one; its fallback, where it has one, is the page's own and is read.
 */
const wordsOf = (value: string): string[] => value.replace(/var\(\s*--[\w-]+\s*,?/g, '(').match(/#[\da-f]+|[a-z-]+\([^()]*\)|[a-z][a-z-]*/gi) ?? []

/**
 * A colour function, by its name, wherever it stands in a value: one that
 * wraps a theme's variable -- `rgb(from var(--wb-signal) r g b / 0.4)`,
 * `color-mix(in oklab, var(--wb-signal) 40%, …)` -- holds no literal the
 * style above would take, and is a colour of the page's all the same,
 * made from one of formancy's.
 */
const COLOUR_FUNCTION = /\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color|color-mix|light-dark|contrast-color|device-cmyk)\(/gi

/** `var(--name)`, every name a stylesheet reads. */
const read = (css: string): string[] => [...css.matchAll(/var\(\s*(--[\w-]+)/g)].map((match) => match[1] ?? '')

/** Every custom property a stylesheet declares. */
const declared = (css: string): string[] => [...css.matchAll(/(?:^|[{;\s])(--[\w-]+)\s*:/g)].map((match) => match[1] ?? '')

describe("the demo's stylesheets", () => {
  // A guard on the guard: a walk that found no stylesheet would hold
  // nothing to every rule below.
  test('are read, the layout and the faces', () => {
    expect(stylesheets.map(({ file }) => file)).toEqual(['styles/demo.css', 'styles/fonts.css'])
  })

  // A colour written here is a palette of the page's own, which drifts
  // from formancy's the day a release moves it, and which 0002 forbids.
  test('state no colour of their own', () => {
    const colours = stylesheets.flatMap(({ file, css }) =>
      [...css.matchAll(/([\w-]+)\s*:\s*([^;{}]+)/g)].flatMap(([, property = '', value = '']) =>
        property.startsWith('--') ? [] : [...wordsOf(value).filter(isColour), ...(value.match(COLOUR_FUNCTION) ?? [])].map((word) => `${file}: ${property}: ${word}`),
      ),
    )
    expect(colours).toEqual([])
  })

  // The reading itself, on what each way of writing a colour would leave:
  // a literal the style takes, and a colour made from a theme's variable,
  // which it does not.
  test.each([
    ['a hex', 'color: #1a2b3c', true],
    ['a named colour', 'border-color: rebeccapurple', true],
    ['a relative colour from a theme variable', 'color: rgb(from var(--wb-signal) r g b / 0.4)', true],
    ['a mix of two theme variables', 'background: color-mix(in oklab, var(--wb-signal) 40%, var(--wb-ok))', true],
    ['light-dark of two theme variables', 'color: light-dark(var(--wb-ink), var(--wb-paper))', true],
    ['a theme variable as it is', 'color: var(--wb-signal)', false],
    ['a keyword', 'color: inherit', false],
  ])('find %s as a colour of the page, or not: %s', (_name, declaration, found) => {
    const [property = '', value = ''] = declaration.split(/:\s*/)
    expect(property !== '' && [...wordsOf(value).filter(isColour), ...(value.match(COLOUR_FUNCTION) ?? [])].length > 0).toBe(found)
  })

  // A variable declared here is a colour of the page's under another
  // name, and would shadow a theme's.
  test('declare no variable of their own', () => {
    expect(stylesheets.flatMap(({ file, css }) => declared(css).map((name) => `${file}: ${name}`))).toEqual([])
  })

  // A variable no theme declares reads as nothing: the rule falls back to
  // the browser's default, and the page shows a colour nobody chose.
  test('read only variables the themes they wear declare', () => {
    const theirs = new Set([...declared(withoutComments(themes('workbench.css'))), ...declared(withoutComments(themes('blueprint.css')))])
    expect(theirs).toContain('--wb-signal')
    const unknown = stylesheets.flatMap(({ file, css }) => read(css).filter((name) => !theirs.has(name)).map((name) => `${file}: ${name}`))
    expect(unknown).toEqual([])
  })

  // A colour in a `style` prop is a colour of the page's that no
  // stylesheet shows; the page draws none.
  test('are the only place a style is written: no element of the page carries a style prop', () => {
    const styled = filesIn(src, /\.tsx$/).flatMap((file) => {
      const source = ts.createSourceFile(file, readFileSync(join(src, file), 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
      const found: string[] = []
      const walk = (node: ts.Node): void => {
        if (ts.isJsxAttribute(node) && node.name.getText(source) === 'style') found.push(`${file}: ${node.getText(source)}`)
        ts.forEachChild(node, walk)
      }
      walk(source)
      return found
    })
    expect(styled).toEqual([])
  })
})

describe("the stylesheets main.tsx imports", () => {
  // The workbench declares the variables the page reads and Blueprint
  // dresses the form on top of it: in another order a theme's rule loses
  // to the one it was written over. A stylesheet the page imports from
  // elsewhere would be a palette nobody holds here.
  test("are the themes' workbench and Blueprint, then the page's faces and layout, in that order", () => {
    const imports = ts.preProcessFile(readFileSync(join(src, 'main.tsx'), 'utf8'), true, false).importedFiles.map(({ fileName }) => fileName)
    expect(imports.filter((name) => name.endsWith('.css'))).toEqual(['@formancy/themes/workbench.css', '@formancy/themes/blueprint.css', './styles/fonts.css', './styles/demo.css'])
  })

  // The faces the page serves are those the themes name: a face no theme's
  // font stack names is bytes the page builds and nobody draws with, and
  // one a theme names that the page does not serve falls back to the
  // visitor's machine.
  test("serve the faces the themes' variables name, and only those", () => {
    const fonts = stylesheets.find(({ file }) => file === 'styles/fonts.css')?.css ?? ''
    const families = [...fonts.matchAll(/@import '([^']+)'/g)].map(([, from = '']) => /font-family:\s*'([^']+)'/.exec(readFileSync(createRequire(import.meta.url).resolve(from), 'utf8'))?.[1])
    const named = [...withoutComments(themes('workbench.css')).matchAll(/--wb-(?:sans|mono):\s*'([^']+)'/g)].map(([, family]) => family)
    expect(new Set(families)).toEqual(new Set(named))
  })
})
