/*
 * docs/getting-started.md's program, from outside the workspace (0011;
 * formancy.ai-report 0015).
 *
 * The install gate writes the guide's blocks, in the order the guide shows
 * them, into guide/referral.ts, and the lines it shows the program printing
 * into guide/output.txt, in a project of their own holding the tarballs and
 * what the guide's section 1 installs beside them. The project's
 * type-check covers the program with skipLibCheck off, against Node's
 * types; this runs it as a reader would, in the project's directory, and
 * holds it to what the guide says: that it prints exactly the lines the
 * guide shows -- the refusals' rules, paths and the packages' own words
 * among them -- in their order, and that it writes document.json and
 * ch-orf.json, each a document Bundle health-core reads back.
 *
 * What it cannot show is that the resources conform: the validator gate
 * judges its own corpus, made by the same packages (0005), and not what
 * this program wrote.
 */
import { readFileSync, rmSync } from 'node:fs'
import { isFhirNumber, readJson, type FhirJson, type FhirJsonObject } from '@formancy/health-core'

/** Whether a FHIR JSON value is an object: not a number, which is an object too, and not an array. */
const isObject = (value: FhirJson): value is FhirJsonObject => typeof value === 'object' && value !== null && !Array.isArray(value) && !isFhirNumber(value)

/** What the guide says the program writes, each a document Bundle. */
const WRITES = ['document.json', 'ch-orf.json']

// Whatever an earlier run left, so the files checked below are this run's.
for (const file of WRITES) rmSync(file, { force: true })

const said: string[] = []
const { log } = console
console.log = (...args: unknown[]): void => {
  said.push(args.map(String).join(' '))
}
try {
  await import('./guide/referral.js')
} finally {
  console.log = log
}

const shown = readFileSync('guide/output.txt', 'utf8').trimEnd()
const printed = said.join('\n')
if (printed !== shown) throw new Error(`docs/getting-started.md shows its program printing\n\n${shown}\n\nand it printed\n\n${printed}`)

for (const file of WRITES) {
  const bundle = readJson(readFileSync(file, 'utf8'))
  if (!isObject(bundle) || bundle['resourceType'] !== 'Bundle' || bundle['type'] !== 'document') {
    throw new Error(`the guide wrote ${file}, and it is not a document Bundle`)
  }
}

console.log(
  `ok: the guide's program ran, wrote ${WRITES.join(' and ')}, each a document Bundle, and printed the ${String(said.length)} lines the guide shows it printing`,
)
