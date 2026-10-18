// @vitest-environment node
import { describe, expect, test } from 'vitest'
import { letterOf, sampleOf } from './build/plugin.js'
import { refusedOnPurpose, said } from './on-purpose.js'

/**
 * The inputs the page refuses on purpose, each held to exactly the
 * refusal the page says it shows: its rule, at its path, and nothing else.
 * Run against the packages as built, with the sample and the letter the
 * build hands the page.
 */
const sample = sampleOf()
const pdf = await letterOf()
const refused = refusedOnPurpose(sample, pdf)

/** Each input's refusals, as `rule at path`. */
const stated = Object.fromEntries(refused.map(({ id, said: what }) => [id, what.kind === 'refused' ? what.refusals.map(({ rule, path }) => `${rule} at ${path}`) : [what.kind]]))

describe('the inputs refused on purpose', () => {
  // A heading that names one refusal over a package's other one -- or over
  // a resource the package made after all, a GLN's check digit put right --
  // would show a visitor a refusal that is not the one described.
  test('are each refused for exactly their one rule, at their path', () => {
    expect(stated).toEqual({
      version: ['version at form.specVersion'],
      unmapped: ['unmapped at form.logic.rules[0].cel'],
      ahv: ['check-digit at context.patient.ahvn13'],
      gln: ['check-digit at context.author.practitioner.gln'],
      unproved: ['unproved at pdf.profile'],
    })
  })

  // A refusal names a path and never a value: an identifier is a person's
  // or a practice's, and the page shows every message as it stands.
  test('say no digit of the identifiers they refuse', () => {
    const messages = refused.flatMap(({ said: what }) => (what.kind === 'refused' ? what.refusals.map((refusal) => refusal.message) : []))
    expect(messages.filter((message) => /\d{6}/.test(message))).toEqual([])
  })

  // Who refuses each is said beside it: a package named for another's
  // refusal would send a reader to the wrong record.
  test('are each said to be refused by the package that refused them', () => {
    expect(Object.fromEntries(refused.map(({ id, maker }) => [id, maker]))).toEqual({
      version: '@formancy/health-questionnaire',
      unmapped: '@formancy/health-questionnaire',
      ahv: '@formancy/health-ch',
      gln: '@formancy/health-ch',
      unproved: '@formancy/health-document',
    })
  })

  // The identifiers are broken in the sample's own document, which carries
  // the sample's response: without one, a refusal of the response would
  // stand under an identifier's heading, so the page stops instead.
  test("need the sample's response, and stop without one", () => {
    expect(() => refusedOnPurpose({ ...sample, answers: { ...sample.answers, question: '' } }, pdf)).toThrow(/make no response/)
  })
})

describe('what a package said', () => {
  // A throw is a package's bug, said as such, and what it made of an input
  // it should refuse is said as made: neither is shown as a refusal.
  test('is its refusals, that it made something, or that it threw', () => {
    expect(said(() => ({ ok: true }))).toEqual({ kind: 'made' })
    expect(said(() => ({ ok: false, refusals: [] }))).toEqual({ kind: 'refused', refusals: [] })
    expect(
      said(() => {
        throw new Error('a bug')
      }),
    ).toEqual({ kind: 'failed' })
  })
})
