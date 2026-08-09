/**
 * Splits arbitrary text into ordered chunks no longer than `maxLength`
 * Unicode code points, without ever losing or corrupting a character.
 *
 * Guarantees:
 *  - `chunks.join("")` is always exactly equal to the input text.
 *  - No cut ever falls inside a surrogate pair (a code point is never split).
 *  - Cuts prefer, in order of preference: a blank line (paragraph break),
 *    a single line break, then whitespace — falling back to a hard cut
 *    only when a single unbroken token is itself longer than a chunk.
 *
 * Implementation note: we index by Unicode code point (via Array.from,
 * which iterates strings correctly across surrogate pairs) rather than
 * by UTF-16 code unit, then reassemble chunks with straight slicing —
 * so nothing is ever rewritten, re-encoded, or dropped.
 */
export function chunkText(text: string, maxLength: number): string[] {
  if (maxLength <= 0) {
    throw new Error("maxLength must be a positive number");
  }

  const units = Array.from(text);
  if (units.length <= maxLength) {
    return text.length > 0 ? [text] : [];
  }

  // How far back we're willing to look for a nice boundary before we
  // give up and hard-cut. Keeps this O(n) overall on realistic inputs.
  const LOOKBACK_WINDOW = Math.min(maxLength, 800);

  const chunks: string[] = [];
  let start = 0;

  while (start < units.length) {
    const hardEnd = Math.min(start + maxLength, units.length);

    let cut = hardEnd;

    if (hardEnd < units.length) {
      const windowStart = Math.max(start + 1, hardEnd - LOOKBACK_WINDOW);
      cut = findBoundaryCut(units, windowStart, hardEnd) ?? hardEnd;
    }

    // Never emit an empty chunk (can't happen given the loop bounds, but
    // guards against a pathological boundary search result).
    if (cut <= start) cut = hardEnd;

    chunks.push(units.slice(start, cut).join(""));
    start = cut;
  }

  return chunks;
}

/**
 * Looks for the best place to cut between [windowStart, hardEnd), scanning
 * backward from hardEnd. Returns an index positioned just *after* the
 * break character(s) so the break itself stays with the earlier chunk
 * and no character — including the whitespace — is ever dropped.
 */
function findBoundaryCut(units: string[], windowStart: number, hardEnd: number): number | null {
  // 1) Prefer a paragraph break (blank line).
  for (let i = hardEnd - 1; i > windowStart; i--) {
    if (units[i] === "\n" && units[i - 1] === "\n") {
      let end = i + 1;
      while (end < hardEnd && units[end] === "\n") end++;
      return end;
    }
  }

  // 2) Next, a single line break.
  for (let i = hardEnd - 1; i >= windowStart; i--) {
    if (units[i] === "\n") return i + 1;
  }

  // 3) Finally, any whitespace.
  for (let i = hardEnd - 1; i >= windowStart; i--) {
    if (/\s/.test(units[i] as string)) return i + 1;
  }

  return null;
}
