/**
 * The Questionnaire this package writes, typed with health-core's
 * primitives (0004: resources are typed by the packages that build them).
 *
 * Only what the mapping writes is here: an element this package never
 * writes is not typed, so a type here is a claim that something writes it.
 * Every number is a FhirNumber, so `writeJson` writes the resource as it
 * stands and `JSON.stringify` cannot. The names are R4's
 * (https://hl7.org/fhir/R4/questionnaire.html, read on 17 October 2026),
 * in the order R4 lists them, which is the order they are written in.
 */
import type { FhirCode, FhirDate, FhirDateTime, FhirDecimal, FhirInteger, FhirTime, FhirUri } from '@formancy/health-core'

/** An extension as this package writes them: a value, or the parts of a translation. */
export type Extension = {
  readonly url: string
  readonly extension?: readonly Extension[]
  readonly valueBoolean?: boolean
  readonly valueCode?: FhirCode
  readonly valueCoding?: Coding
  readonly valueDate?: FhirDate
  readonly valueDateTime?: FhirDateTime
  readonly valueDecimal?: FhirDecimal
  readonly valueInteger?: FhirInteger
  readonly valueString?: string
  readonly valueTime?: FhirTime
}

/** What a primitive carries beside its value: here, only its translations. */
export type PrimitiveElement = {
  readonly extension: readonly Extension[]
}

export type Coding = {
  readonly system: FhirUri
  readonly code: FhirCode
  readonly display?: string
  readonly _display?: PrimitiveElement
}

/** One condition of `enableWhen`, with the answer of the type its question has. */
export type EnableWhen = {
  readonly question: string
  readonly operator: FhirCode
  readonly answerBoolean?: boolean
  readonly answerDecimal?: FhirDecimal
  readonly answerInteger?: FhirInteger
  readonly answerDate?: FhirDate
  readonly answerDateTime?: FhirDateTime
  readonly answerTime?: FhirTime
  readonly answerString?: string
  readonly answerCoding?: Coding
}

export type AnswerOption = {
  readonly valueCoding: Coding
}

export type QuestionnaireItem = {
  readonly extension?: readonly Extension[]
  readonly linkId: string
  readonly text?: string
  readonly _text?: PrimitiveElement
  readonly type: FhirCode
  readonly enableWhen?: readonly EnableWhen[]
  readonly enableBehavior?: FhirCode
  readonly required?: boolean
  readonly repeats?: boolean
  readonly readOnly?: boolean
  readonly maxLength?: FhirInteger
  readonly answerOption?: readonly AnswerOption[]
  readonly item?: readonly QuestionnaireItem[]
}

export type Questionnaire = {
  readonly resourceType: 'Questionnaire'
  readonly meta: { readonly profile: readonly string[] }
  readonly language?: FhirCode
  readonly extension?: readonly Extension[]
  readonly url: FhirUri
  readonly version?: string
  readonly title: string
  readonly status: FhirCode
  readonly item?: readonly QuestionnaireItem[]
}

/**
 * The profile every Questionnaire here claims, with the version of SDC the
 * validator gate judges it against (docs/release/ig-packages.json): a
 * claim names the guide and its version (0005). The gate holds the claim
 * on every Questionnaire the corpus has this package write.
 */
export const SDC_QUESTIONNAIRE = 'http://hl7.org/fhir/uv/sdc/StructureDefinition/sdc-questionnaire|4.0.0'

/** The R4 core extensions the mapping writes, by their canonical. Never fetched. */
export const EXTENSION = {
  hidden: 'http://hl7.org/fhir/StructureDefinition/questionnaire-hidden',
  maxOccurs: 'http://hl7.org/fhir/StructureDefinition/questionnaire-maxOccurs',
  maxValue: 'http://hl7.org/fhir/StructureDefinition/maxValue',
  minLength: 'http://hl7.org/fhir/StructureDefinition/minLength',
  minOccurs: 'http://hl7.org/fhir/StructureDefinition/questionnaire-minOccurs',
  minValue: 'http://hl7.org/fhir/StructureDefinition/minValue',
  translation: 'http://hl7.org/fhir/StructureDefinition/translation',
  versionAlgorithm: 'http://hl7.org/fhir/StructureDefinition/artifact-versionAlgorithm',
} as const

/** The code system of `versionAlgorithm`'s codes. */
export const VERSION_ALGORITHM = 'http://hl7.org/fhir/version-algorithm'
