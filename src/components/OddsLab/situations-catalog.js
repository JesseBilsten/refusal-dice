/**
 * Questions from the table, worked out exactly by the Odds Lab's "What
 * should I keep?" (KeepAdvisor). Game pages show their game's question; the
 * Odds Lab offers them all as one-click examples.
 *
 * Only questions players really ask, or whose answer isn't common sense.
 * Games with no keep decision worth asking about have none: Pairs, where
 * keeping your pair always beats rolling all five, and 10-3 and 10-4 (roll
 * all five until it's made, then keep it). 10-2 asks about taking a tie, and
 * Monterey about its lone 3 or 4 house rule.
 *
 * Every keep must be legal (docs/RULES.md §3.1): nothing toward a 10 until
 * it's made, one connector in Ship, Captain, Crew or Monterey, one pair in
 * 7's or Pairs, never a kicker die. A test checks each question's keeps.
 *
 * Keyed by question; `s.game` is its game, and a game page shows every
 * question for its game (situationsFor).
 *
 * s: the KeepAdvisor state. `ask` lists keeps (dice, sorted; '' rolls all
 * five) the question is about, so they're always shown even when they're
 * not the best; a keep the house rules don't allow is left out. `kept`:
 * dice kept last roll, committed. `rules` (optional): house rules the
 * question assumes, which the answer always uses.
 *
 * `why` (optional): the reasoning in short paragraphs, under `whyTitle`. It gets `odds(keep,
 * rerolls)`, a keep's exact { win, tie } in this situation ('' rolls all
 * five; rerolls defaults to the situation's), and `pct` to format them, so
 * every figure is computed (see keepOdds in keep-model.js). odds' third
 * argument changes the situation, to show where the answer flips.
 *
 * `table` (optional): where the answer flips, as { caption, head, rows }
 * of strings, from the same `odds` and `pct`.
 */

/** Worth of an option when a tie is a replay: half a win */
const worth = (o) => o.win + o.tie / 2

/** 5-5 and a three-dice kicker of `total` (never 4 and 6 together, a second 10) */
function tenTwoRoll(total) {
  for (let a = 1; a <= 6; a++)
    for (let b = a; b <= 6; b++) {
      const c = total - a - b
      if (c >= b && c <= 6 && !([a, b, c].includes(4) && [a, b, c].includes(6))) return `55${a}${b}${c}`
    }
  return null
}

/** 10-2: what re-rolling the kicker is worth when tied at `total` */
const tieRoll = (odds, variant, total, rerolls) =>
  worth(odds('55', rerolls, { roll: tenTwoRoll(total), variant, total }))

/** 10-2: the kicker totals (3 to 18) where taking the tie beats re-rolling */
const takeTieAt = (odds, variant, rerolls) =>
  Array.from({ length: 16 }, (_, i) => i + 3).filter((total) => tieRoll(odds, variant, total, rerolls) < 0.5)

