/**
 * Generates src/strategy/hammer-odds.ts: for every distinct roll (252) at
 * every table size (2–8), the call the site recommends (chooseCall: the
 * game the roll loses least when everyone plays it, from call-odds.ts) and
 * the Hammer's chance of the pencil making it, refusals and second calls
 * played out by the bots. This is what calling is worth, to set against a
 * bark (seat-odds.ts).
 *
 * Also:
 *  - the recommended call that isn't 10-4, for tables that refuse a 10-4
 *    on sight (the bots refuse on their own dice only);
 *  - the call that does best against the bots. It can be a decoy: a weaker
 *    game, called to be refused so the real game comes as a second call,
 *    which can't be refused. It works on the bots, who never read anything
 *    into a call.
 *
 * Every figure is generated twice: by the standard keep rules, and with the
 * Monterey house rule that lets a lone 3 or 4 be kept (docs/RULES.md §5).
 *
 * Two stages, so picking the lowest of 17 noisy estimates doesn't flatter
 * the best call against the bots: simulateHammer picks it, then each call
 * is measured again on fresh dice.
 *
 *   npm run generate:hammer-odds
 *
 * Forks one worker per spare CPU; takes about an hour.
 */
import { fork } from 'child_process'
import { cpus } from 'os'
import { writeFileSync } from 'fs'
import { join } from 'path'
import { Call, Dice, HouseRules, applyAction, createGame, seeded } from '../engine'
import { ALL_CALLS, chooseCall } from '../strategy/bots'
import { playOutRound, simulateHammer } from '../strategy/simulate'

const SIZES = [2, 3, 4, 5, 6, 7, 8]
const PICK_SAMPLES = 600
const SAMPLES = 2000
const OUT = join(__dirname, '../strategy/hammer-odds.ts')

/** The rule sets, as named in HAMMER_TABLES */
const RULE_SETS: Record<string, Partial<HouseRules>> = {
  standard: {},
  'lone-keep': { montereyLoneKeep: true },
}

const callKey = (c: Call) => (c.variant ? `${c.game} ${c.variant}` : c.game)
const same = (a: Call, b: Call) => a.game === b.game && a.variant === b.variant

/** Every distinct roll, dice sorted low to high */
function hands(): string[] {
  const out: string[] = []
  for (let a = 1; a <= 6; a++)
    for (let b = a; b <= 6; b++)
      for (let c = b; c <= 6; c++)
        for (let d = c; d <= 6; d++) for (let e = d; e <= 6; e++) out.push(`${a}${b}${c}${d}${e}`)
  return out
}

/** How often the Hammer holding `dice` takes the pencil calling `call` (in tenths of a percent), on fresh dice */
function measure(dice: Dice, players: number, call: Call, rules: Partial<HouseRules>): number {
  const ids = Array.from({ length: players }, (_, i) => (i === 0 ? 'me' : `p${i}`))
  let lost = 0
  for (let i = 0; i < SAMPLES; i++) {
    const g = createGame({
      players: ids.map((id) => ({ id, name: id })),
      hammer: 'me',
      source: seeded(1_000_003 + i * 7919),
      rules: { ...rules, pencilsToLose: 1000 },
    })
    const s = applyAction({ ...g, dice: { ...g.dice, me: [...dice] } }, { type: 'call', player: 'me', call })
    if (playOutRound(s).loser === 'me') lost++
  }
  return Math.round((lost / SAMPLES) * 1000)
}

/**
 * [recommended call, its loss, recommended call that isn't 10-4, its loss,
 * best call against the bots, its loss]: calls as indexes into ALL_CALLS
 */
function bestCalls(dice: Dice, players: number, rules: Partial<HouseRules>): number[] {
  const best = simulateHammer({ dice, players, samples: PICK_SAMPLES, seed: 1, rules })[0].call
  const keepRules = { montereyLoneKeep: Boolean(rules.montereyLoneKeep) }
  const picks = [chooseCall(dice, undefined, keepRules), chooseCall(dice, '10-4', keepRules), best]
  const losses = new Map<number, number>()
  return picks.flatMap((call) => {
    const i = ALL_CALLS.findIndex((c) => same(c, call))
    if (!losses.has(i)) losses.set(i, measure(dice, players, call, rules))
    return [i, losses.get(i)!]
  })
}

type Job = [string, string, number]

if (process.send) {
  // Worker: score the (roll, table size) pairs it's sent
  process.on('message', (jobs: Job[]) => {
    const out = jobs.map(([set, k, players]) => [
      set,
      k,
      players,
      ...bestCalls(k.split('').map(Number) as Dice, players, RULE_SETS[set]),
    ])
    process.send!(out, () => process.exit(0))
  })
} else {
  const keys = hands()
  const sets = Object.keys(RULE_SETS)
  const jobs: Job[] = sets.flatMap((set) => SIZES.flatMap((players) => keys.map((k): Job => [set, k, players])))
  const n = Math.max(1, cpus().length - 1)
  const result: Record<string, Record<string, Record<number, number[]>>> = {}
  let done = 0
  for (let w = 0; w < n; w++) {
    const child = fork(__filename, [], { execArgv: ['-r', 'sucrase/register/ts'] })
    child.on('message', (part: [string, string, number, ...number[]][]) => {
      part.forEach(([set, k, players, ...row]) => (((result[set] ??= {})[k] ??= {})[players] = row))
      if (++done < n) return
      const row = (set: string, pick: number) =>
        keys.map((k) => `      '${k}': [${SIZES.map((p) => result[set][k][p][pick]).join(', ')}],`).join('\n')
      const table = (set: string) => `  '${set}': {
    loss: {
${row(set, 1)}
    },
    call: {
${row(set, 0)}
    },
    altLoss: {
${row(set, 3)}
    },
    altCall: {
${row(set, 2)}
    },
    anyLoss: {
${row(set, 5)}
    },
    anyCall: {
${row(set, 4)}
    },
  },`
      writeFileSync(
        OUT,
        `// Generated by src/data/generate-hammer-odds.ts (npm run generate:hammer-odds). Don't edit by hand.

/** Table sizes, in the order of each row below, and samples per roll and size */
export const HAMMER_ODDS_SIZES = [${SIZES.join(', ')}]
export const HAMMER_ODDS_SAMPLES = ${SAMPLES}

/** The calls, by index in the call tables below */
export const HAMMER_ODDS_CALLS = [${ALL_CALLS.map((c) => `'${callKey(c)}'`).join(', ')}]

/** One rule set's figures. Per roll (dice sorted low to high), by table size */
export interface HammerTable {
  /** The Hammer's chance of the pencil making the recommended call (chooseCall), refusals played out, in tenths of a percent */
  loss: Record<string, number[]>
  /** The recommended call (an index into HAMMER_ODDS_CALLS) */
  call: Record<string, number[]>
  /** The same for the recommended call that isn't 10-4 */
  altLoss: Record<string, number[]>
  altCall: Record<string, number[]>
  /** The same for the call that does best against the bots, which may be a decoy (called to be refused) */
  anyLoss: Record<string, number[]>
  anyCall: Record<string, number[]>
}

/** By rule set: standard keeps, or the Monterey house rule that lets a lone 3 or 4 be kept */
export const HAMMER_TABLES: Record<'standard' | 'lone-keep', HammerTable> = {
${sets.map(table).join('\n')}
}
`
      )
      console.log(`Wrote ${keys.length} rolls × ${SIZES.length} table sizes × ${sets.length} rule sets to ${OUT}`)
    })
    child.send(jobs.filter((_, i) => i % n === w))
  }
}
