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
  simulateBark,
  simulateHammer,
  simulateRefusal,
  CALL_ODDS,
  CALL_ODDS_CALLS,
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
    // Five of a kind can't lose Boss
    expect(chooseCall([6, 6, 6, 6, 6])).toEqual({ game: 'boss' })
    // Three 3s: Boss, and Tres Away when Boss is refused (not Razzle)
    expect(chooseCall([3, 3, 3, 5, 6])).toEqual({ game: 'boss' })
    expect(chooseCall([3, 3, 3, 5, 6], 'boss')).toEqual({ game: 'tres-away' })
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
    // The paths split every round: shares add to 1 and share × pencil to the total
    a.forEach((o) => {
      expect(o.paths.reduce((s, p) => s + p.share, 0)).toBeCloseTo(1)
      expect(o.paths.reduce((s, p) => s + p.share * p.pencil, 0)).toBeCloseTo(o.pencil)
      const second = o.paths.find((p) => p.path === 'secondCall')
      if (second) expect(second.call!.game).not.toBe(o.call.game)
    })
  })

  test('a weak hand can call a decoy: refused, it makes its real game second', () => {
    // 12445 holds 10-3 Low; 10-4 Low is often refused, then 10-3 Low can't be
    const o = simulateHammer({ dice: [1, 2, 4, 4, 5], samples: 300 }).find(
      (x) => x.call.game === '10-4' && x.call.variant === 'low'
    )!
    const second = o.paths.find((p) => p.path === 'secondCall')!
    expect(second.call).toEqual({ game: '10-3', variant: 'low' })
    expect(second.share).toBeGreaterThan(0.25)
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

  test('barking leaves you in the worst seat: worse than an even share', () => {
    // You sit last, on the new Hammer's right, with random dice
    const bark = simulateBark({ players: 3, samples: 600 })
    expect(bark).toEqual(simulateBark({ players: 3, samples: 600 }))
    expect(bark.pencil).toBeGreaterThan(1 / 3)
    // Even a poor hand is better called than barked (22563: only a mediocre 10-3)
    expect(simulateHammer({ dice: [2, 2, 5, 6, 3], samples: 300 })[0].pencil).toBeLessThan(bark.pencil)
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

  test("refusing splits into the next refuser's choice and the second call", () => {
    const first = simulateRefusal({
      dice: [1, 2, 4, 5, 6],
      call: { game: '10-3', variant: 'high' },
      position: 1,
      players: 4,
      samples: 120,
    })
    // The paths cover every sample and add up to the refuse estimate
    expect(first.refusePaths.reduce((s, p) => s + p.share, 0)).toBeCloseTo(
      1,
      10
    )
    expect(
      first.refusePaths.reduce((s, p) => s + p.share * p.pencil, 0)
    ).toBeCloseTo(first.refuse.pencil, 10)
    // As 2nd refusal (or with 2 players) there's no one left to accept
    const second = simulateRefusal({
      dice: [1, 2, 4, 5, 6],
      call: { game: '10-3', variant: 'high' },
      position: 2,
      samples: 60,
    })
    expect(second.refusePaths.map((p) => p.path)).toEqual(['secondCall'])
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
      rollOrTakeTie({
        kickerDice: 3,
        rolls: 1,
        variant: 'high',
        total: 5,
        tied: 2,
      }).choice
    ).toBe('roll')
    // 10-3 Low tied at 3 (1+2): hard to beat
    expect(
      rollOrTakeTie({
        kickerDice: 2,
        rolls: 1,
        variant: 'low',
        total: 3,
        tied: 2,
      }).choice
    ).toBe('tie')
    // a three-way tie loses only a third of the time, so rolling must be better than that
    const three = rollOrTakeTie({
      kickerDice: 2,
      rolls: 1,
      variant: 'high',
      total: 7,
      tied: 3,
    })
    expect(three.loseIfTie).toBeCloseTo(1 / 3, 12)
  })

  test('more rolls never make rolling worse', () => {
    for (const total of [4, 7, 10]) {
      const one = rollOrTakeTie({
        kickerDice: 2,
        rolls: 1,
        variant: 'high',
        total,
        tied: 2,
      })
      const two = rollOrTakeTie({
        kickerDice: 2,
        rolls: 2,
        variant: 'high',
        total,
        tied: 2,
      })
      expect(two.loseIfRoll).toBeLessThanOrEqual(one.loseIfRoll)
      expect(two.loseIfLastRoll).toBeCloseTo(one.loseIfRoll, 12)
    }
  })

  test('with two players left a tie costs nothing, so take it', () => {
    const odds = rollOrTakeTie({
      kickerDice: 3,
      rolls: 1,
      variant: 'high',
      total: 5,
      tied: 2,
      twoPlayerTable: true,
    })
    expect(odds.loseIfTie).toBe(0)
    expect(odds.choice).toBe('tie')
  })
})

describe('call odds table', () => {
  test('covers every roll and call', () => {
    expect(CALL_ODDS_CALLS).toHaveLength(ALL_CALLS.length)
    expect(Object.keys(CALL_ODDS)).toHaveLength(252)
    Object.values(CALL_ODDS).forEach((row) => {
      expect(row).toHaveLength(ALL_CALLS.length)
      row.forEach((x) => expect(x >= 0 && x <= 1000).toBe(true))
    })
  })
})
