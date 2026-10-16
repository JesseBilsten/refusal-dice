import {
  Call,
  Dice,
  GameState,
  PlayerId,
  applyAction,
  createGame,
  rollDice,
  seeded,
} from '../engine'
import { ALL_CALLS, botAction, chooseCall, wouldAccept } from './bots'

/**
 * Seeded Monte Carlo through the real engine: deal the other players random
 * dice, make the decision, then let solid bots (see bots.ts) play the round
 * out. The result is the chance that *you* take the pencil this round.
 *
 * Every option is played from the same deals and dice (common random
 * numbers), so differences between options aren't sampling noise from
 * different deals.
 */

export interface Estimate {
  /** Chance you take the pencil this round */
  pencil: number
  /** Standard error of `pencil` */
  error: number
  samples: number
}

const ME: PlayerId = 'me'

const estimate = (losses: number, samples: number): Estimate => {
  const p = losses / samples
  return { pencil: p, error: Math.sqrt((p * (1 - p)) / samples), samples }
}

const sameCall = (a: Call, b: Call) =>
  a.game === b.game && a.variant === b.variant

/** Play the current round to its end with bots; returns the loser (null: no pencil) */
export function playOutRound(state: GameState): {
  loser: PlayerId | null
  state: GameState
} {
  let g = state
  for (
    let steps = 0;
    g.phase.kind !== 'roundOver' && g.phase.kind !== 'gameOver';
    steps++
  ) {
    if (steps > 5000) throw new Error('Round did not finish')
    g = applyAction(g, botAction(g))
  }
  return {
    loser: g.phase.kind === 'roundOver' ? g.phase.loser : null,
    state: g,
  }
}

/** Seat ids in order: the Hammer first, then to their left */
function seatIds(players: number, mySeat: number): PlayerId[] {
  return Array.from({ length: players }, (_, i) =>
    i === mySeat ? ME : `p${i}`
  )
}

/** A table with your dice fixed and everyone else's random */
function deal(
  players: number,
  mySeat: number,
  dice: Dice,
  seed: number
): GameState {
  const ids = seatIds(players, mySeat)
  const g = createGame({
    players: ids.map((id) => ({ id, name: id })),
    hammer: ids[0],
    source: seeded(seed),
    // Nobody is eliminated mid-simulation; only this round's pencil matters
    rules: { pencilsToLose: 1000 },
  })
  return { ...g, dice: { ...g.dice, [ME]: [...dice] } }
}

/** Mix the sample index into the seed */
const sampleSeed = (seed: number, i: number) =>
  (Math.imul(seed ^ 0x9e3779b9, 31) + Math.imul(i + 1, 0x85ebca6b)) | 0

/** Draw dice until `accept(dice)` holds (or give up and use the last draw) */
function conditionedDice(
  seed: number,
  accept: (d: Dice) => boolean,
  tries = 400
): Dice {
  let source = seeded(seed)
  let dice: Dice = [1, 1, 1, 1, 1]
  for (let t = 0; t < tries; t++) {
    ;[dice, source] = rollDice(source, 5)
    if (accept(dice)) return dice
  }
  return dice
}

export interface HammerOption extends Estimate {
  call: Call
}

/**
 * You're the Hammer holding `dice`: the chance of taking the pencil for
 * every call, best first.
 */
export function simulateHammer(options: {
  dice: Dice
  players?: number
  samples?: number
  seed?: number
}): HammerOption[] {
  const { dice, players = 3, samples = 400, seed = 1 } = options
  const losses = ALL_CALLS.map(() => 0)
  for (let i = 0; i < samples; i++) {
    const g = deal(players, 0, dice, sampleSeed(seed, i))
    ALL_CALLS.forEach((call, c) => {
      const { loser } = playOutRound(
        applyAction(g, { type: 'call', player: ME, call })
      )
      if (loser === ME) losses[c]++
    })
  }
  return ALL_CALLS.map((call, c) => ({
    call,
    ...estimate(losses[c], samples),
  })).sort((a, b) => a.pencil - b.pencil)
}

/**
 * You're the Hammer and bark: the Hammer passes left and everyone rolls
 * again, so you play the round from the seat on the new Hammer's right
 * (last to act) with fresh dice. Your dice don't matter, only the table size.
 * The bots never bark, so the new Hammer always calls.
 */
