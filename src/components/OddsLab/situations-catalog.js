/**
 * Questions from the table, worked out exactly by the Odds Lab's "What
 * should I keep?" (KeepAdvisor). Game pages show their game's question; the
 * Odds Lab offers them all as one-click examples.
 *
 * Only questions players really ask, or whose answer isn't common sense.
 * Games with no real keep decision have none: the 10s (roll all five until
 * it's made, then keep it), and Monterey and Pairs, where keeping your start
 * always beats rolling all five (two different starts would already make the
 * game).
 *
 * Every keep must be legal (docs/RULES.md §3.1): nothing toward a 10 until
 * it's made, one connector in Ship Captain Crew or Monterey, one pair in
 * 7's or Pairs, never a kicker die. A test checks each question's keeps.
 *
 * s: the KeepAdvisor state. `ask` lists keeps (dice, sorted; '' rolls all
 * five) the question is about, so they're always shown even when they're
 * not the best; a keep the house rules don't allow is left out. `kept`:
 * dice kept last roll, committed.
 *
 * `why` (optional): the reasoning in short paragraphs, under `whyTitle`. It gets `odds(keep,
 * rerolls)`, a keep's exact { win, tie } in this situation ('' rolls all
 * five; rerolls defaults to the situation's), and `pct` to format them, so
 * every figure is computed (see keepOdds in keep-model.js).
 */
export const SITUATIONS = {
  'ship-captain-crew': {
    label: 'Ship Captain Crew Low, a kicker of 4 to beat: keep the 1-2 or the 5-6?',
    s: { game: 'ship-captain-crew', roll: '12566', rolls: 2, goal: 'kicker', variant: 'low', total: 4, ask: ['12', '56'] },
    whyTitle: 'Why does the 5-6 come out ahead?',
    why: ({ odds, pct }) => [
      `Either way you need one number and a low kicker from the three dice you roll: a 3 if you keep 1-2, a 4 if ` +
        `you keep 5-6. The other two dice are your kicker, and 1-1 or 1-2 (in either order) beats the 4. That's just ` +
        `as likely for both keeps: ${pct(odds('12', 1).win)} on one roll.`,
      `The difference is the tie at 4, a kicker of 1-3 or 2-2. With the 5-6, a 4, a 1 and a 3 are three different ` +
        `numbers, so they can land 6 ways; with the 1-2, that kicker repeats the 3 you need (3-3-1), which lands only ` +
        `3 ways. So the 5-6 ties ${pct(odds('56', 1).tie)} of the time on one roll, against ${pct(odds('12', 1).tie)}.`,
      `Over both rolls the 1-2 wins a hair more often (${pct(odds('12').win)} against ${pct(odds('56').win)}), but ` +
        `the 5-6 ties ${pct(odds('56').tie)} against ${pct(odds('12').tie)}, and a tie is a replay, not the pencil. ` +
        `Make it with a kicker that's too high and you re-roll just those two dice, the same for either keep.`,
    ],
  },
  vegas: {
    label: '7’s: does it matter which pair you keep, the 1-6 or the 5-6?',
    s: { game: 'vegas', roll: '16533', rolls: 2, goal: 'make', ask: ['16', '56'] },
    whyTitle: 'Why doesn’t the pair matter?',
    why: ({ odds, pct }) => [
      `A kept pair stays one of your two pairs: the 5 can't pair with a rolled 2, nor the 6 with a rolled 1. ` +
        `So the second 7 or 11 has to come from the three dice you roll, whichever pair you kept: ` +
        `${pct(odds('16').win)} either way, against ${pct(odds('').win)} if you roll all five.`,
    ],
  },
  razzle: {
    label: 'Razzle: four 6s to beat. Keep 1-1-6, or just the 1s?',
    s: { game: 'razzle', roll: '11653', rolls: 2, count: 4, face: 6, ask: ['116', '11'] },
  },
  boss: {
    label: 'Boss: hold the 6, or roll all five?',
    s: { game: 'boss', roll: '64215', beat: '33125', ask: ['6', ''] },
  },
  'tres-away': {
    label: 'Tres Away: put out the 1 too?',
    s: { game: 'tres-away', roll: '33152' },
  },
}

/** The Odds Lab link that opens a situation */
export function situationPath(s) {
  const p = new URLSearchParams({ tab: 'keep', game: s.game })
  ;['roll', 'rolls', 'goal', 'variant', 'total', 'count', 'face', 'beat', 'kept'].forEach((k) => {
    if (s[k] !== undefined && s[k] !== '') p.set(k, s[k])
  })
  if (s.ask?.length) p.set('ask', s.ask.join(','))
  return `/odds-lab/?${p}`
}
