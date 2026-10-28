import { TALK_ROUNDS, type TalkChoice } from "./data/hunt";

// "> " plus the shout fits one 284-unit dialog line at 8 units per letter.
export const MAX_SHOUT_CHARS = 33;

type Rounds = readonly (readonly TalkChoice[])[];

export type TalkState = { round: number };

export function createTalk(): TalkState {
  return { round: 0 };
}

export function isTalkDone(state: TalkState, rounds: Rounds = TALK_ROUNDS): boolean {
  return state.round >= rounds.length;
}

export function talkChoices(state: TalkState, rounds: Rounds = TALK_ROUNDS): string[] | null {
  return isTalkDone(state, rounds) ? null : rounds[state.round].map((choice) => choice.shout);
}

// The crowd's shout and her reply for the picked line; null if not on offer.
export function talkPick(state: TalkState, index: number, rounds: Rounds = TALK_ROUNDS): string[] | null {
  const choice = isTalkDone(state, rounds) ? undefined : rounds[state.round][index];
  if (!choice) {
    return null;
  }
  state.round += 1;
  return [choice.shout, choice.reply];
}
