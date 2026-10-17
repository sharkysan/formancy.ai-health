# 0009 — Build a CH ORF document of the host's referral in CH Core's and CH ORF's profiles, the Questionnaire by its canonical; hold the GLN and the AHV number to their systems here, since the validator only warns of them; and send nothing

- **Status:** accepted
- **Date:** 2026-10-17
- **Deciders:** Daniel Bacher
- **Verified by:** the tests of `@formancy/health-ch`,
  `@formancy/health-document`, `@formancy/health-questionnaire` and
  `@formancy/health-core`, run by their `test:coverage` jobs in CI; the
  validator gate; guards in `pnpm test:repo`; and the install gate:
  - **The identifiers**: health-ch's `identifiers.test.ts` holds GS1's
    check digit to GS1's own example (General Specifications 26.0, Table
    7-9: 37610425002123456 has the check digit 9) and to a sum that is a
    multiple of ten; a GLN under GS1's prefix 952 kept, one with a wrong
    check digit refused as `check-digit` naming no digit, each wrong form
    refused as `identifier`, a JavaScript number among them, and one that
    does not start 76 kept; an AHV number computed from a stem in memory
    kept, the same digits with every other check digit refused, and the
    printed form with points, another country's thirteen digits, twelve,
    fourteen, a space and a number each refused by its form; a host's own
    identifier kept under 2.999, and refused under each of CH Core's seven
    Swiss systems, in capitals and in mixed case too.
  - **The document**: `people.test.ts` holds the Patient, the
    PractitionerRole, the Practitioner and the Organization written
    exactly, each claiming its CH Core profile, the AHV number under its
    system, the host's numbers typed MR, and every refusal at once:
    ch-pat-1's and ch-pract-1's names, gender `unknown`, a GLN's and an
    AHV number's check digits, members the context does not name, a hole
    in a list at its index, and a name a resource cannot carry.
    `service-request.test.ts` the ServiceRequest, typed PLAC, R4's
    request codes, at least one, a hole among them refused.
    `response.test.ts` the host's answers carried as copied, refused
    without CH ORF's claim, of another subject than the patient, with an
    author or a source of no entry or of a type CH ORF does not allow,
    naming their Questionnaire without its version, holding a member
    toQuestionnaireResponse does not write -- `basedOn`, `encounter`,
    `partOf`, an id, a narrative -- or one of the host's naming, which is
    refused without the name; and a Proxy that answers one subject when
    read and another when copied checked as copied. `document.test.ts`
    the Bundle written exactly, its claim unversioned, the section's
    LOINC code with its long common name, the entries in CH ORF's
    example's order, the same bytes whatever order the context's names
    are in, every refusal of health-ch's at once and none quoting a
    value, a name given twice,
    each of health-document's refusals of the host's own values at the
    host's path, and a refusal of anything health-ch wrote thrown as a
    bug.
  - **What health-document, health-questionnaire and health-core gained**:
    health-document's `bundle.test.ts` holds the Composition's
    narrative written exactly, its titles escaped, a title XML cannot
    carry refused where it stands, and the Bundle's and the
    Composition's profile claims; it and `document-reference.test.ts` a
    member the context does not name refused at the object that holds it
    -- the document, its identifier, the Composition and its identifier,
    a coding, a reference, a section, an entry, a DocumentReference's
    context, its Binary and the PDF -- naming no member, and a hole in a
    list at its index; health-questionnaire's `response.test.ts` the
    host's profiles claimed after SDC's, each once, alone where SDC's is
    not, and refused when they are no list of canonicals or hold a hole,
    and it and `questionnaire.test.ts` a member of either context, the
    Questionnaire's inside the response's, or of a reference refused, and
    a null context refused as absent; health-core's `host.test.ts` the
    readers of a host's context, `known`, `objectAt` and `readItems`
    among them, a null refused rather than taken for absent, and a text
    with a character no resource can carry refused, `xhtml.test.ts` the
    escaping and every character XML 1.0 cannot carry, `refusal.test.ts`
    the four new rules.
  - **Conformance**, on the package's output: `node scripts/validator.mjs`
    judges the CH ORF document health-ch, as built, makes of a synthetic
    referral (scripts/validator/ch-orf.mjs) -- the intake's urgent answers,
    judged against the intake's Questionnaire, which the gate loads as a
    definition -- against CH ORF 3.0.2 on CH Core 6.0.0 with CH Term
    3.3.0, and accepts it with no error and no warning but dom-6 and
    CH Core's `gln-startswith76`, each registered with its reason; and
    eleven documents made of it with one thing broken, which the
    validator must refuse for exactly that: no narrative, the section
    under another LOINC code, no category, the document's identifier
    under another system, the Practitioner as author, no placer number,
    no order, a Practitioner without a family name (ch-pract-1 and the
    references that no longer match), answers of the Practitioner, and a
    GLN's and an AHV number's wrong check digits, which the validator
    only warns of and the gate, the warning unregistered, refuses.
  - **The registers**: `scripts/validator/registers.test.mjs` admits
    CC-BY-4.0 for `ihe.formatcode.fhir#1.4.0` alone, refuses it for that
    package at another version, another licence for it, and CC-BY-4.0
    for any other; holds that every range a registered manifest declares
    -- CH Core's `ch.fhir.ig.ch-term 3.3.x` -- is pinned at one release,
    with a note naming the range; and, where the validator job has run,
    every package's hash, manifest and `declaredBy` to the bytes, and
    the register to the validator's own load.
  - **The terminology**: `scripts/terminology.test.mjs` derives every
    Coding of the corpus and fails on a system that is not HL7's own, a
    LOINC code not recorded, without the display name recorded for it or
    without LOINC's notice in NOTICE, a SNOMED CT code no decision
    records, or a host's system under a real domain; its own probes are
    no terminology's content, a word for SNOMED CT and a LOINC-shaped
    code whose check digit is wrong.
  - **The synthetic identifiers**: `scripts/synthetic-identifiers.test.mjs`
    fails on an AHV number that passes its check in any file git holds
    or would add, however its digits are separated -- points, spaces, a
    regex's backslashes -- and on a GLN of the corpus that is under
    another prefix than GS1's 952 and passes its check.
  - **The corpus covers what health-ch writes**:
    `scripts/validator/corpus.test.mjs` derives the resource types
    `toChOrfDocument` writes -- Bundle, Composition, Patient,
    PractitionerRole, Practitioner, Organization, ServiceRequest -- and
    fails when one stands in no resource the gate accepts, or when the
    corpus's CH ORF document is not the package's.
  - **The guards**: `scripts/exact-and-reproducible.test.mjs` walks
    health-ch, `identifiers.ts`, `people.ts` and `document.ts` among its
    floor, and health-core's `xhtml.ts`, `characters.ts` and `host.ts`;
    `scripts/trademark.test.mjs` holds HL7's notice in every published
    package's README, health-ch's among them, and finds health-ch among
    the names;
    `scripts/ci-test-jobs.test.mjs`, `codecov-config.test.mjs`,
    `source-size.test.mjs` and `dependency-licences.test.mjs` find it.
  - **From outside**: `pnpm test:e2e:install` packs health-ch, writes a
    CH ORF document from the tarballs with answers health-questionnaire
    wrote, finds the claims, the LOINC section code with its name and the
    GLN's system in it and the entries in their order, catches a GLN's
    wrong check digit and a printed AHV number as health-core's
    `Refusal`, and fails its type-check if gender `unknown` compiles.

  On 17 October 2026 each was watched failing, the file restored byte for
  byte after, by a script that planted one change at a time and ran the
  suite that must catch it. In health-core: `&` written unescaped, a
  surrogate alone carried, an inherited value read. In health-document:
  no narrative, a title written unescaped, the Bundle's profile not
  written. In health-questionnaire: the host's claims not written, and a
  claim given twice written twice. In health-ch: GS1's weights counted
  from the left, an AHV number of another country taken, a local
  identifier under a Swiss system taken, unknown members taken, gender
  `unknown` taken, a patient's name without its given names taken --
  which first failed nothing, showing a case missing, written then --
  the response's claim, its subject's type and its Questionnaire's
  version unchecked, a name given twice taken, the orders written before
  the answers, the Bundle claiming its profile with a version, and no
  requester. The four new rules of health-core, the readers' and
  `xhtmlText`'s tests, the profiles' and the narrative's, failed before
  the code existed. In the guards: a `Number()` in health-ch's
  `identifiers.ts`; HL7's notice reworded in health-ch's README; a SNOMED
  CT code in the corpus's Composition; LOINC's notice in NOTICE without
  its ®, and NOTICE without it at all, before it was written; the CC-BY
  admission taken out of `registers.mjs`, and the case of it before the
  admission existed; CH Term's note without its range; the corpus
  without the CH ORF document; a health-ch source file of 601 lines; the
  test matrix, `codecov.yml` and the README's compatibility table each
  without health-ch, before each was written. In the gate, with every
  broken CH ORF document left unbroken, each of the eleven was said to
  be "broken for …, and the gate accepted it: nothing is watching that";
  and without `gln-startswith76` registered, the accepted document was
  refused for it. From outside, health-ch built to claim its Bundle's
  profile with a version failed the install gate.

  After review, the same day, the same way. In health-core: `optional`
  and `needed` taking a null for absent, `known` reading an array as an
  object, `readItems` walking with `map`, `text` keeping a control
  character, a surrogate alone taken. In health-ch: the response checked
  as read rather than as copied, the copy's refusals left at
  health-core's root, its members unchecked, its members read on the
  copy alone, the Swiss systems compared in their case, the given
  names and the orders walked with `map`, the section code without
  LOINC's name. In health-document: a coding's members unchecked, the
  entries walked with `map`, the PDF's members unchecked, a document
  that is no object read on. In health-questionnaire: either context's members unchecked, the claims
  walked past their holes. In the guards: the valid AHV number put back
  in the install fixture, as a JavaScript number in a test and as a
  regex in a TypeScript string, each found; the corpus's GLNs held to
  another prefix; and the terminology guard, before health-ch wrote the
  name, refused every CH ORF document for 93037-0 without it.

