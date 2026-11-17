/**
 * A stable colour for a chat name: the same person always gets the same one, so a conversation is easy to follow.
 * Brand-leaning on dark (blue and magenta from the app palette, plus amber, violet and green for variety). Each pair is
 * [the avatar fill, the name text], the text a lighter step so it reads on the dark chat.
 */
const PAIRS: ReadonlyArray<readonly [string, string]> = [
  ['#3E6FD8', '#8FB0FF'],
  ['#EE0E8F', '#FF8CC8'],
  ['#E5A100', '#FFD166'],
  ['#8B5CF6', '#C4A7FF'],
  ['#16A06B', '#6EE7B7'],
  ['#E5484D', '#FF9AA2'],
];

export function nameColor(name: string): { fill: string; text: string } {
  let h = 0;
  const s = (name || '?').trim().toLowerCase();
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  const [fill, text] = PAIRS[h % PAIRS.length];
  return { fill, text };
}

/** The first letter of a name, upper case, or "?" when there is none. */
export function nameInitial(name: string): string {
  const c = (name || '').trim().charAt(0);
  return c ? c.toUpperCase() : '?';
}
