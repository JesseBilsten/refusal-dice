/**
 * Tres Away, Boss and Razzle (docs/RULES.md §3.2–3.4).
 */
import {
  Action,
  Dice,
  GameState,
  applyAction,
  bossHand,
  compareBoss,
  compareRazzle,
  createGame,
  razzleScore,
  scripted,
  tresAwayScore,
  viewFor,
} from '../engine'

const players = (...ids: string[]) =>
  ids.map((id) => ({ id, name: id.toUpperCase() }))
const play = (state: GameState, ...actions: Action[]) =>
  actions.reduce(applyAction, state)

/** a, b, c with a as Hammer; `deal` is 15 dice, `extra` are later rolls */
const called = (
  game: 'tres-away' | 'boss' | 'razzle',
  deal: number[],
  extra: number[] = []
) =>
  play(
    createGame({
      players: players('a', 'b', 'c'),
      hammer: 'a',
      source: scripted([...deal, ...extra]),
    }),
    { type: 'call', player: 'a', call: { game } },
    { type: 'accept', player: 'b' }
  )

describe('scoring', () => {
  test('Tres Away: 3s count 0', () => {
    expect(tresAwayScore([3, 3, 1, 6, 2])).toBe(9)
    expect(tresAwayScore([3, 3, 3, 3, 3])).toBe(0)
  })

  test('Razzle: 1s are wild; equal counts go to the higher face', () => {
    expect(razzleScore([1, 1, 1, 4, 2])).toEqual({ count: 4, face: 4 })
    expect(razzleScore([1, 1, 1, 1, 1])).toEqual({ count: 5, face: 6 })
    // four 6s beat four 4s
    expect(compareRazzle([6, 6, 6, 1, 2], [1, 1, 1, 4, 2])).toBeGreaterThan(0)
    // five 2s beat four 6s
    expect(compareRazzle([2, 2, 2, 2, 2], [6, 6, 6, 1, 2])).toBeGreaterThan(0)
    // identical scores tie
    expect(compareRazzle([1, 4, 1, 1, 2], [1, 1, 1, 4, 5])).toBeLessThan(0)
    expect(compareRazzle([1, 4, 1, 1, 2], [4, 1, 1, 1, 3])).toBe(0)
  })

  test('Boss: poker hands without straights, poker tie-breaks', () => {
    expect(bossHand([2, 6, 6, 3, 6])).toMatchObject({
      category: 'three-of-a-kind',
      handDice: [1, 2, 4],
    })
    expect(bossHand([1, 2, 4, 5, 6])).toMatchObject({
      category: 'high-card',
      handDice: [4],
    })
    expect(bossHand([4, 4, 2, 2, 4])).toMatchObject({
      category: 'full-house',
      handDice: [0, 1, 2, 3, 4],
    })
    // 6s over 2s beats 5s over 4s
    expect(compareBoss([6, 6, 2, 2, 1], [5, 5, 4, 4, 6])).toBeGreaterThan(0)
    // same pair: kickers decide
    expect(compareBoss([6, 6, 5, 2, 1], [6, 6, 4, 3, 2])).toBeGreaterThan(0)
    // a pair beats high card; four of a kind beats a full house
    expect(compareBoss([2, 2, 1, 3, 4], [6, 5, 4, 3, 1])).toBeGreaterThan(0)
    expect(compareBoss([2, 2, 2, 2, 1], [6, 6, 6, 5, 5])).toBeGreaterThan(0)
    // exact match ties
    expect(compareBoss([6, 6, 1, 2, 3], [3, 2, 1, 6, 6])).toBe(0)
  })
})

