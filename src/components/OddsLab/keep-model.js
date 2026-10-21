import { bossHand, isKickerGame } from '../../engine'
import { keepOptions } from '../../strategy'

/**
 * Shared by KeepAdvisor and SituationCard: a situation's goal for the
 * solver (src/strategy/situations.ts), and options in words.
 */

/** The solver goal for situation `s` (null when it isn't complete yet) */
export function goalFor(s, beatDice) {
  if (isKickerGame(s.game))
    return s.goal === 'kicker'
      ? { kind: 'kicker', game: s.game, variant: s.variant || 'high', total: s.total }
      : { kind: 'make', game: s.game }
  if (s.game === 'razzle') return { kind: 'razzle', count: s.count, face: s.face }
  if (s.game === 'boss' && beatDice) return { kind: 'boss', hand: beatDice }
  return null
}

/** A Boss hand in words: "a pair of 3s", "two pair", "a high 6" */
export function bossName(dice) {
  const h = bossHand(dice)
  const f = dice[h.handDice[0]]
  return {
    'high-card': `a high ${f}`,
    pair: `a pair of ${f}s`,
    'two-pair': 'two pair',
    'three-of-a-kind': `three ${f}s`,
    'full-house': 'a full house',
    'four-of-a-kind': `four ${f}s`,
    'five-of-a-kind': `five ${f}s`,
  }[h.category]
}

/** "Keep 2-3, roll 3" */
export function optionLabel(o) {
  if (o.stand) return o.tie === 1 ? 'Take the tie (stand)' : 'Stand: keep all five'
  if (!o.dice.length) return 'Roll all five'
  return `Keep ${o.dice.join('-')}, roll ${5 - o.dice.length}`
}

/**
 * Positions in `dice` holding the digits `kept` (the dice kept last roll),
 * or [] when the roll doesn't hold them all
 */
export function lockedPositions(dice, kept) {
  if (!dice || !kept) return []
  const out = []
  for (const d of kept.split('').map(Number)) {
    const i = dice.findIndex((v, j) => v === d && !out.includes(j))
    if (i < 0) return []
    out.push(i)
  }
  return out
}

/** Rolls left after this one: Boss's come-up is a single last roll */
export const rerollsFor = (s) => (s.game === 'boss' ? 1 : s.rolls || 2)

/**
 * The exact odds of each keep in situation `s`: odds('56', 1) is { win,
 * tie } for keeping 5-6 with one roll left ('' rolls all five; rerolls
 * defaults to the situation's). `over` changes the situation, to ask where
 * the answer flips: odds('66', 1, { beat: '66442' }). For a question's
 * `why` and `table` (situations-catalog.js).
 */
export function keepOdds(s, rules) {
  return (digits, rerolls, over = {}) => {
    const t = { ...s, ...over }
    const dice = t.roll.split('').map(Number)
    const beat = t.beat ? t.beat.split('').map(Number) : null
    const context = { locked: lockedPositions(dice, t.kept), rules }
    const o = keepOptions(dice, rerolls ?? rerollsFor(t), goalFor(t, beat), context).find(
      (x) => !x.stand && x.dice.join('') === digits
    )
    if (!o) throw new Error(`No keep ${digits || 'none'} in ${t.game} ${t.roll}`)
    return o
  }
}

/** The rules a question is answered under: the table's, plus any house rule the question assumes */
export const situationRules = (situation, rules) => ({ ...rules, ...situation?.rules })

const reasoning = (situation, rules, pct) => ({ odds: keepOdds(situation.s, situationRules(situation, rules)), pct })

/** A question's reasoning as paragraphs, every figure computed (null when it has none) */
export const situationWhy = (situation, rules, pct) =>
  situation?.why ? situation.why(reasoning(situation, rules, pct)) : null

/** A question's table of where the answer flips, { caption, head, rows } (null when it has none) */
export const situationTable = (situation, rules, pct) =>
  situation?.table ? situation.table(reasoning(situation, rules, pct)) : null
