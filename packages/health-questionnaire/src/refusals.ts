/**
 * Where a refusal points, and the refusals of one export, collected.
 *
 * A refusal is health-core's `Refusal`: a rule a host branches on, a path,
 * and a message made of those and fixed words, never of a value (0004).
 * Here a path starts at what the host handed over -- `form`, the formancy
 * form, or `context`, what the host says about it -- and walks the form's
 * own property names and indices, as health-core's paths walk a
 * resource's: `form.model.fields[2].options[0].value`. A form's names are
 * its author's, a field key or a message id, and never a person's; the
 * path names where, and a field's key is not repeated in it.
 *
 * An export collects every refusal before it answers, as formancy's own
 * validator does, so that an author fixes a form in one pass rather than
 * one field per attempt; and answers with none of the resource when there
 * is even one.
 */
import { Refusal, type RefusalContext, type Rule } from '@formancy/health-core'

/** The form the host handed over. */
export const FORM = 'form'

/** What the host said about it. */
export const CONTEXT = 'context'

const PLAIN_NAME = /^[A-Za-z_$][A-Za-z0-9_$]*$/

/** The path of `name` in the object at `path`: after a dot, or quoted in brackets. */
export function member(path: string, name: string): string {
  return PLAIN_NAME.test(name) ? `${path}.${name}` : `${path}[${JSON.stringify(name)}]`
}

/** The path of the item at `index` of the array at `path`. */
export function item(path: string, index: number): string {
  return `${path}[${String(index)}]`
}

/**
 * A JSON Pointer formancy's validator gives (`/model/fields/1/key`) as a
 * path from `form`. A segment of digits is read as an index, which is
 * what every array of a formancy form is reached by.
 */
export function fromPointer(pointer: string): string {
  if (pointer === '') return FORM
  return pointer
    .slice(1)
    .split('/')
    .map((segment) => segment.replaceAll('~1', '/').replaceAll('~0', '~'))
    .reduce((path, segment) => (/^(?:0|[1-9][0-9]*)$/.test(segment) ? `${path}[${segment}]` : member(path, segment)), FORM)
}

/** The refusals one export found, in the order it found them. */
export class Refusals {
  readonly #found: Refusal[] = []

  /** A refusal for `rule` at `path`. Returns undefined, so a mapping can `return refusals.add(...)`. */
  add(rule: Rule, path: string, context?: RefusalContext): undefined {
    this.#found.push(new Refusal(rule, path, context))
    return undefined
  }

  /**
   * What `make` returns, or undefined with the Refusal it threw recorded:
   * a primitive of health-core's refusing a value the form or the host
   * gave, at the path it was given. Anything else it throws is a bug, and
   * is thrown on.
   */
  take<T>(make: () => T): T | undefined {
    try {
      return make()
    } catch (error) {
      if (!(error instanceof Refusal)) throw error
      this.#found.push(error)
      return undefined
    }
  }

  get count(): number {
    return this.#found.length
  }

  get list(): readonly Refusal[] {
    return [...this.#found]
  }
}
