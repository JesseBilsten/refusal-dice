import { Action, Call, createGame, scripted } from '../../engine'

/**
 * The tutorial's scripted round. The dice are fixed so every player gets
 * the same lesson; src/__tests__/tutorial-script.test.ts plays it through
 * the engine so a rules change can't silently break it.
 */

export const PLAYERS = [
  { id: 'you', name: 'You' },
  { id: 'ava', name: 'Ava' },
  { id: 'ben', name: 'Ben' },
]

// Deal (seat order): you 1-3-6-5-5 · Ava 2-4-4-6-1 · Ben 6-6-2-3-1
const DEAL = [1, 3, 6, 5, 5, 2, 4, 4, 6, 1, 6, 6, 2, 3, 1]
// Then: Ava's re-roll, Ben's re-roll, and plenty of 6s for yours
const LATER = [6, 4, 6, 6, 6, 6, 6]

export const CALL: Call = { game: '10-3', variant: 'high' }

export const newTutorialGame = () =>
  createGame({
    players: PLAYERS,
    hammer: 'you',
    source: scripted([...DEAL, ...LATER]),
  })

/** The bots' moves, in order */
export const AVA_ROLLS: Action[] = [
  { type: 'reroll', player: 'ava', keep: [0, 1, 2, 3] },
  { type: 'stand', player: 'ava' },
]
export const BEN_ROLLS: Action[] = [
  { type: 'reroll', player: 'ben', keep: [0, 1, 3, 4] },
  { type: 'stand', player: 'ben' },
]
