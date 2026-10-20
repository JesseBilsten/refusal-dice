/**
 * One question from the table per game, worked out exactly by the Odds
 * Lab's "What should I keep?" (KeepAdvisor). Game pages show their game's
 * question; the Odds Lab offers them all as one-click examples.
 *
 * Every keep must be legal (docs/RULES.md §3.1): nothing toward a 10 until
 * it's made, one connector in Ship Captain Crew or Monterey, one pair in
 * 7's or Pairs, never a kicker die. A test checks each question's keeps.
 *
 * s: the KeepAdvisor state. `ask` lists keeps (dice, sorted; '' rolls all
 * five) the question is about, so they're always shown even when they're
 * not the best; a keep the house rules don't allow is left out. `kept`:
 * dice kept last roll, committed.
 */
export const SITUATIONS = {
  '10-2': {
    label: '10-2 High: a kicker of 3+3+3 to beat 12. Re-roll the kicker, or stand?',
    s: { game: '10-2', roll: '55333', rolls: 2, goal: 'kicker', variant: 'high', total: 12, ask: ['55'] },
  },
  'ship-captain-crew': {
    label: 'Ship, Captain, Crew Low, a kicker of 4 to beat: keep the 1-2 or the 5-6? Only one',
    s: { game: 'ship-captain-crew', roll: '12566', rolls: 2, goal: 'kicker', variant: 'low', total: 4, ask: ['12', '56'] },
  },
  monterey: {
    label: 'Monterey: keep 2-3, or roll all five?',
    s: { game: 'monterey', roll: '23661', rolls: 2, goal: 'make', ask: ['23', '3', ''] },
  },
  vegas: {
    label: '7’s: keep the 1-6 or the 5-6, or roll all five?',
    s: { game: 'vegas', roll: '16533', rolls: 2, goal: 'make', ask: ['16', '56', ''] },
  },
  pairs: {
    label: 'Pairs: three 6s. Keep a pair, or roll all five?',
    s: { game: 'pairs', roll: '66623', rolls: 2, goal: 'make', ask: ['66', ''] },
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
