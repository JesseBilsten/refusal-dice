/**
 * One question from the table per game, worked out exactly by the Odds
 * Lab's "What should I keep?" (KeepAdvisor). Game pages show their game's
 * question; the Odds Lab offers them all as one-click examples.
 *
 * s: the KeepAdvisor state. `ask` lists keeps (dice, sorted) the question
 * is about, so they're always shown even when they're not the best.
 */
export const SITUATIONS = {
  '10-2': {
    label: '10-2 High: re-roll a kicker of 3+1+2 to beat 10?',
    s: { game: '10-2', roll: '55312', rolls: 1, goal: 'kicker', variant: 'high', total: 10, ask: ['55'] },
  },
  '10-3': {
    label: '10-3 High: re-roll a kicker of 2+2 to beat 7?',
    s: { game: '10-3', roll: '13622', rolls: 1, goal: 'kicker', variant: 'high', total: 7, ask: ['136'] },
  },
  '10-4': {
    label: '10-4: you rolled 1-3-6. Keep it?',
    s: { game: '10-4', roll: '13655', rolls: 2, goal: 'make', ask: ['136', '13'] },
  },
  'ship-captain-crew': {
    label: 'Ship, Captain, Crew: hold 1-2 and 5-6?',
    s: { game: 'ship-captain-crew', roll: '12566', rolls: 2, goal: 'make', ask: ['1256', '56'] },
  },
  monterey: {
    label: 'Monterey: hold 2-3, or just the 3?',
    s: { game: 'monterey', roll: '23661', rolls: 2, goal: 'make', ask: ['23', '3'] },
  },
  vegas: {
    label: '7’s: one pair made. Keep the 5 for the next?',
    s: { game: 'vegas', roll: '16533', rolls: 2, goal: 'make', ask: ['16', '156'] },
  },
  pairs: {
    label: 'Pairs: keep a kicker with your pair of 6s?',
    s: { game: 'pairs', roll: '66423', rolls: 2, goal: 'make', ask: ['66', '466'] },
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
  ;['roll', 'rolls', 'goal', 'variant', 'total', 'count', 'face', 'beat'].forEach((k) => {
    if (s[k] !== undefined && s[k] !== '') p.set(k, s[k])
  })
  if (s.ask?.length) p.set('ask', s.ask.join(','))
  return `/odds-lab/?${p}`
}
