// The two registers a conformance claim rests on (0005), read and held to
// their shape: docs/release/validator.json, the validator the gate runs, and
// docs/release/ig-packages.json, every FHIR package it loads. What each
// field means is in each file's `$comment`; what holds them is
// scripts/validator/registers.test.mjs, against the downloaded files where
// they are present, and the validator job, which runs nothing a register
// does not name and refuses a run that loaded anything else.

import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spdxAllows } from '../dependency-licences.mjs'

const repo = join(dirname(fileURLToPath(import.meta.url)), '..', '..')

export const VALIDATOR_PIN = 'docs/release/validator.json'
export const IG_PACKAGES = 'docs/release/ig-packages.json'
export const WARNINGS = 'scripts/validator/warnings.json'

/** A released version and nothing else: no range, no tag, no `current`. */
const EXACT = /^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?$/
const SHA256 = /^[0-9a-f]{64}$/
const PACKAGE_ID = /^[a-z0-9][a-z0-9-]*(\.[a-z0-9-]+)+$/
const LOADED_AS = ['core', 'ig', 'dependency']

const readJson = (root, file) => JSON.parse(readFileSync(join(root, file), 'utf8'))

/** `id#version`, as the validator and its package cache name a package. */
export const packageKey = (entry) => `${entry.id}#${entry.version}`

/**
 * Licences the dependency policy refuses, admitted for one register entry
 * each, by id and exact version, by the decision that read them. The gate
 * downloads such a package in CI and no package of this product carries
 * it, so its terms are the gate's to meet, not a consumer's; a version
 * moved is a licence to read again. `dependency-licences.mjs`'s policy for
 * what a consumer installs is not changed by this.
 *
 * - `ihe.formatcode.fhir#1.4.0`, CC-BY-4.0, IHE's formatCode code system,
 *   value set and guide, which CH Term 3.3.0 declares and without which
 *   the validator cannot load CH Core 6.0.0 (0009).
 */
export const ADMITTED_LICENCES = new Map([['ihe.formatcode.fhir#1.4.0', 'CC-BY-4.0']])

/** Whether a register entry's licence is one the policy allows, or the one a decision admits for that entry. */
const licenceAdmitted = (entry) =>
  typeof entry?.licence === 'string' && (spdxAllows(entry.licence) || ADMITTED_LICENCES.get(packageKey(entry)) === entry.licence)

/** The three registers, parsed: `{ pin, packages, warnings }`. */
export function readRegisters(root = repo) {
  return { pin: readJson(root, VALIDATOR_PIN), packages: readJson(root, IG_PACKAGES).packages, warnings: readJson(root, WARNINGS).warnings }
}

/** What is wrong with the validator's pin, as sentences. */
export function pinProblems(pin) {
  const problems = []
  if (typeof pin?.version !== 'string' || !EXACT.test(pin.version)) problems.push(`${VALIDATOR_PIN}: version is not an exact release`)
  else if (pin.url !== `https://github.com/hapifhir/org.hl7.fhir.core/releases/download/${pin.version}/validator_cli.jar`)
    problems.push(`${VALIDATOR_PIN}: url is not the validator_cli.jar asset of release ${pin.version} of hapifhir/org.hl7.fhir.core`)
  if (typeof pin?.released !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(pin.released)) problems.push(`${VALIDATOR_PIN}: released is not a date`)
  if (typeof pin?.sha256 !== 'string' || !SHA256.test(pin.sha256)) problems.push(`${VALIDATOR_PIN}: sha256 is not 64 lowercase hex digits`)
  if (!Number.isSafeInteger(pin?.bytes) || pin.bytes <= 0) problems.push(`${VALIDATOR_PIN}: bytes is not a size`)
  if (!Number.isSafeInteger(pin?.java) || pin.java < 8) problems.push(`${VALIDATOR_PIN}: java is not a Java major version`)
  if (typeof pin?.licence !== 'string' || !spdxAllows(pin.licence)) problems.push(`${VALIDATOR_PIN}: licence is not one dependency-licences.mjs allows`)
  return problems
}

