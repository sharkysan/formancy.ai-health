/**
 * Where a refusal of a form's export points.
 *
 * A refusal is health-core's `Refusal`: a rule a host branches on, a path,
 * and a message made of those and fixed words, never of a value (0004),
 * collected by health-core's `Refusals`, so that an export answers with
 * every refusal at once or with the resource. Here a path starts at what
 * the host handed over -- `form`, the formancy form, or `context`, what
 * the host says about it -- and walks the form's own property names and
 * indices with health-core's `member` and `item`, as its paths walk a
 * resource's: `form.model.fields[2].options[0].value`. A form's names are
 * its author's, a field key or a message id, and never a person's; the
 * path names where, and a field's key is not repeated in it.
 */
import { member } from '@formancy/health-core'

/** The form the host handed over. */
export const FORM = 'form'

/** What the host said about it. */
export const CONTEXT = 'context'

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
