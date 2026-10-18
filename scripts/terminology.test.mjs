import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { describe, expect, test } from 'vitest'
// LOINC's notice, verbatim from its licence: scripts/notices.mjs, which the demo's page renders too.
import { LOINC_NOTICE } from './notices.mjs'
import { corpus } from './validator/corpus.mjs'

/**
 * Every code system a resource here writes is one whose terms allow it
 * (plan 15.3; 0009). CLAUDE.md: terminology joins a guard with the first
 * code a package emits, and health-ch writes the first of a third party's,
 * LOINC 93037-0, which CH ORF fixes.
 *
 * Derived from the data, never from wording: every Coding -- an object
 * with a `system` and a `code` -- in every resource of the validator
 * gate's corpus, which holds what the packages, as built, write of the
 * synthetic forms, submissions, letters and referrals, and the resources
 * built by hand beside them. Each system must be one of:
 *
 * - **HL7's own**: FHIR R4's code systems under `http://hl7.org/fhir/`,
 *   in hl7.fhir.r4.core, and HL7 Terminology's under
 *   `http://terminology.hl7.org/CodeSystem/`, in hl7.terminology.r4, both
 *   CC0-1.0 as their packages say (docs/release/ig-packages.json).
 * - **LOINC**, each code recorded here with the reason it is written
 *   and with its LOINC display name, which every coding of it must carry,
 *   and only while NOTICE carries LOINC's notice word for word: its
 *   licence asks both of software that carries LOINC content -- the
 *   notice, and that content "must always be associated with the
 *   corresponding identifier from LOINC ... and include the corresponding
 *   LOINC display name" (https://loinc.org/license/, section 10, read on
 *   17 October 2026).
 * - **SNOMED CT**, each code recorded here with the decision that admits
 *   it. None is: whether a constant needs an affiliate licence for this
 *   repository's distribution is eHealth Suisse's question, asked before
 *   H10 (plan 15.3), and a host sends its own under its own licence.
 * - **A host's own**, named under a domain reserved for examples (RFC
 *   2606, RFC 6761): the synthetic code systems a form's options are
 *   coded in, under the corpus's base.
 *
 * What it cannot see: a code a package writes that no corpus resource
 * holds, which review holds, and whether a code under a system it admits
 * is one the system has, which the validator checks for HL7's own and
 * nothing here checks for LOINC. It reads `packages/*\/dist`, so it needs
 * `pnpm build`, as the corpus guard does.
 */
const repo = join(dirname(fileURLToPath(import.meta.url)), '..')
const built = (name) => join(repo, 'packages', name, 'dist', 'index.mjs')
const NAMES = ['health-core', 'health-questionnaire', 'health-corpus', 'health-ch']
if (!NAMES.every((name) => existsSync(built(name)))) throw new Error('scripts/terminology.test.mjs reads the packages as built: run pnpm build first')
const [core, questionnaire, documents, ch] = await Promise.all(NAMES.map((name) => import(pathToFileURL(built(name)).href)))
const entries = corpus({ core, questionnaire, documents, pdf: await documents.renderReferral(), ch })

/**
 * Each LOINC code a resource here may hold, why, and the LOINC display
 * name every coding of it carries: the long common name, as LOINC 2.82
 * gives it (HL7's terminology server's `$lookup`, read on 17 October
 * 2026). A code LOINC does not have has no name, and is written with none.
 */
const LOINC_CODES = new Map([
  ['93037-0', { name: 'Portable medical order form', why: "health-ch's order-referral section: CH ORF 3.0.2's ch-orf-composition fixes it by the pattern of Composition.section:orderReferral.code (0009)" }],
  ['0000-0', { name: undefined, why: "a code that does not exist (tx.fhir.org: \"Unknown code '0000-0'\"), in hand-built resources broken to show the validator does not check LOINC offline and in the CH ORF document broken for its section's code (0005, 0009)" }],
])

/** Each SNOMED CT code a resource here may hold, and the decision that admits it: none. */
const SNOMED_CT_CODES = new Map()

/** Whether `text` holds `sentence` word for word, wherever its lines break. */
const holds = (text, sentence) => text.replace(/\s+/g, ' ').includes(sentence)

/** A domain RFC 2606 and RFC 6761 reserve for examples, documentation and tests. */
const RESERVED = /^(?:[a-z0-9-]+\.)*(?:example\.(?:org|com|net)|[a-z0-9-]+\.(?:invalid|example|test))$/

