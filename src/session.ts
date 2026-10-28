import { createScore, type ScoreState } from "./score";

// How the last Find Zaga run ended, for its ending screen.
export type HuntResult = { visits: number; crowd: number };

export type Session = {
  score: ScoreState;
  hunt: HuntResult | null;
};

let session: Session = { score: createScore(), hunt: null };

export function resetSession(): Session {
  session = { score: createScore(), hunt: null };
  return session;
}

export function getSession(): Session {
  return session;
}
