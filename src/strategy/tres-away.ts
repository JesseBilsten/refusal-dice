import { tresAwayScore } from '../engine'

/**
 * Tres Away put-outs, exact. After each roll you put out at least one die
 * and re-roll the rest; the put-out choice that gives the lowest average
 * final score comes from an exact expectation over every roll (6^n for n
 * dice in hand). Lowest average score is a proxy for "not the highest at
 * the table", which also depends on the other players.
 */

const value = (d: number) => tresAwayScore([d])

let expected: number[] | null = null

/** Expected final score of the dice still in hand, by count (0–5), playing well */
export function tresAwayExpected(): number[] {
  if (expected) return expected
  const v = [0]
  for (let n = 1; n <= 5; n++) {
    let total = 0
    const roll = new Array(n).fill(1)
    for (let r = 0; r < 6 ** n; r++) {
      let x = r
      for (let i = 0; i < n; i++, x = Math.floor(x / 6)) roll[i] = (x % 6) + 1
      const sorted = roll.map(value).sort((a, b) => a - b)
      let best = Infinity
      let sum = 0
      for (let k = 1; k <= n; k++) {
        sum += sorted[k - 1]
        best = Math.min(best, sum + v[n - k])
      }
      total += best
    }
    v.push(total / 6 ** n)
  }
  return (expected = v)
}

/**
 * The dice to put out from the dice in hand (positions in `dice`): the
 * lowest-scoring dice, as many as lower the expected final score. From five
 * dice that's every 3, plus a 1 only alongside three 3s; with no 3s, just the
 * lowest die.
 */
export function tresAwayPutOut(
  dice: readonly number[],
  inHand: readonly number[] = dice.map((_, i) => i)
): number[] {
  const v = tresAwayExpected()
  const order = [...inHand].sort((a, b) => value(dice[a]) - value(dice[b]))
  const n = order.length
  let best = Infinity
  let bestK = 1
  let sum = 0
  for (let k = 1; k <= n; k++) {
    sum += value(dice[order[k - 1]])
    // Ties keep fewer dice out, so more re-rolls stay open
    if (sum + v[n - k] < best - 1e-9) {
      best = sum + v[n - k]
      bestK = k
    }
  }
  return order.slice(0, bestK).sort((a, b) => a - b)
}
