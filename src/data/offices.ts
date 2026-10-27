import { OFFICE_ROWS } from "./offices-list";
import { REPLIES } from "./replies";

export type OfficeLevel = "OJT" | "VJT" | "AJT" | "PJT" | "VRHOVNO";

export const LEVEL_POINTS: Record<OfficeLevel, number> = {
  OJT: 10,
  VJT: 20,
  AJT: 30,
  PJT: 40,
  VRHOVNO: 50,
};

export type Office = {
  id: string;
  name: string;
  level: OfficeLevel;
  city: string;
  points: number;
  lines: readonly string[];
};

// Each office answers with one of its level's replies, picked by list order.
export const OFFICES: readonly Office[] = OFFICE_ROWS.map((row, index) => {
  const replies = REPLIES[row.level];
  return {
    ...row,
    points: LEVEL_POINTS[row.level],
    lines: [`${row.name}: ${replies[index % replies.length]}`],
  };
});

export const OFFICE_IDS: readonly string[] = OFFICES.map((office) => office.id);

export function getOffice(id: string): Office | undefined {
  return OFFICES.find((office) => office.id === id);
}

export function maxScore(): number {
  return OFFICES.reduce((sum, office) => sum + office.points, 0);
}
