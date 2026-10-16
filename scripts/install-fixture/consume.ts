/*
 * A consumer that knows nothing about the workspace.
 *
 * Copied into a temporary npm project by install-test.mjs, installed from the
 * packed tarballs, type-checked with skipLibCheck OFF and run under Node. What
 * is on trial is that the published entry points resolve, with the types that
 * shipped.
 */
import { FHIR_VERSION } from '@formancy/health-core'

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

console.log(`ok: @formancy/health-core emits FHIR ${FHIR_VERSION}`)
