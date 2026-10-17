/**
 * The refusals of one export, collected.
 *
 * A refusal is a `Refusal`: a rule a host branches on, a path, and a
 * message made of those and fixed words, never of a value (0004). An
 * export collects every refusal before it answers, as formancy's own
 * validator does, so that a host fixes its input in one pass rather than
 * one field per attempt; and answers with none of the resource when there
 * is even one. Every package exports this way, health-questionnaire's
 * forms and answers and health-document's documents alike, and writes its
 * paths with `member` and `item`, as writeJson and readJson write theirs:
 * one form of path for every refusal a host receives.
 */
import { Refusal, type RefusalContext, type Rule } from './refusal.js'

/** The refusals one export found, in the order it found them. */
export class Refusals {
  readonly #found: Refusal[] = []

  /** A refusal for `rule` at `path`. Returns undefined, so a mapping can `return refusals.add(...)`. */
  add(rule: Rule, path: string, context?: RefusalContext): undefined {
    this.#found.push(new Refusal(rule, path, context))
    return undefined
  }

  /**
   * What `make` returns, or undefined with the Refusal it threw recorded:
   * a primitive refusing a value the host gave, at the path it was given.
   * Anything else it throws is a bug, and is thrown on.
   */
  take<T>(make: () => T): T | undefined {
    try {
      return make()
    } catch (error) {
      if (!(error instanceof Refusal)) throw error
      this.#found.push(error)
      return undefined
    }
  }

  get count(): number {
    return this.#found.length
  }

  get list(): readonly Refusal[] {
    return [...this.#found]
  }
}
