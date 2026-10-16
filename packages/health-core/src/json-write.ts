/**
 * FHIR JSON from values, byte for byte the same for the same input.
 *
 * A number is written from its text, unquoted, as R4 writes integer and
 * decimal; a string as JSON.stringify escapes it; names in the order the
 * object gives them, never sorted; no whitespace. Nothing reads a clock or
 * a random source, so the same value is the same bytes wherever and
 * whenever it is written.
 *
 * What JSON.stringify would drop or change without a word, or throw on, is
 * refused, with the path: a JavaScript number, whose digits may already be lost;
 * undefined, a function, a symbol, a bigint with no FHIR type yet, a Date
 * or any object that is not plain data; and what FHIR JSON forbids (see
 * json.ts). A host's objects are read through their property descriptors,
 * each property once, so a getter is refused unrun and what was checked is
 * what is written.
 *
 * The walk keeps its own stack rather than recursing, so nesting costs
 * memory and not the call stack: no depth throws a RangeError, and no bound
 * on depth had to be chosen.
 */
import { isIndexName, item, member, ROOT, type FhirJson } from './json.js'
import { isFhirNumber } from './numbers.js'
import { Refusal } from './refusal.js'

/** An entry of a container: an object's name, or undefined for an array's item, and its value. */
type Entry = readonly [name: string | undefined, value: unknown]

/** A container being written, its entries read once, and how many are written. */
interface Open {
  readonly container: object
  readonly path: string
  readonly array: boolean
  readonly entries: readonly Entry[]
  written: number
}

/** The next value to write, and where it stands. */
interface Next {
  readonly value: unknown
  readonly path: string
  readonly inArray: boolean
}

/**
 * `value` as FHIR JSON, or a Refusal naming the first thing in it that FHIR
 * JSON cannot carry.
 */
export function writeJson(value: FhirJson): string {
  const out: string[] = []
  const open: Open[] = []
  const opened = new Set<object>()
  let next: Next | undefined = { value, path: ROOT, inArray: false }
  while (next !== undefined) {
    const container = writeScalar(next, out)
    if (container !== undefined) {
      if (opened.has(container)) throw new Refusal('cycle', next.path)
      const { array, entries } = contents(container, next.path)
      opened.add(container)
      open.push({ container, path: next.path, array, entries, written: 0 })
      out.push(array ? '[' : '{')
    }
    next = advance(open, opened, out)
  }
  return out.join('')
}

/** Writes `next` if it is not a container, and answers the container if it is. */
function writeScalar({ value, path, inArray }: Next, out: string[]): object | undefined {
  switch (typeof value) {
    case 'string':
      if (value === '') throw new Refusal('empty', path)
      out.push(JSON.stringify(value))
      return undefined
    case 'boolean':
      out.push(value ? 'true' : 'false')
      return undefined
    case 'number':
      throw new Refusal('javascript-number', path)
    case 'object':
      if (value === null) {
        if (!inArray) throw new Refusal('null', path)
        out.push('null')
        return undefined
      }
      if (isFhirNumber(value)) {
        out.push(value.text)
        return undefined
      }
      return value
    default:
      // undefined, a function, a symbol, a bigint.
      throw new Refusal('not-json', path)
  }
}

/** Closes what is finished, and answers the next entry to write, or undefined when the value is written. */
function advance(open: Open[], opened: Set<object>, out: string[]): Next | undefined {
  for (let top = open.at(-1); top !== undefined; top = open.at(-1)) {
    const entry = top.entries[top.written]
    if (entry !== undefined) {
      const [name, value] = entry
      if (top.written > 0) out.push(',')
      if (name !== undefined) out.push(JSON.stringify(name), ':')
      const path = name === undefined ? item(top.path, top.written) : member(top.path, name)
      top.written++
      return { value, path, inArray: top.array }
    }
    out.push(top.array ? ']' : '}')
    opened.delete(top.container)
    open.pop()
  }
  return undefined
}

/**
 * A container's entries, each read once through its descriptor, or the
 * refusal of what makes it something other than an array or a plain object
 * of data. Whatever throws while it is read -- a proxy's trap, a revoked
 * proxy -- is a refusal too, never an exception of the host's own.
 */
function contents(container: object, path: string): { readonly array: boolean; readonly entries: readonly Entry[] } {
  let array: boolean
  let prototype: unknown
  let descriptors: (readonly [string | symbol, PropertyDescriptor | undefined])[]
  try {
    array = Array.isArray(container)
    prototype = Object.getPrototypeOf(container)
    descriptors = Reflect.ownKeys(container).map((key) => [key, Reflect.getOwnPropertyDescriptor(container, key)] as const)
  } catch {
    throw new Refusal('not-data', path)
  }
  if (!array && prototype !== Object.prototype && prototype !== null) throw new Refusal('not-json', path)
  const entries = array ? items(new Map(descriptors), path) : members(descriptors, path)
  if (entries.length === 0) throw new Refusal('empty', path)
  return { array, entries }
}

/** An array's items, in order. A hole, a getter or a property that is not an item is refused. */
function items(descriptors: ReadonlyMap<string | symbol, PropertyDescriptor | undefined>, path: string): Entry[] {
  // An array's length is a whole number; a proxy's may be anything.
  const length: unknown = descriptors.get('length')?.value
  if (typeof length !== 'number' || !Number.isSafeInteger(length) || length < 0) throw new Refusal('not-data', path)
  const entries: Entry[] = []
  for (let index = 0; index < length; index++) {
    const descriptor = descriptors.get(String(index))
    if (descriptor === undefined || !('value' in descriptor)) throw new Refusal('not-data', item(path, index))
    entries.push([undefined, descriptor.value])
  }
  // Its items and its length are an array's only own properties: a named
  // one would be dropped, as JSON.stringify drops it.
  if (descriptors.size !== length + 1) throw new Refusal('not-data', path)
  return entries
}

/** A plain object's members, in its own order. A getter, a hidden or symbol-named property, or a name JavaScript reorders is refused. */
function members(descriptors: readonly (readonly [string | symbol, PropertyDescriptor | undefined])[], path: string): Entry[] {
  return descriptors.map(([name, descriptor]) => {
    if (typeof name === 'symbol') throw new Refusal('not-data', path)
    const at = member(path, name)
    if (descriptor === undefined || !('value' in descriptor) || descriptor.enumerable !== true) throw new Refusal('not-data', at)
    if (isIndexName(name)) throw new Refusal('digit-name', at)
    return [name, descriptor.value] as const
  })
}
