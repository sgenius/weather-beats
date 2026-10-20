// General-purpose text helpers, shared across features.

/** "percussion" -> "Percussion". JS has no built-in for this; CSS
 * `text-transform: capitalize` only changes how text looks, while this
 * keeps the DOM text itself (accessible names, copy/paste) capitalized. */
export function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
