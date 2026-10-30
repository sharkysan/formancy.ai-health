import { readdirSync, readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'
import { describe, expect, test } from 'vitest'

/**
 * The demo's stylesheets, held to what 0002, 0012 and 0015 decide: nothing
 * of formancy's is copied, so the page states no colour of its own and
 * declares no variable; every colour is one @formancy/themes declares, as
 * the release the manifest pins ships it, imported and never copied, in
 * the order its README gives -- the workbench, formancy.ai's room after
 * it, and Blueprint for the form, whose variables are read inside its
 * scope alone; and the page's script writes no style.
 *
 * It reads the stylesheets, main.tsx's imports and the page's script,
 * which is what it is about. A colour is found as the browser would take
 * it: each word of a declaration's value set as a colour on a jsdom style,
 * and kept when the style accepts it, so a named colour no list here holds
 * is caught as surely as a hex. What jsdom cannot do -- lay out, compute a
 * colour, a contrast -- is the browser gate's.
 */
const src = dirname(fileURLToPath(import.meta.url))
const themes = (file: string): string => readFileSync(createRequire(import.meta.url).resolve(`@formancy/themes/${file}`), 'utf8')

/** The stylesheets of @formancy/themes the page wears, in the order main.tsx imports them. */
const WORN = ['workbench.css', 'room.css', 'blueprint.css']

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

/** A selector as the comparison below reads it: trimmed, one space between its parts, its strings in single quotes. */
const selector = (written: string): string => written.trim().replaceAll(/\s+/g, ' ').replaceAll('"', "'")

/**
 * Every rule of a stylesheet that holds declarations, a rule inside an
 * at-rule's block among them: its selectors and its body. What stands
 * before it and ends in a semicolon -- an `@import` -- is no part of it.
 */
const rulesOf = (css: string): { selectors: string[]; body: string }[] =>
  [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map(([, prelude = '', body = '']) => ({
    selectors: (prelude.split(';').at(-1) ?? '').split(',').map(selector),
    body,
  }))

/**
 * Each variable the themes declare only under a scope, with the selectors
 * it is declared under; one any of them declares on :root is everywhere,
 * and is not in it.
 */
function scopesOf(themeSheets: string[]): Map<string, Set<string>> {
  const under = new Map<string, Set<string>>()
  for (const { selectors, body } of themeSheets.flatMap(rulesOf)) {
    for (const name of declared(body)) under.set(name, new Set([...(under.get(name) ?? []), ...selectors]))
  }
  return new Map([...under].filter(([, selectors]) => !selectors.has(':root')))
}

/** Each place `css` reads a scoped variable in a selector that names none of its scopes. */
const outsideScopes = (file: string, css: string, scopes: Map<string, Set<string>>): string[] =>
  rulesOf(css).flatMap(({ selectors, body }) =>
    read(body).flatMap((name) => {
      const within = scopes.get(name)
      if (within === undefined) return []
      return selectors
        .filter((each) => ![...within].some((scope) => each.includes(scope)))
        .map((each) => `${file}: ${each} reads ${name} outside ${[...within].join(' or ')}`)
    }),
  )

/**
 * The members a script reaches a style through: an element's style and
 * what is set on it, a rule's text, the document's stylesheets and those
 * it adopts, and a rule written into one.
 */
const STYLE_MEMBERS = new Set(['style', 'cssText', 'setProperty', 'styleSheets', 'adoptedStyleSheets', 'insertRule', 'replaceSync'])

/** Calls that set an attribute, which a `style` one would. */
const ATTRIBUTE_CALLS = new Set(['setAttribute', 'setAttributeNS', 'toggleAttribute'])

/** Calls that make an element, the DOM's and React's: a `style` element, or props with a `style`. */
const ELEMENT_CALLS = new Set(['createElement', 'createElementNS', 'cloneElement', 'jsx', 'jsxs', 'jsxDEV'])

/**
 * Every style `text`, the source of module `file`, writes, each where it
 * stands: a `style` prop, or props with one handed to createElement; a
 * member of STYLE_MEMBERS; a style attribute set or a style element made;
 * a stylesheet constructed; and a custom property named, as a script names
 * one to set it -- `setProperty('--ground', …)` -- or to read it. Markup
 * written as a string is the policy's: Trusted Types refuses it (0012).
 */
function stylesWritten(file: string, text: string): string[] {
  const source = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, file.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS)
  const found: string[] = []
  const literal = (node: ts.Node | undefined): string | undefined =>
    node !== undefined && (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) ? node.text : undefined
  const called = (expression: ts.Expression): string =>
    ts.isIdentifier(expression) ? expression.text : ts.isPropertyAccessExpression(expression) ? expression.name.text : ''
  const writes = (node: ts.Node): boolean => {
    if (ts.isJsxAttribute(node)) return node.name.getText(source) === 'style'
    if (ts.isPropertyAccessExpression(node)) return STYLE_MEMBERS.has(node.name.text)
    if (ts.isElementAccessExpression(node)) return STYLE_MEMBERS.has(literal(node.argumentExpression) ?? '')
    if (ts.isNewExpression(node)) return ts.isIdentifier(node.expression) && node.expression.text === 'CSSStyleSheet'
    if (ts.isCallExpression(node)) {
      const name = called(node.expression)
      if (ATTRIBUTE_CALLS.has(name)) return node.arguments.some((argument) => literal(argument)?.toLowerCase() === 'style')
      if (!ELEMENT_CALLS.has(name)) return false
      const [type, props] = node.arguments
      return (
        literal(type)?.toLowerCase() === 'style' ||
        literal(props)?.toLowerCase() === 'style' ||
        (props !== undefined && ts.isObjectLiteralExpression(props) && props.properties.some((property) => property.name?.getText(source) === 'style'))
      )
    }
    return /^--[\w-]+$/.test(literal(node) ?? '')
  }
  const walk = (node: ts.Node): void => {
    if (writes(node)) found.push(`${file}:${String(source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1)}: ${node.getText(source)}`)
    ts.forEachChild(node, walk)
  }
  walk(source)
  return found
}

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
        property.startsWith('--')
          ? []
          : [...wordsOf(value).filter(isColour), ...(value.match(COLOUR_FUNCTION) ?? [])].map((word) => `${file}: ${property}: ${word}`),
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
    const theirs = new Set(WORN.flatMap((file) => declared(withoutComments(themes(file)))))
    expect(theirs).toContain('--wb-signal')
    expect(theirs).toContain('--ground')
    const unknown = stylesheets.flatMap(({ file, css }) =>
      read(css)
        .filter((name) => !theirs.has(name))
        .map((name) => `${file}: ${name}`),
    )
    expect(unknown).toEqual([])
  })

  // A variable a theme declares only under a scope -- Blueprint's --fm-*,
  // under [data-formancy-theme='blueprint'] -- reads as nothing outside it,
  // as surely as one no theme declares: the form's paper read outside the
  // form would be no paper, and only axe's contrast, in a browser, would
  // see Blueprint's ink on the dark room. Inside the scope is a selector
  // that names it, on the element or above it.
  test('read a variable a theme scopes only in a rule that names its scope', () => {
    const scopes = scopesOf(WORN.map((file) => withoutComments(themes(file))))
    expect(scopes.get('--fm-paper')).toEqual(new Set(["[data-formancy-theme='blueprint']"]))
    expect(scopes.get('--ground')).toBeUndefined()
    expect(stylesheets.flatMap(({ file, css }) => outsideScopes(file, css, scopes))).toEqual([])
    expect(outsideScopes('a.css', '.paper { background: var(--fm-paper) }', scopes)).toEqual([
      "a.css: .paper reads --fm-paper outside [data-formancy-theme='blueprint']",
    ])
    expect(
      outsideScopes(
        'a.css',
        `@media (width > 1px) { .x[data-formancy-theme="blueprint"], [data-formancy-theme='blueprint'] .y { color: var(--fm-ink) } }`,
        scopes,
      ),
    ).toEqual([])
  })

  // A colour a script writes is a colour of the page's that no stylesheet
  // shows, and a copy of the room's set on :root from a script would pass
  // the browser gate's room check, which compares values: the page's
  // script writes no style at all. Its source is every module of src/
  // that is not the suite's.
  test('are the only place a style is written: the page’s script writes none', () => {
    const page = filesIn(src, /\.tsx?$/).filter((file) => !/(?:^|\/)test-|\.test\.tsx?$|\.d\.ts$/.test(file))
    expect(page).toContain('main.tsx')
    expect(page).toContain('engine.ts')
    expect(page.flatMap((file) => stylesWritten(file, readFileSync(join(src, file), 'utf8')))).toEqual([])
  })

  // The reading itself, on each way a script could write a style, and on
  // one that writes none -- an Intl option named `style` is no style.
  test.each([
    ['a style prop', 'a.tsx', '<i style={{ color: "red" }} />', true],
    ['a style handed to createElement', 'a.ts', "createElement('i', { style: { color: 'red' } })", true],
    ['a custom property set on :root', 'a.ts', "document.documentElement.style.setProperty('--ground', '#010203')", true],
    ["a property of an element's style", 'a.ts', "element.style.color = 'red'", true],
    ["an element's style by its name as a string", 'a.ts', "element['style'].color = 'red'", true],
    ['a style attribute', 'a.ts', "element.setAttribute('style', 'color: red')", true],
    ['a style element', 'a.ts', "document.head.append(document.createElement('style'))", true],
    ['a stylesheet made and adopted', 'a.ts', 'document.adoptedStyleSheets = [new CSSStyleSheet()]', true],
    ['a rule written into a stylesheet', 'a.ts', "document.styleSheets[0]?.insertRule('i { color: red }')", true],
    ['a custom property named', 'a.ts', "const name = '--ground'", true],
    ['a script that writes none', 'a.tsx', "const f = new Intl.NumberFormat('de', { style: 'percent' }); <p className=\"status\">{f.format(1)}</p>", false],
  ])('find %s as a style the page writes, or not', (_name, file, text, found) => {
    expect(stylesWritten(file, text).length > 0).toBe(found)
  })
})

