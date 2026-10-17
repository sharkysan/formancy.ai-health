/**
 * A form's rules, as what they change on its items, or refused.
 *
 * - `visible`: the target's `enableWhen`, where its CEL is a simple
 *   comparison enableWhen says exactly (conditions.ts); any other is
 *   refused, since SDC's `enableWhenExpression` is FHIRPath, and no
 *   FHIRPath is written here.
 * - `skip`: the page's `enableWhen`, negated, under the same condition.
 * - `computed`: the target is `readOnly`. Its expression is never written
 *   as an SDC `calculatedExpression`: translating formancy's CEL into
 *   FHIRPath is not this package's, and a calculated item is where clinical
 *   logic would start (plan 15.2). The value formancy computed travels as
 *   the captured answer. On a field a visible rule can hide it is
 *   refused: formancy computes it there while it is hidden, and keeps
 *   the value, which R4 gives no disabled item (0007).
 * - `disabled` and `required`, which hold while an expression does, and
 *   `validate` and `check`, which judge an answer: refused. SDC states each
 *   only in FHIRPath, or not at all.
 *
 * A rule on a field inside a repeater runs once per row, with the row in
 * scope; the Questionnaire has no such scope, so a visibility rule there
 * is refused, and a computed one is still read-only.
 */
import type { FieldDef, FormSchema } from '@formancy/spec'
import { readCondition } from './cel.js'
import { enablingOf, type ConditionScope, type Enabling } from './conditions.js'
import type { Place, Places } from './places.js'
import { FORM, item, member, type Refusals } from './refusals.js'

export interface RuleEffects {
  /** What enables each item a visible or skip rule targets. */
  readonly enabling: ReadonlyMap<FieldDef, Enabling>
  /** The items a computed rule fills. */
  readonly readOnly: ReadonlySet<FieldDef>
  /** The fields a rule can hide: each a visible rule targets, and each on a page a skip rule walks past. */
  readonly hideable: (place: Place) => boolean
}

/** What every rule of `form` changes, with each it cannot say in `refusals`. */
export function ruleEffects(form: FormSchema, places: Places, url: string, refusals: Refusals): RuleEffects {
  const rules = form.logic?.rules ?? []
  const skipped = new Set(rules.filter((rule) => rule.kind === 'skip').map((rule) => rule.target))
  const targeted = new Set(rules.filter((rule) => rule.kind === 'visible').map((rule) => rule.target))
  const scope: ConditionScope = { places, url, skipped, refusals }
  const enabling = new Map<FieldDef, Enabling>()
  const readOnly = new Set<FieldDef>()
  /** Whether a visible rule can hide the field at `place`: it, or a container it is in, is a visible rule's target. */
  const hiddenByVisible = (place: Place) => [place, ...place.within].some((at) => at.dataPath !== undefined && targeted.has(at.dataPath))

  for (const [index, rule] of rules.entries()) {
    const path = item(member(member(FORM, 'logic'), 'rules'), index)
    if (rule.kind === 'computed') {
      const target = places.byDataPath.get(rule.target)
      // formancy computes a field while a visible rule hides it, and the
      // value stays in its submission (measured, 0007), where R4 gives a
      // disabled item no answer: every such response would be refused,
      // as clearOnHide off would be. On a page a skip rule walks past it
      // is left out with every other value there.
      const holdsNone = target === undefined || target.field.fields !== undefined || target.field.type === 'static'
      if (holdsNone || hiddenByVisible(target)) refusals.add('unmapped', member(path, 'target'))
      else readOnly.add(target.field)
      continue
    }
    if (rule.kind !== 'visible' && rule.kind !== 'skip') {
      refusals.add('unmapped', member(path, 'kind'))
      continue
    }
    const target = rule.kind === 'skip' ? places.pages.get(rule.target) : places.byDataPath.get(rule.target)
    if (target === undefined || rule.target.includes('[]')) {
      refusals.add('unmapped', member(path, 'target'))
      continue
    }
    const condition = readCondition(rule.cel ?? '')
    if (condition === undefined) {
      refusals.add('unmapped', member(path, 'cel'))
      continue
    }
    const enabled = enablingOf(condition, rule.kind === 'skip', target, scope, member(path, 'cel'))
    if (enabled !== undefined) enabling.set(target.field, enabled)
  }

  const hideable = (place: Place) => hiddenByVisible(place) || (place.page !== undefined && skipped.has(place.page))
  return { enabling, readOnly, hideable }
}
