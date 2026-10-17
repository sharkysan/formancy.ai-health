import { describe, expect, test } from 'vitest'
import { codeOf, known, needed, objectAt, optional, readItems, text, valueAt } from './host.js'
import { Refusals } from './refusals.js'
import { date } from './strings.js'
import { refusalOf } from './test-support.js'

/** The refusals `read` records, each as `rule path`. */
function refusedBy(read: (refusals: Refusals) => unknown): string[] {
  const refusals = new Refusals()
  read(refusals)
  return refusals.list.map((refusal) => `${refusal.rule} ${refusal.path}`)
}

describe('valueAt', () => {
  // A host's object is untrusted whatever its type says: a name it
  // inherits -- an object's own toString, a prototype a host's class
  // brings -- is no value of the host's, and read as one it would be
  // written into a resource as though the host had said it.
  test("reads an object's own property, and nothing it inherits", () => {
    expect(valueAt({ family: 'Beispiel' }, 'family')).toBe('Beispiel')
    expect(valueAt({}, 'toString')).toBeUndefined()
    expect(valueAt(Object.create({ family: 'Inherited' }), 'family')).toBeUndefined()
  })

  // What holds no value -- nothing, a string, null -- answers undefined,
  // so that a reader of a missing object refuses it as absent rather
  // than throwing a TypeError at the host.
  test('answers undefined for anything that is no object', () => {
    for (const holder of [undefined, null, 'family', 7]) expect(valueAt(holder, 'family')).toBeUndefined()
  })
})

describe('needed and optional', () => {
  // What the resource needs and the host did not give is refused as
  // absent, at its path, and never made up; what it gives is checked by
  // the primitive the caller names, at that path.
  test('refuse what is absent, and check what is there', () => {
    expect(refusedBy((refusals) => needed({}, 'birthDate', 'context.patient.birthDate', refusals, date))).toEqual(['absent context.patient.birthDate'])
    expect(refusedBy((refusals) => needed({ birthDate: '2026-02-30' }, 'birthDate', 'context.patient.birthDate', refusals, date))).toEqual(['calendar context.patient.birthDate'])
    const refusals = new Refusals()
    expect(needed({ birthDate: '1980-02-29' }, 'birthDate', 'context.patient.birthDate', refusals, date)).toBe('1980-02-29')
    expect(refusals.count).toBe(0)
  })

  // What R4 makes optional and the host leaves out is no refusal: the
  // resource is written without it.
  test('take an absent optional value as none, and check one that is there', () => {
    const refusals = new Refusals()
    expect(optional({}, 'birthDate', 'context.patient.birthDate', refusals, date)).toBeUndefined()
    expect(refusals.count).toBe(0)
    expect(refusedBy((each) => optional({ birthDate: '17.10.2026' }, 'birthDate', 'context.patient.birthDate', each, date))).toEqual(['grammar context.patient.birthDate'])
  })

  // A null is a value the host gave, and FHIR JSON has none outside an
  // array: taken as absent, an optional one would vanish from the resource
  // without a word, where the host meant to say something. It is handed
  // to the primitive, which refuses it.
  test('refuse a null rather than take it for absent', () => {
    expect(refusedBy((each) => optional({ birthDate: null }, 'birthDate', 'context.patient.birthDate', each, date))).toEqual(['grammar context.patient.birthDate'])
    expect(refusedBy((each) => needed({ birthDate: null }, 'birthDate', 'context.patient.birthDate', each, date))).toEqual(['grammar context.patient.birthDate'])
  })
})

describe('text', () => {
  // R4: a string of whitespace "could be trimmed to nothing, which would
  // be treated as an invalid element value"; a title or a name of spaces
  // says nothing, and is refused as nothing is.
  test('keeps a text, and refuses one of whitespace or no string at all as absent', () => {
    expect(text('Zuweisung', 'context.composition.title')).toBe('Zuweisung')
    for (const value of ['', ' \t\n', 7 as never]) expect(refusalOf(() => text(value, 'context.composition.title'))).toMatchObject({ rule: 'absent', path: 'context.composition.title' })
  })

  // The whitespace a string may hold, and every character but the few a
  // resource cannot carry, are kept as they are.
  test('keeps the tab, the line breaks and every character a resource can carry', () => {
    expect(text('Zeile\teins\nzwei\r', 'context.composition.title')).toBe('Zeile\teins\nzwei\r')
    expect(text('Grüezi, Ärztin ✓ 𝄞', 'context.patient.name.family')).toBe('Grüezi, Ärztin ✓ 𝄞')
  })

  // R4 says a string "SHOULD not contain Unicode character points below
  // 32" but the tab and the two line breaks, and a narrative refuses them
  // as XML does: a family name with a bell or a null written into a
  // Patient would be a string the narrative's own rule refuses, and no
  // XML form of the resource could carry it. A surrogate alone is no
  // character, and UTF-8, which R4's JSON is, cannot encode one. Each is
  // refused as a string's grammar, naming the path and never the text.
  test.each([
    ['a null', 'Beispiel\u0000'],
    ['a bell', 'Beispiel\u0007'],
    ['a vertical tab', 'Beispiel\u000b'],
    ['an escape', 'Beispiel\u001b'],
    ['U+FFFE', 'Beispiel￾'],
    ['U+FFFF', 'Beispiel￿'],
    ['a high surrogate alone', 'Beispiel\ud800'],
    ['a low surrogate alone', '\udc00Beispiel'],
  ])('refuses %s, which a resource cannot carry', (_, value) => {
    const refusal = refusalOf(() => text(value, 'context.patient.name.family'))
    expect(refusal).toMatchObject({ rule: 'grammar', path: 'context.patient.name.family', type: 'string' })
    expect(refusal.message).not.toContain('Beispiel')
  })
})

