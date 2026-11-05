import {
  Action,
  Dice,
  GameState,
  HouseRules,
  activeSeats,
  applyAction,
  bottomTarget,
  refusalSeats,
} from '../../engine'
import { ALL_CALLS, botAction, botActionFor } from '../../strategy'
import { HintNames, HintStats, hintStats } from '../Play/hint-stats'
import { YOU, newTable } from '../Play/play-model'

/**
 * The decision trainer's pure side. A situation is a real moment from a
 * game against solid bots: the table plays seeded games until it's your
 * move, then stops and asks what you'd do. The options and their odds come
 * from the same place as Play's hints (hint-stats.ts): the Hammer's call
 * from the generated call odds, every other decision played out by solid
 * bots (simulateDecision / simulateRefusal, run by the page in a worker).
 *
 * Every figure measures one thing: your chance of the pencil this round.
 */

/** What to practise */
export type Focus = 'all' | 'call' | 'refusal' | 'roll'
/** The kind of decision a situation asks */
export type Kind = 'call' | 'refusal' | 'roll'

export const FOCUSES: { id: Focus; label: string; about: string }[] = [
  {
    id: 'all',
    label: 'Everything',
    about: 'Every kind of decision, as they come up in games.',
  },
  {
    id: 'call',
    label: 'Calling',
    about: 'You hold the Hammer: which game to call, or bark.',
  },
  {
    id: 'refusal',
    label: 'Refusing',
    about: 'You’re a refusal: accept the call, or refuse it.',
  },
  {
    id: 'roll',
    label: 'Rolling',
    about: 'Off the bottom: what to keep, take the tie, put out dice, come up.',
  },
]

export interface TrainerOption {
  id: string
  label: string
  /** The actions this option takes, to play it out (not for calls and refusals) */
  actions?: Action[]
}

export interface Situation {
  seed: number
  kind: Kind
  state: GameState
  /** The options, in a fixed order that says nothing about which is best */
  options: TrainerOption[]
  /** The solid player's pick (the bots' move), by option id */
  solid: string
  stats: HintStats
}

/** Which kind of decision a game state asks of `me`, if any */
export function kindOf(state: GameState): Kind | null {
  const k = state.phase.kind
  if (k === 'call' || k === 'secondCall') return 'call'
  if (k === 'refusal') return 'refusal'
  if (k === 'play' || k === 'tresAway' || k === 'boss') return 'roll'
  return null
}

/**
 * The options a hint offers, in display order: calls in the site's game
 * order with Bark last (hint-stats ranks them by their odds, which would
 * give the answer away), then stand-type choices, keeps (more dice first)
 * and rolling everything.
 */
export function optionsFor(
  stats: HintStats,
  state: GameState,
  names: HintNames
): TrainerOption[] | null {
  const kind = kindOf(state)
  if (kind === 'call') {
    // hint-stats labels each call row "Call <name>"
    const order = (label: string) => {
      const i = ALL_CALLS.findIndex((c) => label === `Call ${names.call(c)}`)
      return i < 0 ? ALL_CALLS.length : i
    }
    const opts: TrainerOption[] = stats.rows
      .filter((r) => r.label !== 'Bark')
      .map((r) => ({ id: r.label, label: r.label }))
      .sort((a, b) => order(a.label) - order(b.label))
    if (stats.rows.some((r) => r.label === 'Bark'))
      opts.push({ id: 'Bark', label: 'Bark' })
    return opts.length >= 2 ? opts : null
  }
  if (kind === 'refusal')
    return [
      { id: 'accept', label: 'Accept' },
      { id: 'refuse', label: 'Refuse' },
    ]
  const choices = stats.choices || []
  if (choices.length < 2) return null
  const rank = (label: string) => {
    if (/^(Take the tie|Stand|Come up|Pick)/.test(label)) return 0
    if (/^Roll/.test(label)) return 3
    // Keep or put out: more dice first
    return 1 + 1 / (1 + (label.match(/\d/g) || []).length)
  }
  return choices
    .map((c) => ({ id: c.label, label: c.label, actions: c.actions }))
    .sort(
      (a, b) => rank(a.label) - rank(b.label) || a.label.localeCompare(b.label)
    )
}

