/**
 * Play's saved game (src/components/Play/saved-game.ts): a game survives a
 * round trip through storage and plays on exactly as it would have.
 */
import { applyAction } from '../engine'
import { botAction } from '../strategy'
import { newTable } from '../components/Play/play-model'
import {
  SAVE_KEY,
  SAVE_VERSION,
  clearGame,
  loadGame,
  parseSaved,
  saveGame,
  savedSummary,
} from '../components/Play/saved-game'

const memory = () => {
  const data: Record<string, string> = {}
  return {
    data,
    getItem: (k: string) => (k in data ? data[k] : null),
    setItem: (k: string, v: string) => void (data[k] = v),
    removeItem: (k: string) => void delete data[k],
  }
}

const advance = (g: ReturnType<typeof newTable>, steps: number) => {
  for (let i = 0; i < steps && g.phase.kind !== 'gameOver'; i++)
    g = applyAction(g, botAction(g))
  return g
}

test('a saved game resumes and plays on exactly as it would have', () => {
  const store = memory()
  const g = advance(newTable(3, 42), 60)
  saveGame(
    {
      game: g,
      hard: true,
      roundStart: 5,
      lastRound: [0, 5],
      rolledRound: g.round,
    },
    store
  )
  const back = loadGame(store)!
  expect(back).toMatchObject({
    v: SAVE_VERSION,
    hard: true,
    roundStart: 5,
    lastRound: [0, 5],
    rolledRound: g.round,
  })
  expect(back.game).toEqual(g)
  // Same dice source, same moves: the resumed game finishes the same way
  expect(advance(back.game, 20000)).toEqual(advance(g, 20000))
})

test('a finished game clears the save; so does starting over', () => {
  const store = memory()
  const g = newTable(2, 3)
  saveGame(
    { game: g, hard: false, roundStart: 0, lastRound: null, rolledRound: 0 },
    store
  )
  expect(store.data[SAVE_KEY]).toBeDefined()
  const over = advance(g, 20000)
  expect(over.phase.kind).toBe('gameOver')
  saveGame(
    { game: over, hard: false, roundStart: 0, lastRound: null, rolledRound: 0 },
    store
  )
  expect(loadGame(store)).toBeNull()

  saveGame(
    { game: g, hard: false, roundStart: 0, lastRound: null, rolledRound: 0 },
    store
  )
  clearGame(store)
  expect(loadGame(store)).toBeNull()
})

test('broken, old or unfinished-looking saves are ignored, and storage errors never throw', () => {
  expect(parseSaved(null)).toBeNull()
  expect(parseSaved('{not json')).toBeNull()
  const g = newTable(2, 1)
  expect(
    parseSaved(JSON.stringify({ v: SAVE_VERSION - 1, game: g, roundStart: 0 }))
  ).toBeNull()
  expect(
    parseSaved(
      JSON.stringify({
        v: SAVE_VERSION,
        game: { ...g, seats: null },
        roundStart: 0,
      })
    )
  ).toBeNull()
  expect(
    parseSaved(
      JSON.stringify({ v: SAVE_VERSION, game: g, roundStart: g.log.length + 1 })
    )
  ).toBeNull()

  const broken = {
    getItem: () => {
      throw new Error('blocked')
    },
    setItem: () => {
      throw new Error('full')
    },
    removeItem: () => {
      throw new Error('blocked')
    },
  }
  expect(loadGame(broken)).toBeNull()
  expect(() =>
    saveGame(
      { game: g, hard: false, roundStart: 0, lastRound: null, rolledRound: 0 },
      broken
    )
  ).not.toThrow()
  expect(() => clearGame(broken)).not.toThrow()
  expect(loadGame(null)).toBeNull()
})

test('the resume prompt reads where the game stood', () => {
  const g = newTable(3, 5)
  const seats = g.seats.map((s, i) =>
    i === 0 ? { ...s, pencils: 2 } : i === 3 ? { ...s, out: true } : s
  )
  expect(
    savedSummary(
      {
        v: SAVE_VERSION,
        game: { ...g, seats, round: 7 },
        hard: false,
        roundStart: 0,
        lastRound: null,
        rolledRound: 0,
      },
      'you'
    )
  ).toEqual({ round: 7, pot: 20, players: 3, pencils: 2, out: false })
})
