import {
  Call,
  GameEvent,
  GameState,
  HouseRules,
  PlayerId,
  Seat,
  createGame,
  seeded,
} from '../../engine'
import { botAction } from '../../strategy'

/**
 * The pure side of playing against bots: setting up a table, whose move it
 * is, and the round told in words. Tested in src/__tests__/play-model.test.ts.
 */

export const YOU: PlayerId = 'you'

export const BOT_NAMES = ['Ava', 'Ben', 'Cass', 'Dev', 'Eli', 'Fran', 'Gus']

/** A new game: you plus `bots` opponents, seated in order, with a fresh piddle, playing `rules` */
export function newTable(bots: number, seed: number, rules: Partial<HouseRules> = {}): GameState {
  const players = [
    { id: YOU, name: 'You' },
    ...BOT_NAMES.slice(0, bots).map((name) => ({
      id: name.toLowerCase(),
      name,
    })),
  ]
  return createGame({ players, source: seeded(seed), rules })
}

/** Who must act now, or null between rounds and at the end */
export function actor(state: GameState): PlayerId | null {
  const kind = state.phase.kind
  if (kind === 'roundOver' || kind === 'gameOver') return null
  const action = botAction(state)
  return 'player' in action ? action.player : null
}

/** The calls a Hammer can make right now (a second call must be a different game) */
export const callAllowed = (state: GameState, call: Call): boolean =>
  state.phase.kind !== 'secondCall' || call.game !== state.phase.refused.game

type Names = Record<PlayerId, string>
type Label = (call: Call) => string

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`
const diceCount = (n: number) => `${n} ${n === 1 ? 'die' : 'dice'}`
const list = (ids: PlayerId[], names: Names) => {
  const n = ids.map((id) => names[id])
  return n.length < 2 ? n.join('') : `${n.slice(0, -1).join(', ')} and ${n[n.length - 1]}`
}

/** One event in words, or null for events not worth a line */
export function describeEvent(e: GameEvent, names: Names, label: Label): string | null {
  const who = 'player' in e ? names[e.player] : ''
  /** "You roll" but "Ava rolls" */
  const v = (verb: string, third = `${verb}s`) => (who === 'You' ? verb : third)
  switch (e.type) {
    case 'piddle':
      return e.rounds
        .map((round, i) => {
          const rolls = round.map((r) => `${names[r.player]} ${r.die}`).join(', ')
          return i === 0 ? `Piddle: ${rolls}.` : `Roll-off: ${rolls}.`
        })
        .join(' ')
    case 'hammer':
      return `${who} won the piddle and ${v('hold')} the Hammer.`
    case 'called':
      return e.second
        ? `${who} ${v('make')} a second call: ${label(e.call)}. No refusals.`
        : `${who} ${v('call')} ${label(e.call)}.`
    case 'barked':
      return `${who} ${v('bark')}. The Hammer passes left and everyone rolls again.`
    case 'accepted':
      return `${who} ${v('accept')}. Everyone plays it.`
    case 'refused':
      return `${who} ${v('refuse')}.`
    case 'rolled':
      if (e.hidden) return `${who} ${v('roll')} in secret.`
      return `${who} ${e.kept.length ? `${v('keep')} ${diceCount(e.kept.length)} and ${v('roll')}` : v('roll')}: ${e.dice.join(' ')}.`
    case 'putOut':
      return `${who} ${v('put', 'puts')} out ${e.dice.join(' ')}.`
    case 'boss':
      return `${who} ${who === 'You' ? 'have' : 'has'} the best hand and ${who === 'You' ? 'are' : 'is'} the Boss.`
    case 'noBoss':
      return `${list(e.players, names)} tie for the best hand: no Boss, no loser.`
    case 'comeUp':
      return `${who} ${v('say')} “come up”: everyone else gets one last roll.`
    case 'dontComeUp':
      return `${who} ${v('say')} “pick ’em up”: no loser this round, and the Hammer passes left.`
    case 'revealed':
      return `${who} ${v('show')} the Boss's dice: ${e.dice.join(' ')}.`
    case 'stood':
      return `${who} ${v('stand')}.`
    case 'misread':
      return e.dead
        ? `${who} ${v('show')} the wrong dice with no roll left: no game.`
        : `${who} ${v('show')} the wrong dice, so ${who === 'You' ? 'you pick' : 'they pick'} them all up and roll five.`
    case 'cycle':
      return e.reason === 'tie'
        ? `${list(e.players, names)} tie for the worst hand and play again.`
        : `${list(e.players, names)} missed the game and play again.`
    case 'pencil':
      return e.out
        ? `${who} ${who === 'You' ? 'take' : 'takes'} a pencil (${e.pencils}) and ${who === 'You' ? 'are' : 'is'} out.`
        : `${who} ${who === 'You' ? 'take' : 'takes'} a pencil (${plural(e.pencils, 'pencil')}).`
    case 'noPencil':
      return 'No pencil this round. The Hammer passes left.'
    case 'gameOver':
      return `${who} ${who === 'You' ? 'win' : 'wins'} the pot!`
  }
}

/** Which dice positions each player rolled in these events, to animate them */
export function rolledPositions(events: GameEvent[]): Record<PlayerId, number[]> {
  const out: Record<PlayerId, number[]> = {}
  const add = (id: PlayerId, idx: number[]) => {
    out[id] = [...new Set([...(out[id] || []), ...idx])]
  }
  events.forEach((e) => {
    if (e.type === 'rolled')
      add(e.player, [0, 1, 2, 3, 4].filter((i) => !e.kept.includes(i)))
    if (e.type === 'cycle') e.players.forEach((id) => add(id, [0, 1, 2, 3, 4]))
  })
  return out
}

