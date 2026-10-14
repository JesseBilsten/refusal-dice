import { Dice, KickerGameId, PlayerId, Variant } from '../types'
import { compareKickerTotals, evaluateKickerHand } from './kicker-games'

/**
 * The outcome of one cycle of a kicker game (docs/RULES.md §4):
 * - loser: exactly one player loses
 * - cycle: two or more players missed the game; they play the same call
 *          again with fresh rolls (everyone who made it is safe)
 * - tie:   players tied for the worst kicker total
 */
export type CycleResult =
  | { kind: 'loser'; loser: PlayerId }
  | { kind: 'cycle'; players: PlayerId[] }
  | { kind: 'tie'; players: PlayerId[] }

export function resolveKickerCycle(
  hands: Record<PlayerId, Dice>,
  game: KickerGameId,
  variant: Variant
): CycleResult {
  const players = Object.keys(hands)
  const evaluated = players.map((id) => ({ id, hand: evaluateKickerHand(hands[id], game, variant) }))

  const missed = evaluated.filter((e) => !e.hand.made).map((e) => e.id)
  if (missed.length === 1) return { kind: 'loser', loser: missed[0] }
  if (missed.length >= 2) return { kind: 'cycle', players: missed }

  // Everyone made it: the worst kicker total loses
  const totals = evaluated.map((e) => ({ id: e.id, total: e.hand.made ? e.hand.kickerTotal : 0 }))
  const worst = totals.reduce((w, t) => (compareKickerTotals(t.total, w.total, variant) < 0 ? t : w))
  const tied = totals.filter((t) => t.total === worst.total).map((t) => t.id)
  return tied.length === 1 ? { kind: 'loser', loser: tied[0] } : { kind: 'tie', players: tied }
}
