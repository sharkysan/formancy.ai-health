/**
 * A choice field's options as answer options: each a coding of the
 * option's value, displayed as its label.
 *
 * SDC 4.0.0's sdc-base-2 refuses a coding with a code and no system: "If
 * code exists, system must exist". A formancy option has a value and a
 * label and no system, so the system is named here, under the
 * Questionnaire's own url: `<Questionnaire.url>/<field key>`, one per
 * field, since two fields may both offer `yes` and mean different things.
 * It is an identifier, never fetched and never published as a CodeSystem;
 * an option's value is "stable like a field key", so the system carries
 * no version. The validator, offline, says it knows no such code system,
 * as information (0005), which refuses nothing. A host's base under
 * `http://example.org` is an error for a system, and the validator says so.
 *
 * An option's picture is presentation, an address the Questionnaire does
 * not carry.
 */
import { code, uri } from '@formancy/health-core'
import type { FieldDef } from '@formancy/spec'
import type { AnswerOption, Coding } from './resource.js'
import { item, member, type Refusals } from './refusals.js'
import type { Texts } from './texts.js'

/** The code system the options of the field `key` are named in. */
export function optionSystem(url: string, key: string): string {
  return `${url}/${key}`
}

/** The coding of the option `value` of the field `key`. */
export function optionCoding(url: string, key: string, value: string, path: string): Coding {
  return { system: uri(optionSystem(url, key), path), code: code(value, path) }
}

/** The answer options of `field`, at `path`; undefined, refused, where one cannot be written. */
export function answerOptionsOf(field: FieldDef, path: string, url: string, texts: Texts, refusals: Refusals): AnswerOption[] | undefined {
  if (field.optionsSource !== undefined) return refusals.add('unmapped', member(path, 'optionsSource'))
  // A select may offer nothing in formancy, which then accepts no answer
  // at all; a choice item with no option says nothing either way.
  if (field.options === undefined || field.options.length === 0) return refusals.add('unmapped', member(path, 'options'))
  const before = refusals.count
  const options: AnswerOption[] = []
  for (const [index, option] of field.options.entries()) {
    const at = item(member(path, 'options'), index)
    const coding = refusals.take(() => optionCoding(url, field.key, option.value, member(at, 'value')))
    const label = texts.of(option.label, member(at, 'label'))
    if (coding === undefined || label === undefined) continue
    const display = label.translations === undefined ? { display: label.text } : { display: label.text, _display: label.translations }
    options.push({ valueCoding: { ...coding, ...display } })
  }
  return refusals.count > before ? undefined : options
}
