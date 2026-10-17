/**
 * Reading what the host says of a document: its codes, its references, its
 * texts and its statuses, each checked where it stands.
 *
 * The host's objects are untrusted, whatever their types say. Each value
 * is read as the object's own property, so a name the object inherits is
 * no value; one that is missing where the resource needs it is refused as
 * `absent`, never made up; and one that is there is checked by health-core's
 * primitives, at the path it stands at. Paths start at `context`, the
 * object the host handed over, and walk its names, which are R4's element
 * names wherever the context mirrors an element. Nothing here is a value
 * of a person's in a path: the names are this package's and R4's.
 */
import { code, item, member, reference, Refusal, uri, type Refusals } from '@formancy/health-core'
import type { CodeableConcept, Coding, Identifier, Reference } from './resource.js'

/** Where a refusal of the host's context points. */
export const CONTEXT = 'context'

/** A code the host names, from a code system it names: one coding of a concept. */
export interface Coded {
  readonly system: string
  readonly code: string
  readonly display?: string
}

/** A reference by name, as the host gives one: `Type/id`, or the `urn:uuid:` of an entry. */
export interface ByName {
  readonly reference: string
}

/** The value `holder` holds under `name`, its own; undefined for anything that is not an object holding one. */
export function valueAt(holder: unknown, name: string): unknown {
  if (typeof holder !== 'object' || holder === null || !Object.hasOwn(holder, name)) return undefined
  return (holder as Readonly<Record<string, unknown>>)[name]
}

/**
 * A value the resource needs: `make` of it, or undefined with the refusal
 * recorded -- `absent` when there is none, whatever `make` refuses
 * otherwise.
 */
export function needed<T>(holder: unknown, name: string, path: string, refusals: Refusals, make: (value: string, at: string) => T): T | undefined {
  const value = valueAt(holder, name)
  if (value === undefined) return refusals.add('absent', path)
  return refusals.take(() => make(value as string, path))
}

/** A value the resource may have: undefined when the host gives none, `make` of it otherwise. */
export function optional<T>(holder: unknown, name: string, path: string, refusals: Refusals, make: (value: string, at: string) => T): T | undefined {
  return valueAt(holder, name) === undefined ? undefined : needed(holder, name, path, refusals, make)
}

/**
 * A text: a string with something in it but whitespace. R4 says a string
 * of whitespace "could be trimmed to nothing, which would be treated as an
 * invalid element value. Therefore strings SHOULD always contain
 * non-whitespace content" (datatypes.html, read on 17 October 2026); a
 * title or a section's heading of spaces says nothing, so it is refused
 * as `absent`, as nothing is.
 */
export function text(value: string, path: string): string {
  if (typeof value !== 'string' || !/\S/.test(value)) throw new Refusal('absent', path)
  return value
}

/** A code from one of `allowed`, R4's required binding: refused as `unmapped` when it is a code R4 does not have there. */
export function codeOf(allowed: readonly string[]) {
  return (value: string, path: string) => {
    const given = code(value, path)
    if (!allowed.includes(given)) throw new Refusal('unmapped', path)
    return given
  }
}

/** A coding, checked: its system a uri, its code a code, its display a text when given. */
function codingAt(holder: unknown, name: string, path: string, refusals: Refusals): Coding | undefined {
  const given = valueAt(holder, name)
  if (typeof given !== 'object' || given === null) return refusals.add('absent', path)
  const system = needed(given, 'system', member(path, 'system'), refusals, uri)
  const value = needed(given, 'code', member(path, 'code'), refusals, code)
  const display = optional(given, 'display', member(path, 'display'), refusals, text)
  if (system === undefined || value === undefined) return undefined
  return { system, code: value, ...(display === undefined ? {} : { display }) }
}

/** A concept the resource needs, by the one coding the host names. */
export function conceptAt(holder: unknown, name: string, path: string, refusals: Refusals): CodeableConcept | undefined {
  const coding = codingAt(holder, name, path, refusals)
  return coding === undefined ? undefined : { coding: [coding] }
}

/** Concepts the resource may have, each by one coding: undefined when the host gives none. */
export function conceptsAt(holder: unknown, name: string, path: string, refusals: Refusals): CodeableConcept[] | undefined {
  const given = valueAt(holder, name)
  if (given === undefined) return undefined
  if (!Array.isArray(given) || given.length === 0) return refusals.add('absent', path)
  const concepts = given.map((_, index) => conceptAt(given, String(index), item(path, index), refusals))
  return concepts.every((concept) => concept !== undefined) ? concepts : undefined
}

/**
 * A reference the resource needs, by name: `Type/id` of one of `types`
 * when R4 allows only those there, or a `urn:uuid:`, whose type the Bundle
 * resolves and checks.
 */
export function referenceAt(holder: unknown, name: string, path: string, refusals: Refusals, types?: readonly string[]): Reference | undefined {
  const given = valueAt(holder, name)
  if (typeof given !== 'object' || given === null) return refusals.add('absent', path)
  const checked = needed(given, 'reference', member(path, 'reference'), refusals, (value, at) => reference(value, at, types))
  return checked === undefined ? undefined : { reference: checked }
}

/** References the resource needs at least one of, each by name. */
export function referencesAt(holder: unknown, name: string, path: string, refusals: Refusals, types?: readonly string[]): Reference[] | undefined {
  const given = valueAt(holder, name)
  if (!Array.isArray(given) || given.length === 0) return refusals.add('absent', path)
  const references = given.map((_, index) => referenceAt(given, String(index), item(path, index), refusals, types))
  return references.every((found) => found !== undefined) ? references : undefined
}

/** An identifier with its system and its value, which R4's bdl-9 asks of a document's. */
export function identifierAt(holder: unknown, name: string, path: string, refusals: Refusals): Identifier | undefined {
  const given = valueAt(holder, name)
  if (typeof given !== 'object' || given === null) return refusals.add('absent', path)
  const system = needed(given, 'system', member(path, 'system'), refusals, uri)
  const value = needed(given, 'value', member(path, 'value'), refusals, text)
  return system === undefined || value === undefined ? undefined : { system, value }
}
