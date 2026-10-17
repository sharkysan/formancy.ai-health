import { Refusal, writeJson } from '@formancy/health-core'
import type { FieldDef } from '@formancy/spec'
import { describe, expect, test } from 'vitest'
import type { QuestionnaireItem } from './resource.js'
import type { QuestionnaireResponseItem } from './response-resource.js'
import { toQuestionnaireResponse } from './response.js'
import { HOST, RESPONDING, URL, answered, exported, form, refusedAnswers, ruled } from './test-support.js'

const reason: FieldDef = { key: 'reason', type: 'text', label: 'Reason', required: true }
const option = (value: string, label: string) => ({ value, label })
const urgency: FieldDef = { key: 'urgency', type: 'radio', options: [option('routine', 'Routine'), option('urgent', 'Urgent')] }

describe('toQuestionnaireResponse', () => {
  // The resource is what the validator gate judges against its
  // Questionnaire, and writeJson is what writes it. Every byte: the SDC
  // profile, the Questionnaire's canonical with its version exactly as
  // toQuestionnaire writes them, the host's status, subject and time, and
  // an item of no text -- the Questionnaire's item says it, translated.
  test("answers a QuestionnaireResponse writeJson writes, to the Questionnaire's url and version", () => {
    expect(writeJson(answered(form([reason]), { reason: 'Follow-up' }))).toBe(
      '{"resourceType":"QuestionnaireResponse","meta":{"profile":["http://hl7.org/fhir/uv/sdc/StructureDefinition/sdc-questionnaireresponse|4.0.0"]},' +
        `"questionnaire":"${URL}|3","status":"completed","subject":{"reference":"Patient/synthetic-1"},"authored":"2026-10-17T10:00:00+02:00",` +
        '"item":[{"linkId":"reason","answer":[{"valueString":"Follow-up"}]}]}',
    )
  })

  // The canonical is the Questionnaire's, so a response can never name
  // another than the one toQuestionnaire wrote for the same context.
  test("names the canonical the Questionnaire has, and only the url for a form never published", () => {
    const unpublished = { base: HOST.base, status: 'draft' as const }
    const response = answered(form([reason]), { reason: 'x' }, { ...RESPONDING, questionnaire: unpublished })
    expect(response.questionnaire).toBe(exported(form([reason]), unpublished).url)
    expect(response.questionnaire).toBe(URL)
  })

  // SDC's sdcqr-1 warns of a response without a subject, which the gate
  // refuses, and SDC says its questionnaire "SHALL be the version-specific
  // URL of the form": the profile is claimed only where both hold, and a
  // plain R4 response is written elsewhere (measured 17 October 2026: the
  // SDC profile with no subject raises sdcqr-1; without a profile, nothing).
  test('claims the SDC profile only with a subject and a versioned Questionnaire', () => {
    const { subject: _, ...anonymous } = RESPONDING
    expect(answered(form([reason]), { reason: 'x' }, anonymous)).not.toHaveProperty('meta')
    expect(answered(form([reason]), { reason: 'x' }, { ...RESPONDING, questionnaire: { base: HOST.base, status: 'draft' } })).not.toHaveProperty('meta')
  })

  // A country's guide profiles the response too -- CH ORF's
  // ch-orf-questionnaireresponse holds its subject to the document's
  // patient -- and the validator holds a response only to the profiles it
  // claims: one that does not claim the guide's is held to nothing of it
  // (measured 17 October 2026, 0009). The host names those claims; each is
  // written after SDC's, in the order given, once, in the one place a
  // response's meta is written.
  test("claims the profiles the host names, after SDC's, each once", () => {
    const CH_ORF = 'http://fhir.ch/ig/ch-orf/StructureDefinition/ch-orf-questionnaireresponse|3.0.2'
    const OTHER = 'https://profiles.synthetic.invalid/StructureDefinition/response|1'
    const response = answered(form([reason]), { reason: 'x' }, { ...RESPONDING, profiles: [CH_ORF, OTHER, CH_ORF] })
    expect(writeJson(response)).toContain(`"meta":{"profile":["http://hl7.org/fhir/uv/sdc/StructureDefinition/sdc-questionnaireresponse|4.0.0","${CH_ORF}","${OTHER}"]},"questionnaire"`)
    // Where SDC's claim is not made, the host's are made alone.
    const { subject: _, ...anonymous } = RESPONDING
    expect(answered(form([reason]), { reason: 'x' }, { ...anonymous, profiles: [CH_ORF] }).meta).toEqual({ profile: [CH_ORF] })
    // Naming SDC's own claim claims it once.
    expect(answered(form([reason]), { reason: 'x' }, { ...RESPONDING, profiles: ['http://hl7.org/fhir/uv/sdc/StructureDefinition/sdc-questionnaireresponse|4.0.0'] }).meta).toEqual({
      profile: ['http://hl7.org/fhir/uv/sdc/StructureDefinition/sdc-questionnaireresponse|4.0.0'],
    })
  })

  // A claim is a canonical, a uri; an empty list claims nothing and FHIR
  // JSON has no empty array, and something that is no list is no claims.
  test('refuses claims that are no list of canonicals', () => {
    expect(refusedAnswers(form([reason]), { reason: 'x' }, { ...RESPONDING, profiles: ['ch orf'] })).toEqual(['grammar context.profiles[0]'])
    expect(refusedAnswers(form([reason]), { reason: 'x' }, { ...RESPONDING, profiles: [] })).toEqual(['absent context.profiles'])
    expect(refusedAnswers(form([reason]), { reason: 'x' }, { ...RESPONDING, profiles: 'http://fhir.ch/ig/ch-orf/StructureDefinition/ch-orf-questionnaireresponse' as never })).toEqual(['absent context.profiles'])
  })

  // A host's array may have a hole, which JSON never has; walked past, a
  // hole among the claims would leave the claim the host meant out of
  // the response without a word. Each index is read, and a hole refused
  // where it stands, as health-core's readItems reads the other packages'
  // lists (0009).
  test('refuses a hole among the claims, at its index', () => {
    const claims: string[] = ['https://profiles.synthetic.invalid/StructureDefinition/response|1']
    claims[2] = 'https://profiles.synthetic.invalid/StructureDefinition/other|1'
    expect(refusedAnswers(form([reason]), { reason: 'x' }, { ...RESPONDING, profiles: claims })).toEqual(['grammar context.profiles[1]'])
  })

  // The author and the source are the host's, by name, and written where
  // R4 puts them: after authored.
  test('writes the author and the source the host names', () => {
    const response = answered(form([reason]), { reason: 'x' }, { ...RESPONDING, author: { reference: 'Practitioner/synthetic-2' }, source: { reference: 'Patient/synthetic-1' } })
    expect(writeJson(response)).toContain('"authored":"2026-10-17T10:00:00+02:00","author":{"reference":"Practitioner/synthetic-2"},"source":{"reference":"Patient/synthetic-1"},"item"')
  })

  // The same form, answers and context are the same resource, byte for
  // byte: nothing here reads a clock or a random source.
  test('gives the same bytes for the same input', () => {
    expect(writeJson(answered(form([reason]), { reason: 'x' }))).toBe(writeJson(answered(form([reason]), { reason: 'x' })))
  })

  // The host's context is untrusted all the same: a status R4 does not
  // have, a time without its zone, a subject that is an address, an author
  // R4 does not allow (an Observation), and the Questionnaire's own
  // context, at its own path. Each is refused where it is.
  test("refuses a host's context that is not what it says it is, at each name", () => {
    const wrong = {
      questionnaire: { ...HOST, version: 3 as unknown as string },
      status: 'final' as 'completed',
      authored: '2026-10-17T10:00:00',
      subject: { reference: 'https://ehr.synthetic.invalid/Patient/1' },
      author: { reference: 'Observation/o-1' },
      source: 'Patient/synthetic-1' as never,
    }
    expect(refusedAnswers(form([reason]), { reason: 'x' }, wrong)).toEqual([
      'javascript-number context.questionnaire.version',
      'unmapped context.status',
      'zone context.authored',
      'reference context.subject.reference',
      'reference context.author.reference',
      'reference context.source.reference',
    ])
  })

  // A member the context does not name -- an encounter, a basedOn, a
  // publisher of the Questionnaire's, a reference's display -- is
  // something the host meant the response to say, and it was left out
  // without a word (found in H07's review, 0009). Each is refused as
  // unmapped at the object that holds it, by health-core's `known`, its
  // name not repeated; a context that is no object is refused as absent,
  // where it was read into a TypeError.
  test.each([
    ['an encounter', { ...RESPONDING, encounter: { reference: 'Encounter/synthetic-1' } }, 'unmapped context'],
    ['what it is based on', { ...RESPONDING, basedOn: [{ reference: 'ServiceRequest/synthetic-1' }] }, 'unmapped context'],
    ["a publisher of the Questionnaire's", { ...RESPONDING, questionnaire: { ...HOST, publisher: 'Praxis Synthetica' } }, 'unmapped context.questionnaire'],
    ["a subject's display", { ...RESPONDING, subject: { reference: 'Patient/synthetic-1', display: 'Synthetica Beispiel' } }, 'unmapped context.subject'],
    ['null for a context', null, 'absent context'],
  ])('refuses a context with %s', (_, context, refusal) => {
    expect(refusedAnswers(form([reason]), { reason: 'x' }, context as never)).toEqual([refusal])
  })

  // Each of the response's own elements is refused alone, too: one wrong
  // among right ones is no response.
  test.each([
    [{ authored: '2026-10-17T10:00' }, 'grammar context.authored'],
    [{ subject: { reference: 'Patient' } }, 'reference context.subject.reference'],
    [{ source: { reference: 'Organization/o-1' } }, 'reference context.source.reference'],
  ])('refuses %o alone', (wrong, refusal) => {
    expect(refusedAnswers(form([reason]), { reason: 'x' }, { ...RESPONDING, ...wrong })).toEqual([refusal])
  })

  // A response to a Questionnaire that cannot be written would answer
  // nothing: a form the mapping refuses is refused for the answers too,
  // with the Questionnaire's own refusals, and its answers are not read.
  test("refuses the answers of a form it cannot write a Questionnaire of, with that form's refusals", () => {
    expect(refusedAnswers(form([{ key: 'drawn', type: 'signature' }]), { drawn: { typed: 'x' } })).toEqual(['unmapped form.model.fields[0].type'])
  })

  // What a host hands over as the answers is a submission's value, an
  // object; anything else holds no answer to anything.
  test.each([[undefined], [null], ['answers'], [[]], [4], [new Map([['reason', 'x']])]])('refuses %o as the answers', (answers) => {
    expect(refusedAnswers(form([reason]), answers)).toEqual(['answer-type answers'])
  })

  // A key is any name of formancy's form, `constructor` and `toString`
  // among them, and every object inherits a value under those: read as
  // answers, an unanswered field would answer with a function, and be
  // refused for it. Only a submission's own names hold its answers.
  test('reads only what the submission itself holds under a key', () => {
    const fields: FieldDef[] = [{ key: 'constructor', type: 'text' }, { key: 'toString', type: 'text' }]
    expect(answered(form(fields), {})).not.toHaveProperty('item')
    // A parser may give an object no prototype at all: it is plain data.
    const bare = Object.assign(Object.create(null) as Record<string, unknown>, { reason: 'x' })
    expect(answered(form([reason]), bare).item?.map((item) => item.linkId)).toEqual(['reason'])
  })
})

