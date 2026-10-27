export function isReadyForEnding(
  visited: readonly string[],
  lordIds: readonly string[],
): boolean {
  return lordIds.every((id) => visited.includes(id));
}
