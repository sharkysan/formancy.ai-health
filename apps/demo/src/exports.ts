/**
 * What the packages make of the demo's referral, in the page: the one
 * place the page calls them, pure, and run the same way by the build, which
 * holds what it makes of the sample to the validator gate's corpus, byte
 * for byte (src/build/plugin.ts).
 *
 * Every resource is written by health-core's `writeJson` and nothing else:
 * a FhirNumber keeps its digits behind a getter, which `JSON.stringify`
 * would not write. A package refuses with `{ ok: false, refusals }` and
 * never throws; a throw is a package's bug, and the page says nothing was
 * made rather than show half of anything.
 */
import { writeJson, type FhirJson, type Refusal } from '@formancy/health-core'
import { PROFILES, toChOrfDocument, type ChOrfContext } from '@formancy/health-ch'
import { referralDocument, type Placement } from '@formancy/health-corpus/documents'
import {
  toQuestionnaire,
  toQuestionnaireResponse,
  type QuestionnaireContext,
  type QuestionnaireResponse,
  type ResponseContext,
} from '@formancy/health-questionnaire'
import type { FormSchema } from '@formancy/spec'

/**
 * The demo's referral, as scripts/validator/demo-referral.mjs holds it and
 * the build hands it to the page: the form, its answers, and what the
 * synthetic host says of them.
 */
export interface Sample {
  readonly form: FormSchema
  readonly questionnaireContext: QuestionnaireContext
  /** Without the profile the response claims, which is health-ch's constant and added here. */
  readonly responseContext: ResponseContext
  /** Without the response, which the answers make. */
  readonly chOrfContext: Omit<ChOrfContext, 'response'>
  /** As formancy's engine holds them. */
  readonly answers: Readonly<Record<string, unknown>>
  /** The response's name in the CH ORF document. */
  readonly names: { readonly response: string }
}

/** What a package made of an input. */
export type Outcome =
  | { readonly kind: 'made'; readonly json: string }
  | { readonly kind: 'refused'; readonly refusals: readonly Refusal[] }
  /** It threw, which no package does but by a bug. */
  | { readonly kind: 'failed' }

/** The file each resource is downloaded as, which is its name in the validator gate's corpus. */
export const FILES = {
  questionnaire: 'questionnaire-demo-referral.json',
  response: 'questionnaireresponse-demo-referral.json',
  document: 'bundle-ch-orf-demo-referral.json',
  letter: { data: 'bundle-document-pdf-as-data.json', binary: 'bundle-document-pdf-in-binary.json' },
} as const

/** The letter's PDF, as it is downloaded. */
export const PDF_FILE = 'referral-letter.pdf'

/** What a package returns: what it made, or its refusals. */
type Export<Made> = ({ readonly ok: true } & Made) | { readonly ok: false; readonly refusals: readonly Refusal[] }

/**
 * `make()`'s result as an outcome -- its resource, as `resource` picks it,
 * written as FHIR JSON, or its refusals -- and the resource itself, for a
 * document that carries it; failed when anything throws.
 */
export function attempt<Made, Resource extends object>(
  make: () => Export<Made>,
  resource: (made: Made) => Resource,
): { readonly outcome: Outcome; readonly resource?: Resource } {
  try {
    const result = make()
    if (!result.ok) return { outcome: { kind: 'refused', refusals: result.refusals } }
    const made = resource(result)
    // The packages' resource types are FHIR JSON by construction; writeJson
    // checks every value of them, and refuses -- here, fails -- what is not.
    return { outcome: { kind: 'made', json: writeJson(made as FhirJson) }, resource: made }
  } catch {
    return { outcome: { kind: 'failed' } }
  }
}

/** The Questionnaire health-questionnaire makes of the form. It does not depend on the answers. */
export function questionnaireOf(sample: Sample): Outcome {
  return attempt(
    () => toQuestionnaire(sample.form, sample.questionnaireContext),
    ({ questionnaire }) => questionnaire,
  ).outcome
}

/** The QuestionnaireResponse health-questionnaire makes of `answers`, claiming CH ORF's response profile, as the CH ORF document carries it. */
export function responseOf(sample: Sample, answers: unknown): { readonly outcome: Outcome; readonly resource?: QuestionnaireResponse } {
  const context = { ...sample.responseContext, profiles: [PROFILES.questionnaireResponse] }
  return attempt(
    () => toQuestionnaireResponse(sample.form, answers, context),
    ({ questionnaireResponse }) => questionnaireResponse,
  )
}

/** The CH ORF document health-ch makes of the referral `context` says, carrying `response` under the response's name. */
export function documentOf(sample: Sample, response: QuestionnaireResponse, context: Sample['chOrfContext'] = sample.chOrfContext): Outcome {
  return attempt(
    () => toChOrfDocument({ ...context, response: { fullUrl: sample.names.response, questionnaireResponse: response } }),
    ({ bundle }) => bundle,
  ).outcome
}

/** What the answers make: the response, and the CH ORF document that carries it, which is not made when the response is not. */
export interface Answered {
  readonly response: Outcome
  readonly document: Outcome | undefined
}

export function answeredOf(sample: Sample, answers: unknown): Answered {
  const response = responseOf(sample, answers)
  return { response: response.outcome, document: response.resource === undefined ? undefined : documentOf(sample, response.resource) }
}

/** The letter's document Bundle, as health-corpus's documents make it with health-document, its PDF where `placement` puts it. */
export function letterOf(pdf: Uint8Array, placement: Placement): Outcome {
  return attempt(
    () => referralDocument({ pdf, placement }),
    ({ bundle }) => bundle,
  ).outcome
}

/** What the page shows before anything is changed: the Questionnaire, what the sample's answers make, and the letter's two documents. */
export interface First {
  readonly questionnaire: Outcome
  readonly answered: Answered
  readonly letter: Readonly<Record<Placement, Outcome>>
}

export function firstOf(sample: Sample, pdf: Uint8Array): First {
  return {
    questionnaire: questionnaireOf(sample),
    answered: answeredOf(sample, sample.answers),
    letter: { data: letterOf(pdf, 'data'), binary: letterOf(pdf, 'binary') },
  }
}

/**
 * `first` by the file each resource is downloaded as: what the build holds
 * to the corpus's entries of the same names. A document not made is not
 * there.
 */
export function byFile(first: First): ReadonlyMap<string, Outcome> {
  const made: readonly (readonly [string, Outcome | undefined])[] = [
    [FILES.questionnaire, first.questionnaire],
    [FILES.response, first.answered.response],
    [FILES.document, first.answered.document],
    [FILES.letter.data, first.letter.data],
    [FILES.letter.binary, first.letter.binary],
  ]
  return new Map(made.flatMap(([file, outcome]) => (outcome === undefined ? [] : [[file, outcome] as const])))
}
