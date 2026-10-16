/**
 * FHIR JSON as values, and what the reader and the writer both hold of it.
 *
 * R4's JSON representation is RFC 8259's JSON with rules of its own
 * (https://hl7.org/fhir/R4/json.html, read on 17 October 2026): "Property
 * names SHALL be unique", "Objects are never empty", "String property values
 * can never be empty", and "JSON objects and arrays are never empty, and
 * properties never have null values" except for the nulls that line a
 * repeating primitive's extensions up with its values. readJson and
 * writeJson each refuse what breaks them, and exactness.test.ts holds the
 * two to the same rules.
 */
import type { FhirNumber } from './numbers.js'

/**
 * A FHIR JSON value. A number is a FhirNumber, made from its text, never a
 * JavaScript number; a string is any string, a checked one included.
 */
export type FhirJson = string | boolean | null | FhirNumber | readonly FhirJson[] | FhirJsonObject

/** A FHIR JSON object: a resource, a datatype, an extension. */
export interface FhirJsonObject {
  readonly [name: string]: FhirJson
}

/** Where a path starts: the value handed to the writer, or the reader's whole text. */
export const ROOT = '$'

const PLAIN_NAME = /^[A-Za-z_$][A-Za-z0-9_$]*$/

/**
 * The path of `name` in the object at `path`. A FHIR element's name is
 * written after a dot; any other name, quoted, in brackets.
 */
export function member(path: string, name: string): string {
  return PLAIN_NAME.test(name) ? `${path}.${name}` : `${path}[${JSON.stringify(name)}]`
}

/** The path of the item at `index` of the array at `path`. */
export function item(path: string, index: number): string {
  return `${path}[${String(index)}]`
}

/**
 * Whether JavaScript would move `name` to the front of an object: an
 * object lists the names that are whole numbers first, in numeric order,
 * whatever order they were given in. Every such name up to 2^32 - 2 is
 * moved; those past it are refused all the same, since FHIR names none.
 */
export function isIndexName(name: string): boolean {
  return /^(?:0|[1-9][0-9]*)$/.test(name)
}