## Context

H07's acceptance, from the plan: a CH ORF document (Questionnaire by
canonical, QuestionnaireResponse, ServiceRequest, Patient,
PractitionerRole, Composition) from a synthetic referral form validates
against CH ORF 3.0.2 and CH Core 6.0.0 with zero errors; CH identifiers
(GLN, AHV) held to their systems; nothing posts it. Read and measured on
17 October 2026, each StructureDefinition from its package's
`package/StructureDefinition-<id>.json`, the guide's pages at
https://fhir.ch/ig/ch-orf/3.0.2/ as `index.html`:

- **The packages.** `ch.fhir.ig.ch-orf#3.0.2` declares CH Core 6.0.0, SDC
  **3.0.0** -- not the 4.0.0 the corpus's Questionnaires claim -- and
  `hl7.terminology.r4#7.0.1`. `ch.fhir.ig.ch-core#6.0.0` declares
  `ch.fhir.ig.ch-term` **`3.3.x`**, a range, and the ballot
  `hl7.fhir.uv.extensions.r4#5.3.0-ballot-tc1` the register holds for
  SDC 4.0.0. CH Term 3.3.0, the only 3.3 release packages.fhir.org lists,
  declares `ihe.formatcode.fhir#1.4.0`, whose package.json says
  **CC-BY-4.0**: IHE's formatCode code system, its value set and its
  guide, "Some content from IHE® Copyright © 2015 IHE International,
  Inc". The validator, offline and asked for SDC 4.0.0 and CH ORF 3.0.2,
  loads the registered fifteen and seven more, and nothing else: CH ORF,
  CH Core, CH Term 3.3.0, SDC 3.0.0, IHE's formatCode, and HL7
  Terminology 7.0.1 and 6.3.0. Online, into an empty cache, it loaded the
  same twenty-two. With CH Term 3.4.0, the plan's pin, in place of 3.3.0
  it stopped: "Unable to resolve package id ch.fhir.ig.ch-term#3.3.x";
  without IHE's package: "Unable to resolve package id
  ihe.formatcode.fhir#1.4.0". The existing corpus gave exactly its
  earlier errors and warnings with the seven loaded beside it.
