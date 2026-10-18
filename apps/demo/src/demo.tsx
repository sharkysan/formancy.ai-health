/**
 * The demo's page (0012): a synthetic referral filled in formancy's
 * renderer, and what the packages make of it, beside it, in the visitor's
 * browser. Nothing is fetched or stored, and nothing typed is written into
 * the address: the answers live in formancy's engine for as long as the
 * page is open.
 */
import type { FormEngine } from '@formancy/core'
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import { engineFor } from './engine.js'
import { ErrorBoundary } from './error-boundary.js'
import { answeredOf, byFile, FILES, firstOf, type Outcome, type Sample } from './exports.js'
import type { Facts } from './facts.js'
import { FormStep, madeOf } from './form-step.js'
import { LetterStep } from './letter-step.js'
import { About, Footer } from './notices.js'
import { refusedOnPurpose } from './on-purpose.js'
import { RefusedStep } from './refused-step.js'
import { OutcomeView, Step } from './resource.js'
import { LANGUAGES, WORDS, type Language, type Words } from './words/index.js'

export interface DemoProps {
  readonly sample: Sample
  /** The letter's PDF, the bytes the build carried. */
  readonly pdf: Uint8Array
  readonly facts: Facts
  /** The language the page opens in. */
  readonly language: Language
}

export function Demo({ sample, pdf, facts, language: opening }: DemoProps) {
  const [language, setLanguage] = useState<Language>(opening)
  const words = WORDS[language]
  useEffect(() => {
    document.documentElement.lang = language
    document.title = words.title
  }, [language, words.title])
  return (
    <>
      <a className="skip" href="#demo">
        {words.skip}
      </a>
      <header className="bar">
        <label htmlFor="language">{words.language}</label>
        <select id="language" value={language} onChange={(event) => setLanguage(event.target.value as Language)}>
          {LANGUAGES.map((each) => (
            <option key={each} value={each} lang={each}>
              {WORDS[each].name}
            </option>
          ))}
        </select>
      </header>
      <main id="demo" tabIndex={-1}>
        <h1>{words.title}</h1>
        <p className="lead">{words.lead}</p>
        <p className="banner">{words.banner}</p>
        <ErrorBoundary
          fallback={
            <p className="failed" role="alert">
              {words.broken}
            </p>
          }
        >
          <Steps sample={sample} pdf={pdf} facts={facts} language={language} words={words} />
        </ErrorBoundary>
        <About words={words} facts={facts} />
      </main>
      <Footer words={words} facts={facts} />
    </>
  )
}

interface Form {
  readonly engine: FormEngine
  readonly generation: number
  readonly language: Language
}

/** The answers `engine` holds, as React reads an outside store: re-read when the engine says they changed. */
function useAnswers(engine: FormEngine): unknown {
  const subscribe = useMemo(() => (listener: () => void) => engine.subscribe(listener), [engine])
  return useSyncExternalStore(subscribe, () => engine.value())
}

interface StepsProps {
  readonly sample: Sample
  readonly pdf: Uint8Array
  readonly facts: Facts
  readonly language: Language
  readonly words: Words
}

function Steps({ sample, pdf, facts, language, words }: StepsProps) {
  const [form, setForm] = useState<Form>(() => ({ engine: engineFor(sample.form, language, sample.answers), generation: 0, language }))
  // The engine's language is fixed for its life: another language is
  // another engine, started from the answers this one holds.
  if (form.language !== language) setForm({ engine: engineFor(sample.form, language, form.engine.value()), generation: form.generation + 1, language })
  const answers = useAnswers(form.engine)

  // What does not depend on the answers is made once.
  const first = useMemo(() => firstOf(sample, pdf), [sample, pdf])
  const refused = useMemo(() => refusedOnPurpose(sample, pdf), [sample, pdf])
  const answered = useMemo(() => answeredOf(sample, answers), [sample, answers])

  const json = (outcome: Outcome | undefined): string | undefined => (outcome?.kind === 'made' ? outcome.json : undefined)
  const changed = json(answered.response) === undefined || json(answered.response) !== json(first.answered.response)
  // The build found the first resources the corpus's entries of their
  // names, byte for byte, and listed them: a resource is one while it is
  // the first's bytes.
  const firstFiles = useMemo(() => byFile(first), [first])
  const isCorpus = (file: string, outcome: Outcome): boolean => facts.corpus.includes(file) && json(outcome) !== undefined && json(outcome) === json(firstFiles.get(file))


  const status = useRef<HTMLParagraphElement>(null)
  const response = useRef<HTMLHeadingElement>(null)
  // The reset button goes when the answers are the sample's again, and the
  // keyboard with it to the line that now says so.
  const [resetting, setResetting] = useState(false)
  useEffect(() => {
    if (!resetting) return
    status.current?.focus()
    setResetting(false)
  }, [resetting])

  return (
    <>
      <div className="columns">
        <FormStep
          engine={form.engine}
          generation={form.generation}
          words={words}
          formancy={facts.formancy}
          changed={changed}
          live={madeOf(answered.response, words, language)}
          statusRef={status}
          onReset={() => {
            setForm({ engine: engineFor(sample.form, language, sample.answers), generation: form.generation + 1, language })
            setResetting(true)
          }}
          onComplete={() => response.current?.focus()}
        />
        <div className="resources">
          <p className="note">{words.resources.intro}</p>
          <Step id="step-questionnaire" heading={words.questionnaire.heading} intro={words.questionnaire.intro}>
            <OutcomeView outcome={first.questionnaire} maker="@formancy/health-questionnaire" file={FILES.questionnaire} name={words.questionnaire.heading} corpus={isCorpus(FILES.questionnaire, first.questionnaire)} words={words} />
          </Step>
          <Step id="step-response" heading={words.response.heading} intro={words.response.intro} headingRef={response}>
            <OutcomeView outcome={answered.response} maker="@formancy/health-questionnaire" file={FILES.response} name={words.response.heading} corpus={isCorpus(FILES.response, answered.response)} words={words} />
          </Step>
          <Step id="step-document" heading={words.document.heading} intro={words.document.intro}>
            {answered.document === undefined ? (
              <p className="refused">{words.document.notMade}</p>
            ) : (
              <OutcomeView outcome={answered.document} maker="@formancy/health-ch" file={FILES.document} name={words.document.heading} corpus={isCorpus(FILES.document, answered.document)} words={words} />
            )}
          </Step>
          <LetterStep pdf={pdf} letter={first.letter} report={facts.report} isCorpus={isCorpus} words={words} />
        </div>
      </div>
      <RefusedStep refused={refused} words={words} />
    </>
  )
}
