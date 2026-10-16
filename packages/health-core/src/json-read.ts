/**
 * FHIR JSON from text, every number kept as the text it was written in.
 *
 * Not JSON.parse, for two reasons, measured on Node 24.21.0 on 17 October
 * 2026:
 *
 * - **JSON.parse keeps the last of two properties of one name**, without a
 *   word: `JSON.parse('{"a":1,"a":2}')` is `{ a: 2 }`, before any reviver
 *   runs, so no reviver can see the first. R4 says "Property names SHALL be
 *   unique" (https://hl7.org/fhir/R4/json.html), and a resource with two
 *   birthDates must be refused, not read as whichever came second.
 * - **JSON.parse reads every number into a double first.** Its reviver's
 *   third argument, the source text (Node from 21, Chrome 114, Firefox 135,
 *   Safari 18.4, by MDN's browser-compat-data 8.1.6), hands back the digits,
 *   so the engines were not the obstacle; but the double is made all the
 *   same, and nothing could show it is never used. With this reader no
 *   source here calls JSON.parse, and a guard holds that.
 * - **A reviver walks the document recursively.** JSON.parse with one
 *   throws a RangeError on an array nested 100,000 deep, which JSON.parse
 *   without one reads.
 *
 * So this is RFC 8259's grammar, read once, left to right, holding FHIR
 * JSON's rules as it goes (json.ts): a name given twice, an empty object,
 * array or string, a null outside an array and a name JavaScript would
 * reorder are refused. A number is lexed with R4's decimal grammar, which
 * is JSON's, and made with decimal(): every number read is a decimal,
 * since which FHIR type an element is cannot be known without its
 * definition. integer() narrows one, from its text.
 *
 * It keeps its own stack rather than recursing, so a document nested
 * deeper than a call stack is read, not a RangeError; its time and memory
 * grow with the text's length and nothing else, and the host decides how
 * much text it reads.
 */
import { isIndexName, item, member, ROOT, type FhirJson } from './json.js'
import { decimal, DECIMAL } from './numbers.js'
import { Refusal } from './refusal.js'

/** A JSON number, from where the reader stands. */
const NUMBER = new RegExp(DECIMAL, 'y')

const LITERALS = [
  ['true', true],
  ['false', false],
  ['null', null],
] as const

/** What follows a backslash in a JSON string, but \u. */
const ESCAPES: ReadonlyMap<string, string> = new Map([
  ['"', '"'],
  ['\\', '\\'],
  ['/', '/'],
  ['b', '\b'],
  ['f', '\f'],
  ['n', '\n'],
  ['r', '\r'],
  ['t', '\t'],
])

const FOUR_HEX_DIGITS = /^[0-9A-Fa-f]{4}$/
const HEX_DIGITS = '0123456789abcdef'

/** A UTF-16 code unit from the four hex digits of a \u escape, digit by digit. */
const codeUnit = (hex: string) => [...hex.toLowerCase()].reduce((unit, digit) => unit * 16 + HEX_DIGITS.indexOf(digit), 0)

interface OpenArray {
  readonly array: true
  readonly path: string
  readonly items: FhirJson[]
}

interface OpenObject {
  readonly array: false
  readonly path: string
  readonly members: Record<string, FhirJson>
  /** The name whose value is being read. */
  name: string
}

/**
 * `text` as FHIR JSON, or a Refusal naming where it stopped being JSON or
 * which of FHIR JSON's rules it broke. A number in it is a FhirDecimal.
 */
export function readJson(text: string): FhirJson {
  return new Reader(text).read()
}

class Reader {
  readonly #text: string
  #at = 0

  constructor(text: string) {
    this.#text = text
  }

