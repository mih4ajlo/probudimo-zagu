import { createCases, type CasesState } from "./cases";
import type { HopReason } from "./data/jurisdiction";
import { createScore, type ScoreState } from "./score";

// How the last Find Zaga run ended, for its ending screen.
export type HuntResult = { visits: number };

export type Session = {
  score: ScoreState;
  hunt: HuntResult | null;
  cases: CasesState;
  // Hop reasons whose splash was already shown this game.
  taught: HopReason[];
};

let session: Session = { score: createScore(), hunt: null, cases: createCases(), taught: [] };

export function resetSession(): Session {
  session = { score: createScore(), hunt: null, cases: createCases(), taught: [] };
  return session;
}

export function getSession(): Session {
  return session;
}
