# 0003 — Name the product Formancy Health: no name of it carries an HL7 mark, and FHIR is named only as the standard

- **Status:** accepted; its names held of a page and an address too -- the demo's Worker, its routes and its title -- by [0012](0012-a-demo-at-formancy-ai-health-fills-a-synthetic-referral-in-the-browser-served-by-a-worker-of-its-own.md)
- **Date:** 2026-10-16
- **Deciders:** Daniel Bacher
- **Verified by:** `scripts/trademark.test.mjs`, in `pnpm test:repo`, which CI
  runs on every pull request. It fails when `NOTICE` or `README.md` lacks
  HL7's notice for use without permission, word for word; when a tracked
  file carries a notice HL7 reserves for a use it has licensed; and when a
  package's `name`, the licence's title or the README's first heading holds
  `fhir` or `hl7`, in any case. It reads the names from the manifests and the
  files themselves, and was watched failing on each. What it cannot see is
  held by review: the names GitHub keeps outside the tree, which
  [`.github/REPO-METADATA.md`](../../.github/REPO-METADATA.md) records; a
  domain or a page, of which there are none; and prose that uses FHIR as a
  brand rather than for the standard. Whether this position is right in law
  is held by nothing here: a trademark lawyer's review is owed before the
  first paid release.

## Context

Until 16 October 2026 the working name was **Formancy FHIR**: the repository
`formancy.ai-fhir`, the packages `@formancy/fhir-*`. Before anything was
committed under it, HL7's own pages were read on its marks. What they say,
read that day:

- **The specification is free, the name is not.** The FHIR specification is
  licensed under CC0, and "HL7®, HEALTH LEVEL SEVEN®, FHIR® and the FHIR
  [flame] ® are trademarks owned by Health Level Seven International,
  registered with the United States Patent and Trademark Office."
  ([R4 licence page](https://hl7.org/fhir/R4/license.html),
  [current licence page](https://hl7.org/fhir/license.html))
- **Referring to the standard is free.** "You can use the trademarks "FHIR"
  and the FHIR logo to refer the FHIR specification itself (nominatively, or
  under the terms of fair use".
- **Naming a product is not.** "Use of Health Level Seven International
  trademarks in URL domains or to brand your product or service (e.g. as part
  of the product name) without the express written consent of Health Level
  Seven International is strictly prohibited."
- **Consent is product by product.** HL7 grants a Product License after its
  own review: "When you get a Product License, it will only apply to the
  specific product in your request."
  ([FHIR Trademark Policy](https://wiki.hl7.org/FHIR_Trademark_Policy))
- **A name holding the mark is never a trademark of one's own.** HL7 says it
  cannot license its marks for use inside another trademark, and that the
  mark may not be combined with other words without its written consent, so
  neither "Formancy FHIR" nor a coined "FormancyFHIR" could ever have been
  registered.
- **A truthful conformance claim is fair use.** "If you wish to truthfully
  assert that your product complies with a particular FHIR standard, you may
  make that statement as a matter of fair use."

What could not be read: the policy's wiki copy, last edited on 1 May 2020,
says it moved to HL7's Confluence, which refused an automated fetch, and
the product licence form and HL7's trademark FAQ answered with empty pages.
So the form's conditions, any fee, and whether HL7 licenses only its members
were not known. The marks are registered in the United States and, through
WIPO, in Australia and the European Union; whether they are protected in
Switzerland was not checked.

## Decision

The maintainer chose the name **Formancy Health** on 16 October 2026 instead
of applying for HL7's Product License for "Formancy FHIR". The repository is
`formancy.ai-health`, the packages `@formancy/health-*`, the licence the
Formancy Health Source-Available Licence, and the README's heading says
Formancy Health. Nothing was committed or published under the old name.

FHIR is named only **nominatively**: to say which standard the packages
implement and which resources they produce -- "the HL7® FHIR® standard",
"FHIR R4", "FHIR resources", the HL7 FHIR validator, an implementation
guide's own name. Never to name the product, a package, a domain or a page.

No Product License is applied for, so the one notice this product carries is
HL7's for use without permission, in `NOTICE` and in the README, word for
word:

> HL7, FHIR and the FHIR [FLAME DESIGN] are the registered trademarks of
> Health Level Seven International and their use does not constitute
> endorsement by HL7.

HL7 publishes two more notices, for a holder of its Product License and for
its own graphics. Both state a licence this product does not have, so no file
of it carries either. The flame logo is not used. A claim of conformance is a
truthful, specific statement -- the guide and its version, the validator and
its version, the corpus it ran on -- and never a claim that HL7 endorses or
certifies anything.

## Consequences

**What it buys.**
- **No licence to seek, keep or lose.** The product's name rests on no
  decision of HL7's, and on none of the conditions nobody could read.
- **A mark of its own.** "Formancy" is the name to register and defend, and
  it holds nobody else's mark.
- **No confusion with the standard's owner.** Nothing in the name suggests
  HL7 made, endorses or certified it.

**What it costs.**
- **The name says less.** Someone looking for a FHIR export finds this one
  through its description, its topics and its README, which name the
  standard, and not through its name. "Health" is broad, and the README says
  what the module is and what it is not: an export library, not an EHR, a
  FHIR server or a terminology service.
- **The nominative uses are judged, not checked.** The GitHub description
  names the standard, and the topics `fhir` and `hl7` name the standard and
  its publisher. HL7's pages do not say whether it reads a topic as
  branding, and nothing here can read GitHub's settings.
- **A notice everywhere the standard is named prominently.** `NOTICE` and
  the README carry it, and a page of this product, if it ever has one, will.
- **It is not legal advice.** The reading above is the maintainer's, from
  HL7's pages, and the review that would make it more is still owed.

**What it forecloses.**
- FHIR or HL7 in the name of the product, a package, a domain or a page.
  Putting one there would be a new record superseding this one, with HL7's
  written consent in hand before it.
- Any claim that HL7 endorses, certifies or licensed this product.
- The flame logo.

## Alternatives considered

**"Formancy FHIR" under HL7's Product License.** The working name, and the
path the delivery plan first proposed. Rejected: the licence covers one named
product after HL7's own review, under conditions that could not be read; the
name could never be registered as this product's trademark; a licensee
should not show the mark more prominently than its own name, which a name
made of both would test on every page; and the product's name would depend
on a licence HL7 could decline or that could lapse.

**"Formancy FHIR" without a licence, as nominative use.** Rejected. HL7's
pages allow the mark to refer to the standard, and prohibit it as part of a
product's name without written consent. A name is not a reference.

**A coined form, such as "FormancyFHIR".** Rejected. Combining the mark with
other words needs HL7's written consent too, and the result would still hold
HL7's mark.
