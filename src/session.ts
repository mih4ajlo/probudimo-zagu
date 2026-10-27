import { createScore, type ScoreState } from "./score";

export type Session = {
  score: ScoreState;
};

let session: Session = { score: createScore() };

export function resetSession(): Session {
  session = { score: createScore() };
  return session;
}

export function getSession(): Session {
  return session;
}