describe('Razzle', () => {
  test('everyone rolls at once; the lowest score loses', () => {
    const g = play(
      // c can't stand at the bottom, so re-rolls twice and stays on two of a kind
      called(
        'razzle',
        [6, 6, 6, 1, 2, 1, 1, 1, 4, 2, 5, 5, 2, 3, 4],
        [2, 3, 4, 2, 3, 4]
      ),
      { type: 'stand', player: 'a' },
      { type: 'stand', player: 'b' }
    )
    expect(() => applyAction(g, { type: 'stand', player: 'c' })).toThrow(
      /lowest hand/
    )
    const end = play(
      g,
      { type: 'reroll', player: 'c', keep: [0, 1] },
      { type: 'reroll', player: 'c', keep: [0, 1] }
    )
    expect(end.phase).toMatchObject({ kind: 'roundOver', loser: 'c' })
  })

  test('identical lowest scores replay', () => {
    const g = play(
      called(
        'razzle',
        [6, 6, 6, 1, 2, 5, 5, 2, 3, 4, 5, 5, 4, 3, 2],
        Array(10).fill(6)
      ),
      { type: 'stand', player: 'a' },
      { type: 'stand', player: 'b' },
      { type: 'stand', player: 'c' }
    )
    expect(g.phase).toMatchObject({ kind: 'play', cycle: 1 })
    expect(g.log.at(-1)).toEqual({
      type: 'cycle',
      players: ['b', 'c'],
      reason: 'tie',
    })
  })
})

describe('Tres Away', () => {
  // a 3,3,6,6,6 · b 3,1,5,5,5 · c 2,2,6,6,6
  const deal = [3, 3, 6, 6, 6, 3, 1, 5, 5, 5, 2, 2, 6, 6, 6]
  const extra = [1, 1, 1, 1, /* a: */ 3, 3, 3, /* b: */ 6, /* c: */ 5, 5, 5]

  test('the caller sets the pace; the others catch up in order; highest score loses', () => {
    let g = called('tres-away', deal, extra)
    expect(g.phase).toMatchObject({ kind: 'tresAway', pacer: 'a', turn: 'a' })
    expect(() =>
      applyAction(g, { type: 'putOut', player: 'b', dice: [0] })
    ).toThrow(/turn/)

    // a puts out two 3s; everyone must match two dice out
    g = applyAction(g, { type: 'putOut', player: 'a', dice: [0, 1] })
    expect(g.phase).toMatchObject({ turn: 'b' })

    // b puts out one 3, must roll again before putting out more
    g = applyAction(g, { type: 'putOut', player: 'b', dice: [0] })
    expect(() =>
      applyAction(g, { type: 'putOut', player: 'b', dice: [1] })
    ).toThrow(/Roll/)
    g = applyAction(g, { type: 'roll', player: 'b' })
    expect(g.dice.b).toEqual([3, 1, 1, 1, 1])
    expect(() => applyAction(g, { type: 'roll', player: 'b' })).toThrow(
      /Put out/
    )
    g = applyAction(g, { type: 'putOut', player: 'b', dice: [1, 2, 3] }) // b is ahead: 4 out
    expect(g.phase).toMatchObject({ turn: 'c' })

    g = applyAction(g, { type: 'putOut', player: 'c', dice: [0, 1] })
    expect(g.phase).toMatchObject({ turn: 'a' }) // everyone has matched; the pacer goes again

    g = play(
      g,
      { type: 'roll', player: 'a' },
      { type: 'putOut', player: 'a', dice: [2, 3, 4] }
    )
    expect(g.phase).toMatchObject({ turn: 'b' })
    // b's last single die is put out as soon as it's rolled
    g = applyAction(g, { type: 'roll', player: 'b' })
    expect(g.phase).toMatchObject({ turn: 'c' })
    expect(g.dice.b).toEqual([3, 1, 1, 1, 6])

    g = play(
      g,
      { type: 'roll', player: 'c' },
      { type: 'putOut', player: 'c', dice: [2, 3, 4] }
    )
    // a 0 · b 9 · c 19
    expect(g.phase).toMatchObject({ kind: 'roundOver', loser: 'c' })
  })

  test('dice in hand stay hidden; put-out dice are shown', () => {
    let g = called('tres-away', deal, extra)
    g = applyAction(g, { type: 'putOut', player: 'a', dice: [0, 1] })
    expect(viewFor(g, 'b').dice.a).toEqual([3, 3, null, null, null])
    expect(viewFor(g, 'a').dice.a).toEqual([3, 3, 6, 6, 6])

    g = play(
      g,
      { type: 'putOut', player: 'b', dice: [0] },
      { type: 'roll', player: 'b' }
    )
    const rolled = viewFor(g, 'c').log.at(-1)
    expect(rolled).toMatchObject({ type: 'rolled', player: 'b', dice: [] })
    expect(viewFor(g, 'b').log.at(-1)).toMatchObject({ dice: [3, 1, 1, 1, 1] })
  })
})

