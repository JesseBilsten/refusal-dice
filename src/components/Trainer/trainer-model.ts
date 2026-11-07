import {
  Action,
  Call,
  Dice,
  GameState,
  HouseRules,
  activeSeats,
  applyAction,
  bottomHands,
  bottomTarget,
  evaluateKickerHand,
  isKickerGame,
  refusalSeats,
} from '../../engine'
import {
  ALL_CALLS,
  RefusalEstimate,
  botAction,
  botActionFor,
  callLoss,
  chooseCall,
} from '../../strategy'
import { HintNames, HintStats, hintStats } from '../Play/hint-stats'
import { YOU, newTable } from '../Play/play-model'

/**
 * The decision trainer's pure side. A situation is a real moment from a
 * game against solid bots: the table plays seeded games until it's your
 * move, then stops and asks what you'd do. The options and their odds come
 * from the same place as Play's hints (hint-stats.ts): every decision,
 * the Hammer's call included, played out by solid
 * bots (simulateDecision / simulateRefusal, run by the page in a worker).
 *
 * Every figure measures one thing: your chance of the pencil this round.
 */

/** What to practise */
export type Focus = 'all' | 'call' | 'order' | 'refusal' | 'roll'
/** The kind of decision a situation asks ('order': which of two games to call first) */
export type Kind = 'call' | 'order' | 'refusal' | 'roll'

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
    id: 'order',
    label: 'Call order',
    about:
      'Your roll plays two games: call one first, and the other if it’s refused. Which goes first?',
  },
  {
    id: 'refusal',
    label: 'Refusing',
    about: 'You’re a refusal: accept the call, or refuse it.',
  },
  {
    id: 'roll',
    label: 'Rolling',
    about:
      'Off the bottom: what to keep, take the tie, put out dice, and Boss: your secret roll, coming up, your last roll.',
  },
]

export interface TrainerOption {
  id: string
  label: string
  /** The actions this option takes, to play it out (not for refusals) */
  actions?: Action[]
  /** Call order: the call you make second if both refusals turn the first down */
  then?: Call
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
  measure: Measure
}

/**
 * The Boss's own choices (the secret roll, then come up or pick 'em up)
 * weigh pencils both ways: picking 'em up never costs you a pencil, but
 * coming up hands one to someone else. They're scored in net pencils
 * (someone else's chance of the pencil minus yours) instead.
 */
export const isBossChoice = (state: GameState): boolean =>
  state.phase.kind === 'boss' &&
  state.phase.boss === YOU &&
  state.phase.stage !== 'comeUp'

/** How a situation is scored: your chance of the pencil (lower is better), or net pencils (higher is better) */
export type Measure = 'pencil' | 'net'

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
    // hint-stats labels each call "Call <name>"
    const order = (label: string) => {
      if (label === 'Bark') return ALL_CALLS.length + 1
      const i = ALL_CALLS.findIndex((c) => label === `Call ${names.call(c)}`)
      return i < 0 ? ALL_CALLS.length : i
    }
    const opts: TrainerOption[] = (stats.choices || [])
      .map((c) => ({ id: c.label, label: c.label, actions: c.actions }))
      .sort((a, b) => order(a.label) - order(b.label))
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

/**
 * Call order: your roll's two best games (by the 3-player call odds), when
 * both are worth calling: the best call, and the best call of another game
 * (a second call must be a different game). Both must be strong: you take
 * the pencil at most `ORDER_MAX` of the time at 3 players (an even share
 * is 33%). Null otherwise, or when the bots' own first call is neither.
 */
export const ORDER_MAX = 0.1

export function orderPair(
  dice: Dice,
  rules?: Partial<HouseRules>
): [Call, Call] | null {
  const keep = { montereyLoneKeep: Boolean(rules?.montereyLoneKeep) }
  const ranked = ALL_CALLS.map((call) => ({
    call,
    loss: callLoss(dice, call, keep),
  })).sort((a, b) => a.loss - b.loss)
  const a = ranked[0]
  const b = ranked.find((o) => o.call.game !== a.call.game)!
  if (b.loss > ORDER_MAX) return null
  const first = chooseCall(dice, undefined, keep)
  if (first.game !== a.call.game && first.game !== b.call.game) return null
  return [a.call, b.call]
}

