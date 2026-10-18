/**
 * A resource as the page shows it: what a package made, as JSON to read
 * and as the bytes to download; or its refusals, as the package stated
 * them; or that it failed.
 */
import { useMemo, type ReactNode, type Ref } from 'react'
import type { Refusal } from '@formancy/health-core'
import { Download } from './download.js'
import type { Outcome } from './exports.js'
import { pretty } from './pretty.js'
import type { Words } from './words/index.js'

/**
 * The refusals a package stated, unchanged: in English, the package's
 * language, each its rule and its message, which names a path and never a
 * value (health-core's `Refusal`), so a message is safe to show whatever
 * was typed.
 */
export function Refusals({ maker, refusals, words }: { readonly maker: string; readonly refusals: readonly Refusal[]; readonly words: Words }) {
  return (
    <>
      <p className="refused">{words.resources.refusedBy(maker)}</p>
      <ul className="refusals" lang="en">
        {refusals.map((refusal, index) => (
          // A package lists its refusals in the order it found them, and a
          // refusal has no identity of its own but its place in that list.
          <li key={index}>
            <code>{refusal.rule}</code> {refusal.message}
          </li>
        ))}
      </ul>
    </>
  )
}

interface OutcomeProps {
  readonly outcome: Outcome
  readonly maker: string
  /** The file it downloads as, its name in the corpus. */
  readonly file: string
  /** The resource's name in the page's language, for its JSON's region. */
  readonly name: string
  /** Whether it is, byte for byte, the corpus entry `file`. */
  readonly corpus: boolean
  readonly words: Words
}

/** JSON laid out for reading, with the bytes it was laid out from beside it. */
function Json({ json, label, words }: { readonly json: string; readonly label: string; readonly words: Words }) {
  const shown = useMemo(() => pretty(json), [json])
  return (
    <details>
      <summary>{words.resources.show}</summary>
      {/* A region a keyboard can scroll, whose bytes are what was written: the gate compares those, not the text laid out. */}
      <pre tabIndex={0} role="region" aria-label={label} data-json={json}>
        {shown}
      </pre>
    </details>
  )
}

export function OutcomeView({ outcome, maker, file, name, corpus, words }: OutcomeProps) {
  switch (outcome.kind) {
    case 'refused':
      return <Refusals maker={maker} refusals={outcome.refusals} words={words} />
    case 'failed':
      return <p className="failed">{words.resources.failed}</p>
    case 'made':
      return (
        <>
          <p className="made">
            {words.resources.madeBy(maker)}
            {corpus ? ` ${words.resources.corpus(file)}` : ''}
          </p>
          <Json json={outcome.json} label={words.resources.asJson(name)} words={words} />
          <p>
            <Download file={file} bytes={outcome.json} type="application/fhir+json">
              {words.resources.download(file)}
            </Download>
          </p>
        </>
      )
  }
}

interface StepProps {
  readonly id: string
  readonly heading: string
  readonly intro: string
  readonly headingRef?: Ref<HTMLHeadingElement>
  readonly children: ReactNode
}

/** A step of the page: a section named by its heading, which a control may move the keyboard to. */
export function Step({ id, heading, intro, headingRef, children }: StepProps) {
  return (
    <section className="step" aria-labelledby={id}>
      <h2 id={id} tabIndex={-1} ref={headingRef}>
        {heading}
      </h2>
      <p>{intro}</p>
      {children}
    </section>
  )
}