- **The document** (`ch-orf-document`, on `ch-core-document`):
  `Bundle.identifier` 1..1, its system fixed `urn:ietf:rfc:3986`, its
  value "UUID as Document Identifier"; `entry:Composition` 1..1,
  `entry:ServiceRequest` **1..\***, `entry:QuestionnaireResponse` and
  `entry:Questionnaire` 0..1. index.html, Volume 2, "Submit Bundle [CH
  ORF-1]": "The FHIR Bundle.meta.profile shall include the value
  http://fhir.ch/ig/ch-orf/StructureDefinition/ch-orf-document"; the
  Bundle carries "the Composition resource and all resources referenced
  in, in particular one Questionnaire resource, one QuestionnaireResponse
  resource". Volume 3, of the user interface: "There may be good reasons
  to implement user interfaces by other technical means than
  questionnaires. Therefore CH ORF sets the cardinality for the
  questionnaire / questionnaireResponse to 0.. thus allowing authors of
  derivatives to decide if applications following their IG must
  implement a questionnaire / questionnaireResponse or not" -- a choice
  for a derived guide, not leave to carry a response without the
  Questionnaire it names. Volume 3, "CH ORF Document": "Any resource
  referenced directly in the Composition resource shall be included in
  the Bundle. Other resources that these referenced resources refer to
  shall also be included in the Bundle" -- the response the Composition
  refers to names its Questionnaire -- and "a Bundle as defined in this
  profile shall include a CSS stylesheets", which no slice and none of
  the guide's three example Bundles holds.
