// The gate's verdict on what the validator said (0005): pure functions of
// the corpus, the validator's outcomes and console, and the registers, so
// that every rule below is held by a test on fixtures
// (scripts/validator/judge.test.mjs) and the command only gathers inputs.
//
// The rules:
//
// - **A refusal** is an error, or a warning the warnings register does not
//   name by its message id. A warning with no id is always a refusal.
//   Information is recorded and refuses nothing.
// - **An accepted resource** has no refusal.
// - **A broken resource** is refused for exactly what it expects, matched
//   by severity, id (or issue type, where the validator gives no id) and
//   expression: one the gate accepted means nothing is watching what it
//   breaks, and one refused for something else as well is not the
//   resource its name says.
// - **Every file** of the corpus has exactly one outcome, judged by the
//   pinned validator, and nothing else has one.
// - **Every registered warning** was raised in the run; one that was not
//   names nothing, and goes.
// - **The packages the validator loaded** are exactly the register's.

/**
 * What is wrong with the corpus itself, before anything runs: a file named
 * twice, an expectation that is neither `'accepted'` nor a list of issues
 * each with a severity that refuses, exactly one of `id` and `code`, and an
 * expression, or a broken entry that does not say what it breaks.
 */
export function corpusProblems(corpus) {
  const problems = []
  const seen = new Set()
  for (const entry of corpus) {
    if (typeof entry.file !== 'string' || !/^[a-z0-9-]+\.json$/.test(entry.file)) problems.push(`${String(entry.file)} is not a lowercase .json file name`)
    if (seen.has(entry.file)) problems.push(`${entry.file} is in the corpus twice`)
    seen.add(entry.file)
    if (entry.expect === 'accepted') continue
    if (!Array.isArray(entry.expect) || entry.expect.length === 0) {
      problems.push(`${entry.file} expects neither 'accepted' nor any issue`)
      continue
    }
    if (typeof entry.why !== 'string' || entry.why === '') problems.push(`${entry.file} is broken and does not say for what`)
    for (const issue of entry.expect) {
      const named = [issue.id, issue.code].filter((value) => typeof value === 'string' && value !== '').length
      if (!['error', 'warning'].includes(issue.severity) || named !== 1 || typeof issue.expression !== 'string' || issue.expression === '') {
        problems.push(`${entry.file} expects an issue that is not { severity: error | warning, id or code, expression }`)
      }
    }
  }
  return problems
}

/** An issue's name: its message id, or its issue type where the validator gives none. */
const nameOf = (issue) => (issue.id === undefined ? `code:${String(issue.code)}` : issue.id)

/** One line for an issue, expectation or found, as both are compared: `error Validation_VAL_Profile_Minimum at Questionnaire`. */
export const issueKey = (issue) => `${issue.severity} ${issue.id ?? `code:${String(issue.code)}`} at ${issue.expression}`

/** The issues of `issues` that refuse a resource, under `registered`, a set of warning ids. */
export function refusals(issues, registered) {
  return issues.filter((issue) => issue.severity === 'error' || (issue.severity === 'warning' && (issue.id === undefined || !registered.has(issue.id))))
}

/** What is wrong with one corpus entry's outcome, as sentences naming the file. */
function judgeOne(entry, outcome, registered) {
  const refused = refusals(outcome.issues, registered)
  if (entry.expect === 'accepted') return refused.map((issue) => `${entry.file} is refused: ${issueKey(issue)}: ${issue.text}`)
  const expected = new Set(entry.expect.map(issueKey))
  const found = new Set(refused.map(issueKey))
  if (found.size === 0) return [`${entry.file} is broken for ${entry.why}, and the gate accepted it: nothing is watching that`]
  return [
    ...[...expected].filter((key) => !found.has(key)).map((key) => `${entry.file} was not refused for ${key}, which it is broken for`),
    ...[...found].filter((key) => !expected.has(key)).map((key) => `${entry.file} was refused for ${key} as well, which it is not broken for`),
  ]
}

/**
 * The verdict: `{ resources, problems }`. `resources` is one row per corpus
 * entry, for the results file; `problems` every sentence that fails the
 * gate, empty when it passes.
 *
 * - `corpus`: `{ file, expect, why? }` per entry (scripts/validator/corpus.mjs);
 * - `outcomes`: readOutcomes' result;
 * - `warnings`: the register's entries, `{ id, reason }`;
 * - `pinned`: the validator version docs/release/validator.json pins;
 * - `registered`: `id#version` of every package docs/release/ig-packages.json names;
 * - `loaded`: readConsole's `packages`, or undefined when the console named none.
 */
export function judge({ corpus, outcomes, warnings, pinned, registered, loaded }) {
  const accepted = new Set(warnings.map((warning) => warning.id))
  const problems = []
  const byFile = new Map()
  for (const outcome of outcomes) {
    if (byFile.has(outcome.file)) problems.push(`${outcome.file} has two outcomes`)
    byFile.set(outcome.file, outcome)
    if (outcome.version !== pinned) problems.push(`${outcome.file} was judged by validator ${String(outcome.version)}, not by ${pinned}, which docs/release/validator.json pins`)
  }
  const files = new Set(corpus.map((entry) => entry.file))
  for (const file of byFile.keys()) if (!files.has(file)) problems.push(`${file} has an outcome but is no file of the corpus`)
  const raised = new Set()
  const resources = corpus.map((entry) => {
    const outcome = byFile.get(entry.file)
    if (outcome === undefined) {
      problems.push(`${entry.file} has no outcome: the validator did not judge it`)
      return { file: entry.file, expect: entry.expect, verdict: 'not judged' }
    }
    for (const issue of outcome.issues) if (issue.severity === 'warning' && issue.id !== undefined) raised.add(issue.id)
    const wrong = judgeOne(entry, outcome, accepted)
    problems.push(...wrong)
    const count = (severity) => outcome.issues.filter((issue) => issue.severity === severity).length
    return {
      file: entry.file,
      expect: entry.expect === 'accepted' ? 'accepted' : entry.expect.map(issueKey),
      verdict: wrong.length === 0 ? 'as expected' : 'not as expected',
      refusals: refusals(outcome.issues, accepted).map(issueKey),
      registeredWarnings: outcome.issues.filter((issue) => issue.severity === 'warning' && accepted.has(issue.id)).map(nameOf),
      errors: count('error'),
      warnings: count('warning'),
      information: count('information'),
    }
  })
  for (const warning of warnings) if (!raised.has(warning.id)) problems.push(`the registered warning ${warning.id} was raised by no resource of the corpus: remove it from scripts/validator/warnings.json`)
  if (loaded === undefined) problems.push('the validator’s console has no Package Summary line, so what it loaded cannot be told')
  else {
    const want = new Set(registered)
    for (const key of loaded) if (!want.has(key)) problems.push(`the validator loaded ${key}, which docs/release/ig-packages.json does not register`)
    for (const key of registered) if (!loaded.includes(key)) problems.push(`docs/release/ig-packages.json registers ${key}, which the validator did not load: remove it`)
  }
  return { resources, problems }
}
