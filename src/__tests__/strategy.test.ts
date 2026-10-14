/**
 * Strategy on the engine (src/strategy): exact make odds, bots, simulations.
 */
import {
  Dice,
  GameState,
  KICKER_GAMES,
  applyAction,
  createGame,
  makesGame,
  seeded,
} from '../engine'
import {
  ALL_CALLS,
  botAction,
  bestKeepToMake,
  chooseCall,
  diceSumDistribution,
  rollOrTakeTie,
  makeChance,
  simulateHammer,
  simulateRefusal,
} from '../strategy'

const allRolls = (n: number): Dice[] => {
  const out: Dice[] = []
  for (let i = 0; i < Math.pow(6, n); i++) {
    out.push(
      Array.from(
        { length: n },
        (_, d) => (Math.floor(i / Math.pow(6, d)) % 6) + 1
      ) as Dice
    )
  }
  return out
}

/** Brute force: best chance of making `game` with one re-roll, over every keep */
function bruteOneReroll(
  dice: Dice,
  game: (typeof KICKER_GAMES)[number]
): number {
  if (makesGame(dice, game)) return 1
  let best = 0
  for (let mask = 0; mask < 31; mask++) {
    const keep = [0, 1, 2, 3, 4].filter((i) => mask & (1 << i))
    const rerolled = [0, 1, 2, 3, 4].filter((i) => !keep.includes(i))
    const outcomes = allRolls(rerolled.length)
    const made = outcomes.filter((o) => {
      const d = [...dice]
      rerolled.forEach((i, j) => (d[i] = o[j]))
      return makesGame(d, game)
    }).length
    best = Math.max(best, made / outcomes.length)
  }
  return best
}

describe('exact make odds', () => {
  test('already made is 1; no rolls left on a miss is 0', () => {
    expect(makeChance([1, 3, 6, 2, 2], '10-3', 0)).toBe(1)
    expect(makeChance([1, 1, 2, 2, 6], 'ship-captain-crew', 0)).toBe(0)
  })

  test.each([...KICKER_GAMES])(
    '%s: one re-roll matches brute force over every keep',
    (game) => {
      for (const dice of [
        [1, 1, 2, 2, 6],
        [6, 6, 6, 6, 5],
        [2, 2, 4, 5, 1],
        [1, 2, 4, 6, 6],
      ] as Dice[]) {
        expect(makeChance(dice, game, 1)).toBeCloseTo(
          bruteOneReroll(dice, game),
          10
        )
      }
    }
  )

  test('more rolls never lower the chance', () => {
    const dice: Dice = [1, 1, 2, 2, 6]
    for (const game of KICKER_GAMES) {
      expect(makeChance(dice, game, 2)).toBeGreaterThanOrEqual(
        makeChance(dice, game, 1)
      )
    }
  })

  test('the best keep holds on to useful dice', () => {
    // Going for Ship Captain Crew with 1-2-6-6-5: keep 6 and 5 (two of 4-5-6) or 1-2 (two of 1-2-3)
    const keep = bestKeepToMake([1, 2, 6, 6, 5], 'ship-captain-crew', 2)
    expect(keep).toHaveLength(2)
  })
})

describe('bots', () => {
  test('a bot Hammer calls the obvious game', () => {
    expect(chooseCall([3, 3, 3, 3, 3])).toEqual({ game: 'tres-away' })
    expect(chooseCall([6, 6, 6, 6, 6])).toEqual({ game: 'razzle' })
    // a second call never repeats the refused game
    expect(chooseCall([3, 3, 3, 3, 3], 'tres-away').game).not.toBe('tres-away')
  })

  test('bots play 300 full games to the end with legal moves', () => {
    for (let i = 0; i < 300; i++) {
      const n = 2 + (i % 7)
      let g: GameState = createGame({
        players: 'abcdefgh'
          .slice(0, n)
          .split('')
          .map((id) => ({ id, name: id })),
        source: seeded(i),
      })
      let steps = 0
      while (g.phase.kind !== 'gameOver') {
        g = applyAction(g, botAction(g))
        expect(++steps).toBeLessThan(20000)
      }
    }
  })
})

describe('simulations', () => {
  test('the Hammer gets an estimate for every call, best first, reproducibly', () => {
    const a = simulateHammer({ dice: [1, 3, 6, 5, 5], samples: 60, seed: 3 })
    const b = simulateHammer({ dice: [1, 3, 6, 5, 5], samples: 60, seed: 3 })
    expect(a).toEqual(b)
    expect(a).toHaveLength(ALL_CALLS.length)
    a.slice(1).forEach((o, i) =>
      expect(o.pencil).toBeGreaterThanOrEqual(a[i].pencil)
    )
  })

  test('unbeatable hands make the safest call', () => {
    // Not 0%: the refusers can refuse, forcing a second call in another game
    expect(
      simulateHammer({ dice: [3, 3, 3, 3, 3], samples: 60 })[0].call
    ).toEqual({ game: 'tres-away' })
    expect(
      simulateHammer({ dice: [6, 6, 6, 6, 6], samples: 60 })[0].pencil
    ).toBeLessThan(0.1)
  })

  test('a refuser holding a great hand for the call should accept', () => {
    // Five 3s vs. a Tres Away call: can't lose by accepting
    const r = simulateRefusal({
      dice: [3, 3, 3, 3, 3],
      call: { game: 'tres-away' },
      position: 1,
      samples: 100,
    })
    expect(r.accept.pencil).toBe(0)
    expect(r.refuse.pencil).toBeGreaterThan(0)
    expect(r.secondCalls.every((sc) => sc.call.game !== 'tres-away')).toBe(true)
  })

  test('as 2nd refusal, refusing always leads to a second call', () => {
    const r = simulateRefusal({
      dice: [1, 2, 4, 5, 6],
      call: { game: 'pairs', variant: 'high' },
      position: 2,
      samples: 80,
    })
    const share = r.secondCalls.reduce((s, sc) => s + sc.share, 0)
    expect(share).toBeCloseTo(1, 10)
  })
})

describe('take the tie or roll', () => {
  test('kicker sums are exact', () => {
    const d = diceSumDistribution(3)
    expect(d.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 12)
    expect(d[3]).toBeCloseTo(1 / 216, 12)
    expect(d[10]).toBeCloseTo(27 / 216, 12)
  })

  test('weak tied kickers favor rolling; strong ones favor the tie', () => {
    // 10-2 High tied at 5 with three kickers: almost any roll beats it
    expect(
      rollOrTakeTie({ kickers: 3, variant: 'high', total: 5, tied: 2 }).choice
    ).toBe('roll')
    // 10-3 Low tied at 3 (1+2): hard to beat
    expect(
      rollOrTakeTie({ kickers: 2, variant: 'low', total: 3, tied: 2 }).choice
    ).toBe('tie')
    // a three-way tie loses only a third of the time, so rolling must be better than that
    const three = rollOrTakeTie({
      kickers: 2,
      variant: 'high',
      total: 7,
      tied: 3,
    })
    expect(three.loseIfTie).toBeCloseTo(1 / 3, 12)
  })

  test('with two players left a tie costs nothing, so take it', () => {
    const odds = rollOrTakeTie({
      kickers: 3,
      variant: 'high',
      total: 5,
      tied: 2,
      twoPlayerTable: true,
    })
    expect(odds.loseIfTie).toBe(0)
    expect(odds.choice).toBe('tie')
  })
})
