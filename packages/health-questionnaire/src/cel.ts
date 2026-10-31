/**
 * The few rules of a form that are simple comparisons, read from their CEL.
 *
 * formancy's rules are CEL, evaluated by its engine; SDC's conditions are
 * `enableWhen`, a list of comparisons of one answer with one value, all or
 * any of which must hold. Only a rule that is already such a list says
 * the same thing in both, so this reads exactly that and nothing else --
 * not a CEL engine, and nothing it reads is ever run:
 *
 *     condition  := comparison ( join comparison )*     one join throughout
 *     join       := "&&" | "||"
 *     comparison := key operator literal | literal "in" key
 *     operator   := "==" | "!=" | "<" | "<=" | ">" | ">="
 *     literal    := 'text' | "text" | number | true | false
 *
 * A key is a field's key, an answer at the top of the submission. A text
 * literal has no escape and no line break; a number is digits, an optional
 * minus and an optional fraction, as JSON writes one, and keeps its text.
 * Anything else -- a dotted path, parentheses, a negation, a function, an
 * escape, an exponent, `null` -- is not read, and the rule is refused.
 */

export type Operator = '==' | '!=' | '<' | '<=' | '>' | '>='

export type Literal =
  | { readonly kind: 'string'; readonly text: string }
  | { readonly kind: 'number'; readonly text: string }
  | { readonly kind: 'boolean'; readonly value: boolean }

/** `key operator literal`, or `literal in key`, a list answer holding the literal. */
export interface Comparison {
  readonly key: string
  readonly operator: Operator | 'in'
  readonly literal: Literal
}

export interface Condition {
  readonly comparisons: readonly Comparison[]
  /** How they join: every one must hold, or any. One comparison holds alone, and is `&&`. */
  readonly join: '&&' | '||'
}

type Token = { readonly kind: 'name' | 'string' | 'number' | 'symbol'; readonly text: string }

/**
 * One token, at the start of what is left. CEL's other numbers -- `5u`,
 * `1e3`, `0x1F`, `01` -- are read as a number followed by a name or by
 * another number, which no comparison is, so the condition is not read.
 */
const TOKEN = /\s*(?:([A-Za-z_][A-Za-z0-9_]*)|('[^'\\\r\n]*'|"[^"\\\r\n]*")|(-?(?:0|[1-9][0-9]*)(?:\.[0-9]+)?)|(==|!=|<=|>=|<|>|&&|\|\|))/y

/** What each of TOKEN's groups is. */
const KINDS = [undefined, 'name', 'string', 'number', 'symbol'] as const

/** The tokens of `source`, or undefined at the first character none begins with. */
function tokens(source: string): Token[] | undefined {
  const found: Token[] = []
  TOKEN.lastIndex = 0
  while (!/^\s*$/.test(source.slice(TOKEN.lastIndex))) {
    const match = TOKEN.exec(source)
    if (match === null) return undefined
    // Exactly one group matched, and it says what the token is; a text's
    // quotes are not part of it.
    const at = match.findIndex((group, index) => index > 0 && group !== undefined)
    const kind = KINDS[at] as Token['kind']
    const text = match[at] as string
    found.push({ kind, text: kind === 'string' ? text.slice(1, -1) : text })
  }
  return found
}

const OPERATORS: ReadonlySet<string> = new Set(['==', '!=', '<', '<=', '>', '>='])

/** A literal token as a literal, or undefined when it is not one. */
function literalOf(token: Token): Literal | undefined {
  if (token.kind === 'string' || token.kind === 'number') return { kind: token.kind, text: token.text }
  if (token.kind === 'name' && (token.text === 'true' || token.text === 'false')) return { kind: 'boolean', value: token.text === 'true' }
  return undefined
}

/** A field key: a name that is no keyword. */
const keyOf = (token: Token): string | undefined => (token.kind === 'name' && !['true', 'false', 'null', 'in'].includes(token.text) ? token.text : undefined)

/** The comparison of three tokens, or undefined. */
function comparisonOf([first, middle, last]: readonly [Token, Token, Token]): Comparison | undefined {
  if (middle.kind === 'name' && middle.text === 'in') {
    const key = keyOf(last)
    const literal = literalOf(first)
    return key === undefined || literal === undefined ? undefined : { key, operator: 'in', literal }
  }
  const key = keyOf(first)
  const literal = literalOf(last)
  if (key === undefined || literal === undefined || middle.kind !== 'symbol' || !OPERATORS.has(middle.text)) return undefined
  return { key, operator: middle.text as Operator, literal }
}

/** `source` as a condition, or undefined when it is anything else. */
export function readCondition(source: string): Condition | undefined {
  const found = tokens(source)
  if (found === undefined || found.length % 4 !== 3) return undefined
  const comparisons: Comparison[] = []
  let join: '&&' | '||' | undefined
  for (let at = 0; at < found.length; at += 4) {
    // found.length is 3 more than a multiple of 4, so three tokens are here.
    const comparison = comparisonOf(found.slice(at, at + 3) as [Token, Token, Token])
    if (comparison === undefined) return undefined
    comparisons.push(comparison)
    const next = found[at + 3]
    if (next === undefined) break
    if (next.kind !== 'symbol' || (next.text !== '&&' && next.text !== '||') || (join !== undefined && next.text !== join)) return undefined
    join = next.text
  }
  return { comparisons, join: join ?? '&&' }
}
