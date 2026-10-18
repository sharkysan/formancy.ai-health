import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, test } from 'vitest'
import { coveredPackages } from '../codecov-config.mjs'
import { gateJobs, readWorkflow } from '../workflows.mjs'
import { evaluateGates, gatesProblems, readGates } from './gates.mjs'

/**
 * The release gates' register (0011; formancy.ai-report 0014),
 * docs/release/gates.json: held to the repository -- every file a test of a
 * package with a suite or of the repository's guards, every job one gates.yml
 * runs, every document committed -- and the evaluator that says where a run
 * leaves each gate, which never calls a document passed, and never a gate
 * with a reason anything but open.
 */
const repo = join(dirname(fileURLToPath(import.meta.url)), '..', '..')

const here = {
  covered: coveredPackages(repo).map((entry) => entry.path),
  jobs: gateJobs(readWorkflow(repo)),
  exists: (path) => existsSync(join(repo, path)),
}

/** The real register with `change` applied to a copy, validated against this repository. */
function problemsWith(change) {
  const register = structuredClone(readGates(repo))
  change(register.gates)
  return gatesProblems(register, here)
}

const gate = (gates, id) => gates.find((entry) => entry.gate === id)

describe('docs/release/gates.json', () => {
  // A validator that only ever saw fixtures proves nothing about the
  // committed file, and the report fails a run whose register does not hold.
  test('holds against this repository', () => {
    expect(gatesProblems(readGates(repo), here)).toEqual([])
  })

  // 0.1.0's gates (plan 17.4) rest on what this repository can run: G2,
  // G3, the dependency-licence guard and the trademark guard pass in a run
  // or fail it. G1, G5 and G6 are partly evidenced -- G1 as 0.1.0 reads it,
  // the install gate over every published package at exact upstream
  // versions, with no browser bundle and no copied file a gate holds -- and
  // what they have must pass all the same; a G1 without its reason would be
  // printed as passed in every report, the browser bundle and all. G4, G7,
  // the rehearsal and the legal review wait, each for its reason. Read from
  // the committed register, so a gate closed by an edit there, or given
  // evidence it does not have, changes this test with it.
  test('rests G2, G3, the licences and the trademark on evidence alone, and keeps the rest open', () => {
    const gates = readGates(repo).gates
    expect(gates.filter((entry) => entry.open === undefined).map((entry) => entry.gate)).toEqual(['G2', 'G3', 'licences', 'trademark'])
    expect(gates.filter((entry) => entry.evidence !== undefined && entry.open !== undefined).map((entry) => entry.gate)).toEqual(['G1', 'G5', 'G6'])
    expect(gates.filter((entry) => entry.evidence === undefined).map((entry) => entry.gate)).toEqual(['G4', 'G7', 'rehearsal', 'legal'])
    // G1 is the install gate over every published package; G2 the validator
    // gate, whose job and whose registers' test both have to pass; the
    // trademark gate the guard 0003 names.
    expect(gate(gates, 'G1').evidence).toEqual(expect.arrayContaining([{ job: 'install' }, { file: 'scripts/upstream-deps.test.mjs' }]))
    expect(gate(gates, 'G2').evidence).toEqual(expect.arrayContaining([{ job: 'validator' }, { file: 'scripts/validator/registers.test.mjs' }, { file: 'scripts/validator/judge.test.mjs' }]))
    expect(gate(gates, 'G3').evidence).toEqual(expect.arrayContaining([{ file: 'packages/health-core/src/exactness.test.ts' }, { file: 'scripts/exact-and-reproducible.test.mjs' }]))
    expect(gate(gates, 'licences').evidence).toEqual(expect.arrayContaining([{ job: 'verify' }, { file: 'scripts/dependency-licences.test.mjs' }]))
    expect(gate(gates, 'trademark').evidence).toEqual([{ file: 'scripts/trademark.test.mjs' }])
  })

  // The plan's gates and 0.1.0's; a gate dropped from the register is one
  // the report never shows as open, stated or passed.
  test('fails without one of the gates, or with them out of order', () => {
    expect(problemsWith((gates) => gates.splice(4, 1))).toEqual([
      'the gates are G1, G2, G3, G4, G6, G7, licences, trademark, rehearsal, legal, where the plan has G1, G2, G3, G4, G5, G6, G7, licences, trademark, rehearsal and legal, each once and in order',
    ])
    expect(problemsWith((gates) => gates.reverse())[0]).toMatch(/^the gates are legal, rehearsal, /)
  })

  // A gate with nothing to say is one the report cannot place; an empty
  // list of evidence reads as evidence that passed.
  test('fails a gate with neither evidence nor a reason, and an empty list of evidence', () => {
    expect(problemsWith((gates) => delete gate(gates, 'G7').open)).toEqual(['gate G7 has neither evidence nor a reason it is open; it needs one or both'])
    expect(problemsWith((gates) => (gate(gates, 'G4').evidence = []))).toEqual(['gate G4 has an empty list of evidence; leave it out instead'])
  })

  // A file renamed, or one outside a package with a suite and the guards,
  // would be evidence no run can ever pass -- or one that never runs at all.
  test('fails file evidence that is not a test a run reports on', () => {
    const renamed = (gates) => (gate(gates, 'G3').evidence = gate(gates, 'G3').evidence.map((item) => (item.file === 'packages/health-core/src/exactness.test.ts' ? { file: 'packages/health-core/src/exactnes.test.ts' } : item)))
    expect(problemsWith(renamed)).toEqual(["gate G3's evidence: packages/health-core/src/exactnes.test.ts is not a test file of a package with a suite or of the repository's guards"])
    expect(problemsWith((gates) => gate(gates, 'G3').evidence.push({ file: 'packages/health-core/src/numbers.ts' }))).toEqual([
      "gate G3's evidence: packages/health-core/src/numbers.ts is not a test file of a package with a suite or of the repository's guards",
    ])
  })

  // Each other kind names something a run can produce, or a committed file;
  // the demo's browser gate is evidence about the demo, not about a
  // release gate, so it is no kind of evidence here.
  test('fails a job or a document that is not there, and an unknown kind', () => {
    expect(problemsWith((gates) => gate(gates, 'G1').evidence.push({ job: 'report' }))).toEqual(["gate G1's evidence: report is not a job of .github/workflows/gates.yml that leaves results"])
    expect(problemsWith((gates) => gate(gates, 'G2').evidence.push({ document: 'docs/release/figures.md' }))).toEqual(["gate G2's evidence: docs/release/figures.md is not a committed file"])
    expect(problemsWith((gates) => gate(gates, 'G2').evidence.push({ browserGate: 'apps/viewer' }))).toEqual([`gate G2's evidence: {"browserGate":"apps/viewer"} is not exactly one of file, job, document`])
    expect(problemsWith((gates) => gate(gates, 'G2').evidence.push({ file: 'a.test.ts', job: 'verify' }))).toEqual([`gate G2's evidence: {"file":"a.test.ts","job":"verify"} is not exactly one of file, job, document`])
  })

  // The plan is a working document kept out of the repository; a gate's
  // wording copied into the register would publish it.
  test('carries no gate’s wording', () => {
    expect(problemsWith((gates) => (gate(gates, 'G1').says = 'Install gate over packed tarballs.'))).toEqual([
      "gate G1 carries \"says\", and a gate carries only its id, its evidence and why it is open: the plan's wording stays out of the repository",
    ])
  })
})

