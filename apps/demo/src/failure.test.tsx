import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, test, vi } from 'vitest'
import { ErrorBoundary } from './error-boundary.js'
import { madeOf } from './form-step.js'
import { RefusedStep } from './refused-step.js'
import { OutcomeView } from './resource.js'
import { WORDS } from './words/index.js'

/**
 * What the page shows when a package or formancy's engine does what none
 * should: throws, or makes what it should refuse. No package does today,
 * so these are drawn here with the outcome each would give; the page must
 * still say what happened rather than go blank or show half of anything.
 */
const en = WORDS.en

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('a failure the page did not expect', () => {
  // A throw while drawing -- the engine's, or a package's bug -- would
  // otherwise unmount the whole page and leave it blank.
  test('is said in place of what it stopped, and the rest of the page stands', () => {
    // React reports a caught error on the console; main.tsx sends it nowhere.
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const Throwing = (): never => {
      throw new Error('a bug')
    }
    render(
      <>
        <ErrorBoundary fallback={<p role="alert">{en.broken}</p>}>
          <Throwing />
        </ErrorBoundary>
        <p>after</p>
      </>,
    )
    expect(screen.getByRole('alert').textContent).toBe(en.broken)
    expect(screen.getByText('after')).toBeDefined()
  })

  // Half a resource shown as made would be a resource nobody wrote.
  test('of a package that throws is said, and nothing of it is shown', () => {
    render(<OutcomeView outcome={{ kind: 'failed' }} maker="@formancy/health-ch" file="bundle-ch-orf-demo-referral.json" name={en.document.heading} corpus={false} words={en} />)
    expect(screen.getByText(en.resources.failed)).toBeDefined()
    expect(screen.queryByRole('link')).toBeNull()
    expect(screen.queryByRole('region')).toBeNull()
  })

  // An input refused on purpose that a package made after all, or threw
  // on, is shown as what happened: a page that kept saying "refused" would
  // hide the package's change from the person reading it.
  test('of an input refused on purpose is shown as what the package did', () => {
    render(
      <RefusedStep
        refused={[
          { id: 'gln', maker: '@formancy/health-ch', said: { kind: 'made' } },
          { id: 'ahv', maker: '@formancy/health-ch', said: { kind: 'failed' } },
        ]}
        words={en}
      />,
    )
    expect(screen.getByText(en.resources.madeBy('@formancy/health-ch'))).toBeDefined()
    expect(screen.getByText(en.resources.failed)).toBeDefined()
  })

  // The sentence a screen reader hears after a change says what happened:
  // a failure said as "made" would tell a visitor resources stand that do
  // not, and a count is the page's language's.
  test('is what the status line says to a screen reader, as it says a refusal and its count', () => {
    expect(madeOf({ kind: 'failed' }, en, 'en')).toBe(en.resources.failed)
    expect(madeOf({ kind: 'refused', refusals: [] }, WORDS['de-CH'], 'de-CH')).toBe(WORDS['de-CH'].form.refused('0'))
  })
})
