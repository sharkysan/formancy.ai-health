# 0010 — Document the architecture in arc42's sections, under formancy.ai's file names, and hold what a test can see of it to the repository by a guard

- **Status:** accepted; its guard reads Markdown through `scripts/markdown.mjs`, fences in quotes and lists as GitHub does, by [0011](0011-a-release-report-is-derived-from-the-run-that-gated-it.md)
- **Date:** 2026-10-17
- **Deciders:** Daniel Bacher
- **Verified by:** `scripts/architecture.test.mjs`, in `pnpm test:repo`,
  which CI runs on every pull request and a release before it publishes:
  - **Its reading, on fixtures**: every link GitHub follows -- wrapped, an
    image, one with a title, a definition -- and none in a code span or a
    code block; GitHub's anchor for a heading with a number, code, a link
    or a dash in it, and for one given twice; each link refused with its
    reason -- past the root, to a directory, to a file git ignores, a line
    anchor into source, a heading that is not there -- beside one that
    works; a package's name found whole and not inside a longer one; no
    name, heading, link or path read inside a code block or an HTML
    comment; which code spans are paths and which are words; and each path
    found -- by its whole path or the segments it ends in, as a directory,
    as a glob, from the document -- or refused: a file's name changed,
    half a segment, a file read as a directory, a directory that holds
    nothing, a glob that matches nothing, a path past the root.
  - **On the real tree** it fails when:
    - (a) a section or `docs/README.md` is missing, the entry does not link
      every section, or `docs/architecture/` holds anything else;
    - (b) a workspace package or app, read from `pnpm-workspace.yaml`'s
      globs and each manifest's `name`, is not named in the building
      blocks;
    - (c) a decision record is linked from no section;
    - (d) a relative link in the entry or a section names no file git
      would commit, or a fragment no heading of the Markdown file it
      points into;
    - (e) a path the entry or a section writes as code names no file git
      would commit, tracked or new and on the disk;
    - git would commit a kind of file whose extension (e) does not read a
      bare name by;
    - and, a guard on the guard, it read no package, record, link, anchor
      or path at all.

  **Watched failing** on 17 October 2026, each defect planted in the real
  files on its own, the guard run, and the files put back byte for byte,
  `sha256` over `docs/` and `scripts/` the same before and after. Each
  failed the one test of its rule and no other:
  - (a) a thirteenth file in `docs/architecture/`; the entry's link to the
    glossary taken out;
  - (b) `@formancy/health-document` given a letter more wherever the
    building blocks name it;
  - (c) a record in `docs/decisions/` that no section links;
  - (d) section 9's link to health-questionnaire's `texts.test.ts` pointed
    at a file of another name; the entry's fragment into 10.3 reworded;
  - (e) the code span of that same link renamed while the link stayed
    right, which (d) passes; `LICENSE.md`, named in the building blocks
    and not linked, misspelt; and a file of a kind the guard does not
    read, a `.txt`, put at the root, which failed the test of the kinds.

  Rule (e) was written test-first: its two cases on fixtures, its case on
  the real tree, the case of the kinds and the guard on the guard failed,
  for want of what they call, before the reading was written. Its first
  run on the real tree found seven spans that named nothing git would
  commit: the validator's verdict, in two sections, and its download
  cache, both gitignored; GitHub's own actions, in two, and a reference's
  shape, each written with a slash; and the limitations register this
  repository does not have. Each was reworded or pointed at what holds
  it, and the rule left as it was.

  Rebased onto `main` with H07 merged
  ([0009](0009-a-ch-orf-document-is-the-hosts-referral-in-ch-core-and-ch-orf-the-questionnaire-by-canonical-and-swiss-identifiers-checked-here.md)),
  the guard failed on the real tree with nothing planted, as it should: (b)
  for `@formancy/health-ch`, named nowhere in the building blocks, and (c)
  for 0009, linked from no section. It passed once the sections described
  H07.

  **Not checked**, and review's:
  - whether a sentence is still true of what it links or names;
  - whether a package is described where it is named: one named once, in
    a sentence of section 5, passes (b), and the *May import* column is
    compared with no manifest, nor with `CLAUDE.md`'s package path or the
    records, as section 5 says;
  - whether a record is linked from the section it changes, rather than
    from any;
  - which file a bare name means where several end in it, as `context.ts`
    and `refusals.ts` do in two packages each;
  - a name with neither a slash nor an extension, `NOTICE` or `.npmrc`,
    which (e) reads as a word;
  - the links into other repositories, which are not followed;
  - that the links, the anchors and the code spans are read as GitHub
    reads them: the reading is the guard's own regular expressions,
    proved on the fixtures above, and no page GitHub rendered was
    compared. An underlined heading's anchor is not seen, so a link to
    one is refused, which is the safe side.

## Context

Until this record the architecture was the decision records, the root
README, the packages' READMEs and `CLAUDE.md`'s package path. A record says
why one thing is as it is; none says how the pieces fit, what a host
supplies, what each gate proves and what it does not, or where the accepted
costs are written down. The rightsholder asked that every change be
documented.

