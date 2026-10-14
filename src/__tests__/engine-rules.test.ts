/**
 * Engine rules (docs/RULES.md §3.1, §4).
 */
import {
  Dice,
  KICKER_GAMES,
  evaluateKickerHand,
  makesGame,
  resolveKickerCycle,
  rollDice,
  scripted,
  seeded,
} from '../engine'

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { checkGame } = require('../lib/game-validation.js')
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { KICKER_GAME_IDS } = require('../lib/games-config.js')

const allRolls = (): Dice[] => {
  const out: Dice[] = []
  for (let i = 0; i < 7776; i++) {
    out.push([0, 1, 2, 3, 4].map((d) => (Math.floor(i / Math.pow(6, d)) % 6) + 1) as Dice)
  }
  return out
}

describe('kicker games', () => {
  test('engine game list matches games-config', () => {
    expect([...KICKER_GAMES]).toEqual(KICKER_GAME_IDS)
  })

  test.each([...KICKER_GAMES])('%s: makesGame agrees with checkGame on all 7,776 rolls', (game) => {
    for (const roll of allRolls()) {
      expect([roll.join(''), makesGame(roll, game)]).toEqual([roll.join(''), checkGame(roll, game)])
    }
  })

  test('kickers are the dice not used to make the game, as an additive total', () => {
    // 10-3 with 1+3+6: kickers 5+6 = 11
    const hand = evaluateKickerHand([1, 3, 6, 5, 6], '10-3', 'high')
    expect(hand).toMatchObject({ made: true, kickerTotal: 11 })
  })

  test('the best set of game dice is chosen for the variant', () => {
    // 7's from [1,6,3,4,5]: (1+6, 3+4) leaves a 5; (6+5, 3+4) leaves a 1
    expect(evaluateKickerHand([1, 6, 3, 4, 5], 'vegas', 'high')).toMatchObject({ made: true, kickerTotal: 5 })
    expect(evaluateKickerHand([1, 6, 3, 4, 5], 'vegas', 'low')).toMatchObject({ made: true, kickerTotal: 1 })
    // 10-2 from [4,6,5,5,2]: 4+6 leaves 5+5+2 = 12; 5+5 leaves 4+6+2 = 12
    expect(evaluateKickerHand([4, 6, 5, 5, 2], '10-2', 'high')).toMatchObject({ made: true, kickerTotal: 12 })
  })

  test('only kickers matter: the dice that made the game are ignored', () => {
    const a = evaluateKickerHand([6, 6, 5, 5, 3], 'pairs', 'high')
    const b = evaluateKickerHand([2, 2, 3, 3, 3], 'pairs', 'high')
    expect(a).toMatchObject({ kickerTotal: 3 })
    expect(b).toMatchObject({ kickerTotal: 3 })
  })

  test('a hand that misses has no kicker', () => {
    expect(evaluateKickerHand([1, 1, 2, 2, 6], 'ship-captain-crew', 'high')).toEqual({ made: false })
  })
})

describe('finding the loser of a cycle (§4)', () => {
  test('everyone made it: worst kicker total loses (High: lowest)', () => {
    const result = resolveKickerCycle(
      { a: [4, 6, 6, 6, 5], b: [5, 5, 1, 1, 2], c: [4, 6, 1, 1, 1] },
      '10-2',
      'high'
    )
    expect(result).toEqual({ kind: 'loser', loser: 'c' })
  })

  test('Low: highest kicker total loses', () => {
    const result = resolveKickerCycle(
      { a: [4, 6, 6, 6, 5], b: [5, 5, 1, 1, 2], c: [4, 6, 1, 1, 1] },
      '10-2',
      'low'
    )
    expect(result).toEqual({ kind: 'loser', loser: 'a' })
  })

  test('5+6 beats 5+5 because kickers add up', () => {
    const result = resolveKickerCycle({ a: [1, 3, 6, 5, 6], b: [1, 3, 6, 5, 5] }, '10-3', 'high')
    expect(result).toEqual({ kind: 'loser', loser: 'b' })
  })

  test('exactly one player misses: they lose, even with great dice', () => {
    const result = resolveKickerCycle(
      { a: [6, 6, 6, 6, 6], b: [4, 6, 1, 1, 1], c: [5, 5, 1, 1, 1] },
      '10-2',
      'high'
    )
    expect(result).toEqual({ kind: 'loser', loser: 'a' })
  })

  test('two or more miss: they cycle; whoever made it is safe', () => {
    const result = resolveKickerCycle(
      { a: [6, 6, 6, 6, 6], b: [1, 1, 1, 1, 2], c: [5, 5, 1, 1, 1] },
      '10-2',
      'high'
    )
    expect(result).toEqual({ kind: 'cycle', players: ['a', 'b'] })
  })

  test('equal worst kicker totals tie', () => {
    const result = resolveKickerCycle(
      { a: [4, 6, 6, 6, 5], b: [4, 6, 1, 1, 1], c: [5, 5, 1, 1, 1] },
      '10-2',
      'high'
    )
    expect(result).toEqual({ kind: 'tie', players: ['b', 'c'] })
  })
})

describe('dice sources', () => {
  test('seeded sources are reproducible and produce faces 1–6', () => {
    const [a] = rollDice(seeded(42), 1000)
    const [b] = rollDice(seeded(42), 1000)
    expect(a).toEqual(b)
    expect(a.every((d) => d >= 1 && d <= 6)).toBe(true)
    for (let f = 1; f <= 6; f++) expect(a.filter((d) => d === f).length).toBeGreaterThan(120)
  })

  test('scripted sources hand out the queue in order and fail when empty', () => {
    const [dice, rest] = rollDice(scripted([1, 2, 3, 4, 5, 6]), 5)
    expect(dice).toEqual([1, 2, 3, 4, 5])
    expect(() => rollDice(rest, 2)).toThrow(/ran out/)
  })
})
