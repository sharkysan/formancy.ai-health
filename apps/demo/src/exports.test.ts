// @vitest-environment node
import * as core from '@formancy/health-core'
import * as ch from '@formancy/health-ch'
import * as documents from '@formancy/health-corpus'
import * as questionnaire from '@formancy/health-questionnaire'
import { describe, expect, test } from 'vitest'
import { corpus } from '../../../scripts/validator/corpus.mjs'
import { letterOf, sampleOf, sampleProblems, type CorpusEntry } from './build/plugin.js'
import { answeredOf, attempt, byFile, FILES, firstOf, questionnaireOf } from './exports.js'

/**
 * What the page makes of the demo's referral, made as the page makes it
 * (src/exports.ts), in Node, from the sample and the letter the build hands
 * the page, and held to the validator gate's corpus as the packages build
 * it. It reads the packages and scripts/validator/corpus.mjs as built, so
 * it needs `pnpm build`, as the corpus's own guards do.
 */
const sample = sampleOf()
const pdf = await letterOf()
const entries = corpus({ core, questionnaire, documents, pdf, ch }) as readonly CorpusEntry[]

describe("the page's first resources", () => {
  // The page says that what it shows before anything is changed is what the
  // validator gate judged. A context the page made otherwise than the
  // corpus -- the response's profile left out, an instant moved -- would
  // make that a claim about other bytes than the ones shown.
  test("are the validator corpus's accepted entries of their names, byte for byte", () => {
    const first = byFile(firstOf(sample, pdf))
    expect([...first.keys()]).toEqual([FILES.questionnaire, FILES.response, FILES.document, FILES.letter.data, FILES.letter.binary])
    expect(sampleProblems(first, entries)).toEqual([])
  })
})

describe('what the answers make', () => {
  // A changed answer is the point of the page: it must reach the response
  // and the document that carries it, or the resources beside the form
  // would stay the sample's whatever was typed.
  test('a changed answer remakes the response and the CH ORF document', () => {
    const first = firstOf(sample, pdf).answered
    const changed = answeredOf(sample, { ...sample.answers, question: 'Eine andere synthetische Fragestellung' })
    expect(changed.response.kind).toBe('made')
    expect(changed.document?.kind).toBe('made')
    expect(changed.response).not.toEqual(first.response)
    expect(changed.document).not.toEqual(first.document)
  })

  // The refusal a visitor can make by hand: a CH ORF document of a refused
  // response would carry answers health-questionnaire said it cannot write.
  test('a required answer cleared refuses the response for it, and no document is made', () => {
    const cleared = answeredOf(sample, { ...sample.answers, question: '' })
    expect(cleared.response.kind === 'refused' ? cleared.response.refusals.map(({ rule, path }) => `${rule} at ${path}`) : cleared.response).toEqual(['required at answers.question'])
    expect(cleared.document).toBeUndefined()
    expect(byFile({ ...firstOf(sample, pdf), answered: cleared }).has(FILES.document)).toBe(false)
  })

  // The Questionnaire does not depend on the answers, and the page makes
  // it once: made otherwise each time, it would not be the corpus's entry.
  test('the Questionnaire is the same bytes each time it is made', () => {
    expect(questionnaireOf(sample)).toEqual(questionnaireOf(sample))
  })
})

describe('a package that throws', () => {
  // A throw is a package's bug, and half a resource shown as made would
  // be a resource nobody wrote; so would one writeJson refuses, such as a
  // number made outside health-core.
  test('is said to have failed, and nothing it made is shown', () => {
    const thrown = attempt(() => {
      throw new Error('a bug')
    }, () => ({}))
    expect(thrown).toEqual({ outcome: { kind: 'failed' } })
    const unwritable = attempt(() => ({ ok: true as const, resource: { resourceType: 'Basic', value: 0.1 } }), ({ resource }) => resource)
    expect(unwritable).toEqual({ outcome: { kind: 'failed' } })
  })
})
