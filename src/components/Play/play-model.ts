import {
  Call,
  GameEvent,
  GameState,
  PlayerId,
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

/** A new game: you plus `bots` opponents, seated in order, with a fresh piddle */
export function newTable(bots: number, seed: number): GameState {
  const players = [
    { id: YOU, name: 'You' },
    ...BOT_NAMES.slice(0, bots).map((name) => ({
      id: name.toLowerCase(),
      name,
    })),
  ]
  return createGame({ players, source: seeded(seed) })
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