/** Chance that `n` dice sum to `total` or less (or more, `atLeast`) */
function kickerChance(n, total, atLeast = false) {
  let hits = 0
  const rec = (k, sum) => {
    if (!k) return void (hits += atLeast ? sum >= total : sum <= total)
    for (let v = 1; v <= 6; v++) rec(k - 1, sum + v)
  }
  rec(n, 0)
  return hits / 6 ** n
}
export const SITUATIONS = {
  '10-2': {
    label: '10-2 High, tied at a kicker of 12 on your last roll: take the tie, or re-roll the kicker?',
    s: { game: '10-2', roll: '55633', rolls: 1, goal: 'kicker', variant: 'high', total: 12, ask: ['55'] },
    whyTitle: 'Why take the tie?',
    why: ({ odds, pct }) => {
      const worth = (o) => o.win + o.tie / 2
      return [
        `Taking the tie means a replay: a fresh start, an even chance when it's the two of you, so it counts as ` +
          `half a win (${pct(0.5)}).`,
        `Re-roll the kicker and its three dice need 13 or more to beat 12: ${pct(odds('55').win)}. Another ` +
          `${pct(odds('55').tie)} lands on 12 again, a tie after all. Anything lower takes the pencil. That's worth ` +
          `${pct(worth(odds('55')))}, well short of the tie.`,
        `With two rolls left it tips the other way: rolling is worth ${pct(worth(odds('55', 2)))}, since a miss on ` +
          `the first roll gets a second try, and a tie after it can still be taken. So roll then, and take the tie ` +
          `on your last roll.`,
        (() => {
          const [hiLast, hiTwo] = [1, 2].map((r) => Math.min(...takeTieAt(odds, 'high', r)))
          const [loLast, loTwo] = [1, 2].map((r) => Math.max(...takeTieAt(odds, 'low', r)))
          return (
            `Where it flips: in 10-2 High, take a tie at ${hiLast} or more on your last roll, ${hiTwo} or more ` +
            `with two rolls left, and roll below that. 10-2 Low is the mirror image: take a tie at ${loLast} or ` +
            `less on your last roll, ${loTwo} or less with two left.`
          )
        })(),
        `How good is a 10-2 kicker? Three dice spread wider than two, so the same total means less. A Low kicker ` +
          `of 6 or less comes up ${pct(kickerChance(3, 6))} of the time, about as rarely as a Monterey Low kicker ` +
          `of 3 or less (${pct(kickerChance(2, 3))}). In High, 15 or more (${pct(kickerChance(3, 15, true))}) ` +
          `matches a Monterey High 11 or 12 (${pct(kickerChance(2, 11, true))}).`,
      ]
    },
    table: ({ odds, pct }) => ({
      caption:
        '10-2 High, tied: take the tie or roll, and what rolling the kicker is worth (the chance to beat it, plus ' +
        'half the chance of tying again), against 50% for the tie.',
      head: ['Tied at', 'Last roll', 'Two rolls left'],
      rows: [9, 10, 11, 12, 13, 14].map((total) => [
        String(total),
        ...[1, 2].map((r) => {
          const w = tieRoll(odds, 'high', total, r)
          return `${w < 0.5 ? 'Take the tie' : 'Roll'} · ${pct(w)}`
        }),
      ]),
    }),
  },
  'ship-captain-crew': {
    label: 'Ship, Captain, Crew Low, a kicker of 4 to beat: keep the 1-2 or the 5-6?',
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
      `In High it's the other way round: keep the 1-2. Keep the end whose missing number sits away from the ` +
        `kicker you want.`,
    ],
  },
  'ship-captain-crew-high': {
    label: 'Ship, Captain, Crew High, a kicker of 10 to beat: keep the 1-2 or the 5-6?',
    s: { game: 'ship-captain-crew', roll: '12566', rolls: 2, goal: 'kicker', variant: 'high', total: 10, ask: ['12', '56'] },
    whyTitle: 'Why does the 1-2 come out ahead?',
    why: ({ odds, pct }) => [
      `It's the Low question turned around. To beat 10 the kicker needs 11 or 12: a 5-6 (in either order) or a ` +
        `6-6. Alongside the 3 the 1-2 needs, or the 4 the 5-6 needs, that's just as likely: ` +
        `${pct(odds('12', 1).win)} on one roll.`,
      `The difference is the tie at 10, a kicker of 4-6 or 5-5. Keep the 5-6 and you need a 4, which the 4-6 ` +
        `kicker repeats: 4-4-6 lands only 3 ways. Keep the 1-2 and you need a 3; a 3, a 4 and a 6 land 6 ways. So ` +
        `the 1-2 ties ${pct(odds('12', 1).tie)} of the time on one roll, against ${pct(odds('56', 1).tie)}.`,
      `Over both rolls the 5-6 wins a hair more often (${pct(odds('56').win)} against ${pct(odds('12').win)}), ` +
        `but the 1-2 ties ${pct(odds('12').tie)} against ${pct(odds('56').tie)}, and a tie is a replay.`,
      `The rule of thumb: keep the end whose missing number sits away from the kicker you want. In High that's ` +
        `the 1-2, which needs a 3; in Low, the 5-6, which needs a 4. At every kicker, with one roll left or two, ` +
        `it's never worse.`,
    ],
  },
  monterey: {
    label: 'Monterey, at a table that lets you keep a lone 3 or 4: keep the 2-3, or just the 3?',
    s: { game: 'monterey', roll: '23661', rolls: 2, goal: 'make', ask: ['23', '3'] },
    rules: { montereyLoneKeep: true },
    whyTitle: 'Why let go of the 2?',
    why: ({ odds, pct }) => [
      `The 2-3 needs exactly a 4 from the three dice you roll. A lone 3 can still become 2-3-4 or 3-4-5, so a 2 and ` +
        `a 4, or a 4 and a 5, among four dice makes it.`,
      `With two rolls left the lone 3 makes it ${pct(odds('3').win)} of the time, against ${pct(odds('23').win)} ` +
        `for the 2-3: more ways in, and time to collect two dice. With one roll left it flips: the 2-3 makes it ` +
        `${pct(odds('23', 1).win)}, against ${pct(odds('3', 1).win)}, since one die is easier to find than two at once.`,
      `So keep just the 3 on your first roll, and a connector on your last. Without the house rule, a lone 3 can't ` +
        `be kept: hold the 2-3.`,
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
  'boss-two-pair': {
    label: 'Boss, your last roll: two pair (6-6-3-3) against three 2s. Go for the full house, or break up the two pair?',
    s: { game: 'boss', roll: '66331', beat: '22254', ask: ['3366', '66'] },
    whyTitle: 'Why break up the two pair?',
    why: ({ odds, pct }) => {
      const low = { roll: '33221', beat: '44421' }
      return [
        `Going for the full house leaves one die to roll: a 3 or a 6 makes it, ${pct(odds('3366').win)} of the ` +
          `time.`,
        `Keep the 6-6 and roll three instead. One more 6 makes three 6s, which beat three 2s (a full house if the ` +
          `other two pair up), and three of a kind among the three makes a full house: ${pct(odds('66').win)}. Keeping the 3-3 does as well ` +
          `(${pct(odds('33').win)}), since three 3s beat three 2s too.`,
        `It flips when both your pairs rank below their three of a kind. With 3-3-2-2 against three 4s, three 3s ` +
          `still lose, so breaking up needs a full house or better anyway: ${pct(odds('33', 1, low).win)}, against ` +
          `${pct(odds('2233', 1, low).win)} going for the full house. Go for it then, and against a full house too.`,
        `Against a better two pair, say 6-6-4-4, break up: keeping the 6-6 wins ` +
          `${pct(odds('66', 1, { beat: '66442' }).win)}, against ${pct(odds('3366', 1, { beat: '66442' }).win)} ` +
          `going for the full house.`,
      ]
    },
  },
  'tres-away': {
    label: 'Tres Away: put out the 1 too?',
    s: { game: 'tres-away', roll: '33152' },
  },
}

/** A game's questions, in catalog order */
export const situationsFor = (gameId) => Object.values(SITUATIONS).filter((q) => q.s.game === gameId)

/** The Odds Lab link that opens a situation */
export function situationPath(s) {
  const p = new URLSearchParams({ tab: 'keep', game: s.game })
  ;['roll', 'rolls', 'goal', 'variant', 'total', 'count', 'face', 'beat', 'kept'].forEach((k) => {
    if (s[k] !== undefined && s[k] !== '') p.set(k, s[k])
  })
  if (s.ask?.length) p.set('ask', s.ask.join(','))
  return `/odds-lab/?${p}`
}
