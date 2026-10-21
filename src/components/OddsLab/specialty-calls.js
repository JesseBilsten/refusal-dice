import { bossHand, razzleScore } from '../../engine'
import { CALL_ODDS_PLAYERS, callLoss } from '../../strategy'
import { SPECIALTY_FILTERS, SPECIALTY_THRESHOLDS } from '../../lib/games-config'
import { STRENGTH_GRADES } from '../Odds/grades'

/**
 * When to call a specialty game: how often the Hammer stays off the
 * pencil calling it, by the hand they start with. Every roll of five
 * (7,776, so each counts as often as it comes up), from call-odds.ts, so
 * it follows the rules and the bots whenever that table is regenerated.
 */

const count = (dice, test) => dice.filter(test).length
const WORDS = ['No', 'One', 'Two', 'Three', 'Four', 'Five']
/** "No wilds", "One wild", "Two wilds" */
const counted = (n, one, many) => `${WORDS[n]} ${n === 1 ? one : many}`
const lower = (s) => s.charAt(0).toLowerCase() + s.slice(1)

const BOSS_ORDER = ['high-card', 'pair', 'two-pair', 'three-of-a-kind', 'full-house', 'four-of-a-kind', 'five-of-a-kind']
const BOSS_NAMES = {
  'high-card': 'High card',
  pair: 'A pair',
  'two-pair': 'Two pair',
  'three-of-a-kind': 'Three of a kind',
  'full-house': 'A full house',
  'four-of-a-kind': 'Four of a kind',
  'five-of-a-kind': 'Five of a kind',
}
const BOSS_SHORT = ['High card+', 'Pair+', 'Two pair+', 'Trips+', 'Full house+', 'Quads+', 'Five-kind']

/**
 * Per game: how a starting roll is grouped (`by`, an index into the
 * rows, best last), each group's label, "this or better" in words, and
 * (where the site grades hands by it) the game's call thresholds
 * (`thresholds`, as games-config's SPECIALTY_THRESHOLDS) and filter labels
 * (`filter`) from a group. `orBetter(key, again)` is shorter on a second
 * mention; `also` is another hand worth calling, outside the groups.
 */
export const SPECIALTY_CALLS = {
  razzle: {
    by: (dice) => count(dice, (d) => d === 1 || d === 6),
    label: (n) => counted(n, 'wild', 'wilds'),
    orBetter: (n, again) => `${lower(WORDS[n])} or more${again ? '' : ' wild 6s (1s count as 6s)'}`,
    // Five of any number grades Strong whatever the wilds (checked in Jest)
    also: 'or five of any number',
    alsoMakes: (dice) => razzleScore(dice).count === 5,
    thresholds: (good, strong) => ({ wildSixesGood: good, wildSixesStrong: strong }),
    filter: (n, tier) => `${n}+ wilds${tier === 'strong' ? ' / 5-kind' : ''}`,
  },
  boss: {
    by: (dice) => BOSS_ORDER.indexOf(bossHand(dice).category),
    label: (i) => BOSS_NAMES[BOSS_ORDER[i]],
    orBetter: (i) => `${lower(BOSS_NAMES[BOSS_ORDER[i]])} or better`,
    // game-validation's Boss ranks start at 1 (high card)
    thresholds: (good, strong) => ({ rankGood: good + 1, rankStrong: strong + 1 }),
    filter: (i) => BOSS_SHORT[i],
  },
  'tres-away': {
    by: (dice) => count(dice, (d) => d === 3),
    label: (n) => counted(n, '3', '3s'),
    orBetter: (n, again) => (n === 1 ? 'a 3 or more' : `${n} or more 3s`) + (again ? '' : ' (3s count 0)'),
  },
}

/** A Strong call (STRENGTH_GRADES): the Hammer stays off the pencil at least this often */
const STRONG = 1 - STRENGTH_GRADES[0].max

const CACHE = new Map()

/**
 * { players, even, rows: [{ key, label, rolls, safe }], good, strong,
 * firstAbove } for `game`: `safe` is the chance the Hammer stays off the
 * pencil calling it with a hand in that group (when everyone plays it);
 * `even` is an even share (1 − 1/players). `good` is the first group from
 * which every better one beats an even share, `strong` the first from
 * which every one grades Strong (the row's key, or null); `firstAbove` is
 * `good` in words.
 */