formancy.ai documents its architecture as arc42, in the sections of
[its `docs/architecture/`](https://github.com/sharkysan/formancy.ai/tree/main/docs/architecture),
and its `CLAUDE.md` asks a change to update the section it touches; review
holds that there. Formancy Report and Formancy Data document theirs in the
same files, each with a guard of its own
([formancy.ai-report 0026](https://github.com/sharkysan/formancy.ai-report/blob/main/docs/decisions/0026-the-architecture-is-documented-in-arc42s-sections-held-to-the-repository-by-a-guard.md),
[formancy.ai-data 0076](https://github.com/sharkysan/formancy.ai-data/blob/main/docs/decisions/0076-the-architecture-is-documented-as-arc42-and-every-change-updates-the-section-it-touches.md)).

This repository's `CLAUDE.md` asks that a claim in prose be backed by
something that fails, and an architecture states facts about the
repository on every page: which packages there are, which record argues
what, which file holds a rule, which test holds a scenario. Each goes
stale in silence when a package is added, a record written or a file
renamed, because prose does not break.

## Decision

The architecture is documented as arc42 in `docs/architecture/`, under the
file names formancy.ai gives its sections, and nothing else is in that
directory. arc42's section on decisions is the records in
`docs/decisions/`, so 9 is arc42's quality requirements and 10 is
formancy.ai's verification, which arc42 does not have. `docs/README.md` is
the entry: who should read what, every section, and the records. A
statement of design links the record that argues it, a claim a test or a
gate holds links that test or gate, and the rest says it is review's.

`scripts/architecture.test.mjs` holds, in `pnpm test:repo`, what a test can
see of it, each read from the files and none from a phrase of the prose:

- (a) the entry and the sections, the entry linking each, and nothing else
  beside them;
- (b) every workspace package and app named in the building blocks;
- (c) every decision record linked from a section;
- (d) every relative link reaching a file git would commit, and every
  fragment a heading GitHub anchors;
- (e) every path written as code in the entry or a section naming a file
  git would commit: a span with a slash, or with the extension of a kind
  of file the repository holds, read from the document when it starts at
  `./` or `../`, and otherwise as the end of a committed path in whole
  segments, a directory or a glob included. Nothing in a fenced block or
  an HTML comment is read.

`CLAUDE.md` names the architecture among the documents a change keeps
true: the section the change touches, in the pull request that makes it.

## Consequences

**What it buys.**
- **One place for how the pieces fit**: what each package may import, the
  flows, what a host supplies, what each gate proves and does not, the
  accepted risks, each with the record behind it.
- **A change that leaves the sections behind fails.** A package or a
  record added, or a file the sections link or name renamed, fails
  `pnpm test:repo` until they say so.
- **The shape of formancy.ai's and Report's.** A reader who knows either
  finds a section here by its number.

**What it costs.**
- **Every change pays a little.** A new record needs a link from a
  section, a new package its name in the building blocks, and a renamed
  file its name changed wherever a section writes it, each in the same
  pull request.
- **What git would not commit cannot be written as code.** A gitignored
  output -- the validator's verdict, its download cache -- and a file of
  another repository are named in words, by the constant that holds the
  path, or by a link to the other repository; anything with a slash that
  is not a path -- a reference's shape, a media type, an organisation's
  actions -- is written otherwise, since a slash makes a path.
- **A bare name is read by a list.** The extensions (e) reads a bare file
  name by are written in the guard rather than derived, so that the last
  file of a kind deleted still leaves its name refused; a new kind of file
  fails `pnpm test:repo` until the list holds it.
- **The guard is its own Markdown reader, and needs git.** It reads links,
  headings and code spans with regular expressions of its own, proved on
  fixtures and on no page GitHub rendered, and lists the files with
  `git ls-files`, so it fails outside a checkout.
- **What it cannot see is review's**, as *Not checked* lists and the
  entry says: a sentence's truth above all.

**What it forecloses.** A file in `docs/architecture/` that is not one of
the sections, a picture beside them -- a diagram is text in a code block,
or a file elsewhere -- sections named otherwise than formancy.ai's, and a
path written as code to anything git would not commit.

## Alternatives considered

**arc42 held by review alone**, as formancy.ai's `CLAUDE.md` asks for its
sections. Rejected, on this repository's rule that a claim in prose is
backed by something that fails. The seven spans rule (e) found on its
first run were written in the pull request that brought the sections, and
nothing had refused them. Report rejected it for the same reason
([formancy.ai-report 0026](https://github.com/sharkysan/formancy.ai-report/blob/main/docs/decisions/0026-the-architecture-is-documented-in-arc42s-sections-held-to-the-repository-by-a-guard.md)).

**The building blocks generated from the manifests**, as `codecov.yml` is
generated from the workspace. Rejected: the packages' *May import* and
the modules' *Responsibility* are prose about what a package may take and
what a module does, which no manifest holds, and a generated table beside
a written one is two tables. The versions the packages are built and
judged against are derived already, in the README's compatibility table.

**No arc42, the records alone**, with the READMEs as before. Rejected: a
record says why one thing is as it is, not how the pieces fit, and a reader
would assemble what each package may import, the flows and what each gate
proves from every record and every README. The rightsholder asked for the
architecture to be documented.
