import {
  Call,
  DEFAULT_HOUSE_RULES,
  Dice,
  KeepRules,
  isKickerGame,
  makesGame,
} from '../engine'
import { bestKeepToMake, makeChance } from './make-odds'

/**
 * What a roll holds toward a kicker game, before anyone has kept anything:
 * - `made`: the dice already make it;
 * - `partial`: there are dice worth keeping toward it (e.g. 1-2 in Ship
 *   Captain Crew), the best keep for making it;
 * - `nothing`: nothing to keep (always so in the 10s, which come in one roll).
 * `chance` is the exact chance of making the game with the 2 rolls left.
 */
export interface Holding {
  kind: 'made' | 'partial' | 'nothing'
  /** The dice kept toward the game, low to high (partial only) */
  kept: number[]
  /** 'made', 'nothing', or the kept dice, e.g. '12' */
  key: string
  chance: number
}

export function holdingOf(
  dice: Dice,
  call: Call,
  rules: KeepRules = DEFAULT_HOUSE_RULES
): Holding | null {
  const game = call.game
  if (!isKickerGame(game)) return null
  if (makesGame(dice, game))
    return { kind: 'made', kept: [], key: 'made', chance: 1 }
  const context = { rules }
  const kept = bestKeepToMake(dice, game, 2, context)
    .map((i) => dice[i])
    .sort((a, b) => a - b)
  const chance = makeChance(dice, game, 2, context)
  return kept.length
    ? { kind: 'partial', kept, key: kept.join(''), chance }
    : { kind: 'nothing', kept: [], key: 'nothing', chance }
}