export function specialtyCalls(game) {
  if (CACHE.has(game)) return CACHE.get(game)
  const spec = SPECIALTY_CALLS[game]
  if (!spec) return null
  const groups = new Map()
  const rec = (dice) => {
    if (dice.length === 5) {
      const k = spec.by(dice)
      const g = groups.get(k) ?? { rolls: 0, safe: 0 }
      g.rolls += 1
      g.safe += 1 - callLoss(dice, { game })
      groups.set(k, g)
      return
    }
    for (let v = 1; v <= 6; v++) rec([...dice, v])
  }
  rec([])
  const rows = [...groups.entries()]
    .sort(([a], [b]) => a - b)
    .map(([key, g]) => ({ key, label: spec.label(key), rolls: g.rolls, safe: g.safe / g.rolls }))
  const even = 1 - 1 / CALL_ODDS_PLAYERS
  const from = (min) => rows.find((r, i) => rows.slice(i).every((x) => x.safe >= min))?.key ?? null
  const good = rows.find((r, i) => rows.slice(i).every((x) => x.safe > even))?.key ?? null
  const strong = from(STRONG)
  const out = {
    players: CALL_ODDS_PLAYERS,
    even,
    rows,
    good,
    strong: strong == null || good == null ? strong : Math.max(good, strong),
    firstAbove: good == null ? null : spec.orBetter(good),
  }
  CACHE.set(game, out)
  return out
}

/**
 * The advice for calling `game`, worked out from the table above: "Call
 * with three of a kind or better. Two pair stays off the pencil 66% of
 * the time, short of an even share (67%)." `pct` formats a chance.
 */
export function callAdvice(game, pct) {
  const c = specialtyCalls(game)
  const spec = SPECIALTY_CALLS[game]
  if (!c || c.good == null) return null
  const parts = [`Call with ${spec.orBetter(c.good)}${spec.also ? `, ${spec.also}` : ''}`]
  if (c.strong != null && c.strong > c.good) parts[0] += `; ${spec.orBetter(c.strong, true)} is a strong call`
  const below = c.rows[c.rows.findIndex((r) => r.key === c.good) - 1]
  if (below)
    parts.push(
      `${below.label} stays off the pencil ${pct(below.safe)} of the time, short of an even share ` +
        `(${pct(c.even)} at a ${c.players}-player table)`
    )
  return parts.join('. ') + '.'
}

/** Whether `dice` are worth calling `game` with, by callAdvice() */
export function worthCalling(game, dice) {
  const spec = SPECIALTY_CALLS[game]
  const { good } = specialtyCalls(game)
  return (good != null && spec.by(dice) >= good) || Boolean(spec.alsoMakes?.(dice))
}

/** games-config's SPECIALTY_THRESHOLDS, with every one the call odds can set worked out from them */
export function callThresholds() {
  if (CACHE.has('callThresholds')) return CACHE.get('callThresholds')
  const out = { ...SPECIALTY_THRESHOLDS }
  Object.entries(SPECIALTY_CALLS).forEach(([game, spec]) => {
    if (!spec.thresholds) return
    const { good, strong } = specialtyCalls(game)
    out[game] = { ...out[game], ...spec.thresholds(good, strong ?? good) }
  })
  CACHE.set('callThresholds', out)
  return out
}

/**
 * games-config's SPECIALTY_FILTERS, labeled to match callThresholds();
 * just the one when a hand worth calling is already a strong call
 */
export function callFilters() {
  if (CACHE.has('callFilters')) return CACHE.get('callFilters')
  const out = { ...SPECIALTY_FILTERS }
  Object.entries(SPECIALTY_CALLS).forEach(([game, spec]) => {
    if (!spec.filter) return
    const { good, strong } = specialtyCalls(game)
    out[game] = [
      { id: 'competitive', label: spec.filter(good, 'competitive') },
      ...(strong != null && strong > good ? [{ id: 'strong', label: spec.filter(strong, 'strong') }] : []),
    ]
  })
  CACHE.set('callFilters', out)
  return out
}
