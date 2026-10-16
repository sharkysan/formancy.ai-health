import { describe, expect, expectTypeOf, test } from 'vitest'
import { FHIR_VERSION } from './version.js'

describe('FHIR_VERSION', () => {
  // A CapabilityStatement, a StructureDefinition and an implementation guide
  // state their release as a code of R4's FHIRVersion code system, where R4
  // is 4.0.1. 'R4' and '4.0' are not codes there, and '4.0.0' is the release
  // before the technical correction: a version written as any of them names
  // a release no R4 guide was built on, or no release at all.
  test('is 4.0.1, the R4 technical correction, written as its FHIRVersion code', () => {
    expect(FHIR_VERSION).toBe('4.0.1')
  })

  // A host compares this with the version a receiver states, and switches
  // on it. Declared as `string`, such a comparison compiles against any
  // value, and a change of release reaches no host's type-check. A bare
  // `const` is not enough: its literal widens to `string` at the host's
  // first `let` or generic call, which is how this case first failed. tsc
  // holds it, through `pnpm typecheck`: expectTypeOf does nothing at run
  // time.
  test('is declared as that literal, not as a string', () => {
    expectTypeOf(FHIR_VERSION).toEqualTypeOf<'4.0.1'>()
  })
})
