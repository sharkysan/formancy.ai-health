/**
 * What the install gate installs, and where (0011; formancy.ai-report
 * 0015's hosts, for Health's one kind of host, Node).
 *
 * Two projects, each holding what its host would and nothing else, because
 * one shared project lets a package resolve what its own consumer would
 * not have:
 *
 * - `node`, the consumer of `consume.ts`: the published packages'
 *   tarballs, and the tools that check it. A package that imports what it
 *   never declared fails here.
 * - `guide`, docs/getting-started.md's program: the tarballs, and what the
 *   guide tells a reader to install beside them -- `@formancy/spec` at the
 *   release health-questionnaire reads forms through, so a reader's form is
 *   typed by the copy the package reads, and Formancy Report's runtime and
 *   renderer at the release health-corpus renders with. In the consumer's
 *   project those, and what they bring -- `@formancy/expressions`, pdfmake
 *   -- would resolve, and a package's undeclared import of one would pass:
 *   formancy.ai-report 0015's reason for giving the guide's React page a
 *   host of its own.
 *
 * Both are type-checked with skipLibCheck off, against Node's types alone,
 * under the one tsconfig the guide shows a reader, and run under Node. The
 * versions beside the tarballs are read from the workspace's manifests,
 * never typed here, and the guard (scripts/getting-started.test.mjs) holds
 * the guide's install lines to them.
 */
import { readFileSync } from 'node:fs'

/** `name` as packages/`dir`'s manifest declares it among its dependencies: an exact release, or a throw. */
function declared(dir, name) {
  const version = JSON.parse(readFileSync(new URL(`../packages/${dir}/package.json`, import.meta.url), 'utf8')).dependencies?.[name]
  if (typeof version !== 'string' || !/^\d+\.\d+\.\d+$/.test(version)) throw new Error(`packages/${dir}/package.json declares no exact ${name}, so no release of it is the one to install`)
  return version
}

/**
 * What a project's code is type-checked with. skipLibCheck is OFF,
 * deliberately: skipping library checks is what lets a broken declaration
 * file reach a consumer unnoticed, and the published `.d.mts` files are
 * precisely what is on trial here. Strict as the workspace is, exact
 * optional properties and checked indices included, so a declaration that
 * holds only under looser settings fails here rather than in a careful
 * host. Node's types, which a Node host has.
 */
export const COMPILER_OPTIONS = {
  strict: true,
  exactOptionalPropertyTypes: true,
  noUncheckedIndexedAccess: true,
  skipLibCheck: false,
  target: 'ES2023',
  module: 'NodeNext',
  moduleResolution: 'nodenext',
  lib: ['ES2023'],
  types: ['node'],
  noEmit: true,
}

/**
 * What every project is checked and run with: Node's types, against which
 * a declaration file that references them is checked with skipLibCheck
 * off; the TypeScript the workspace pins, since a consumer on another major
 * is its own question; and tsx, which runs the TypeScript under Node.
 */
const TOOLS = { '@types/node': '^22.10.0', typescript: '~6.0.3', tsx: '^4.20.3' }

/**
 * The projects, in the order the gate runs them. `with` is what a project
 * installs beside the tarballs, by exact version; `steps` what it runs, in
 * order, each a binary installed in the project. `guide` is the part of
 * docs/getting-started.md a project builds: the `kind` a block's `guide=`
 * names, the `entry` module its blocks go to, the `runner` that runs it,
 * and whether the runner compares what it `prints` with the guide's output
 * blocks.
 */
export const HOSTS = {
  node: {
    consumer: 'consume.ts',
    with: {},
    tools: TOOLS,
    tsconfig: { compilerOptions: COMPILER_OPTIONS, include: ['consume.ts'] },
    steps: [
      { name: 'type-check', command: ['tsc', '-p', 'tsconfig.json'] },
      { name: 'run', command: ['tsx', 'consume.ts'] },
    ],
  },
  guide: {
    consumer: 'guide-node.ts',
    guide: { kind: 'node', entry: 'referral.ts', runner: 'guide-node.ts', prints: true },
    with: {
      '@formancy/spec': declared('health-questionnaire', '@formancy/spec'),
      '@formancy/report-runtime': declared('health-corpus', '@formancy/report-runtime'),
      '@formancy/report-render-pdf': declared('health-corpus', '@formancy/report-render-pdf'),
    },
    tools: TOOLS,
    tsconfig: { compilerOptions: COMPILER_OPTIONS, include: ['guide-node.ts', 'guide'] },
    steps: [
      { name: 'type-check', command: ['tsc', '-p', 'tsconfig.json'] },
      { name: 'guide: run', command: ['tsx', 'guide-node.ts'] },
    ],
  },
}

/** What docs/getting-started.md is built by: each project's guide, in the order of HOSTS. */
export const GUIDE_HOSTS = Object.values(HOSTS).flatMap((host) => (host.guide === undefined ? [] : [host.guide]))
