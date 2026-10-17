import { describe, expect, test } from 'vitest'
import { bannerVersion, readConsole, readOutcome, readOutcomes } from './outcome.mjs'

/**
 * Reading what the HL7 FHIR validator said (0005), on OperationOutcomes
 * shaped as validator 7.0.2 wrote them with `-output` on 17 October 2026,
 * and on lines of its console as it printed them. The validator's formats
 * are not a contract, so each case is also a statement of what this reader
 * relies on.
 */

const BANNER = 'FHIR Validation tool Version 7.0.2 (Git# de3463393298). Built 2026-10-15T16:42:38.193Z (33 hours old)'

/** An extension as the validator writes one. */
const ext = (name, value, key = 'valueString') => ({ url: `http://hl7.org/fhir/StructureDefinition/${name}`, [key]: value })

/** An issue as the validator writes one, with its message id unless `id` is null. */
function issue(severity, id, expression, text = 'what the validator says', code = 'invariant') {
  return {
    extension: [ext('operationoutcome-issue-line', 1, 'valueInteger'), ext('operationoutcome-issue-col', 249, 'valueInteger'), ext('operationoutcome-issue-source', 'InstanceValidator'), ...(id === null ? [] : [ext('operationoutcome-message-id', id, 'valueCode')])],
    severity,
    code,
    details: { text },
    expression: [expression],
  }
}

/** An OperationOutcome for `file`, by the validator `banner` names. */
const outcome = (file, issues, banner = BANNER) => ({
  resourceType: 'OperationOutcome',
  extension: [{ url: 'http://hl7.org/fhir/tools/StructureDefinition/validator-version', valueString: banner }, ext('operationoutcome-file', file)],
  issue: issues,
})

describe('readOutcome', () => {
  // The file is how an outcome is matched to the corpus entry it judged.
  // The validator writes the platform's path; read with only `/`, every
  // Windows run would name a file nobody wrote.
  test('names the file by its base name, from a Windows path or a POSIX one', () => {
    expect(readOutcome(outcome('C:\\Work\\formancy.ai-health\\test-results\\validator\\corpus\\questionnaire.json', [])).file).toBe('questionnaire.json')
    expect(readOutcome(outcome('/home/runner/work/test-results/validator/corpus/bundle.json', [])).file).toBe('bundle.json')
  })

  // The message id is what an expectation and the warnings register name;
  // a reader that took the text instead would match English the next
  // release may reword. A JSON parser's issue has no id, and must read as
  // one without, not as an id of "undefined".
  test('reads each issue’s severity, type, message id and expression, and no id where there is none', () => {
    const read = readOutcome(
      outcome('q.json', [
        issue('warning', 'http://hl7.org/fhir/StructureDefinition/DomainResource#dom-6', 'Questionnaire'),
        issue('error', null, 'QuestionnaireResponse.item[1].answer[0].value[x]', 'Error parsing JSON: the primitive value must be a number', 'invalid'),
      ]),
    )
    expect(read.issues).toEqual([
      { severity: 'warning', code: 'invariant', id: 'http://hl7.org/fhir/StructureDefinition/DomainResource#dom-6', expression: 'Questionnaire', line: 1, column: 249, text: 'what the validator says' },
      { severity: 'error', code: 'invalid', id: undefined, expression: 'QuestionnaireResponse.item[1].answer[0].value[x]', line: 1, column: 249, text: 'Error parsing JSON: the primitive value must be a number' },
    ])
  })

  // A fatal issue is the validator giving up on a resource. Read as its
  // own severity, it would be neither an error nor a warning, and a gate
  // that refuses errors would let it through.
  test('reads a fatal issue as an error', () => {
    expect(readOutcome(outcome('q.json', [issue('fatal', 'X', 'Questionnaire')])).issues[0].severity).toBe('error')
  })

  // Which validator judged a resource is part of what a conformance claim
  // names; the outcome says it since 7.0.0.
  test('reads the validator version the outcome carries', () => {
    expect(readOutcome(outcome('q.json', [])).version).toBe('7.0.2')
    expect(readOutcome({ ...outcome('q.json', []), extension: [ext('operationoutcome-file', 'q.json')] }).version).toBeUndefined()
  })

  // Anything else is a format this reader does not know, and read as an
  // outcome with no issues it would be a resource accepted unjudged.
  test('refuses what is not an OperationOutcome, one that names no file, and an issue with no severity it knows', () => {
    expect(() => readOutcome({ resourceType: 'Bundle' })).toThrow(/expected an OperationOutcome/)
    expect(() => readOutcome({ resourceType: 'OperationOutcome', issue: [] })).toThrow(/names no file/)
    expect(() => readOutcome(outcome('q.json', [{ ...issue('error', 'X', 'Q'), severity: 'serious' }]))).toThrow(/no severity/)
  })
})

