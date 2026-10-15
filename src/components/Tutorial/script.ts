import { Action, Call, GameState, createGame, scripted } from '../../engine'

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
// Then Ava and Ben re-roll their whole kicker (a kicker is rolled whole):
// Ava 6+6 = 12, Ben 6+4 = 10, tying your 5+5
const LATER = [6, 6, 6, 4]

export const CALL: Call = { game: '10-3', variant: 'high' }

export const newTutorialGame = () =>
  createGame({
    players: PLAYERS,
    hammer: 'you',
    source: scripted([...DEAL, ...LATER]),
  })

/** The bots' moves, in order */
export const AVA_ROLLS: Action[] = [
  { type: 'reroll', player: 'ava', keep: [0, 1, 2] },
  { type: 'stand', player: 'ava' },
]
export const BEN_ROLLS: Action[] = [
  { type: 'reroll', player: 'ben', keep: [0, 3, 4] },
  { type: 'stand', player: 'ben' },
]

/**
 * Tied with Ben at 10, you choose. Each choice gets its own dice:
 * - Take the tie: you and Ben replay with fresh dice (you 2-3-5-6-6 = 12
 *   kicker; Ben 4-4-2-1-1 = 2), and Ben re-rolls his kicker twice (3+2, then 4+1)
 * - Roll anyway: your kicker comes up 6+5 = 11 (a long shot that pays off)
 */
export const TIE_PATH_DICE = [2, 3, 5, 6, 6, 4, 4, 2, 1, 1, 3, 2, 4, 1]
export const ROLL_PATH_DICE = [6, 5, 6, 6, 6]

export const BEN_REPLAY_ROLLS: Action[] = [
  { type: 'reroll', player: 'ben', keep: [0, 1, 2] },
  { type: 'reroll', player: 'ben', keep: [0, 1, 2] },
]

/** Swap in the dice for the path the player chose (the state is plain data) */
export const withDice = (game: GameState, faces: number[]): GameState => ({
  ...game,
  source: scripted(faces),
})
