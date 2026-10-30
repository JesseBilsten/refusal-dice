/**
 * Tres Away, Boss and Razzle (docs/RULES.md §3.2–3.4).
 */
import {
  Action,
  Dice,
  GameState,
  applyAction,
  bossHand,
  bossKeepProblem,
  compareBoss,
  compareRazzle,
  createGame,
  razzleScore,
  bottomTarget,
  bottomTurn,
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
  // a: four 6s, b: four 4s, c: two 5s
  const DEAL = [6, 6, 6, 1, 2, 1, 1, 1, 4, 2, 5, 5, 2, 3, 4]

  test('the lowest hand rolls first; out of rolls at the bottom loses', () => {
    const g = called('razzle', DEAL, [2, 3, 4, 2, 3, 4])
    expect(bottomTurn(g)).toBe('c')
    // Nobody else rolls, and the bottom can't stand
    expect(() => applyAction(g, { type: 'reroll', player: 'a', keep: [] })).toThrow(/c's turn/)
    expect(() => applyAction(g, { type: 'stand', player: 'c' })).toThrow(/worst hand/)
    const end = play(
      g,
      { type: 'reroll', player: 'c', keep: [0, 1] },
      { type: 'reroll', player: 'c', keep: [0, 1] }
    )
    expect(end.phase).toMatchObject({ kind: 'roundOver', loser: 'c' })
  })

  test('climbing off the bottom hands the roll to the new lowest hand', () => {
    // c rolls five 5s, beating everyone; b (four 4s) is now lowest and misses twice
    const g = play(called('razzle', DEAL, [5, 5, 5, 2, 3, 2, 3]), {
      type: 'reroll',
      player: 'c',
      keep: [0, 1],
    })
    expect(bottomTurn(g)).toBe('b')
    expect(bottomTarget(g, 'b')).toBe('a')
    const end = play(
      g,
      { type: 'reroll', player: 'b', keep: [0, 1, 2, 3] },
      { type: 'reroll', player: 'b', keep: [0, 1, 2, 3] }
    )
    expect(end.phase).toMatchObject({ kind: 'roundOver', loser: 'b' })
  })

  describe('taking a tie is an offer until every tied player takes it (ruled 2026-10-29)', () => {
    // b and c both hold two 5s; b rolls first and stays level, so c (2 rolls
    // left) decides before b (1 roll left)
    const start = (extra: number[]) => {
      const g = called(
        'razzle',
        [6, 6, 6, 1, 2, 5, 5, 2, 3, 4, 5, 5, 4, 3, 2],
        [2, 3, 4, ...extra]
      )
      return applyAction(g, { type: 'reroll', player: 'b', keep: [0, 1] })
    }

    test('c takes the tie while b can still roll; b takes it too: they replay', () => {
      const g = start(Array(10).fill(6))
      expect(bottomTurn(g)).toBe('c')
      const offered = applyAction(g, { type: 'stand', player: 'c' })
      expect(offered.phase.kind).toBe('play')
      expect(bottomTurn(offered)).toBe('b')
      const replay = applyAction(offered, { type: 'stand', player: 'b' })
      expect(replay.phase).toMatchObject({ kind: 'play', cycle: 1 })
      expect(replay.log.at(-1)).toEqual({ type: 'cycle', players: ['b', 'c'], reason: 'tie' })
    })

    test('b rolls instead and climbs off the bottom: c rolls again with the rolls left', () => {
      // b rolls three 5s (five 5s); c then misses twice and loses
      const g = start([5, 5, 5, 2, 3, 4, 2, 3, 4])
      const offered = applyAction(g, { type: 'stand', player: 'c' })
      const climbed = applyAction(offered, { type: 'reroll', player: 'b', keep: [0, 1] })
      expect(climbed.phase.kind).toBe('play')
      if (climbed.phase.kind !== 'play') return
      expect(climbed.phase.rolling.c).toMatchObject({ done: false, rollsUsed: 1 })
      expect(bottomTurn(climbed)).toBe('c')
      const end = play(
        climbed,
        { type: 'reroll', player: 'c', keep: [0, 1] },
        { type: 'reroll', player: 'c', keep: [0, 1] }
      )
      expect(end.phase).toMatchObject({ kind: 'roundOver', loser: 'c' })
    })

    test('b rolls instead and ends up the worst hand: b loses, no tie', () => {
      // b picks up everything and rolls two 2s, worse than c's two 5s
      const g = start([2, 2, 3, 4, 6])
      const offered = applyAction(g, { type: 'stand', player: 'c' })
      const end = applyAction(offered, { type: 'reroll', player: 'b', keep: [] })
      expect(end.phase).toMatchObject({ kind: 'roundOver', loser: 'b' })
    })
  })

  test('tied at the bottom: roll in turn, then take the tie and replay', () => {
    // b and c both hold two 5s; b (nearest the Hammer) rolls first
    const g = called(
      'razzle',
      [6, 6, 6, 1, 2, 5, 5, 2, 3, 4, 5, 5, 4, 3, 2],
      [2, 3, 4, 4, 3, 2, 2, 3, 4, ...Array(10).fill(6)]
    )
    expect(bottomTurn(g)).toBe('b')
    const once = applyAction(g, { type: 'reroll', player: 'b', keep: [0, 1] })
    // Still tied, and c has more rolls left: c rolls before b goes again
    expect(bottomTurn(once)).toBe('c')
    const level = play(
      once,
      { type: 'reroll', player: 'c', keep: [0, 1] },
      { type: 'reroll', player: 'b', keep: [0, 1] }
    )
    // b is out of rolls and still level: c may take the tie
    expect(bottomTurn(level)).toBe('c')
    const replay = play(level, { type: 'stand', player: 'c' })
    expect(replay.phase).toMatchObject({ kind: 'play', cycle: 1 })
    expect(replay.log.at(-1)).toEqual({
      type: 'cycle',
      players: ['b', 'c'],
      reason: 'tie',
    })
  })
})

