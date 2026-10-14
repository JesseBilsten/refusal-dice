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
  /** Chance a fresh kicker total beats / equals / falls short of the tied total */
  better: number
  equal: number
  worse: number
  /** Chance you take the pencil if you re-roll your kickers now (no rolls after it are counted) */
  loseIfRoll: number
  /** Chance you take the pencil if you take the tie and the tied players replay */
  loseIfTie: number
  /** The lower-risk choice */
  choice: 'roll' | 'tie'
}

/**
 * You're tied for the weakest hand at `total`, the players you're tied with
 * have finished rolling, and you have a roll left: take the tie, or re-roll
 * your `kickers` dice?
 *
 * - Roll: worse loses; equal ties again; better is safe.
 * - Tie:  the `tied` players (you included) replay; each is about equally
 *         likely to lose (1 / tied). With only two players left in the whole
 *         game, a tie takes no pencil.
 */
export function rollOrTakeTie(options: {
  kickers: number
  variant: 'high' | 'low'
  total: number
  tied: number
  twoPlayerTable?: boolean
}): TieDecision {
  const { kickers, variant, total, tied, twoPlayerTable = false } = options
  const dist = diceSumDistribution(kickers)
  let better = 0
  let equal = 0
  dist.forEach((p, s) => {
    if (s === total) equal += p
    else if (variant === 'high' ? s > total : s < total) better += p
  })
  const worse = 1 - better - equal
  const loseIfTie = twoPlayerTable ? 0 : 1 / tied
  const loseIfRoll = worse + equal * loseIfTie
  return {
    better,
    equal,
    worse,
    loseIfRoll,
    loseIfTie,
    choice: loseIfRoll < loseIfTie ? 'roll' : 'tie',
  }
}
