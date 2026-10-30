import { decimal, Refusal, writeJson, type FhirJsonObject } from '@formancy/health-core'
import { describe, expect, test } from 'vitest'
import { toDocumentBundle, type DocumentContext } from './bundle.js'
import { toDocumentReference } from './document-reference.js'
import { bytesOf, CLINICAL_DOCUMENT, CONSULTATION, minimalPdf, NAMES, patient, practitioner, refusedAs } from './test-support.js'

/** The DocumentReference and the Binary of a PDF of `bytes`, the smallest by default, as the host makes them first. */
function attached(bytes = minimalPdf()) {
  const result = toDocumentReference(
    { bytes, profile: 'PDF' },
    {
      status: 'current',
      type: CONSULTATION,
      subject: { reference: NAMES.patient },
      date: '2026-10-17T10:00:00+02:00',
      title: 'Zuweisung',
      binary: { fullUrl: NAMES.binary },
    },
  )
  if (!result.ok || result.binary === undefined) throw new Error('the DocumentReference was refused')
  return { documentReference: result.documentReference as FhirJsonObject, binary: result.binary as FhirJsonObject }
}

/** A referral letter: its Composition, the patient, the author, the PDF's DocumentReference and the Binary of its bytes. */
function document(): DocumentContext {
  const { documentReference, binary } = attached()
  return {
    identifier: { system: 'urn:ietf:rfc:3986', value: NAMES.document },
    timestamp: '2026-10-17T10:05:00+02:00',
    composition: {
      fullUrl: NAMES.composition,
      status: 'final',
      type: CONSULTATION,
      subject: { reference: NAMES.patient },
      date: '2026-10-17T10:00:00+02:00',
      author: [{ reference: NAMES.practitioner }],
      title: 'Zuweisung',
      section: [{ title: 'Bericht', entry: [{ reference: NAMES.documentReference }] }],
    },
    entries: [
      { fullUrl: NAMES.patient, resource: patient() },
      { fullUrl: NAMES.practitioner, resource: practitioner() },
      { fullUrl: NAMES.documentReference, resource: documentReference },
      { fullUrl: NAMES.binary, resource: binary },
    ],
  }
}

/**
 * The narrative `document()`'s Composition carries, as writeJson writes
 * the div's text: its title and its section's, each a heading, in the
 * XHTML namespace.
 */
const NARRATIVE = '<div xmlns=\\"http://www.w3.org/1999/xhtml\\"><h1>Zuweisung</h1><h2>Bericht</h2></div>'

/** The Bundle of `context`, which must not be refused. */
function bundled(context: DocumentContext = document()) {
  const result = toDocumentBundle(context)
  if (!result.ok) throw new Error(`refused: ${result.refusals.map((refusal) => refusal.message).join('; ')}`)
  return result.bundle
}

/** `context` with its composition changed. */
const withComposition = (change: Record<string, unknown>, context = document()): DocumentContext => ({
  ...context,
  composition: { ...context.composition, ...change } as DocumentContext['composition'],
})

/** `context` with the entry at `index` replaced, or removed when `entry` is undefined. */
function withEntry(index: number, entry: DocumentContext['entries'][number] | undefined, context = document()): DocumentContext {
  const entries = [...context.entries]
  if (entry === undefined) entries.splice(index, 1)
  else entries[index] = entry
  return { ...context, entries }
}

