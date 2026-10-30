# 0017 — Lint every TypeScript and JavaScript file by the recommended type-aware rules and format it with Prettier, both checked by CI's `verify`, the rules the first copy of those formancy.ai will publish; and merge the change with a merge commit, so that blame can skip the format

- **Status:** accepted
- **Date:** 2026-10-30
- **Deciders:** Daniel Bacher
- **Verified by:** the repository's guards and `verify`'s two steps, on 30
  October 2026. Each was watched failing first, and every file a fault was
  planted in was put back:
  - **`scripts/code-style/code-style.test.mjs`** (`pnpm test:repo`) --
    the shared rules, on a repository of its own that it writes under the
    system's temporary directory: each runs, at error, on the kind of file
    it is for -- a floating promise; an `any` from `JSON.parse`, refused in
    source and allowed in a test, which is held to the rest; an assertion
    missing its call, in TypeScript and JavaScript alike; a name unused
    unless it begins with `_` -- an argument, a variable, an element of a
    destructured array, a caught error -- reported by one rule in both
    languages; a disable comment that gives no reason, one that disables
    nothing, and an inline configuration that changes nothing; an
    undefined name in JavaScript; a typographic space in a template
    literal and nowhere else -- and each path a repository passes does what
    it says: every extension Prettier formats one ESLint lints, `.jsx`
    included; a rejection with a forwarded `unknown` allowed and one with
    a string literal refused; an explicit `any` refused in source and
    allowed in a test (both failed first, before the rules changed, on
    30 October 2026); an untyped file linted without types; a page's globals where
    a browser is driven and nowhere else; the hooks rules where React is
    written; a nested `.gitignore` read for its own directory; and a
    required path left out refused -- and Prettier's five options, and that a
    template embedded in a string comes back as it was. The
    rule cases came from the first guard, which failed whole before the
    tools were installed, and its disable-comment case with
    `require-description` dropped; here, the typed cases failed with the
    untyped set in the type-aware one's place, the test's with an eighth
    relaxation, the inline configuration's with its report off, and the
    unused names' with any one of the underscore's options removed but
    the destructured array's, whose element `varsIgnorePattern` excuses as
    well, so that it fails only when both go. Each case of a path failed
    with the block it holds removed, or read otherwise, and the JavaScript
    and `.jsx` cases before JavaScript was held to typescript-eslint's
    rules.
  - **`scripts/lint.test.mjs`** (`pnpm test:repo`) -- this repository's
    wiring, derived from the files git holds, each known by the language
    Prettier infers for it, and from the two recommended sets as ESLint
    computes them. Every TypeScript and JavaScript file is linted, by
    `pnpm lint` as `eslint .`, with no rule at `warn`: TypeScript with
    every rule of both sets at error, typed through a tsconfig, but the
    install fixtures, which differ from a package's source by the typed
    rules alone; JavaScript with the sets' rules that need no types; a test
    with its source's rules but the eight relaxations; and a file of a
    workspace whose manifest declares React with the hooks rules. Every
    such file resolves to the shared style, an `.editorconfig` read as
    Prettier's command line reads it; both format scripts hand Prettier the
    shared list, and the check, as the script runs it, names a misformatted
    file of every extension git holds, written under the system's
    temporary directory. Beside them, a source file of every package and app,
    and every file `tsconfig.tools.json` takes in -- the vitest, Vite and
    tsdown configs -- is linted with its own content and with no message at
    all, a file in no project being a fatal one. That case never hands
    ESLint a text other than the file's: on Linux ESLint linted the file on
    disk instead of the text given (CI run 41045406900, 30 October 2026),
    so the two cases that did, a vitest config and a conditional hook in
    the demo, passed on macOS and failed on Linux. The hooks rules' behaviour is
    held in `code-style.test.mjs`'s repository of real files, and here only
    that they are at error in a workspace that declares React. Each case failed with what
    it holds broken: a package ignored; a rule of the sets relaxed in tests beyond the eight; `./tsconfig.tools.json` dropped from
    the tsconfigs lint reads, which made the vitest config a fatal
    message; a
    rule at `warn` in a directory no case read; `lint` narrowed to
    `eslint scripts`; the format glob narrowed; an `.editorconfig` -- the
    guard it replaced passed all six -- and `require-await` off
    everywhere; a package's `.prettierrc`; the demo not passed as React; a
    rule of the sets relaxed for the fixtures; the untyped glob reaching a
    package; and `.mts` dropped from the shared list.
  - **`verify`'s `pnpm lint` and `pnpm format:check`**, run by CI on every
    pull request and by a release before it publishes. With
    `Promise.resolve()` planted as a statement at the end of
    `packages/health-core/src/numbers.ts`, `pnpm lint` exited 1, naming
    `@typescript-eslint/no-floating-promises` at that line; with a
    double-quoted string planted there instead, `pnpm format:check`
    exited 1, naming the file. The file was put back after each, its
    SHA-256 the same as before and `git diff --exit-code` clean.
  - **`scripts/workflows.test.mjs`**, its case `verify runs the linter and
    the formatter’s check after the typecheck` -- both steps in `verify`,
    after the build and the typecheck and before the guards. Failed before
    `gates.yml` ran them, with `pnpm lint` moved before the typecheck, and
    with the build step renamed, which it had passed.

  **Measured** on 30 October 2026, once each, after `pnpm build`, on an
  Apple M2 with 8 cores and 16 GB under macOS 26.5.2, with Node 22.23.3
  and pnpm 12.4.2, while other work ran (a load average of 12):
  `pnpm lint` took 6.3 s of wall time over the 275 TypeScript and
  JavaScript files git held, and `pnpm format:check` 2.8 s. Measured again
  once each the same day, at a load average of 7, once the rules were one
  shared module and JavaScript was held to typescript-eslint's rules:
  `pnpm lint` took 6.7 s over the 278 files git held then,
  `pnpm format:check` 2.5 s with its style imported from that module, and
  `lint.test.mjs`'s derived case 0.18 s. On CI's runner, read from the
  `verify` job's log of run 41045406900 (ubuntu-latest, Node 22.23.4, 30
  October 2026) as the difference between the start times of consecutive
  steps: `pnpm lint` began at 11:05:02.84 and `pnpm format:check` at
  11:05:17.57, and `pnpm check:pkg` after it at 11:05:23.23, so `pnpm lint`
  took about 14.7 s and `pnpm format:check` about 5.7 s, each as the step's
  wall time including pnpm's start, once.

  **Not mechanically enforced:** how the pull request that brings this
  merges, which GitHub leaves to the person merging; that a disable
  comment's reason is true; and that the rules here are the ones
  formancy.ai publishes, which nothing compares.

