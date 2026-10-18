// The notices third parties ask of this product, word for word, and the
// marks it never takes (0003, 0009, 0012): one text each, which the guards
// hold NOTICE and the READMEs to (scripts/trademark.test.mjs,
// scripts/terminology.test.mjs) and the demo's build hands its page
// (apps/demo/src/build/plugin.ts), so the page cannot say a notice
// otherwise than the files a guard reads; and one pattern for HL7's marks
// in a name, which the trademark guard holds the repository's names to
// and the demo's browser gate the page's title and heading.

/** An HL7 mark in a name, in any case. */
export const MARK = /fhir|hl7/i

/**
 * HL7's notice for a use of its marks without its permission, as the FHIR
 * licence page gives it, R4 and current, read on 16 October 2026
 * (https://hl7.org/fhir/R4/license.html). The only notice this product
 * carries.
 */
export const HL7_NOTICE = 'HL7, FHIR and the FHIR [FLAME DESIGN] are the registered trademarks of Health Level Seven International and their use does not constitute endorsement by HL7.'

/**
 * LOINC's notice, verbatim from the licence's clause for "products and
 * services, such as ... software programs ... implementation guides"
 * (https://loinc.org/license/, last updated 6 August 2026, read on
 * 17 October 2026).
 */
export const LOINC_NOTICE =
  'This material contains content from LOINC (http://loinc.org). LOINC is copyright © Regenstrief Institute, Inc. and the Logical Observation Identifiers Names and Codes (LOINC) Committee and is available at no cost under the license at http://loinc.org/license. LOINC® is a registered United States trademark of Regenstrief Institute, Inc.'
