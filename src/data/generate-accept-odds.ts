/**
 * Generates src/strategy/accept-odds.ts: for a refuser, whether to accept a
 * kicker game they haven't made yet. Every distinct roll (252) is sorted by
 * what it holds toward the call (holdings.ts: made it, a partial match such
 * as 1-2 in Ship Captain Crew, or nothing), and each roll is played out
 * both ways from the 1st and 2nd refusal at 3 and 6 players
 * (simulateRefusal: the Hammer holds a roll they'd make this call with, the
 * other refusal and the second call are the bots'). The table gives each
 * holding's average over its rolls, weighted by how often each roll comes.
 *
 * Generated for both rule sets: the standard keeps, and the Monterey house
 * rule that lets a lone 3 or 4 be kept (docs/RULES.md §5).
 *
 *   npm run generate:accept-odds
 *
 * Forks one worker per spare CPU; takes about half an hour.
 */
import { fork } from 'child_process'
import { cpus } from 'os'
import { writeFileSync } from 'fs'
import { join } from 'path'
import { Call, Dice, HouseRules, KICKER_GAMES } from '../engine'
import { holdingOf } from '../strategy/holdings'
import { simulateRefusal } from '../strategy/simulate'

const SIZES = [3, 6]
const POSITIONS = [1, 2] as const
const SAMPLES = 200
const OUT = join(__dirname, '../strategy/accept-odds.ts')

const RULE_SETS: Record<string, Partial<HouseRules>> = {
  standard: {},
  'lone-keep': { montereyLoneKeep: true },
}

const CALLS: Call[] = KICKER_GAMES.flatMap((game) => (['high', 'low'] as const).map((variant) => ({ game, variant })))
const callKey = (c: Call) => `${c.game} ${c.variant}`

const factorial = (n: number): number => (n <= 1 ? 1 : n * factorial(n - 1))

/** Every distinct roll, dice sorted low to high, with its chance */
function rolls(): { dice: Dice; p: number }[] {
  const out: { dice: Dice; p: number }[] = []
  const rec = (from: number, acc: number[]) => {
    if (acc.length === 5) {
      const counts = [1, 2, 3, 4, 5, 6].map((f) => acc.filter((d) => d === f).length)
      out.push({ dice: [...acc] as Dice, p: 120 / counts.reduce((a, n) => a * factorial(n), 1) / 7776 })
      return
    }
    for (let f = from; f <= 6; f++) rec(f, [...acc, f])
  }
  rec(1, [])
  return out
}

/** [rule set, call index, position, roll index] */
type Job = [string, number, number, number]
/** [...job, holding key, make chance, then accept and refuse losses per table size] */
type Result = [string, number, number, number, string, number, ...number[]]

function run([set, c, position, r]: Job): Result {
  const rules = RULE_SETS[set]
  const call = CALLS[c]
  const { dice } = rolls()[r]
  const holding = holdingOf(dice, call, { montereyLoneKeep: Boolean(rules.montereyLoneKeep) })!
  const losses = SIZES.flatMap((players) => {
    const e = simulateRefusal({ dice, call, position: position as 1 | 2, players, samples: SAMPLES, seed: r + 1, rules })
    return [e.accept.pencil, e.refuse.pencil]
  })
  return [set, c, position, r, holding.key, holding.chance, ...losses]
}

if (process.send) {
  process.on('message', (jobs: Job[]) => process.send!(jobs.map(run), () => process.exit(0)))
} else {
  const all = rolls()
  const sets = Object.keys(RULE_SETS)
  const jobs: Job[] = sets.flatMap((set) =>
    CALLS.flatMap((_, c) => POSITIONS.flatMap((pos) => all.map((_, r): Job => [set, c, pos, r])))
  )
  const n = Math.max(1, cpus().length - 1)
  const results: Result[] = []
  let done = 0
  for (let w = 0; w < n; w++) {
    const child = fork(__filename, [], { execArgv: ['-r', 'sucrase/register/ts'] })
    child.on('message', (part: Result[]) => {
      results.push(...part)
      if (++done < n) return
      // Average each holding over its rolls, weighted by each roll's chance
      type Acc = { w: number; rolls: number; chance: number; loss: number[] }
      const groups = new Map<string, Acc>()
      for (const [set, c, pos, r, key, chance, ...loss] of results) {
        const k = `${set}|${c}|${pos}|${key}`
        const g = groups.get(k) ?? { w: 0, rolls: 0, chance: 0, loss: SIZES.flatMap(() => [0, 0]) }
        const p = all[r].p
        g.w += p
        g.rolls++
        g.chance += p * chance
        loss.forEach((x, i) => (g.loss[i] += p * x))
        groups.set(k, g)
      }
      const order = (key: string) => (key === 'made' ? '0' : key === 'nothing' ? '2' : `1${key}`)
      const permille = (x: number) => Math.round(x * 1000)
      const table = (set: string) =>
        CALLS.map((call, c) => {
          const positions = POSITIONS.map((pos) => {
            const keys = [...groups.keys()]
              .filter((k) => k.startsWith(`${set}|${c}|${pos}|`))
              .map((k) => k.split('|')[3])
              .sort((a, b) => order(a).localeCompare(order(b)))
            const rows = keys.map((key) => {
              const g = groups.get(`${set}|${c}|${pos}|${key}`)!
              const loss = g.loss.map((x) => permille(x / g.w))
              return `        ['${key}', ${permille(g.w)}, ${g.rolls}, ${permille(g.chance / g.w)}, [${loss.join(', ')}]],`
            })
            return `      ${pos}: [\n${rows.join('\n')}\n      ],`
          })
          return `    '${callKey(call)}': {\n${positions.join('\n')}\n    },`
        }).join('\n')
      writeFileSync(
        OUT,
        `// Generated by src/data/generate-accept-odds.ts (npm run generate:accept-odds). Don't edit by hand.

/** Table sizes, in the order of each row's losses, and rounds played per roll for each */
export const ACCEPT_ODDS_SIZES = [${SIZES.join(', ')}]
export const ACCEPT_ODDS_SAMPLES = ${SAMPLES}

/**
 * One holding toward the call (holdings.ts): [key ('made', 'nothing' or the
 * dice kept, e.g. '12'), share of rolls (per mille), distinct rolls, chance
 * of making the game with 2 rolls left (per mille, averaged), your chance
 * of the pencil accepting then refusing (per mille) at each table size in
 * ACCEPT_ODDS_SIZES order]
 */
export type AcceptOddsRow = [string, number, number, number, number[]]

/** By rule set, then call ('ship-captain-crew low'), then refusal position (1st or 2nd) */
export const ACCEPT_ODDS: Record<'standard' | 'lone-keep', Record<string, Record<1 | 2, AcceptOddsRow[]>>> = {
${sets.map((set) => `  '${set}': {\n${table(set)}\n  },`).join('\n')}
}
`
      )
      console.log(`Wrote ${CALLS.length} calls × ${POSITIONS.length} positions × ${SIZES.length} sizes × ${sets.length} rule sets to ${OUT}`)
    })
    child.send(jobs.filter((_, i) => i % n === w))
  }
}