describe('the items of a response', () => {
  const address: FieldDef = { key: 'address', type: 'group', fields: [{ key: 'city', type: 'text' }, { key: 'zip', type: 'text' }] }
  const contacts: FieldDef = { key: 'contacts', type: 'repeater', fields: [{ key: 'name', type: 'text' }, { key: 'calls', type: 'number', step: 1 }] }
  const page: FieldDef = { key: 'step', type: 'page', label: 'Step', fields: [reason, address] }

  // A group's answers are nested in its item, a page's too, though a page
  // scopes no data: its fields' answers stand beside it in formancy's
  // submission and under it in the response, as in the Questionnaire.
  test('nests a group and a page as the Questionnaire does', () => {
    const response = answered(form([page]), { reason: 'x', address: { city: 'Bern' } })
    expect(writeJson(response.item as never)).toBe('[{"linkId":"step","item":[{"linkId":"reason","answer":[{"valueString":"x"}]},{"linkId":"address","item":[{"linkId":"city","answer":[{"valueString":"Bern"}]}]}]}]')
  })

  // A repeater's rows are one item each, of its linkId, as R4 writes a
  // repeating group; a row's _id is formancy's identity of it, not an
  // answer, and is not carried.
  test('writes each row of a repeater as an item of its own', () => {
    const response = answered(form([contacts]), { contacts: [{ _id: 'r1', name: 'A' }, { _id: 'r2', name: 'B', calls: 2 }] })
    expect(writeJson(response.item as never)).toBe(
      '[{"linkId":"contacts","item":[{"linkId":"name","answer":[{"valueString":"A"}]}]},{"linkId":"contacts","item":[{"linkId":"name","answer":[{"valueString":"B"}]},{"linkId":"calls","answer":[{"valueInteger":2}]}]}]',
    )
  })

  // formancy pads a repeater with empty rows to its minimum, and counts a
  // required one answered by an empty row (measured on @formancy/core
  // 0.5.0). R4 has no item for a row that holds nothing: the validator
  // refuses one ("No sub-items found for required group", measured). An
  // empty row is not written; a required repeater whose rows are all
  // empty has no answer, and a completed response is refused for it.
  test('writes no empty row, and refuses a required repeater of empty rows in a completed response', () => {
    expect(answered(form([contacts]), { contacts: [{ _id: 'r1' }, { _id: 'r2', name: 'B' }, { _id: 'r3', name: '  ' }] }).item).toHaveLength(1)
    expect(refusedAnswers(form([{ ...contacts, required: true }]), { contacts: [{ _id: 'r1' }] })).toEqual(['required answers.contacts'])
  })

  // An empty row says nothing, its required fields' answers included: it
  // is not an item, so nothing in it is checked, as the validator checks
  // nothing in a group that is absent (measured).
  test("checks a row's required fields only in a row with an answer", () => {
    const named: FieldDef = { ...contacts, fields: [{ key: 'name', type: 'text', required: true }, { key: 'calls', type: 'number', step: 1 }] }
    expect(answered(form([named]), { contacts: [{ _id: 'r1' }, { _id: 'r2', name: 'B' }] }).item).toHaveLength(1)
    expect(refusedAnswers(form([named]), { contacts: [{ _id: 'r1', calls: 2 }] })).toEqual(['required answers.contacts[0].name'])
  })

  // A response's items are in the Questionnaire's order, whatever order
  // the submission's names come in: the validator refuses another
  // ("Structural Error: items are out of order", measured).
  test("writes the items in the Questionnaire's order", () => {
    const fields: FieldDef[] = [{ key: 'first', type: 'text' }, { key: 'second', type: 'text' }]
    expect(answered(form(fields), { second: 'b', first: 'a' }).item?.map((item) => item.linkId)).toEqual(['first', 'second'])
  })

  // Every item of a response is an item of its Questionnaire, at the same
  // place: the response is walked from the Questionnaire's own items, so
  // the two cannot disagree on a linkId, a nesting or a type.
  test("holds only the Questionnaire's items, where the Questionnaire has them", () => {
    const schema = form([page, contacts, urgency])
    const questionnaire = exported(schema)
    const response = answered(schema, { reason: 'x', address: { zip: '3000' }, contacts: [{ name: 'A' }], urgency: 'urgent' })
    const within = (items: readonly QuestionnaireResponseItem[], defined: readonly QuestionnaireItem[]): void => {
      for (const item of items) {
        const definition = defined.find((candidate) => candidate.linkId === item.linkId)
        expect(definition, item.linkId).toBeDefined()
        within(item.item ?? [], definition?.item ?? [])
      }
    }
    within(response.item ?? [], questionnaire.item ?? [])
  })

  // A submission's name its form does not have would be an item the
  // Questionnaire lacks (Questionnaire_QR_Item_NotFound, measured), or an
  // answer nobody asked for. Refused at the object that holds it, and the
  // name is never repeated: a submission's names are not the form's, and
  // may be anything, a person's included.
  test('refuses a name its form does not have, without repeating it', () => {
    const refusals = refusedAnswers(form([address, contacts]), { 'Erika Muster': 'x', address: { street: 'x' }, contacts: [{ _id: 'r1', Muster: 1 }] })
    expect(refusals).toEqual(['unknown answers', 'unknown answers.address', 'unknown answers.contacts[0]'])
  })

  // A page scopes no data in formancy: its key is no answer's name, and a
  // field inside a group is no name at the top.
  test("refuses a page's key and a grouped field's key at the top", () => {
    expect(refusedAnswers(form([page]), { step: {}, city: 'x' }, { ...RESPONDING, status: 'in-progress' })).toEqual(['unknown answers'])
  })

  // A group's value is an object, a repeater's a list of them; anything
  // else holds no answer the items could carry.
  test('refuses a group or a repeater that is not what it holds', () => {
    expect(refusedAnswers(form([address, contacts]), { address: 'Bern', contacts: [{ name: 'A' }, 'B'] })).toEqual(['answer-type answers.address', 'answer-type answers.contacts[1]'])
    expect(refusedAnswers(form([contacts]), { contacts: { name: 'A' } })).toEqual(['answer-type answers.contacts'])
  })

  // A repeater nobody added a row to is absent from formancy's value, or
  // null: no item, and, required, no answer.
  test('writes no item for a repeater absent or null, and refuses it required', () => {
    expect(answered(form([contacts]), {})).not.toHaveProperty('item')
    expect(answered(form([contacts]), { contacts: null })).not.toHaveProperty('item')
    expect(refusedAnswers(form([{ ...contacts, required: true }]), {})).toEqual(['required answers.contacts'])
  })

  test('refuses more rows than a repeater allows', () => {
    expect(refusedAnswers(form([{ ...contacts, maxItems: 1 }]), { contacts: [{ name: 'A' }, { name: 'B' }] })).toEqual(['bound answers.contacts'])
  })
})

