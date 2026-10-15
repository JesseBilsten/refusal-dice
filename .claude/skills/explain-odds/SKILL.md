---
name: explain-odds
description: Present the odds of a Refusal Dice decision (take the tie or roll, accept or refuse, which call, keep or re-roll) with the shared odds-decision pattern in src/components/Odds. Use whenever a page or the tutorial shows a probability to help a player choose.
---

# Explaining the odds of a decision

Every probability decision on the site uses the same pattern, so players learn
to read it once and improving it improves every screen. The reference
implementation is the tutorial's "Take the tie, or roll?" step
(`src/components/Tutorial/index.jsx`, numbers in `tie-odds.ts`).

## Anatomy (in this order)

1. **Situation**: one sentence on where you stand and what the options are.
2. **Verdict**: the answer first. `OddsDecision` writes it from the numbers:
   "**Take the tie.** You take the pencil **50%** of the time, instead of
   **77%** if you roll your kicker."
3. **Comparison bars** (`OddsDecision`): one row per option with its total,
   a natural frequency ("about 3 in 4"), and a 0–100% bar split into the ways
   it happens. The best option gets a highlighted border and a **Best** badge.
4. **Outcome visual**: show the dice concretely. `OutcomeGrid` draws all 36
   ways two dice land and counts each kind ("3 of 36: beats 10").
5. **How the math works** (`Disclosure` + `MathSteps`, closed): one line per
   step, in the form *label* / `expression = result`. Add up to the totals in
   the bars.
6. **Questions** (`Disclosure` + `Questions`, closed): the questions a
   surprising number raises, each answered in one or two sentences.
7. **Actions**: the recommended option is the primary button, listed first.

## Components (`src/components/Odds`)

```jsx
import { OddsDecision, OutcomeGrid, Disclosure, MathSteps, Questions, fmtPct } from '../Odds'

<OddsDecision
  outcome="take the pencil"            // verb phrase; the bars measure this
  lowerIsBetter                         // default; false for "make the game"
  options={[{ id, label: 'Take the tie', segments: [{ p, label, kind }] }]}
/>
```

- Segment `kind` is what the slice means for the player: `lose` (red),
  `coin` (amber, striped: a replay or another roll, could go either way),
  `safe` (green). The colors are the `odds-*` tokens in `global.css`, with
  light and dark values.
- The slices must add up to the option's total, and a test must say so.
- `OutcomeGrid` takes `classify(a, b)` and `kinds: { key: { label, kind, mark } }`.
  For three or more dice, build a sum histogram on the same tokens
  (not built yet).
- `model.ts` is pure and tested: `fmtPct`, `inWords`, `rankOptions` and
  `twoDiceGrid`.

## Content rules

- **Lead with the recommendation**, then the evidence (inverted pyramid).
- **Use one measure per decision**, and phrase it as the outcome the player
  cares about ("chance you take the pencil"). Never mix "chance to win" and
  "chance to lose" on one screen.
- **Count ties as what they lead to.** A tie is a replay, worth 1 / (players
  tied) of a pencil. Never count it as a win or a loss.
- **Give percents with natural frequencies.** Use "77% · about 3 in 4". Show
  whole percents in the verdict and bars, and one decimal in the math.
- **Show counts for dice.** "3 of 36" is concrete. "8.3%" alone is not.
- **Say "and" multiplies, "or" adds** once, wherever the math combines
  events.
- **Use short words and the site's terms**: kicker (singular, rolled whole),
  take the tie, the pencil, the Hammer. Follow CLAUDE.md's terminology.
- **Keep it under a phone screen** before the disclosures. Cut any sentence
  that doesn't change the decision.

## Questions to anticipate

Answer the ones that apply in the Questions block:

- Isn't a tie safe? (No: it's a replay.)
- "X of 36 reach it, so why does it still lose?" Separate beating from tying.
- Why isn't it the one-roll number? Count every roll left.
- Why is the replay 50/50, or what are the odds of making the game again?
- Can I keep part of my kicker? (No.)
- When does the answer flip? Find the threshold by computing it, e.g. "roll
  when tied at 8 or lower".

## UX laws applied

- **Hick's law:** two or three options, and one is marked Best.
- **Von Restorff effect:** only the recommended option is highlighted.
- **Progressive disclosure:** the math and the questions start closed.
- **Proximity and common region:** each option's number, bar and breakdown
  sit in one card.
- **Fitts's law:** the recommended option is the first, primary button.
- **Miller's law and chunking:** each math step is one line, and there are
  at most six questions.
- **Accessibility:** never rely on color alone. Use stripes on coin slices,
  ✓ and = marks in grid cells, a text legend, and `aria-label`s that read
  the numbers.

## Checklist

- [ ] Compute every number (CLAUDE.md: odds are computed, never typed in).
  Keep them in a pure `.ts` module next to the screen.
- [ ] Add a Jest test that checks each figure shown, and that the slices sum
      to the totals.
- [ ] If an odds figure comes from simulation, state the sample size and
      that it assumes solid bots.
- [ ] Check at 390px wide in light and dark, with no horizontal scroll.
- [ ] When you improve this pattern, update this skill and the reference
      screen together.
