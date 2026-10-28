// Up/down on the title's mode list, wrapping at both ends.
export function moveSelection(index: number, delta: number, count: number): number {
  return (((index + delta) % count) + count) % count;
}