describe('missing, null and suppressed answers', () => {
  const detail: FieldDef = { key: 'detail', type: 'text' }
  const shownWhenUrgent = ruled([urgency, detail], [{ target: 'detail', kind: 'visible', cel: "urgency == 'urgent'" }])

  // An item the other answers disable has no answer in R4, and the
  // validator refuses one (Questionnaire_QR_Item_NotEnabled2, measured).
  // formancy's engine clears a field when a visible rule hides it, and one
  // handed in with the form's initial value, and a renderer offers nobody
  // a hidden field (measured on @formancy/core 0.5.0); a value set while
  // it is hidden stays (measured in review): a host's, or the two readings
  // of the rule disagree. Omitted, nobody would know which; refused, the
  // host does.
  test('refuses a value on an item a visible rule disables', () => {
    expect(refusedAnswers(shownWhenUrgent, { urgency: 'routine', detail: 'typed' })).toEqual(['disabled answers.detail'])
    expect(answered(shownWhenUrgent, { urgency: 'urgent', detail: 'typed' }).item?.map((item) => item.linkId)).toEqual(['urgency', 'detail'])
    // A question refused is no answer to the conditions after it, so what
    // it would have enabled is refused beside it, the cause first (0007).
    expect(refusedAnswers(shownWhenUrgent, { urgency: 'URGENT', detail: 'typed' })).toEqual(['option answers.urgency', 'disabled answers.detail'])
  })

  // An empty value on a disabled item is no answer to suppress: null, and
  // a repeater's rows of nothing but their identity, which formancy pads
  // a repeater with.
  test('accepts a disabled item with no value, null and empty rows included', () => {
    expect(answered(shownWhenUrgent, { urgency: 'routine', detail: null }).item?.map((item) => item.linkId)).toEqual(['urgency'])
    const rows: FieldDef = { key: 'rows', type: 'repeater', fields: [{ key: 'note', type: 'text' }] }
    const hiddenRows = ruled([urgency, rows], [{ target: 'rows', kind: 'visible', cel: "urgency == 'urgent'" }])
    expect(answered(hiddenRows, { urgency: 'routine', rows: [{ _id: 'r1' }] }).item?.map((item) => item.linkId)).toEqual(['urgency'])
    expect(refusedAnswers(hiddenRows, { urgency: 'routine', rows: [{ _id: 'r1', note: 'typed' }] })).toEqual(['disabled answers.rows'])
  })

  // formancy keeps what was typed on a page a skip rule then walks past,
  // so that going back finds it, and neither shows nor validates it
  // (measured on @formancy/core 0.5.0); R4 gives the disabled page no
  // answer. It is left out: the answers a person submitted are those of
  // the pages they were taken through.
  test('leaves out what a skipped page holds', () => {
    const later: FieldDef = { key: 'later', type: 'page', fields: [{ key: 'phone', type: 'text', required: true }] }
    const schema = ruled([{ key: 'first', type: 'page', fields: [urgency] }, later], [{ target: 'later', kind: 'skip', cel: "urgency == 'routine'" }])
    expect(writeJson(answered(schema, { urgency: 'routine', phone: 'kept' }).item as never)).not.toContain('phone')
    expect(writeJson(answered(schema, { urgency: 'urgent', phone: 'kept' }).item as never)).toContain('"linkId":"phone"')
  })

  // `!=` with no answer enables its item in formancy, and in the
  // Questionnaire, which writes the unanswered case (conditions.ts): an
  // answer given then is written, not refused as disabled.
  test('writes an answer an unanswered != enables', () => {
    const schema = ruled([urgency, detail], [{ target: 'detail', kind: 'visible', cel: "urgency != 'routine'" }])
    expect(answered(schema, { detail: 'typed' }).item?.map((item) => item.linkId)).toEqual(['detail'])
  })

  // R4's required is "present in a 'completed' QuestionnaireResponse",
  // and the validator refuses a completed or amended response without it,
  // and only warns of another (measured for every status). A required
  // item the other answers disable is not required.
  test('refuses a required item unanswered in a completed or amended response, and in no other', () => {
    expect(refusedAnswers(form([reason]), {})).toEqual(['required answers.reason'])
    expect(refusedAnswers(form([reason]), { reason: '  ' }, { ...RESPONDING, status: 'amended' })).toEqual(['required answers.reason'])
    for (const status of ['in-progress', 'stopped', 'entered-in-error'] as const) expect(answered(form([reason]), {}, { ...RESPONDING, status })).not.toHaveProperty('item')
    const disabled = ruled([urgency, { ...detail, required: true }], [{ target: 'detail', kind: 'visible', cel: "urgency == 'urgent'" }])
    expect(answered(disabled, { urgency: 'routine' }).item?.map((item) => item.linkId)).toEqual(['urgency'])
  })

  // formancy requires a required field inside a group whether or not the
  // group holds anything; the validator does not look inside a group that
  // is absent (measured). formancy's reading is the stricter, and the
  // submission is formancy's.
  test('refuses a required field of a group that holds nothing', () => {
    const address: FieldDef = { key: 'address', type: 'group', fields: [{ key: 'city', type: 'text', required: true }] }
    expect(refusedAnswers(form([address]), {})).toEqual(['required answers.address.city'])
  })
})

