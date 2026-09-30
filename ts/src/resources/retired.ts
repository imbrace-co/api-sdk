import { ImbraceError } from "../errors.js"

/**
 * Throws for an SDK method whose backing route no longer exists (retired backend
 * monolith, IPS, removed ai-agent routes). Callers get a clear error naming the
 * alternative instead of an opaque 404/502. No request is made.
 */
export function retired(method: string, reason: string, hint = "There is no replacement."): never {
  throw new ImbraceError(`${method}() is no longer available: ${reason}. ${hint}`)
}
