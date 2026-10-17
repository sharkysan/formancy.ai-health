/**
 * Reading what a host hands over: each value its own, absent where it is
 * missing, and checked where it stands.
 *
 * A host's objects are untrusted, whatever their types say. Each value is
 * read as the object's own property, so a name the object inherits is no
 * value; one that is missing where the resource needs it is refused as
 * `absent`, never made up; and one that is there is checked by a
 * primitive of this package's, at the path it stands at. An object is
 * read for the members its context names and no others: one more is
 * refused, not left out. A list is read at every index, a hole's too.
 * Every package that reads a host's context reads it with these (0008,
 * 0009), so that a missing value, a text of spaces, a code outside a
 * required binding, a member no context names and a hole in a list are
 * refused the same way wherever a host meets them.
 */
import { carried } from './characters.js'
import { item } from './json.js'
import { Refusal } from './refusal.js'
import type { Refusals } from './refusals.js'
import { code, type FhirCode } from './strings.js'

/** The value `holder` holds under `name`, its own; undefined for anything that is not an object holding one. */
export function valueAt(holder: unknown, name: string): unknown {
  if (typeof holder !== 'object' || holder === null || !Object.hasOwn(holder, name)) return undefined
  return (holder as Readonly<Record<string, unknown>>)[name]
}

/**
 * A value the resource needs: `make` of it, or undefined with the refusal
 * recorded -- `absent` when there is none, whatever `make` refuses
 * otherwise. A null is a value the host gave, handed to `make`, which
 * refuses it: FHIR JSON has no null where a context's member stands.
 */
export function needed<T>(holder: unknown, name: string, path: string, refusals: Refusals, make: (value: string, at: string) => T): T | undefined {
  const value = valueAt(holder, name)
  if (value === undefined) return refusals.add('absent', path)
  return refusals.take(() => make(value as string, path))
}

/** A value the resource may have: undefined when the host gives none, `make` of it otherwise, a null included. */
export function optional<T>(holder: unknown, name: string, path: string, refusals: Refusals, make: (value: string, at: string) => T): T | undefined {
  return valueAt(holder, name) === undefined ? undefined : needed(holder, name, path, refusals, make)
}

/**
 * A text: a string with something in it but whitespace, and only
 * characters a resource can carry. R4 says a string of whitespace "could
 * be trimmed to nothing, which would be treated as an invalid element
 * value. Therefore strings SHOULD always contain non-whitespace content"
 * (datatypes.html, read on 17 October 2026); a title or a name of spaces
 * says nothing, so it is refused as `absent`, as nothing is. A control
 * character but the tab and the line breaks, a surrogate alone, U+FFFE
 * and U+FFFF are refused as a string's `grammar`, as a narrative refuses
 * them (characters.ts).
 */
export function text(value: string, path: string): string {
  if (typeof value !== 'string' || !/\S/.test(value)) throw new Refusal('absent', path)
  if (!carried(value)) throw new Refusal('grammar', path, { type: 'string' })
  return value
}

/** A code from one of `allowed`, R4's required binding: refused as `unmapped` when it is a code R4 does not have there. */
export function codeOf(allowed: readonly string[]): (value: string, path: string) => FhirCode {
  return (value, path) => {
    const given = code(value, path)
    if (!allowed.includes(given)) throw new Refusal('unmapped', path)
    return given
  }
}

/**
 * `holder` read as an object of `names` and no others: refused as
 * `absent` at `path` when it is no object -- an array is none, its
 * indices no member a context names -- and as `unmapped` once when it
 * holds a member `names` does not name, which the resource would leave
 * out without a word. That member's name is the host's, and is not
 * repeated. Whether it can be read on is the answer: an object, unknown
 * members or not, is read for what it names, so that every refusal comes
 * at once.
 */
export function known(holder: unknown, names: readonly string[], path: string, refusals: Refusals): holder is object {
  if (typeof holder !== 'object' || holder === null || Array.isArray(holder)) {
    refusals.add('absent', path)
    return false
  }
  if (Object.keys(holder).some((name) => !names.includes(name))) refusals.add('unmapped', path)
  return true
}

/** The object `holder` holds under `name`, read as `known` reads one; undefined, refused, when it is none. */
export function objectAt(holder: unknown, name: string, names: readonly string[], path: string, refusals: Refusals): object | undefined {
  const given = valueAt(holder, name)
  return known(given, names, path, refusals) ? given : undefined
}

/**
 * `read` of every item of `list`, by its name -- its index, as valueAt
 * reads it -- and its path, from the first index to the last. A host's
 * array may have a hole, which JSON never does, and `map`, `every` and
 * `some` walk past one: a reader built on them neither reads nor refuses
 * the item there, and the resource would be written with a gap. Here
 * each index is read, and a hole is no value of the host's, `absent`
 * where an item is needed.
 */
export function readItems<T>(list: readonly unknown[], path: string, read: (name: string, at: string) => T): T[] {
  const items: T[] = []
  for (let index = 0; index < list.length; index += 1) items.push(read(String(index), item(path, index)))
  return items
}