export function simulateBark(options: {
  players?: number
  samples?: number
  seed?: number
}): Estimate {
  const { players = 3, samples = 2000, seed = 1 } = options
  const ids = seatIds(players, players - 1)
  let losses = 0
  for (let i = 0; i < samples; i++) {
    const g = createGame({
      players: ids.map((id) => ({ id, name: id })),
      hammer: ids[0],
      source: seeded(sampleSeed(seed, i)),
      rules: { pencilsToLose: 1000 },
    })
    if (playOutRound(g).loser === ME) losses++
  }
  return estimate(losses, samples)
}

export interface RefusalEstimate {
  accept: Estimate
  refuse: Estimate
  /** When you refuse: how often each second call happened, and your chance of the pencil when it did */
  secondCalls: { call: Call; share: number; pencil: number }[]
  /**
   * When you refuse, what happened next: the next refuser accepted the call
   * (only as 1st refusal with 3+ players), or the Hammer made a second call.
   * `share` is out of all samples, so share × pencil over both adds up to
   * `refuse.pencil`.
   */
  refusePaths: {
    path: 'nextAccepts' | 'secondCall'
    share: number
    pencil: number
  }[]
  /** The Hammer's dice were drawn so that a bot Hammer would make this call */
  conditioned: boolean
}

/**
 * You're the 1st or 2nd refusal holding `dice`, and the Hammer called
 * `call`: the chance of taking the pencil if you accept vs. refuse.
 *
 * The Hammer's dice are drawn to fit the call (a bot Hammer would have made
 * it), and as 2nd refusal the 1st refusal's dice are drawn to fit their
 * refusal.
 */
export function simulateRefusal(options: {
  dice: Dice
  call: Call
  position: 1 | 2
  players?: number
  samples?: number
  seed?: number
}): RefusalEstimate {
  const { dice, call, position, samples = 600, seed = 1 } = options
  const players = Math.max(options.players ?? 3, position === 2 ? 3 : 2)
  let accepted = 0
  let refused = 0
  const paths = {
    nextAccepts: { count: 0, losses: 0 },
    secondCall: { count: 0, losses: 0 },
  }
  const second = new Map<
    string,
    { call: Call; count: number; losses: number }
  >()

  for (let i = 0; i < samples; i++) {
    const s = sampleSeed(seed, i)
    let g = deal(players, position, dice, s)
    const hammer = g.seats[0].id
    const hammerDice = conditionedDice(s ^ 0x51ed27, (d) =>
      sameCall(chooseCall(d), call)
    )
    g = { ...g, dice: { ...g.dice, [hammer]: hammerDice } }
    if (position === 2) {
      const first = g.seats[1].id
      g = {
        ...g,
        dice: {
          ...g.dice,
          [first]: conditionedDice(
            s ^ 0x2c1b3c6d,
            (d) => !wouldAccept(d, call)
          ),
        },
      }
    }
    g = applyAction(g, { type: 'call', player: hammer, call })
    if (position === 2)
      g = applyAction(g, { type: 'refuse', player: g.seats[1].id })

    if (
      playOutRound(applyAction(g, { type: 'accept', player: ME })).loser === ME
    )
      accepted++

    const out = playOutRound(applyAction(g, { type: 'refuse', player: ME }))
    const lost = out.loser === ME
    if (lost) refused++
    // You refused, so an acceptance in the log is the next refuser's
    const path =
      paths[
        out.state.log.some((e) => e.type === 'accepted')
          ? 'nextAccepts'
          : 'secondCall'
      ]
    path.count++
    if (lost) path.losses++
    const called = out.state.log.find((e) => e.type === 'called' && e.second)
    if (called && called.type === 'called') {
      const k = `${called.call.game}:${called.call.variant ?? ''}`
      const entry = second.get(k) ?? { call: called.call, count: 0, losses: 0 }
      entry.count++
      if (lost) entry.losses++
      second.set(k, entry)
    }
  }

  const secondTotal = [...second.values()].reduce((n, e) => n + e.count, 0)
  return {
    accept: estimate(accepted, samples),
    refuse: estimate(refused, samples),
    secondCalls: [...second.values()]
      .map((e) => ({
        call: e.call,
        share: e.count / Math.max(1, secondTotal),
        pencil: e.losses / e.count,
      }))
      .sort((a, b) => b.share - a.share),
    refusePaths: (['nextAccepts', 'secondCall'] as const)
      .filter((k) => paths[k].count > 0)
      .map((k) => ({
        path: k,
        share: paths[k].count / samples,
        pencil: paths[k].losses / paths[k].count,
      })),
    conditioned: true,
  }
}
