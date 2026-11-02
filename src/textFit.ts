// One 284-unit dialog row at 8 units per letter.
export const ROW_CHARS = 35;

// Rows the dialog text takes when it wraps at word boundaries.
export function wrappedRows(text: string, width = ROW_CHARS): number {
  let rows = 1;
  let used = 0;
  for (const word of text.split(" ")) {
    const need = used === 0 ? word.length : used + 1 + word.length;
    if (need <= width) {
      used = need;
    } else {
      rows += 1;
      used = word.length;
    }
  }
  return rows;
}