/**
 * What is wrong with the package register, as sentences: a field missing
 * or malformed, a package twice, an address that is not packages.fhir.org's
 * for that exact version, a licence the dependency policy would refuse and
 * no decision admits for that package, a
 * `declaredBy` naming a package the register does not hold, a prerelease
 * the gate asks for or no registered package declares, and anything but
 * exactly one `core`.
 */
export function packageProblems(packages) {
  if (!Array.isArray(packages) || packages.length === 0) return [`${IG_PACKAGES}: packages is not a list of packages`]
  const problems = []
  const keys = new Set()
  for (const entry of packages) {
    const key = packageKey(entry ?? {})
    const say = (what) => problems.push(`${IG_PACKAGES}: ${key}: ${what}`)
    if (typeof entry?.id !== 'string' || !PACKAGE_ID.test(entry.id)) say('id is not a package id')
    if (typeof entry?.version !== 'string' || !EXACT.test(entry.version)) say('version is not an exact release')
    if (keys.has(key)) say('registered twice')
    keys.add(key)
    if (!LOADED_AS.includes(entry?.loadedAs)) say(`loadedAs is not one of ${LOADED_AS.join(', ')}`)
    if (!Array.isArray(entry?.declaredBy) || entry.declaredBy.some((by) => typeof by !== 'string')) say('declaredBy is not a list of id#version')
    else if (entry.loadedAs === 'dependency' && entry.declaredBy.length === 0 && (typeof entry.note !== 'string' || entry.note === ''))
      say('no registered package declares it, and no note says why the validator loads it')
    // A ballot, or any other prerelease, is never chosen: one is registered
    // only because a registered package declares it (docs/release/README.md).
    if (typeof entry?.version === 'string' && entry.version.includes('-')) {
      if (entry.loadedAs !== 'dependency') say('a prerelease, which the gate never asks for')
      else if (!Array.isArray(entry.declaredBy) || entry.declaredBy.length === 0) say('a prerelease that no registered package declares')
    }
    if (typeof entry?.canonical !== 'string' || !/^https?:\/\/\S+$/.test(entry.canonical)) say('canonical is not an http(s) URL')
    // Everybody who runs the gate downloads these; a licence the dependency
    // policy refuses is a decision record's to admit, not a field's.
    if (!licenceAdmitted(entry)) say('licence is not one dependency-licences.mjs allows')
    if (entry?.url !== `https://packages.fhir.org/${String(entry?.id)}/${String(entry?.version)}`) say('url is not packages.fhir.org’s for this exact version')
    if (typeof entry?.sha256 !== 'string' || !SHA256.test(entry.sha256)) say('sha256 is not 64 lowercase hex digits')
    if (!Number.isSafeInteger(entry?.bytes) || entry.bytes <= 0) say('bytes is not a size')
  }
  for (const entry of packages)
    for (const by of Array.isArray(entry?.declaredBy) ? entry.declaredBy : [])
      if (!keys.has(by)) problems.push(`${IG_PACKAGES}: ${packageKey(entry)}: declaredBy names ${by}, which is not registered`)
  const cores = packages.filter((entry) => entry?.loadedAs === 'core')
  if (cores.length !== 1) problems.push(`${IG_PACKAGES}: ${String(cores.length)} packages are loadedAs core, where FHIR is one`)
  return problems
}

/** What is wrong with the warnings register: an entry without an id or a reason, or one id twice. */
export function warningProblems(warnings) {
  if (!Array.isArray(warnings)) return [`${WARNINGS}: warnings is not a list`]
  const problems = []
  const ids = new Set()
  for (const warning of warnings) {
    if (typeof warning?.id !== 'string' || warning.id === '') problems.push(`${WARNINGS}: an entry names no message id`)
    else if (ids.has(warning.id)) problems.push(`${WARNINGS}: ${warning.id} is registered twice`)
    ids.add(warning?.id)
    if (typeof warning?.reason !== 'string' || warning.reason.trim() === '') problems.push(`${WARNINGS}: ${String(warning?.id)} gives no reason it is accepted`)
  }
  return problems
}