describe('Tres Away', () => {
  // a 3,3,6,6,6 · b 3,1,5,5,5 · c 2,2,6,6,6
  const deal = [3, 3, 6, 6, 6, 3, 1, 5, 5, 5, 2, 2, 6, 6, 6]
  const extra = [1, 1, 1, 1, /* a: */ 3, 3, 3, /* c: */ 5, 5, 5]

  test('the caller sets the pace; the others catch up in order; highest score loses', () => {
    let g = called('tres-away', deal, extra)
    expect(g.phase).toMatchObject({ kind: 'tresAway', pacer: 'a', turn: 'a' })
    expect(() =>
      applyAction(g, { type: 'putOut', player: 'b', dice: [0] })
    ).toThrow(/turn/)

    // a puts out two 3s; everyone must match two dice out, and no more
    g = applyAction(g, { type: 'putOut', player: 'a', dice: [0, 1] })
    expect(g.phase).toMatchObject({ turn: 'b' })
    expect(() =>
      applyAction(g, { type: 'putOut', player: 'b', dice: [0, 1, 2] })
    ).toThrow(/no more than 2/)

    // b puts out one 3, then rolls the rest and must put out again before rolling
    g = applyAction(g, { type: 'putOut', player: 'b', dice: [0] })
    expect(g.phase).toMatchObject({ turn: 'b' })
    g = applyAction(g, { type: 'roll', player: 'b' })
    expect(g.dice.b).toEqual([3, 1, 1, 1, 1])
    expect(() => applyAction(g, { type: 'roll', player: 'b' })).toThrow(
      /Put out/
    )
    expect(() =>
      applyAction(g, { type: 'putOut', player: 'b', dice: [1, 2] })
    ).toThrow(/no more than 1/)
    g = applyAction(g, { type: 'putOut', player: 'b', dice: [1] })
    expect(g.phase).toMatchObject({ turn: 'c' })

    g = applyAction(g, { type: 'putOut', player: 'c', dice: [0, 1] })
    expect(g.phase).toMatchObject({ turn: 'a' }) // everyone has matched; the caller goes again

    g = play(
      g,
      { type: 'roll', player: 'a' },
      { type: 'putOut', player: 'a', dice: [2, 3, 4] }
    )
    expect(g.phase).toMatchObject({ turn: 'b' })
    // b's dice in hand (1, 1, 1) can go out without rolling again
    g = applyAction(g, { type: 'putOut', player: 'b', dice: [2, 3, 4] })
    expect(g.phase).toMatchObject({ turn: 'c' })
    expect(g.dice.b).toEqual([3, 1, 1, 1, 1])

    g = play(
      g,
      { type: 'roll', player: 'c' },
      { type: 'putOut', player: 'c', dice: [2, 3, 4] }
    )
    // a 0 · b 4 · c 19
    expect(g.phase).toMatchObject({ kind: 'roundOver', loser: 'c' })
  })

  test('the caller may put out from hand on a later turn without rolling', () => {
    let g = called('tres-away', deal, extra)
    g = play(
      g,
      { type: 'putOut', player: 'a', dice: [0] },
      { type: 'putOut', player: 'b', dice: [0] },
      { type: 'putOut', player: 'c', dice: [0] }
    )
    expect(g.phase).toMatchObject({ turn: 'a' })
    g = applyAction(g, { type: 'putOut', player: 'a', dice: [1] })
    expect(g.dice.a).toEqual([3, 3, 6, 6, 6])
    expect(g.phase).toMatchObject({ turn: 'b' })
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

  test('the Boss may pick up any dice, but not ones that would make someone else the Boss (§3.3)', () => {
    // Full house 6-6-6-2-2: picking up the 2s leaves three 6s
    expect(bossKeepProblem([6, 6, 6], [[5, 5, 5, 1, 2], [4, 4, 3, 1, 2]])).toBeNull()
    expect(bossKeepProblem([6, 6, 6], [[3, 3, 3, 4, 4]])).toMatch(/someone else the Boss/)
    // Matching another hand isn't beating it: no kickers on the kept dice
    expect(bossKeepProblem([6, 6], [[6, 6, 2, 1, 3]])).not.toBeNull()
    expect(bossKeepProblem([], [[1, 2, 3, 4, 6]])).not.toBeNull()
  })

  test('the best hand is Boss and keeps a hand that still beats the table; others come up in order; the worst hand loses', () => {
    let g = called('boss', deal, [1, 1, 2, /* c: */ 2, 2, 2, 3, 3])
    expect(g.phase).toMatchObject({
      kind: 'boss',
      boss: 'a',
      stage: 'bossRoll',
      bossDice: [0, 1],
    })
    expect(() =>
      applyAction(g, { type: 'reroll', player: 'a', keep: [0] })
    ).toThrow(/someone else the Boss/)

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

  test('a tie for the best hand in a replay: no Boss, no loser, the Hammer passes left (ruled 2026-10-29)', () => {
    // a's full house is Boss; b and c both hold 5-4-3-2-1
    const tied = [6, 6, 6, 2, 2, 5, 4, 3, 2, 1, 5, 4, 3, 2, 1]
    // the replay's fresh rolls: b and c both a pair of 6s with 3-2-1
    let g = called('boss', tied, [6, 6, 1, 2, 3, 6, 6, 2, 1, 3])
    g = play(
      g,
      { type: 'stand', player: 'a' },
      { type: 'comeUp', player: 'a' },
      { type: 'stand', player: 'b' },
      { type: 'stand', player: 'c' }
    )
    // b and c tie for the worst hand and replay; they tie again for the best
    expect(g.phase).toMatchObject({ kind: 'roundOver', loser: null })
    expect(g.hammer).toBe('b')
    expect(g.log.slice(-2)).toEqual([
      { type: 'noBoss', players: ['b', 'c'] },
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
