# Trag spisa (Find Zaga) — design

## Intent
Find Zaga teaches where she hides, not how a case is built. The trail adds
one made-up case file: every time the crowd finds her, a page of the file
lies beside her — the prosecutor's instruction and the rumor of how the
evidence was actually gathered. Once she is awake, she checks the file step
by step against the rules, and the player calls each step first. The player
learns that evidence gathered the wrong way is thrown out.

The human asked for: instructions plus speculation on how evidence was
collected, then her check of whether it was done by the book; a made-up case
first, real cases later. Everything else below is Claude's call.

## Goals
- One invented case (`Dobro Polje`, a village that does not exist), three
  steps, one per find (finds = talk rounds = 3).
- Each step: the instruction, the rumored trace, whether it was lawful, the
  rule with its ZKP article.
- After the third talk round: "Zaga proverava spis" — for each step a short
  recap, then a choice "Po propisu" / "Nije po propisu", then her verdict
  ("Tačno."/"Netačno." + article) and the rule. A closing line: unlawful
  evidence is set apart and not used (ZKP čl. 84).
- The ending adds "Tačne procene: N/3" under "Broj poseta".

## Non-goals
- Real cases (next step, same frame).
- More than one case per run, random cases, points, a fail state.
- Changing the hunt, talk rounds, hints or sleepwalk.

## Anti-goals
- Any real person, place of a real case or real investigation in the file.
- Rules not in the ZKP text, or a step whose answer is debatable.
- Making the check feel like a quiz with a grade: every answer gets the rule.

## Constraints
- Copy in `src/data/trail.ts`; logic in `src/trail.ts` (no Kaplay), Vitest.
- Every dialog line within two rows (`wrappedRows`), choices within
  `MAX_SHOUT_CHARS`.
- Sources in `docs/research/trag-spisa.md`: ZKP (Sl. glasnik RS 72/2011 …
  62/2021), čl. 16, 84, 147, 152, 155–160, 289.

## The steps (Claude's call)
1. Pretres stana — entered without a court order, a neighbor opened the
   door. Not lawful: without an order only with the holder's consent
   (čl. 158 st. 1 t. 1).
2. Laptop — seized and searched at once, without an order. Not lawful: a
   device search needs a court order (čl. 152 st. 3); seizing is fine
   (čl. 147).
3. Iskaz — the suspect spoke to the police with a lawyer, after being told
   his rights. Lawful: such a record may be used (čl. 289).

## Flow
- On each find, after "Evo je…" / "Opet smo je našli…": the page (header
  "List spisa N/3.", the instruction, the trace), then the talk round.
- After round 3's reply: the check, then the ending scene as today.
