/**
 * Step one: the demo's form, drawn by formancy's React renderer on
 * Blueprint, as a person filling it sees it, and what the page says of the
 * answers it holds.
 */
import type { FormEngine } from '@formancy/core'
import { FormancyForm, FormancyProvider } from '@formancy/react'
import type { Ref } from 'react'
import { FORMANCY_WORDS } from './engine.js'
import type { Outcome } from './exports.js'
import type { Language, Words } from './words/index.js'

/**
 * What the answers made, in a sentence for a screen reader: the response
 * and the document made, or the response refused and how often, counted in
 * the page's language. Its words change only when that does, so it is said
 * when the outcome changes and not on every keystroke.
 */
export function madeOf(response: Outcome, words: Words, language: Language): string {
  switch (response.kind) {
    case 'made':
      return words.form.made
    case 'refused':
      return words.form.refused(new Intl.NumberFormat(language).format(response.refusals.length))
    case 'failed':
      return words.resources.failed
  }
}

interface FormStepProps {
  readonly engine: FormEngine
  /** A new number for a new engine, so the form is drawn afresh from it. */
  readonly generation: number
  readonly words: Words
  /** The renderer's release, as the build read it. */
  readonly formancy: string
  /** Whether the answers make other resources than the sample's. */
  readonly changed: boolean
  /** What the answers made, said to a screen reader when it changes. */
  readonly live: string
  readonly statusRef: Ref<HTMLParagraphElement>
  readonly onReset: () => void
  /** The submit control was used and the form was complete. */
  readonly onComplete: () => void
}

export function FormStep({ engine, generation, words, formancy, changed, live, statusRef, onReset, onComplete }: FormStepProps) {
  return (
    <section className="step" aria-labelledby="step-form">
      <h2 id="step-form">{words.form.heading}</h2>
      <p>{words.form.intro(formancy)}</p>
      {/*
        No ErrorSummary: it takes the keyboard to the top of the form when a
        required field emptied loses focus, and the response's refusals
        already list what is missing. A failed submit moves focus to the
        first invalid field, as formancy's submit does.
      */}
      <div className="wb-sheet" data-formancy-theme="blueprint">
        <FormancyProvider key={generation} engine={engine} words={FORMANCY_WORDS}>
          <FormancyForm onSubmit={(outcome) => (outcome.ok ? onComplete() : undefined)} />
        </FormancyProvider>
      </div>
      {/* Derived from the bytes the answers make, never typed: the same bytes as the sample's are the sample. */}
      <p className={changed ? 'status changed' : 'status sample'} tabIndex={-1} ref={statusRef}>
        {changed ? words.form.changed : words.form.sample}
      </p>
      {/* Only while there is something to go back to: a control nobody can act on says nothing. */}
      {changed ? (
        <button type="button" className="action" onClick={onReset}>
          {words.form.reset}
        </button>
      ) : null}
      {/* A status, polite: said when what the answers made changes, not on every keystroke, since its words change only then. */}
      <p className="visually-hidden" role="status">
        {live}
      </p>
    </section>
  )
}
