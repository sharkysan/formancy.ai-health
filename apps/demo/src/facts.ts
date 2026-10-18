/**
 * What the page says of the world outside it, as its build read it
 * (src/build/plugin.ts): the releases a conformance sentence names, from
 * the validator's and the guides' registers; formancy's and Formancy
 * Report's, from the manifest and the letter's register; the notices and
 * the sentence that says what the product is not, from the files the
 * repository's guards hold; and which of the page's resources are entries
 * of the validator gate's corpus, as the build compared them. Never typed
 * in the page: a version moved, a notice reworded or a corpus entry
 * renamed is a page built again.
 */
import type { Versions } from './words/index.js'

export interface Facts {
  readonly versions: Versions
  /** The release of formancy's React renderer the page draws the form with. */
  readonly formancy: string
  /** The release of Formancy Report's renderer that rendered the letter. */
  readonly report: string
  /** HL7's notice and LOINC's, word for word (scripts/notices.mjs). */
  readonly notices: { readonly hl7: string; readonly loinc: string }
  /** CLAUDE.md's sentence that says what the product is not, word for word (scripts/purpose.mjs). */
  readonly purpose: string
  /**
   * The corpus files the page's resources are before anything is
   * changed: each made in the build as the page makes it and found equal,
   * byte for byte, to the entry the validator gate accepts.
   */
  readonly corpus: readonly string[]
}
