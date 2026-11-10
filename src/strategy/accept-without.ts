import { Call, Dice, KeepRules } from '../engine'
import {
  ACCEPT_ODDS,
  ACCEPT_ODDS_SAMPLES,
  ACCEPT_ODDS_SIZES,
} from './accept-odds'
import { Holding, holdingOf } from './holdings'

/**
 * Accepting a kicker game you haven't made: how each holding toward it
 * (made it, a partial match, nothing) does accepting and refusing, from
 * the generated table in accept-odds.ts (rounds against solid bots).
 */
export interface AcceptOdds {
  /** 'made', 'nothing', or the dice kept, e.g. '12' */
  key: string
  kind: Holding['kind']
  kept: number[]
  /** Share of all rolls that hold this */
  share: number
  /** Distinct rolls averaged, and rounds played each way */
  rolls: number
  rounds: number
  /** Chance of making the game with 2 rolls left, averaged over the rolls */
  chance: number
  /** Your chance of the pencil accepting and refusing, and each figure's standard error */
  accept: number
  refuse: number
  error: number
  /** The table size these were played at (3 or 6) */
  players: number
  /** Refusing's chance minus accepting's: positive means accept */
  gain: number
  /** 'tossup' when the gap is within about two standard errors */
  verdict: 'accept' | 'refuse' | 'tossup'
}

/** The generated table size nearest a table: 2–4 players read the 3-player figures, 5–8 the 6-player */
export const acceptOddsSize = (players: number): number =>
  players >= 5 ? 6 : 3

const keyOf = (c: Call) => `${c.game} ${c.variant}`

/** Every holding toward `call` for a refuser at `position`, made it first, then partial matches, then nothing */
export function acceptOddsFor(
  call: Call,
  position: 1 | 2,
  players: number,
  rules?: KeepRules
): AcceptOdds[] {
  const set = rules?.montereyLoneKeep ? 'lone-keep' : 'standard'
  const rows = ACCEPT_ODDS[set][keyOf(call)]?.[position]
  if (!rows) return []
  const size = acceptOddsSize(players)
  const i = ACCEPT_ODDS_SIZES.indexOf(size)
  return rows.map(([key, share, rolls, chance, losses]) => {
    const accept = losses[2 * i] / 1000
    const refuse = losses[2 * i + 1] / 1000
    const rounds = rolls * ACCEPT_ODDS_SAMPLES
    const p = Math.max(accept, refuse)
    const error = Math.sqrt((p * (1 - p)) / rounds)
    const gain = refuse - accept
    return {
      key,
      kind: key === 'made' ? 'made' : key === 'nothing' ? 'nothing' : 'partial',
      kept:
        key === 'made' || key === 'nothing' ? [] : key.split('').map(Number),
      share: share / 1000,
      rolls,
      rounds,
      chance: chance / 1000,
      accept,
      refuse,
      error,
      players: size,
      gain,
      verdict:
        Math.abs(gain) <= 2 * error ? 'tossup' : gain > 0 ? 'accept' : 'refuse',
    }
  })
}

/** What `dice` hold toward `call`, and how that holding does in general from this seat */
export function acceptOddsOf(
  dice: Dice,
  call: Call,
  position: 1 | 2,
  players: number,
  rules?: KeepRules
): { holding: Holding; odds: AcceptOdds | undefined } | null {
  const holding = holdingOf(dice, call, rules)
  if (!holding) return null
  return {
    holding,
    odds: acceptOddsFor(call, position, players, rules).find(
      (o) => o.key === holding.key
    ),
  }
}

/** "accept by 5 points", "refuse by 2 points" or "a toss-up" */
export function acceptLean(o: AcceptOdds): string {
  if (o.verdict === 'tossup') return 'a toss-up'
  const n = Math.max(1, Math.round(Math.abs(o.gain) * 100))
  return `${o.verdict} by ${n} point${n === 1 ? '' : 's'}`
}
