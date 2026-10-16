/*
 * A consumer that knows nothing about the workspace.
 *
 * Copied into a temporary npm project by install-test.mjs, installed from the
 * packed tarballs, type-checked with skipLibCheck OFF and run under Node. What
 * is on trial is that the published entry points resolve, with the types that
 * shipped.
 */
import {
  FHIR_VERSION,
  Refusal,
  dateTime,
  decimal,
  integer,
  readJson,
  writeJson,
  type FhirDecimal,
  type FhirInteger,
  type FhirJson,
} from '@formancy/health-core'

// The published code carries the FHIR version the package emits, and its
// declaration says exactly which: a dist that lost the constant fails the
// run, and a declaration that widened it to `string` fails the type-check,
// here rather than in a host that switches on it. Held in a `let` first:
// a declaration emitted as `= "4.0.1"` rather than `: "4.0.1"` is a literal
// that widens to `string` there, and assigned straight to the literal type
// it would pass.
let held = FHIR_VERSION
const version: '4.0.1' = held
if (version !== '4.0.1') throw new Error(`FHIR_VERSION is ${String(version)}, not 4.0.1`)

// A host builds a resource from exact values and gets their digits back,
// the trailing zero included, through the published writer and reader. A
// dist that wrote a decimal through a double prints 70.5 here, and one
// whose reader lost a digit fails the round trip.
const weight: FhirDecimal = decimal('70.50', 'Observation.valueQuantity.value')
const observation: FhirJson = {
  resourceType: 'Observation',
  status: 'final',
  effectiveDateTime: dateTime('2026-10-17T10:00:00+02:00', 'Observation.effectiveDateTime'),
  valueQuantity: { value: weight, unit: 'kg' },
}
const written = writeJson(observation)
const expected = '{"resourceType":"Observation","status":"final","effectiveDateTime":"2026-10-17T10:00:00+02:00","valueQuantity":{"value":70.50,"unit":"kg"}}'
if (written !== expected) throw new Error(`writeJson wrote ${written}`)
if (writeJson(readJson(written)) !== written) throw new Error('readJson and writeJson did not round-trip the observation')

// A refusal is a class a host can catch and branch on by its rule, from
// outside the package: a dist that threw a plain Error, or lost the rule
// or the path, fails here.
try {
  integer('2147483648', 'Observation.valueInteger')
  throw new Error('integer() accepted a value past 32 bits')
} catch (error) {
  if (!(error instanceof Refusal) || error.rule !== 'range' || error.path !== 'Observation.valueInteger') throw error
}

// The declarations hold a host to exact values: a JavaScript number is not
// FHIR JSON, and an integer is not a decimal. Each directive fails tsc if
// the line after it compiles, so a declaration that loosened either would
// be found here. Never called: the types are what is on trial.
export function refusedByTheTypes(): void {
  // @ts-expect-error a JavaScript number is not a FHIR JSON value
  writeJson({ valueQuantity: { value: 70.5 } })
  const count: FhirInteger = integer('7', 'Observation.valueInteger')
  // @ts-expect-error an integer was checked as an integer, not as a decimal
  const asDecimal: FhirDecimal = count
  void asDecimal
}

console.log(`ok: @formancy/health-core emits FHIR ${FHIR_VERSION}, and wrote ${written}`)
