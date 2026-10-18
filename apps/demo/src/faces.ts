/**
 * Every face the page's stylesheets declare, asked for as the page starts
 * (0012). A browser asks for a face of a family split by `unicode-range`
 * only when text in its range is first drawn, so a face asked for later
 * tells the server what was drawn: the JSON a visitor opened, or that what
 * they typed into the form was Greek, Cyrillic or Vietnamese. Asked for at
 * once, nothing the page shows or a visitor types afterwards asks the
 * server for anything, which the browser gate holds
 * (apps/demo/scripts/gate-privacy.mjs).
 *
 * Settled, never thrown: a face that does not load leaves its text to the
 * next face of its stack, as it would have when asked for later.
 */
export function askForEveryFace(fonts: Iterable<FontFace>): Promise<readonly PromiseSettledResult<FontFace>[]> {
  return Promise.allSettled([...fonts].map((face) => face.load()))
}