describe('a document Bundle', () => {
  // R4's document: type document, the host's identifier with its system
  // and value (bdl-9), the host's timestamp (bdl-10) and the same instant
  // as meta.lastUpdated, which documents.html calls "when the document
  // bundle was assembled"; the Composition first (bdl-11), named by the
  // host's urn:uuid; then the host's entries, in its order, as given.
  test('is written exactly, the Composition first and the entries after it as given', () => {
    const context = document()
    const written = writeJson(bundled(context))
    const head =
      '{"resourceType":"Bundle","meta":{"lastUpdated":"2026-10-17T10:05:00+02:00"},' +
      `"identifier":{"system":"urn:ietf:rfc:3986","value":"${NAMES.document}"},"type":"document","timestamp":"2026-10-17T10:05:00+02:00",` +
      `"entry":[{"fullUrl":"${NAMES.composition}","resource":{"resourceType":"Composition",` +
      `"text":{"status":"generated","div":"${NARRATIVE}"},"status":"final",` +
      '"type":{"coding":[{"system":"http://terminology.hl7.org/CodeSystem/v2-0270","code":"CN","display":"Consultation"}]},' +
      `"subject":{"reference":"${NAMES.patient}"},"date":"2026-10-17T10:00:00+02:00","author":[{"reference":"${NAMES.practitioner}"}],"title":"Zuweisung",` +
      `"section":[{"title":"Bericht","entry":[{"reference":"${NAMES.documentReference}"}]}]}}`
    const entries = context.entries.map((entry) => `{"fullUrl":"${entry.fullUrl}","resource":${writeJson(entry.resource)}}`)
    expect(written).toBe(`${head},${entries.join(',')}]}`)
  })

  // The acceptance asks for it, and section 10 rests on it: nothing read
  // from a clock or a random source, nothing kept from the host's objects.
  // The same input gives the same bytes, and a host changing its objects
  // afterwards does not change a document already assembled, which R4
  // calls immutable.
  test('gives the same bytes for the same input, and keeps none of the host objects', () => {
    const context = document()
    const first = writeJson(bundled(context))
    expect(writeJson(bundled(document()))).toBe(first)
    const bundle = bundled(context)
    ;(context.entries[0]?.resource as { name: unknown[] }).name.push({ family: 'Changed' })
    expect(writeJson(bundle)).toBe(first)
  })

  // The package writes its own elements in R4's order, whatever order the
  // host's context names them in: a host that builds its context another
  // way -- a spread, a row's columns -- gets the same document, byte for
  // byte. The host's own resources are written as the host gave them.
  test("gives the same bytes whatever order the context's names are in", () => {
    const reversed = (value: unknown): unknown =>
      Array.isArray(value)
        ? value.map(reversed)
        : typeof value === 'object' && value !== null
          ? Object.fromEntries(
              Object.entries(value)
                .reverse()
                .map(([name, each]) => [name, name === 'resource' ? each : reversed(each)]),
            )
          : value
    expect(writeJson(bundled(reversed(document()) as DocumentContext))).toBe(writeJson(bundled()))
  })

  // What R4 makes optional is the host's to give: a Composition's
  // identifier, which documents.html says "is the same for all documents
  // that are derived from this composition", its category, a section's
  // code, and the ids.
  test("writes the host's optional elements where given, and no others", () => {
    const context = withComposition({
      id: 'referral-letter',
      identifier: { system: 'urn:ietf:rfc:3986', value: 'urn:uuid:00000000-0000-4000-8000-000000000007' },
      category: [CLINICAL_DOCUMENT],
    })
    const composition = bundled({ ...context, id: 'referral-document' })
    expect(composition.id).toBe('referral-document')
    expect(writeJson(composition.entry[0].resource)).toContain(
      `"resourceType":"Composition","id":"referral-letter","text":{"status":"generated","div":"${NARRATIVE}"},"identifier":{"system":"urn:ietf:rfc:3986","value":"urn:uuid:00000000-0000-4000-8000-000000000007"},"status":"final"`,
    )
    expect(writeJson(bundled().entry[0].resource)).not.toContain('"identifier"')
  })

  // A section's code, written as the host names it.
  test("writes a section's code", () => {
    const context = document()
    const section = { title: 'Bericht', code: CLINICAL_DOCUMENT, entry: [{ reference: NAMES.documentReference }] }
    expect(writeJson(bundled(withComposition({ section: [section] }, context)).entry[0].resource)).toContain(
      '"section":[{"title":"Bericht","code":{"coding":[{"system":"http://terminology.hl7.org/CodeSystem/v3-ActClass","code":"DOCCLIN","display":"clinical document"}]},"entry"',
    )
  })

  // A decimal in a host's resource keeps its digits through the Bundle:
  // its entries are read and written by health-core, never by JSON.parse.
  test("keeps a host resource's decimal as written", () => {
    const weight = {
      resourceType: 'Observation',
      status: 'final',
      code: { text: 'Synthetic' },
      subject: { reference: NAMES.patient },
      valueQuantity: { value: decimal('70.50', 'probe') },
    }
    const context = withComposition({
      section: [{ title: 'Befunde', entry: [{ reference: NAMES.documentReference }, { reference: 'urn:uuid:00000000-0000-4000-8000-000000000008' }] }],
    })
    const written = writeJson(
      bundled({ ...context, entries: [...context.entries, { fullUrl: 'urn:uuid:00000000-0000-4000-8000-000000000008', resource: weight }] }),
    )
    expect(written).toContain('"valueQuantity":{"value":70.50}')
  })
})