- **The Composition** (`ch-orf-composition`, on `ch-core-composition`):
  `Composition.text` **1..1**; `category` 1..1; `subject` a
  ch-core-patient; `author` 1..1, a **ch-core-practitionerrole** alone;
  `section:orderReferral` 1..1, its `code` fixed by
  `patternCodeableConcept` to LOINC `93037-0`, system and code, no
  display, its `entry:ServiceRequest` 1..\* and its response and
  Questionnaire 0..1. Type and category are preferred bindings to CH
  Term's SNOMED CT value sets `DocumentEntry.typeCode` and `.classCode`:
  "In the CH ORF exchange format, no fixed values are determined for
  these elements, only a preferred binding to specific value sets is
  made. These values are context-dependent and have to be specified in
  the corresponding derived exchange format" (index.html, Volume 3).
- **The order** (`ch-orf-servicerequest`): `identifier:placerOrderIdentifier`
  1..1, by `patternIdentifier` typed v2-0203 `PLAC`, its value 1..1;
  `status` and `intent` 1..1; `subject` a ch-core-patient; `requester` a
  ch-core-practitionerrole.
- **The answers** (`ch-orf-questionnaireresponse`, on R4's): nothing
  required beyond R4; `subject` a ch-core-patient; `author` a Device or
  one of CH Core's practitioner, role, patient, related person or
  organisation; `source` CH Core's patient, practitioner, role or related
  person; `basedOn` a ch-orf-servicerequest, `encounter` a
  ch-core-encounter, `partOf` R4's Observation or Procedure.
- **The people** (CH Core 6.0.0): `ch-core-patient` requires nothing; its
  identifier slices by value are `AHVN13` (`urn:oid:2.16.756.5.32`) and
  `LocalPid` (typed v2-0203 `MR`) among four; ch-pat-1, a warning, "at
  least one human name should have a family and a given name"; ch-pat-2,
  a warning, "gender 'unknown' is currently not used in Switzerland in
  eCH and the EPR". `ch-core-practitioner`: ch-pract-1, an **error**, "If
  a HumanName is provided, at least one HumanName must have a family
  name"; a GLN slice (`urn:oid:2.51.1.3`, 0..1). `ch-core-organization`:
  a GLN slice among four. `ch-core-practitionerrole` requires nothing.
  index.html, after Table 7: a person or an organisation "is defined by
  the PractitionerRole resource. The Practitioner and/or the Organization
  resource can then be referenced from the PractitionerRole resource."
- **The identifiers** (`ch-core-gln-identifier`,
  `ch-core-ahvn13-identifier`, `Identifier.value`): `gln-length`,
  `gln-modulus-10`, `gln-startswith76` "for Swiss HCP", `ahvn13-length`
  `^756[0-9]{10}$` and `ahvn13-digit-check` -- every one a **warning**.
  Measured: a wrong AHVN13 check digit raised the warning and no error.
  CH Term 3.3.0's NamingSystem `ahvn13`: it "shall not contain point
  characters for separation". GS1 General Specifications, Release 26.0,
  section 7.9.1: GS1's check digit "is identical for all fixed length
  numeric GS1 data structures (including GDTI, GLN, GRAI, etc.)", the
  digits weighted 3 and 1 from the right; Table 1-4: prefix "952 — Used
  for demonstrations and examples of the GS1 system". The BSV's page "Die
  AHV-Nummer" (updated 28 September 2026): the number is "völlig anonym
  und zufallsgeneriert", and names no range for tests.
- **What health-document, health-questionnaire wrote.** health-document
  wrote no narrative and no `meta.profile` (0008); the gate refuses a
  CH ORF Composition without `text` (`Validation_VAL_Profile_Minimum`,
  measured). health-questionnaire's response claimed SDC's profile only
  (0007), and a response that does not claim CH ORF's is held to none of
  it: one whose subject was the Practitioner was accepted unclaimed and
  refused claimed (`Reference_REF_BadTargetType`, measured).
- **What offline leaves unchecked.** A made-up SNOMED CT code at
  Composition.type and .category raised nothing, not even information;
  HL7's own codes there raised only information (`Terminology_TX_NoValid_3_CC`).
  The LOINC section code is held by its slice's pattern, which is
  structure, not terminology; written with its display after review, it
  drew no message at all.
- **What may be written.** Plan 15.3: no SNOMED CT or LOINC content
  bundled; LOINC's notice into NOTICE the day the first LOINC code is
  emitted; whether a SNOMED CT constant needs an affiliate licence is
  eHealth Suisse's question, before H10. LOINC's licence
  (https://loinc.org/license/, last updated 6 August 2026), section 10,
  for "products and services, such as ... software programs ...
  implementation guides", asks the notice, and that "Any information
  that is extracted from the Licensed Material must always be associated
  with the corresponding identifier from LOINC ... and include the
  corresponding LOINC display name" -- its fully-specified name, short
  name, long common name or display name; in messages, codes used "in
  conjunction with laboratory test results and clinical observations"
  need neither, the name "encouraged (but not required)". 93037-0's long
  common name in LOINC 2.82 is "Portable medical order form", read from
  HL7's terminology server's `$lookup`, since loinc.org refused the
  request; CH ORF's StructureMap `OrfQrToBundle` writes the same display.

## Decision

`@formancy/health-ch` builds a CH ORF 3.0.2 document of what the host
says of a referral, in CH Core 6.0.0's profiles, assembled by
health-document, and sends nothing; every refusal is health-core's
`Refusal`, at a path from `context`, never quoting a value -- a path
inside the host's answers repeats the names health-core passed through
(0004), below.

- **`toChOrfDocument(context)`** writes the Bundle, claiming
  `ch-orf-document` unversioned, as CH ORF's SHALL reads; the host's
  identifier, a `urn:uuid:`, under `urn:ietf:rfc:3986`; the Composition
  claiming `ch-orf-composition|3.0.2` with the host's status, type, one
  category, date and title, the patient as subject, the author's role as
  its one author, and the order-referral section, titled by the host,
  coded LOINC 93037-0 as the pattern gives it, with LOINC's name for
  it, holding the answers and then the orders; then the patient, the answers, the orders, the role,
  the practitioner and the organisation, the order of CH ORF's own
  example Bundle. Every resource but the Bundle claims its profile with
  its guide's version.
- **The Questionnaire by its canonical.** The response names the
  Questionnaire's versioned canonical, which toQuestionnaireResponse
  writes; the host publishes the Questionnaire; the Bundle does not hold
  it. A response that names its Questionnaire without a version is
  refused as `unversioned`.
- **The answers are the host's**, made by toQuestionnaireResponse with
  `profiles: [PROFILES.questionnaireResponse]`, copied once by
  health-core's writer and reader, and that copy is held to CH ORF here
  and carried: claiming its profile (`profile`), about the patient,
  written down and given by entries of the document of the types the
  profile allows (`reference`, `dangling`), and holding no member
  toQuestionnaireResponse does not write -- `basedOn`, `encounter`,
  `partOf`, which CH ORF types and nothing here would hold to it, an id,
  a narrative -- each refused as `unmapped` at the response. A member of
  the host's own naming is refused before the copy, so that no refusal
  of the copy spells it.
- **The people and the orders are health-ch's to write**, from the host's
  values: a Patient with the AHV number under its system and the host's
  numbers typed MR, a family and given names, gender, but never
  `unknown`, birth date; a Practitioner with a GLN and a family name; an
  Organization with a GLN and a name; the PractitionerRole of the two;
  each ServiceRequest typed PLAC with R4's status, intent and priority,
  the patient, the role as requester.
- **The identifiers are held here.** A GLN is thirteen digits and GS1's
  check digit; an AHV number 756, nine digits and GS1's check digit,
  without points. Each is refused as `identifier` or `check-digit`. One
  that does not start 76 is a GLN all the same, kept. A host's own
  identifier may stand under no system of CH Core's seven, in any case:
  RFC 8141 makes `urn` and the namespace identifier case-insensitive,
  and an OID's digits have none. `gln()` and
  `ahvn13()` are exported; health-core gains the rules `identifier`,
  `check-digit`, `profile` and `unversioned`, and `reference` covers a
  type the guide does not allow as well as R4.
- **Nothing unnamed, nothing skipped.** A member the context does not
  name is refused as `unmapped` at the object that holds it, the
  member's name not repeated: a person's address passed and left out
  would be the silent drop this repository refuses. health-core's
  `known` and `objectAt` decide it, and health-document and
  health-questionnaire read their own contexts with them too (0006, 0007
  and 0008 narrowed), so that health-ch no longer repeats which members
  a coding has. A hole in a host's list -- which JSON never has, and
  `map` walks past -- is refused at its index by health-core's
  `readItems`, in every package's lists; health-questionnaire's already
  read every index.
- **One decision, one place.** What a Composition's values must be, the
  timestamp's, and every reference and entry of the document, health-document
  decides; it is asked only of a context health-ch accepts, and its
  refusals of the host's own values are given at the host's paths, a
  refusal of anything health-ch wrote thrown as a bug. The readers of a
  host's context -- `valueAt`, `needed`, `optional`, `text`, `codeOf` --
  move from health-document to health-core, which every package reads a
  context with, beside `known`, `objectAt` and `readItems`; the readers
  of datatypes health-document writes stay in it. `text` holds what a
  resource can carry as `xhtmlText` does, by one rule
  (`characters.ts`): no control character but the tab and the line
  breaks, no surrogate alone, no U+FFFE or U+FFFF, refused as a
  string's `grammar`.
- **health-document gains** a Composition narrative, `generated`, of its
  title and its sections' titles as headings, escaped by health-core's
  new `xhtmlText`, which refuses what XML 1.0 cannot carry; and
  `DocumentContext.profile` and `CompositionContext.profile`, written in
  each one's `meta` (0008 narrowed). **health-questionnaire gains**
  `ResponseContext.profiles`, claimed after SDC's in the one place a
  response's meta is written (0007 narrowed).
- **No SNOMED CT; one LOINC code, with its name.** health-ch writes no
  SNOMED CT code: type and category are the host's. It writes LOINC
  93037-0, which CH ORF fixes, recorded with that reason, and with its
  long common name, "Portable medical order form", in the source and in
  the Bundle, as LOINC's licence asks of a program and encourages of a
  message; LOINC's notice stands in NOTICE and health-ch's README. The
  corpus's type and category are HL7's own codes, `v2-0270#CN` and
  `v3-ActClass#DOCCLIN`.
  `scripts/terminology.test.mjs` holds every code system the corpus
  writes to a register of their terms: CLAUDE.md's "Terminology joins a
  guard with the first code a package emits".
- **The gate loads CH ORF 3.0.2**, as `ig`, and with it CH Core 6.0.0,
  CH Term **3.3.0**, SDC 3.0.0, IHE's formatCode 1.4.0 and HL7
  Terminology 7.0.1 and 6.3.0, each registered from the bytes
  packages.fhir.org serves; CH Term's entry notes the range it answers.
  `registers.mjs` admits **CC-BY-4.0 for `ihe.formatcode.fhir#1.4.0`
  alone** (0005 narrowed): the gate downloads it in CI and no package of
  this product carries it. `gln-startswith76` is registered, with the
  reason that the corpus's GLNs are under GS1's prefix 952.

## Consequences

**What it buys.**
- **The acceptance, on the output.** The document health-ch writes of a
  synthetic referral is accepted against CH ORF 3.0.2 and CH Core 6.0.0
  with zero errors by the HL7 FHIR validator 7.0.2, offline, and eleven
  documents broken from it are refused for their reasons; the GLN and
  the AHV number are refused here for a wrong form or digit, where the
  validator only warns.
- **A failure names its cause.** Each resource claims its profile, so a
  Practitioner without a family name is refused as ch-pract-1, not only
  as a cascade of slices that no longer match; the answers' subject is
  refused here as the subject, not as a slice.
- **The same input, the same bytes**, and a document of the host's values
  alone: no identifier, name or instant is made here.

**What it costs.**
- **The Questionnaire is not in the Bundle, against two of CH ORF's
  SHALLs.** CH ORF-1's prose asks for "one Questionnaire resource", and
  Volume 3's "CH ORF Document" that "Other resources that these
  referenced resources refer to shall also be included in the Bundle":
  the response the Composition refers to names its Questionnaire, by
  canonical. The profile's `entry:Questionnaire` is 0..1, so the
  validator accepts the document; a receiver that follows the prose
  finds the Questionnaire missing and resolves the canonical itself,
  which the host publishes there. The guide's "0.." is a derived
  guide's choice to have no questionnaire, and is not read here as leave
  to leave out one a response names. Carrying it is possible later: the
  corpus's own Questionnaire, claiming `ch-orf-questionnaire` too, was
  accepted with sdc-3 and information alone (measured). Neither does the
  formancy Questionnaire claim `ch-orf-questionnaire`, and CH ORF's
  "generic elements" of one -- index.html: "A Questionnaire shall have a
  set of generic elements (e.g. author, data entry person, receiver
  etc.)", Table 7 -- are held by no profile, and not here.
- **Much of CH ORF is not offered**: the Composition's receiver, copy
  receivers, urgent contacts, data enterer, initiator, precedent
  document, antecedent episode and consent; the filler's number;
  Coverage, Appointment, Encounter, RelatedPerson, Location; addresses
  and telecoms; EPR-SPID, VEKA, ZSR, BER, UIDB; a response's `basedOn`;
  a PDF, as a `ch-orf-documentreference`, whose author is a
  ch-core-practitionerrole alone where health-document's allows six, or
  as the original representation, a Binary of PDF/A-1 or -2, which waits
  for H09. A host that has one of these cannot send it in H07: its member
  is refused, not left out.
- **The stylesheet** CH ORF's prose says a Bundle "shall include" is not
  written; no slice and none of the guide's examples holds one, and
  health-document refuses an entry nothing refers to.
- **Two passes for two kinds of fault.** health-document is asked only of
  a context health-ch accepts, so a context wrong in health-ch's way and in
  the Composition's is refused for the first, and for the second on the
  next attempt; and a name given twice is looked for only when every part
  was read.
- **A narrative of titles only, short of R4's definition of one.** R4
  defines `Composition.text` as a narrative that "is required to contain
  sufficient detail to make it 'clinically safe' for a human to just
  read the narrative" (hl7.fhir.r4.core 4.0.1,
  `StructureDefinition-Composition`, `Composition.text`). Headings do
  not: a viewer that shows only the narrative shows a referral of a
  title and a section title, and no section carries a narrative of its
  own. It says nothing of the patient, the author, the answers or the
  orders, which a receiver renders, as CH ORF's Questionnaire Receiver
  "renders" the Bundle; nor do the other resources carry one, dom-6
  registered with its reason. It is not taken from the host: a host's
  XHTML would need a reader of R4's allowed markup, which nothing here
  has. CH ORF's 1..1 is met; R4's sentence is not, and nothing checks
  it.
- **A licence the dependency policy refuses, in the gate.** CC-BY-4.0
  asks attribution of who shares the material; the gate downloads IHE's
  package and shares nothing, and no package of this product carries
  it. There is no CH Core without it. A new version of it, or another
  CC-BY package, is a decision again.
- **A warning accepted by its id everywhere.** `gln-startswith76` is
  accepted wherever the corpus raises it, as every registered warning is
  (0006): a GLN under a Swiss prefix in the corpus would never be refused
  for it. None is there, and none can be: nothing shows of such a GLN
  that nobody holds it.
- **No valid AHV number in any file, and a guard that says so.** None is
  reserved for tests, and one that passes its check may be a person's.
  The first build of H07 said so and wrote the AHV number printed as an
  example in many places, which is valid -- its digits pass GS1's check
  and CH Core's `ahvn13-digit-check` -- into
  health-ch's tests and README and the install fixture, where four older
  tests of health-core and health-questionnaire held it too; review
  found it. Each is now a number whose check digit is wrong, and
  `scripts/synthetic-identifiers.test.mjs` fails on a valid one in any
  file. Two of health-ch's tests compute a valid number in memory from
  the stem 756000000001 that the file holds, so that number is
  derivable from the file though written in none, and may be a person's.
  The corpus's one AHV number has a wrong check digit, which makes it
  nobody's. Whether the ZAS names test numbers for software vendors is
  the maintainer's question; the ordinance's text, AHVV Art. 133, was
  not read for this record.
- **The gate never judges an AHV number it should accept.** The accepted
  document holds none, and the corpus's one is refused for its digit:
  the acceptance's "AHV held to its system" rests on health-ch's tests
  and on CH Core's constraints as read, not on a validator verdict over
  a valid number. One in the corpus would be published with the gate's
  results; the ZAS's answer above decides whether one can be.
- **A refusal inside the host's answers can spell a name the host
  chose.** A member of the response health-ch does not carry is refused
  without its name, before the copy; below the response's own members
  -- in an item, an answer -- a refusal health-core's writer or
  health-document gives carries health-core's path, which repeats the
  names it passed through (0004). They are FHIR's where
  toQuestionnaireResponse wrote them; a host that wrote its own there
  sees its name in the path.
- **H05's and H06's hosts are refused where they were not.**
  health-document and health-questionnaire now refuse a member of their
  context they do not name -- a display beside a reference, a coding's
  version, a Composition's confidentiality, an encounter -- a context
  that is no object, which health-questionnaire read into a TypeError,
  and a hole in a list. A host whose value was dropped is now told.
- **What a text may hold, held stricter than R4.** health-core's `text`
  refuses a control character but the tab and the line breaks, of which
  R4 says only that a string "SHOULD not" hold them
  (https://hl7.org/fhir/R4/datatypes.html, read the same day), and a
  surrogate alone, U+FFFE and U+FFFF, which no XML form of a resource
  carries; a receiver may take a name health-ch refuses. The validator
  was not asked about any of them. health-questionnaire's answers and
  item texts are not read with `text` and are held to none of it, as
  0006 and 0007 left them.
- **Codes unchecked offline.** Composition.type and .category draw nothing
  for a made-up SNOMED CT code under CH Term's preferred value sets; the
  LOINC section code is held by its pattern alone; every form and digit of
  a GLN or an AHV number is a warning to the validator. The corpus shows
  HL7's codes at type and category where a host will send CH Term's
  SNOMED CT ones, under its own licence (Switzerland is a member; eHealth
  Suisse is the NRC), so the gate has not judged the codes a host sends.
- **The host must pass the claim.** A response made without
  `profiles: [PROFILES.questionnaireResponse]` is refused; nothing here
  appends it, since that would be a second place writing a response's
  meta.
- **CH Term 3.3.0, not the plan's 3.4.0**, because CH Core declares 3.3.x
  and the validator cannot load it otherwise. With CH Term 3.4.0's newer
  value sets a host's codes may be judged otherwise by a receiver.
- **SDC 3.0.0 loads beside 4.0.0.** CH ORF's Questionnaire profile is
  built on 3.0.0's; the corpus gave its earlier verdicts with both loaded.
- **The gate's time.** The corpus is forty-seven resources, twelve to
  accept. The first run after the seven packages arrived took 325.8 s of
  validator (281.8 loading, 41.5 validating), indexing them, as first runs
  did before. With the package cache kept, five runs took 28.3, 460.8,
  40.6, 128.9 and 114.7 s (loading 18.9, 394.7, 29.9, 100.1 and 102.7;
  validating 6.8, 59.7, 8.4, 23.9 and 9.5), on Java 25.0.4.1, on
  17 October 2026 under Windows 11, on the machine 0005 names, the spread
  unexplained: the H06 runs on the same machine were 23.6 to 31.5, and
  loading the seven new packages took 2.2 s of a 25.4 s load when it was
  measured alone. After review, the same day and machine, two more runs
  took 404 and 336 s (loading 340.2 and 307.6; validating 61.6 and
  26.1). A CI runner has not been measured with this corpus.
- **health-document's and health-questionnaire's output changed**: every
  Composition now has a narrative, so H06's documents' bytes changed, and
  the validator no longer warns dom-6 of a Composition.

**What it forecloses.**
- A CH ORF document that names a GLN or an AHV number nothing checked, or
  that leaves out what the host said.
- An identifier, a fullUrl or an instant made here, and a document sent
  from here.

## Alternatives considered

**The Questionnaire in the Bundle.** It validates, measured. Rejected for
H07: the acceptance and plan section 9 say by canonical, and the
Questionnaire is the host's to publish once, not to copy into every
referral; carrying it is a later option, with health-questionnaire's
Questionnaire claiming `ch-orf-questionnaire`.

**A host's XHTML narrative**, or status `empty`. Rejected: the first needs
a checker of R4's allowed markup, an attack surface for a title; the
second asks the div to say "No human-readable text provided in this case"
in a language health-document would choose. No narrative at all the gate
refuses.

**health-ch post-processing health-document's Bundle**, adding the
narrative and the claims itself. Rejected: two places deciding what a
Composition is.

**health-ch checking the Composition's values itself**, so that every
refusal comes in one pass. Rejected: a second place deciding them, which
would drift from health-document's the first time health-document gained a
check.

**Host-supplied FHIR JSON for the people**, held to CH Core here.
Rejected: a profile validator inside a package, and every element of a
Patient the host could send to be held; the context names what health-ch
writes.

**health-ch appending CH ORF's claim to the host's response.** Rejected:
a second place writing a response's meta.

**health-ch taking the form and the answers and calling
toQuestionnaireResponse itself.** Rejected: its declarations would name
`@formancy/spec`'s FormSchema, a dependency health-ch does not have; the
host calls the one export it already calls.

**CH Term 3.4.0.** The validator cannot load CH Core with it.

**Refusing a GLN that does not start 76.** Rejected: a GLN of another
country is a GLN, CH Core warns of one only "for Swiss HCP", and a
referral's author, whose GLN health-ch writes, may practise outside
Switzerland.

**Accepting the printed AHV number with points.** Rejected: one spelling,
as CH Term's NamingSystem has it, and nothing here guesses that a string
with points is the number.

**The guide's examples' GLNs and AHV numbers** (`7601000…`, CH Core's
`Patient-MarvinMuster.json`). Rejected: nothing shows they are nobody's.

**SNOMED CT at type and category in the corpus**, the examples' two
identifiers, recorded here. Rejected for H07: it puts SNOMED CT
identifiers in a public repository, which plan 15.3 asks eHealth Suisse
about before H10. The terminology guard's own probe held one, CH ORF's
"Record artifact", until review; it is a word now.

**93037-0 without its display**, as the pattern gives it, so that no
LOINC text is carried. Rejected in review: LOINC's licence asks content
a program carries to bear its display name, the pattern takes one, and
CH ORF's own StructureMap writes it.

**health-ch alone refusing the members it does not name.** Rejected in
review: health-document's and health-questionnaire's hosts met the
silent drop health-ch refused, and health-ch repeated which members
health-document's coding has, which would have drifted the first time
that changed.

**A fuller narrative** -- the patient's and the author's names, the
orders. Rejected for H07: health-document types none of the entries it
would render, and health-ch writing it would be a second place deciding
what a Composition says; R4's gap is recorded instead.

**Type-checking a response's `basedOn`, `encounter` and `partOf`**
against the document's entries, as its subject is. Rejected:
toQuestionnaireResponse writes none of them, so a host's response that
holds one was not made by it, and CH ORF's `basedOn` alone could name an
entry of this document.

**No CH Core**, to keep CC-BY out of the gate. Rejected: there is no CH
ORF document without it.

**Teaching the registers' test every kind of range.** Rejected for now:
it reads `x.y.x`, the one shape a registered manifest declares, and fails
on any other until it is taught.
