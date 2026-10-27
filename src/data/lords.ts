export type LordId = "north" | "east" | "west";
export type LordRank = 1 | 2 | 3;

export const RANK_POINTS: Record<LordRank, number> = {
  1: 10,
  2: 20,
  3: 30,
};

export type Lord = {
  id: LordId;
  name: string;
  rank: LordRank;
  marker: string;
  lines: readonly string[];
  points: number;
};

export const LORDS: readonly Lord[] = [
  {
    id: "north",
    name: "Lord North",
    rank: 1,
    marker: "N",
    lines: [
      "Your Grace, the north is quiet.",
      "We missed your snoring less than we admit.",
    ],
    points: RANK_POINTS[1],
  },
  {
    id: "east",
    name: "Lord East",
    rank: 2,
    marker: "E",
    lines: ["The east sent bread. Also gossip.", "Mostly gossip."],
    points: RANK_POINTS[2],
  },
  {
    id: "west",
    name: "High Lord West",
    rank: 3,
    marker: "W",
    lines: [
      "West winds say you finally woke.",
      "About time, Your Grace. The kingdom is yours to keep.",
    ],
    points: RANK_POINTS[3],
  },
];

export function getLord(id: LordId): Lord {
  const lord = LORDS.find((item) => item.id === id);
  if (!lord) {
    throw new Error(`Unknown lord: ${id}`);
  }
  return lord;
}

export function lordByMarker(marker: string): Lord | undefined {
  return LORDS.find((item) => item.marker === marker);
}

export function maxScore(): number {
  return LORDS.reduce((sum, lord) => sum + lord.points, 0);
}
