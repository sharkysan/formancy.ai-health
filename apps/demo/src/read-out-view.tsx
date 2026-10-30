/**
 * The Questionnaire read out, under its heading and above its JSON (0013):
 * what `readOut` reads of the bytes shown below it, as a heading per item,
 * nested lists and description lists, in the page's language. Each item
 * leads to the field the form drew of its linkId, where there is one to
 * lead to; a text the resource holds in another language than the page's
 * is marked with that language, for a screen reader to read it in, and
 * said to be untranslated. Nothing here is a value of a person's: the
 * texts are the resource's.
 */
import { useId, useMemo } from 'react'
import type { FieldTarget } from './engine.js'
import { readOut, type ReadAnswer, type ReadCondition, type ReadItem, type Wording } from './read-out.js'
import type { Language, Words } from './words/index.js'

type ReadOutWords = Words['readOut']

interface ReadOutProps {
  /** The bytes the JSON region below shows. */
  readonly json: string
  readonly language: Language
  readonly words: Words
  /** The field the form drew for an item's linkId, or undefined where there is none to lead to. */
  readonly targetOf: (linkId: string) => FieldTarget | undefined
}

export function ReadOutView({ json, language, words, targetOf }: ReadOutProps) {
  const read = useMemo(() => readOut(json, language), [json, language])
  const id = useId()
  const w = words.readOut
  if (!read.ok) return <p className="failed">{w.unread}</p>
  return (
    <div className="read-out">
      <h3 id={id}>{w.heading}</h3>
      <p>{w.intro}</p>
      {read.title === undefined ? null : (
        <dl>
          <dt>{w.title}</dt>
          <dd>
            <Said wording={read.title} />
            <Untranslated wording={read.title} words={w} />
          </dd>
        </dl>
      )}
      <Items items={read.items} depth={0} id={id} words={w} targetOf={targetOf} labelledBy={id} />
    </div>
  )
}

/** A text, marked with its language where it stands in for the page's. */
function Said({ wording }: { readonly wording: Wording }) {
  // lang="" says the language is unknown, which is what a resource that names none leaves it.
  return wording.untranslated ? <span lang={wording.lang ?? ''}>{wording.text}</span> : <>{wording.text}</>
}

/** That a text is the resource's own, standing in for a translation it lacks, and in which language. */
function Untranslated({ wording, words }: { readonly wording: Wording; readonly words: ReadOutWords }) {
  if (!wording.untranslated) return null
  return (
    <>
      {' '}
      <span className="untranslated">({wording.lang === undefined ? words.unnamedLanguage : words.untranslated(wording.lang)})</span>
    </>
  )
}

interface ItemsProps {
  readonly items: readonly ReadItem[]
  readonly depth: number
  /** The prefix of every id the items' headings and lists take. */
  readonly id: string
  readonly words: ReadOutWords
  readonly targetOf: (linkId: string) => FieldTarget | undefined
  readonly labelledBy?: string
}

function Items({ items, depth, id, words, targetOf, labelledBy }: ItemsProps) {
  return (
    <ol aria-labelledby={labelledBy}>
      {items.map((each, index) => (
        // A linkId is unique in a Questionnaire (R4's que-2), and the read-out's own path makes the ids.
        <Item key={each.linkId} item={each} depth={depth} id={`${id}-${String(index)}`} words={words} targetOf={targetOf} />
      ))}
    </ol>
  )
}

/** An item's heading, below the read-out's own h3: h4, then h5; deeper nesting is said by the lists, at h6. */
const headingAt = (depth: number): 'h4' | 'h5' | 'h6' => (depth === 0 ? 'h4' : depth === 1 ? 'h5' : 'h6')

