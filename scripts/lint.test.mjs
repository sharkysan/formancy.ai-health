import { spawnSync } from 'node:child_process'
import { mkdtempSync, readdirSync, readFileSync, existsSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { ESLint } from 'eslint'
import * as prettier from 'prettier'
import { describe, expect, test } from 'vitest'
import { prettierConfig } from './code-style/code-style.mjs'

/**
 * The linter's and the formatter's wiring, as a gate: that this
 * repository's files are linted and formatted by the shared rules, with
 * the paths eslint.config.mjs passes them and prettier.config.mjs's style.
 *
 * The rules themselves are scripts/code-style/code-style.mjs, the copy of
 * what formancy.ai will publish as a shared package for all four
 * repositories, and code-style.test.mjs beside it holds what each does.
 * The cases here lint a short text as though it stood at a real path, so
 * the typed rules run on a file one of this repository's tsconfigs holds.
 *
 * What it cannot see: whether a rule's verdict is right. It holds that a
 * rule runs and fails the build, not that what it reports is a defect.
 */
const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const eslint = new ESLint({ cwd: root })

const lint = (code, path) => eslint.lintText(code, { filePath: join(root, path) }).then(([result]) => result.messages)
const ruleIds = (messages) => messages.map((m) => m.ruleId)

const SOURCE = 'packages/health-core/src/numbers.ts'
const TEST = 'packages/health-core/src/numbers.test.ts'
const SCRIPT = 'scripts/purpose.mjs'

// The first case to lint a file of a tsconfig builds that tsconfig's
// program. Measured on 30 October 2026 on an Apple M2 with 8 cores, under
// Node 22.23.3: 3.7 s for health-core's and 4.5 s for the demo's with this
// file run alone, and 6.9 s for health-core's when `pnpm test:repo` ran
// every guard beside it on a loaded machine -- past vitest's 5 s default,
// so the case failed on its timeout and on nothing it checks. `verify`
// runs this file beside the others, so the cases wait for the program:
// 30 s is four times the slowest seen.
const TYPED = { timeout: 30_000 }

describe('the linter', TYPED, () => {
  // A tool config that falls outside every tsconfig is not linted with types,
  // or not linted at all.
  test('a vitest config is linted with types', async () => {
    const messages = await lint('export async function f() {}\nf()\n', 'packages/health-core/vitest.config.ts')
    expect(ruleIds(messages)).toContain('@typescript-eslint/no-floating-promises')
  })

  // A hook under a condition runs in a different order on another render.
  test('the hooks rules hold in the demo', async () => {
    const code = "import { useState } from 'react'\nexport function C({ on }: { on: boolean }) {\n  if (on) {\n    useState(0)\n  }\n  return null\n}\n"
    expect(ruleIds(await lint(code, 'apps/demo/src/download.tsx'))).toContain('react-hooks/rules-of-hooks')
  })

  // A new package or app must be linted with types without anyone editing
  // the configuration; a tsconfig the parser cannot read is a fatal message.
  test("every package's and app's tsconfig is one lint reads", async () => {
    const firstSource = (dir) => {
      for (const entry of readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
        const path = join(dir, entry.name)
        if (entry.isDirectory()) {
          const found = firstSource(path)
          if (found) return found
        } else if (/\.tsx?$/.test(entry.name) && !entry.name.endsWith('.d.ts')) return path
      }
    }
    let checked = 0
    for (const group of ['packages', 'apps']) {
      for (const name of readdirSync(join(root, group))) {
        const dir = join(root, group, name)
        if (!existsSync(join(dir, 'tsconfig.json')) || !existsSync(join(dir, 'src'))) continue
        const file = firstSource(join(dir, 'src'))
        if (!file) continue
        const fatal = (await lint(readFileSync(file, 'utf8'), relative(root, file))).filter((m) => m.fatal)
        expect(fatal, file).toEqual([])
        checked += 1
      }
    }
    expect(checked).toBeGreaterThan(0)
  })

  // A warning is a finding nobody has to fix: it accumulates until the count
  // means nothing.
  test('no rule warns', async () => {
    for (const path of [SOURCE, TEST, SCRIPT, 'apps/demo/src/download.tsx']) {
      const config = await eslint.calculateConfigForFile(join(root, path))
      for (const [rule, entry] of Object.entries(config.rules)) {
        const severity = Array.isArray(entry) ? entry[0] : entry
        expect([0, 2, 'off', 'error'], `${rule} at ${path}`).toContain(severity)
      }
    }
  })
})

describe('the formatter', () => {
  // Two repositories formatted differently would reformat each other's
  // files on every change, so Prettier finds the shared style here.
  test('the style is the shared one', async () => {
    expect(await prettier.resolveConfig(join(root, 'packages/health-core/src/numbers.ts'))).toEqual(prettierConfig)
    expect(await prettier.resolveConfig(join(root, 'scripts/purpose.mjs'))).toEqual(prettierConfig)
  })

  // A glob that matches nothing passes the check; so the check is shown to
  // fail on a file it should find, with the glob the script itself carries.
  test("the formatter's check finds a misformatted file", () => {
    const script = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')).scripts['format:check']
    const glob = /'([^']+)'/.exec(script)?.[1]
    expect(glob, 'format:check names a glob').toBeTruthy()
    const dir = mkdtempSync(join(root, 'scripts', 'lint-sample-'))
    try {
      writeFileSync(join(dir, 'sample.ts'), 'const a = "x";\n')
      const prettierBin = join(dirname(fileURLToPath(import.meta.resolve('prettier'))), 'bin', 'prettier.cjs')
      const run = spawnSync(process.execPath, [prettierBin, '--check', '--log-level', 'warn', `${relative(root, dir)}/${glob}`], {
        cwd: root,
        encoding: 'utf8',
      })
      expect(run.status).not.toBe(0)
      expect(run.stdout + run.stderr).toContain('sample.ts')
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })
})
