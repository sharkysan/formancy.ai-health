# 0018 — Ask search engines to index the demo: no `noindex` in its headers or its page, https://formancy.ai/health/ named as its canonical address, and one description of what it shows

- **Status:** accepted
- **Date:** 2026-11-22
- **Deciders:** Daniel Bacher
- **Verified by:** a guard in `pnpm test:repo`, the demo's suite and its
  browser gate, which CI runs on every pull request. Each case was watched
  failing first on 22 November 2026, against the files as 0012 left them
  or with its fault planted once, and every file put back byte for byte,
  its SHA-256 compared before and after:
  - **`scripts/demo.test.mjs`**, *what the demo says to a search engine*
    -- no `X-Robots-Tag`, in any case, among the headers `headersFor`
    decides; no `robots` meta in `apps/demo/index.html`, and no meta of
    any name whose content says `noindex` or `nofollow`; one canonical
    link, whose address is the one the demo's Worker is routed at, read
    from `apps/demo/wrangler.json`; and one description that says
    something. Failed against 0012's files: the header, the `robots` meta,
    and no canonical. With the page changed, failed with a second
    description planted and with none, with a `googlebot` meta saying
    `NoIndex`, and with a canonical of `http://localhost:4395/`, the
    address `pnpm demo` serves it at.
  - **`apps/demo/scripts/browser-test.mjs`** -- in every pass, on the
    built page as `vite preview` serves it under the demo's path and
    headers: "the page asks no search engine to leave it out" and "the
    page names its address on formancy.ai as its canonical one, once".
    Run in Chromium on 22 November 2026 against 0012's page, the two
    failed in each of its eight passes and nothing else did; against
    this record's, every check held. Firefox's and WebKit's first run of
    them is CI's.
  - **`apps/demo/src/words.test.ts`** -- "open source" only after a
    negation, in the page's words and now in `index.html`, whose
    description is what a search engine shows of the page. Failed with
    the description's "a source-available library" made "an open-source
    library".

  Nothing here can check that a search engine indexes the page, that
  formancy.ai's sitemap lists it, or that Cloudflare's zone adds no
  `X-Robots-Tag` of its own:
  [`RELEASING.md`](../../RELEASING.md#the-demo-on-formancyai) reads the
  headers by hand after a deploy. What the description says of the page
  is review's.

## Context

[0012](0012-a-demo-at-formancy-ai-health-fills-a-synthetic-referral-in-the-browser-served-by-a-worker-of-its-own.md)
put the demo at formancy.ai/health/ and counted among its costs "No page
to find": the demo said `noindex`, in an `X-Robots-Tag` on every file it
serves and in its page's `robots` meta, and Health had no product page,
so a search found the repository. Read on 22 November 2026,
`curl -sI https://formancy.ai/health/` answered `x-robots-tag: noindex`
and the page held `<meta name="robots" content="noindex" />`.
formancy.ai's `robots.txt` allowed every path and named its sitemap, whose
pages were four of formancy.ai's own, not `/health/`.

The demo is the one page Health has. It shows what the packages do -- a
synthetic Swiss referral filled in the browser, the Questionnaire read
out, the QuestionnaireResponse, the CH ORF document, the letter's
Bundles and every refusal as the packages state it -- in four languages,
on data that is synthetic and sent nowhere. Since 0012, its foot links
formancy.ai's legal notice and privacy notice, and the privacy review
was answered on what the live page does. Formancy Report has pages of its
own to be found and keeps its Studio out of the index
([formancy.ai-report 0021](https://github.com/sharkysan/formancy.ai-report/blob/main/docs/decisions/0021-the-product-pages-are-static-html-in-four-languages-beside-the-studio.md));
Health has no such pages, and building them would say again what the
demo already shows.

The maintainer decided that the demo asks to be indexed, and that
formancy.ai's sitemap lists it, in a later change in that repository.

## Decision

The demo asks a search engine for nothing. `headersFor` in
`scripts/demo-headers.mjs` decides no `X-Robots-Tag`, and the page has no
`robots` meta; every other header is the one 0012 decided, at every
address the page is served at.

The page names https://formancy.ai/health/ as its canonical address with
`<link rel="canonical">`. It is the one address the demo is served at:
the Worker is routed at that path and `/health`, which redirects to it,
with no workers.dev and no preview address (0012), and `pnpm demo` and the
browser gate serve it at local addresses, which are no second production
address and which the canonical does not name. The address is typed in
`apps/demo/index.html` and held to the Worker's route by
`scripts/demo.test.mjs`.

The page carries one description, in English, which says in a sentence
what it shows: a synthetic Swiss referral filled in the browser, and the
HL7® FHIR® R4 resources Formancy Health, a source-available library,
makes of it.

formancy.ai's sitemap listing https://formancy.ai/health/ is a change in
formancy.ai, not here.

## Consequences

What this buys: a search for a FHIR export of forms, a CH ORF document or
the product's name can find the page that shows the packages at work,
rather than only the repository.

What it costs:

- **A search engine reads one language of the page, if it reads the
  page at all.** The page is drawn by its script. A crawler that runs no
  script reads its title, its description and "The demo runs in your
  browser and needs JavaScript." One that runs it reads the page in the
  language its browser asks for, English when it asks for none of the
  four. German, French and Italian have no address of their own, so a
  search in those words finds the page only where its renderer asked for
  them, and the description is English alone.
- **More visitors meet what 0012 already costs.** The demo is `main`'s
  and can be ahead of the latest release, and a visitor can paste a real
  patient's data, which the banner says does not belong there. Found by
  search, the page is met by people who never read the README first.
- **Nothing checks the index.** No gate sees whether a search engine
  indexes the page, what it shows of it, whether formancy.ai's sitemap
  lists it, or whether Cloudflare's zone adds a header of its own; the
  headers are read by hand after a deploy (RELEASING.md).
- **The canonical is typed, not derived.** A route moved in
  `apps/demo/wrangler.json` fails `scripts/demo.test.mjs` until the page
  names it too.
- **The description's wording is review's.** The guards hold that there
  is one, that it says something and that it never says "open source";
  whether what it says is true of the page, a person reads.

What it forecloses: nothing. `noindex` back is a header, a meta and the
cases that hold their absence.

## Alternatives considered

- **Keep `noindex`, and give Health a product page on formancy.ai's
  site.** Rejected: Health's claims would be written, and gated or not, in
  an Apache-2.0 site's repository, which
  [0001](0001-a-paid-module-in-its-own-repository.md) keeps apart, as 0012
  rejected copying the demo into formancy.ai's build; and the page would
  say again what the demo shows, with nothing holding the two together.
- **Pages of Health's own, as Formancy Report's**, static HTML in four
  languages beside the demo, which would keep its `noindex` as Report's
  Studio does (formancy.ai-report 0021). Not taken: a site to build,
  translate, gate and keep true, for a product whose one page already
  shows what it does on synthetic data. It is not foreclosed; if such
  pages come, which page is found for what is their record's.
- **A link from Report's healthcare page alone**, which names Formancy
  Health: Report's change to make, and a search engine that follows a
  link to a page saying `noindex` still leaves the page out.
- **formancy.ai's `robots.txt` alone.** It already allows every path, and
  cannot overrule a `noindex` the page and its headers send.
- **The canonical written by the build**, from the Worker's config, as
  the build reads the registers. Rejected: code in the build for one
  attribute, where a case holds the typed address to the route.
- **An address per language, with `hreflang`.** Rejected: the page has
  one address and chooses its language in the browser; addresses per
  language would be a change to the Worker, the deploy and the page.
- **The description in the page's words, per language**, set by its
  script as the title is. Not taken: a crawler that runs no script reads
  only the one in `index.html`, and one that runs it may take either.

## Older records

[0012](0012-a-demo-at-formancy-ai-health-fills-a-synthetic-referral-in-the-browser-served-by-a-worker-of-its-own.md)
is not superseded. Its demo, its policy and every other header stand; its
`noindex`, in the headers and in the page, is reversed by this record,
and with it the cost "No page to find". It was read again and stamped
(`node scripts/release-report/limitations.mjs --stamp 0012`), its Status
line naming this record.
