/**
 * A form's fields as Questionnaire items: one item per field, in the
 * model's order, with the field's key as its linkId (0006).
 *
 * What each field type becomes is item-types.ts's. What a field says
 * beside its type is written where SDC has an element that says it, and
 * refused where it has none, naming the property:
 *
 * - `required` is `required`, where formancy and R4 mean the same by it:
 *   an answer is there (`unanswered` in `@formancy/core` 0.5.0). Where
 *   they do not, it is refused (REQUIRED_REFUSED).
 * - `label` is `text`, with its translations (texts.ts).
 * - `maxLength` is `maxLength`, `minLength` the `minLength` extension;
 *   `min` and `max`, `earliest` and `latest` the `minValue` and `maxValue`
 *   extensions, each of the item's own type (values.ts).
 * - `maxItems` is `questionnaire-maxOccurs`, and `minItems` above zero
 *   `questionnaire-minOccurs`, which R4 allows only on a required item:
 *   on one that is not, it is refused.
 * - `pattern`, `format` and `mask` constrain an answer in ways no SDC
 *   element states without a regular expression of another dialect or
 *   FHIRPath, and are refused; so is `clearOnHide: false` on a field a
 *   rule can hide, whose answer formancy keeps while R4 drops a disabled
 *   item's.
 *
 * Not carried, because they say how a form looks and not what it collects
 * or what an answer means: `widget`, a datagrid's `columns`, a repeater's
 * `addLabel` and `removeLabel`, an option's picture, and the form's
 * `layouts` -- items are in the model's order. Nor `renamedFrom`, which is
 * the history of a key and not part of this version. A page is a group,
 * without SDC's `page` item control: R4's code system has no `page`, and
 * the validator refuses it (`Unknown code 'page' in the CodeSystem
 * 'http://hl7.org/fhir/questionnaire-item-control' version '4.0.1'`).
 */
import type { FieldDef } from '@formancy/spec'
import { code, type FhirInteger } from '@formancy/health-core'
import { itemTypeOf, repeats, type ItemType } from './item-types.js'
import { answerOptionsOf } from './options.js'
import type { Place, Places } from './places.js'
import { EXTENSION, type Extension, type QuestionnaireItem } from './resource.js'
import { member, type Refusals } from './refusals.js'
import type { RuleEffects } from './rules.js'
import type { Texts } from './texts.js'
import { dateOf, dateTimeOf, decimalOf, integerOf, timeOf } from './values.js'

/**
 * The field types whose `required` means something R4's does not:
 *
 * - a checkbox, which formancy calls "a consent gate: only an actual tick
 *   satisfies it", where R4's required boolean is answered by false too;
 * - a group, which formancy counts as answered by any object, its fields
 *   all empty, where R4's needs an answer inside it; and a page, which holds
 *   no answer at all;
 * - a static text, which has nothing to answer, and which R4's que-6 does
 *   not let be required.
 *
 * A repeater is required in both when it has a row: R4's repeating group
 * when one has an answer in it, so a row left empty, which formancy counts,
 * is for the answers' export to refuse (H05).
 */
const REQUIRED_REFUSED: ReadonlySet<FieldDef['type']> = new Set(['checkbox', 'group', 'page', 'static'])

/** What mapping a field needs of the rest of the export. */
export interface ItemScope {
  readonly places: Places
  readonly effects: RuleEffects
  readonly texts: Texts
  readonly url: string
  readonly refusals: Refusals
}

/** What a field adds to its item beside the common elements. */
interface Constraints {
  readonly extension: Extension[]
  maxLength?: FhirInteger
  answerOption?: QuestionnaireItem['answerOption']
}

/** The bound extension `url` of an item of `type`, from a formancy value at `path`. */
function bound(url: string, type: ItemType, value: number | string, path: string): Extension | undefined {
  if (typeof value === 'number') return type === 'integer' ? { url, valueInteger: integerOf(value, path) } : { url, valueDecimal: decimalOf(value, path) }
  if (type === 'date') return { url, valueDate: dateOf(value, path) }
  if (type === 'time') return { url, valueTime: timeOf(value, path) }
  return { url, valueDateTime: dateTimeOf(value, path) }
}

