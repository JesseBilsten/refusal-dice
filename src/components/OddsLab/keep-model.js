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

/** Rolls left after this one: Boss's come-up is a single last roll */
export const rerollsFor = (s) => (s.game === 'boss' ? 1 : s.rolls || 2)