/** Which option the solid player's action is */
function solidId(stats: HintStats, kind: Kind, solid: Action): string | null {
  if (kind === 'refusal') return solid.type === 'accept' ? 'accept' : 'refuse'
  if (kind === 'call') {
    if (solid.type === 'bark') return 'Bark'
    return stats.rows.find((r) => r.best)?.label ?? null
  }
  return stats.choices?.find((c) => c.best)?.label ?? null
}

/** mulberry32: the trainer's own choices (table size, which moment to stop at), from the seed */
function rng(seed: number) {
  let a = seed | 0
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * A situation for `focus`, from seed `seed`: a table of 3–6 players plays
 * on with solid bots (you included) and stops at one of your decisions,
 * chosen at random among those that fit the focus and offer a real choice.
 * Deterministic: the same seed gives the same situation. `namesOf` names
 * calls, players and hands for a state (the page knows the game names).
 */
export function drawSituation(
  seed: number,
  focus: Focus,
  namesOf: (state: GameState) => HintNames,
  rules: Partial<HouseRules> = {}
): Situation {
  const r = rng(seed)
  for (let attempt = 0; attempt < 50; attempt++) {
    const bots = 2 + Math.floor(r() * 4)
    let state = newTable(bots, Math.floor(r() * 2 ** 31), rules)
    // Stop at a decision with this chance, so situations come from every stage of a game
    const stopAt = 0.35
    for (let step = 0; step < 4000 && state.phase.kind !== 'gameOver'; step++) {
      if (state.phase.kind === 'roundOver') {
        state = applyAction(state, { type: 'nextRound' })
        continue
      }
      const next = botAction(state)
      const mine = 'player' in next && next.player === YOU
      const kind = mine ? kindOf(state) : null
      if (kind && (focus === 'all' || focus === kind) && r() < stopAt) {
        const solid = botActionFor(state, YOU)
        const names = namesOf(state)
        const stats = hintStats(state, YOU, solid, names)
        const options = stats && optionsFor(stats, state, names)
        const id = stats && options && solidId(stats, kind, solid)
        if (stats && options && id && options.some((o) => o.id === id)) {
          return { seed, kind, state, options, solid: id, stats }
        }
      }
      state = applyAction(state, next)
    }
  }
  throw new Error(`No ${focus} situation found from seed ${seed}`)
}

/** A refusal's seat ("1st refusal") and who called what, for the situation line */
export function refusalSeat(state: GameState): 1 | 2 | null {
  if (state.phase.kind !== 'refusal') return null
  const seats = refusalSeats(state)
  return seats.first === YOU ? 1 : seats.second === YOU ? 2 : null
}

export const tableSize = (state: GameState) => activeSeats(state).length

export interface Graded {
  /** Each option's chance of the pencil, best (lowest) first */
  ranked: { id: string; label: string; p: number }[]
  /** 'best': yours is the lowest, or within `margin` of it (a toss-up); 'costly': it isn't */
  verdict: 'best' | 'tossup' | 'costly'
  /** How much more often your pick takes the pencil than the best option (0 when it's the best) */
  cost: number
  best: { id: string; label: string; p: number }
  mine: { id: string; label: string; p: number }
}

/**
 * Grade a pick: `values` maps option id → chance of the pencil. Totals
 * within `margin` of the lowest are a toss-up (simulated odds carry about
 * ±1.5 points at 1,000 rounds, so pass about 2 × that).
 */
export function grade(
  options: TrainerOption[],
  values: Record<string, number>,
  picked: string,
  margin: number
): Graded {
  const ranked = options
    .filter((o) => values[o.id] != null)
    .map((o) => ({ id: o.id, label: o.label, p: values[o.id] }))
    .sort((a, b) => a.p - b.p)
  const best = ranked[0]
  const mine = ranked.find((o) => o.id === picked) ?? best
  const cost = Math.max(0, mine.p - best.p)
  const verdict =
    mine.id === best.id ? 'best' : cost <= margin ? 'tossup' : 'costly'
  return { ranked, verdict, cost, best, mine }
}

/** A session's running tally: decisions made, best or toss-up picks, and pencil chance given away */
export interface Tally {
  played: number
  good: number
  /** Sum of each costly pick's cost: "pencils given away", in expectation */
  given: number
}

export const emptyTally = (): Tally => ({ played: 0, good: 0, given: 0 })

export const addToTally = (t: Tally, g: Graded): Tally => ({
  played: t.played + 1,
  good: t.good + (g.verdict === 'costly' ? 0 : 1),
  given: t.given + (g.verdict === 'costly' ? g.cost : 0),
})

/** Your hand's dice, for the page (hidden dice are never shown: this is your own view) */
export const myDice = (s: Situation): Dice => s.state.dice[YOU]

const ordinal = (n: 1 | 2) => (n === 1 ? '1st' : '2nd')
const plural = (n: number, one: string, many: string) =>
  `${n} ${n === 1 ? one : many}`

/**
 * The situation in words: `heading` names the moment, `detail` gives what
 * the decision turns on. Hands and calls are named by the page (`names`).
 */
export function describe(
  s: Situation,
  names: HintNames
): { heading: string; detail: string } {
  const state = s.state
  const phase = state.phase
  const players = tableSize(state)
  const dice = state.dice[YOU]
  if (phase.kind === 'call')
    return {
      heading: 'You hold the Hammer',
      detail: `${players} players. Call a game, or bark?`,
    }
  if (phase.kind === 'secondCall')
    return {
      heading: 'Your call was refused',
      detail: `Both refusals turned down ${names.call(phase.refused)}. Make a second call: a different game, and nobody can refuse it.`,
    }
  if (phase.kind === 'refusal') {
    const seat = refusalSeat(state)!
    const first = refusalSeats(state).first
    return {
      heading: `You’re the ${ordinal(seat)} refusal`,
      detail:
        `${names.player(state.hammer)} holds the Hammer and calls ${names.call(phase.call)}` +
        (seat === 2 ? `, and ${names.player(first)} refused it.` : '.') +
        ` ${players} players. Accept it, or refuse?`,
    }
  }
  if (phase.kind === 'play') {
    const rolls = 3 - phase.rolling[YOU].rollsUsed
    const target = bottomTarget(state, YOU)
    const need = target
      ? ` To climb off the bottom, beat ${names.player(target)}: ${names.hand(state.dice[target])}.`
      : ''
    return {
      heading: `${names.call(phase.call)}: you’re at the bottom`,
      detail: `You have ${names.hand(dice)}, with ${plural(rolls, 'roll', 'rolls')} left.${need}`,
    }
  }
  if (phase.kind === 'tresAway') {
    const hand = phase.hands[YOU]
    const inHand = 5 - hand.out.length
    const pace =
      phase.cycle > 0
        ? 'In a replay everyone puts out one die at a time.'
        : phase.pacer === YOU
          ? 'You called it, so you set the pace: put out as many as you like.'
          : `${names.player(phase.pacer)} has ${plural(phase.hands[phase.pacer].out.length, 'die', 'dice')} out; you can’t pass that.`
    return {
      heading: 'Tres Away: lowest score wins',
      detail: `${plural(inHand, 'die', 'dice')} in hand${hand.fresh ? ', just rolled' : ''}. ${pace}`,
    }
  }
  if (phase.kind === 'boss') {
    if (phase.boss === YOU)
      return {
        heading: 'You’re the Boss',
        detail:
          phase.stage === 'bossRoll'
            ? `You have ${names.hand(dice)}. Roll once more in secret, or decide now: come up, or pick ’em up?`
            : `You have ${names.hand(dice)}. Come up (everyone gets one last roll, the worst hand loses), or pick ’em up (no loser)?`,
      }
    return {
      heading: `${names.player(phase.boss)} came up`,
      detail: `Your last roll. You have ${names.hand(dice)}; the worst hand at the table takes the pencil.`,
    }
  }
  return { heading: '', detail: '' }
}