## Context

The repository had no linter and no formatter, and neither had
formancy.ai, Formancy Data or Formancy Report. Style was held by habit and
review. Habit held -- no semicolons, single quotes -- but lines drifted
long, and the mistakes only a type-aware linter sees were caught by
nobody: a promise nobody awaits, which loses its rejection; an assertion
of a type already known; an `any` from `JSON.parse` flowing into a typed
name. formancy.ai's records say the same of formancy.ai: "The repository
has no linter at all"
([formancy.ai 0008](https://github.com/sharkysan/formancy.ai/blob/main/docs/decisions/0008-layered-packages.md)),
"there is no ESLint config"
([formancy.ai 0037](https://github.com/sharkysan/formancy.ai/blob/main/docs/decisions/0037-turborepo-over-nx.md)),
and, rejecting `no-console`, "`pnpm lint` exists — but no CI gate runs it,
and a rule that does not gate is a comment"
([formancy.ai 0115](https://github.com/sharkysan/formancy.ai/blob/main/docs/decisions/0115-a-library-writes-nothing-to-its-hosts-console.md)).

The maintainer asked on 30 October 2026 for a linter and a formatter in all
four repositories, which "should have the same quality". So one set of
rules, published once by formancy.ai as `@formancy/code-style` and pinned
at an exact version by the other three, as this repository depends on
anything formancy.ai publishes (0002). A reformat conflicts with every
branch open under it. That day formancy.ai had a pull request open, and
this repository had none, the fewest findings of the four, and no file the
format would push past the 600-line budget. So this repository goes first,
and its rules are the copy formancy.ai's package will take them from. The
maintainer said the same day not to wait for formancy.ai's release.

Measured on 30 October 2026 on the Mac above: at `72db2c8`, the two
recommended sets with nothing beyond them reported 92 findings, 53 of them
in tests, and found 15 files in no tsconfig, the tool configs and the
install fixtures. With the configuration as first committed, before
`require-await` was relaxed in tests, ESLint reported 46, in 21 of 275 files, and none was a defect.

## Decision

- **ESLint 10 and Prettier 3**, at exact versions as root
  devDependencies, run from the root by `pnpm lint` (`eslint .`),
  `pnpm format` and `pnpm format:check`, over every TypeScript and
  JavaScript file git does not ignore -- `.gitignore` read by ESLint's
  own `includeIgnoreFile`, each for its own directory, and by Prettier
  itself -- and never `dist/`, coverage or test results. The rules and
  the style are one module, `scripts/code-style/code-style.mjs`, which
  `eslint.config.mjs` calls with this repository's paths and
  `prettier.config.mjs` takes the style from.
- **The rules:** `@eslint/js`'s recommended set, then typescript-eslint's
  `recommendedTypeChecked`, every rule `error` or `off` and none `warn`.
  - **Typed** through exactly the tsconfigs `pnpm typecheck` runs, named by
    glob, `./packages/*/tsconfig.json` and `./apps/*/tsconfig.json`, so a
    new package or app is linted with types without an edit; and
    `tsconfig.tools.json`, which brings the vitest, Vite and tsdown
    configs into `pnpm typecheck`, so that they are type-checked as well
    as linted.
  - **Untyped** (typescript-eslint's `disableTypeChecked`): JavaScript,
    with Node's globals and `no-undef` on, and the browser's beside them in
    `apps/demo/scripts/` and `scripts/pictures/`, whose `page.evaluate`
    callbacks run in a page; and the install fixtures,
    `scripts/install-fixture/`, which import the packed tarballs the
    workspace does not resolve, and which the install gate type-checks
    strictly in its consumer's project. Both sets reach JavaScript as
    typescript-eslint pairs them with `disableTypeChecked`, so it is held
    to typescript-eslint's rules that need no types -- an expression whose
    value is dropped, an assertion missing its call among them -- as
    TypeScript is; its overrides of `@eslint/js`'s rules that the compiler
    holds reach TypeScript alone. They found nothing in the repository's
    JavaScript on 30 October 2026.
  - **Unused names** fail unless they begin with `_` -- arguments,
    variables, caught errors, destructured array elements -- the
    convention the code already had: typescript-eslint's rule, in
    JavaScript and TypeScript alike, and `@eslint/js`'s off.
  - **Irregular whitespace** is refused in code and comments and allowed
    in strings, template literals and JSX text, where
    `apps/demo/src/words/fr.ts` writes French typographic spaces.
  - **React's hooks:** `rules-of-hooks` and `exhaustive-deps` on the demo,
    and not version 7's whole recommended set, which adds the React
    Compiler's rules.
  - **A disable comment** gives its reason after `--`
    (`@eslint-community/eslint-comments`' `require-description`), and one
    that disables nothing, or an inline configuration that changes
    nothing, is an error.
  - **In test files alone**, known by name (`*.test.*`, `*.spec.*`), eight
    rules are off: the `no-unsafe-*` rules -- assignment, member access,
    call, argument, return -- `unbound-method`, `require-await` and
    `no-explicit-any`. A test reads an untyped body on purpose, which it
    types `any` (seven disables in formancy.ai-data's lint fixes quoted
    that reason word for word), and vitest is handed methods to
    `expect`; and a test double stands in for an async interface, so that
    removing its `async` would turn a rejection into a synchronous throw
    and change what the code under test meets -- of the 220 findings of
    `require-await` measured on formancy.ai-data on 30 October 2026, 201
    were in tests, nearly all such doubles (`fetch: async () => new
    Response(...)`, `readFile: async (p) => ...`, `until(async () =>
    cond)`). Test support --
    health-corpus, each package's `test-support.ts` -- is held to every
    rule.
  - **Everywhere**, `prefer-promise-reject-errors` allows a rejection with
    a value typed `any` or `unknown`, as `only-throw-error` allows
    throwing one by default: rejecting with the same forwarded value is the
    same act, and two rules that disagreed made every such forward a
    disable comment (`reject(signal.reason)`, a driver's rejection passed
    on; nine in formancy.ai-data). A rejection with a known non-Error
    value, a string or an object literal, is still refused.
  - These two came from formancy.ai-data's lint fixes, which made each
    line by line as disable comments; a review on 30 October 2026 ruled
    that each belongs in the shared rules instead.
- **The style:** `semi: false`, `singleQuote: true`, `trailingComma:
  'all'`, `printWidth: 160`, `embeddedLanguageFormatting: 'off'`, and
  Prettier's defaults otherwise; TypeScript and JavaScript alone, never
  Markdown, JSON, YAML, CSS or HTML. Embedded formatting is off because
  Prettier's default, `auto`, formats code inside a string: on 30 October
  2026 formancy.ai's repository-wide format reflowed the inline templates
  of its Angular components, where the whitespace inside an element
  renders, and an option's text became " Deutsch " for "Deutsch", failing
  five tests of `@formancy/angular`. That is a behaviour change made as
  style, which the design forbids, and formatting HTML is a non-goal here
  too. The format commit d570b37 was re-derived from its parent with
  embedded formatting off and is byte-identical, so it stands as it is and
  `.git-blame-ignore-revs` still names it.
- **The gate:** `verify` runs `pnpm lint` and `pnpm format:check` after the
  build and the typecheck, and before the guards. In `verify` rather than
  a job of its own, which would need a collect step, an upload and a
  reader in the release report (0011).
- **Not in the rules:** what encodes a repository's own decision. A layer
  boundary stays the compiler's and the manifests', as formancy.ai 0008
  has it, though formancy.ai 0037 expected a lint plugin to add one; a log
  line in a published package is the compiler's too, since `console` is
  no name the packages compile against, where formancy.ai 0115 found no
  gate to run `no-console`; and `no-eval` is not added. The linter makes each
  possible, and each would be a record of its own.
- **A copy until formancy.ai releases.** `scripts/code-style/` -- the
  module and its test -- is the first copy of what formancy.ai will
  publish as `@formancy/code-style`, shaped as its API: `eslintConfig`,
  called with a repository's `root`, `project`, `ignoreFiles`, `tests`,
  `untyped`, `browser` and `react`, the first four required;
  `prettierConfig`; and `EXTENSIONS` and `FILES`, the files both tools
  read, one list. It names no path of this repository's, and a reason
  that holds here alone, French typography in
  `apps/demo/src/words/fr.ts`, is written where `eslint.config.mjs` calls
  it; so each of the other three copies the directory byte for byte and
  writes its own call. The swap is a pull request of its own: the package
  pinned exactly as a root devDependency, the directory deleted, the two
  config files importing the package instead, and
  `scripts/upstream-deps.mjs` extended to the root manifest, which holds
  no `@formancy/*` dependency until then. Until the swap, a rule changed
  here is changed in formancy.ai's package too.
- **One format commit, merged as it is.** The format is one commit of
  Prettier's output and nothing else, `d570b37`, which
  `.git-blame-ignore-revs` names by its SHA. **The pull request that
  brings this merges with "Create a merge commit", never a squash or a
  rebase**: a squash folds the format into one commit with everything
  else, and a rebase gives it another SHA, and either way the file names
  nothing on `main`.

## Consequences

**What it buys.** A promise nobody awaits, an `any` from a parse in a
package's source, an assertion of a type already known, a name nobody uses
and a mistyped global in a script fail the pull request that brings them,
rather than waiting for a reader to notice. The style is a check and not a
habit, and once each repository pins the package it is the same in all
four.

**What it costs.**
- **Blame.** The format commit rewrote 178 files, 5,444 lines added and
  1,306 removed. GitHub's blame skips it by `.git-blame-ignore-revs`;
  `git blame` skips it only with `--ignore-revs-file` or
  `blame.ignoreRevsFile` set; and `git log -S` and `-L` see it, as does
  any tool that reads neither.
- **Every branch open under it conflicts at the format.** None was open
  on 30 October 2026. A branch begun before it takes the new `main`,
  resolves each conflict for its own change, and runs `pnpm format`.
- **A copy that can drift.** Until the swap, a rule changed in
  formancy.ai's package does not reach this repository, nor one changed
  here the package, and nothing compares the two.
- **Prettier loads the lint rules with the style.** `prettier.config.mjs`
  imports the module, and with it ESLint's plugins and TypeScript: 0.32 to
  0.34 s of each Prettier run, and of an editor's when it loads the
  config, measured three times on 30 October 2026 on the Mac above. The
  style in a module of its own would spare it, and would be a second file
  to copy.
- **Typed lint's time**, inside `verify`'s 15 minutes: 6.3 s on the Mac
  above, 6.7 s once JavaScript was held to typescript-eslint's rules, and
  about 14.7 s on CI's runner (run 41045406900, 30 October 2026, the
  step's wall time read from the job's log, once).
- **The test relaxations hide an `any` in a test.** A test may read a
  member a value does not have and pass the linter; tsc's strictness holds
  what is typed, and nothing holds what is not.
- **TypeScript's ceiling, twice.** typescript-eslint 8.72.1 admits
  TypeScript below 6.1.0, and the workspace refuses an unmet peer, so a
  move to 6.1 waits for it as it waits for formancy.ai's Angular 22, the
  catalog's reason for `~6.0.3`.
- **A Prettier release is a reformat.** Pinned exactly, Prettier formats
  one way; the change that moves it formats again, and that commit is one
  more for blame to skip.
- **A disable comment's reason** is review's to read: the rule checks only
  that there is one.
- **The merge method is remembered, not held.** The repository allows a
  squash, a rebase and a merge commit, `main` held no merge commit on 30
  October 2026, and nothing refuses the first two.

**What it forecloses.** A rule at `warn`; a style decided file by file;
and, once the package is pinned, a rule changed in one repository alone.

## Alternatives considered

**Biome.** One fast tool for both. Rejected: its type-aware rules do not
reach typescript-eslint's, and those -- the floating promise, the unsafe
`any`, the needless assertion -- are most of what a linter is worth here.

**No linter.** What all four repositories had. Rejected: the type-aware
mistakes go on uncaught, and the maintainer asked for the same quality in
all four.

**Lint per package, through turbo.** A `lint` script in each package,
cached. Rejected: the typed rules read every package's tsconfig and the
built declarations anyway; the scripts and the tool configs belong to no
package; one run from the root took 6.3 s; and a package's cached pass
would have to hash the root's rules to know they had changed.

**Warnings.** Rejected: a warning is a finding nobody has to fix, and a
guard that is not a gate is a comment.

**120 columns.** Rejected: 160 rewrote the fewest lines of the widths
measured, and one width across the four repositories is the point.
Measured on 30 October 2026 with Prettier 3.9.10 and the other three
options, over the 273 TypeScript and JavaScript files git held at
`72db2c8`, by `git diff --shortstat` after each run: 100 columns
rewrote 236 files, adding 19,213 lines and removing 4,233; 120 columns
225 files, adding 12,791 and removing 2,927; and 160 columns 177 files,
adding 5,443 and removing 1,302.

**Every kind of file formatted.** Rejected: Markdown is wrapped by hand to
each file's width, and a decision record rewrapped is one the limitations
register asks to be read again and stamped; JSON and YAML that a script
writes, `codecov.yml` and `docs/images/readme/captured.json` among them,
are the script's to lay out; and Prettier on HTML can change whitespace
that renders.

**`allowDefaultProject` for the tool configs.** typescript-eslint's project
service can lint a file no tsconfig holds against a default program.
Rejected: the configs would be linted with types and type-checked by
nothing; `tsconfig.tools.json` brings them into `pnpm typecheck`.

**`@eslint/compat`'s `includeIgnoreFile`.** What the first copy read
`.gitignore` with. Rejected: it is deprecated for ESLint's own, which
reads each file for its own directory; compat's reads a nested
`.gitignore`, as formancy.ai has, as though it stood at the root, and the
shared test's case of a nested one fails when it is read that way.

**Waiting for `@formancy/code-style`.** What 0002 asks of anything an
upstream does not yet offer. Rejected: the maintainer said on 30 October
2026 not to wait, the rules had to be written and proved in one repository
first, and formancy.ai had a pull request open that its reformat would
have conflicted with. The cost is the copy above.

**A hook before each commit** (husky, lint-staged). Rejected: CI is the
gate, a hook runs only where it was installed and `--no-verify` skips it,
and `pnpm format` is there to run by hand.

## Older records

[0002](0002-depend-on-upstream-never-copy-it.md) is not superseded. It
still has this repository depend on what formancy.ai releases, at an exact
version, and copy none of it; this record narrows its wait for a release:
the rules are written here first, and the copy goes when the package is
pinned. It was read again and stamped
(`node scripts/release-report/limitations.mjs --stamp 0002`), its Status
line naming this record.
