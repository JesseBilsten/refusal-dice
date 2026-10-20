import { DEFAULT_HOUSE_RULES, Dice, KickerGameId, GameId, HouseRules, Variant } from '../types'

/**
 * Kicker games (docs/RULES.md §3.1): make the game with some of your dice;
 * the rest are kickers, scored as an additive total. High: higher total
 * wins. Low: lower total wins. Only kickers decide between players who
 * made the game.
 */

export const KICKER_GAMES: readonly KickerGameId[] = [
  '10-2',
  '10-3',
  '10-4',
  'ship-captain-crew',
  'monterey',
  'vegas',
  'pairs',
]

export const isKickerGame = (game: GameId): game is KickerGameId =>
  (KICKER_GAMES as readonly string[]).includes(game)

const sum = (values: number[]) => values.reduce((a, b) => a + b, 0)

const isSet = (values: number[], set: number[]) => {
  const sorted = [...values].sort((a, b) => a - b)
  return sorted.every((v, i) => v === set[i])
}

/** Four values that split into two pairs, each summing to one of `targets` */
const twoPairsSumming = (targets: number[]) => (v: number[]) => {
  const ok = (a: number, b: number) => targets.includes(a + b)
  return (
    (ok(v[0], v[1]) && ok(v[2], v[3])) ||
    (ok(v[0], v[2]) && ok(v[1], v[3])) ||
    (ok(v[0], v[3]) && ok(v[1], v[2]))
  )
}

interface GameShape {
  /** How many dice make the game */
  size: number
  /** Do exactly these dice make the game? */
  makes: (values: number[]) => boolean
}

const SHAPES: Record<KickerGameId, GameShape> = {
  '10-2': { size: 2, makes: (v) => sum(v) === 10 },
  '10-3': { size: 3, makes: (v) => sum(v) === 10 },
  '10-4': { size: 4, makes: (v) => sum(v) === 10 },
  'ship-captain-crew': { size: 3, makes: (v) => isSet(v, [1, 2, 3]) || isSet(v, [4, 5, 6]) },
  monterey: { size: 3, makes: (v) => isSet(v, [2, 3, 4]) || isSet(v, [3, 4, 5]) },
  vegas: { size: 4, makes: twoPairsSumming([7, 11]) },
  pairs: {
    size: 4,
    makes: (v) => {
      const s = [...v].sort((a, b) => a - b)
      return s[0] === s[1] && s[2] === s[3]
    },
  },
}

function combinations(n: number, k: number): number[][] {
  const out: number[][] = []
  const rec = (start: number, acc: number[]) => {
    if (acc.length === k) return void out.push([...acc])
    for (let i = start; i < n; i++) {
      acc.push(i)
      rec(i + 1, acc)
      acc.pop()
    }
  }
  rec(0, [])
  return out
}

export type KickerHand =
  | { made: false }
  | {
      made: true
      /** Indices of the dice that make the game */
      gameDice: number[]
      /** Indices of the kicker dice */
      kickerDice: number[]
      kickerTotal: number
    }

/**
 * Evaluate a hand for a kicker game. When several sets of dice make the
 * game, the one with the best kicker total for the variant is used.
 */
export function evaluateKickerHand(dice: Dice, game: KickerGameId, variant: Variant): KickerHand {
  const shape = SHAPES[game]
  let best: KickerHand = { made: false }
  for (const gameDice of combinations(dice.length, shape.size)) {
    if (!shape.makes(gameDice.map((i) => dice[i]))) continue
    const kickerDice = dice.map((_, i) => i).filter((i) => !gameDice.includes(i))
    const kickerTotal = sum(kickerDice.map((i) => dice[i]))
    if (!best.made || compareKickerTotals(kickerTotal, best.kickerTotal, variant) > 0) {
      best = { made: true, gameDice, kickerDice, kickerTotal }
    }
  }
  return best
}

export const makesGame = (dice: Dice, game: KickerGameId): boolean =>
  evaluateKickerHand(dice, game, 'high').made

/**
 * Kickers are rolled together (docs/RULES.md §3.1): once the dice a player
 * keeps make the game, every other die must be re-rolled. True when `kept`
 * holds a set that makes the game plus extra dice, which would be keeping
 * a kicker.
 */