/** Why a coding of `system`, `code` and `display` may stand in a resource here, or undefined where nothing admits it. */
function admitted(system, code, display, notice) {
  if (system.startsWith('http://hl7.org/fhir/')) return "FHIR R4's own, CC0-1.0"
  if (system.startsWith('http://terminology.hl7.org/CodeSystem/')) return "HL7 Terminology's, CC0-1.0"
  if (system === 'http://loinc.org') {
    const recorded = LOINC_CODES.get(code)
    return holds(notice, LOINC_NOTICE) && recorded !== undefined && display === recorded.name ? recorded.why : undefined
  }
  if (system === 'http://snomed.info/sct') return SNOMED_CT_CODES.get(code)
  const host = /^https?:\/\/([^/]+)\//.exec(system)?.[1]
  return host !== undefined && RESERVED.test(host) ? 'a host’s own, under a domain reserved for examples' : undefined
}

/** Every Coding in `value`, as `{ system, code, display }`. */
function codings(value, into = []) {
  if (Array.isArray(value)) for (const each of value) codings(each, into)
  else if (typeof value === 'object' && value !== null && !core.isFhirNumber(value)) {
    if (typeof value.system === 'string' && typeof value.code === 'string') into.push({ system: value.system, code: value.code, display: value.display })
    for (const each of Object.values(value)) codings(each, into)
  }
  return into
}

/** What is wrong with the codings of `resources`, `{ file, resource }` each, under `notice`, NOTICE's text: one sentence per code nothing admits. */
function problems(resources, notice) {
  const found = new Set()
  for (const { file, resource } of resources) {
    for (const { system, code, display } of codings(resource)) if (admitted(system, code, display, notice) === undefined) found.add(`${file}: ${system}|${code}`)
  }
  return [...found]
}

const notice = readFileSync(join(repo, 'NOTICE'), 'utf8')

describe('the terminology the packages write', () => {
  // The real corpus, every resource of it: a code system a package starts
  // to write, or a code of LOINC or SNOMED CT nobody recorded, fails here
  // until its terms are read and it is recorded.
  test('is HL7’s, LOINC’s with its notice, recorded, or a host’s own', () => {
    expect(problems(entries, notice), 'record each code with the terms that admit it, or do not write it').toEqual([])
  })

  // A guard on the guard: the assertion is about absence, so a walk that
  // found no coding would pass it forever. The corpus holds HL7's codes,
  // a host's, and the one LOINC code health-ch writes.
  test('reads the codings of the corpus', () => {
    const systems = new Set(entries.flatMap(({ resource }) => codings(resource).map(({ system }) => system)))
    expect([...systems]).toEqual(expect.arrayContaining(['http://loinc.org', 'http://terminology.hl7.org/CodeSystem/v2-0203', 'http://hl7.org/fhir/version-algorithm', 'https://forms.synthetic.invalid/Questionnaire/referral-intake/topics']))
  })

  // Each rule, shown refusing on a fixture: a SNOMED CT code no decision
  // records, a LOINC code without its notice, its display name or a
  // record, and a code system that is none of these -- a real domain's.
  // The probes are themselves no terminology's content: SNOMED CT's is a
  // word, where every SNOMED CT identifier is digits alone, and LOINC's
  // unrecorded one has a wrong check digit -- 0000 gives 0 -- so is no
  // LOINC code.
  test('refuses SNOMED CT unrecorded, LOINC without its notice, its name or a record, and a system it does not know', () => {
    const resource = (system, code, display) => [{ file: 'probe.json', resource: { resourceType: 'Composition', type: { coding: [{ system, code, ...(display === undefined ? {} : { display }) }] } } }]
    const NAME = 'Portable medical order form'
    expect(problems(resource('http://snomed.info/sct', 'no-concept'), notice)).toEqual(['probe.json: http://snomed.info/sct|no-concept'])
    expect(problems(resource('http://loinc.org', '93037-0', NAME), notice)).toEqual([])
    expect(problems(resource('http://loinc.org', '93037-0', NAME), notice.replace('LOINC® is a registered', 'LOINC is a registered'))).toEqual(['probe.json: http://loinc.org|93037-0'])
    expect(problems(resource('http://loinc.org', '93037-0'), notice)).toEqual(['probe.json: http://loinc.org|93037-0'])
    expect(problems(resource('http://loinc.org', '93037-0', 'Order form'), notice)).toEqual(['probe.json: http://loinc.org|93037-0'])
    expect(problems(resource('http://loinc.org', '0000-1'), notice)).toEqual(['probe.json: http://loinc.org|0000-1'])
    expect(problems(resource('http://fhir.ch/ig/ch-term/CodeSystem/bfs-medstats-21-encountertype', '1'), notice)).toEqual(['probe.json: http://fhir.ch/ig/ch-term/CodeSystem/bfs-medstats-21-encountertype|1'])
    expect(problems(resource('https://forms.synthetic.invalid/Questionnaire/intake/colour', 'red'), notice)).toEqual([])
    expect(problems(resource('https://forms.example.ch/Questionnaire/intake/colour', 'red'), notice)).toEqual(['probe.json: https://forms.example.ch/Questionnaire/intake/colour|red'])
  })
})