describe('what a document claims, and its narrative', () => {
  const CH_ORF_DOCUMENT = 'http://fhir.ch/ig/ch-orf/StructureDefinition/ch-orf-document'
  const CH_ORF_COMPOSITION = 'http://fhir.ch/ig/ch-orf/StructureDefinition/ch-orf-composition|3.0.2'

  // A guide that profiles a document asks the Bundle to claim its profile
  // -- CH ORF: "The FHIR Bundle.meta.profile shall include the value
  // http://fhir.ch/ig/ch-orf/StructureDefinition/ch-orf-document" -- and
  // without the claim the validator holds the Bundle to R4 alone. The host
  // names what each claims; written in R4's order of Meta, the
  // lastUpdated first.
  test('claims the profile the host names, for the Bundle and for the Composition', () => {
    const composition = bundled({ ...withComposition({ profile: CH_ORF_COMPOSITION }), profile: CH_ORF_DOCUMENT })
    expect(writeJson(composition)).toMatch(
      /^\{"resourceType":"Bundle","meta":\{"lastUpdated":"2026-10-17T10:05:00\+02:00","profile":\["http:\/\/fhir\.ch\/ig\/ch-orf\/StructureDefinition\/ch-orf-document"\]\},"identifier"/,
    )
    expect(writeJson(composition.entry[0].resource)).toContain(`{"resourceType":"Composition","meta":{"profile":["${CH_ORF_COMPOSITION}"]},"text":`)
    expect(writeJson(bundled())).not.toContain('"profile"')
  })

  // A profile is a canonical, which is a uri; anything else would be a
  // claim of nothing the validator could find.
  test('refuses a profile that is no uri', () => {
    expect(refusedAs(toDocumentBundle({ ...document(), profile: 'ch orf document' }))).toEqual(['grammar context.profile'])
    expect(refusedAs(toDocumentBundle(withComposition({ profile: '' })))).toEqual(['grammar context.composition.profile'])
  })

  // A guide that asks for the Composition's narrative -- CH ORF makes
  // Composition.text 1..1 -- gets one written from the Composition's own
  // elements, so "generated" is true of it: its title and each section's
  // title, and nothing a host wrote as markup. An ampersand or an angle
  // bracket in a title is text, escaped; written as it is, it would be
  // markup the host never wrote, or no XHTML at all.
  test("writes a generated narrative of the Composition's titles, each escaped", () => {
    const context = withComposition({
      title: 'Zuweisung & Bericht',
      section: [{ title: 'Befund <dringend>', entry: [{ reference: NAMES.documentReference }] }],
    })
    expect(writeJson(bundled(context).entry[0].resource)).toContain(
      '"text":{"status":"generated","div":"<div xmlns=\\"http://www.w3.org/1999/xhtml\\"><h1>Zuweisung &amp; Bericht</h1><h2>Befund &lt;dringend&gt;</h2></div>"}',
    )
  })

  // A title XML cannot carry -- a control character a host's database let
  // through -- would make the narrative no XML, which the validator
  // refuses; it is refused here, where the title stands, and never quoted,
  // by health-core's text, which holds a host's text to what a narrative
  // carries.
  test('refuses a title the narrative cannot carry, at its place', () => {
    const result = toDocumentBundle(
      withComposition({ title: 'Zuweisung\u0007', section: [{ title: 'Bericht\u0000', entry: [{ reference: NAMES.documentReference }] }] }),
    )
    expect(refusedAs(result)).toEqual(['grammar context.composition.title', 'grammar context.composition.section[0].title'])
    for (const refusal of result.ok ? [] : result.refusals) expect(refusal.message).not.toContain('Zuweisung')
  })
})

describe('what a document must be given', () => {
  // What the host hands over is untrusted whatever its type says: a
  // document that is no object is refused as absent, not read into a
  // TypeError.
  test('refuses a document that is no object', () => {
    expect(refusedAs(toDocumentBundle('document' as never))).toEqual(['absent context'])
  })

  // Each is the host's and nothing here makes one up: a document's
  // identifier "is never re-used", and one made here would be nobody's.
  test.each([
    ['identifier', 'absent context.identifier'],
    ['timestamp', 'absent context.timestamp'],
    ['composition', 'absent context.composition'],
    ['entries', 'absent context.entries'],
  ] as const)('refuses a document without its %s', (name, refused) => {
    const { [name]: _left, ...rest } = document()
    expect(refusedAs(toDocumentBundle(rest as DocumentContext))[0]).toBe(refused)
  })

  // Each refused for what it is, at its path.
  test.each([
    ['an identifier without its system, which bdl-9 asks for', { identifier: { value: NAMES.document } }, ['absent context.identifier.system']],
    ['an identifier without its value', { identifier: { system: 'urn:ietf:rfc:3986' } }, ['absent context.identifier.value']],
    ['a timestamp without its zone', { timestamp: '2026-10-17T10:05:00' }, ['zone context.timestamp']],
    ['a timestamp of a day alone, which an instant is not', { timestamp: '2026-10-17' }, ['grammar context.timestamp']],
    ['an id R4 does not allow', { id: 'referral document' }, ['grammar context.id']],
    ['entries that are no list', { entries: {} }, ['absent context.entries']],
  ])('refuses %s', (_, change, refused) => {
    expect(refusedAs(toDocumentBundle({ ...document(), ...change } as DocumentContext))).toEqual(refused)
  })

  // R4 asks of a Composition its status, type, date, author and title;
  // section 9 asks the subject and at least one section of entries. Each
  // missing is refused, never filled.
  test.each(['fullUrl', 'status', 'type', 'subject', 'date', 'author', 'title', 'section'] as const)('refuses a Composition without its %s', (name) => {
    const { [name]: _left, ...rest } = document().composition
    expect(refusedAs(toDocumentBundle({ ...document(), composition: rest as DocumentContext['composition'] }))).toEqual([`absent context.composition.${name}`])
  })

  test.each([
    ['a status R4 does not have', { status: 'current' }, ['unmapped context.composition.status']],
    ['a date without its zone', { date: '2026-10-17T10:00:00' }, ['zone context.composition.date']],
    ['no author', { author: [] }, ['absent context.composition.author']],
    ['no section', { section: [] }, ['absent context.composition.section']],
    // cmp-1: a section holds text, entries or sections, and this package writes no narrative.
    ['a section with no entry', { section: [{ title: 'Bericht', entry: [] }] }, ['absent context.composition.section[0].entry']],
    ['a section without its title', { section: [{ entry: [{ reference: NAMES.documentReference }] }] }, ['absent context.composition.section[0].title']],
    ['a section that is only its title', { section: ['Bericht'] }, ['absent context.composition.section[0]']],
    ['an id R4 does not allow', { id: 'a/b' }, ['grammar context.composition.id']],
    ['a fullUrl in capitals', { fullUrl: NAMES.composition.replace('urn:uuid:', 'URN:UUID:') }, ['grammar context.composition.fullUrl']],
    ['an identifier without its value', { identifier: { system: 'urn:ietf:rfc:3986' } }, ['absent context.composition.identifier.value']],
    // Refused for its type before the Bundle would call it dangling: a
    // Type/id names its type, and R4 allows an author only some.
    ['an author by Type/id of a type R4 does not allow', { author: [{ reference: 'Observation/1' }] }, ['reference context.composition.author[0].reference']],
  ])('refuses a Composition with %s', (_, change, refused) => {
    expect(refusedAs(toDocumentBundle(withComposition(change)))).toEqual(refused)
  })

  // A member the context does not name -- a Composition's confidentiality,
  // a coding's version, a section's mode, an entry's search -- is
  // something the host meant to send, and the Bundle left it out without
  // a word (found in H07's review). Each is refused as unmapped at the
  // object that holds it, by health-core's `known`, as health-ch refuses
  // its own context's, the member's name not repeated.
  test.each([
    ['the document', (given: DocumentContext) => ({ ...given, signature: { type: [] } }), 'unmapped context', 'signature'],
    [
      "the document's identifier",
      (given: DocumentContext) => ({ ...given, identifier: { ...given.identifier, use: 'official' } }),
      'unmapped context.identifier',
      'use',
    ],
    ['the Composition', (given: DocumentContext) => withComposition({ confidentiality: 'N' }, given), 'unmapped context.composition', 'confidentiality'],
    [
      "the Composition's identifier",
      (given: DocumentContext) => withComposition({ identifier: { system: 'urn:ietf:rfc:3986', value: NAMES.document, use: 'official' } }, given),
      'unmapped context.composition.identifier',
      'use',
    ],
    [
      "the Composition's type",
      (given: DocumentContext) => withComposition({ type: { ...CONSULTATION, version: '2.9' } }, given),
      'unmapped context.composition.type',
      'version',
    ],
    [
      'a category',
      (given: DocumentContext) => withComposition({ category: [{ ...CLINICAL_DOCUMENT, userSelected: true }] }, given),
      'unmapped context.composition.category[0]',
      'userSelected',
    ],
    [
      "the Composition's subject",
      (given: DocumentContext) => withComposition({ subject: { reference: NAMES.patient, display: 'Synthetica Beispiel' } }, given),
      'unmapped context.composition.subject',
      'display',
    ],
    [
      'an author',
      (given: DocumentContext) => withComposition({ author: [{ reference: NAMES.practitioner, type: 'Practitioner' }] }, given),
      'unmapped context.composition.author[0]',
      'type',
    ],
    [
      'a section',
      (given: DocumentContext) => withComposition({ section: [{ ...given.composition.section[0], mode: 'snapshot' }] }, given),
      'unmapped context.composition.section[0]',
      'mode',
    ],
    [
      'an entry',
      (given: DocumentContext) => withEntry(0, { ...given.entries[0], search: { mode: 'match' } } as never, given),
      'unmapped context.entries[0]',
      'search',
    ],
  ])('refuses a member %s does not name', (_, change, refused, name) => {
    const result = toDocumentBundle(change(document()))
    expect(refusedAs(result)).toEqual([refused])
    expect(result.ok ? '' : result.refusals[0]?.message).not.toContain(name)
  })

  // A host's array may have a hole, which JSON never has. Walked past,
  // one among the authors, the categories or the sections gave a Bundle
  // health-core's writer then refused, and one among the entries a
  // TypeError. Each is refused where it stands.
  test('refuses a hole in a list, at its index', () => {
    const holed = <T>(first: T, third: T): T[] => {
      const list: T[] = [first]
      list[2] = third
      return list
    }
    const author = { reference: NAMES.practitioner }
    expect(refusedAs(toDocumentBundle(withComposition({ author: holed(author, author) })))).toEqual(['absent context.composition.author[1]'])
    expect(refusedAs(toDocumentBundle(withComposition({ category: holed(CLINICAL_DOCUMENT, CLINICAL_DOCUMENT) })))).toEqual([
      'absent context.composition.category[1]',
    ])
    const section = document().composition.section[0]
    expect(refusedAs(toDocumentBundle(withComposition({ section: holed(section, section) })))).toEqual(['absent context.composition.section[1]'])
    const entry = { reference: NAMES.documentReference }
    expect(refusedAs(toDocumentBundle(withComposition({ section: [{ title: 'Bericht', entry: holed(entry, entry) }] })))).toEqual([
      'absent context.composition.section[0].entry[1]',
    ])
    const context = document()
    expect(refusedAs(toDocumentBundle({ ...context, entries: holed(context.entries[0] as never, context.entries[1] as never) }))).toContain(
      'absent context.entries[1]',
    )
  })
})

describe('the references inside a document', () => {
  // The acceptance: a dangling reference refuses the Bundle. A document
  // "SHALL include" every resource its Composition refers to, directly or
  // not, and a receiver that cannot resolve one cannot show the document.
  test("refuses a reference to an entry it does not hold, at the reference's path", () => {
    expect(refusedAs(toDocumentBundle(withEntry(0, undefined)))).toEqual([
      'dangling context.composition.subject.reference',
      'dangling context.entries[1].resource.subject.reference',
    ])
  })

  // A Type/id inside a document resolves against no base: the entries are
  // named by urn:uuid, so it names nothing the Bundle holds.
  test('refuses a reference by Type/id, which no entry of a document answers to', () => {
    expect(refusedAs(toDocumentBundle(withComposition({ subject: { reference: 'Patient/synthetic-1' } })))).toEqual([
      'dangling context.composition.subject.reference',
    ])
  })

  // R4 lets what the Composition's resources refer to stay outside the
  // document ("may also be included"); here every reference resolves
  // inside it (0008), so an entry's Type/id on the receiver's server is
  // refused as the Composition's own would be.
  test("refuses a host entry's reference by Type/id, which R4 would let point outside the document", () => {
    const { resource } = document().entries[2] as { resource: FhirJsonObject }
    const authored = { ...resource, author: [{ reference: 'Practitioner/synthetic-1' }] }
    expect(refusedAs(toDocumentBundle(withEntry(2, { fullUrl: NAMES.documentReference, resource: authored })))).toEqual([
      'dangling context.entries[2].resource.author[0].reference',
    ])
  })

  // An address is where to fetch a person's record, which is never this
  // package's to decide; a contained or a versioned reference is not one
  // by name either.
  test.each([
    ['an address', 'https://records.synthetic.invalid/Patient/1'],
    ['a contained resource', '#patient'],
    ['a version', 'Patient/1/_history/2'],
  ])("refuses %s in a host's entry", (_, reference) => {
    const { resource } = document().entries[2] as { resource: FhirJsonObject }
    expect(refusedAs(toDocumentBundle(withEntry(2, { fullUrl: NAMES.documentReference, resource: { ...resource, subject: { reference } } })))).toEqual([
      'reference context.entries[2].resource.subject.reference',
    ])
  })

  // What R4 allows an element to name is held where the reference
  // resolves: a Composition's author is a person, a device or an
  // organisation, and the Binary is the only thing an attachment's url
  // may name.
  test('refuses an author that resolves to a type R4 does not allow there', () => {
    expect(refusedAs(toDocumentBundle(withComposition({ author: [{ reference: NAMES.documentReference }] })))).toEqual([
      'reference context.composition.author[0].reference',
      'unreferenced context.entries[1]',
    ])
  })

  test('refuses a DocumentReference subject that resolves to a type R4 does not allow there', () => {
    const { resource } = document().entries[2] as { resource: FhirJsonObject }
    const context = withEntry(
      2,
      { fullUrl: NAMES.documentReference, resource: { ...resource, subject: { reference: NAMES.binary } } },
      withComposition({ subject: { reference: NAMES.patient } }),
    )
    expect(refusedAs(toDocumentBundle(context))).toContain('reference context.entries[2].resource.subject.reference')
  })

  // A reference that says what it names must name that.
  test("refuses a host's reference whose stated type is not what it resolves to", () => {
    const { resource } = document().entries[2] as { resource: FhirJsonObject }
    expect(
      refusedAs(
        toDocumentBundle(withEntry(2, { fullUrl: NAMES.documentReference, resource: { ...resource, subject: { reference: NAMES.patient, type: 'Group' } } })),
      ),
    ).toEqual(['reference context.entries[2].resource.subject.reference'])
  })

  // The attachment's url is the Bundle's own link to the bytes: it names
  // the Binary, or the document carries a PDF nobody can read.
  test('refuses an attachment url that names no entry, or one that is no Binary', () => {
    const context = document()
    const { resource } = context.entries[2] as unknown as { resource: { content: [{ attachment: FhirJsonObject }] } & FhirJsonObject }
    const pointing = (url: string) =>
      withEntry(2, { fullUrl: NAMES.documentReference, resource: { ...resource, content: [{ attachment: { ...resource.content[0].attachment, url } }] } })
    expect(refusedAs(toDocumentBundle(pointing('urn:uuid:00000000-0000-4000-8000-0000000000ff')))).toEqual([
      'dangling context.entries[2].resource.content[0].attachment.url',
      'unreferenced context.entries[3]',
    ])
    expect(refusedAs(toDocumentBundle(pointing(NAMES.patient)))).toEqual([
      'reference context.entries[2].resource.content[0].attachment.url',
      'unreferenced context.entries[3]',
    ])
    expect(refusedAs(toDocumentBundle(pointing('https://documents.synthetic.invalid/1.pdf')))).toEqual([
      'dangling context.entries[2].resource.content[0].attachment.url',
      'unreferenced context.entries[3]',
    ])
  })

  // R4 has strings called reference that are no Reference: an Expression's,
  // a DetectedIssue's and an Immunization's education's, each a uri. Read
  // as references, a host's resource that uses one would be refused.
  test("reads no uri called reference as a reference: an Expression's, a DetectedIssue's", () => {
    const issue = { resourceType: 'DetectedIssue', status: 'final', patient: { reference: NAMES.patient }, reference: 'https://guidance.synthetic.invalid/1' }
    const extension = {
      url: 'https://extensions.synthetic.invalid/condition',
      valueExpression: { language: 'text/fhirpath', reference: 'https://expressions.synthetic.invalid/1' },
    }
    const context = withComposition({
      section: [{ title: 'Bericht', entry: [{ reference: NAMES.documentReference }, { reference: 'urn:uuid:00000000-0000-4000-8000-000000000009' }] }],
    })
    const entries = [...context.entries, { fullUrl: 'urn:uuid:00000000-0000-4000-8000-000000000009', resource: { ...issue, extension: [extension] } }]
    expect(bundled({ ...context, entries }).entry).toHaveLength(6)
  })
})

describe('the entries of a document', () => {
  // documents.html: "The document bundle SHALL include only" the
  // Composition and what it refers to, directly or indirectly. An entry
  // nothing reaches is not part of the document, and dropping it silently
  // would hide a host's mistake.
  test('refuses an entry the Composition does not reach', () => {
    const extra = { fullUrl: 'urn:uuid:00000000-0000-4000-8000-00000000000a', resource: { resourceType: 'Organization', name: 'Synthetische Klinik' } }
    const context = document()
    expect(refusedAs(toDocumentBundle({ ...context, entries: [...context.entries, extra] }))).toEqual(['unreferenced context.entries[4]'])
  })

  // Reached through another entry is reached: the Binary is named by the
  // DocumentReference's attachment, never by the Composition itself.
  test('takes an entry reached only through another entry', () => {
    expect(bundled().entry.map((entry) => entry.fullUrl)).toEqual([NAMES.composition, NAMES.patient, NAMES.practitioner, NAMES.documentReference, NAMES.binary])
  })

  // An entry that refers to the Composition and that the Composition does
  // not refer to -- a Provenance, which R4 admits -- is not reached
  // forwards, and H06 writes none (0008).
  test('refuses an entry that only refers back to the Composition', () => {
    const provenance = {
      resourceType: 'Provenance',
      target: [{ reference: NAMES.composition }],
      recorded: '2026-10-17T10:05:00+02:00',
      agent: [{ who: { reference: NAMES.practitioner } }],
    }
    const context = document()
    expect(
      refusedAs(
        toDocumentBundle({ ...context, entries: [...context.entries, { fullUrl: 'urn:uuid:00000000-0000-4000-8000-00000000000b', resource: provenance }] }),
      ),
    ).toEqual(['unreferenced context.entries[4]'])
  })

  // One name, one entry: two entries of one fullUrl are two resources a
  // reference cannot tell apart (bdl-7).
  test('refuses two entries of one name, and an entry named as the Composition is', () => {
    const context = document()
    expect(refusedAs(toDocumentBundle(withEntry(1, { fullUrl: NAMES.patient, resource: practitioner() }, context)))).toEqual([
      'duplicate-entry context.entries[1].fullUrl',
      'dangling context.composition.author[0].reference',
    ])
    expect(refusedAs(toDocumentBundle(withEntry(1, { fullUrl: NAMES.composition, resource: practitioner() }, context)))).toContain(
      'duplicate-entry context.entries[1].fullUrl',
    )
  })

  // Each entry's resource is FHIR JSON with a type and, where it has one,
  // an id of R4's grammar; a host's resource health-core cannot write is
  // refused where health-core says, under the entry's path.
  test.each([
    ['no resourceType', { name: [{ family: 'Beispiel' }] }, 'absent context.entries[0].resource.resourceType'],
    ['a resourceType that is no type', { resourceType: 'patient' }, 'grammar context.entries[0].resource.resourceType'],
    ['an id R4 does not allow', { ...patient(), id: 'synthetic patient' }, 'grammar context.entries[0].resource.id'],
    ['a JavaScript number', { ...patient(), multipleBirthInteger: 2 }, 'javascript-number context.entries[0].resource.multipleBirthInteger'],
    ['an empty string', { ...patient(), gender: '' }, 'empty context.entries[0].resource.gender'],
  ])('refuses an entry with %s', (_, resource, refused) => {
    expect(refusedAs(toDocumentBundle(withEntry(0, { fullUrl: NAMES.patient, resource: resource as FhirJsonObject })))).toContain(refused)
  })

  test.each([
    ['a fullUrl that is an address', 'https://records.synthetic.invalid/Patient/1', 'grammar context.entries[0].fullUrl'],
    ['no fullUrl', undefined, 'absent context.entries[0].fullUrl'],
  ])('refuses an entry with %s', (_, fullUrl, refused) => {
    expect(refusedAs(toDocumentBundle(withEntry(0, { fullUrl, resource: patient() } as never)))).toContain(refused)
  })

  test('refuses an entry that is no object, or holds no resource', () => {
    expect(refusedAs(toDocumentBundle(withEntry(0, 'Patient' as never)))).toContain('absent context.entries[0]')
    expect(refusedAs(toDocumentBundle(withEntry(0, { fullUrl: NAMES.patient } as never)))).toContain('absent context.entries[0].resource')
    // FHIR JSON health-core writes, and no resource: a string, a list.
    expect(refusedAs(toDocumentBundle(withEntry(0, { fullUrl: NAMES.patient, resource: 'Patient' } as never)))).toContain('absent context.entries[0].resource')
    expect(refusedAs(toDocumentBundle(withEntry(0, { fullUrl: NAMES.patient, resource: [patient()] } as never)))).toContain(
      'absent context.entries[0].resource',
    )
  })
})

describe("what a document's attachments say of their bytes", () => {
  /** Another letter's PDF, of another length: its Binary is what a host could swap in. */
  const another = () => attached(bytesOf('%PDF-1.4\n%another synthetic letter\n%%EOF\n'))
  const ATTACHMENT = 'context.entries[2].resource.content[0].attachment'

  /** `document()`'s DocumentReference with its attachment changed. */
  function withAttachment(change: (attachment: Record<string, unknown>) => void): DocumentContext {
    const { resource } = document().entries[2] as { resource: FhirJsonObject }
    const content = resource['content'] as readonly [{ attachment: FhirJsonObject }]
    const attachment: Record<string, unknown> = { ...content[0].attachment }
    change(attachment)
    return withEntry(2, { fullUrl: NAMES.documentReference, resource: { ...resource, content: [{ attachment: attachment as FhirJsonObject }] } })
  }

  // A document is assembled from the host's resources, and a host can pair
  // a DocumentReference with another PDF's Binary: two letters' Binaries
  // swapped. The validator checks an attachment's size and hash against
  // its data and not against a Binary its url names ("not a directly
  // accessible link"), so without this the document would describe one
  // PDF and carry another, shown under the first one's title.
  test('refuses a DocumentReference whose size and hash are not those of the Binary it names', () => {
    expect(refusedAs(toDocumentBundle(withEntry(3, { fullUrl: NAMES.binary, resource: another().binary })))).toEqual([
      `mismatch ${ATTACHMENT}.size`,
      `mismatch ${ATTACHMENT}.hash`,
    ])
  })

  // The attachment and the Binary each say what the bytes are; a receiver
  // told application/pdf by one and something else by the other is told
  // two things.
  test("refuses a DocumentReference whose media type is not its Binary's", () => {
    const { binary } = attached()
    expect(refusedAs(toDocumentBundle(withEntry(3, { fullUrl: NAMES.binary, resource: { ...binary, contentType: 'application/octet-stream' } })))).toEqual([
      `mismatch ${ATTACHMENT}.contentType`,
    ])
  })

  // The same of bytes in the attachment itself, which the validator also
  // checks: a host's DocumentReference that claims another PDF's hash is
  // refused before a receiver would.
  test("refuses a host's attachment whose data is not the bytes its size and hash describe", () => {
    const { documentReference } = another()
    const claimed = (documentReference['content'] as readonly [{ attachment: FhirJsonObject }])[0].attachment
    const context = withAttachment((attachment) => {
      delete attachment['url']
      attachment['data'] = 'JVBERi0xLjcKJXN5bnRoZXRpYwolJUVPRgo='
      attachment['size'] = claimed['size']
      attachment['hash'] = claimed['hash']
    })
    const entries = context.entries.slice(0, 3)
    expect(refusedAs(toDocumentBundle({ ...context, entries }))).toEqual([`mismatch ${ATTACHMENT}.size`, `mismatch ${ATTACHMENT}.hash`])
  })

  // Bytes that are not base64Binary's one spelling cannot be counted or
  // hashed here, and are refused as health-core refuses them, at the
  // Binary's data.
  test('refuses bytes it cannot read, whose size and hash it cannot check', () => {
    const { binary } = attached()
    const spaced = `${String(binary['data']).slice(0, 8)} ${String(binary['data']).slice(8)}`
    expect(refusedAs(toDocumentBundle(withEntry(3, { fullUrl: NAMES.binary, resource: { ...binary, data: spaced } })))).toEqual([
      'grammar context.entries[3].resource.data',
    ])
  })

  // R4 makes an attachment's size and hash optional: one that says
  // neither claims nothing about the bytes, which are then not read here,
  // spelled as the host spelled them, and is attached as it is.
  test('takes an attachment that says neither a size nor a hash, and leaves its bytes unread', () => {
    const context = withAttachment((attachment) => {
      delete attachment['size']
      delete attachment['hash']
    })
    expect(bundled(context).entry).toHaveLength(5)
    const { binary } = attached()
    const spaced = `${String(binary['data']).slice(0, 8)} ${String(binary['data']).slice(8)}`
    expect(bundled(withEntry(3, { fullUrl: NAMES.binary, resource: { ...binary, data: spaced } }, context)).entry).toHaveLength(5)
  })

  // A host's resource is FHIR JSON and is not held here to R4's
  // definition of it: a content item that is no object, or whose
  // attachment is none, carries no bytes to check, and is the validator's
  // to refuse. It is passed over, not taken for an attachment.
  test('looks only at attachments that are objects', () => {
    const { resource } = document().entries[2] as { resource: FhirJsonObject }
    const context = withEntry(2, { fullUrl: NAMES.documentReference, resource: { ...resource, content: ['attachment', { attachment: 'attachment' }] } })
    expect(bundled({ ...context, entries: context.entries.slice(0, 3) }).entry).toHaveLength(4)
  })
})

describe('the refusals of a document', () => {
  // In the order the document holds them, element by element: a host
  // reading two refusals of one resource reads them as its resource reads,
  // and the same input gives the same list.
  test('are in the order the document holds what they refuse', () => {
    const { resource } = document().entries[2] as { resource: FhirJsonObject }
    const twice = {
      ...resource,
      subject: { reference: 'https://records.synthetic.invalid/Patient/1' },
      author: [{ reference: 'https://records.synthetic.invalid/Practitioner/2' }],
    }
    expect(refusedAs(toDocumentBundle(withEntry(2, { fullUrl: NAMES.documentReference, resource: twice })))).toEqual([
      'reference context.entries[2].resource.subject.reference',
      'reference context.entries[2].resource.author[0].reference',
    ])
  })

  // Every refusal at once, the context's, the Composition's and the
  // entries', so that a host fixes the document in one pass; and none of
  // them a value -- the names, the identifier, the address are what a
  // host's log must not hold.
  test('are every one at once, and quote no value', () => {
    const context = withEntry(1, {
      fullUrl: NAMES.practitioner,
      resource: {
        ...practitioner(),
        telecom: [{ system: 'url', value: 'Synthetica' }],
        managingOrganization: { reference: 'https://records.synthetic.invalid/Organization/Beispiel' },
      },
    })
    const result = toDocumentBundle({ ...withComposition({ date: 'Synthetica', title: '' }, context), identifier: { system: 'urn:ietf:rfc:3986' } as never })
    expect(refusedAs(result)).toEqual([
      'absent context.identifier.value',
      'grammar context.composition.date',
      'absent context.composition.title',
      'reference context.entries[1].resource.managingOrganization.reference',
    ])
    for (const refusal of result.ok ? [] : result.refusals) {
      expect(refusal).toBeInstanceOf(Refusal)
      for (const value of ['Synthetica', 'Beispiel', 'records.synthetic.invalid']) expect(refusal.message).not.toContain(value)
    }
  })
})
