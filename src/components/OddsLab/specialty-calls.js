import { bossHand } from '../../engine'
import { CALL_ODDS_PLAYERS, callLoss } from '../../strategy'

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

/**
 * Per game: how a starting roll is grouped (`by`, an index into the
 * rows, best last), each group's label, and "this or better" in words
 */
export const SPECIALTY_CALLS = {
  razzle: {
    by: (dice) => count(dice, (d) => d === 1 || d === 6),
    label: (n) => counted(n, 'wild', 'wilds'),
    orBetter: (n) => `${n} or more wilds (1s and 6s)`,
  },
  boss: {
    by: (dice) => BOSS_ORDER.indexOf(bossHand(dice).category),
    label: (i) => BOSS_NAMES[BOSS_ORDER[i]],
    orBetter: (i) => `${BOSS_NAMES[BOSS_ORDER[i]].charAt(0).toLowerCase()}${BOSS_NAMES[BOSS_ORDER[i]].slice(1)} or better`,
  },
  'tres-away': {
    by: (dice) => count(dice, (d) => d === 3),
    label: (n) => counted(n, '3', '3s'),
    orBetter: (n) => (n === 1 ? 'a 3 or more (3s count 0)' : `${n} or more 3s (3s count 0)`),
  },
}

const CACHE = new Map()

/**
 * { players, even, rows: [{ key, label, rolls, safe }], firstAbove } for
 * `game`: `safe` is the chance the Hammer stays off the pencil calling it
 * with a hand in that group (when everyone plays it); `even` is an even
 * share (1 − 1/players); `firstAbove` is the first group that beats it.
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
  const first = rows.find((r, i) => rows.slice(i).every((x) => x.safe > even))
  const out = { players: CALL_ODDS_PLAYERS, even, rows, firstAbove: first ? spec.orBetter(first.key) : null }
  CACHE.set(game, out)
  return out
}