describe('Boss', () => {
  // a pair of 6s (Boss) · b pair of 5s · c high card
  const deal = [6, 6, 2, 4, 5, 5, 5, 1, 2, 3, 2, 3, 4, 5, 1]

  test('the best hand is Boss and must keep it; others come up in order; the worst hand loses', () => {
    let g = called('boss', deal, [1, 1, 2, /* c: */ 2, 2, 2, 3, 3])
    expect(g.phase).toMatchObject({
      kind: 'boss',
      boss: 'a',
      stage: 'bossRoll',
      mustKeep: [0, 1],
    })
    expect(() =>
      applyAction(g, { type: 'reroll', player: 'a', keep: [0] })
    ).toThrow(/keep the dice/)

    g = applyAction(g, { type: 'reroll', player: 'a', keep: [0, 1] })
    expect(g.dice.a).toEqual([6, 6, 1, 1, 2])
    // the Boss's extra roll is secret
    expect(viewFor(g, 'b').dice.a).toEqual([6, 6, null, null, null])

    g = applyAction(g, { type: 'comeUp', player: 'a' })
    expect(g.phase).toMatchObject({ stage: 'comeUp', waiting: ['b', 'c'] })
    expect(() => applyAction(g, { type: 'stand', player: 'c' })).toThrow(/turn/)

    g = play(
      g,
      { type: 'stand', player: 'b' },
      { type: 'reroll', player: 'c', keep: [] }
    )
    // a two pair · b pair of 5s · c full house
    expect(g.phase).toMatchObject({ kind: 'roundOver', loser: 'b' })
    expect(g.log).toContainEqual({
      type: 'revealed',
      player: 'a',
      dice: [6, 6, 1, 1, 2],
    })
  })

  test('the Boss can lose', () => {
    const g = play(
      called('boss', deal, [5, 2, 3, /* c: */ 4, 4, 4, 1, 2]),
      { type: 'stand', player: 'a' },
      { type: 'comeUp', player: 'a' },
      { type: 'reroll', player: 'b', keep: [0, 1] },
      { type: 'reroll', player: 'c', keep: [] }
    )
    // a pair of 6s · b three 5s · c three 4s
    expect(g.phase).toMatchObject({ kind: 'roundOver', loser: 'a' })
  })

  test('"don’t come up": no loser, the Hammer passes left', () => {
    const g = play(
      called('boss', deal),
      { type: 'stand', player: 'a' },
      { type: 'dontComeUp', player: 'a' }
    )
    expect(g.phase).toMatchObject({ kind: 'roundOver', loser: null })
    expect(g.hammer).toBe('b')
    expect(g.log.at(-1)).toEqual({
      type: 'noPencil',
      reason: 'boss-stayed-down',
    })
  })

  test('a tie for the best hand: no Boss, no loser, the Hammer passes left', () => {
    const g = called('boss', [6, 6, 1, 2, 3, 3, 2, 1, 6, 6, 2, 3, 4, 5, 1])
    expect(g.phase).toMatchObject({ kind: 'roundOver', loser: null })
    expect(g.hammer).toBe('b')
    expect(g.log.slice(-2)).toEqual([
      { type: 'noBoss', players: ['a', 'b'] },
      { type: 'noPencil', reason: 'no-boss' },
    ])
  })

  test('Boss and Tres Away have no high/low variant', () => {
    const g = createGame({
      players: players('a', 'b'),
      hammer: 'a',
      source: scripted(Array(10).fill(1)),
    })
    expect(() =>
      applyAction(g, {
        type: 'call',
        player: 'a',
        call: { game: 'boss', variant: 'high' },
      })
    ).toThrow(/no high\/low/)
  })
})

// Keep the Dice type import used for editors that flag unused imports
export type { Dice }
