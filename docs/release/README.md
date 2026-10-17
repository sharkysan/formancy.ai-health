# What a release is judged against

The registers a conformance claim rests on
([0005](../decisions/0005-a-fhir-resource-is-proved-by-the-hl7-validator-against-pinned-guide-packages.md)).
Each is read by the validator gate, `scripts/validator.mjs`, and by
`scripts/compatibility.mjs`, which renders the README's compatibility
table from them; the release report, when it arrives
(formancy.ai-report 0014), reads them too.

- **[`validator.json`](validator.json)**: the HL7 FHIR validator the gate
  runs, one release's `validator_cli.jar`, by its version, the address of
  the asset, its SHA-256, its size, and the Java it needs.
- **[`ig-packages.json`](ig-packages.json)**: every FHIR package the
  validator loads, by exact version, with packages.fhir.org's address for
  it, its SHA-256, its canonical and its licence as its package.json
  states them, and which registered packages declare it.

Each file's `$comment` says what its fields mean. A download that is not
the registered bytes is refused before anything runs it; a run that loads
a package the register does not name, or does not load one it names, fails
the gate.

## Moving a pin

A new validator release or a guide version is a commit that changes the
register, with a CHANGELOG line saying why, and goes through the gate:

1. Run the new validator once, online, into an empty cache, with the
   guides the gate asks for, and read its `Package Summary`: that list,
   and nothing typed from a guide's page, is what the register holds.
2. Take each package's SHA-256 from the bytes packages.fhir.org serves,
   and its `canonical`, `licence` and dependencies from its own
   package.json; `declaredBy` is every registered package that declares it.
3. Run `node scripts/validator.mjs`, then `node scripts/compatibility.mjs
   --write`. The validator job runs `scripts/validator/registers.test.mjs`
   against what it downloaded, which fails when a field says other than
   the package does.

A guide in ballot is never chosen. A ballot a released guide declares is
registered all the same, because the guide depends on it: SDC 4.0.0
declares a ballot of the R4 extensions pack. The register's check refuses
a prerelease the gate asks for, and one no registered package declares.

Held by `scripts/validator/registers.test.mjs`, in `pnpm test:repo` and,
against the downloads and the run, in the validator job.
