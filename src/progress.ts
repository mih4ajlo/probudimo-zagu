export function isReadyForEnding(
  visited: readonly string[],
  officeIds: readonly string[],
): boolean {
  return officeIds.every((id) => visited.includes(id));
}
