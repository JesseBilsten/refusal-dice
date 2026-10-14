/**
 * Tests for roll-query.js — the Odds Lab query engine.
 *
 * The key guarantee: every game preset produces exactly the same set of
 * matching rolls as checkGame() across all 7,776 ordered 5-dice outcomes,
 * so the Odds Lab can be used to check the site's own odds.
 *
 * Run:  npm test
 */

const { checkGame } = require('../lib/game-validation.js')
const {
  PRESETS,
  arrangements,
  enumerateRolls,
  matchPattern,
  evaluateQuery,
  validateQuery,
  atLeastOneOf,
  describeRule,
  describePattern,
} = require('../lib/roll-query.js')

const allOrderedRolls = (n) => {
  const out = []
  const rec = (acc) => {
    if (acc.length === n) return out.push(acc.slice())
    for (let f = 1; f <= 6; f++) {
      acc.push(f)
      rec(acc)
      acc.pop()
    }
  }
  rec([])
  return out
}

const sortedKey = (roll) => roll.slice().sort((a, b) => a - b).join('')

describe('enumerateRolls', () => {
  test.each([
    [1, 6],
    [2, 21],
    [3, 56],
    [4, 126],
    [5, 252],
  ])('%i dice → %i unique rolls covering 6^n outcomes', (n, unique) => {
    const rolls = enumerateRolls(n)
    expect(rolls).toHaveLength(unique)
    expect(rolls.reduce((s, r) => s + r.count, 0)).toBe(Math.pow(6, n))
  })

  test('arrangements counts orderings of a multiset', () => {
    expect(arrangements([1, 2, 3, 4, 5])).toBe(120)
    expect(arrangements([2, 2, 3, 4, 5])).toBe(60)
    expect(arrangements([6, 6, 6, 6, 6])).toBe(1)
  })
})

describe('game presets agree with checkGame on all 7,776 rolls', () => {
  const ordered = allOrderedRolls(5)

  PRESETS.filter((p) => p.gameId).forEach((preset) => {
    test(preset.label, () => {
      const result = evaluateQuery(preset.query)
      const matchByKey = new Map(result.rolls.map((r) => [r.key, r.match]))
      let siteCount = 0
      ordered.forEach((roll) => {
        const site = checkGame(roll, preset.gameId)
        if (site) siteCount++
        expect([roll.join(''), matchByKey.get(sortedKey(roll))]).toEqual([
          roll.join(''),
          site,
        ])
      })
      expect(result.matched).toBe(siteCount)
    })
  })
})

