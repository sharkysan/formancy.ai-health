/**
 * A link that downloads bytes the page made: an object URL of a Blob of
 * them, made when the bytes are and revoked when they change or the link
 * goes. Nothing is fetched and nothing leaves the page: the browser saves
 * what it already holds.
 */
import { useEffect, useState, type ReactNode } from 'react'

interface DownloadProps {
  readonly file: string
  /** The bytes: FHIR JSON as `writeJson` wrote it, or the PDF's. */
  readonly bytes: string | Uint8Array
  readonly type: string
  readonly children: ReactNode
}

export function Download({ file, bytes, type, children }: DownloadProps) {
  const [made, setMade] = useState<{ readonly bytes: string | Uint8Array; readonly type: string; readonly url: string } | undefined>(undefined)
  useEffect(() => {
    // A copy of the bytes the Blob owns, so the page's own are never handed out.
    const url = URL.createObjectURL(new Blob([typeof bytes === 'string' ? bytes : bytes.slice()], { type }))
    setMade({ bytes, type, url })
    return () => URL.revokeObjectURL(url)
  }, [bytes, type])
  // Until there is an address for these bytes, there is no link: a link to
  // nothing would say it downloads, and one to the bytes before a change is
  // to an address revoked as the new one is made, which a browser cancels.
  return made === undefined || made.bytes !== bytes || made.type !== type ? null : (
    <a className="download" href={made.url} download={file}>
      {children}
    </a>
  )
}
