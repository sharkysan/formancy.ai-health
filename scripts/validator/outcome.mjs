// What the HL7 FHIR validator said, read from what it wrote (0005).
//
// Two sources, each read for what only it holds:
//
// - The file `-output` names: an OperationOutcome per file validated, in a
//   Bundle when there are several. Each says which file it judged
//   (`operationoutcome-file`) and which validator judged it
//   (`validator-version`, since 7.0.0), and each issue its severity, its
//   type, where (`expression`), and, for all but a few, the message id the
//   validator's own messages are keyed by (`operationoutcome-message-id`).
//   An issue is matched by that id, never by its text, which is English
//   only because the gate asks for `-locale en-US`, and which the next
//   release may reword.
// - The console: which packages the validator loaded, in its `Package
//   Summary` line, and each refusal of the network (`-no-http-access`) it
//   printed there. Neither is in the OperationOutcomes. Not every refusal
//   is printed: a profile it could not fetch is reported only in that
//   resource's outcome, as a warning (measured with 7.0.2 on 17 October
//   2026).
//
// The validator is a program of somebody else's whose output format is
// not a contract, so anything that is not the shape described above throws
// rather than being read as an empty result.

/** The value of the extension `url` ends with, in `extensions`, or undefined. */
function extension(extensions, name) {
  const found = (extensions ?? []).find((entry) => typeof entry?.url === 'string' && entry.url.endsWith(`/${name}`))
  return found === undefined ? undefined : (found.valueString ?? found.valueCode ?? found.valueInteger)
}

/** The validator's version in its own banner: `FHIR Validation tool Version 7.0.2 (Git# …)` is 7.0.2. */
export function bannerVersion(text) {
  return /FHIR Validation tool Version (\S+)/.exec(String(text))?.[1]
}

/** The last segment of a path, by either separator: the validator writes the platform's. */
const basename = (path) => String(path).split(/[\\/]/).pop()

/**
 * One OperationOutcome as `{ file, version, issues }`: `file` the base name
 * of the file it judged, `version` the validator's, and each issue as
 * `{ severity, code, id, expression, line, column, text }`, a fatal issue
 * read as an error.
 */
export function readOutcome(outcome) {
  if (outcome?.resourceType !== 'OperationOutcome') throw new Error(`expected an OperationOutcome, found ${String(outcome?.resourceType)}`)
  const file = extension(outcome.extension, 'operationoutcome-file')
  if (file === undefined) throw new Error('an OperationOutcome names no file it judged')
  const issues = (outcome.issue ?? []).map((issue, index) => {
    if (!['fatal', 'error', 'warning', 'information'].includes(issue?.severity)) throw new Error(`${basename(file)}: issue ${String(index)} has no severity the validator gives`)
    return {
      severity: issue.severity === 'fatal' ? 'error' : issue.severity,
      code: issue.code,
      id: extension(issue.extension, 'operationoutcome-message-id'),
      expression: issue.expression?.[0] ?? issue.location?.[0] ?? '',
      line: extension(issue.extension, 'operationoutcome-issue-line'),
      column: extension(issue.extension, 'operationoutcome-issue-col'),
      text: issue.details?.text ?? issue.diagnostics ?? '',
    }
  })
  return { file: basename(file), version: bannerVersion(extension(outcome.extension, 'validator-version')), issues }
}

/** Every OperationOutcome of `-output`'s file: one, or a Bundle of them. */
export function readOutcomes(json) {
  const parsed = typeof json === 'string' ? JSON.parse(json) : json
  if (parsed?.resourceType === 'OperationOutcome') return [readOutcome(parsed)]
  if (parsed?.resourceType === 'Bundle') return (parsed.entry ?? []).map((entry) => readOutcome(entry.resource))
  throw new Error(`the validator's output is neither an OperationOutcome nor a Bundle of them, but ${String(parsed?.resourceType)}`)
}

/**
 * What the validator's console says that its outcomes do not: `version`
 * from its banner, `java` as it reports the JVM, `times` it took to load
 * and to validate, as it writes them (`01:03.379`), `packages` from its
 * `Package Summary` line as `id#version` in the order loaded (undefined
 * when there is no such line), and `refused`, how many refusals of the
 * network it printed.
 */
export function readConsole(text) {
  const source = String(text)
  const summary = /^\s*Package Summary: \[(.*)\]\s*$/m.exec(source)
  const times = /Times: Loading: ([\d:.]+), validation: ([\d:.]+)/.exec(source)
  return {
    version: bannerVersion(source),
    java: /^\s*Java:\s+(\S+)/m.exec(source)?.[1],
    times: times === null ? undefined : { loading: times[1], validation: times[2] },
    packages: summary === null ? undefined : summary[1].split(',').map((entry) => entry.trim()).filter((entry) => entry !== ''),
    refused: source.match(/Access to the internet is not allowed by local security policy/g)?.length ?? 0,
  }
}