function Item({ item, depth, id, words, targetOf }: Omit<ItemsProps, 'items' | 'labelledBy'> & { readonly item: ReadItem }) {
  const Heading = headingAt(depth)
  return (
    <li aria-labelledby={id}>
      <Heading id={id}>{item.text === undefined ? words.noText : <Said wording={item.text} />}</Heading>
      {item.text?.untranslated === true ? (
        <p>
          <Untranslated wording={item.text} words={words} />
        </p>
      ) : null}
      <dl>
        <dt>
          <code>linkId</code>
        </dt>
        <dd>
          <code>{item.linkId}</code>
        </dd>
        <dt>{words.type}</dt>
        <dd>
          {words.types[item.type]} (<code>{item.type}</code>)
        </dd>
        <dt>{words.required}</dt>
        <dd>{item.required ? words.yes : words.no}</dd>
        <dt>{words.repeats}</dt>
        <dd>{item.repeats ? words.yes : words.no}</dd>
        {item.options.length === 0 ? null : (
          <>
            <dt id={`${id}-options`}>{words.options}</dt>
            <dd>
              <ul aria-labelledby={`${id}-options`}>
                {item.options.map(({ code, display }) => (
                  <li key={code}>
                    {display === undefined ? <code>{code}</code> : <Said wording={display} />}
                    {display === undefined ? null : <Untranslated wording={display} words={words} />}
                  </li>
                ))}
              </ul>
            </dd>
          </>
        )}
        {item.conditions.length === 0 ? null : (
          <>
            <dt id={`${id}-when`}>{words.shownWhen}</dt>
            <dd>
              {item.behaviour === undefined ? null : <p>{words.joined[item.behaviour]}</p>}
              <ul aria-labelledby={`${id}-when`}>
                {item.conditions.map((condition, index) => (
                  // Conditions have no identity of their own but their place in the resource's list.
                  <li key={index}>
                    <Condition condition={condition} words={words} />
                  </li>
                ))}
              </ul>
            </dd>
          </>
        )}
      </dl>
      <ToField target={targetOf(item.linkId)} field={item.text?.text ?? item.linkId} words={words} />
      {item.items.length === 0 ? null : <Items items={item.items} depth={depth + 1} id={id} words={words} targetOf={targetOf} />}
    </li>
  )
}

/**
 * The way to the field: a button, which moves the keyboard to the control
 * by its id and puts nothing in the address, as the page puts nothing
 * there but the skip link's fragment (0012). Where the form does not show
 * the field, it says so, and there is nothing to press.
 *
 * The control is scrolled to the middle of the window, and then focused
 * without the scroll a focus makes of its own, which goes only as far as
 * the control: it left the field's label above the window in every pass
 * of the browser gate in WebKit 27.2, the control's top cut too, and in
 * two in Chromium and Firefox. Scrolled to the middle, the field and its
 * label stand in the window in all three (0013; the gate's journey holds
 * it).
 */
function ToField({ target, field, words }: { readonly target: FieldTarget | undefined; readonly field: string; readonly words: ReadOutWords }) {
  if (target === undefined) return null
  if (!target.shown) return <p className="not-shown">{words.notShown}</p>
  const toIt = () => {
    const control = document.getElementById(target.id)
    control?.scrollIntoView({ block: 'center' })
    control?.focus({ preventScroll: true })
  }
  return (
    <p>
      <button type="button" className="to-field" aria-label={words.toFieldOf(field)} onClick={toIt}>
        {words.toField}
      </button>
    </p>
  )
}

/** A condition in words: the question by its text and linkId, the operator, and the answer. */
function Condition({ condition, words }: { readonly condition: ReadCondition; readonly words: ReadOutWords }) {
  const { question, questionText, operator, answer } = condition
  const asked = (
    <>
      {questionText === undefined ? null : (
        <>
          <q>
            <Said wording={questionText} />
          </q>{' '}
        </>
      )}
      (<code>{question}</code>)
    </>
  )
  if (operator === 'exists') {
    return (
      <>
        {asked} {answer.kind === 'boolean' && answer.value ? words.answered : words.unanswered}
      </>
    )
  }
  const said = operator === '=' ? words.is : operator === '!=' ? words.isNot : answer.kind === 'moment' ? words.moments[operator] : words.numbers[operator]
  return (
    <>
      {asked} {said} <Answer answer={answer} words={words} />
    </>
  )
}

function Answer({ answer, words }: { readonly answer: ReadAnswer; readonly words: ReadOutWords }) {
  switch (answer.kind) {
    case 'boolean':
      return <q>{answer.value ? words.yes : words.no}</q>
    case 'option':
      return answer.display === undefined ? (
        <code>{answer.code}</code>
      ) : (
        <q>
          <Said wording={answer.display} />
        </q>
      )
    case 'string':
      return <q>{answer.value}</q>
    case 'number':
    case 'moment':
      return <>{answer.value}</>
  }
}
