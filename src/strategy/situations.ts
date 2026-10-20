import {
  DEFAULT_HOUSE_RULES,
  Dice,
  Die,
  KeepRules,
  KickerGameId,
  Variant,
  compareBoss,
  evaluateKickerHand,
  isLegalKeep,
  makesGameHolding,
  razzleScore,
} from '../engine'

/**
 * "What should I keep?", exact. Given a roll, the rolls left and a goal,
 * every keep option is scored by the chance it reaches the goal, assuming
 * you play the remaining rolls as well as possible. Works on sorted hands
 * (dice order doesn't matter) and the exact distribution of re-rolled dice.
 *
 * Kicker games only allow legal keeps (docs/RULES.md §3.1): the dice that
 * make the game, or a start toward it (none in the 10s); a made game's dice
 * can't be re-rolled; and kept dice stay kept and must be part of the game
 * (a kept pair stays one of the pairs), so the solver tracks what's locked.
 * Razzle and Boss keep anything.
 *
 * Answers questions like "Boss: hold a 6 or roll all five?" or "Monterey:
 * hold 2-3 or 3-4?".
 */

export type Goal =
  /** Make a kicker game */
  | { kind: 'make'; game: KickerGameId }
  /** Make a kicker game with a kicker better than `total` (equal is a tie) */
  | { kind: 'kicker'; game: KickerGameId; variant: Variant; total: number }
  /** Razzle: beat `count` of a number, the higher number breaking equal counts */
  | { kind: 'razzle'; count: number; face: number }
  /** Boss: finish with a better poker hand than `hand` (equal is a tie) */
  | { kind: 'boss'; hand: Dice }

export type Outcome = 'win' | 'tie' | 'lose'

export interface KeepOption {
  /** Positions kept (all five when standing), sorted */
  keep: number[]
  /** The kept dice, sorted */
  dice: number[]
  /** Keep everything and stop rolling */
  stand: boolean
  /** Chance of reaching the goal, playing on as well as possible */
  win: number
  /** Chance of ending exactly level with the goal (a tie) */
  tie: number
}

/** Ties count half when choosing between options: a tie is a replay, not a loss */
const TIE_WEIGHT = 0.5

type Counts = number[]

const toCounts = (dice: readonly number[]): Counts => {
  const c = [0, 0, 0, 0, 0, 0, 0]
  dice.forEach((d) => c[d]++)
  return c
}
const toDice = (c: Counts): Dice => {
  const out: Die[] = []
  for (let f = 1; f <= 6; f++) for (let i = 0; i < c[f]; i++) out.push(f as Die)
  return out
}
const key = (c: Counts) =>
  c[1] + 6 * (c[2] + 6 * (c[3] + 6 * (c[4] + 6 * (c[5] + 6 * c[6]))))
const size = (c: Counts) => c[1] + c[2] + c[3] + c[4] + c[5] + c[6]
const add = (a: Counts, b: Counts) => a.map((n, i) => n + b[i])
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
        out.push({ counts, p: ways / 6 ** m })
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

