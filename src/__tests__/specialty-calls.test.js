/**
 * The specialty games' "when to call" figures (GameOdds) are computed
 * from call-odds.ts over every roll, never typed in.
 */
const { specialtyCalls } = require('../components/OddsLab/specialty-calls')

test.each(['razzle', 'boss', 'tres-away'])('%s: every roll is counted once, as a chance', (game) => {
  const c = specialtyCalls(game)
  expect(c.rows.reduce((s, r) => s + r.rolls, 0)).toBe(7776)
  c.rows.forEach((r) => {
    expect(r.safe).toBeGreaterThanOrEqual(0)
    expect(r.safe).toBeLessThanOrEqual(1)
    expect(r.label).toBeTruthy()
  })
  expect(c.even).toBeCloseTo(1 - 1 / c.players, 12)
})

test('a better starting hand never stays off the pencil much less often', () => {
  // call-odds.ts is good to about ±2 points per figure
  for (const game of ['razzle', 'boss', 'tres-away']) {
    const { rows } = specialtyCalls(game)
    rows.slice(1).forEach((r, i) => expect(r.safe).toBeGreaterThan(rows[i].safe - 0.02))
  }
})

describe('the call thresholds are worked out from the same table', () => {
  const { callAdvice, callThresholds, callFilters, worthCalling } = require('../components/OddsLab/specialty-calls')
  const { classifySpecialtyRoll } = require('../lib/game-validation')
  const { callLoss } = require('../strategy')
  const pct = (p) => `${Math.round(p * 100)}%`
  const every = []
  for (let i = 0; i < 7776; i++) every.push([0, 1, 2, 3, 4].map((k) => (Math.floor(i / 6 ** k) % 6) + 1))

  test.each(['razzle', 'boss'])('%s: every group from the threshold up beats an even share; the one below doesn’t', (game) => {
    const c = specialtyCalls(game)
    const at = c.rows.findIndex((r) => r.key === c.good)
    expect(at).toBeGreaterThan(0)
    c.rows.slice(at).forEach((r) => expect(r.safe).toBeGreaterThan(c.even))
    expect(c.rows[at - 1].safe).toBeLessThanOrEqual(c.even)
    expect(c.strong).toBeGreaterThanOrEqual(c.good)
    expect(callAdvice(game, pct)).toMatch(/^Call with /)
  })

  test.each(['razzle', 'boss'])('%s: the site’s “competitive” hands are the ones worth calling', (game) => {
    const t = callThresholds()
    every.forEach((d) => expect(Boolean(classifySpecialtyRoll(d, game, t).competitive)).toBe(worthCalling(game, d)))
    expect(callFilters()[game][0].id).toBe('competitive')
  })

  test('Razzle: five of any number is a strong call, whatever the wilds', () => {
    every
      .filter((d) => new Set(d.filter((x) => x !== 1)).size <= 1)
      .forEach((d) => expect(callLoss(d, { game: 'razzle' })).toBeLessThanOrEqual(0.15))
  })

  test('Tres Away keeps its score thresholds', () => {
    expect(callThresholds()['tres-away'].scoreGood).toBeGreaterThan(0)
  })
})