describe('readOutcomes', () => {
  // One file gives one OperationOutcome, several a Bundle of them; the gate
  // validates several, a person running the validator by hand often one.
  test('reads one OperationOutcome, or a Bundle of them, from text or parsed', () => {
    const bundle = { resourceType: 'Bundle', type: 'collection', entry: [{ resource: outcome('a.json', []) }, { resource: outcome('b.json', [issue('error', 'X', 'Q')]) }] }
    expect(readOutcomes(JSON.stringify(bundle)).map((read) => [read.file, read.issues.length])).toEqual([
      ['a.json', 0],
      ['b.json', 1],
    ])
    expect(readOutcomes(outcome('a.json', [])).map((read) => read.file)).toEqual(['a.json'])
    expect(() => readOutcomes({ resourceType: 'Parameters' })).toThrow(/neither an OperationOutcome nor a Bundle/)
  })
})

describe('readConsole', () => {
  // The Package Summary line is the only place the validator says what it
  // loaded, and the register is held to it. The rest is what a results
  // file records about the run.
  const CONSOLE = [
    BANNER,
    '  Java:   17.0.4 from C:\\Program Files\\Zulu\\zulu-17 on amd64 (64bit). 8160MB available',
    'Error fetching https://packages2.fhir.org/packages/hl7.terminology: Access to the internet is not allowed by local security policy',
    'Error fetching https://packages.fhir.org/hl7.terminology: Access to the internet is not allowed by local security policy',
    'Latest version of package hl7.terminology found locally is 7.4.0 - using that',
    '  Package Summary: [hl7.fhir.r4.core#4.0.1, hl7.terminology#7.4.0, hl7.fhir.uv.extensions.r4#5.3.0-ballot-tc1, hl7.fhir.uv.sdc#4.0.0]',
    'Done. Times: Loading: 00:21.055, validation: 00:01.972 (#10). Memory = 988Mb',
  ].join('\n')

  test('reads the version, the Java, the times, the packages loaded in order, and every refusal it printed', () => {
    expect(readConsole(CONSOLE)).toEqual({
      version: '7.0.2',
      java: '17.0.4',
      times: { loading: '00:21.055', validation: '00:01.972' },
      packages: ['hl7.fhir.r4.core#4.0.1', 'hl7.terminology#7.4.0', 'hl7.fhir.uv.extensions.r4#5.3.0-ballot-tc1', 'hl7.fhir.uv.sdc#4.0.0'],
      refused: 2,
    })
  })

  // No summary is not "loaded nothing": the gate must be able to tell the
  // two apart, or a register would pass against a run that never said.
  test('says nothing of packages when there is no Package Summary line', () => {
    expect(readConsole(BANNER).packages).toBeUndefined()
    expect(readConsole('').version).toBeUndefined()
  })

  test('reads the version from the banner alone', () => {
    expect(bannerVersion(BANNER)).toBe('7.0.2')
    expect(bannerVersion('something else')).toBeUndefined()
  })
})
