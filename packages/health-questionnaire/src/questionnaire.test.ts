import { Refusal, writeJson } from '@formancy/health-core'
import { SPEC_VERSIONS } from '@formancy/spec'
import { describe, expect, test } from 'vitest'
import { placesOf } from './places.js'
import { SPEC_VERSIONS_MAPPED, pairsOf, toQuestionnaire } from './questionnaire.js'
import { HOST, URL, exported, form, refused, ruled } from './test-support.js'

const name = { key: 'given_name', type: 'text', label: 'Given name', required: true } as const

describe('toQuestionnaire', () => {
  // The resource is what the validator gate judges, and writeJson is what
  // writes it: a Questionnaire holding a JavaScript number, an undefined
  // or an empty array would be refused there, or, through JSON.stringify,
  // written with its digits lost. These are its bytes, every one.
  test('answers a Questionnaire writeJson writes, claiming SDC 4.0.0, under the host\'s base, id and version', () => {
    const questionnaire = exported(form([name]))
    expect(writeJson(questionnaire)).toBe(
      '{"resourceType":"Questionnaire","meta":{"profile":["http://hl7.org/fhir/uv/sdc/StructureDefinition/sdc-questionnaire|4.0.0"]},' +
        '"extension":[{"url":"http://hl7.org/fhir/StructureDefinition/artifact-versionAlgorithm","valueCoding":{"system":"http://hl7.org/fhir/version-algorithm","code":"integer"}}],' +
        `"url":"${URL}","version":"3","title":"Intake","status":"active",` +
        '"item":[{"linkId":"given_name","text":"Given name","type":"string","required":true}]}',
    )
  })

  // SDC 4.0.0's sdc-2 refuses a version without its algorithm, which the
  // gate found on its first run; and an algorithm without a version says
  // how to compare versions there are none of.
  test('writes a version only with its algorithm, and neither for a form never published', () => {
    const unpublished = exported(form([name]), { base: HOST.base, status: 'draft' })
    expect(unpublished).not.toHaveProperty('version')
    expect(unpublished).not.toHaveProperty('extension')
    expect(unpublished.status).toBe('draft')
  })

  // The same form and context are the same resource, byte for byte: a
  // Questionnaire that differed between two runs would be two versions
  // of one definition, and nothing could say which was published.
  test('gives the same bytes for the same input', () => {
    expect(writeJson(exported(form([name])))).toBe(writeJson(exported(form([name]))))
  })

  // A form of a version nothing here reads may mean anything: mapped as
  // if it were a version that is read, a field's new meaning would be
  // exported as its old one. It is refused before anything else is read,
  // and alone, since nothing else about it is known.
  test.each(['5', '0', 4, undefined])('refuses a form of spec version %s, and says nothing else of it', (specVersion) => {
    expect(refused({ ...form([{ key: 'x', type: 'signature' }]), specVersion })).toEqual(['version form.specVersion'])
  })

  // A host's form is untrusted: something that is not an object at all
  // has no version, and is refused for that before anything reads it.
  test.each([null, 'a form', 4])('refuses %j, which is no form, for its version', (notAForm) => {
    expect(refused(notAForm)).toEqual(['version form.specVersion'])
  })

  // A spec release that reads another version would be read here as if
  // the mapping had been decided for it. This fails until somebody has.
  test('maps exactly the spec versions @formancy/spec 0.5.0 reads', () => {
    expect([...SPEC_VERSIONS_MAPPED]).toEqual([...SPEC_VERSIONS])
  })

  // What a form means is formancy's validator's to say (0002): a form it
  // refuses -- two fields with one key here -- mapped anyway would be a
  // Questionnaire with two items one linkId, which the formancy server
  // would never have published.
  test("refuses a form formancy's validator refuses, at each error's path", () => {
    expect(refused(form([name, { ...name, label: 'Again' }]))).toEqual(['invalid form.model.fields[1].key'])
  })

  // An export is whole or nothing: the resource is never answered with a
  // field left out, and every reason is given at once, so an author
  // fixes the form in one pass.
  test('refuses the whole form for one field, with every refusal at once', () => {
    const result = toQuestionnaire(form([name, { key: 'drawn', type: 'signature' }, { key: 'ranked', type: 'ranking', options: [{ value: 'a', label: 'A' }, { value: 'b', label: 'B' }] }]), HOST)
    expect(result.ok).toBe(false)
    expect(result).not.toHaveProperty('questionnaire')
    if (result.ok) return
    expect(result.refusals.every((refusal) => refusal instanceof Refusal)).toBe(true)
    expect(result.refusals.map((refusal) => refusal.path)).toEqual(['form.model.fields[1].type', 'form.model.fields[2].type'])
  })

  // The context is the host's, and untrusted all the same: a version given
  // as a JavaScript number, a base that is not a uri, a status R4 does not
  // have, a language that is not a code. Each is refused at its name.
  test("refuses a host's context that is not what it says it is, at each name", () => {
    const wrong = { base: 'not a uri', version: 3 as unknown as string, status: 'final' as 'active', languages: ['fr', 'de CH '] }
    expect(refused(form([name]), wrong)).toEqual(['grammar context.base', 'javascript-number context.version', 'unmapped context.status', 'grammar context.languages[1]'])
  })

  // A language asked for is a translation's lang, which the validator
  // does not check offline at all, `french` and `de_CH` included
  // (measured 17 October 2026, 0006): the check here is the only one. And
  // a refusal for a text missing in it names it, so it must be a language
  // tag and nothing a host could have put there instead.
  test('refuses a language asked for that is no language tag, at its index', () => {
    expect(refused(form([name]), { ...HOST, languages: ['fr', 'french', 'de_CH', 'IT'] })).toEqual(['language-tag context.languages[1]', 'language-tag context.languages[2]', 'language-tag context.languages[3]'])
  })

  // A member the context does not name -- a publisher, a copyright -- is
  // something the host meant the Questionnaire to say, and it was left
  // out without a word (found in H07's review, 0009). It is refused as
  // unmapped at the context, by health-core's `known`, its name not
  // repeated; and a context that is no object is refused as absent, where
  // it was read into a TypeError.
  test("refuses a member the host's context does not name, and a context that is none", () => {
    expect(refused(form([name]), { ...HOST, publisher: 'Praxis Synthetica' } as never)).toEqual(['unmapped context'])
    expect(refused(form([name]), null as never)).toEqual(['absent context'])
  })

  // A refusal reaches a host's log. A form's texts are no person's, but an
  // answer-like value in one could be, and the rule is the same as
  // health-core's: the path and the rule, never the value.
  test('never quotes a value of the form or the context', () => {
    const messages = toQuestionnaire(form([{ key: 'weight', type: 'number', min: 31415926535, step: 1 }]), { ...HOST, version: '27182818284' })
    expect(messages.ok).toBe(false)
    if (messages.ok) return
    for (const refusal of messages.refusals) {
      expect(refusal.message).not.toContain('31415926535')
      expect(refusal.message).not.toContain('27182818284')
    }
  })

  // The same, over every kind of refusal at once: formancy's validator's,
  // whose own messages quote values ("The earliest allowed value ... is
  // after the latest allowed ..."); each of the mapping's; and the
  // context's. Every value is synthetic and shaped like a person's -- a
  // name, a birth date, an identifier -- so finding one in a message or a
  // path means it was quoted.
  test('never quotes a value, in any refusal of any kind', () => {
    const values = ['Erika', 'Muster', '1987-02-28', '1987-02-29', '1999-12-31', '756.1234.5678.90', '31415926535', '27182818284', '07:41', 'Hans', 'Meier']
    const invalid = form([{ key: 'born', type: 'date', earliest: '1999-12-31', latest: '1987-02-28' }, { key: 'arrival', type: 'time', latest: '07:41:00' }])
    const mapped = ruled(
      [
        { key: 'name', type: 'radio', label: { $t: 'name' }, options: [{ value: ' Erika Muster', label: 'Erika Muster' }] },
        { key: 'born', type: 'date', earliest: '1987-02-29' },
        { key: 'count', type: 'number', step: 1, max: 31415926535 },
        { key: 'ahv', type: 'text', pattern: '756\\.1234\\.5678\\.90' },
        { key: 'follow_up', type: 'text' },
        { key: 'reason', type: 'text' },
      ],
      [
        { target: 'follow_up', kind: 'visible', cel: "reason == 'Hans Meier'" },
        { target: 'reason', kind: 'visible', cel: 'count == 27182818284' },
        { target: 'name', kind: 'validate', cel: "name != 'Erika Muster'", code: 'Muster' },
      ],
    )
    const withI18n = { ...mapped, i18n: { defaultLocale: 'de-CH', messages: { 'de-CH': { name: 'Name von Erika Muster' }, fr: {} } } }
    const context = { base: 'https://forms.synthetic.invalid/Erika Muster', version: '27182818284', status: 'active' as const, languages: ['fr', 'Muster'] }
    const refusals = [invalid, withI18n].flatMap((schema) => {
      const result = toQuestionnaire(schema, schema === invalid ? HOST : { ...HOST, languages: ['fr'] })
      return result.ok ? [] : [...result.refusals]
    })
    const contextual = toQuestionnaire(form([name]), context)
    if (!contextual.ok) refusals.push(...contextual.refusals)
    // Every kind is here: formancy's, the mapping's, a primitive's, the context's.
    expect(new Set(refusals.map((refusal) => refusal.rule))).toEqual(new Set(['invalid', 'grammar', 'calendar', 'range', 'unmapped', 'missing', 'language-tag']))
    for (const refusal of refusals) for (const value of values) expect(`${refusal.message} ${refusal.path}`).not.toContain(value)
  })

  // An empty item list is no list in FHIR JSON, which writeJson refuses;
  // formancy's validator accepts a form with no field, and R4 a
  // Questionnaire with no item.
  test('writes no item list for a form with no field', () => {
    const empty = exported(form([]))
    expect(empty).not.toHaveProperty('item')
    expect(() => writeJson(empty)).not.toThrow()
  })

  test('writes a page as a group holding its fields', () => {
    const paged = exported(form([{ key: 'step_one', type: 'page', label: 'Step one', fields: [{ key: 'note', type: 'static', label: 'Nothing to answer.' }] }]))
    expect(paged.item).toEqual([{ linkId: 'step_one', text: 'Step one', type: 'group', item: [{ linkId: 'note', text: 'Nothing to answer.', type: 'display' }] }])
  })

  // The answers' export walks each field beside the item it became; the
  // two are paired by their order, which itemsOf keeps. A pairing that
  // came out of step would answer one field's item with another's value,
  // so it throws, as a bug, rather than pair them anyway.
  test('pairs each field with its item, and throws when they are out of step', () => {
    const schema = form([name, { key: 'box', type: 'group', fields: [{ key: 'inside', type: 'text' }] }])
    const { roots } = placesOf(schema)
    const items = exported(schema).item ?? []
    expect(pairsOf(roots, items).map((pair) => [pair.item.linkId, pair.children.map((child) => child.item.linkId)])).toEqual([['given_name', []], ['box', ['inside']]])
    expect(() => pairsOf(roots, items.slice(1))).toThrow(/one per field/)
    expect(() => pairsOf(roots, [...items].reverse())).toThrow(/not its field/)
  })
})