  read(): FhirJson {
    const open: (OpenArray | OpenObject)[] = []
    let path = ROOT
    for (;;) {
      this.#space()
      const opener = this.#text[this.#at]
      if (opener === '[' || opener === '{') {
        this.#at++
        this.#space()
        if (this.#text[this.#at] === (opener === '[' ? ']' : '}')) throw new Refusal('empty', path)
        if (opener === '[') {
          open.push({ array: true, path, items: [] })
          path = item(path, 0)
        } else {
          const object: OpenObject = { array: false, path, members: {}, name: '' }
          open.push(object)
          path = this.#name(object)
        }
        continue
      }
      let value = this.#scalar(path, open.at(-1)?.array === true)
      // The value goes into its container; then every container that ends
      // after it is closed and goes into its own, until one continues.
      for (;;) {
        const top = open.at(-1)
        if (top === undefined) {
          this.#space()
          if (this.#at !== this.#text.length) throw this.#syntax(path)
          return value
        }
        // Defined rather than assigned: assigning '__proto__' would set
        // the object's prototype. JSON.parse defines it the same way.
        if (top.array) top.items.push(value)
        else Object.defineProperty(top.members, top.name, { value, enumerable: true, writable: true, configurable: true })
        this.#space()
        const next = this.#text[this.#at]
        if (next === ',') {
          this.#at++
          path = top.array ? item(top.path, top.items.length) : this.#name(top)
          break
        }
        if (next !== (top.array ? ']' : '}')) throw this.#syntax(path)
        this.#at++
        open.pop()
        value = top.array ? top.items : top.members
        path = top.path
      }
    }
  }

  /** Reads a member's name and its colon, and answers the path of its value. */
  #name(object: OpenObject): string {
    this.#space()
    if (this.#text[this.#at] !== '"') throw this.#syntax(object.path)
    const name = this.#string(object.path)
    const path = member(object.path, name)
    if (isIndexName(name)) throw new Refusal('digit-name', path)
    if (Object.hasOwn(object.members, name)) throw new Refusal('duplicate-name', path)
    this.#space()
    if (this.#text[this.#at] !== ':') throw this.#syntax(path)
    this.#at++
    object.name = name
    return path
  }

  /** A string, a literal or a number. */
  #scalar(path: string, inArray: boolean): FhirJson {
    if (this.#text[this.#at] === '"') {
      const value = this.#string(path)
      if (value === '') throw new Refusal('empty', path)
      return value
    }
    for (const [word, value] of LITERALS) {
      if (!this.#text.startsWith(word, this.#at)) continue
      if (value === null && !inArray) throw new Refusal('null', path)
      this.#at += word.length
      return value
    }
    NUMBER.lastIndex = this.#at
    const number = NUMBER.exec(this.#text)
    if (number === null) throw this.#syntax(path)
    this.#at = NUMBER.lastIndex
    return decimal(number[0], path)
  }

  /** A JSON string, from its opening quote, decoded. */
  #string(path: string): string {
    let decoded = ''
    let from = ++this.#at
    for (;;) {
      if (this.#at >= this.#text.length) throw this.#syntax(path)
      const unit = this.#text.charCodeAt(this.#at)
      if (unit === 0x22) {
        decoded += this.#text.slice(from, this.#at++)
        return decoded
      }
      if (unit === 0x5c) {
        decoded += this.#text.slice(from, this.#at) + this.#escape(path)
        from = this.#at
        continue
      }
      // RFC 8259: control characters are escaped inside a string, never raw.
      if (unit < 0x20) throw this.#syntax(path)
      this.#at++
    }
  }

  /** An escape, from its backslash, decoded. A \u escape is one code unit, as JSON.parse decodes it. */
  #escape(path: string): string {
    const letter = this.#text[++this.#at]
    if (letter === 'u') {
      const hex = this.#text.slice(this.#at + 1, this.#at + 5)
      if (!FOUR_HEX_DIGITS.test(hex)) throw this.#syntax(path)
      this.#at += 5
      return String.fromCharCode(codeUnit(hex))
    }
    const decoded = letter === undefined ? undefined : ESCAPES.get(letter)
    if (decoded === undefined) throw this.#syntax(path)
    this.#at++
    return decoded
  }

  /** JSON's whitespace: space, tab, line feed, carriage return. Nothing else, a byte order mark included. */
  #space(): void {
    while (this.#at < this.#text.length && ' \t\n\r'.includes(this.#text[this.#at] as string)) this.#at++
  }

  #syntax(path: string): Refusal {
    return new Refusal('syntax', path, { offset: this.#at })
  }
}
