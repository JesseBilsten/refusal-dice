import { Call, Dice, Die, GameId, KeepRules } from '../engine'
import { rollWays } from './bark'
import { chooseCall } from './bots'

/**
 * The Hammer's comeback, exact over every roll: when both refusals turn a
 * first call down, the Hammer calls again, and can't call that game. For
 * each roll this takes the call the site recommends (chooseCall), then its
 * best call with that game ruled out. Grouped by first call, that's how
 * often each comeback follows it.
 *
 * Refusers decide from their own dice, so a refusal says nothing about the
 * Hammer's roll: these shares hold whether or not the call was refused. They
 * assume a Hammer who calls the site's recommended call both times.
 */

export interface Comeback {
  call: Call
  /** Rolls (of 7,776) that call `call` second */
  ways: number
  /** Share of the first call's rolls */
  share: number
  /** A few sorted rolls that come back with it, the most common first */
  examples: Dice[]
}

export interface FirstCall {
  call: Call
  /** Rolls (of 7,776) the site calls this with first */
  ways: number
  /** Its comebacks, most likely first */
  comebacks: Comeback[]
}

const callKey = (c: Call) => `${c.game}:${c.variant ?? ''}`

/** Every distinct roll, dice sorted low to high */
function sortedRolls(): Dice[] {
  const out: Dice[] = []
  const rec = (from: number, acc: Die[]) => {
    if (acc.length === 5) return void out.push([...acc])
    for (let f = from; f <= 6; f++) rec(f, [...acc, f as Die])
  }
  rec(1, [])
  return out
}

const TABLES = new Map<string, FirstCall[]>()

/** Every first call the site makes, most common first, each with its comebacks */
export function comebackTable(rules?: KeepRules): FirstCall[] {
  const k = rules?.montereyLoneKeep ? 'lone' : 'standard'
  const cached = TABLES.get(k)
  if (cached) return cached
  const firsts = new Map<string, { call: Call; ways: number; next: Map<string, { call: Call; ways: number; rolls: { dice: Dice; ways: number }[] }> }>()
  for (const dice of sortedRolls()) {
    const ways = rollWays(dice)
    const first = chooseCall(dice, undefined, rules)
    const second = chooseCall(dice, first.game, rules)
    let f = firsts.get(callKey(first))
    if (!f) firsts.set(callKey(first), (f = { call: first, ways: 0, next: new Map() }))
    f.ways += ways
    let n = f.next.get(callKey(second))
    if (!n) f.next.set(callKey(second), (n = { call: second, ways: 0, rolls: [] }))
    n.ways += ways
    n.rolls.push({ dice, ways })
  }
  const table = [...firsts.values()]
    .map((f) => ({
      call: f.call,
      ways: f.ways,
      comebacks: [...f.next.values()]
        .map((n) => ({
          call: n.call,
          ways: n.ways,
          share: n.ways / f.ways,
          examples: [...n.rolls].sort((a, b) => b.ways - a.ways).slice(0, 3).map((r) => r.dice),
        }))
        .sort((a, b) => b.ways - a.ways),
    }))
    .sort((a, b) => b.ways - a.ways)
  TABLES.set(k, table)
  return table
}

/** The comebacks after first call `call` (null when the site never calls it first) */
export const comebacksAfter = (call: Call, rules?: KeepRules): FirstCall | null =>
  comebackTable(rules).find((f) => callKey(f.call) === callKey(call)) ?? null

export interface ComebackOf {
  /** The first call */
  first: Call
  /** The comeback in `game` (its variant) */
  comeback: Comeback
  /** It's the most likely comeback after `first` (or tied for it) */
  top: boolean
}

/** When is `game` the comeback? Every first call it follows, most likely share first */
export function comebackOf(game: GameId, rules?: KeepRules): ComebackOf[] {
  return comebackTable(rules)
    .flatMap((f) =>
      f.comebacks
        .filter((c) => c.call.game === game)
        .map((c) => ({ first: f.call, comeback: c, top: c.ways === f.comebacks[0].ways }))
    )
    .sort((a, b) => b.comeback.share - a.comeback.share)
}
