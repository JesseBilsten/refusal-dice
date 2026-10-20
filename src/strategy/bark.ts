import { Call, Dice, KeepRules } from '../engine'
import { ALL_CALLS, callLoss, chooseCall, makesCall } from './bots'
import { HAMMER_ODDS_SIZES, HAMMER_TABLES } from './hammer-odds'

/**
 * Call or bark, from the generated hammer-odds.ts and seat-odds.ts: what
 * the recommended call (chooseCall) is worth with these dice at this table
 * size, set against a bark (the last seat, with fresh dice).
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
  /** The recommended call: the game the roll loses least when everyone plays it */
  best: HammerCall
  /** The recommended call that isn't 10-4 (the same as `best` when that isn't 10-4) */
  alt: HammerCall
  /** The call that does best against the bots; it can be a decoy, called to be refused */
  bots: HammerCall
}

const key = (dice: Dice) => [...dice].sort((a, b) => a - b).join('')
const FACT = [1, 1, 2, 6, 24, 120]

/** How many ordered rolls of five dice sort to `dice` */
export function rollWays(dice: Dice): number {
  const counts = [0, 0, 0, 0, 0, 0, 0]
  dice.forEach((d) => counts[d]++)
  return counts.reduce((n, c) => n / FACT[c], 120)
}

/** The generated figures for these house rules */
const tables = (rules?: KeepRules) =>
  HAMMER_TABLES[rules?.montereyLoneKeep ? 'lone-keep' : 'standard']

/** Every distinct roll, dice sorted low to high */
const ROLLS = Object.keys(HAMMER_TABLES.standard.loss)

function column(players: number): number {
  const i = HAMMER_ODDS_SIZES.indexOf(players)
  if (i < 0) throw new Error(`No Hammer odds for ${players} players`)
  return i
}

/**
 * The recommended call with `dice` at a table of `players` and its chance of
 * the pencil. `except104` leaves out 10-4; `vsBots` gives the call that does
 * best against the bots instead.
 */
export function hammerCall(
  dice: Dice,
  players: number,
  options: { except104?: boolean; vsBots?: boolean; rules?: KeepRules } = {}
): HammerCall {
  const k = key(dice)
  const i = column(players)
  const t = tables(options.rules)
  const [calls, losses] = options.vsBots
    ? [t.anyCall, t.anyLoss]
    : options.except104
      ? [t.altCall, t.altLoss]
      : [t.call, t.loss]
  if (!calls[k])
    throw new Error(`No Hammer odds for ${k}: run npm run generate:hammer-odds`)
  return { call: ALL_CALLS[calls[k][i]], loss: losses[k][i] / 1000 }
}

/** Every roll at a table of `players`, the one most likely to take the pencil first */
export function barkTable(players: number, rules?: KeepRules): BarkRow[] {
  return ROLLS.map((k) => {
    const dice = k.split('').map(Number) as Dice
    return {
      dice,
      ways: rollWays(dice),
      best: hammerCall(dice, players, { rules }),
      alt: hammerCall(dice, players, { except104: true, rules }),
      bots: hammerCall(dice, players, { vsBots: true, rules }),
    }
  }).sort((a, b) => b.best.loss - a.best.loss)
}

/** A roll's best call it already makes against its best call it doesn't, when everyone plays the call */
export interface HeldOrNot {
  dice: Dice
  ways: number
  /** The best call the roll makes: a kicker game it has made, or a specialty game */
  held: HammerCall
  /** The best call of a game the roll doesn't make */
  unheld: HammerCall
}

/**
 * Every roll's best call it holds against its best call it doesn't, from
 * call-odds.ts (everyone plays the call, CALL_ODDS_PLAYERS at the table),
 * the biggest edge for the call it doesn't hold first. `secondCall`: the
 * recommended call was refused, so that game is out.
 */
export function heldOrNot(
  options: { secondCall?: boolean; rules?: KeepRules } = {}
): HeldOrNot[] {
  const { rules } = options
  return ROLLS.map((k) => {
    const dice = k.split('').map(Number) as Dice
    const except = options.secondCall
      ? chooseCall(dice, undefined, rules).game
      : undefined
    const ranked = ALL_CALLS.filter((c) => c.game !== except)
      .map((call) => ({ call, loss: callLoss(dice, call, rules) }))
      .sort((a, b) => a.loss - b.loss)
    return {
      dice,
      ways: rollWays(dice),
      held: ranked.find((o) => makesCall(dice, o.call))!,
      unheld: ranked.find((o) => !makesCall(dice, o.call))!,
    }
  }).sort((a, b) => b.held.loss - b.unheld.loss - (a.held.loss - a.unheld.loss))
}