/** Every sub-multiset of a hand: the dice a player could keep */
function subsets(c: Counts): Counts[] {
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

/** Values with `locked` first (`dice` holds them), and the positions they hold there */
function lockedFirst(dice: Dice, locked: Dice): { dice: Dice; locked: number[] } {
  const rest = [...dice]
  locked.forEach((d) => rest.splice(rest.indexOf(d), 1))
  return { dice: [...locked, ...rest], locked: locked.map((_, i) => i) }
}

/** Where a finished hand stands against the goal. `locked`: the values kept at the last roll (kicker games) */
export function judge(dice: Dice, goal: Goal, locked: Dice = []): Outcome {
  switch (goal.kind) {
    case 'make':
      return makesGameHolding(dice, goal.game, locked) ? 'win' : 'lose'
    case 'kicker': {
      const held = lockedFirst(dice, locked)
      const hand = evaluateKickerHand(held.dice, goal.game, goal.variant, held.locked)
      if (!hand.made) return 'lose'
      if (hand.kickerTotal === goal.total) return 'tie'
      const better =
        goal.variant === 'high'
          ? hand.kickerTotal > goal.total
          : hand.kickerTotal < goal.total
      return better ? 'win' : 'lose'
    }
    case 'razzle': {
      const { count, face } = razzleScore(dice)
      if (count !== goal.count) return count > goal.count ? 'win' : 'lose'
      if (face === goal.face) return 'tie'
      return face > goal.face ? 'win' : 'lose'
    }
    case 'boss': {
      const c = compareBoss(dice, goal.hand)
      return c > 0 ? 'win' : c === 0 ? 'tie' : 'lose'
    }
  }
}

const covers = (keep: Counts, locked: Counts) => locked.every((n, f) => keep[f] >= n)

/** May `keep` be kept from `hand`, holding `locked` from last roll? Kicker games follow the keep rules; Razzle and Boss keep anything */
const allowed = (keep: Counts, hand: Counts, locked: Counts, goal: Goal, rules: KeepRules) =>
  goal.kind === 'make' || goal.kind === 'kicker'
    ? covers(keep, locked) &&
      isLegalKeep(toDice(keep), goal.game, { locked: toDice(locked), hand: toDice(hand), rules })
    : true

interface Value {
  win: number
  tie: number
}
const score = (v: Value) => v.win + TIE_WEIGHT * v.tie

/** Solvers are pure per goal; bots ask the same few goals over and over, so keep them */
const SOLVERS = new Map<string, ReturnType<typeof makeSolver>>()
const goalKey = (g: Goal, rules: KeepRules) =>
  (g.kind === 'boss' ? `boss:${[...g.hand].sort().join('')}` : JSON.stringify(g)) +
  (rules.montereyLoneKeep ? ':lone' : '')
function solver(goal: Goal, rules: KeepRules) {
  const k = goalKey(goal, rules)
  let s = SOLVERS.get(k)
  if (!s) {
    if (SOLVERS.size > 500) SOLVERS.clear()
    s = makeSolver(goal, rules)
    SOLVERS.set(k, s)
  }
  return s
}

const KEYS = 6 ** 6

function makeSolver(goal: Goal, rules: KeepRules) {
  const judged = new Map<number, Value>()
  /** A finished hand `c`, holding the `locked` dice kept at its last roll */
  const finish = (c: Counts, locked: Counts): Value => {
    const k = key(c) + KEYS * key(locked)
    let v = judged.get(k)
    if (!v) {
      const o = judge(toDice(c), goal, toDice(locked))
      v = { win: o === 'win' ? 1 : 0, tie: o === 'tie' ? 1 : 0 }
      judged.set(k, v)
    }
    return v
  }

  /** The legal keeps from `c` holding `locked` (keeping all five is standing, not a keep) */
  const keepsFrom = (c: Counts, locked: Counts) =>
    subsets(c).filter((keep) => size(keep) < 5 && allowed(keep, c, locked, goal, rules))

  /** The value of rolling everything but `keep`, with `rerolls` rolls left after this one */
  const roll = (keep: Counts, rerolls: number): Value => {
    const m = 5 - size(keep)
    let win = 0
    let tie = 0
    for (const o of OUTCOMES[m]) {
      const v = best(add(keep, o.counts), keep, rerolls)
      win += o.p * v.win
      tie += o.p * v.tie
    }
    return { win, tie }
  }

  const memo = new Map<number, Value>()
  /** The best you can do holding `c`, committed to `locked`, with `rerolls` rolls left: stand, or keep some and roll */
  function best(c: Counts, locked: Counts, rerolls: number): Value {
    const k = (key(c) + KEYS * key(locked)) * 4 + rerolls
    const hit = memo.get(k)
    if (hit) return hit
    let v = finish(c, locked)
    if (rerolls > 0 && v.win < 1) {
      for (const keep of keepsFrom(c, locked)) {
        const r = roll(keep, rerolls - 1)
        if (score(r) > score(v) + 1e-12) v = r
      }
    }
    memo.set(k, v)
    return v
  }

  return { finish, roll, best, keepsFrom }
}

/** Positions in `dice` that hold the multiset `keep`, the `locked` positions first */
function positions(dice: readonly number[], keep: Counts, locked: number[]): number[] {
  const want = [...keep]
  const out: number[] = []
  const order = [...locked, ...dice.map((_, i) => i).filter((i) => !locked.includes(i))]
  order.forEach((i) => {
    if (want[dice[i]] > 0) {
      out.push(i)
      want[dice[i]]--
    }
  })
  return out.sort((a, b) => a - b)
}

export interface KeepContext {
  /** Positions kept at the last roll: committed in kicker games, so every keep must hold them */
  locked?: number[]
  /** House rules that change what may be kept */
  rules?: KeepRules
}

/**
 * Every legal choice from this roll, best first: stand, or keep some dice
 * and roll the rest. `rerolls` is how many rolls you have left (1 or 2;
 * Boss's last roll is 1). Ties count half when ranking: a tie is a replay,
 * not a loss.
 */
export function keepOptions(
  dice: Dice,
  rerolls: number,
  goal: Goal,
  { locked = [], rules = DEFAULT_HOUSE_RULES }: KeepContext = {}
): KeepOption[] {
  const s = solver(goal, rules)
  const c = toCounts(dice)
  const lockedCounts = toCounts(locked.map((i) => dice[i]))
  const options: KeepOption[] = []
  const now = s.finish(c, lockedCounts)
  options.push({ keep: [0, 1, 2, 3, 4], dice: [...dice].sort(), stand: true, ...now })
  if (rerolls > 0) {
    for (const keep of s.keepsFrom(c, lockedCounts)) {
      const v = s.roll(keep, rerolls - 1)
      options.push({
        keep: positions(dice, keep, locked),
        dice: toDice(keep),
        stand: false,
        ...v,
      })
    }
  }
  return options.sort((a, b) => {
    const d = score(b) - score(a)
    if (Math.abs(d) > 1e-9) return d
    // On equal chances, prefer standing, then keeping more dice
    return Number(b.stand) - Number(a.stand) || b.dice.length - a.dice.length
  })
}

/** Exact chance of reaching `goal` from `dice` with `rerolls` rolls left, playing every roll well */
export function reachChance(dice: Dice, rerolls: number, goal: Goal, context: KeepContext = {}): number {
  const s = solver(goal, context.rules ?? DEFAULT_HOUSE_RULES)
  const locked = context.locked ?? []
  return s.best(toCounts(dice), toCounts(locked.map((i) => dice[i])), rerolls).win
}
