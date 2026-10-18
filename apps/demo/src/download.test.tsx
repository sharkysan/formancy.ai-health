import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, test } from 'vitest'
import { Download } from './download.js'
import { blobAt } from './test-setup.js'

afterEach(cleanup)

describe('a download link', () => {
  // A link whose address changed in place showed the new bytes' name over
  // the old bytes' address between React's commit and the effect that made
  // the new one, and that address was revoked in the same effect: pressed
  // in that moment, as the browser gate pressed the letter's Bundle in a
  // Binary, Chromium cancelled the download (CI, 18 October 2026).
  test('is never given another address in place: the old bytes’ link goes, and the new bytes’ comes with its own', async () => {
    const { container, rerender } = render(
      <Download file="a.json" bytes="A" type="application/json">
        a.json
      </Download>,
    )
    await screen.findByRole('link', { name: 'a.json' })
    const changedInPlace: MutationRecord[] = []
    const observer = new MutationObserver((records) => changedInPlace.push(...records))
    observer.observe(container, { subtree: true, attributes: true, attributeFilter: ['href'] })
    rerender(
      <Download file="b.json" bytes="B" type="application/json">
        b.json
      </Download>,
    )
    const link = await screen.findByRole('link', { name: 'b.json' })
    changedInPlace.push(...observer.takeRecords())
    observer.disconnect()
    expect(changedInPlace).toEqual([])
    expect(await blobAt(link.getAttribute('href') ?? '')?.text()).toBe('B')
  })
})
