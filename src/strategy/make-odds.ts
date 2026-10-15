import { Dice, Die, KickerGameId, makesGame } from '../engine'

/**
 * Exact odds of making a kicker game, assuming the player keeps dice to
 * maximize that chance. Works on the 252 sorted hands (dice order doesn't
 * matter) and the exact distribution of re-rolled dice.
 */

/** Face counts, index 1–6 (index 0 unused) */
type Counts = number[]

const key = (c: Counts) =>
  c[1] + 6 * (c[2] + 6 * (c[3] + 6 * (c[4] + 6 * (c[5] + 6 * c[6]))))

const toCounts = (dice: number[]): Counts => {
  const c = [0, 0, 0, 0, 0, 0, 0]
  dice.forEach((d) => c[d]++)
  return c
}

const toDice = (c: Counts): Dice => {
  const out: Die[] = []
  for (let f = 1; f <= 6; f++) for (let i = 0; i < c[f]; i++) out.push(f as Die)
  return out
}

const factorial = (n: number): number => (n <= 1 ? 1 : n * factorial(n - 1))

/** Every sorted outcome of rolling `m` dice, with its probability */
const OUTCOMES: { counts: Counts; p: number }[][] = [0, 1, 2, 3, 4, 5].map(
  (m) => {
    const out: { counts: Counts; p: number }[] = []
    const rec = (face: number, left: number, c: Counts) => {
      if (face === 6) {
        const counts = [...c]
        counts[6] = left
        const ways =
          factorial(m) / counts.slice(1).reduce((a, n) => a * factorial(n), 1)
        out.push({ counts, p: ways / Math.pow(6, m) })
        return
      }
      for (let n = 0; n <= left; n++) {
        const next = [...c]
        next[face] = n
        rec(face + 1, left - n, next)
      }
    }
    rec(1, m, [0, 0, 0, 0, 0, 0, 0])
    return out
  }
)

/** Every sub-multiset of a hand (the dice a player could keep) */
function keeps(c: Counts): Counts[] {
  let out: Counts[] = [[0, 0, 0, 0, 0, 0, 0]]
  for (let f = 1; f <= 6; f++) {
    const next: Counts[] = []
    out.forEach((k) => {
      for (let n = 0; n <= c[f]; n++) {
        const x = [...k]
        x[f] = n
        next.push(x)
      }
    })
    out = next
  }
  return out
}

const add = (a: Counts, b: Counts) => a.map((n, i) => n + b[i])
const size = (c: Counts) => c[1] + c[2] + c[3] + c[4] + c[5] + c[6]

interface Solver {
  prob: (c: Counts, rerolls: number) => number
  bestKeep: (c: Counts, rerolls: number) => Counts
}

const solvers: Partial<Record<KickerGameId, Solver>> = {}

function solver(game: KickerGameId): Solver {
  const cached = solvers[game]
  if (cached) return cached

  const made = new Map<number, boolean>()
  const isMade = (c: Counts) => {
    const k = key(c)
    let m = made.get(k)
    if (m === undefined) {
      m = makesGame(toDice(c), game)
      made.set(k, m)
    }
    return m
  }

  const memo = new Map<number, { p: number; keep: Counts }>()
  const solve = (c: Counts, rerolls: number): { p: number; keep: Counts } => {
    if (isMade(c)) return { p: 1, keep: c }
    if (rerolls === 0) return { p: 0, keep: c }
    const k = key(c) * 3 + rerolls
    const hit = memo.get(k)
    if (hit) return hit
    let best = { p: -1, keep: c }
    for (const keep of keeps(c)) {
      const m = 5 - size(keep)
      if (m === 0) continue // keeping everything is just standing on a miss
      let p = 0
      for (const o of OUTCOMES[m])
        p += o.p * solve(add(keep, o.counts), rerolls - 1).p
      // Prefer keeping more dice on ties (fewer dice to re-roll)
      if (
        p > best.p + 1e-12 ||
        (Math.abs(p - best.p) <= 1e-12 && size(keep) > size(best.keep))
      )
        best = { p, keep }
    }
    memo.set(k, best)
    return best
  }

  const s: Solver = {
    prob: (c, r) => solve(c, r).p,
    bestKeep: (c, r) => solve(c, r).keep,
  }
  solvers[game] = s
  return s
}

/**
 * Chance of making `game` from `dice` with `rerolls` rolls left (0–2),
 * keeping dice optimally. 1 when the dice already make it.
 */
export const makeChance = (
  dice: Dice,
  game: KickerGameId,
  rerolls: number
): number => solver(game).prob(toCounts(dice), rerolls)

/**
 * The die positions to keep to give the best chance of making `game`.
 * When the dice already make it, every position is returned.
 */
export function bestKeepToMake(
  dice: Dice,
  game: KickerGameId,
  rerolls: number
): number[] {
  const want = [...solver(game).bestKeep(toCounts(dice), Math.max(1, rerolls))]
  const keep: number[] = []
  dice.forEach((d, i) => {
    if (want[d] > 0) {
      keep.push(i)
      want[d]--
    }
  })
  return keep
}

/** Chance of making a kicker game from a fresh roll of five within `rolls` rolls (1–3) */
export const freshMakeChance = (game: KickerGameId, rolls = 3): number =>
  OUTCOMES[5].reduce(
    (p, o) => p + o.p * solver(game).prob(o.counts, rolls - 1),
    0
  )
