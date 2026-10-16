# 0001 — A paid module lives in its own repository, under Formancy Data's and Formancy Report's terms, in force before a lawyer has read them

- **Status:** accepted
- **Date:** 2026-10-16
- **Deciders:** Daniel Bacher
- **Verified by:** `scripts/verify-licenses.mjs`, run by `gates.yml` on every
  pull request and before every release, refuses any publishable package whose
  `license` field is not `SEE LICENSE IN LICENSE.md` or whose tarball would
  ship without `LICENSE.md` and `NOTICE`; `scripts/release/pins.mjs` refuses
  the same in the tarballs a release would publish.
  `scripts/licence-status.test.mjs`, in `pnpm test:repo`, refuses a
  `LICENSE.md` whose version line is not a licence in force that says no
  lawyer has reviewed it, and a README whose licence sentence says anything
  else. That nothing here is copied from formancy.ai, Formancy Data or
  Formancy Report is held by
  [0002](0002-depend-on-upstream-never-copy-it.md)'s guard for dependencies
  and by review for source. That the licence's terms are Data's and Report's
  is held by review: nothing compares the three texts. That the whole export,
  its generic core included, stays here is held by review too.

## Context

formancy.ai made two decisions on its first day that every paid Formancy
product is read against.
[formancy.ai 0002](https://github.com/sharkysan/formancy.ai/blob/main/docs/decisions/0002-apache-2-0.md)
is Apache-2.0 for everything, with no proprietary edition of that code, ever.
[formancy.ai 0003](https://github.com/sharkysan/formancy.ai/blob/main/docs/decisions/0003-open-core-line.md)
draws the commercial line at operating the platform rather than at using it,
and rejected a source-available licence *for formancy itself*. Its sold list
names managed hosting, multi-tenancy, SSO/SAML, audit logs, PDF and
e-signature, analytics and support. It does not name an export to a
healthcare standard, and formancy has never had one.

Two paid modules have answered the same question since, the same way.
[formancy.ai-data 0001](https://github.com/sharkysan/formancy.ai-data/blob/main/docs/decisions/0001-a-paid-module-in-its-own-repository.md)
put a database module in a repository of its own, under a source-available
licence of its own, with the Apache-2.0 packages depended on rather than
copied. Its licence has been in force since 11 October 2026, at Version 1.1,
unreviewed by a lawyer and saying so at the top
([formancy.ai-data 0048](https://github.com/sharkysan/formancy.ai-data/blob/main/docs/decisions/0048-the-licence-is-in-force-before-a-lawyer-has-read-it.md),
[0054](https://github.com/sharkysan/formancy.ai-data/blob/main/docs/decisions/0054-version-1-1-names-the-address-for-a-redistribution-agreement-too.md)).
[formancy.ai-report 0001](https://github.com/sharkysan/formancy.ai-report/blob/main/docs/decisions/0001-a-paid-module-in-its-own-repository.md)
did the same for the PDF item on 0003's list, on Data's terms, in force from
14 October 2026, also unreviewed and saying so. Both released 0.1.0 on
16 October 2026.

Formancy Health exports a formancy form, a person's answers to it and a PDF
that Formancy Report rendered, to resources in the HL7® FHIR® standard,
shaped to the profiles a country publishes. It is sold to the vendors whose
software hospitals and practices run, to ship inside their own products, and
it is expected to be bought with Report, whose PDFs its documents carry.

## Decision

Formancy Health is a separate repository under its own licence, the
**Formancy Health Source-Available Licence**. Its terms are Formancy Data's
Version 1.1 and Formancy Report's Version 1, with this product's names, with
the health records it is given named as the customer's data, and with the
FHIR resources it generates named as the customer's. It:

- is free to read, fork, evaluate, develop and test, including inside a
  company and without an expiry;
- needs a paid licence to run in production;
- needs a separate agreement to redistribute, which is how a vendor ships it
  inside a product.

**The whole export is this product**, the generic mapping of a form to the
HL7 Structured Data Capture guide included, not only the country profiles.

It depends on the released `@formancy/*` packages and contains none of their
code. Its packages publish under the same `@formancy` scope as
`@formancy/health-*`, each declaring `SEE LICENSE IN LICENSE.md` and
carrying `LICENSE.md` and `NOTICE`.

Version 1 is in force from 16 October 2026, before a lawyer has read it. It
says so at the top, as Data's and Report's do. Contributions are taken under
a CLA that grants the right to sublicense, and assigns no copyright.

## Consequences

**What it buys.**
- **No change upstream.** A revenue line that touches neither formancy's
  licence nor its promise that a self-hoster never hits a paywall: a
  self-hoster of formancy never had an export to FHIR to lose.
- **One kind of agreement.** Data, Report and Health are on the same terms,
  so a Report + Health bundle is one kind of agreement. With different terms
  it would need a compatibility review between licence families.
- **A free trial.** Evaluation costs nothing and never expires, so a vendor
  builds against the module before anybody names a price.

**What it costs.**
- **Four repositories to keep in step.** That cost has its own record,
  [0002](0002-depend-on-upstream-never-copy-it.md).
- **A mixed scope.** The `@formancy` scope mixes Apache-2.0 packages with
  source-available ones. The `license` field, the shipped `LICENSE.md`, the
  NOTICE and the word "source-available" in every README answer that
  confusion, and the guard above keeps a copied manifest from undoing it.
- **Dependencies narrowed.** Neither GPL nor AGPL code can ship inside a
  product whose source is public and whose production use is licensed. Nor
  can code under a non-commercial licence. A commercial component needs
  written redistribution rights. An implementation guide package or a
  terminology keeps its own terms, and SNOMED CT and LOINC content is not
  bundled at all. Each is written down where the dependency arrives.
- **No free export for formancy's users.** A self-hoster of formancy gets no
  FHIR export without a production licence for this product. That is the
  price of keeping the generic core here.
- **An unreviewed licence.** Until a lawyer reviews it, the licence is a
  statement of intent made carefully, not a reviewed contract. A customer's
  production agreement is the document that governs, and the first paid
  release waits for that review.

**What it forecloses.**
- Moving this code into formancy.ai without first relicensing it under
  Apache-2.0.
- Calling Formancy Health anything but source-available, anywhere, ever.
- Moving the form-to-questionnaire mapping upstream piece by piece. A fix
  found here goes upstream when it is a fix to formancy itself, never as a
  way of moving the mapping there.

**What it asks of formancy.ai.** A record there amending 0003's sold list to
name the paid modules beside the operating-the-platform items, which Data's
0001 and Report's 0001 already said is owed. Health is the third module it
would name.

## Alternatives considered

**A package in Formancy Data.** Rejected. Data discovers databases and
serves policy-scoped records; Health reads forms, answers and PDFs and never
a database. A host that exports only forms would install and license a
database module to do it, and every change to an implementation guide would
wait on Data's release.

**A package in Formancy Report.** Rejected. A Questionnaire and a
QuestionnaireResponse need no PDF, so a host that exports only forms would
install a report designer. Report proves a report on the PDF it produced
(formancy.ai-report 0003); Health proves a resource with the HL7 validator
against pinned guide packages, a different gate with a different toolchain.
And the dependency runs one way: Health attaches Report's PDFs, and Report
never imports Health.

**A generic core in Apache-2.0 formancy, with only the country profiles
here.** The research behind this module suggested it, under the rule that
a generic improvement goes upstream. The maintainer did not take it. It
would have given every formancy user a free export to SDC Questionnaires and
kept only the national profiles paid. It would also have put a second
public format, FHIR R4 and SDC, into formancy's compatibility promise, with
formancy's maintainers carrying its conformance and its validator gate. What
not taking it costs is the consequence above: formancy exports nothing to
FHIR.

**One shared licence text for Data, Report and Health.** Rejected, as Report
rejected it. Each product keeps its own text on the same terms, so any one
can be revised, reviewed or have its terms changed without a version change
in the others. The cost is three texts that can drift apart, held only by
review.
