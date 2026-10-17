import { describe, expect, test } from 'vitest'
import { item, member } from './json.js'
import { integer } from './numbers.js'
import { Refusal } from './refusal.js'
import { Refusals } from './refusals.js'

describe('a path', () => {
  // Every package names where with the same form of path, the one
  // writeJson's refusals use: a host that matched `$.a[0].b` from
  // health-core and something else from a package above it would match
  // two forms, and miss one.
  test('names a member plainly where it can, and quoted where it cannot', () => {
    expect(member('form', 'model')).toBe('form.model')
    expect(member('form.i18n.messages', 'fr-CH')).toBe('form.i18n.messages["fr-CH"]')
    expect(member('context', '0')).toBe('context["0"]')
    expect(item('form.model.fields', 3)).toBe('form.model.fields[3]')
  })
})

describe('Refusals', () => {
  // A primitive's refusal is the refusal, at the path it was given; a bug
  // taken for one would be a crash reported as the input's mistake.
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
