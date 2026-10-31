import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, test } from 'vitest'
import { corpusProblems, issueKey, judge, refusals } from './judge.mjs'
import { warningProblems } from './registers.mjs'

/**
 * The validator gate's verdict (0005): nothing silent. An error refuses, a
 * warning refuses unless registered by its message id, a broken resource
 * must be refused for exactly what it breaks, and the run is held to the
 * pinned validator and the registered packages. Each rule is held here on
 * fixtures; the gate's run applies them to what the validator said.
 */

const repo = join(dirname(fileURLToPath(import.meta.url)), '..', '..')

const DOM6 = 'http://hl7.org/fhir/StructureDefinition/DomainResource#dom-6'
const warn = (id, expression = 'Questionnaire') => ({ severity: 'warning', code: 'invariant', id, expression, text: 'a warning' })
const error = (id, expression = 'Questionnaire') => ({ severity: 'error', code: 'structure', id, expression, text: 'an error' })
const info = (id) => ({ severity: 'information', code: 'informational', id, expression: 'Questionnaire', text: 'a note' })

const accepted = (file) => ({ file, expect: 'accepted' })
const broken = (file, expect, why = 'something') => ({ file, why, expect })
const outcome = (file, issues, version = '7.0.2') => ({ file, version, issues })

const PACKAGES = ['hl7.fhir.r4.core#4.0.1', 'hl7.fhir.uv.sdc#4.0.0']

/** judge() over `corpus` and `outcomes`, with no warning registered and the packages loaded as registered, unless `more` says otherwise. */
const run = (corpus, outcomes, more = {}) => judge({ corpus, outcomes, warnings: [], pinned: '7.0.2', registered: PACKAGES, loaded: PACKAGES, ...more })

/** dom-6 registered, as the real register has it. */
const DOM6_REGISTERED = { warnings: [{ id: DOM6, reason: 'r' }] }

describe('refusals', () => {
  // The rule in one line: errors, and warnings nobody accepted. A warning
  // without an id cannot be registered, so it always refuses.
  test('are errors and unregistered warnings, never information', () => {
    const registered = new Set([DOM6])
    const issues = [error('E'), warn(DOM6), warn('OTHER'), { ...warn(undefined), id: undefined }, info('I')]
    expect(refusals(issues, registered).map(issueKey)).toEqual([
      'error E at Questionnaire',
      'warning OTHER at Questionnaire',
      'warning code:invariant at Questionnaire',
    ])
  })
})

describe('an accepted resource', () => {
  // The gate's purpose: an error on a resource that should conform fails it.
  test('passes with only registered warnings and information, and fails on an error', () => {
    expect(run([accepted('q.json')], [outcome('q.json', [warn(DOM6), info('I')])], DOM6_REGISTERED).problems).toEqual([])
    expect(run([accepted('q.json')], [outcome('q.json', [error('Validation_VAL_Profile_Minimum')])]).problems).toEqual([
      'q.json is refused: error Validation_VAL_Profile_Minimum at Questionnaire: an error',
    ])
  })

  // A warning is accepted only by name. Without the register's entry it
  // refuses exactly as an error does, which is "nothing silent".
  test('fails on a warning the register does not name', () => {
    expect(run([accepted('q.json')], [outcome('q.json', [warn(DOM6), warn('Terminology_TX_Confirm_5')])], DOM6_REGISTERED).problems).toEqual([
      'q.json is refused: warning Terminology_TX_Confirm_5 at Questionnaire: a warning',
    ])
  })
})

describe('a broken resource', () => {
  const MISSING = { severity: 'error', id: 'Validation_VAL_Profile_Minimum', expression: 'Questionnaire' }

  // Refused for what it breaks is the gate watching that thing, and the
  // verdict the corpus asks for.
  test('passes when refused for exactly what it expects, however often the validator says it', () => {
    const result = run(
      [broken('b.json', [MISSING])],
      [outcome('b.json', [error('Validation_VAL_Profile_Minimum'), error('Validation_VAL_Profile_Minimum'), warn(DOM6)])],
      DOM6_REGISTERED,
    )
    expect(result.problems).toEqual([])
    expect(result.resources[0].verdict).toBe('as expected')
  })

  // The failure this file exists for: a resource broken on purpose that
  // the gate accepted means nothing is watching what it breaks.
  test('fails when the gate accepts it', () => {
    expect(run([broken('b.json', [MISSING], 'a required element missing')], [outcome('b.json', [warn(DOM6)])], DOM6_REGISTERED).problems).toEqual([
      'b.json is broken for a required element missing, and the gate accepted it: nothing is watching that',
    ])
  })

  // Refused for something else, it is not the resource its name says, and
  // the check it is named for may not be watching at all.
  test('fails when refused for something else as well, or not for what it expects', () => {
    expect(run([broken('b.json', [MISSING])], [outcome('b.json', [error('Validation_VAL_Profile_Minimum'), error('sdc-2')])]).problems).toEqual([
      'b.json was refused for error sdc-2 at Questionnaire as well, which it is not broken for',
    ])
    expect(run([broken('b.json', [MISSING])], [outcome('b.json', [error('sdc-2')])]).problems).toEqual([
      'b.json was not refused for error Validation_VAL_Profile_Minimum at Questionnaire, which it is broken for',
      'b.json was refused for error sdc-2 at Questionnaire as well, which it is not broken for',
    ])
  })

  // Where the validator says it matters as much as what: the same id at
  // another element is another fault.
  test('is matched by expression as well as by id', () => {
    expect(run([broken('b.json', [MISSING])], [outcome('b.json', [error('Validation_VAL_Profile_Minimum', 'Questionnaire.item[0]')])]).problems).toHaveLength(2)
  })

  // A JSON parser's issue has no message id; an expectation names its
  // issue type instead, and nothing else matches it.
  test('can expect an issue the validator gives no id, by its issue type', () => {
    const string = { severity: 'error', code: 'invalid', expression: 'QuestionnaireResponse.item[1].answer[0].value[x]' }
    const parsed = {
      severity: 'error',
      code: 'invalid',
      id: undefined,
      expression: string.expression,
      text: 'Error parsing JSON: the primitive value must be a number',
    }
    expect(run([broken('d.json', [string])], [outcome('d.json', [parsed])]).problems).toEqual([])
  })
})