/** `field`'s constraints, for an item of `type`, with each it cannot say refused. */
function constraintsOf(field: FieldDef, type: ItemType, path: string, scope: ItemScope): Constraints {
  const { refusals } = scope
  const found: Constraints = { extension: [] }
  const add = (extension: Extension | undefined) => extension !== undefined && found.extension.push(extension)
  for (const property of ['pattern', 'format', 'mask'] as const) if (field[property] !== undefined) refusals.add('unmapped', member(path, property))
  const maxLength = field.maxLength === undefined ? undefined : refusals.take(() => integerOf(field.maxLength as number, member(path, 'maxLength')))
  if (maxLength !== undefined) found.maxLength = maxLength
  if (field.minLength !== undefined) add(refusals.take(() => ({ url: EXTENSION.minLength, valueInteger: integerOf(field.minLength as number, member(path, 'minLength')) })))
  const lowest = field.min ?? field.earliest
  const highest = field.max ?? field.latest
  const lowestAt = member(path, field.min === undefined ? 'earliest' : 'min')
  const highestAt = member(path, field.max === undefined ? 'latest' : 'max')
  if (lowest !== undefined) add(refusals.take(() => bound(EXTENSION.minValue, type, lowest, lowestAt)))
  if (highest !== undefined) add(refusals.take(() => bound(EXTENSION.maxValue, type, highest, highestAt)))
  if (field.minItems !== undefined && field.minItems > 0) {
    if (field.required === true) add(refusals.take(() => ({ url: EXTENSION.minOccurs, valueInteger: integerOf(field.minItems as number, member(path, 'minItems')) })))
    else refusals.add('unmapped', member(path, 'minItems'))
  }
  if (field.maxItems !== undefined) add(refusals.take(() => ({ url: EXTENSION.maxOccurs, valueInteger: integerOf(field.maxItems as number, member(path, 'maxItems')) })))
  if (type === 'choice') found.answerOption = answerOptionsOf(field, path, scope.url, scope.texts, refusals)
  if (field.type === 'hidden') found.extension.unshift({ url: EXTENSION.hidden, valueBoolean: true })
  return found
}

/** The item of the field at `place`, or undefined with what it cannot say in the scope's refusals. */
function itemOf(place: Place, scope: ItemScope): QuestionnaireItem | undefined {
  const { refusals, effects } = scope
  const { field, path } = place
  const type = itemTypeOf(field)
  if (type === undefined) return refusals.add('unmapped', member(path, field.type === 'number' ? 'step' : 'type'))
  const before = refusals.count
  if (type === 'display' && field.label === undefined) refusals.add('missing', member(path, 'label'))
  if (field.required === true && REQUIRED_REFUSED.has(field.type)) refusals.add('unmapped', member(path, 'required'))
  if (field.clearOnHide === false && effects.hideable(place)) refusals.add('unmapped', member(path, 'clearOnHide'))
  const text = field.label === undefined ? undefined : scope.texts.of(field.label, member(path, 'label'))
  const constraints = constraintsOf(field, type, path, scope)
  let children: QuestionnaireItem[] | undefined
  if (type === 'group') {
    // R4's que-1: a group has items. formancy may hold an empty one.
    if (place.children.length === 0) refusals.add('unmapped', member(path, 'fields'))
    else children = itemsOf(place.children, scope)
  }
  if (refusals.count > before) return undefined
  const enabling = effects.enabling.get(field)
  return {
    ...(constraints.extension.length === 0 ? {} : { extension: constraints.extension }),
    linkId: field.key,
    ...(text === undefined ? {} : { text: text.text }),
    ...(text?.translations === undefined ? {} : { _text: text.translations }),
    type: code(type, member(path, 'type')),
    ...(enabling === undefined ? {} : { enableWhen: enabling.enableWhen }),
    ...(enabling?.enableBehavior === undefined ? {} : { enableBehavior: enabling.enableBehavior }),
    ...(field.required === true ? { required: true } : {}),
    ...(repeats(field) ? { repeats: true } : {}),
    ...(effects.readOnly.has(field) ? { readOnly: true } : {}),
    ...(constraints.maxLength === undefined ? {} : { maxLength: constraints.maxLength }),
    ...(constraints.answerOption === undefined ? {} : { answerOption: constraints.answerOption }),
    ...(children === undefined ? {} : { item: children }),
  }
}

/** The items of the fields at `places`, each mapped or refused; the list is whole only when nothing was refused. */
export function itemsOf(places: readonly Place[], scope: ItemScope): QuestionnaireItem[] {
  return places.flatMap((place) => itemOf(place, scope) ?? [])
}
