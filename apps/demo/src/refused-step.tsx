/** Step six: the inputs refused on purpose, each with what its package said. */
import type { Refused } from './on-purpose.js'
import { Refusals } from './resource.js'
import type { Words } from './words/index.js'

export function RefusedStep({ refused, words }: { readonly refused: readonly Refused[]; readonly words: Words }) {
  return (
    <section className="step" aria-labelledby="step-refused">
      <h2 id="step-refused">{words.refused.heading}</h2>
      <p>{words.refused.intro}</p>
      <div className="cases">
        {refused.map(({ id, maker, said }) => (
          <article key={id} className="case" aria-labelledby={`refused-${id}`}>
            <h3 id={`refused-${id}`}>{words.refused.cases[id].heading}</h3>
            <p>{words.refused.cases[id].what}</p>
            {/* What a package made of an input it should refuse is said as made: the page shows what happened, and on-purpose.test.ts fails. */}
            {said.kind === 'refused' ? (
              <Refusals maker={maker} refusals={said.refusals} words={words} />
            ) : (
              <p className="failed">{said.kind === 'failed' ? words.resources.failed : words.resources.madeBy(maker)}</p>
            )}
          </article>
        ))}
      </div>
    </section>
  )
}