describe('the run', () => {
  // A file the validator never judged would pass every rule above by
  // having no issues; and an outcome for no corpus file is somebody
  // else's resource in the run.
  test('fails for a corpus file with no outcome, a file judged twice, and an outcome for no corpus file', () => {
    const result = run([accepted('a.json'), accepted('b.json')], [outcome('a.json', []), outcome('a.json', []), outcome('c.json', [])])
    expect(result.problems).toEqual([
      'a.json has two outcomes',
      'c.json has an outcome but is no file of the corpus',
      'b.json has no outcome: the validator did not judge it',
    ])
  })

  // The claim names the validator; an outcome by another release is
  // another claim.
  test('fails for an outcome another validator wrote', () => {
    expect(run([accepted('a.json')], [outcome('a.json', [warn(DOM6)], '7.0.1')], DOM6_REGISTERED).problems).toEqual([
      'a.json was judged by validator 7.0.1, not by 7.0.2, which docs/release/validator.json pins',
    ])
  })

  // An entry no resource raised is a reason that no longer holds, and
  // would accept the warning silently the day something raises it.
  test('fails for a registered warning nothing raised', () => {
    const result = judge({
      corpus: [accepted('a.json')],
      outcomes: [outcome('a.json', [warn(DOM6)])],
      warnings: [
        { id: DOM6, reason: 'r' },
        { id: 'NOT_RAISED', reason: 'r' },
      ],
      pinned: '7.0.2',
      registered: PACKAGES,
      loaded: PACKAGES,
    })
    expect(result.problems).toEqual([
      'the registered warning NOT_RAISED was raised by no resource of the corpus: remove it from scripts/validator/warnings.json',
    ])
  })

  // The register is what a conformance claim says the run was judged
  // against; the validator's own load is what it was judged against. They
  // must be one list, both ways, and a console that names none is not a
  // match.
  test('fails when the packages loaded are not exactly the register’s, or are not said', () => {
    const one = [outcome('a.json', [])]
    expect(run([accepted('a.json')], one, { loaded: [...PACKAGES, 'hl7.terminology#7.5.0'] }).problems).toEqual([
      'the validator loaded hl7.terminology#7.5.0, which docs/release/ig-packages.json does not register',
    ])
    expect(run([accepted('a.json')], one, { loaded: ['hl7.fhir.r4.core#4.0.1'] }).problems).toEqual([
      'docs/release/ig-packages.json registers hl7.fhir.uv.sdc#4.0.0, which the validator did not load: remove it',
    ])
    expect(run([accepted('a.json')], one, { loaded: undefined }).problems).toEqual([
      'the validator’s console has no Package Summary line, so what it loaded cannot be told',
    ])
  })
})

describe('corpusProblems', () => {
  // A corpus that does not say what it expects cannot be judged: an empty
  // list would read as "refused for nothing", which every accepted
  // resource is.
  test('refuses a file twice, an expectation that names nothing, an issue without its parts, and a broken entry with no reason', () => {
    expect(corpusProblems([accepted('a.json'), accepted('a.json')])).toEqual(['a.json is in the corpus twice'])
    expect(corpusProblems([{ file: 'b.json', expect: [] }])).toEqual(["b.json expects neither 'accepted' nor any issue"])
    expect(corpusProblems([{ file: 'b.json', why: 'x', expect: [{ severity: 'information', id: 'X', expression: 'Q' }] }])).toHaveLength(1)
    expect(corpusProblems([{ file: 'b.json', why: 'x', expect: [{ severity: 'error', id: 'X', code: 'invalid', expression: 'Q' }] }])).toHaveLength(1)
    expect(corpusProblems([{ file: 'b.json', expect: [{ severity: 'error', id: 'X', expression: 'Q' }] }])).toEqual([
      'b.json is broken and does not say for what',
    ])
    expect(corpusProblems([{ file: 'B.JSON', expect: 'accepted' }])).toEqual(['B.JSON is not a lowercase .json file name'])
  })
})

describe('the warnings register', () => {
  // Read from the file the gate reads, so a malformed entry fails here
  // before it fails a run.
  test('holds an id and a reason for every entry, and each id once', () => {
    const { warnings } = JSON.parse(readFileSync(join(repo, 'scripts', 'validator', 'warnings.json'), 'utf8'))
    expect(warnings.length).toBeGreaterThan(0)
    expect(warningProblems(warnings)).toEqual([])
    expect(warningProblems([{ id: 'X', reason: '' }, { id: 'X', reason: 'r' }, { reason: 'r' }])).toEqual([
      'scripts/validator/warnings.json: X gives no reason it is accepted',
      'scripts/validator/warnings.json: X is registered twice',
      'scripts/validator/warnings.json: an entry names no message id',
    ])
  })
})
