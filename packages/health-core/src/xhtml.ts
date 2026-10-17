/**
 * Text as R4's xhtml carries it inside an element: escaped, never parsed.
 *
 * A narrative is "Limited xhtml content" (https://hl7.org/fhir/R4/narrative.html,
 * read on 17 October 2026), XML whose root is a div in the XHTML namespace.
 * A package that writes one writes its own elements around a host's text;
 * the text must then say only what it says. `&`, `<` and `>` are what XML
 * reads as markup in an element's content, so they are written as `&amp;`,
 * `&lt;` and `&gt;`, and nothing else is changed: a quotation mark is
 * markup only inside an attribute, where no host's text goes. What XML 1.0
 * cannot carry at all -- a control character but the tab, the line feed
 * and the carriage return, a surrogate alone, U+FFFE and U+FFFF -- is
 * refused, as `grammar` of the type xhtml: the div would not be XML, and
 * escaping cannot make it one (characters.ts, the one rule a host's text
 * is held to as well). Written here once, so that every narrative of
 * every package escapes the same three. No markup is ever taken from a
 * host: a host's XHTML would need a reader of R4's allowed elements, and
 * nothing here reads XHTML.
 */
import { carried } from './characters.js'
import { Refusal } from './refusal.js'

/** What `&`, `<` and `>` are written as. */
const ESCAPED: ReadonlyMap<string, string> = new Map([
  ['&', '&amp;'],
  ['<', '&lt;'],
  ['>', '&gt;'],
])

/** `value` as the content of an XHTML element, at `path`; refused when XML cannot carry it. */
export function xhtmlText(value: string, path: string): string {
  // Asked of text only, as every check here is.
  if (typeof value !== 'string' || !carried(value)) throw new Refusal('grammar', path, { type: 'xhtml' })
  return value.replace(/[&<>]/g, (character) => ESCAPED.get(character) as string)
}
