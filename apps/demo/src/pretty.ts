/**
 * FHIR JSON as `writeJson` wrote it, laid out for reading: each member and
 * item on a line of its own, indented two spaces a level, and a space after
 * each colon. `writeJson` writes no whitespace, so a CH ORF document shown
 * as written is one line of some ten thousand characters.
 *
 * Only for showing. The text is walked once, token by token, and nothing is
 * parsed or rewritten: whitespace is added between tokens and never inside
 * a string, so what is shown says exactly what the bytes say, and a number
 * keeps every digit it was written with. What is downloaded is the bytes
 * `writeJson` wrote, unchanged. FHIR JSON has no empty object or array, so
 * no `{}` or `[]` is opened onto a line of its own.
 */
export function pretty(json: string): string {
  const out: string[] = []
  let depth = 0
  let inString = false
  let escaped = false
  const newline = (): string => `\n${'  '.repeat(depth)}`
  for (const character of json) {
    if (inString) {
      out.push(character)
      if (escaped) escaped = false
      else if (character === '\\') escaped = true
      else if (character === '"') inString = false
      continue
    }
    switch (character) {
      case '"':
        inString = true
        out.push(character)
        break
      case '{':
      case '[':
        depth += 1
        out.push(character, newline())
        break
      case '}':
      case ']':
        depth -= 1
        out.push(newline(), character)
        break
      case ',':
        out.push(character, newline())
        break
      case ':':
        out.push(': ')
        break
      default:
        out.push(character)
    }
  }
  return out.join('')
}
