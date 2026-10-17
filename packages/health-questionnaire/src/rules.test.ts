import { describe, expect, test } from 'vitest'
import type { FormSchema } from '@formancy/spec'
import { placesOf } from './places.js'
import { Refusals } from './refusals.js'
import { ruleEffects } from './rules.js'
import { URL, form } from './test-support.js'

describe('ruleEffects', () => {
  // toQuestionnaire hands this only forms formancy's validator accepted,
  // which gives every visible and skip rule its expression; one handed
  // over without is refused at its expression, never read as an empty
  // one or crashed on.
  test('refuses a visibility rule without an expression', () => {
    const schema: FormSchema = form([{ key: 'reason', type: 'text' }], { logic: { rules: [{ target: 'reason', kind: 'visible' }] } })
    const refusals = new Refusals()
    const effects = ruleEffects(schema, placesOf(schema), URL, refusals)
    expect(effects.enabling.size).toBe(0)
    expect(refusals.list.map((refusal) => `${refusal.rule} ${refusal.path}`)).toEqual(['unmapped form.logic.rules[0].cel'])
  })
})