describe('a refusal of answers', () => {
  // A refusal reaches a host's log, and every answer is a person's. Over
  // values shaped like a person's -- a name, a birth date, an insurance
  // number, a weight -- in every kind of refusal at once, none is quoted,
  // in a message or a path.
  test('never quotes an answer, in any refusal of any kind', () => {
    const fields: FieldDef[] = [
      { key: 'name', type: 'text', maxLength: 3 },
      { key: 'born', type: 'date' },
      { key: 'ahv', type: 'number', step: 1 },
      { key: 'weight', type: 'number', max: 300 },
      { key: 'canton', type: 'select', options: [option('BE', 'Bern')] },
      urgency,
      { key: 'detail', type: 'text' },
      { key: 'consent', type: 'checkbox' },
      { ...reason, key: 'required_reason' },
    ]
    const schema = ruled(fields, [{ target: 'detail', kind: 'visible', cel: "urgency == 'urgent'" }])
    const answers = { name: 'Erika Muster', born: '1987-02-29', ahv: 7561234567890, weight: 314.15926, canton: 'Hans Meier', urgency: 'routine', detail: 'Erika', consent: 'Muster', 'Hans Meier': 'x' }
    const result = toQuestionnaireResponse(schema, answers, { ...RESPONDING, subject: { reference: 'https://ehr.synthetic.invalid/Patient/756.1234.5678.90' } })
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.refusals.every((refusal) => refusal instanceof Refusal)).toBe(true)
    expect(new Set(result.refusals.map((refusal) => refusal.rule))).toEqual(new Set(['bound', 'calendar', 'range', 'option', 'disabled', 'answer-type', 'required', 'unknown', 'reference']))
    const values = ['Erika', 'Muster', '1987-02-29', '7561234567890', '314.15926', 'Hans', 'Meier', '756.1234', 'synthetic.invalid/Patient']
    for (const refusal of result.refusals) for (const value of values) expect(`${refusal.message} ${refusal.path}`).not.toContain(value)
  })
})
