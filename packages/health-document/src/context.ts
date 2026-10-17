/**
 * Reading what the host says of a document: its codes, its references and
 * its identifiers, each checked where it stands.
 *
 * The host's objects are untrusted, whatever their types say. Each value
 * is read with health-core's readers -- its own property, `absent` where
 * it is missing, never made up; an object for the members it names, one
 * more refused as `unmapped`; a list at every index, a hole's too -- and
 * checked by health-core's primitives, at the path it stands at; what is
 * read here is the datatypes this package writes of them. Paths start at `context`, the
 * object the host handed over, and walk its names, which are R4's element
 * names wherever the context mirrors an element. Nothing here is a value
 * of a person's in a path: the names are this package's and R4's.
 */
import { code, known, member, needed, optional, readItems, reference, text, uri, valueAt, type Refusals } from '@formancy/health-core'
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

/** A coding, checked: its system a uri, its code a code, its display a text when given, and nothing else. */
function codingAt(holder: unknown, name: string, path: string, refusals: Refusals): Coding | undefined {
  const given = valueAt(holder, name)
  if (!known(given, ['system', 'code', 'display'], path, refusals)) return undefined
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
  const concepts = readItems(given, path, (index, at) => conceptAt(given, index, at, refusals))
  return concepts.every((concept) => concept !== undefined) ? concepts : undefined
}

/**
 * A reference the resource needs, by name: `Type/id` of one of `types`
 * when R4 allows only those there, or a `urn:uuid:`, whose type the Bundle
 * resolves and checks.
 */
export function referenceAt(holder: unknown, name: string, path: string, refusals: Refusals, types?: readonly string[]): Reference | undefined {
  const given = valueAt(holder, name)
  if (!known(given, ['reference'], path, refusals)) return undefined
  const checked = needed(given, 'reference', member(path, 'reference'), refusals, (value, at) => reference(value, at, types))
  return checked === undefined ? undefined : { reference: checked }
}

/** References the resource needs at least one of, each by name. */
export function referencesAt(holder: unknown, name: string, path: string, refusals: Refusals, types?: readonly string[]): Reference[] | undefined {
  const given = valueAt(holder, name)
  if (!Array.isArray(given) || given.length === 0) return refusals.add('absent', path)
  const references = readItems(given, path, (index, at) => referenceAt(given, index, at, refusals, types))
  return references.every((found) => found !== undefined) ? references : undefined
}

/** An identifier with its system and its value, which R4's bdl-9 asks of a document's. */
export function identifierAt(holder: unknown, name: string, path: string, refusals: Refusals): Identifier | undefined {
  const given = valueAt(holder, name)
  if (!known(given, ['system', 'value'], path, refusals)) return undefined
  const system = needed(given, 'system', member(path, 'system'), refusals, uri)
  const value = needed(given, 'value', member(path, 'value'), refusals, text)
  return system === undefined || value === undefined ? undefined : { system, value }
}
