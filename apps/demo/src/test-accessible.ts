/**
 * The accessibility audit the demo's suite runs, as Formancy Report's
 * Studio runs its own: axe, WCAG 2.2 AA by its tags, and every control's
 * name as Testing Library computes it, which every query by name here goes
 * through. What jsdom cannot measure is listed, with why: the browser gate
 * measures it.
 */
import { screen } from '@testing-library/react'
import axe from 'axe-core'

/** WCAG 2.2 AA and what it subsumes; `best-practice` left out, as formancy.ai's suites leave it out. */
const WCAG = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']

/** Rules jsdom cannot decide, each with why: not "does not apply" but "cannot be measured here". */
const UNMEASURABLE_IN_JSDOM: Readonly<Record<string, string>> = {
  'color-contrast': 'jsdom computes no colour: the contrast of the themes’ variables is for a browser to measure.',
  'target-size': 'WCAG 2.2 SC 2.5.8 is a size in CSS pixels, and jsdom lays nothing out, so every target is 0 by 0.',
}

/** axe's violations in the document as it stands: the rule, and the markup of each node. */
export async function violations(): Promise<string[]> {
  const rules = Object.fromEntries(Object.keys(UNMEASURABLE_IN_JSDOM).map((id) => [id, { enabled: false }]))
  const results = await axe.run(document.body, { runOnly: { type: 'tag', values: WCAG }, rules, resultTypes: ['violations'] })
  return results.violations.flatMap((violation) => violation.nodes.map((node) => `${violation.id}: ${node.html.slice(0, 160)}`))
}

/**
 * The roles a person operates, or reads as one. axe does not notice a
 * control whose name computes to nothing; computing every name does. Not
 * `option`: formancy's select offers an empty first option, a native
 * select's way to answer nothing, which has no text by design.
 */
const CONTROLS = ['button', 'checkbox', 'combobox', 'link', 'listbox', 'radio', 'region', 'textbox'] as const

export function unnamed(): string[] {
  return CONTROLS.flatMap((role) => screen.queryAllByRole(role, { name: (name: string) => name.trim() === '' })).map((element) => `unnamed: ${element.outerHTML.slice(0, 120)}`)
}
