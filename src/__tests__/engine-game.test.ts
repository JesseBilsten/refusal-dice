/**
 * Full-game state machine (docs/RULES.md §2, §4).
 * Scripted dice make every scenario exact; seeded random games check that
 * play always terminates and never breaks an invariant.
 */
import {
  Action,
  Dice,
  EngineError,
  GameState,
  KICKER_GAMES,
  SPECIALTY_GAMES,
  isKickerGame,
  keepsKickers,
  activeSeats,
  applyAction,
  wouldLoseIfStopped,
  createGame,
  refusalSeats,
  scripted,
  seeded,
  viewFor,
} from '../engine'

const players = (...ids: string[]) =>
  ids.map((id) => ({ id, name: id.toUpperCase() }))

/** Apply a sequence of actions */
const play = (state: GameState, ...actions: Action[]) =>
  actions.reduce(applyAction, state)

const dice = (state: GameState, id: string): Dice => state.dice[id]

describe('setup', () => {
  test('deals 5 hidden dice to everyone, seat order', () => {
    const g = createGame({
      players: players('a', 'b', 'c'),
      hammer: 'a',
      source: scripted([1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3]),
    })
    expect(g.dice).toEqual({
      a: [1, 1, 1, 1, 1],
      b: [2, 2, 2, 2, 2],
      c: [3, 3, 3, 3, 3],
    })
    expect(g.phase).toEqual({ kind: 'call' })
  })

  test('the piddle gives the Hammer to the highest die, re-rolling ties', () => {
    // piddle: a5 b6 c6 → b and c re-roll: b2 c4 → c; then deal 15 dice
    const g = createGame({
      players: players('a', 'b', 'c'),
      source: scripted([5, 6, 6, 2, 4, ...Array(15).fill(1)]),
    })
    expect(g.hammer).toBe('c')
  })

  test('2–8 players with unique ids', () => {
    expect(() =>
      createGame({ players: players('a'), source: seeded(1) })
    ).toThrow(EngineError)
    expect(() =>
      createGame({ players: players('a', 'a'), source: seeded(1) })
    ).toThrow(/unique/)
  })
})

