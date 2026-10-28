import { describe, expect, it } from "vitest";
import { TALK_ROUNDS, type TalkChoice } from "./data/hunt";
import { createTalk, isTalkDone, MAX_SHOUT_CHARS, talkChoices, talkPick } from "./talk";

const rounds: TalkChoice[][] = [
  [
    { shout: "a1", reply: "r-a1" },
    { shout: "b1", reply: "r-b1" },
  ],
  [
    { shout: "a2", reply: "r-a2" },
    { shout: "b2", reply: "r-b2" },
  ],
];

describe("talk", () => {
  it("offers the current round's shouts", () => {
    const talk = createTalk();
    expect(talkChoices(talk, rounds)).toEqual(["a1", "b1"]);
  });

  it("answers a pick with the shout and her reply, then moves on", () => {
    const talk = createTalk();
    expect(talkPick(talk, 1, rounds)).toEqual(["b1", "r-b1"]);
    expect(talkChoices(talk, rounds)).toEqual(["a2", "b2"]);
  });

  it("is done after the last round", () => {
    const talk = createTalk();
    talkPick(talk, 0, rounds);
    expect(isTalkDone(talk, rounds)).toBe(false);
    talkPick(talk, 0, rounds);
    expect(isTalkDone(talk, rounds)).toBe(true);
    expect(talkChoices(talk, rounds)).toBeNull();
    expect(talkPick(talk, 0, rounds)).toBeNull();
  });

  it("ignores a pick that is not on offer", () => {
    const talk = createTalk();
    expect(talkPick(talk, 2, rounds)).toBeNull();
    expect(talkPick(talk, -1, rounds)).toBeNull();
    expect(talk.round).toBe(0);
  });
});

describe("TALK_ROUNDS", () => {
  it("has 3 rounds of 3 choices", () => {
    expect(TALK_ROUNDS).toHaveLength(3);
    expect(TALK_ROUNDS.every((round) => round.length === 3)).toBe(true);
  });

  it("keeps every shout on one dialog line and every reply non-empty", () => {
    for (const choice of TALK_ROUNDS.flat()) {
      expect(choice.shout.length).toBeGreaterThan(0);
      expect(choice.shout.length).toBeLessThanOrEqual(MAX_SHOUT_CHARS);
      expect(choice.reply.length).toBeGreaterThan(0);
    }
  });
});
