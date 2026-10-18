/**
 * Step five: the corpus's letter, the PDF the build carries, and the
 * document Bundle health-document makes of it, its bytes in the
 * attachment or in a Binary beside it.
 */
import type { Placement } from '@formancy/health-corpus/documents'
import { useState } from 'react'
import { Download } from './download.js'
import { FILES, PDF_FILE, type Outcome } from './exports.js'
import { OutcomeView, Step } from './resource.js'
import type { Words } from './words/index.js'

interface LetterStepProps {
  readonly pdf: Uint8Array
  readonly letter: Readonly<Record<Placement, Outcome>>
  /** Formancy Report's release that rendered it, as the build read it. */
  readonly report: string
  readonly isCorpus: (file: string, outcome: Outcome) => boolean
  readonly words: Words
}

const PLACEMENTS: readonly Placement[] = ['data', 'binary']

export function LetterStep({ pdf, letter, report, isCorpus, words }: LetterStepProps) {
  const [placement, setPlacement] = useState<Placement>('data')
  const file = FILES.letter[placement]
  const outcome = letter[placement]
  return (
    <Step id="step-letter" heading={words.letter.heading} intro={words.letter.intro(report)}>
      <p>
        <Download file={PDF_FILE} bytes={pdf} type="application/pdf">
          {words.resources.download(PDF_FILE)}
        </Download>
      </p>
      <fieldset className="choice">
        <legend>{words.letter.placement}</legend>
        {PLACEMENTS.map((each) => (
          <label key={each}>
            <input type="radio" name="placement" value={each} checked={placement === each} onChange={() => setPlacement(each)} />
            {words.letter[each]}
          </label>
        ))}
      </fieldset>
      <OutcomeView outcome={outcome} maker="@formancy/health-document" file={file} name={words.letter.heading} corpus={isCorpus(file, outcome)} words={words} />
    </Step>
  )
}