describe('known and objectAt', () => {
  // A host's object is read for the members its context names; one more
  // -- an address beside a name -- is something the host meant to send
  // and the resource would leave out without a word. It is refused once,
  // at the object that holds it, and its name, the host's, is not
  // repeated; the object is still read for what it names.
  test('read an object for its names, and refuse one with a member they do not name, once, without the name', () => {
    expect(refusedBy((each) => expect(known({ family: 'Beispiel' }, ['family', 'given'], 'context.patient.name', each)).toBe(true))).toEqual([])
    const refused = new Refusals()
    expect(known({ family: 'Beispiel', address: 'Synthetisch', telecom: '1' }, ['family'], 'context.patient.name', refused)).toBe(true)
    expect(refused.list.map((refusal) => `${refusal.rule} ${refusal.path}`)).toEqual(['unmapped context.patient.name'])
    expect(refused.list[0]?.message).not.toContain('address')
  })

  // Where an object belongs, anything else is no object to read: a
  // string, null, nothing, and an array, whose indices are no member
  // names a context gives.
  test.each([
    ['a string', 'Beispiel'],
    ['null', null],
    ['nothing', undefined],
    ['an array', [{ family: 'Beispiel' }]],
  ])('refuse %s as absent', (_, holder) => {
    expect(refusedBy((each) => expect(known(holder, ['family'], 'context.patient.name', each)).toBe(false))).toEqual(['absent context.patient.name'])
  })

  test('read the object a holder holds under a name, or refuse it where it is none', () => {
    const refusals = new Refusals()
    expect(objectAt({ name: { family: 'Beispiel' } }, 'name', ['family'], 'context.patient.name', refusals)).toEqual({ family: 'Beispiel' })
    expect(objectAt({ name: ['Beispiel'] }, 'name', ['family'], 'context.patient.name', refusals)).toBeUndefined()
    expect(refusals.list.map((refusal) => `${refusal.rule} ${refusal.path}`)).toEqual(['absent context.patient.name'])
  })
})

describe('readItems', () => {
  // A host's array may have holes, which JSON never does, and map, every
  // and some walk past them: a reader built on them neither reads nor
  // refuses the item there, and the resource is written with a gap, or
  // the next step trips on it. Every index is read, a hole's as nothing.
  test('reads every index of a list, a hole among them, at its own path', () => {
    const sparse: unknown[] = ['Synthetica']
    sparse[2] = 'Probus'
    const refusals = new Refusals()
    const read = readItems(sparse, 'context.patient.name.given', (name, at) => needed(sparse, name, at, refusals, text))
    expect(read).toEqual(['Synthetica', undefined, 'Probus'])
    expect(Object.hasOwn(read, '1')).toBe(true)
    expect(refusals.list.map((refusal) => `${refusal.rule} ${refusal.path}`)).toEqual(['absent context.patient.name.given[1]'])
  })

  test('reads nothing of an empty list', () => {
    expect(readItems([], 'context.serviceRequests', () => 'read')).toEqual([])
  })
})

describe('codeOf', () => {
  const statuses = ['active', 'completed'] as const

  // R4's required binding is the codes it lists and no other: one it does
  // not list is refused as unmapped, never taken for the nearest.
  test('keeps a code of the binding, and refuses one it does not list as unmapped', () => {
    expect(codeOf(statuses)('active', 'context.status')).toBe('active')
    expect(refusalOf(() => codeOf(statuses)('Active', 'context.status'))).toMatchObject({ rule: 'unmapped', path: 'context.status' })
    expect(refusalOf(() => codeOf(statuses)('', 'context.status'))).toMatchObject({ rule: 'grammar', path: 'context.status' })
  })
})
