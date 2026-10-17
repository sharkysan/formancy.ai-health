import { Refusal, integer } from '@formancy/health-core'
import { describe, expect, test } from 'vitest'
import { Refusals, fromPointer, item, member } from './refusals.js'

describe('a path', () => {
  // formancy's validator names where with a JSON Pointer; a host reading
  // health-core's refusals reads `$.a[0].b`. One form of path for every
  // refusal of an export, from `form`, or a host matches two.
  test('from a JSON Pointer is written from form, as health-core writes one', () => {
    expect(fromPointer('/model/fields/1/key')).toBe('form.model.fields[1].key')
    expect(fromPointer('')).toBe('form')
    expect(fromPointer('/i18n/messages/de-CH/a~1b~0c')).toBe('form.i18n.messages["de-CH"]["a/b~c"]')
  })

  test('names a member plainly where it can, and quoted where it cannot', () => {
    expect(member('form', 'model')).toBe('form.model')
    expect(member('form.i18n.messages', 'fr-CH')).toBe('form.i18n.messages["fr-CH"]')
    expect(item('form.model.fields', 3)).toBe('form.model.fields[3]')
  })
})

describe('Refusals', () => {
  // A primitive's refusal is the refusal, at the path it was given; a bug
  // taken for one would be a crash reported as a form's mistake.
  test('records what a primitive refuses, and throws on what is not a refusal', () => {
    const refusals = new Refusals()
    expect(refusals.take(() => integer('2147483648', 'form.model.fields[0].max'))).toBeUndefined()
    expect(refusals.take(() => 'kept')).toBe('kept')
    expect(refusals.list.map((refusal) => `${refusal.rule} ${refusal.path}`)).toEqual(['range form.model.fields[0].max'])
    expect(() => refusals.take(() => JSON.parse('{'))).toThrow(SyntaxError)
    expect(refusals.add('unmapped', 'form.model.fields[1].type')).toBeUndefined()
    expect(refusals.count).toBe(2)
    expect(refusals.list[1]).toBeInstanceOf(Refusal)
  })

  // What a host is given is a copy: a list it could push into would be
  // the export's own record of what it refused.
  test('hands out a copy of its list', () => {
    const refusals = new Refusals()
    refusals.add('missing', 'form.model.fields[0].label', { language: 'fr' })
    ;(refusals.list as Refusal[]).pop()
    expect(refusals.count).toBe(1)
  })
})
