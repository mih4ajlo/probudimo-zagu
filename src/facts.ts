import { FACTS, type Fact } from "./data/facts";
import { OJT_AREAS } from "./data/jurisdiction";
import { getOffice, type OfficeLevel } from "./data/offices";
import type { Rng } from "./hunt";

// order: a shuffle of fact indices; pos: the next one to show; last: the id shown last.
export type FactsState = { order: number[]; pos: number; last: string | null; rng: Rng };

function shuffled(count: number, rng: Rng): number[] {
  const order = Array.from({ length: count }, (_, i) => i);
  for (let i = count - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order;
}

export function createFacts(facts: readonly Fact[] = FACTS, rng: Rng = Math.random): FactsState {
  return { order: shuffled(facts.length, rng), pos: 0, last: null, rng };
}

// Every fact once, then a new shuffle that never starts with the fact just shown.
export function nextFact(state: FactsState, facts: readonly Fact[] = FACTS): Fact {
  if (state.pos >= state.order.length) {
    state.order = shuffled(facts.length, state.rng);
    state.pos = 0;
    if (state.order.length > 1 && facts[state.order[0]].id === state.last) {
      [state.order[0], state.order[1]] = [state.order[1], state.order[0]];
    }
  }
  const fact = facts[state.order[state.pos]];
  state.pos += 1;
  state.last = fact.id;
  return fact;
}

// The next unseen fact about the target's level or VJT area, else the next in rotation.
export function factFor(
  state: FactsState,
  target: FactTarget,
  facts: readonly Fact[] = FACTS,
): Fact {
  const matches = (fact: Fact) =>
    (fact.levels?.includes(target.level) ?? false) || (target.vjt !== null && fact.vjt === target.vjt);
  const at = state.order.findIndex((index, i) => i >= state.pos && matches(facts[index]));
  if (at >= 0) {
    [state.order[state.pos], state.order[at]] = [state.order[at], state.order[state.pos]];
  }
  return nextFact(state, facts);
}

export type FactTarget = { level: OfficeLevel; vjt: string | null };

// An office's level and VJT area (its own id for a VJT), for factFor.
export function factTarget(officeId: string): FactTarget | null {
  const office = getOffice(officeId);
  if (!office) {
    return null;
  }
  const vjt = office.level === "VJT" ? office.id : (OJT_AREAS[office.id]?.vjt ?? null);
  return { level: office.level, vjt };
}