/**
 * How fast the bots play, slowest first, like a video's playback speed.
 * Online tables give each move its own beat instead of one fixed tick: a
 * call is worth a longer look than a refusal. `realistic` gives every
 * decision a few seconds of thinking, a different time each move, as
 * people take; `instant` plays straight through to your next move.
 */
export type Pace = 'verySlow' | 'slow' | 'realistic' | 'normal' | 'fast' | 'instant'

export const PACES: { id: Pace; label: string }[] = [
  { id: 'verySlow', label: 'Very slow' },
  { id: 'slow', label: 'Slow' },
  { id: 'realistic', label: 'Realistic' },
  { id: 'normal', label: 'Normal' },
  { id: 'fast', label: 'Fast' },
  { id: 'instant', label: 'Instant' },
]

/** New players start slow: there's a lot to take in */
export const DEFAULT_PACE: Pace = 'verySlow'

const PACE_SCALE: Record<Exclude<Pace, 'realistic'>, number> = {
  verySlow: 2.2,
  slow: 1.5,
  normal: 1,
  fast: 0.45,
  instant: 0,
}

/** Milliseconds to read each kind of event at normal pace (a roll includes its ~1s tumble) */
const READ_MS: Partial<Record<GameEvent['type'], number>> = {
  called: 2200,
  barked: 2000,
  accepted: 1500,
  refused: 1500,
  rolled: 1700,
  putOut: 1500,
  boss: 2000,
  noBoss: 2000,
  comeUp: 1700,
  dontComeUp: 1700,
  revealed: 2000,
  stood: 1200,
  misread: 2200,
  cycle: 2000,
}

/** Realistic thinking time, in ms: [least, most] */
const THINK_MS: [number, number] = [2000, 5000]

/**
 * How long a bot waits before its move after `last`, the latest event:
 * long enough to see what just happened. Your own moves need less (you
 * know what you did), but still leave the dice time to land. `null`: a
 * fresh deal. Realistic adds a few seconds of thinking, drawn with `rand`.
 */
export function paceAfter(last: GameEvent | null, pace: Pace = DEFAULT_PACE, rand: () => number = Math.random): number {
  const base = last ? READ_MS[last.type] ?? 1400 : 1600
  const yours = last && 'player' in last && last.player === YOU
  const read = yours ? (last.type === 'rolled' ? 1100 : 700) : base
  if (pace === 'realistic') {
    const [least, most] = THINK_MS
    return Math.round(Math.max(read, least + rand() * (most - least)))
  }
  return Math.round(read * (PACE_SCALE[pace] ?? 1))
}

/** How long a moment that only needs reading (a piddle roll, a round's result) stays up */
export function holdFor(ms: number, pace: Pace = DEFAULT_PACE): number {
  if (pace === 'instant') return 0
  return Math.round(ms * (pace === 'realistic' ? 1.5 : PACE_SCALE[pace]))
}

/** One player's latest move, short enough for their seat: "Calls 10-4 High", "Keeps 2, rolls 3" */
export function shortEvent(e: GameEvent, label: Label): string | null {
  switch (e.type) {
    case 'called':
      return e.second ? `Second call: ${label(e.call)}` : `Calls ${label(e.call)}`
    case 'barked':
      return 'Barks'
    case 'accepted':
      return 'Accepts'
    case 'refused':
      return 'Refuses'
    case 'rolled':
      if (e.hidden) return 'Rolls in secret'
      return e.kept.length ? `Keeps ${e.kept.length}, rolls ${5 - e.kept.length}` : 'Rolls all 5'
    case 'putOut':
      return `Puts out ${e.dice.join(' ')}`
    case 'boss':
      return 'The Boss'
    case 'comeUp':
      return '“Come up”'
    case 'dontComeUp':
      return '“Pick ’em up”'
    case 'revealed':
      return 'Shows the Boss’s dice'
    case 'stood':
      return 'Stands'
    case 'misread':
      return e.dead ? 'Wrong dice: no game' : 'Wrong dice: picks up'
    case 'pencil':
      return e.out ? 'Takes a pencil: out' : 'Takes a pencil'
    default:
      return null
  }
}

/**
 * Each player's latest move in `events` (this round), with the event's
 * index so the newest can stand out. A replay (cycle) counts as a move.
 */
export function latestMoves(events: GameEvent[], label: Label): Record<PlayerId, { text: string; at: number }> {
  const out: Record<PlayerId, { text: string; at: number }> = {}
  events.forEach((e, at) => {
    if (e.type === 'cycle') {
      e.players.forEach((id) => (out[id] = { text: e.reason === 'tie' ? 'Tied: plays again' : 'Missed: plays again', at }))
      return
    }
    const text = shortEvent(e, label)
    if (text && 'player' in e) out[e.player] = { text, at }
  })
  return out
}

/**
 * The table in seat order, starting at `first` (the player who won the
 * piddle) and going left. It never changes during a game: the Hammer moves
 * down it as play passes left.
 */
export function tableOrder<S extends Pick<Seat, 'id'>>(seats: S[], first: PlayerId): S[] {
  const i = Math.max(0, seats.findIndex((s) => s.id === first))
  return [...seats.slice(i), ...seats.slice(0, i)]
}

/** The piddle, one reveal at a time: each roll (and roll-off), then who holds the Hammer */
export function piddleSteps(rounds: { player: PlayerId; die: number }[][]): { round: number; done: boolean }[] {
  return [...rounds.map((_, round) => ({ round, done: false })), { round: rounds.length - 1, done: true }]
}
