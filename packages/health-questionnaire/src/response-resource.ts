/**
 * The QuestionnaireResponse this package writes, typed with health-core's
 * primitives, as resource.ts types the Questionnaire (0004: resources are
 * typed by the packages that build them).
 *
 * Only what the export writes is here, in the order R4 lists it, which is
 * the order it is written in (https://hl7.org/fhir/R4/questionnaireresponse.html,
 * read on 17 October 2026). An item has no `text`: the Questionnaire's
 * item says it, in every language asked for, and a copy here in one of
 * them could disagree with it -- the validator refuses one that does.
 */
import type { FhirCode, FhirDate, FhirDateTime, FhirDecimal, FhirInteger, FhirReference, FhirTime, FhirUri } from '@formancy/health-core'

/** A choice's answer: the coding of the Questionnaire's option, its system, code and display, without the display's translations. */
export type ResponseCoding = {
  readonly system: FhirUri
  readonly code: FhirCode
  readonly display?: string
}

/** One answer, of the type its item has. */
export type QuestionnaireResponseAnswer = {
  readonly valueBoolean?: boolean
  readonly valueDecimal?: FhirDecimal
  readonly valueInteger?: FhirInteger
  readonly valueDate?: FhirDate
  readonly valueDateTime?: FhirDateTime
  readonly valueTime?: FhirTime
  readonly valueString?: string
  readonly valueCoding?: ResponseCoding
}

/** A question's answers, or a group's items: never both, never neither. */
export type QuestionnaireResponseItem = {
  readonly linkId: string
  readonly answer?: readonly QuestionnaireResponseAnswer[]
  readonly item?: readonly QuestionnaireResponseItem[]
}

/** A reference by name, as the host supplies it (health-core's `reference`). */
export type Reference = {
  readonly reference: FhirReference
}

export type QuestionnaireResponse = {
  readonly resourceType: 'QuestionnaireResponse'
  readonly meta?: { readonly profile: readonly string[] }
  readonly questionnaire: FhirUri
  readonly status: FhirCode
  readonly subject?: Reference
  readonly authored: FhirDateTime
  readonly author?: Reference
  readonly source?: Reference
  readonly item?: readonly QuestionnaireResponseItem[]
}

/**
 * The profile a response claims where it validates against it: with a
 * subject, whose absence SDC's sdcqr-1 warns of, and to a versioned
 * Questionnaire, since SDC's questionnaire "SHALL be the version-specific
 * URL of the form". The gate holds the claim on the responses the corpus
 * has this package write.
 */
export const SDC_QUESTIONNAIRE_RESPONSE = 'http://hl7.org/fhir/uv/sdc/StructureDefinition/sdc-questionnaireresponse|4.0.0'
