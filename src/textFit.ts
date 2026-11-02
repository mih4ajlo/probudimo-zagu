// One 284-unit dialog row at 8 units per letter.
export const ROW_CHARS = 35;

// Rows the dialog text takes when it wraps at word boundaries. Like Kaplay, a
// word that fills the row is pushed down when a space follows it.
export function wrappedRows(text: string, width = ROW_CHARS): number {
  let rows = 1;
  let used = 0;
  const words = text.split(" ");
  for (const [i, word] of words.entries()) {
    const need = used === 0 ? word.length : used + 1 + word.length;
    const last = i === words.length - 1;
    if (need < width || (need === width && last)) {
      used = need;
    } else {
      rows += 1;
      used = word.length;
    }
  }
  return rows;
}
