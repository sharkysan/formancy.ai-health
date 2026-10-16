import { Refusal } from './refusal.js'

/**
 * The refusal `act` throws. Anything else it throws is rethrown, and
 * finishing without a throw fails the test: a case that expects a refusal
 * must not pass because the call quietly accepted the value.
 */
export function refusalOf(act: () => unknown): Refusal {
  try {
    act()
  } catch (error) {
    if (error instanceof Refusal) return error
    throw error
  }
  throw new Error('expected a refusal, and the value was accepted')
}
