import { DiceSource, rollDice } from '../dice-source'
import { isKickerGame } from '../rules/kicker-games'
import { resolveKickerCycle } from '../rules/resolve'
import {
  Call,
  DEFAULT_HOUSE_RULES,
  Dice,
  EngineError,
  HouseRules,
  PlayerId,
} from '../types'

/**
 * A full game of Refusal Dice as a pure state machine (docs/RULES.md):
 *   createGame(options) → state;  applyAction(state, action) → state
 *
 * State is plain data (including the dice source), so games can be saved,
 * replayed, sent over the network and run identically on a server.
 *
 * Only kicker games can be played so far; Tres Away, Boss and Razzle have
 * their own procedures (§3.2–3.4) and come next.
 */

export const MAX_ROLLS = 3

export interface Seat {
  id: PlayerId
  name: string
  pencils: number
  out: boolean
}

export interface PlayerRolls {
  /** Rolls used this cycle, including the first */
  rollsUsed: number
  /** Finished rolling (stood, or used every roll) */
  done: boolean
}

export type Phase =
  /** The Hammer calls a game or barks */
  | { kind: 'call' }
  /** 1st or 2nd refusal decides on the Hammer's call */
  | { kind: 'refusal'; seat: 1 | 2; call: Call }
  /** Both refused: the Hammer must call a different game */
  | { kind: 'secondCall'; refused: Call }
  /** Players in `rolling` are playing the call; cycle 0 is the main game, 1+ are replays */
  | { kind: 'play'; call: Call; cycle: number; rolling: Record<PlayerId, PlayerRolls> }
  /** Round finished; `loser` is null when no pencil was taken. `hammer` already holds the next Hammer. */
  | { kind: 'roundOver'; call: Call; loser: PlayerId | null }
  | { kind: 'gameOver'; winner: PlayerId }

export type GameEvent =
  | { type: 'hammer'; player: PlayerId }
  | { type: 'called'; player: PlayerId; call: Call; second: boolean }
  | { type: 'barked'; player: PlayerId }
  | { type: 'accepted'; player: PlayerId }
  | { type: 'refused'; player: PlayerId }
  | { type: 'rolled'; player: PlayerId; dice: Dice; kept: number[] }
  | { type: 'stood'; player: PlayerId }
  | { type: 'cycle'; players: PlayerId[]; reason: 'missed' | 'tie' }
  | { type: 'pencil'; player: PlayerId; pencils: number; out: boolean }
  | { type: 'noPencil'; reason: 'two-player-tie' | 'two-player-miss' }
  | { type: 'gameOver'; winner: PlayerId }

export interface GameState {
  rules: HouseRules
  /** Seat order; "left" is the next seat */
  seats: Seat[]
  hammer: PlayerId
  round: number
  /** Everyone's current dice */
  dice: Record<PlayerId, Dice>
  phase: Phase
  source: DiceSource
  log: GameEvent[]
}

export type Action =
  | { type: 'call'; player: PlayerId; call: Call }
  | { type: 'bark'; player: PlayerId }
  | { type: 'accept'; player: PlayerId }
  | { type: 'refuse'; player: PlayerId }
  /** Re-roll every die except the kept indices (0–4) */
  | { type: 'reroll'; player: PlayerId; keep: number[] }
  | { type: 'stand'; player: PlayerId }
  | { type: 'nextRound' }

export interface CreateGameOptions {
  players: { id: PlayerId; name: string }[]
  source: DiceSource
  rules?: Partial<HouseRules>
  /** Skip the piddle and give this player the Hammer */
  hammer?: PlayerId
}

/* ── Seats ── */

export const activeSeats = (state: GameState) => state.seats.filter((s) => !s.out)

/** The next active player to the left of `id` (skipping `id` itself) */
export function nextActive(state: GameState, id: PlayerId): PlayerId {
  const i = state.seats.findIndex((s) => s.id === id)
  for (let step = 1; step <= state.seats.length; step++) {
    const seat = state.seats[(i + step) % state.seats.length]
    if (!seat.out && seat.id !== id) return seat.id
  }
  throw new EngineError('No other active players')
}

/** 1st and 2nd refusal seats; 2nd is absent when only two players remain */
export function refusalSeats(state: GameState): { first: PlayerId; second?: PlayerId } {
  const first = nextActive(state, state.hammer)
  const second = nextActive(state, first)
  return second === state.hammer ? { first } : { first, second }
}

/* ── Setup ── */

function deal(state: GameState): GameState {
  let source = state.source
  const dice: Record<PlayerId, Dice> = { ...state.dice }
  activeSeats(state).forEach((seat) => {
    const [roll, next] = rollDice(source, 5)
    dice[seat.id] = roll
    source = next
  })
  return { ...state, dice, source, phase: { kind: 'call' } }
}

