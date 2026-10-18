/**
 * What jsdom lacks that the page uses: object URLs, for its downloads, and
 * scrolling an element into view, for the read-out's ways to a field.
 *
 * Each Blob gets an address of its own, and the suite reads a link's bytes
 * back by it (`blobAt`), as a browser would save them. jsdom lays nothing
 * out, so a scroll moves nothing: each is kept, the element and how it was
 * asked to stand (`scrolled`), for the suite to read which was scrolled and
 * how; where it then stands is the browser gate's to measure.
 */
const blobs = new Map<string, Blob>()
let made = 0

URL.createObjectURL = (blob: Blob): string => {
  made += 1
  const url = `blob:health-demo/${String(made)}`
  blobs.set(url, blob)
  return url
}

URL.revokeObjectURL = (url: string): void => {
  blobs.delete(url)
}

/** The Blob a link's address names, while it is not revoked. */
export function blobAt(url: string): Blob | undefined {
  return blobs.get(url)
}

const scrolls: { readonly element: Element; readonly options: boolean | ScrollIntoViewOptions | undefined }[] = []

// A file of the suite run in Node's environment has no DOM, and nothing to scroll.
if (typeof Element !== 'undefined') {
  Element.prototype.scrollIntoView = function (this: Element, options?: boolean | ScrollIntoViewOptions): void {
    scrolls.push({ element: this, options })
  }
}

/** Every element scrolled into view so far, in order, with how it was asked to stand. */
export function scrolled(): readonly { readonly element: Element; readonly options: boolean | ScrollIntoViewOptions | undefined }[] {
  return scrolls
}
