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
  bottomTarget,
  bottomTurn,
  wouldLoseIfStopped,
  createGame,
  refusalSeats,
  scripted,
  seeded,
  standings,
  tresAwayMaxPutOut,
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
    // Every piddle roll is logged so the table can see the ranking
    expect(g.log[0]).toEqual({
      type: 'piddle',
      rounds: [
        [
          { player: 'a', die: 5 },
          { player: 'b', die: 6 },
          { player: 'c', die: 6 },
        ],
        [
          { player: 'b', die: 2 },
          { player: 'c', die: 4 },
        ],
      ],
    })
    expect(g.log[1]).toEqual({ type: 'hammer', player: 'c' })
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

  test('the worst hand rolls first; nobody else can roll', () => {
    const g = start()
    // c alone missed 10-2
    expect(bottomTurn(g)).toBe('c')
    expect(() =>
      applyAction(g, { type: 'reroll', player: 'a', keep: [0, 1] })
    ).toThrow(/c's turn/)
    expect(() => applyAction(g, { type: 'stand', player: 'b' })).toThrow(
      /c's turn/
    )
  })

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
      { type: 'reroll', player: 'c', keep: [3] }, // 6+4 = 10, kickers 1+1+1 = 3
      // still the worst hand, so c rolls the kickers again and stays at 3
      { type: 'reroll', player: 'c', keep: [0, 3] }
    )
    expect(g.phase).toMatchObject({ kind: 'roundOver', loser: 'c' })
    expect(g.hammer).toBe('c')
    expect(g.seats.find((s) => s.id === 'c')!.pencils).toBe(1)
  })

  test('out of rolls at the bottom: the worst hand loses, and nobody else rolls', () => {
    const g = play(
      start([1, 1, 1, 1, 1, 1, 1, 1, 1, 1]),
      { type: 'reroll', player: 'c', keep: [] },
      { type: 'reroll', player: 'c', keep: [] }
    )
    expect(g.phase).toMatchObject({ kind: 'roundOver', loser: 'c' })
    expect(g.log.filter((e) => e.type === 'rolled')).toHaveLength(2)
  })

  test('climbing off the bottom hands the roll to the new worst hand', () => {
    // c makes 10-2 with kickers 6+6+6 = 18: now b (4) is the worst
    const g = applyAction(start([4, 6, 6, 6, 6]), {
      type: 'reroll',
      player: 'c',
      keep: [],
    })
    expect(dice(g, 'c')).toEqual([4, 6, 6, 6, 6])
    expect(bottomTurn(g)).toBe('b')
    expect(bottomTarget(g, 'b')).toBe('a')
  })

  test('a player may pick up dice that already made the game (no rule against it)', () => {
    const g = play(
      start([6, 1, 1, 1, 1, 1, 1, 1, 1]),
      { type: 'reroll', player: 'c', keep: [3] }, // made, kicker 3: still worst
      { type: 'reroll', player: 'c', keep: [] }
    )
    expect(dice(g, 'c')).toEqual([1, 1, 1, 1, 1])
  })

  test('two players miss: they cycle with fresh rolls while the maker is safe', () => {
    // a makes it; b and c both miss, so they're tied at the bottom
    const g0 = play(
      createGame({
        players: players('a', 'b', 'c'),
        hammer: 'a',
        source: scripted([
          ...[4, 6, 6, 6, 5],
          ...[1, 1, 1, 1, 2],
          ...[1, 2, 3, 4, 1],
          /* b, c and b re-roll and still miss: */ ...Array(15).fill(1),
          /* cycle: */ ...[4, 6, 1, 1, 1, 2, 2, 2, 2, 2],
          /* c's re-rolls: */ ...Array(10).fill(2),
        ]),
      }),
      { type: 'call', player: 'a', call: { game: '10-2', variant: 'high' } },
      { type: 'accept', player: 'b' }
    )
    // b, nearest the Hammer, rolls first, and can't take the tie while c can still roll
    expect(bottomTurn(g0)).toBe('b')
    expect(() => applyAction(g0, { type: 'stand', player: 'b' })).toThrow(
      /worst hand/
    )
    const g1 = applyAction(g0, { type: 'reroll', player: 'b', keep: [] })
    // Still tied: c has more rolls left, so c rolls before b rolls again
    expect(bottomTurn(g1)).toBe('c')
    const g = play(
      g1,
      { type: 'reroll', player: 'c', keep: [] },
      // Level on rolls again: b, nearest the Hammer, goes
      { type: 'reroll', player: 'b', keep: [] },
      // b is out of rolls and still level: c takes the tie
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

    // In the cycle, b makes it and c misses; c rolls twice more and loses
    expect(bottomTurn(g)).toBe('c')
    const end = play(
      g,
      { type: 'reroll', player: 'c', keep: [] },
      { type: 'reroll', player: 'c', keep: [] }
    )
    expect(end.phase).toMatchObject({ kind: 'roundOver', loser: 'c' })
  })

  test('no standing at the bottom: the worst hand rolls while it has rolls', () => {
    const g = start([6, 1, 1, 1])
    expect(wouldLoseIfStopped(g, 'c')).toBe(true)
    expect(() => applyAction(g, { type: 'stand', player: 'c' })).toThrow(
      /worst hand/
    )
    // c makes it, but kickers 1+1+1 = 3 are still the worst
    const made = applyAction(g, { type: 'reroll', player: 'c', keep: [3] })
    expect(() => applyAction(made, { type: 'stand', player: 'c' })).toThrow(
      /worst hand/
    )
  })

  test('kickers are rolled together: once the kept dice make the game, every other die is re-rolled', () => {
    // c rolls into 6+4 (10-2) with kickers 1, 1, 1
    const g = applyAction(start([6, 1, 1, 1, 1, 2, 3]), {
      type: 'reroll',
      player: 'c',
      keep: [3],
    })
    expect(dice(g, 'c')).toEqual([6, 1, 1, 4, 1])
    expect(() =>
      applyAction(g, { type: 'reroll', player: 'c', keep: [0, 3, 1] })
    ).toThrow(/rolled together/)
    expect(() =>
      applyAction(g, { type: 'reroll', player: 'c', keep: [0, 1, 2, 3, 4] })
    ).toThrow(/rolled together/)
    // keeping just the game dice re-rolls all three kickers
    const next = applyAction(g, { type: 'reroll', player: 'c', keep: [0, 3] })
    expect(dice(next, 'c')).toEqual([6, 1, 2, 4, 3])
    // breaking up the game is still allowed, and so is keeping dice toward a game you haven't made
    expect(() =>
      applyAction(g, { type: 'reroll', player: 'c', keep: [1, 2] })
    ).not.toThrow()
    expect(() =>
      applyAction(start([1, 1, 1]), { type: 'reroll', player: 'c', keep: [3, 0] })
    ).not.toThrow()
  })

  test('a tie for worst kicker replays the same call (3+ players)', () => {
    const g = play(
      start([
        /* c: 6+4, kickers 1+2+1 = 4, tying b */ 6, 1, 2, 1,
        /* b stays at 4, twice */ 1, 1, 2, 2, 1, 1,
        /* tie replay: */ ...Array(10).fill(5),
      ]),
      { type: 'reroll', player: 'c', keep: [3] },
      // b is nearest the Hammer, so b rolls first
      { type: 'reroll', player: 'b', keep: [0, 1] },
      { type: 'reroll', player: 'b', keep: [0, 1] },
      // b is out of rolls: c may take the tie
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
        source: scripted([4, 6, 1, 1, 2, 5, 5, 1, 1, 2, 1, 1, 2, 2, 1, 1, 1, 2, 1]),
      }),
      { type: 'call', player: 'a', call: { game: '10-2', variant: 'high' } },
      { type: 'accept', player: 'b' },
      // tied at 4: a (the Hammer) rolls first, then b (more rolls left), then a; all stay level
      { type: 'reroll', player: 'a', keep: [0, 1] },
      { type: 'reroll', player: 'b', keep: [0, 1] },
      { type: 'reroll', player: 'a', keep: [0, 1] },
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
        source: scripted([1, 1, 1, 1, 1, 2, 2, 2, 2, 2, ...Array(15).fill(1)]),
      }),
      { type: 'call', player: 'a', call: { game: '10-2', variant: 'high' } },
      { type: 'accept', player: 'b' },
      { type: 'reroll', player: 'a', keep: [] },
      { type: 'reroll', player: 'b', keep: [] },
      { type: 'reroll', player: 'a', keep: [] },
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
        ...[4, 6, 1, 1, 1],
        ...[5, 5, 1, 1, 1],
        ...[1, 1, 1, 1, 2],
        ...Array(10).fill(1),
        // round 2 deal (a, b): b misses, twice more
        ...[4, 6, 1, 1, 1],
        ...[1, 1, 1, 1, 2],
        ...Array(10).fill(1),
      ]),
    })
    g = play(
      g,
      { type: 'call', player: 'a', call: { game: '10-2', variant: 'high' } },
      { type: 'accept', player: 'b' },
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
        // Played from the bottom: only the worst hand rolls
        const id = bottomTurn(g)!
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
        const inHand = [0, 1, 2, 3, 4].filter(
          (i) => !hands[turn].out.includes(i)
        )
        // Not fresh: roll, or sometimes put out from hand without rolling
        if (!hands[turn].fresh && r() < 0.7) return { type: 'roll', player: turn }
        const out = someOf(inHand).slice(0, tresAwayMaxPutOut(g.phase, turn))
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
      // Anyone marked safe ("in the cup") this round must not take the pencil
      let safe = new Set<string>()
      while (g.phase.kind !== 'gameOver') {
        const before = g.log.length
        g = applyAction(g, randomAction(g, r))
        g.log.slice(before).forEach((e) => {
          if (e.type === 'pencil' && safe.has(e.player))
            throw new Error(`${e.player} was in the cup but took the pencil`)
        })
        if (g.phase.kind === 'roundOver' || g.phase.kind === 'call') safe = new Set()
        standings(g).forEach((s) => s.status === 'safe' && safe.add(s.player))
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
