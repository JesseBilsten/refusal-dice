import { DiceSource, rollDice } from '../dice-source'
import { evaluateKickerHand, isKickerGame, keepProblem } from '../rules/kicker-games'
import { compareKickerHands, resolveKickerCycle } from '../rules/resolve'
import {
  bestHands,
  bossHand,
  bossKeepProblem,
  compareBoss,
  compareRazzle,
  compareTresAway,
  isSpecialtyGame,
  worstHands,
} from '../rules/specialty-games'
import {
  Call,
  DEFAULT_HOUSE_RULES,
  Dice,
  Die,
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
 * Kicker games and Razzle use the `play` phase (up to 3 rolls, played from
 * the bottom: the worst hand rolls first; in kicker games anyone who hasn't
 * made the game rolls on their own until they make it or run out). Tres Away (§3.2) and Boss (§3.3) have their own phases.
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
  /** Positions kept at the last roll. Kicker games: committed, so every later keep holds them (§3.1) */
  kept: number[]
}

/**
 * A Tres Away player's progress: which dice are out, and whether the hand
 * has been rolled since the last put-out. Dice in hand keep their values
 * between turns: on a later turn the player may put more of them out
 * without rolling, or roll them all.
 */
export interface TresHand {
  /** Indices (0–4) of dice put out, in order; final and visible */
  out: number[]
  /** The dice in hand were just rolled, so the player must put out at least one before rolling again */
  fresh: boolean
  /** Rolls used this cycle, including the first */
  rolls: number
}

export type BossStage =
  /** The Boss rolls once more (hidden), keeping a hand that still beats the table */
  | 'bossRoll'
  /** The Boss says "come up" or "don't come up" */
  | 'decide'
  /** The others take one last roll each, in order from the Boss's left */
  | 'comeUp'

export type Phase =
  /** The Hammer calls a game or barks */
  | { kind: 'call' }
  /** 1st or 2nd refusal decides on the Hammer's call */
  | { kind: 'refusal'; seat: 1 | 2; call: Call }
  /** Both refused: the Hammer must call a different game */
  | { kind: 'secondCall'; refused: Call }
  /** Kicker games and Razzle. Players in `rolling` are playing the call; cycle 0 is the main game, 1+ are replays */
  | { kind: 'play'; call: Call; cycle: number; rolling: Record<PlayerId, PlayerRolls> }
  /** Tres Away: `pacer` sets the pace; `turn` is who acts; `order` starts at the pacer and goes left */
  | {
      kind: 'tresAway'
      call: Call
      cycle: number
      pacer: PlayerId
      order: PlayerId[]
      hands: Record<PlayerId, TresHand>
      turn: PlayerId
    }
  /** Boss: `bossDice` are the dice that made the Boss's hand; `hidden` the dice the Boss re-rolled in secret; `waiting` who still gets a last roll */
  | {
      kind: 'boss'
      call: Call
      cycle: number
      players: PlayerId[]
      boss: PlayerId
      stage: BossStage
      bossDice: number[]
      hidden: number[]
      waiting: PlayerId[]
    }
  /** Round finished; `loser` is null when no pencil was taken. `hammer` already holds the next Hammer. */
  | { kind: 'roundOver'; call: Call; loser: PlayerId | null }
  | { kind: 'gameOver'; winner: PlayerId }

/** One die each in the piddle; a later round is a roll-off between the players tied for the highest */
export type PiddleRound = { player: PlayerId; die: Die }[]