/** Everyone rolls one die; highest takes the Hammer; ties roll again. */
function piddle(ids: PlayerId[], source: DiceSource): [PlayerId, DiceSource] {
  let contenders = ids
  while (contenders.length > 1) {
    const rolls = contenders.map((id) => {
      const [[die], next] = rollDice(source, 1)
      source = next
      return { id, die }
    })
    const high = Math.max(...rolls.map((r) => r.die))
    contenders = rolls.filter((r) => r.die === high).map((r) => r.id)
  }
  return [contenders[0], source]
}

export function createGame(options: CreateGameOptions): GameState {
  const { players } = options
  if (players.length < 2 || players.length > 8) throw new EngineError('Refusal is played by 2–8 players')
  if (new Set(players.map((p) => p.id)).size !== players.length) throw new EngineError('Player ids must be unique')

  let source = options.source
  let hammer = options.hammer
  if (hammer === undefined) {
    ;[hammer, source] = piddle(
      players.map((p) => p.id),
      source
    )
  } else if (!players.some((p) => p.id === hammer)) {
    throw new EngineError(`Unknown hammer: ${hammer}`)
  }

  const state: GameState = {
    rules: { ...DEFAULT_HOUSE_RULES, ...options.rules },
    seats: players.map((p) => ({ id: p.id, name: p.name, pencils: 0, out: false })),
    hammer,
    round: 1,
    dice: {},
    phase: { kind: 'call' },
    source,
    log: [{ type: 'hammer', player: hammer }],
  }
  return deal(state)
}

/* ── Helpers ── */

const log = (state: GameState, ...events: GameEvent[]): GameState => ({
  ...state,
  log: [...state.log, ...events],
})

function assertActor(player: PlayerId, expected: PlayerId, what: string) {
  if (player !== expected) throw new EngineError(`It's not ${player}'s turn to ${what}`)
}

function validateCall(call: Call) {
  if (!isKickerGame(call.game)) {
    throw new EngineError(`${call.game} can't be played in the engine yet`)
  }
  if (call.variant !== 'high' && call.variant !== 'low') {
    throw new EngineError(`${call.game} needs a variant (high or low)`)
  }
}

function startPlay(state: GameState, call: Call): GameState {
  const rolling: Record<PlayerId, PlayerRolls> = {}
  activeSeats(state).forEach((s) => (rolling[s.id] = { rollsUsed: 1, done: false }))
  return { ...state, phase: { kind: 'play', call, cycle: 0, rolling } }
}

/** Players start a new cycle of the same call with fresh rolls. */
function startCycle(state: GameState, call: Call, cycle: number, players: PlayerId[], reason: 'missed' | 'tie'): GameState {
  let source = state.source
  const dice = { ...state.dice }
  const rolling: Record<PlayerId, PlayerRolls> = {}
  players.forEach((id) => {
    const [roll, next] = rollDice(source, 5)
    dice[id] = roll
    source = next
    rolling[id] = { rollsUsed: 1, done: false }
  })
  return log(
    { ...state, dice, source, phase: { kind: 'play', call, cycle: cycle + 1, rolling } },
    { type: 'cycle', players, reason }
  )
}

function scorePencil(state: GameState, call: Call, loser: PlayerId): GameState {
  const seats = state.seats.map((s) =>
    s.id === loser
      ? { ...s, pencils: s.pencils + 1, out: s.pencils + 1 >= state.rules.pencilsToLose }
      : s
  )
  const seat = seats.find((s) => s.id === loser)!
  let next = log({ ...state, seats }, { type: 'pencil', player: loser, pencils: seat.pencils, out: seat.out })

  const remaining = activeSeats(next)
  if (remaining.length === 1) {
    const winner = remaining[0].id
    return log({ ...next, hammer: winner, phase: { kind: 'gameOver', winner } }, { type: 'gameOver', winner })
  }
  // The loser takes the Hammer; if they're out, it passes to the next active player on their left
  const hammer = seat.out ? nextActive(next, loser) : loser
  return { ...next, hammer, phase: { kind: 'roundOver', call, loser } }
}

/** When everyone in the cycle is done rolling, decide what happens next. */
function maybeResolve(state: GameState): GameState {
  const { phase } = state
  if (phase.kind !== 'play') return state
  if (!Object.values(phase.rolling).every((r) => r.done)) return state

  const call = phase.call
  if (!isKickerGame(call.game) || !call.variant) throw new EngineError('Unsupported call in play')

  const hands: Record<PlayerId, Dice> = {}
  Object.keys(phase.rolling).forEach((id) => (hands[id] = state.dice[id]))
  const result = resolveKickerCycle(hands, call.game, call.variant)

  if (result.kind === 'loser') return scorePencil(state, call, result.loser)

  // With only two players left in the game, a tie or both missing: no pencil, the Hammer passes.
  if (activeSeats(state).length === 2) {
    return log(
      { ...state, hammer: nextActive(state, state.hammer), phase: { kind: 'roundOver', call, loser: null } },
      { type: 'noPencil', reason: result.kind === 'cycle' ? 'two-player-miss' : 'two-player-tie' }
    )
  }
  if (result.kind === 'cycle') return startCycle(state, call, phase.cycle, result.players, 'missed')
  return startCycle(state, call, phase.cycle, result.players, 'tie')
}

