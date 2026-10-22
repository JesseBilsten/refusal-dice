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
      return `${who} ${v('say')} “don’t come up”: no loser this round.`
    case 'revealed':
      return `${who} ${v('show')} the Boss's dice: ${e.dice.join(' ')}.`
    case 'stood':
      return `${who} ${v('stand')}.`
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
 * How fast the bots play. Online tables give each action its own beat
 * instead of one fixed tick: a call or a pencil is worth a longer look
 * than a refusal. `slow` suits learning, `fast` players who know the game.
 */
export type Pace = 'slow' | 'normal' | 'fast'

export const PACES: { id: Pace; label: string }[] = [
  { id: 'slow', label: 'Slow' },
  { id: 'normal', label: 'Normal' },
  { id: 'fast', label: 'Fast' },
]

const PACE_SCALE: Record<Pace, number> = { slow: 1.6, normal: 1, fast: 0.45 }

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
  cycle: 2000,
}

/**
 * How long the next bot waits after `last`, the latest event: long enough
 * to see what just happened. Your own moves need less (you know what you
 * did), but still leave the dice time to land. `null`: a fresh deal.
 */
export function paceAfter(last: GameEvent | null, pace: Pace = 'normal'): number {
  const base = last ? READ_MS[last.type] ?? 1400 : 1600
  const yours = last && 'player' in last && last.player === YOU
  const ms = yours ? (last.type === 'rolled' ? 1100 : 700) : base
  return Math.round(ms * PACE_SCALE[pace])
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
      return '“Don’t come up”'
    case 'revealed':
      return 'Shows the Boss’s dice'
    case 'stood':
      return 'Stands'
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
 * The others in a fixed order, as they sit to your left: your seat stays
 * at the bottom of the table and nobody moves between rounds (online
 * tables keep seats still so players can learn where everyone is).
 */
export function opponentOrder<S extends Pick<Seat, 'id'>>(seats: S[]): S[] {
  const me = seats.findIndex((s) => s.id === YOU)
  return [...seats.slice(me + 1), ...seats.slice(0, Math.max(me, 0))]
}
