import { createFormEngine } from '@formancy/core'
import { describe, expect, test } from 'vitest'
import { sampleOf } from './build/plugin.js'
import { engineFor, FIXED_CAPABILITIES } from './engine.js'
import { LANGUAGES } from './words/index.js'

/**
 * formancy 0.5.0's engine over the demo's form, as the page builds it: what
 * it needs to start, and what it holds of the sample. The corpus's response
 * is made of the sample's answers as written in demo-referral.mjs; the page
 * makes its own of what the engine holds of them, so the two must be one.
 */
const sample = sampleOf()

describe("the demo's engine", () => {
  // createFormEngine refuses a form with logic rules and no capability
  // source; without the page's fixed one, the demo's one rule stops the
  // page before it draws anything.
  test('starts only with a capability source, which the page gives it fixed', () => {
    expect(() => createFormEngine({ schema: sample.form, locale: 'en', initialValue: sample.answers })).toThrow(/capabilities/)
    expect(() => engineFor(sample.form, 'en', sample.answers)).not.toThrow()
    expect([FIXED_CAPABILITIES.now(), FIXED_CAPABILITIES.today(), FIXED_CAPABILITIES.random()]).toEqual([1_792_224_000_000, '2026-10-17', 0])
  })

  // Measured with formancy 0.5.0 on 17 October 2026: the engine hands back
  // the sample's answers unchanged in every language. An engine that
  // normalised one -- a date, the hidden field -- would make the page's
  // first response other bytes than the corpus's.
  test("holds the sample's answers as written, in every language", () => {
    for (const language of LANGUAGES) expect(engineFor(sample.form, language, sample.answers).value()).toStrictEqual(sample.answers)
  })

  // The one rule: the interpreter's language shows while the box is
  // ticked, and its answer goes when the field does, so a response never
  // answers a question its own answers disable.
  test('drops the language to interpret when no interpreter is needed', () => {
    const engine = engineFor(sample.form, 'en', sample.answers)
    engine.setValue(['interpreter'], false)
    expect(engine.value()).not.toHaveProperty('interpreter_language')
  })
})