/* ── The reducer ── */

export function applyAction(state: GameState, action: Action): GameState {
  const { phase } = state

  switch (phase.kind) {
    case 'call': {
      if (action.type === 'call') {
        assertActor(action.player, state.hammer, 'call')
        validateCall(action.call)
        return log(
          { ...state, phase: { kind: 'refusal', seat: 1, call: action.call } },
          { type: 'called', player: action.player, call: action.call, second: false }
        )
      }
      if (action.type === 'bark') {
        assertActor(action.player, state.hammer, 'bark')
        if (!state.rules.barking) throw new EngineError('Barking is off in these house rules')
        const hammer = nextActive(state, state.hammer)
        return deal(log({ ...state, hammer, round: state.round + 1 }, { type: 'barked', player: action.player }))
      }
      break
    }

    case 'refusal': {
      const seats = refusalSeats(state)
      const deciding = phase.seat === 1 ? seats.first : seats.second!
      if (action.type === 'accept') {
        assertActor(action.player, deciding, 'accept')
        return startPlay(log(state, { type: 'accepted', player: action.player }), phase.call)
      }
      if (action.type === 'refuse') {
        assertActor(action.player, deciding, 'refuse')
        const next = log(state, { type: 'refused', player: action.player })
        if (phase.seat === 1 && seats.second) {
          return { ...next, phase: { kind: 'refusal', seat: 2, call: phase.call } }
        }
        return { ...next, phase: { kind: 'secondCall', refused: phase.call } }
      }
      break
    }

    case 'secondCall': {
      if (action.type === 'call') {
        assertActor(action.player, state.hammer, 'call')
        validateCall(action.call)
        if (action.call.game === phase.refused.game) {
          throw new EngineError('The second call must be a different game, not just the other variant')
        }
        return startPlay(
          log(state, { type: 'called', player: action.player, call: action.call, second: true }),
          action.call
        )
      }
      break
    }

    case 'play': {
      if (action.type === 'reroll' || action.type === 'stand') {
        const rolls = phase.rolling[action.player]
        if (!rolls) throw new EngineError(`${action.player} isn't playing this cycle`)
        if (rolls.done) throw new EngineError(`${action.player} is already done rolling`)

        if (action.type === 'stand') {
          return maybeResolve(
            log(
              { ...state, phase: { ...phase, rolling: { ...phase.rolling, [action.player]: { ...rolls, done: true } } } },
              { type: 'stood', player: action.player }
            )
          )
        }

        const keep = action.keep
        if (new Set(keep).size !== keep.length || keep.some((i) => !Number.isInteger(i) || i < 0 || i > 4)) {
          throw new EngineError('Keep must be distinct die positions 0–4')
        }
        const current = state.dice[action.player]
        const toRoll = current.map((_, i) => i).filter((i) => !keep.includes(i))
        const [fresh, source] = rollDice(state.source, toRoll.length)
        const dice = [...current]
        toRoll.forEach((i, j) => (dice[i] = fresh[j]))

        const rollsUsed = rolls.rollsUsed + 1
        const next: GameState = {
          ...state,
          source,
          dice: { ...state.dice, [action.player]: dice },
          phase: {
            ...phase,
            rolling: { ...phase.rolling, [action.player]: { rollsUsed, done: rollsUsed >= MAX_ROLLS } },
          },
        }
        return maybeResolve(log(next, { type: 'rolled', player: action.player, dice, kept: [...keep] }))
      }
      break
    }

    case 'roundOver': {
      if (action.type === 'nextRound') {
        return deal({ ...state, round: state.round + 1 })
      }
      break
    }

    case 'gameOver':
      throw new EngineError('The game is over')
  }

  throw new EngineError(`Can't ${action.type} during ${phase.kind}`)
}

/* ── Views ── */

export interface PlayerView {
  viewer: PlayerId
  seats: Seat[]
  hammer: PlayerId
  round: number
  phase: Phase
  /** Other players' dice are null while hidden (before play starts) */
  dice: Record<PlayerId, Dice | null>
  log: GameEvent[]
}

/**
 * What one player is allowed to see. The initial roll is hidden until play
 * starts (§2, §3.1). The dice source is never exposed, since it would reveal
 * future rolls.
 */
export function viewFor(state: GameState, viewer: PlayerId): PlayerView {
  const hidden = state.phase.kind === 'call' || state.phase.kind === 'refusal' || state.phase.kind === 'secondCall'
  const dice: Record<PlayerId, Dice | null> = {}
  Object.entries(state.dice).forEach(([id, d]) => (dice[id] = hidden && id !== viewer ? null : d))
  return {
    viewer,
    seats: state.seats,
    hammer: state.hammer,
    round: state.round,
    phase: state.phase,
    dice,
    log: state.log,
  }
}
