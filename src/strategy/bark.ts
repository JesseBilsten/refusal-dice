import { Call, Dice } from '../engine'
import { ALL_CALLS } from './bots'
import { HAMMER_ALT_CALL, HAMMER_ALT_LOSS, HAMMER_CALL, HAMMER_LOSS, HAMMER_ODDS_SIZES } from './hammer-odds'

/**
 * Call or bark, from the generated hammer-odds.ts and seat-odds.ts: what
 * the Hammer's best call is worth with these dice at this table size, set
 * against a bark (the last seat, with fresh dice).
 */
export interface HammerCall {
  call: Call
  /** 0–1: the Hammer's chance of the pencil making it, refusals played out */
  loss: number
}

export interface BarkRow {
  /** Dice sorted low to high */
  dice: Dice
  /** How many of the 7,776 ordered rolls this is */
  ways: number
  best: HammerCall
  /** The best call that isn't 10-4 (the same as `best` when that isn't 10-4) */
  alt: HammerCall
}

const key = (dice: Dice) => [...dice].sort((a, b) => a - b).join('')
const FACT = [1, 1, 2, 6, 24, 120]

/** How many ordered rolls of five dice sort to `dice` */
export function rollWays(dice: Dice): number {
  const counts = [0, 0, 0, 0, 0, 0, 0]
  dice.forEach((d) => counts[d]++)
  return counts.reduce((n, c) => n / FACT[c], 120)
}

function column(players: number): number {
  const i = HAMMER_ODDS_SIZES.indexOf(players)
  if (i < 0) throw new Error(`No Hammer odds for ${players} players`)
  return i
}

/** The Hammer's best call with `dice` at a table of `players`; `except104` leaves out 10-4 */
export function hammerCall(dice: Dice, players: number, options: { except104?: boolean } = {}): HammerCall {
  const k = key(dice)
  const i = column(players)
  const [calls, losses] = options.except104 ? [HAMMER_ALT_CALL, HAMMER_ALT_LOSS] : [HAMMER_CALL, HAMMER_LOSS]
  if (!calls[k]) throw new Error(`No Hammer odds for ${k}: run npm run generate:hammer-odds`)
  return { call: ALL_CALLS[calls[k][i]], loss: losses[k][i] / 1000 }
}

/** Every roll at a table of `players`, the one most likely to take the pencil first */
export function barkTable(players: number): BarkRow[] {
  return Object.keys(HAMMER_LOSS)
    .map((k) => {
      const dice = k.split('').map(Number) as Dice
      return {
        dice,
        ways: rollWays(dice),
        best: hammerCall(dice, players),
        alt: hammerCall(dice, players, { except104: true }),
      }
    })
    .sort((a, b) => b.best.loss - a.best.loss)
}

