import { describe, expect, test } from 'vitest'
import { askForEveryFace } from './faces.js'

/**
 * The page asks for every face as it starts (src/faces.ts). jsdom has no
 * FontFaceSet, so the faces here are the shape the browser hands over: what
 * a browser does with them is the browser gate's, which hears every request
 * after the page settles.
 */
const face = (load: () => Promise<FontFace>) => ({ load }) as unknown as FontFace

describe('asking for every face', () => {
  // A face left to be asked for when its text is first drawn is a request
  // that says what was drawn: what a visitor typed, by its script.
  test('asks for each face once, at once', async () => {
    const asked: string[] = []
    const faces = ['latin', 'greek', 'cyrillic'].map((range) =>
      face(() => {
        asked.push(range)
        return Promise.resolve({} as FontFace)
      }),
    )
    const pending = askForEveryFace(faces)
    expect(asked).toEqual(['latin', 'greek', 'cyrillic'])
    expect((await pending).map((result) => result.status)).toEqual(['fulfilled', 'fulfilled', 'fulfilled'])
  })

  // A face refused -- the pass that refuses the web fonts, a network that
  // drops one -- must not stop the others, nor throw into the page, which
  // would say nothing was made.
  test('lets a face that does not load fall back, and still asks for the rest', async () => {
    const results = await askForEveryFace([face(() => Promise.reject(new Error('refused'))), face(() => Promise.resolve({} as FontFace))])
    expect(results.map((result) => result.status)).toEqual(['rejected', 'fulfilled'])
  })
})