export type GameEvent =
  /** Everyone rolled one die for the Hammer; ties for the highest rolled again */
  | { type: 'piddle'; rounds: PiddleRound[] }
  | { type: 'hammer'; player: PlayerId }
  | { type: 'called'; player: PlayerId; call: Call; second: boolean }
  | { type: 'barked'; player: PlayerId }
  | { type: 'accepted'; player: PlayerId }
  | { type: 'refused'; player: PlayerId }
  /** `hidden`: only the roller may see these dice (Tres Away hands, the Boss's secret roll) */
  | { type: 'rolled'; player: PlayerId; dice: Dice; kept: number[]; hidden?: boolean }
  | { type: 'putOut'; player: PlayerId; dice: Die[] }
  | { type: 'boss'; player: PlayerId }
  | { type: 'noBoss'; players: PlayerId[] }
  | { type: 'comeUp'; player: PlayerId }
  | { type: 'dontComeUp'; player: PlayerId }
  | { type: 'revealed'; player: PlayerId; dice: Dice }
  | { type: 'stood'; player: PlayerId }
  /**
   * Kicker games: the player showed the wrong dice for their game (or said
   * they missed it when they hadn't), so they picked them all up. With a
   * roll left they roll all five (a `rolled` event follows); without one,
   * `dead`: the hand counts as missing the game.
   */
  | { type: 'misread'; player: PlayerId; dead: boolean }
  | { type: 'cycle'; players: PlayerId[]; reason: 'missed' | 'tie' }
  | { type: 'pencil'; player: PlayerId; pencils: number; out: boolean }
  | { type: 'noPencil'; reason: 'two-player-tie' | 'two-player-miss' | 'no-boss' | 'boss-stayed-down' }
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
  /** Re-roll every die except the kept indices (0–4). Kicker games, Razzle, Boss */
  | { type: 'reroll'; player: PlayerId; keep: number[] }
  | { type: 'stand'; player: PlayerId }
  /** Tres Away: roll every die still in hand */
  | { type: 'roll'; player: PlayerId }
  /** Tres Away: put out these die positions (0–4) from the dice in hand */
  | { type: 'putOut'; player: PlayerId; dice: number[] }
  /** Boss: everyone else gets one last roll */
  | { type: 'comeUp'; player: PlayerId }
  /** Boss: no loser this round ("pick 'em up") */
  | { type: 'dontComeUp'; player: PlayerId }
  /** Kicker games: a misread hand is picked up and rolled whole (see the `misread` event) */
  | { type: 'misread'; player: PlayerId }
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