describe('rule types', () => {
  const p = (query) => evaluateQuery(query).probability

  test('an empty query matches every roll', () => {
    expect(p({ diceCount: 5, patterns: [{ rules: [] }] })).toBe(1)
    expect(p({ diceCount: 3, patterns: [] })).toBe(1)
  })

  test('specific dice: a single die showing 6 is 1/6', () => {
    expect(p({ diceCount: 1, patterns: [{ rules: [{ type: 'faces', values: [6] }] }] })).toBeCloseTo(1 / 6)
  })

  test('sum of all dice: 7 or 11 on two dice is 8/36', () => {
    const q = {
      diceCount: 2,
      patterns: [{ rules: [{ type: 'sum', dice: 'all', op: 'in', value: 7, values: [7, 11] }] }],
    }
    expect(evaluateQuery(q).matched).toBe(8)
  })

  test('five of a kind is 6/7776', () => {
    const q = { diceCount: 5, patterns: [{ rules: [{ type: 'kind', size: 5, op: 'any' }] }] }
    expect(evaluateQuery(q).matched).toBe(6)
  })

  test('of a kind with a value condition', () => {
    // pair of 6s on two dice: 1/36
    const q = { diceCount: 2, patterns: [{ rules: [{ type: 'kind', size: 2, op: 'eq', value: 6 }] }] }
    expect(evaluateQuery(q).matched).toBe(1)
  })

  test('run of 5 in a row: 240/7776', () => {
    const q = { diceCount: 5, patterns: [{ rules: [{ type: 'straight', length: 5, start: null }] }] }
    expect(evaluateQuery(q).matched).toBe(240)
  })

  test('run with a fixed start', () => {
    const q = { diceCount: 3, patterns: [{ rules: [{ type: 'straight', length: 3, start: 4 }] }] }
    expect(evaluateQuery(q).matched).toBe(6) // permutations of 4,5,6
  })

  test('count: no 1s on five dice is (5/6)^5', () => {
    const q = {
      diceCount: 5,
      patterns: [{ rules: [{ type: 'count', quant: 'exactly', n: 0, op: 'eq', value: 1 }] }],
    }
    expect(evaluateQuery(q).matched).toBe(Math.pow(5, 5))
  })

  test('each: every die 4 or more on three dice is 27/216', () => {
    const q = { diceCount: 3, patterns: [{ rules: [{ type: 'each', dice: 'all', op: 'gte', value: 4 }] }] }
    expect(evaluateQuery(q).matched).toBe(27)
  })

  test('rules claim separate dice: two pairs need four dice', () => {
    const twoPairs = [{ type: 'kind', size: 2, op: 'any' }, { type: 'kind', size: 2, op: 'any' }]
    expect(matchPattern([2, 2, 3, 5, 6], twoPairs)).toBeNull()
    expect(matchPattern([2, 2, 5, 5, 6], twoPairs)).not.toBeNull()
    expect(matchPattern([2, 2, 2, 2, 6], twoPairs)).not.toBeNull()
  })

  test('remaining-dice rules look only at unclaimed dice (kickers)', () => {
    const rules = [
      { type: 'faces', values: [4, 5, 6] },
      { type: 'each', dice: 'rest', op: 'gte', value: 5 },
    ]
    expect(matchPattern([4, 5, 6, 6, 5], rules)).toEqual([0, 0, 0, -1, -1])
    expect(matchPattern([4, 5, 6, 6, 1], rules)).toBeNull()
  })

  test('the owner map marks which rule claimed each die', () => {
    const owner = matchPattern([1, 3, 4, 6, 6], [{ type: 'sum', dice: 2, op: 'eq', value: 10 }])
    expect(owner.filter((o) => o === 0)).toHaveLength(2)
    expect(owner.filter((o) => o === -1)).toHaveLength(3)
  })

  test('invert flips the matching set', () => {
    const base = { diceCount: 5, patterns: [{ rules: [{ type: 'faces', values: [6] }] }] }
    const a = evaluateQuery(base).matched
    const b = evaluateQuery({ ...base, invert: true }).matched
    expect(a + b).toBe(7776)
  })

  test('patterns combine with OR', () => {
    const six = { rules: [{ type: 'faces', values: [6] }] }
    const one = { rules: [{ type: 'faces', values: [1] }] }
    const either = evaluateQuery({ diceCount: 1, patterns: [six, one] })
    expect(either.matched).toBe(2)
  })
})

describe('helpers', () => {
  test('atLeastOneOf', () => {
    expect(atLeastOneOf(0.5, 2)).toBeCloseTo(0.75)
    expect(atLeastOneOf(0, 7)).toBe(0)
  })

  test('validateQuery flags impossible patterns', () => {
    const issues = validateQuery({
      diceCount: 2,
      patterns: [{ rules: [{ type: 'faces', values: [4, 5, 6] }] }],
    })
    expect(issues[0]).toMatch(/needs 3 dice/)
    expect(validateQuery({ diceCount: 5, patterns: [{ rules: [{ type: 'straight', length: 3, start: 5 }] }] })).toHaveLength(1)
  })

  test('descriptions read as plain English', () => {
    expect(describeRule({ type: 'sum', dice: 2, op: 'in', value: 7, values: [7, 11] })).toBe(
      '2 dice adding up to 7 or 11'
    )
    expect(describeRule({ type: 'each', dice: 'rest', op: 'gte', value: 4 })).toBe(
      'every remaining die showing 4 or more'
    )
    expect(describeRule({ type: 'count', quant: 'atLeast', n: 1, op: 'eq', value: 1 })).toBe(
      'at least 1 die showing 1'
    )
    expect(describePattern({ rules: [{ type: 'faces', values: [4, 5, 6] }, { type: 'kind', size: 2, op: 'any' }] })).toBe(
      'dice showing 4, 5, 6 and a pair'
    )
  })
})
