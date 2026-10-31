import { createCases, type CasesState } from "./cases";
import { createScore, type ScoreState } from "./score";

// How the last Find Zaga run ended, for its ending screen.
export type HuntResult = { visits: number };

export type Session = {
  score: ScoreState;
  hunt: HuntResult | null;
  cases: CasesState;
};

let session: Session = { score: createScore(), hunt: null, cases: createCases() };

export function resetSession(): Session {
  session = { score: createScore(), hunt: null, cases: createCases() };
  return session;
}

export function getSession(): Session {
  return session;
}
