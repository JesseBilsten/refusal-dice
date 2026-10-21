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
