import { Dice, Die, GameId, SpecialtyGameId } from '../types'

/**
 * Scoring for the specialty games (docs/RULES.md §3.2–3.4). Each compare
 * function returns a positive number when hand `a` beats hand `b` and 0 when
 * they tie exactly.
 */

export const SPECIALTY_GAMES: readonly SpecialtyGameId[] = [
  'tres-away',
  'boss',
  'razzle',
]

export const isSpecialtyGame = (game: GameId): game is SpecialtyGameId =>
  (SPECIALTY_GAMES as readonly string[]).includes(game)

const counts = (dice: number[]) => {
  const c = [0, 0, 0, 0, 0, 0, 0]
  dice.forEach((d) => c[d]++)
  return c
}

/* ── Tres Away (§3.2) ── */

/** Sum of the dice with 3s counting 0. Lowest wins. */
export const tresAwayScore = (dice: number[]): number =>
  dice.reduce((s, d) => s + (d === 3 ? 0 : d), 0)

export const compareTresAway = (a: Dice, b: Dice): number =>
  tresAwayScore(b) - tresAwayScore(a)

/* ── Razzle (§3.4) ── */

export interface RazzleScore {
  /** How many of `face` the hand has, counting 1s as wild */
  count: number
  face: Die
}

/**
 * The most of any one number with 1s wild, e.g. 1-1-1-4-2 is four 4s.
 * Equal counts go to the higher face, so a hand is scored as the highest
 * face that reaches its best count (five 1s are five 6s).
 */
export function razzleScore(dice: Dice): RazzleScore {
  const c = counts(dice)
  let best: RazzleScore = { count: 0, face: 6 }
  for (let face = 6; face >= 2; face--) {
    const count = c[face] + c[1]
    if (count > best.count) best = { count, face: face as Die }
  }
  return best
}

export function compareRazzle(a: Dice, b: Dice): number {
  const x = razzleScore(a)
  const y = razzleScore(b)
  return x.count - y.count || x.face - y.face
}

/* ── Boss (§3.3) ── */

export type BossCategory =
  | 'high-card'
  | 'pair'
  | 'two-pair'
  | 'three-of-a-kind'
  | 'full-house'
  | 'four-of-a-kind'
  | 'five-of-a-kind'

const CATEGORY_RANK: Record<BossCategory, number> = {
  'high-card': 1,
  pair: 2,
  'two-pair': 3,
  'three-of-a-kind': 4,
  'full-house': 5,
  'four-of-a-kind': 6,
  'five-of-a-kind': 7,
}

export interface BossHand {
  category: BossCategory
  /** Faces in poker tie-break order: bigger groups first, then higher faces */
  ranks: Die[]
  /** Indices of the dice that make the hand (the Boss must keep these) */
  handDice: number[]
}

/** Poker hands without straights or flushes; 1s are the lowest face. */
export function bossHand(dice: Dice): BossHand {
  const c = counts(dice)
  const groups = [1, 2, 3, 4, 5, 6]
    .filter((f) => c[f] > 0)
    .map((f) => ({ face: f as Die, n: c[f] }))
    .sort((x, y) => y.n - x.n || y.face - x.face)
  const shape = groups.map((g) => g.n).join('')

  const category: BossCategory =
    shape === '5'
      ? 'five-of-a-kind'
      : shape.startsWith('4')
        ? 'four-of-a-kind'
        : shape === '32'
          ? 'full-house'
          : shape.startsWith('3')
            ? 'three-of-a-kind'
            : shape.startsWith('22')
              ? 'two-pair'
              : shape.startsWith('2')
                ? 'pair'
                : 'high-card'

  const ranks = groups.flatMap((g) => Array(g.n).fill(g.face) as Die[])
  const madeFaces =
    category === 'high-card'
      ? [groups[0].face]
      : groups.filter((g) => g.n >= 2).map((g) => g.face)
  const handDice = dice
    .map((d, i) => ({ d, i }))
    .filter(({ d }) => madeFaces.includes(d))
    .map(({ i }) => i)
  // High card: only the single highest die
  return {
    category,
    ranks,
    handDice: category === 'high-card' ? handDice.slice(0, 1) : handDice,
  }
}

export function compareBoss(a: Dice, b: Dice): number {
  const x = bossHand(a)
  const y = bossHand(b)
  const byCategory = CATEGORY_RANK[x.category] - CATEGORY_RANK[y.category]
  if (byCategory) return byCategory
  for (let i = 0; i < x.ranks.length; i++) {
    if (x.ranks[i] !== y.ranks[i]) return x.ranks[i] - y.ranks[i]
  }
  return 0
}

/* ── Shared ── */

/** The worst hand(s) among `ids` under `compare` (several when tied). */
export function worstHands<T extends string>(
  ids: T[],
  hand: (id: T) => Dice,
  compare: (a: Dice, b: Dice) => number
): T[] {
  let worst: T[] = []
  for (const id of ids) {
    if (!worst.length) worst = [id]
    else {
      const c = compare(hand(id), hand(worst[0]))
      if (c < 0) worst = [id]
      else if (c === 0) worst.push(id)
    }
  }
  return worst
}

/** The best hand(s) among `ids` under `compare` (several when tied). */
export const bestHands = <T extends string>(
  ids: T[],
  hand: (id: T) => Dice,
  compare: (a: Dice, b: Dice) => number
): T[] => worstHands(ids, hand, (a, b) => compare(b, a))