const sameCall = (x: Call, y: Call) =>
  x.game === y.game && x.variant === y.variant

/** The two orders, in the site's game order (so the order says nothing about which is best) */
function orderOptions(pair: [Call, Call], names: HintNames): TrainerOption[] {
  const at = (c: Call) => ALL_CALLS.findIndex((x) => sameCall(x, c))
  const [x, y] = [...pair].sort((p, q) => at(p) - at(q))
  return [
    [x, y],
    [y, x],
  ].map(([first, second]) => {
    const label = `Call ${names.call(first)} first, then ${names.call(second)}`
    return {
      id: label,
      label,
      actions: [{ type: 'call', player: YOU, call: first }],
      then: second,
    }
  })
}

/** Which option the solid player's action is */
function solidId(stats: HintStats, kind: Kind, solid: Action): string | null {
  if (kind === 'refusal') return solid.type === 'accept' ? 'accept' : 'refuse'
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
    // Call order: 2–4 players, where the order changes your chance by more than a fraction of a point
    const bots =
      focus === 'order' ? 1 + Math.floor(r() * 3) : 2 + Math.floor(r() * 4)
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
      // Call order: you hold the Hammer with two games worth calling
      const pair =
        focus === 'order' && kind === 'call' && state.phase.kind === 'call'
          ? orderPair(state.dice[YOU], rules)
          : null
      if (pair && r() < 0.6) {
        const names = namesOf(state)
        const options = orderOptions(pair, names)
        const first = chooseCall(state.dice[YOU], undefined, {
          montereyLoneKeep: Boolean(rules.montereyLoneKeep),
        })
        const solid = options.find(
          (o) => (o.actions![0] as { call: Call }).call.game === first.game
        )!
        return {
          seed,
          kind: 'order',
          state,
          options,
          solid: solid.id,
          stats: {
            kind: 'loss',
            measure: 'Chance you take the pencil',
            rows: [],
            why: `Each order is played out at this ${tableSize(state)}-player table: you call the first game, the refusals decide from their own dice, and if it’s refused you call the second. Solid bots play the rest of the round.`,
          },
          measure: 'pencil',
        }
      }
      if (
        kind &&
        focus !== 'order' &&
        (focus === 'all' || focus === kind) &&
        r() < stopAt
      ) {
        const solid = botActionFor(state, YOU)
        const names = namesOf(state)
        const stats = hintStats(state, YOU, solid, names)
        const options = stats && optionsFor(stats, state, names)
        const id = stats && options && solidId(stats, kind, solid)
        if (stats && options && id && options.some((o) => o.id === id)) {
          return {
            seed,
            kind,
            state,
            options,
            solid: id,
            stats,
            measure: isBossChoice(state) ? 'net' : 'pencil',
          }
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
 * Grade a pick: `values` maps option id → chance of the pencil (for net
 * pencils, pass minus the net, so lower is still better). Totals
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
  if (s.kind === 'order') {
    const [a, b] = s.options.map((o) => o.then!)
    return {
      heading: 'You hold the Hammer: which game first?',
      detail: `${players} players. Your roll plays ${names.call(b)} and ${names.call(a)}. Call one, and if ${players === 2 ? 'it’s refused' : 'both refusals turn it down'}, call the other.`,
    }
  }
  if (phase.kind === 'call')
    return {
      heading: 'You hold the Hammer',
      detail: `${players} players. Call a game, or bark?`,
    }
  if (phase.kind === 'secondCall')
    return {
      heading: 'Your call was refused',
      detail:
        (players === 2
          ? `${names.player(refusalSeats(state).first)} refused ${names.call(phase.refused)}.`
          : `Both refusals turned down ${names.call(phase.refused)}.`) +
        ' Make a second call: a different game, and nobody can refuse it.',
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
    const kept = (id: string) => phase.rolling[id]?.kept ?? []
    const { game, variant } = phase.call
    const missed = (id: string) =>
      isKickerGame(game) &&
      !!variant &&
      !evaluateKickerHand(state.dice[id], game, variant, kept(id)).made
    const tied = bottomHands(state).filter((id) => id !== YOU)
    // Their hand, and how many rolls they have to answer with once you climb off
    const left = (id: string) => {
      const n = 3 - phase.rolling[id].rollsUsed
      return n > 0 ? `${plural(n, 'roll', 'rolls')} left` : 'all day'
    }
    const targetHand = target
      ? `${names.hand(state.dice[target], kept(target))}, ${left(target)}`
      : ''
    const need = !target
      ? ''
      : missed(YOU) && missed(target)
        ? ` ${names.player(target)} missed it too (${targetHand}): make the game and you’re safe.`
        : tied.length && bottomHands(state).includes(YOU)
          ? ` You’re tied at the bottom with ${tied.map(names.player).join(' and ')} (${targetHand}): take the tie, or roll to climb off it.`
          : ` To climb off the bottom, beat ${names.player(target)} (${targetHand}).`
    return {
      heading: `${names.call(phase.call)}: you’re at the bottom`,
      detail: `You have ${names.hand(dice, kept(YOU))}, with ${plural(rolls, 'roll', 'rolls')} left.${need}`,
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
            ? `You have ${names.hand(dice)}. Roll once more in secret, keeping dice that still beat the table; then you decide whether everyone comes up.`
            : `After your secret roll you have ${names.hand(dice)}. Come up (everyone gets one last roll, the worst hand loses), or pick ’em up (no loser)?`,
      }
    return {
      heading: `${names.player(phase.boss)} came up`,
      detail: `Your last roll. You have ${names.hand(dice)}; the worst hand at the table takes the pencil.`,
    }
  }
  return { heading: '', detail: '' }
}

/** How a call-order option's rounds went: accepted (everyone played the first call) or refused (you made the second) */
export interface OrderPaths {
  accepted: { share: number; pencil: number }
  refused: { share: number; pencil: number }
}

const pctText = (p: number) => `${Math.round(p * 100)}%`

/**
 * Call order: the questions the result raises, answered from this
 * situation's own playouts (`paths` by option id).
 */
export function orderQuestions(
  s: Situation,
  paths: Record<string, OrderPaths>,
  names: HintNames
): { q: string; a: string }[] {
  const first = (o: TrainerOption) => (o.actions![0] as { call: Call }).call
  const [x, y] = s.options
  const px = paths[x.id]
  const py = paths[y.id]
  if (!px || !py) return []
  const two = tableSize(s.state) === 2
  return [
    {
      q: 'Why not save my best game for the second call, where nobody can refuse it?',
      a:
        `A refuser only accepts a game they’re good at, so your first call is played against a strong hand whenever it’s played. ` +
        `Called first and accepted, ${names.call(first(x))} costs you ${pctText(px.accepted.pencil)} and ${names.call(first(y))} costs you ${pctText(py.accepted.pencil)}. ` +
        `The game that holds up better against a strong hand belongs first.`,
    },
    {
      q: two ? 'And when it’s refused?' : 'And when both refuse?',
      a:
        `${two ? 'The refuser' : 'Both refusers'} just turned the first game down, so their dice are weak for it, and often for similar games. ` +
        `After ${names.call(first(x))} is refused, ${names.call(x.then!)} costs you ${pctText(px.refused.pencil)}; ` +
        `after ${names.call(first(y))} is refused, ${names.call(y.then!)} costs you ${pctText(py.refused.pencil)}.`,
    },
    {
      q: 'How often is the first call refused?',
      a: `${names.call(first(x))}: ${pctText(px.refused.share)} of rounds. ${names.call(first(y))}: ${pctText(py.refused.share)}. The refusals decide from their own dice, so it depends on the game, not your roll.`,
    },
    {
      q: 'What about calling a game I’m weak at, so it gets refused?',
      a: 'That’s a decoy: it pays only when it’s refused, and costs you when it’s accepted. The Calling practice includes the call that does best against the bots, decoys included.',
    },
  ]
}

/**
 * A refusal: the questions its result raises, answered from this
 * situation's own playouts (`estimate`, from simulateRefusal). `callOdds`:
 * your chance of the pencil if everyone played the call with nobody's dice
 * known (the 3-player call odds), shown only at a 3-player table.
 */
export function refusalQuestions(
  estimate: RefusalEstimate,
  info: { call: Call; position: 1 | 2; players: number; callOdds?: number },
  names: HintNames
): { q: string; a: string }[] {
  const { call, players, callOdds } = info
  const name = names.call(call)
  const next = estimate.refusePaths.find((p) => p.path === 'nextAccepts')
  const second = estimate.refusePaths.find((p) => p.path === 'secondCall')
  const top = estimate.secondCalls.slice(0, 3)
  const out: { q: string; a: string }[] = [
    {
      q: `The Hammer called ${name}, so they probably have it. Isn’t accepting worse?`,
      a:
        `Yes, and that’s counted: in these rounds the Hammer holds a roll they’d call ${name} with. ` +
        (callOdds != null && players === 3
          ? `If nobody’s dice were known, you’d take the pencil ${pctText(callOdds)} playing ${name}; against a Hammer who has it, ${pctText(estimate.accept.pencil)}.`
          : `Accepting, you take the pencil ${pctText(estimate.accept.pencil)}.`),
    },
  ]
  if (next)
    out.push({
      q: 'What if the 2nd refusal accepts it?',
      a: `They only accept ${name} when their own dice are good for it, so you’d play it against two players who like it: you take the pencil ${pctText(next.pencil)}. That happens in ${pctText(next.share)} of rounds when you refuse, and you can’t see their dice before you decide.`,
    })
  if (second && top.length)
    out.push({
      q: 'If I refuse, won’t the second call suit me better?',
      a:
        `Sometimes, but the Hammer picks it for their own roll, so it’s usually a game they’re strong in too. Most often here: ` +
        top
          .map(
            (c) =>
              `${names.call(c.call)} (${pctText(c.share)} of second calls; you take the pencil ${pctText(c.pencil)})`
          )
          .join(', ') +
        `. Across every second call, you take the pencil ${pctText(second.pencil)}.`,
    })
  out.push({
    q: 'So which is it?',
    a:
      (next && second
        ? `Refusing: ${pctText(next.share)} × ${pctText(next.pencil)} (the 2nd refusal accepts) + ${pctText(second.share)} × ${pctText(second.pencil)} (the second call) = ${pctText(estimate.refuse.pencil)}. `
        : `Refusing: ${pctText(estimate.refuse.pencil)}. `) +
      `Accepting: ${pctText(estimate.accept.pencil)}. ` +
      `An even share at ${players} players is ${pctText(1 / players)}.`,
  })
  return out
}

/*
 * Situation codes: a short code for each situation (its practice, seed and
 * house rule), shown on the page and read back from a link (?s=CODE), so a
 * situation can be found again from a screenshot. Crockford base 32: no I,
 * L, O or U, so it reads back without mix-ups.
 */
const CODE_DIGITS = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'
const FOCUS_LETTER: Record<Focus, string> = {
  all: 'E',
  call: 'C',
  order: 'O',
  refusal: 'R',
  roll: 'P',
}

/** e.g. "R-1F4K9QZ" (Refusing, seed in base 32), with "-M" when the lone 3 or 4 Monterey rule is on */
export function situationCode(
  seed: number,
  focus: Focus,
  loneKeep = false
): string {
  let n = seed >>> 0
  let digits = ''
  do {
    digits = CODE_DIGITS[n % 32] + digits
    n = Math.floor(n / 32)
  } while (n > 0)
  return `${FOCUS_LETTER[focus]}-${digits}${loneKeep ? '-M' : ''}`
}

/** A situation code back to its practice, seed and house rule; null if it isn't one */
export function parseSituationCode(
  code: string
): { seed: number; focus: Focus; loneKeep: boolean } | null {
  const m = code
    .trim()
    .toUpperCase()
    .match(/^([A-Z])-([0-9A-Z]{1,7})(-M)?$/)
  if (!m) return null
  const focus = (Object.keys(FOCUS_LETTER) as Focus[]).find(
    (f) => FOCUS_LETTER[f] === m[1]
  )
  if (!focus) return null
  let seed = 0
  // Read I and L as 1, O as 0 (Crockford), in case they were typed from a screenshot
  for (const ch of m[2].replace(/[IL]/g, '1').replace(/O/g, '0')) {
    const d = CODE_DIGITS.indexOf(ch)
    if (d < 0) return null
    seed = seed * 32 + d
  }
  if (seed >= 2 ** 31) return null
  return { seed, focus, loneKeep: Boolean(m[3]) }
}