describe('the stylesheets main.tsx imports', () => {
  // The workbench declares its light defaults on :root and the room sets
  // them to its own, on :root too, so the room after the workbench or its
  // panes stay light in the dark room, as room.css's header says; Blueprint
  // dresses the form on top of both. In another order a theme's rule loses
  // to the one it was written over. A stylesheet the page imports from
  // elsewhere would be a palette nobody holds here.
  test("are the themes' workbench, room and Blueprint, then the page's faces and layout, in that order", () => {
    const imports = ts.preProcessFile(readFileSync(join(src, 'main.tsx'), 'utf8'), true, false).importedFiles.map(({ fileName }) => fileName)
    expect(imports.filter((name) => name.endsWith('.css'))).toEqual([
      ...WORN.map((file) => `@formancy/themes/${file}`),
      './styles/fonts.css',
      './styles/demo.css',
    ])
  })

  // The faces the page serves are those the themes' stacks name first: a
  // face no stack names first is bytes the page builds and nobody draws
  // with, and a stack whose first face the page does not serve falls back
  // to the next -- the room's headings, whose --display names Archivo
  // first, drawn in IBM Plex Sans. A stack is a variable of a theme the
  // page wears whose value starts with a quoted family, and its face is
  // served under its own name or, as Fontsource names a variable face,
  // `<Family> Variable` (@formancy/themes' README).
  test("serve the face each of the themes' stacks names first, and only those", () => {
    const fonts = stylesheets.find(({ file }) => file === 'styles/fonts.css')?.css ?? ''
    const served = new Set(
      [...fonts.matchAll(/@import '([^']+)'/g)].map(
        ([, from = '']) => /font-family:\s*'([^']+)'/.exec(readFileSync(createRequire(import.meta.url).resolve(from), 'utf8'))?.[1],
      ),
    )
    const firsts = WORN.flatMap((file) =>
      [...withoutComments(themes(file)).matchAll(/(--[\w-]+):\s*'([^']+)'/g)].map(([, stack = '', family = '']) => ({ stack, family })),
    )
    expect(firsts.map(({ stack }) => stack)).toContain('--display')
    const unserved = firsts.filter(({ family }) => !served.has(family) && !served.has(`${family} Variable`)).map(({ stack, family }) => `${stack}: ${family}`)
    expect(unserved).toEqual([])
    const drawn = new Set(firsts.flatMap(({ family }) => [family, `${family} Variable`]))
    expect([...served].filter((family) => family === undefined || !drawn.has(family))).toEqual([])
  })
})
