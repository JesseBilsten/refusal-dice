/**
 * The Odds Lab's questions from the table (situations-catalog.js) must ask
 * about keeps the rules allow (docs/RULES.md §3.1).
 */
const { isKickerGame, isLegalKeep } = require('../engine')
const { keepOptions } = require('../strategy')
const { SITUATIONS } = require('../components/OddsLab/situations-catalog')
const { goalFor, lockedPositions } = require('../components/OddsLab/keep-model')

const LONE_KEEP = { montereyLoneKeep: true }

test.each(Object.entries(SITUATIONS).filter(([, q]) => isKickerGame(q.s.game)))(
  '%s: every keep asked about, and every keep offered, is legal',
  (_, { s }) => {
    const dice = s.roll.split('').map(Number)
    const lockedAt = lockedPositions(dice, s.kept)
    const locked = lockedAt.map((i) => dice[i])
    // Legal by the standard rules, or (a lone 3 or 4) only under the Monterey house rule
    ;(s.ask || []).forEach((digits) => {
      const kept = digits.split('').map(Number)
      const check = { locked, hand: dice }
      expect(isLegalKeep(kept, s.game, check) || isLegalKeep(kept, s.game, { ...check, rules: LONE_KEEP })).toBe(true)
    })
    keepOptions(dice, s.rolls, goalFor(s, null), { locked: lockedAt })
      .filter((o) => !o.stand)
      .forEach((o) => expect(isLegalKeep(o.dice, s.game, { locked, hand: dice })).toBe(true))
  }
)

const { situationWhy } = require('../components/OddsLab/keep-model')

test.each(Object.entries(SITUATIONS).filter(([, q]) => q.why))(
  '%s: the reasoning computes every figure it quotes',
  (_, q) => {
    expect(q.whyTitle).toBeTruthy()
    const text = situationWhy(q, { montereyLoneKeep: false }, (p) => `${(p * 100).toFixed(1)}%`).join(' ')
    expect(text).toMatch(/\d+\.\d%/)
    expect(text).not.toMatch(/undefined|NaN/)
  }
)

test('Ship Captain Crew Low vs 4: the keeps win alike on one roll; the 5-6 ties more and comes out ahead', () => {
  const { keepOdds } = require('../components/OddsLab/keep-model')
  const odds = keepOdds(SITUATIONS['ship-captain-crew'].s, { montereyLoneKeep: false })
  expect(odds('12', 1).win).toBeCloseTo(9 / 216, 12)
  expect(odds('56', 1).win).toBeCloseTo(9 / 216, 12)
  expect(odds('12', 1).tie).toBeCloseTo(6 / 216, 12)
  expect(odds('56', 1).tie).toBeCloseTo(9 / 216, 12)
  const score = (o) => o.win + o.tie / 2
  expect(score(odds('56'))).toBeGreaterThan(score(odds('12')))
})

const { situationTable } = require('../components/OddsLab/keep-model')

test.each(Object.entries(SITUATIONS).filter(([, q]) => q.table))('%s: its table computes every cell', (_, q) => {
  const t = situationTable(q, { montereyLoneKeep: false }, (p) => `${(p * 100).toFixed(1)}%`)
  t.rows.forEach((row) => expect(row).toHaveLength(t.head.length))
  expect(JSON.stringify(t)).not.toMatch(/undefined|NaN|null/)
})

test('Ship Captain Crew: keep the end away from the kicker you want, at every kicker', () => {
  const { keepOdds } = require('../components/OddsLab/keep-model')
  const odds = keepOdds(SITUATIONS['ship-captain-crew'].s, { montereyLoneKeep: false })
  const score = (o) => o.win + o.tie / 2
  for (let total = 2; total <= 12; total++)
    for (const r of [1, 2]) {
      const high = { variant: 'high', total }
      const low = { variant: 'low', total }
      expect(score(odds('12', r, high))).toBeGreaterThanOrEqual(score(odds('56', r, high)) - 1e-12)
      expect(score(odds('56', r, low))).toBeGreaterThanOrEqual(score(odds('12', r, low)) - 1e-12)
    }
})

test('10-2: take a High tie at 11+ on the last roll, 13+ with two left; Low mirrors it', () => {
  const text = situationWhy(SITUATIONS['10-2'], { montereyLoneKeep: false }, (p) => `${(p * 100).toFixed(1)}%`).join(' ')
  expect(text).toMatch(/take a tie at 11 or more on your last roll, 13 or more with two rolls left/)
  expect(text).toMatch(/take a tie at 10 or less on your last roll, 8 or less with two left/)
})

test('Boss two pair: break it up against lower trips; go for the full house when both pairs are below them', () => {
  const { keepOdds } = require('../components/OddsLab/keep-model')
  const odds = keepOdds(SITUATIONS['boss-two-pair'].s, { montereyLoneKeep: false })
  expect(odds('3366').win).toBeCloseTo(1 / 3, 12)
  expect(odds('66').win).toBeGreaterThan(odds('3366').win)
  const low = { roll: '33221', beat: '44421' }
  expect(odds('2233', 1, low).win).toBeGreaterThan(odds('33', 1, low).win)
  expect(odds('66', 1, { beat: '66442' }).win).toBeGreaterThan(odds('3366', 1, { beat: '66442' }).win)
})

test('the Boss page tip quotes keeps its question has: the 6, the 5-6 and rolling all five', () => {
  const { keepOdds } = require('../components/OddsLab/keep-model')
  const odds = keepOdds(SITUATIONS.boss.s, {})
  ;['6', '56', ''].forEach((keep) => expect(odds(keep).win).toBeGreaterThan(0))
})
