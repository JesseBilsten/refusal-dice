import { isKickerGame } from '../../engine'

/**
 * Shared by KeepAdvisor and SituationCard: a situation's goal for the
 * solver (src/strategy/situations.ts), and options in words.
 */

/** The solver goal for situation `s` (null when it isn't complete yet) */
export function goalFor(s, beatDice) {
  if (isKickerGame(s.game))
    return s.goal === 'kicker'
      ? { kind: 'kicker', game: s.game, variant: s.variant || 'high', total: s.total }
      : { kind: 'make', game: s.game }
  if (s.game === 'razzle') return { kind: 'razzle', count: s.count, face: s.face }
  if (s.game === 'boss' && beatDice) return { kind: 'boss', hand: beatDice }
  return null
}

/** "Keep 2-3, roll 3" */
export function optionLabel(o) {
  if (o.stand) return 'Stand: keep all five'
  if (!o.dice.length) return 'Roll all five'
  return `Keep ${o.dice.join('-')}, roll ${5 - o.dice.length}`
}

/**
 * Positions in `dice` holding the digits `kept` (the dice kept last roll),
 * or [] when the roll doesn't hold them all
 */
export function lockedPositions(dice, kept) {
  if (!dice || !kept) return []
  const out = []
  for (const d of kept.split('').map(Number)) {
    const i = dice.findIndex((v, j) => v === d && !out.includes(j))
    if (i < 0) return []
    out.push(i)
  }
  return out
}

/** Rolls left after this one: Boss's come-up is a single last roll */
export const rerollsFor = (s) => (s.game === 'boss' ? 1 : s.rolls || 2)
