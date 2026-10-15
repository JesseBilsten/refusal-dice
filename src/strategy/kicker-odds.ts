/**
 * Exact odds for re-rolling kickers. Kickers are rolled together
 * (docs/RULES.md §3.1), so a re-roll replaces the whole kicker total with
 * the sum of `n` fresh dice.
 */

const distributions: number[][] = []

/** P(sum = s) for `n` dice, indexed by s (0 … 6n) */
export function diceSumDistribution(n: number): number[] {
  if (distributions[n]) return distributions[n]
  let dist = [1]
  for (let d = 0; d < n; d++) {
    const next = Array(dist.length + 6).fill(0)
    dist.forEach((p, s) => {
      for (let f = 1; f <= 6; f++) next[s + f] += p / 6
    })
    dist = next
  }
  distributions[n] = dist
  return dist
}

export interface TieDecision {
  /** One fresh kicker: chance it beats / equals / falls short of the tied total */
  better: number
  equal: number
  worse: number
  /**
   * Chance you take the pencil if you roll, playing every roll you have
   * left well: stop when you're ahead, take the tie if you land level
   * (or roll on if that's safer), and roll again when you fall short
   */
  loseIfRoll: number
  /** The same, if you had only this one roll (a last roll) */
  loseIfLastRoll: number
  /** Chance you take the pencil if you take the tie and the tied players replay */
  loseIfTie: number
  /** The lower-risk choice */
  choice: 'roll' | 'tie'
}

/**
 * You're tied for the weakest hand at `total`, the players you're tied with
 * have finished rolling, and you have `rolls` rolls left (1 or 2): take the
 * tie, or re-roll your kicker (`kickerDice` dice, rolled whole)?
 *
 * - Roll: falling short loses unless you have another roll; landing level
 *         is the same choice again; beating it is safe.
 * - Tie:  the `tied` players (you included) replay; each is about equally
 *         likely to lose (1 / tied). With only two players left in the whole
 *         game, a tie takes no pencil.
 */
export function rollOrTakeTie(options: {
  kickerDice: number
  variant: 'high' | 'low'
  total: number
  tied: number
  rolls: number
  twoPlayerTable?: boolean
}): TieDecision {
  const {
    kickerDice,
    variant,
    total,
    tied,
    rolls,
    twoPlayerTable = false,
  } = options
  const dist = diceSumDistribution(kickerDice)
  let better = 0
  let equal = 0
  dist.forEach((p, s) => {
    if (s === total) equal += p
    else if (variant === 'high' ? s > total : s < total) better += p
  })
  const worse = 1 - better - equal
  const loseIfTie = twoPlayerTable ? 0 : 1 / tied

  // Chance of losing if you roll now with `r` rolls left, then play on well.
  // Falling short leaves you alone at the bottom: roll again if you can.
  const loseRolling = (r: number): number => {
    if (r <= 0) return 1
    const shortfall = r > 1 ? loseRolling(r - 1) : 1
    const level = r > 1 ? Math.min(loseIfTie, loseRolling(r - 1)) : loseIfTie
    return worse * shortfall + equal * level
  }
  const loseIfRoll = loseRolling(Math.max(1, rolls))
  return {
    better,
    equal,
    worse,
    loseIfRoll,
    loseIfLastRoll: loseRolling(1),
    loseIfTie,
    choice: loseIfRoll < loseIfTie ? 'roll' : 'tie',
  }
}
