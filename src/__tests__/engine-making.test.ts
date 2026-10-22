/**
 * Making the game (docs/RULES.md §4, ruled 2026-10-21): in a kicker game,
 * everyone who hasn't made the game rolls on their own until they make it
 * or run out of rolls; and a hand shown with the wrong dice is picked up
 * (`misread`, hard mode in Play).
 */
import {
  Action,
  GameState,
  applyAction,
  createGame,
  isGameSet,
  keptAt,
  rollers,
  scripted,
} from '../engine'
import { actors, botActionFor } from '../strategy'

const players = (...ids: string[]) =>
  ids.map((id) => ({ id, name: id.toUpperCase() }))
const play = (state: GameState, ...actions: Action[]) =>
  actions.reduce(applyAction, state)
const tenTwo = { game: '10-2', variant: 'high' } as const

/** a calls 10-2 High and b accepts; `deal` is a, b, c's dice, then `rolls` */
const start = (deal: number[], rolls: number[] = []) =>
  play(
    createGame({
      players: players('a', 'b', 'c'),
      hammer: 'a',
      source: scripted([...deal, ...rolls]),
    }),
    { type: 'call', player: 'a', call: tenTwo },
    { type: 'accept', player: 'b' }
  )

describe('players who missed the game roll on their own', () => {
  // a made 10-2 (5+5); b and c missed
  const deal = [5, 5, 1, 1, 2, 1, 2, 3, 1, 2, 1, 1, 2, 2, 3]

  test('everyone still making the game may roll, in any order; nobody else', () => {
    const g = start(deal, [5, 5, 6, 6, 6])
    expect(rollers(g)).toEqual(['b', 'c'])
    expect(actors(g)).toEqual(['b', 'c'])
    expect(() =>
      applyAction(g, { type: 'reroll', player: 'a', keep: [0, 1] })
    ).toThrow(/turn/)
    // c goes first, though b sits nearer the Hammer
    const next = applyAction(g, { type: 'reroll', player: 'c', keep: [] })
    expect(next.dice.c).toEqual([5, 5, 6, 6, 6])
    expect(rollers(next)).toEqual(['b'])
  })

  test('the last one to miss takes the pencil', () => {
    const g = play(
      start(deal, [5, 5, 6, 6, 6, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]),
      { type: 'reroll', player: 'c', keep: [] },
      { type: 'reroll', player: 'b', keep: [] },
      { type: 'reroll', player: 'b', keep: [] }
    )
    expect(g.phase).toMatchObject({ kind: 'roundOver', loser: 'b' })
  })

  test('a bot can act for any of them', () => {
    const g = start(deal, Array(30).fill(1))
    expect(botActionFor(g, 'c')).toMatchObject({ type: 'reroll', player: 'c' })
    expect(botActionFor(g, 'b')).toMatchObject({ type: 'reroll', player: 'b' })
  })
})

describe('showing the wrong dice (misread)', () => {
  // Everyone made 10-2: a 5+5 (kicker 4), b 4+6 (kicker 3), c 6+4 (kicker 6)
  const deal = [5, 5, 1, 1, 2, 4, 6, 1, 1, 1, 6, 4, 2, 2, 2]

  test('with a roll left: pick up all five and roll them, even a made game', () => {
    const g = applyAction(start(deal, [1, 1, 1, 1, 1]), {
      type: 'misread',
      player: 'a',
    })
    expect(g.dice.a).toEqual([1, 1, 1, 1, 1])
    expect(g.log.slice(-2)).toEqual([
      { type: 'misread', player: 'a', dead: false },
      { type: 'rolled', player: 'a', dice: [1, 1, 1, 1, 1], kept: [] },
    ])
    if (g.phase.kind !== 'play') throw new Error('still playing')
    expect(g.phase.rolling.a).toEqual({ rollsUsed: 2, done: false, kept: [] })
    // a missed now, so a rolls on their own
    expect(rollers(g)).toEqual(['a'])
  })

  test('with no roll left the hand is dead: it misses the game', () => {
    const g = play(
      start(deal, [1, 1, 1, 1, 1, 5, 5, 1, 1, 1]),
      { type: 'misread', player: 'a' },
      { type: 'misread', player: 'a' },
      { type: 'misread', player: 'a' }
    )
    expect(g.log.some((e) => e.type === 'misread' && e.dead)).toBe(true)
    expect(keptAt(g, 'a')).toEqual([0, 1, 2, 3, 4])
    expect(g.phase).toMatchObject({ kind: 'roundOver', loser: 'a' })
  })

  test('only in a kicker game', () => {
    const g = play(
      createGame({
        players: players('a', 'b'),
        hammer: 'a',
        source: scripted(Array(20).fill(2)),
      }),
      { type: 'call', player: 'a', call: { game: 'razzle' } },
      { type: 'accept', player: 'b' }
    )
    expect(() => applyAction(g, { type: 'misread', player: 'a' })).toThrow(
      /kicker game/
    )
  })
})

test('isGameSet: exactly the dice that make the game, holding kept dice', () => {
  const dice = [6, 4, 3, 5, 2] as const
  expect(isGameSet([...dice], [0, 1], '10-2')).toBe(true)
  expect(isGameSet([...dice], [0, 1, 4], '10-2')).toBe(false)
  expect(isGameSet([...dice], [1, 2], '10-2')).toBe(false)
  expect(isGameSet([...dice], [2, 3, 4], '10-3')).toBe(true)
  // Kept dice must be part of the game
  expect(isGameSet([...dice], [2, 3, 4], '10-3', [0])).toBe(false)
  expect(isGameSet([6, 1, 5, 2, 3], [0, 1, 3, 2], 'vegas', [0, 1])).toBe(true)
})
