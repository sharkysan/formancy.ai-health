import { describe, expect, test } from 'vitest'
import { fromPointer } from './refusals.js'

describe('a path', () => {
  // formancy's validator names where with a JSON Pointer; a host reading
  // health-core's refusals reads `$.a[0].b`. One form of path for every
  // refusal of an export, from `form`, or a host matches two.
  test('from a JSON Pointer is written from form, as health-core writes one', () => {
    expect(fromPointer('/model/fields/1/key')).toBe('form.model.fields[1].key')
    expect(fromPointer('')).toBe('form')
    expect(fromPointer('/i18n/messages/de-CH/a~1b~0c')).toBe('form.i18n.messages["de-CH"]["a/b~c"]')
  })
})