describe('evaluateGates', () => {
  const run = (overrides = {}) => ({ fileOutcome: () => 'passed', needs: { install: { result: 'success' } }, documents: {}, ...overrides })
  const history = { sha: 'abcdef1234567890abcdef1234567890abcdef12', date: '2026-10-14T10:00:00Z', behind: 4 }

  // A document from another commit read as "passed in this run" would be a
  // claim the run never checked, reported as if it had.
  test('gives a gate whose only evidence is a document the state stated, never passed', () => {
    const [stated] = evaluateGates({ gates: [{ gate: 'G2', evidence: [{ document: 'docs/release/README.md' }] }] }, run({ documents: { 'docs/release/README.md': history } }))
    expect(stated).toEqual({ gate: 'G2', state: 'stated', evidence: [{ kind: 'document', value: 'docs/release/README.md', outcome: 'stated', history }] })
  })

  // Evidence that ran and passed passes the gate; one item that did not
  // fails it, and a document beside them neither helps nor hurts.
  test('passes a gate only when every item that runs passed', () => {
    const register = { gates: [{ gate: 'G1', evidence: [{ job: 'install' }, { document: 'docs/release/README.md' }] }, { gate: 'G2', evidence: [{ file: 'a.test.ts' }] }] }
    expect(evaluateGates(register, run()).map((entry) => entry.state)).toEqual(['passed', 'passed'])
    expect(evaluateGates(register, run({ needs: { install: { result: 'failure' } } }))[0].evidence[0]).toEqual({ kind: 'job', value: 'install', outcome: 'failed', result: 'failure' })
    expect(evaluateGates(register, run({ fileOutcome: () => 'absent' }))[1]).toMatchObject({ state: 'failed', evidence: [{ kind: 'file', value: 'a.test.ts', outcome: 'absent' }] })
  })

  // Locally there are no needs: a job's evidence did not run, which is not a pass.
  test('leaves a job unpassed where there are no needs', () => {
    const [g1] = evaluateGates({ gates: [{ gate: 'G1', evidence: [{ job: 'install' }] }] }, run({ needs: null }))
    expect(g1).toMatchObject({ state: 'failed', evidence: [{ outcome: 'absent', local: true }] })
  })

  // A gate with a reason is open, whatever its evidence: G5's refusals of a
  // spec version, a field type and a dangling reference passing is not a
  // refusal of a guide version nothing reads. And the evidence it has still
  // has to pass, or a partly evidenced gate would hide a failure behind its
  // reason.
  test('keeps a gate with a reason open, and fails it when the evidence it has did not pass', () => {
    const register = { gates: [{ gate: 'G5', evidence: [{ file: 'a.test.ts' }], open: 'Partly.' }, { gate: 'G4', open: 'Later.' }] }
    expect(evaluateGates(register, run())).toEqual([
      { gate: 'G5', state: 'open', open: 'Partly.', evidence: [{ kind: 'file', value: 'a.test.ts', outcome: 'passed' }] },
      { gate: 'G4', state: 'open', open: 'Later.', evidence: [] },
    ])
    expect(evaluateGates(register, run({ fileOutcome: () => 'failed' }))[0].state).toBe('failed')
  })
})
