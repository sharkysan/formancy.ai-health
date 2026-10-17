import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, test } from 'vitest'
import { javaMajor, validatorArguments } from './validator.mjs'
import { readRegisters } from './validator/registers.mjs'

/**
 * The validator gate's command line (0005), decided in one place: offline,
 * against the registered packages by exact version, the same on every
 * machine. That it runs, and what it finds, is the `validator` job's; this
 * holds the options the job's verdict rests on, which a change could drop
 * without any run failing -- a gate that reached tx.fhir.org would pass
 * just the same, on another day's terminology.
 */
const repo = join(dirname(fileURLToPath(import.meta.url)), '..')
const { packages } = readRegisters(repo)
const args = validatorArguments({ jar: 'v.jar', home: 'home', files: ['a.json', 'b.json'], packages, definitions: ['a.json'], output: 'out.json' })

/** The value after `flag`, for each time it appears. */
const after = (flag) => args.flatMap((value, index) => (value === flag ? [args[index + 1]] : []))

describe('the validator’s command line', () => {
  // Offline is three options, each closing one way out: no terminology
  // server, no terminology cache a person's earlier run left, and no HTTP
  // at all, which refuses the packages, profiles and "newest version"
  // lookups the validator otherwise makes.
  test('runs offline: no terminology server, no terminology cache, no HTTP', () => {
    expect(after('-tx')).toEqual(['n/a'])
    expect(after('-txCache')).toEqual(['n/a'])
    expect(args).toContain('-no-http-access')
  })

  // FHIR from the register's core, each guide by id#version from the
  // register and nothing else, and the package cache from the gate's own
  // home rather than the machine's.
  test('names FHIR and each guide as the register does, and the gate’s own home', () => {
    const core = packages.find((entry) => entry.loadedAs === 'core')
    expect(after('-version')).toEqual([core.version])
    expect(after('-ig')).toEqual([...packages.filter((entry) => entry.loadedAs === 'ig').map((entry) => `${entry.id}#${entry.version}`), 'a.json'])
    expect(args).toContain('-Duser.home=home')
  })

  // Messages in another language would be other text in every results
  // file, and a jurisdiction from the machine's locale (Germany, on the
  // machine this was written on) changes which rules apply.
  test('is the same on every machine: English messages, no jurisdiction, UTF-8', () => {
    expect(after('-locale')).toEqual(['en-US'])
    expect(after('-jurisdiction')).toEqual(['uv'])
    expect(args[0]).toBe('-Dfile.encoding=UTF-8')
  })

  // Without `check`, a QuestionnaireResponse is not compared with its
  // Questionnaire, and the corpus's two-answers case would be accepted.
  test('checks a QuestionnaireResponse against its Questionnaire', () => {
    expect(after('-questionnaire')).toEqual(['check'])
  })

  test('validates the files it is given and writes the outcomes where it is told', () => {
    expect(args.slice(args.indexOf('v.jar') + 1, args.indexOf('-version'))).toEqual(['a.json', 'b.json'])
    expect(after('-output')).toEqual(['out.json'])
  })
})

describe('javaMajor', () => {
  // The JAR's classes are version 61, Java 17; a Java 11 would fail inside
  // the validator with an UnsupportedClassVersionError instead of a
  // sentence.
  test('reads the major version of a modern and of a 1.x Java', () => {
    expect(javaMajor('openjdk version "17.0.4" 2022-07-19 LTS')).toBe(17)
    expect(javaMajor('openjdk version "25.0.4.1" 2026-08-18 LTS')).toBe(25)
    expect(javaMajor('java version "1.8.0_402"')).toBe(8)
    expect(javaMajor('no java here')).toBeUndefined()
  })
})
