/**
 * The inputs the page refuses on purpose: the demo's own referral, each
 * broken in exactly one way, run through the package that refuses it, so a
 * visitor sees a refusal as the package states it without typing anything.
 * `on-purpose.test.ts` holds each to exactly its rule at its path.
 *
 * The two identifiers are made up and nobody's: each has the wrong check
 * digit, which makes it no AHV number and no GLN -- 7561234567890 and
 * 9520000000012, the validator corpus's own broken ones
 * (scripts/validator/ch-orf.mjs). The page never computes a valid one,
 * which might be a person's.
 */
import type { Refusal } from '@formancy/health-core'
import { toChOrfDocument } from '@formancy/health-ch'
import { referralContext } from '@formancy/health-corpus/documents'
import { toDocumentReference } from '@formancy/health-document'
import { toQuestionnaire } from '@formancy/health-questionnaire'
import type { FormSchema } from '@formancy/spec'
import { responseOf, type Sample } from './exports.js'
import type { OnPurpose } from './words/index.js'

/** What a package said of an input it should refuse: its refusals, or that it made something after all, or threw. */
export type Said = { readonly kind: 'refused'; readonly refusals: readonly Refusal[] } | { readonly kind: 'made' } | { readonly kind: 'failed' }

/** An input refused on purpose: which package refuses it, and what it said. */
export interface Refused {
  readonly id: OnPurpose
  readonly maker: string
  readonly said: Said
}

/** An AHV number with the wrong check digit. */
const WRONG_AHVN13 = '7561234567890'

/** A GLN with the wrong check digit. */
const WRONG_GLN = '9520000000012'

/** What `refuse()` said: a package's refusals, that it made what it was given, or that it threw, which no package does but by a bug. */
export function said(refuse: () => { readonly ok: true } | { readonly ok: false; readonly refusals: readonly Refusal[] }): Said {
  try {
    const result = refuse()
    return result.ok ? { kind: 'made' } : { kind: 'refused', refusals: result.refusals }
  } catch {
    return { kind: 'failed' }
  }
}

/**
 * Each input of the page's, broken on purpose, and what its package said
 * of it. The two documents carry the sample's response, which the build
 * has shown is made (src/build/plugin.ts): without it there is nothing to
 * break the identifiers of, and this throws rather than show a refusal of
 * the response under an identifier's heading.
 */
export function refusedOnPurpose(sample: Sample, pdf: Uint8Array): readonly Refused[] {
  const questionnaireWith = (change: Partial<FormSchema>) => said(() => toQuestionnaire({ ...sample.form, ...change }, sample.questionnaireContext))
  const response = responseOf(sample, sample.answers).resource
  if (response === undefined) throw new Error("the sample's answers make no response, and the build refuses a page whose sample does not")
  const documentWith = (change: (context: Sample['chOrfContext']) => Sample['chOrfContext']) =>
    said(() => toChOrfDocument({ ...change(sample.chOrfContext), response: { fullUrl: sample.names.response, questionnaireResponse: response } }))
  return [
    // A spec version no formancy release has written: 0.5.0's is 4.
    { id: 'version', maker: '@formancy/health-questionnaire', said: questionnaireWith({ specVersion: '5' as FormSchema['specVersion'] }) },
    // A `!=` under `&&` (0007): the unanswered case of the `!=` would need
    // an enableWhen nested in another, which SDC has not.
    { id: 'unmapped', maker: '@formancy/health-questionnaire', said: questionnaireWith({ logic: { rules: [{ target: 'interpreter_language', kind: 'visible', cel: "interpreter == true && language != 'de'" }] } }) },
    { id: 'ahv', maker: '@formancy/health-ch', said: documentWith((context) => ({ ...context, patient: { ...context.patient, ahvn13: WRONG_AHVN13 } })) },
    { id: 'gln', maker: '@formancy/health-ch', said: documentWith((context) => ({ ...context, author: { ...context.author, practitioner: { ...context.author.practitioner, gln: WRONG_GLN } } })) },
    { id: 'unproved', maker: '@formancy/health-document', said: said(() => toDocumentReference({ bytes: pdf, profile: 'PDF/A-2b' }, referralContext('data'))) },
  ]
}
