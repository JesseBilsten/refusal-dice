/**
 * Standings: the table ranked best first, who's at the bottom, who's "all
 * day" (out of rolls) and who's "in the cup" (safe). The random-games test
 * in engine-game.test.ts checks that nobody in the cup ever takes a pencil.
 */
import { Action, GameState, applyAction, createGame, rankBest, scripted, standings } from '../engine'

const players = (...ids: string[]) => ids.map((id) => ({ id, name: id.toUpperCase() }))
const play = (state: GameState, ...actions: Action[]) => actions.reduce(applyAction, state)
const brief = (g: GameState) => standings(g).map(({ player, rank, status, rollsLeft, allDay }) => [player, rank, status, rollsLeft, allDay])

test('rankBest gives tied hands the same rank (1, 2, 2, 4)', () => {
  const score: Record<string, number> = { a: 3, b: 9, c: 5, d: 5 }
  expect(rankBest(['a', 'b', 'c', 'd'], (x, y) => score[x] - score[y])).toEqual([
    { id: 'b', rank: 1 },
    { id: 'c', rank: 2 },
    { id: 'd', rank: 2 },
    { id: 'a', rank: 4 },
  ])
})

describe('kicker games', () => {
  // a: 10-2 with a kicker of 6+6+5 = 17; b: 5+5 with 1+1+2 = 4; c: no 10-2
  const start = (extra: number[] = []) =>
    play(
      createGame({
        players: players('a', 'b', 'c'),
        hammer: 'a',
        source: scripted([4, 6, 6, 6, 5, 5, 5, 1, 1, 2, 1, 2, 3, 4, 1, ...extra]),
      }),
      { type: 'call', player: 'a', call: { game: '10-2', variant: 'high' } },
      { type: 'accept', player: 'b' }
    )

  test('best first; the miss is at the bottom; nobody is safe yet', () => {
    expect(brief(start())).toEqual([
      ['a', 1, 'live', 2, false],
      ['b', 2, 'live', 2, false],
      ['c', 3, 'bottom', 2, false],
    ])
  })

  test('all day above someone: everyone better than a finished hand is in the cup', () => {
    // c misses, then makes 10-2 on the last roll with a kicker of 5: all day, above b
    const g = play(
      start([1, 1, 1, 1, 1, 5, 5, 1, 2, 2]),
      { type: 'reroll', player: 'c', keep: [] },
      { type: 'reroll', player: 'c', keep: [] }
    )
    expect(brief(g)).toEqual([
      ['a', 1, 'safe', 2, false],
      ['c', 2, 'live', 0, true],
      ['b', 3, 'bottom', 2, false],
    ])
    // a is in the cup because of c's finished hand
    expect(standings(g).find((st) => st.player === 'a')?.safeOver).toBe('c')
    expect(standings(g).find((st) => st.player === 'c')?.safeOver).toBeUndefined()
  })

  test('not on the table before play starts', () => {
    expect(standings(createGame({ players: players('a', 'b'), hammer: 'a', source: scripted(Array(10).fill(1)) }))).toEqual([])
  })
})

test('round over: the final ranking, with the loser at the bottom and everyone else in the cup', () => {
  const g = play(
    createGame({
      players: players('a', 'b', 'c'),
      hammer: 'a',
      source: scripted([4, 6, 6, 6, 5, 5, 5, 1, 1, 2, 1, 2, 3, 4, 1, ...Array(10).fill(1)]),
    }),
    { type: 'call', player: 'a', call: { game: '10-2', variant: 'high' } },
    { type: 'accept', player: 'b' },
    { type: 'reroll', player: 'c', keep: [] },
    { type: 'reroll', player: 'c', keep: [] }
  )
  expect(g.phase).toMatchObject({ kind: 'roundOver', loser: 'c' })
  expect(brief(g)).toEqual([
    ['a', 1, 'safe', null, true],
    ['b', 2, 'safe', null, true],
    ['c', 3, 'bottom', null, true],
  ])
  expect(standings(g).map((st) => st.safeOver)).toEqual(['c', 'c', undefined])
})