describe('call and refusal (§2)', () => {
  const deal3 = (extra: number[] = []) =>
    createGame({
      players: players('a', 'b', 'c', 'd'),
      hammer: 'a',
      source: scripted([...Array(20).fill(1), ...extra]),
    })

  test('refusal seats are the next two players to the Hammer’s left', () => {
    expect(refusalSeats(deal3())).toEqual({ first: 'b', second: 'c' })
  })

  test('1st refusal accepting starts play for everyone', () => {
    const g = play(
      deal3(),
      { type: 'call', player: 'a', call: { game: '10-2', variant: 'high' } },
      { type: 'accept', player: 'b' }
    )
    expect(g.phase.kind).toBe('play')
    if (g.phase.kind === 'play')
      expect(Object.keys(g.phase.rolling)).toEqual(['a', 'b', 'c', 'd'])
  })

  test('1st refuses, 2nd accepts: everyone plays, and nobody re-rolls automatically', () => {
    const before = deal3()
    const g = play(
      before,
      { type: 'call', player: 'a', call: { game: '10-2', variant: 'high' } },
      { type: 'refuse', player: 'b' },
      { type: 'accept', player: 'c' }
    )
    expect(g.phase.kind).toBe('play')
    expect(g.dice).toEqual(before.dice)
  })

  test('both refuse: the Hammer must call a different game; the initial roll still counts', () => {
    let g = play(
      deal3(),
      { type: 'call', player: 'a', call: { game: 'monterey', variant: 'low' } },
      { type: 'refuse', player: 'b' },
      { type: 'refuse', player: 'c' }
    )
    expect(g.phase.kind).toBe('secondCall')
    expect(() =>
      applyAction(g, {
        type: 'call',
        player: 'a',
        call: { game: 'monterey', variant: 'high' },
      })
    ).toThrow(/different game/)
    g = applyAction(g, {
      type: 'call',
      player: 'a',
      call: { game: 'pairs', variant: 'high' },
    })
    expect(g.phase.kind).toBe('play')
    if (g.phase.kind === 'play') expect(g.phase.rolling.b.rollsUsed).toBe(1)
  })

  test('only the right player may act', () => {
    const g = deal3()
    expect(() =>
      applyAction(g, {
        type: 'call',
        player: 'b',
        call: { game: '10-2', variant: 'high' },
      })
    ).toThrow(/not b's turn/)
    const called = applyAction(g, {
      type: 'call',
      player: 'a',
      call: { game: '10-2', variant: 'high' },
    })
    expect(() => applyAction(called, { type: 'accept', player: 'c' })).toThrow(
      /not c's turn/
    )
  })

  test('kicker games need a variant; unknown games are rejected', () => {
    const g = deal3()
    expect(() =>
      applyAction(g, { type: 'call', player: 'a', call: { game: '10-2' } })
    ).toThrow(/variant/)
    expect(() =>
      applyAction(g, {
        type: 'call',
        player: 'a',
        call: { game: 'yahtzee' as never },
      })
    ).toThrow(/Unknown/)
  })

  test('with two players there is no 2nd refusal', () => {
    let g = createGame({
      players: players('a', 'b'),
      hammer: 'a',
      source: scripted(Array(10).fill(1)),
    })
    expect(refusalSeats(g)).toEqual({ first: 'b' })
    g = play(
      g,
      { type: 'call', player: 'a', call: { game: '10-2', variant: 'high' } },
      { type: 'refuse', player: 'b' }
    )
    expect(g.phase.kind).toBe('secondCall')
  })

  test('barking passes the Hammer left and everyone rolls fresh', () => {
    const g = applyAction(deal3(Array(20).fill(2)), {
      type: 'bark',
      player: 'a',
    })
    expect(g.hammer).toBe('b')
    expect(g.phase).toEqual({ kind: 'call' })
    expect(dice(g, 'a')).toEqual([2, 2, 2, 2, 2])
  })

  test('barking can be turned off by house rules', () => {
    const g = createGame({
      players: players('a', 'b', 'c'),
      hammer: 'a',
      rules: { barking: false },
      source: scripted(Array(15).fill(1)),
    })
    expect(() => applyAction(g, { type: 'bark', player: 'a' })).toThrow(
      /Barking is off/
    )
  })
})

describe('playing and scoring (§3.1, §4)', () => {
  // a: 10-2 with kickers 6+6+5 = 17; b: 5+5 with 1+1+2 = 4; c: no 10-2 yet
  const start = (extra: number[] = []) =>
    play(
      createGame({
        players: players('a', 'b', 'c'),
        hammer: 'a',
        source: scripted([
          4,
          6,
          6,
          6,
          5,
          5,
          5,
          1,
          1,
          2,
          1,
          2,
          3,
          4,
          1,
          ...extra,
        ]),
      }),
      { type: 'call', player: 'a', call: { game: '10-2', variant: 'high' } },
      { type: 'accept', player: 'b' }
    )

  test('re-rolling keeps the chosen dice in place', () => {
    const g = applyAction(start([6, 1, 1, 1]), {
      type: 'reroll',
      player: 'c',
      keep: [3],
    })
    expect(dice(g, 'c')).toEqual([6, 1, 1, 4, 1])
  })

  test('worst kicker takes a pencil and the Hammer', () => {
    const g = play(
      start([6, 1, 1, 1, 1, 1, 1]),
      { type: 'stand', player: 'a' },
      { type: 'stand', player: 'b' },
      { type: 'reroll', player: 'c', keep: [3] }, // 6+4 = 10, kickers 1+1+1 = 3
      // c is the lowest hand with a roll left, so c rolls the kickers and stays at 3
      { type: 'reroll', player: 'c', keep: [0, 3] }
    )
    expect(g.phase).toMatchObject({ kind: 'roundOver', loser: 'c' })
    expect(g.hammer).toBe('c')
    expect(g.seats.find((s) => s.id === 'c')!.pencils).toBe(1)
  })

  test('a player is done after 3 rolls', () => {
    const g = play(
      start([1, 1, 1, 1, 1, 1, 1, 1, 1, 1]),
      { type: 'reroll', player: 'c', keep: [] },
      { type: 'reroll', player: 'c', keep: [] }
    )
    expect(() =>
      applyAction(g, { type: 'reroll', player: 'c', keep: [] })
    ).toThrow(/already done/)
  })

  test('a player may pick up dice that already made the game (no rule against it)', () => {
    const g = applyAction(start([1, 1, 1, 1, 1]), {
      type: 'reroll',
      player: 'a',
      keep: [],
    })
    expect(dice(g, 'a')).toEqual([1, 1, 1, 1, 1])
  })

  test('two players miss: they cycle with fresh rolls while the maker is safe', () => {
    // b re-rolls everything into a miss; c stands on a miss → b and c cycle
    const g = play(
      start([
        1,
        1,
        1,
        1,
        1,
        /* cycle: */ 4,
        6,
        1,
        1,
        1,
        2,
        2,
        2,
        2,
        2,
        /* c's re-rolls: */ ...Array(10).fill(2),
      ]),
      { type: 'stand', player: 'a' },
      { type: 'reroll', player: 'b', keep: [] },
      { type: 'stand', player: 'b' },
      { type: 'stand', player: 'c' }
    )
    expect(g.phase.kind).toBe('play')
    if (g.phase.kind !== 'play') return
    expect(Object.keys(g.phase.rolling)).toEqual(['b', 'c'])
    expect(g.phase.cycle).toBe(1)
    expect(dice(g, 'b')).toEqual([4, 6, 1, 1, 1])
    expect(g.log.at(-1)).toEqual({
      type: 'cycle',
      players: ['b', 'c'],
      reason: 'missed',
    })

    // In the cycle, b makes it and c misses; c can't stand on a miss, rolls twice more and loses
    const end = play(
      g,
      { type: 'stand', player: 'b' },
      { type: 'reroll', player: 'c', keep: [] },
      { type: 'reroll', player: 'c', keep: [] }
    )
    expect(end.phase).toMatchObject({ kind: 'roundOver', loser: 'c' })
  })

  test('no standing at the bottom: with everyone else finished, the lowest hand rolls; level with it, you may take the tie', () => {
    // a 17, b 4; c re-rolls into 6+4 = 10 with kickers 1+1+1 = 3, the lowest
    const g = play(
      start([6, 1, 1, 1]),
      { type: 'stand', player: 'a' },
      { type: 'stand', player: 'b' },
      { type: 'reroll', player: 'c', keep: [3] }
    )
    expect(() => applyAction(g, { type: 'stand', player: 'c' })).toThrow(
      /lowest hand/
    )
    // While anyone else is still rolling, standing is allowed (the lowest hand isn't known yet)
    const early = play(start([6, 1, 1, 1]), {
      type: 'reroll',
      player: 'c',
      keep: [3],
    })
    expect(() =>
      applyAction(early, { type: 'stand', player: 'c' })
    ).not.toThrow()
  })

  test('kickers are rolled together: once the kept dice make the game, every other die is re-rolled', () => {
    // a has 4,6 (10-2) + 6,6,5: keeping a kicker is not allowed
    const g = start([1, 2, 3])
    expect(() =>
      applyAction(g, { type: 'reroll', player: 'a', keep: [0, 1, 2] })
    ).toThrow(/rolled together/)
    expect(() =>
      applyAction(g, { type: 'reroll', player: 'a', keep: [0, 1, 2, 3, 4] })
    ).toThrow(/rolled together/)
    // keeping just the game dice re-rolls all three kickers
    const next = applyAction(g, { type: 'reroll', player: 'a', keep: [0, 1] })
    expect(dice(next, 'a')).toEqual([4, 6, 1, 2, 3])
    // breaking up the game is still allowed, and so is keeping dice toward a game you haven't made
    expect(() =>
      applyAction(g, { type: 'reroll', player: 'a', keep: [1, 2] })
    ).not.toThrow()
    expect(() =>
      applyAction(g, { type: 'reroll', player: 'c', keep: [3, 0] })
    ).not.toThrow()
  })

  test('a tie for worst kicker replays the same call (3+ players)', () => {
    // c re-rolls to 4,6 + 1,1,2 = 4, tying b's 4
    const g = play(
      start([6, 1, 2, 1, /* tie replay: */ ...Array(10).fill(5)]),
      { type: 'stand', player: 'a' },
      { type: 'stand', player: 'b' },
      { type: 'reroll', player: 'c', keep: [3] },
      { type: 'stand', player: 'c' }
    )
    expect(g.phase).toMatchObject({
      kind: 'play',
      call: { game: '10-2', variant: 'high' },
    })
    expect(g.log.at(-1)).toEqual({
      type: 'cycle',
      players: ['b', 'c'],
      reason: 'tie',
    })
  })

  test('with two players left, a tie takes no pencil and the Hammer passes', () => {
    const g = play(
      createGame({
        players: players('a', 'b'),
        hammer: 'a',
        source: scripted([4, 6, 1, 1, 2, 5, 5, 1, 1, 2]),
      }),
      { type: 'call', player: 'a', call: { game: '10-2', variant: 'high' } },
      { type: 'accept', player: 'b' },
      { type: 'stand', player: 'a' },
      { type: 'stand', player: 'b' }
    )
    expect(g.phase).toMatchObject({ kind: 'roundOver', loser: null })
    expect(g.hammer).toBe('b')
    expect(g.seats.every((s) => s.pencils === 0)).toBe(true)
  })

  test('with two players left, both missing takes no pencil and the Hammer passes', () => {
    const g = play(
      createGame({
        players: players('a', 'b'),
        hammer: 'a',
        source: scripted([1, 1, 1, 1, 1, 2, 2, 2, 2, 2]),
      }),
      { type: 'call', player: 'a', call: { game: '10-2', variant: 'high' } },
      { type: 'accept', player: 'b' },
      { type: 'stand', player: 'a' },
      { type: 'stand', player: 'b' }
    )
    expect(g.phase).toMatchObject({ kind: 'roundOver', loser: null })
    expect(g.log.at(-1)).toEqual({
      type: 'noPencil',
      reason: 'two-player-miss',
    })
    expect(g.hammer).toBe('b')
    expect(g.seats.every((s) => s.pencils === 0)).toBe(true)
  })

  test('out after the last pencil; the Hammer skips them; last player standing wins', () => {
    let g = createGame({
      players: players('a', 'b', 'c'),
      hammer: 'a',
      rules: { pencilsToLose: 1 },
      source: scripted([
        // round 1: c misses 10-2, and misses again on both re-rolls
        4,
        6,
        1,
        1,
        1,
        5,
        5,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        2,
        ...Array(10).fill(1),
        // round 2 deal (a, b): b misses, twice more
        4,
        6,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        2,
        ...Array(10).fill(1),
      ]),
    })
    g = play(
      g,
      { type: 'call', player: 'a', call: { game: '10-2', variant: 'high' } },
      { type: 'accept', player: 'b' },
      { type: 'stand', player: 'a' },
      { type: 'stand', player: 'b' },
      { type: 'reroll', player: 'c', keep: [] },
      { type: 'reroll', player: 'c', keep: [] }
    )
    expect(g.phase).toMatchObject({ kind: 'roundOver', loser: 'c' })
    expect(g.hammer).toBe('a') // c is out, so the Hammer passes to their left
    g = applyAction(g, { type: 'nextRound' })
    expect(Object.keys(g.dice)).toContain('c')
    expect(activeSeats(g).map((s) => s.id)).toEqual(['a', 'b'])
    g = play(
      g,
      { type: 'call', player: 'a', call: { game: '10-2', variant: 'high' } },
      { type: 'accept', player: 'b' },
      { type: 'stand', player: 'a' },
      { type: 'reroll', player: 'b', keep: [] },
      { type: 'reroll', player: 'b', keep: [] }
    )
    expect(g.phase).toEqual({ kind: 'gameOver', winner: 'a' })
    expect(() => applyAction(g, { type: 'nextRound' })).toThrow(/over/)
  })
})

describe('player views', () => {
  test('other players’ initial rolls are hidden until play starts', () => {
    let g = createGame({
      players: players('a', 'b', 'c'),
      hammer: 'a',
      source: seeded(7),
    })
    const v = viewFor(g, 'b')
    expect(v.dice.b).toEqual(g.dice.b)
    expect(v.dice.a).toBeNull()
    expect(v).not.toHaveProperty('source')

    g = play(
      g,
      { type: 'call', player: 'a', call: { game: 'pairs', variant: 'low' } },
      { type: 'accept', player: 'b' }
    )
    expect(viewFor(g, 'b').dice.a).toEqual(g.dice.a)
  })
})

describe('random games always finish and keep invariants', () => {
  /** A legal (if not smart) move for whoever must act */
  function randomAction(g: GameState, r: () => number): Action {
    const pick = <T>(xs: readonly T[]) => xs[Math.floor(r() * xs.length)]
    const call = () =>
      r() < 0.3
        ? { game: pick(SPECIALTY_GAMES) }
        : { game: pick(KICKER_GAMES), variant: pick(['high', 'low'] as const) }
    const someOf = (xs: number[]) => xs.filter(() => r() < 0.5)
    switch (g.phase.kind) {
      case 'call':
        return r() < 0.1
          ? { type: 'bark', player: g.hammer }
          : { type: 'call', player: g.hammer, call: call() }
      case 'refusal': {
        const seats = refusalSeats(g)
        const player = g.phase.seat === 1 ? seats.first : seats.second!
        return { type: r() < 0.5 ? 'accept' : 'refuse', player }
      }
      case 'secondCall': {
        const refused = g.phase.refused.game
        let c = call()
        while (c.game === refused) c = call()
        return { type: 'call', player: g.hammer, call: c }
      }
      case 'play': {
        const rolling = g.phase.rolling
        const id = pick(Object.keys(rolling).filter((p) => !rolling[p].done))
        if (r() < 0.4 && !wouldLoseIfStopped(g, id))
          return { type: 'stand', player: id }
        let keep = [0, 1, 2, 3, 4].filter(() => r() < 0.5)
        const game = g.phase.call.game
        // Kickers are rolled together: a keep that makes the game can't hold extra dice
        if (
          isKickerGame(game) &&
          keepsKickers(
            keep.map((i) => g.dice[id][i]),
            game
          )
        )
          keep = []
        return { type: 'reroll', player: id, keep }
      }
      case 'tresAway': {
        const { turn, hands } = g.phase
        if (!hands[turn].fresh) return { type: 'roll', player: turn }
        const inHand = [0, 1, 2, 3, 4].filter(
          (i) => !hands[turn].out.includes(i)
        )
        const out = someOf(inHand)
        return {
          type: 'putOut',
          player: turn,
          dice: out.length ? out : [pick(inHand)],
        }
      }
      case 'boss': {
        const { boss, stage, mustKeep, waiting } = g.phase
        if (stage === 'bossRoll') {
          return r() < 0.2
            ? { type: 'stand', player: boss }
            : {
                type: 'reroll',
                player: boss,
                keep: [...new Set([...mustKeep, ...someOf([0, 1, 2, 3, 4])])],
              }
        }
        if (stage === 'decide')
          return { type: r() < 0.8 ? 'comeUp' : 'dontComeUp', player: boss }
        return r() < 0.2
          ? { type: 'stand', player: waiting[0] }
          : {
              type: 'reroll',
              player: waiting[0],
              keep: someOf([0, 1, 2, 3, 4]),
            }
      }
      case 'roundOver':
        return { type: 'nextRound' }
      default:
        throw new Error('no action')
    }
  }

  test('2,000 seeded games across 2–8 players', () => {
    let seed = 1
    const r = () =>
      (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648
    for (let game = 0; game < 2000; game++) {
      const n = 2 + (game % 7)
      let g = createGame({
        players: players(...'abcdefgh'.slice(0, n).split('')),
        source: seeded(game),
      })
      let steps = 0
      while (g.phase.kind !== 'gameOver') {
        g = applyAction(g, randomAction(g, r))
        expect(++steps).toBeLessThan(20000)
        g.seats.forEach((s) =>
          expect(s.pencils).toBeLessThanOrEqual(g.rules.pencilsToLose)
        )
        expect(g.seats.find((s) => s.id === g.hammer)!.out).toBe(false)
      }
      expect(activeSeats(g)).toHaveLength(1)
      expect(g.phase.winner).toBe(activeSeats(g)[0].id)
    }
  })
})
