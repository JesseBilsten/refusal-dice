import { DEFAULT_HOUSE_RULES, Dice, Die, KeepRules, KickerGameId } from '../engine'
import { KeepContext, keepOptions, reachChance } from './situations'

/**
 * Exact odds of making a kicker game, keeping dice to maximize that chance
 * within the keep rules (docs/RULES.md §3.1): the 10s must be made in one
 * roll, the other games keep a start toward the game, and kept dice stay
 * kept. The solving is situations.ts's, with the goal "make the game".
 */

const goal = (game: KickerGameId) => ({ kind: 'make' as const, game })

/**
 * Chance of making `game` from `dice` with `rerolls` rolls left (0–2),
 * keeping dice optimally. 1 when the dice already make it.
 */
export const makeChance = (dice: Dice, game: KickerGameId, rerolls: number, context?: KeepContext): number =>
  reachChance(dice, rerolls, goal(game), context)

/**
 * The die positions to keep to give the best chance of making `game`.
 * When the dice already make it, every position is returned.
 */
export const bestKeepToMake = (dice: Dice, game: KickerGameId, rerolls: number, context?: KeepContext): number[] =>
  keepOptions(dice, Math.max(1, rerolls), goal(game), context)[0].keep

const factorial = (n: number): number => (n <= 1 ? 1 : n * factorial(n - 1))

/** The 252 sorted rolls of five dice, with their chances */
const ROLLS: { dice: Dice; p: number }[] = []
const rec = (from: number, acc: Die[]) => {
  if (acc.length === 5) {
    const counts = [1, 2, 3, 4, 5, 6].map((f) => acc.filter((d) => d === f).length)
    ROLLS.push({ dice: [...acc], p: 120 / counts.reduce((a, n) => a * factorial(n), 1) / 7776 })
    return
  }
  for (let f = from; f <= 6; f++) rec(f, [...acc, f as Die])
}
rec(1, [])

const fresh = new Map<string, number>()

/** Chance of making a kicker game from a fresh roll of five within `rolls` rolls (1–3) */
export function freshMakeChance(game: KickerGameId, rolls = 3, rules: KeepRules = DEFAULT_HOUSE_RULES): number {
  const k = `${game}:${rolls}:${rules.montereyLoneKeep}`
  let p = fresh.get(k)
  if (p === undefined) {
    p = ROLLS.reduce((sum, r) => sum + r.p * makeChance(r.dice, game, rolls - 1, { rules }), 0)
    fresh.set(k, p)
  }
  return p
}