export const keepsKickers = (kept: Dice, game: KickerGameId): boolean =>
  kept.length > SHAPES[game].size && makesGame(kept, game)

/** The house rules that change what may be kept */
export type KeepRules = Pick<HouseRules, 'montereyLoneKeep'>

const sameDice = (values: number[], set: number[]) => values.length === set.length && isSet(values, set)

/**
 * Dice that may be kept toward a game not yet made (docs/RULES.md §3.1).
 * The 10s have none: they're made in one roll. Ship Captain Crew keeps 1-2
 * or 5-6; Monterey 2-3, 3-4 or 4-5 (or a lone 3 or 4 under that house
 * rule); 7's a pair summing to 7 or 11; Pairs a pair.
 */
function isStart(values: number[], game: KickerGameId, rules: KeepRules): boolean {
  switch (game) {
    case 'ship-captain-crew':
      return sameDice(values, [1, 2]) || sameDice(values, [5, 6])
    case 'monterey':
      return (
        sameDice(values, [2, 3]) ||
        sameDice(values, [3, 4]) ||
        sameDice(values, [4, 5]) ||
        (rules.montereyLoneKeep && (sameDice(values, [3]) || sameDice(values, [4])))
      )
    case 'vegas':
      return values.length === 2 && (values[0] + values[1] === 7 || values[0] + values[1] === 11)
    case 'pairs':
      return values.length === 2 && values[0] === values[1]
    default:
      return false
  }
}

/**
 * May a player keep these dice in a kicker game (docs/RULES.md §3.1)?
 * Only dice that make the game, or a start toward it, never kicker dice.
 * `locked` are the dice they kept last roll: they're committed to them, so
 * the new keep must hold them too. Returns why not, or null when it's legal.
 * (The engine checks positions; this checks values.)
 */
export function keepProblem(
  kept: Dice,
  game: KickerGameId,
  locked: Dice = [],
  rules: KeepRules = DEFAULT_HOUSE_RULES
): string | null {
  const left = [...kept]
  const holdsLocked = locked.every((d) => {
    const i = left.indexOf(d)
    if (i < 0) return false
    left.splice(i, 1)
    return true
  })
  if (!holdsLocked) return 'Kept dice stay kept: you’re committed to the dice you kept last roll'
  if (kept.length === 0) return null
  const values = [...kept]
  if (values.length === SHAPES[game].size && SHAPES[game].makes(values)) return null
  if (keepsKickers(kept, game)) return 'Kickers are rolled together: keep only the dice that make the game, or stand'
  if (isStart(values, game, rules)) return null
  return KEEP_HINTS[game]
}

const KEEP_HINTS: Record<KickerGameId, string> = {
  '10-2': '10-2 has to come in one roll: keep nothing until you have it, then only the two dice that make it',
  '10-3': '10-3 has to come in one roll: keep nothing until you have it, then only the three dice that make it',
  '10-4': '10-4 has to come in one roll: keep nothing until you have it, then only the four dice that make it',
  'ship-captain-crew': 'In Ship Captain Crew keep 1-2 or 5-6 (not both), or the made 1-2-3 or 4-5-6',
  monterey: 'In Monterey keep 2-3, 3-4 or 4-5, or the made 2-3-4 or 3-4-5',
  vegas: 'In 7’s keep one pair that sums to 7 or 11, or both pairs once you have them',
  pairs: 'In Pairs keep one pair, or both pairs once you have them: never a kicker die',
}

/** Is keeping `kept` (after `locked` last roll) legal? See keepProblem */
export const isLegalKeep = (kept: Dice, game: KickerGameId, locked: Dice = [], rules?: KeepRules): boolean =>
  keepProblem(kept, game, locked, rules) === null

/** How many dice make the game (the rest are kickers) */
export const gameSize = (game: KickerGameId): number => SHAPES[game].size

/** Positive when kicker total `a` beats `b` for the variant, 0 when equal. */
export const compareKickerTotals = (a: number, b: number, variant: Variant): number =>
  variant === 'high' ? a - b : b - a