/** `ids` in seat order, starting at `from` (or the first of them to its left) */
export function seatOrderFrom(state: GameState, from: PlayerId, ids: PlayerId[]): PlayerId[] {
  const start = state.seats.findIndex((s) => s.id === from)
  const n = state.seats.length
  const out: PlayerId[] = []
  for (let step = 0; step < n; step++) {
    const id = state.seats[(start + step) % n].id
    if (ids.includes(id)) out.push(id)
  }
  return out
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
function piddle(ids: PlayerId[], source: DiceSource): [PlayerId, DiceSource, PiddleRound[]] {
  let contenders = ids
  const rounds: PiddleRound[] = []
  while (contenders.length > 1) {
    const rolls = contenders.map((player) => {
      const [[die], next] = rollDice(source, 1)
      source = next
      return { player, die }
    })
    rounds.push(rolls)
    const high = Math.max(...rolls.map((r) => r.die))
    contenders = rolls.filter((r) => r.die === high).map((r) => r.player)
  }
  return [contenders[0], source, rounds]
}

export function createGame(options: CreateGameOptions): GameState {
  const { players } = options
  if (players.length < 2 || players.length > 8) throw new EngineError('Refusal is played by 2–8 players')
  if (new Set(players.map((p) => p.id)).size !== players.length) throw new EngineError('Player ids must be unique')

  let source = options.source
  let hammer = options.hammer
  let rounds: PiddleRound[] | null = null
  if (hammer === undefined) {
    ;[hammer, source, rounds] = piddle(
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
    log: [...(rounds ? [{ type: 'piddle' as const, rounds }] : []), { type: 'hammer', player: hammer }],
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
  if (isSpecialtyGame(call.game)) {
    if (call.variant !== undefined) throw new EngineError(`${call.game} has no high/low variant`)
    return
  }
  if (!isKickerGame(call.game)) throw new EngineError(`Unknown game: ${call.game}`)
  if (call.variant !== 'high' && call.variant !== 'low') {
    throw new EngineError(`${call.game} needs a variant (high or low)`)
  }
}

const validIndices = (indices: number[]) =>
  new Set(indices).size === indices.length && indices.every((i) => Number.isInteger(i) && i >= 0 && i <= 4)

/** Roll the given die positions of a player's dice; the rest stay. */
function rollPositions(state: GameState, player: PlayerId, positions: number[]): GameState {
  const [fresh, source] = rollDice(state.source, positions.length)
  const dice = [...state.dice[player]]
  positions.forEach((i, j) => (dice[i] = fresh[j]))
  return { ...state, source, dice: { ...state.dice, [player]: dice } }
}

/** Enter the called game's play phase for `players`, who already hold their roll 1. */
function enterPlay(state: GameState, call: Call, cycle: number, players: PlayerId[]): GameState {
  if (call.game === 'tres-away') {
    // The caller sets the pace. A replay goes one die at a time (tresAwayMaxPutOut, ruled
    // 2026-10-30), starting with the tied player nearest the caller [inferred]
    const pacer = seatOrderFrom(state, state.hammer, players)[0]
    const hands: Record<PlayerId, TresHand> = {}
    players.forEach((id) => (hands[id] = { out: [], fresh: true, rolls: 1 }))
    const order = seatOrderFrom(state, pacer, players)
    return { ...state, phase: { kind: 'tresAway', call, cycle, pacer, order, hands, turn: pacer } }
  }

  if (call.game === 'boss') {
    const best = bestHands(players, (id) => state.dice[id], compareBoss)
    if (best.length > 1) {
      // A tie for the best hand: no Boss, nobody loses and the Hammer passes left,
      // in a replay too (ruled 2026-10-29)
      return noPencil(log(state, { type: 'noBoss', players: best }), call, 'no-boss')
    }
    const boss = best[0]
    return log(
      {
        ...state,
        phase: {
          kind: 'boss',
          call,
          cycle,
          players,
          boss,
          stage: 'bossRoll',
          bossDice: bossHand(state.dice[boss]).handDice,
          hidden: [],
          waiting: [],
        },
      },
      { type: 'boss', player: boss }
    )
  }

  const rolling: Record<PlayerId, PlayerRolls> = {}
  players.forEach((id) => (rolling[id] = { rollsUsed: 1, done: false, kept: [] }))
  return { ...state, phase: { kind: 'play', call, cycle, rolling } }
}

const startPlay = (state: GameState, call: Call): GameState =>
  enterPlay(
    state,
    call,
    0,
    activeSeats(state).map((s) => s.id)
  )

/** Players start a new cycle of the same call with fresh rolls. */
function startCycle(state: GameState, call: Call, cycle: number, players: PlayerId[], reason: 'missed' | 'tie'): GameState {
  let source = state.source
  const dice = { ...state.dice }
  players.forEach((id) => {
    const [roll, next] = rollDice(source, 5)
    dice[id] = roll
    source = next
  })
  return enterPlay(log({ ...state, dice, source }, { type: 'cycle', players, reason }), call, cycle + 1, players)
}

/** The round ends without a pencil; the Hammer passes left. */
function noPencil(
  state: GameState,
  call: Call,
  reason: 'two-player-tie' | 'two-player-miss' | 'no-boss' | 'boss-stayed-down'
): GameState {
  return log(
    { ...state, hammer: nextActive(state, state.hammer), phase: { kind: 'roundOver', call, loser: null } },
    { type: 'noPencil', reason }
  )
}

/** Worst hand loses; tied worst hands replay, except with two players left (§4). */
function settleWorst(state: GameState, call: Call, cycle: number, worst: PlayerId[]): GameState {
  if (worst.length === 1) return scorePencil(state, call, worst[0])
  if (activeSeats(state).length === 2) return noPencil(state, call, 'two-player-tie')
  return startCycle(state, call, cycle, worst, 'tie')
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

/**
 * How the play phase ranks hands (negative when `a` is worse): Razzle
 * scores, or the kicker game's hands, holding the positions each player
 * kept at their last roll (`keptA`, `keptB`; see keptAt).
 */
export function playCompare(call: Call): (a: Dice, b: Dice, keptA?: number[], keptB?: number[]) => number {
  if (call.game === 'razzle') return compareRazzle
  if (!isKickerGame(call.game) || !call.variant) throw new EngineError('Unsupported call in play')
  const { game, variant } = call
  return (a, b, keptA, keptB) => compareKickerHands(a, b, game, variant, keptA, keptB)
}

/**
 * The positions `player` kept at their last roll of this cycle: in a
 * kicker game they're committed, part of the game (§3.1). Read from the
 * play phase, or after the round from the log.
 */
export function keptAt(state: GameState, player: PlayerId): number[] {
  const { phase } = state
  if (phase.kind === 'play') return phase.rolling[player]?.kept ?? []
  for (let i = state.log.length - 1; i >= 0; i--) {
    const e = state.log[i]
    if (e.type === 'called' || (e.type === 'cycle' && e.players.includes(player))) return []
    if (e.type === 'misread' && e.player === player && e.dead) return DEAD_HAND
    if (e.type === 'rolled' && e.player === player && !e.hidden) return e.kept
  }
  return []
}

const playWorst = (state: GameState, ids: PlayerId[]): PlayerId[] => {
  const { phase } = state
  if (phase.kind !== 'play') return []
  const cmp = playCompare(phase.call)
  return seatOrderFrom(
    state,
    state.hammer,
    worstHands(ids, (id) => id, (a, b) => cmp(state.dice[a], state.dice[b], keptAt(state, a), keptAt(state, b)))
  )
}

/**
 * Kicker games and Razzle are played from the bottom (§4): whoever holds the
 * worst hand is the loser at that moment, so they roll, and keep rolling
 * until they climb off the bottom or run out of rolls. Then the new worst
 * hand rolls. If the worst hand never improves, nobody else has to roll.
 *
 * Returns who must roll now, or null when the cycle is settled: the worst
 * hand is out of rolls. With a tie at the bottom, whoever has the most
 * rolls left goes first, until the tied players have used as many rolls as
 * each other; then the tied player nearest the Hammer goes [confirmed].
 * Each tied player in turn takes the tie (stands) or rolls; a tie taken is
 * only an offer until every tied player takes it (ruled 2026-10-29, see
 * reopenTie).
 */
export function bottomTurn(state: GameState): PlayerId | null {
  const { phase } = state
  if (phase.kind !== 'play') return null
  const able = playWorst(state, Object.keys(phase.rolling)).filter((id) => !phase.rolling[id].done)
  if (!able.length) return null
  const fewest = Math.min(...able.map((id) => phase.rolling[id].rollsUsed))
  return able.find((id) => phase.rolling[id].rollsUsed === fewest)!
}

/** Who holds the worst hand right now (several when tied), nearest the Hammer first */
export function bottomHands(state: GameState): PlayerId[] {
  const { phase } = state
  return phase.kind === 'play' ? playWorst(state, Object.keys(phase.rolling)) : []
}

/**
 * A dead hand (misread with no roll left) is committed to all five dice.
 * No game is made with all five, so it counts as missing the game.
 */
const DEAD_HAND = [0, 1, 2, 3, 4]

/** Kicker games: who hasn't made the game and can still roll */
function missersRolling(state: GameState): PlayerId[] {
  const { phase } = state
  if (phase.kind !== 'play' || !isKickerGame(phase.call.game) || !phase.call.variant) return []
  const { game, variant } = phase.call
  return seatOrderFrom(
    state,
    state.hammer,
    Object.keys(phase.rolling).filter(
      (id) => !phase.rolling[id].done && !evaluateKickerHand(state.dice[id], game, variant, phase.rolling[id].kept).made
    )
  )
}

/**
 * Who may roll now, nearest the Hammer first. In a kicker game, everyone
 * who hasn't made the game rolls on their own, at the same time, until
 * they make it or run out of rolls (ruled 2026-10-21); a miss is the worst
 * hand, so nobody who made the game rolls meanwhile. Then, and in Razzle,
 * the worst hand rolls (bottomTurn).
 */
export function rollers(state: GameState): PlayerId[] {
  const missing = missersRolling(state)
  if (missing.length) return missing
  const turn = bottomTurn(state)
  return turn ? [turn] : []
}

/** Whose hand `player` must beat to get off the bottom: the worst of the others */
export function bottomTarget(state: GameState, player: PlayerId): PlayerId | null {
  const { phase } = state
  if (phase.kind !== 'play') return null
  return playWorst(state, Object.keys(phase.rolling).filter((id) => id !== player))[0] ?? null
}

/**
 * Must `player` keep rolling? Yes when they hold the worst hand alone (§4:
 * no standing at the bottom). Tied at the bottom, they may take the tie even
 * while another tied player can still roll (ruled 2026-10-29). Not on a
 * missed game, though: a miss rolls on while another miss can still roll.
 */
export function wouldLoseIfStopped(state: GameState, player: PlayerId): boolean {
  const { phase } = state
  if (phase.kind !== 'play' || !phase.rolling[player]) return false
  const worst = playWorst(state, Object.keys(phase.rolling))
  if (!worst.includes(player)) return false
  if (worst.length === 1) return true
  const { game, variant } = phase.call
  const missed =
    isKickerGame(game) && !!variant && !evaluateKickerHand(state.dice[player], game, variant, phase.rolling[player].kept).made
  return missed && worst.some((id) => id !== player && !phase.rolling[id].done)
}

/**
 * Taking a tie is an offer (ruled 2026-10-29): it holds only while every
 * tied player takes it. When another tied player rolls instead and climbs
 * off the bottom, a player who took the tie and is now the worst hand alone
 * rolls again with the rolls they have left. (With several left tied who
 * all took it, they replay.)
 */
function reopenTie(state: GameState): GameState {
  const { phase } = state
  if (phase.kind !== 'play') return state
  const worst = playWorst(state, Object.keys(phase.rolling))
  if (worst.length !== 1) return state
  const rolls = phase.rolling[worst[0]]
  if (!rolls.done || rolls.rollsUsed >= MAX_ROLLS) return state
  return { ...state, phase: { ...phase, rolling: { ...phase.rolling, [worst[0]]: { ...rolls, done: false } } } }
}

/** When everyone in the cycle is done rolling, decide what happens next. */
function maybeResolve(before: GameState): GameState {
  const state = reopenTie(before)
  const { phase } = state
  if (phase.kind !== 'play') return state

  if (bottomTurn(state)) return state

  const call = phase.call
  const players = Object.keys(phase.rolling)
  if (call.game === 'razzle') {
    return settleWorst(state, call, phase.cycle, worstHands(players, (id) => state.dice[id], compareRazzle))
  }
  if (!isKickerGame(call.game) || !call.variant) throw new EngineError('Unsupported call in play')

  const hands: Record<PlayerId, Dice> = {}
  const kept: Record<PlayerId, number[]> = {}
  players.forEach((id) => {
    hands[id] = state.dice[id]
    kept[id] = phase.rolling[id].kept
  })
  const result = resolveKickerCycle(hands, call.game, call.variant, kept)

  if (result.kind === 'loser') return scorePencil(state, call, result.loser)
  if (result.kind === 'tie') return settleWorst(state, call, phase.cycle, result.players)
  // Two or more missed. With only two players left in the game: no pencil, the Hammer passes.
  if (activeSeats(state).length === 2) return noPencil(state, call, 'two-player-miss')
  return startCycle(state, call, phase.cycle, result.players, 'missed')
}

/* ── Tres Away (§3.2) ── */

/**
 * Whose turn it is: anyone behind the pacer's count catches up, in order
 * from the pacer's left; then the pacer goes again. Null when all dice are out.
 */
function tresTurn(order: PlayerId[], hands: Record<PlayerId, TresHand>): PlayerId | null {
  const [pacer, ...others] = order
  const target = hands[pacer].out.length
  const behind = others.find((id) => hands[id].out.length < target)
  if (behind) return behind
  return hands[pacer].out.length < 5 ? pacer : null
}

/**
 * The most dice `player` may put out now: the caller (pacer) any number from
 * hand; everyone else only up to the caller's count, never past it. In a
 * replay nobody sets the pace: one die at a time (ruled 2026-10-30).
 */
export function tresAwayMaxPutOut(phase: Extract<Phase, { kind: 'tresAway' }>, player: PlayerId): number {
  const out = phase.hands[player].out.length
  if (player !== phase.pacer) return Math.max(0, phase.hands[phase.pacer].out.length - out)
  return phase.cycle > 0 ? Math.min(1, 5 - out) : 5 - out
}

function tresAwayAction(state: GameState, action: Action): GameState {
  const phase = state.phase
  if (phase.kind !== 'tresAway') throw new EngineError('Not playing Tres Away')
  if (action.type !== 'roll' && action.type !== 'putOut') {
    throw new EngineError(`Can't ${action.type} in Tres Away`)
  }
  assertActor(action.player, phase.turn, action.type === 'roll' ? 'roll' : 'put out dice')
  const hand = phase.hands[action.player]
  const inHand = [0, 1, 2, 3, 4].filter((i) => !hand.out.includes(i))

  if (action.type === 'roll') {
    if (hand.fresh) throw new EngineError('Put out at least one die from this roll first')
    let next = rollPositions(state, action.player, inHand)
    next = log(next, { type: 'rolled', player: action.player, dice: next.dice[action.player], kept: hand.out, hidden: true })
    const rolled: TresHand = { ...hand, fresh: true, rolls: hand.rolls + 1 }
    next = { ...next, phase: { ...phase, hands: { ...phase.hands, [action.player]: rolled } } }
    // A last single die is put out as soon as it's rolled
    return inHand.length === 1 ? tresAwayAction(next, { type: 'putOut', player: action.player, dice: inHand }) : next
  }

  // Dice in hand may go out without rolling first: a player can wait to see the table, then put out
  if (!action.dice.length || !validIndices(action.dice) || action.dice.some((i) => !inHand.includes(i))) {
    throw new EngineError('Put out at least one die from your hand')
  }
  const most = tresAwayMaxPutOut(phase, action.player)
  if (action.dice.length > most) {
    throw new EngineError(
      phase.cycle > 0 && action.player === phase.pacer
        ? 'In a replay, dice go out one die at a time'
        : `Put out no more than ${most}: only the caller sets how many dice are out`
    )
  }
  const hands = { ...phase.hands, [action.player]: { ...hand, out: [...hand.out, ...action.dice], fresh: false } }
  const next = log(state, {
    type: 'putOut',
    player: action.player,
    dice: action.dice.map((i) => state.dice[action.player][i]),
  })
  const turn = tresTurn(phase.order, hands)
  if (turn) return { ...next, phase: { ...phase, hands, turn } }

  // Everyone's dice are out: the highest score loses
  const worst = worstHands(phase.order, (id) => state.dice[id], compareTresAway)
  return settleWorst({ ...next, phase: { ...phase, hands } }, phase.call, phase.cycle, worst)
}

/* ── Boss (§3.3) ── */

function bossAction(state: GameState, action: Action): GameState {
  const phase = state.phase
  if (phase.kind !== 'boss') throw new EngineError('Not playing Boss')

  if (phase.stage === 'bossRoll') {
    if (action.type !== 'reroll' && action.type !== 'stand') throw new EngineError('The Boss rolls once more first')
    assertActor(action.player, phase.boss, 'roll as Boss')
    if (action.type === 'stand') return { ...state, phase: { ...phase, stage: 'decide' } }
    if (!validIndices(action.keep)) throw new EngineError('Keep must be distinct die positions 0–4')
    const dice = state.dice[action.player]
    const others = phase.players.filter((id) => id !== phase.boss).map((id) => state.dice[id])
    const problem = bossKeepProblem(action.keep.map((i) => dice[i]), others)
    if (problem) throw new EngineError(problem)
    const positions = [0, 1, 2, 3, 4].filter((i) => !action.keep.includes(i))
    const next = rollPositions(state, action.player, positions)
    return log(
      { ...next, phase: { ...phase, stage: 'decide', hidden: positions } },
      { type: 'rolled', player: action.player, dice: next.dice[action.player], kept: [...action.keep], hidden: true }
    )
  }

  if (phase.stage === 'decide') {
    if (action.type !== 'comeUp' && action.type !== 'dontComeUp') {
      throw new EngineError('The Boss decides: come up or don’t come up')
    }
    assertActor(action.player, phase.boss, 'decide')
    if (action.type === 'dontComeUp') {
      return noPencil(log(state, { type: 'dontComeUp', player: action.player }), phase.call, 'boss-stayed-down')
    }
    const waiting = seatOrderFrom(state, phase.boss, phase.players).slice(1)
    return log({ ...state, phase: { ...phase, stage: 'comeUp', waiting } }, { type: 'comeUp', player: action.player })
  }

  // comeUp: one last roll each, in order from the Boss's left, shown as soon as it's rolled
  if (action.type !== 'reroll' && action.type !== 'stand') throw new EngineError('Take your last roll')
  const [current, ...waiting] = phase.waiting
  assertActor(action.player, current, 'take a last roll')
  let next = state
  if (action.type === 'reroll') {
    if (!validIndices(action.keep)) throw new EngineError('Keep must be distinct die positions 0–4')
    next = rollPositions(state, action.player, [0, 1, 2, 3, 4].filter((i) => !action.keep.includes(i)))
    next = log(next, { type: 'rolled', player: action.player, dice: next.dice[action.player], kept: [...action.keep] })
  } else {
    next = log(next, { type: 'stood', player: action.player })
  }
  if (waiting.length) return { ...next, phase: { ...phase, waiting } }

  // Everyone has rolled: the Boss shows their dice, and the worst hand loses (it can be the Boss)
  next = log({ ...next, phase: { ...phase, waiting, hidden: [] } }, { type: 'revealed', player: phase.boss, dice: next.dice[phase.boss] })
  const worst = worstHands(phase.players, (id) => next.dice[id], compareBoss)
  return settleWorst(next, phase.call, phase.cycle, worst)
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
        if (!rollers(state).includes(action.player)) {
          throw new EngineError(`The worst hand rolls first: it's ${bottomTurn(state)}'s turn, not ${action.player}'s`)
        }

        if (action.type === 'stand') {
          // No standing at the bottom (§4): the worst hand rolls while it has
          // rolls. Standing level with the others at the bottom is "taking
          // the tie", and that's allowed (an offer: reopenTie).
          if (wouldLoseIfStopped(state, action.player)) {
            throw new EngineError('You have the worst hand: roll while you have rolls left')
          }
          return maybeResolve(
            log(
              { ...state, phase: { ...phase, rolling: { ...phase.rolling, [action.player]: { ...rolls, done: true } } } },
              { type: 'stood', player: action.player }
            )
          )
        }

        const keep = action.keep
        if (!validIndices(keep)) throw new EngineError('Keep must be distinct die positions 0–4')
        const call = phase.call
        if (isKickerGame(call.game)) {
          const dice = state.dice[action.player]
          const locked = rolls.kept ?? []
          const committed = locked.every((i) => keep.includes(i))
          const problem = committed
            ? keepProblem(keep.map((i) => dice[i]), call.game, {
                locked: locked.map((i) => dice[i]),
                hand: dice,
                rules: state.rules,
              })
            : 'Kept dice stay kept: you’re committed to the dice you kept last roll'
          if (problem) throw new EngineError(problem)
        }
        const rolled = rollPositions(state, action.player, [0, 1, 2, 3, 4].filter((i) => !keep.includes(i)))
        const dice = rolled.dice[action.player]

        const rollsUsed = rolls.rollsUsed + 1
        const next: GameState = {
          ...rolled,
          phase: {
            ...phase,
            rolling: { ...phase.rolling, [action.player]: { rollsUsed, done: rollsUsed >= MAX_ROLLS, kept: [...keep] } },
          },
        }
        return maybeResolve(log(next, { type: 'rolled', player: action.player, dice, kept: [...keep] }))
      }
      if (action.type === 'misread') {
        const rolls = phase.rolling[action.player]
        if (!rolls) throw new EngineError(`${action.player} isn't playing this cycle`)
        if (!isKickerGame(phase.call.game)) throw new EngineError('Only a kicker game is shown dice by dice')
        // Picked up: roll all five as if there were no game, or with no roll left the hand is dead
        if (rolls.rollsUsed >= MAX_ROLLS) {
          return maybeResolve(
            log(
              {
                ...state,
                phase: {
                  ...phase,
                  rolling: { ...phase.rolling, [action.player]: { ...rolls, done: true, kept: [...DEAD_HAND] } },
                },
              },
              { type: 'misread', player: action.player, dead: true }
            )
          )
        }
        const rolled = rollPositions(state, action.player, [0, 1, 2, 3, 4])
        const rollsUsed = rolls.rollsUsed + 1
        const next: GameState = {
          ...rolled,
          phase: {
            ...phase,
            rolling: { ...phase.rolling, [action.player]: { rollsUsed, done: rollsUsed >= MAX_ROLLS, kept: [] } },
          },
        }
        return maybeResolve(
          log(
            next,
            { type: 'misread', player: action.player, dead: false },
            { type: 'rolled', player: action.player, dice: rolled.dice[action.player], kept: [] }
          )
        )
      }
      break
    }

    case 'tresAway':
      return tresAwayAction(state, action)

    case 'boss':
      return bossAction(state, action)

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

/** A player's dice as one viewer sees them: null for a hidden die, or for a fully hidden hand */
export type VisibleDice = (Die | null)[] | null

export interface PlayerView {
  viewer: PlayerId
  seats: Seat[]
  hammer: PlayerId
  round: number
  phase: Phase
  dice: Record<PlayerId, VisibleDice>
  /** Other players' hidden rolls have their dice removed */
  log: GameEvent[]
}

/** Which of `id`'s dice the other players can't see right now */
function hiddenPositions(state: GameState, id: PlayerId): number[] | 'all' {
  const { phase } = state
  // The initial roll is hidden until play starts (§2)
  if (phase.kind === 'call' || phase.kind === 'refusal' || phase.kind === 'secondCall') return 'all'
  // Tres Away: dice in hand stay hidden until put out (§3.2)
  if (phase.kind === 'tresAway' && phase.hands[id]) {
    return [0, 1, 2, 3, 4].filter((i) => !phase.hands[id].out.includes(i))
  }
  // Boss: the Boss's extra roll is hidden until the end (§3.3)
  if (phase.kind === 'boss' && phase.boss === id) return phase.hidden
  return []
}

/**
 * What one player is allowed to see. The dice source is never exposed,
 * since it would reveal future rolls.
 */
export function viewFor(state: GameState, viewer: PlayerId): PlayerView {
  const dice: Record<PlayerId, VisibleDice> = {}
  Object.entries(state.dice).forEach(([id, d]) => {
    const hidden = id === viewer ? [] : hiddenPositions(state, id)
    dice[id] = hidden === 'all' ? null : d.map((face, i) => (hidden.includes(i) ? null : face))
  })
  const log = state.log.map((e) => (e.type === 'rolled' && e.hidden && e.player !== viewer ? { ...e, dice: [] } : e))
  return {
    viewer,
    seats: state.seats,
    hammer: state.hammer,
    round: state.round,
    phase: state.phase,
    dice,
    log,
  }
}
