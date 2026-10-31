/**
 * Synthetic forms, and the two answers an export gives, for the tests.
 * Everything here is made up: no person, no real code, no real form.
 */
import type { FieldDef, FormSchema, LogicRule } from '@formancy/spec'
import type { QuestionnaireContext } from './context.js'
import { toQuestionnaire } from './questionnaire.js'
import type { Questionnaire, QuestionnaireItem } from './resource.js'
import type { ResponseContext } from './response-context.js'
import type { QuestionnaireResponse } from './response-resource.js'
import { toQuestionnaireResponse } from './response.js'

/** A host's context: a base under a domain that never resolves (RFC 6761), a published version. */
export const HOST: QuestionnaireContext = { base: 'https://forms.synthetic.invalid', version: '3', status: 'active' }

/** The url a form with the id `intake` is exported under with `HOST`. */
export const URL = 'https://forms.synthetic.invalid/Questionnaire/intake'

/** A spec 4 form with these fields, and anything else `more` gives. */
export function form(fields: FieldDef[], more: Partial<FormSchema> = {}): FormSchema {
  return { specVersion: '4', id: 'intake', title: 'Intake', model: { fields }, ...more }
}

/** A form with these fields and these rules. */
export function ruled(fields: FieldDef[], rules: LogicRule[]): FormSchema {
  return form(fields, { logic: { rules } })
}

/** The Questionnaire of `schema`; fails, listing them, when it is refused. */
export function exported(schema: unknown, context: QuestionnaireContext = HOST): Questionnaire {
  const result = toQuestionnaire(schema as FormSchema, context)
  if (!result.ok) throw new Error(`refused: ${result.refusals.map((refusal) => refusal.message).join('; ')}`)
  return result.questionnaire
}

/** Each refusal of `schema`, as `rule path` and `(language)` where it names one; fails when it is exported. */
export function refused(schema: unknown, context: QuestionnaireContext = HOST): string[] {
  const result = toQuestionnaire(schema as FormSchema, context)
  if (result.ok) throw new Error('expected the export to be refused, and it was exported')
  return result.refusals.map((refusal) => `${refusal.rule} ${refusal.path}${refusal.language === undefined ? '' : ` (${refusal.language})`}`)
}

/** The item of a form whose one field is `field`: a form of one field that is exported has one item. */
export function onlyItem(field: FieldDef, context: QuestionnaireContext = HOST): QuestionnaireItem {
  const [only] = exported(form([field]), context).item as readonly QuestionnaireItem[]
  return only as QuestionnaireItem
}

/** A host's context for answers: the intake as HOST exports it, completed, of a synthetic patient. */
export const RESPONDING: ResponseContext = {
  questionnaire: HOST,
  status: 'completed',
  authored: '2026-10-17T10:00:00+02:00',
  subject: { reference: 'Patient/synthetic-1' },
}

/** The QuestionnaireResponse of `answers` to `schema`; fails, listing them, when it is refused. */
export function answered(schema: unknown, answers: unknown, context: ResponseContext = RESPONDING): QuestionnaireResponse {
  const result = toQuestionnaireResponse(schema as FormSchema, answers, context)
  if (!result.ok) throw new Error(`refused: ${result.refusals.map((refusal) => refusal.message).join('; ')}`)
  return result.questionnaireResponse
}

/** Each refusal of `answers` to `schema`, as `rule path`; fails when they are exported. */
export function refusedAnswers(schema: unknown, answers: unknown, context: ResponseContext = RESPONDING): string[] {
  const result = toQuestionnaireResponse(schema as FormSchema, answers, context)
  if (result.ok) throw new Error('expected the answers to be refused, and they were exported')
  return result.refusals.map((refusal) => `${refusal.rule} ${refusal.path}`)
}
