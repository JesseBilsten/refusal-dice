import {
  Dice,
  GameId,
  Variant,
  evaluateKickerHand,
  isKickerGame,
} from '../../engine'

/**
 * How a roll is grouped on screen for a game: the dice that make it, then
 * the kicker. Pure, so the grouping is tested (src/__tests__/dice-kit.test.ts)
 * and every Hand on the site groups dice the same way.
 */
export interface HandGroup {
  tone: 'game' | 'kicker' | 'plain'
  /** 'game' (the game's name), 'kicker' (with its total), 'miss' (doesn't make it), or none */
  label: 'game' | 'kicker' | 'miss' | null
  /** Positions in the original roll, so animations and keeps follow the die */
  indices: number[]
  kickerTotal?: number
}

export function handGroups(
  dice: Dice,
  game?: string | null,
  variant?: Variant | null
): HandGroup[] {
  const all = dice.map((_, i) => i)
  // No game, or dice not rolled yet: just the dice
  if (!game || dice.some((d) => !d))
    return [{ tone: 'plain', label: null, indices: all }]
  // Specialty games (Razzle, Boss, Tres Away) use the whole roll
  if (!isKickerGame(game as GameId))
    return [{ tone: 'game', label: 'game', indices: all }]
  const hand = evaluateKickerHand(dice, game as never, variant || 'high')
  if (!hand.made) return [{ tone: 'plain', label: 'miss', indices: all }]
  return [
    { tone: 'game', label: 'game', indices: hand.gameDice },
    ...(hand.kickerDice.length
      ? [
          {
            tone: 'kicker' as const,
            label: 'kicker' as const,
            indices: hand.kickerDice,
            kickerTotal: hand.kickerTotal,
          },
        ]
      : []),
  ]
}
