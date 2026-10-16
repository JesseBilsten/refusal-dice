import {
  BossCategory,
  Dice,
  GameId,
  Variant,
  bossHand,
  evaluateKickerHand,
  isKickerGame,
  razzleScore,
  tresAwayScore,
} from '../../engine'
import { tresAwayPutOut } from '../../strategy/tres-away'

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
  /** What the game dice make, shown after the game's name: "two pair", "four 6s", "7" */
  detail?: string
}

/** Boss hands in words */
export const BOSS_NAMES: Record<BossCategory, string> = {
  'high-card': 'high die',
  pair: 'pair',
  'two-pair': 'two pair',
  'three-of-a-kind': 'three of a kind',
  'full-house': 'full house',
  'four-of-a-kind': 'four of a kind',
  'five-of-a-kind': 'five of a kind',
}
/** Counts in words, for Razzle hands */
export const COUNT_WORDS = ['', 'one', 'two', 'three', 'four', 'five']
const COUNT = COUNT_WORDS

/** A Razzle hand in words: "three 2s" */
export const razzleName = (count: number, face: number) => `${COUNT[count]} ${face}s`

/** The game dice first, then the rest of the roll (unlabeled) */
const split = (
  all: number[],
  indices: number[],
  detail: string
): HandGroup[] => {
  const rest = all.filter((i) => !indices.includes(i))
  return [
    { tone: 'game', label: 'game', indices, detail },
    ...(rest.length
      ? [{ tone: 'plain' as const, label: null, indices: rest }]
      : []),
  ]
}

/** The specialty games: which dice make the hand */
function specialtyGroups(
  dice: Dice,
  game: string,
  putOut?: number[]
): HandGroup[] {
  const all = dice.map((_, i) => i)
  if (game === 'boss') {
    const hand = bossHand(dice)
    return split(all, hand.handDice, BOSS_NAMES[hand.category])
  }
  if (game === 'razzle') {
    // The chosen number plus the wild 1s
    const { count, face } = razzleScore(dice)
    const indices = all.filter((i) => dice[i] === face || dice[i] === 1)
    return split(all, indices, razzleName(count, face))
  }
  // Tres Away: the dice put out so far, or, before any are, the best first
  // put-out from this roll
  if (!putOut) return split(all, tresAwayPutOut(dice), 'put out first')
  if (!putOut.length) return [{ tone: 'plain', label: null, indices: all }]
  return split(all, putOut, `${tresAwayScore(putOut.map((i) => dice[i]))}`)
}

export function handGroups(
  dice: Dice,
  game?: string | null,
  variant?: Variant | null,
  options: { putOut?: number[] } = {}
): HandGroup[] {
  const all = dice.map((_, i) => i)
  // No game, or dice not rolled yet: just the dice
  if (!game || dice.some((d) => !d))
    return [{ tone: 'plain', label: null, indices: all }]
  if (!isKickerGame(game as GameId))
    return specialtyGroups(dice, game, options.putOut)
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
