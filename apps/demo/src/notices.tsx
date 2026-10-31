/**
 * What the page says about itself: what the demo is for, what the
 * validator's verdict covers and what it does not, the guides it names,
 * the licence; and the footer, with HL7's and LOINC's notices and the link
 * to the notices of the third-party code and faces the page bundles.
 *
 * Three texts are English in every language, as their owners wrote them,
 * and marked so: HL7's notice and LOINC's, which a translation would not
 * be, and CLAUDE.md's sentence of what the product is not, the one
 * statement of its purpose, which the README holds word for word too. The
 * build reads each from the module the repository's guards read it with.
 */
import type { Facts } from './facts.js'
import { LINKS } from './links.js'
import type { Words } from './words/index.js'

export function About({ words, facts }: { readonly words: Words; readonly facts: Facts }) {
  return (
    <section className="step about" aria-labelledby="step-about">
      <h2 id="step-about">{words.about.heading}</h2>
      <p>{words.about.evaluation}</p>
      <p>{words.about.purpose}</p>
      <blockquote lang="en">
        <p>{facts.purpose}</p>
      </blockquote>
      <p>{words.about.conformance(facts.versions)}</p>
      <p>
        <a href={LINKS.warnings}>{words.about.register}</a>
      </p>
      <p>{words.about.affiliation}</p>
      <p>
        {words.about.licence} <a href={LINKS.licence}>{words.footer.licence}</a>
      </p>
    </section>
  )
}

export function Footer({ words, facts }: { readonly words: Words; readonly facts: Facts }) {
  return (
    <footer className="foot">
      <p lang="en">{facts.notices.hl7}</p>
      <p lang="en">{facts.notices.loinc}</p>
      <ul className="links">
        <li>
          <a href={LINKS.repository}>{words.footer.repository}</a>
        </li>
        <li>
          <a href={LINKS.licence}>{words.footer.licence}</a>
        </li>
        <li>
          <a href={LINKS.notices}>{words.footer.notices}</a>
        </li>
        <li>
          <a href={LINKS.legal}>{words.footer.legal}</a>
        </li>
        <li>
          <a href={LINKS.privacy}>{words.footer.privacy}</a>
        </li>
      </ul>
    </footer>
  )
}
