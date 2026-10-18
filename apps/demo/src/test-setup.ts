/**
 * What jsdom lacks that the page uses: object URLs, for its downloads. Each
 * Blob gets an address of its own, and the suite reads a link's bytes back
 * by it (`blobAt`), as a browser would save them.
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
