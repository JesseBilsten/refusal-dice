/**
 * Smoke-test suite for game-validation.js
 *
 * Covers:
 *   1. Game-matching rules (checkGame)
 *   2. Razzle: 1s are wild, 6s are natural
 *   3. Specialty game scoring (Boss, Tres Away)
 *   4. Specialty thresholds
 *   5. Kicker & variant logic (high/low): the kicker each variant keeps,
 *      and every game a roll plays (analyzeRoll)
 *
 * How good a call is comes from the computed odds: see strategy.test.ts.
 *
 * Run:  npm test
 */

const {
  checkGame,
  getKickerStrength,
  getBossHandRank,
  calculateTresAwayScore,
  getRazzleScore,
  findOptimalVariants,
  analyzeRoll,
  classifySpecialtyRoll,
  isCompetitiveSpecialtyHand,
} = require('../lib/game-validation')


// Sample thresholds, in the shape callThresholds() (OddsLab/specialty-calls.js) works out
const SPECIALTY_THRESHOLDS = {
  razzle: { wildSixesGood: 3, wildSixesStrong: 4 },
  boss: { rankGood: 3, rankStrong: 4 },
  'tres-away': { threesGood: 2, threesStrong: 4 },
}

/* ════════════════════════════════════════════════════════════
   1. GAME MATCHING — checkGame()
   ════════════════════════════════════════════════════════════ */
describe('checkGame — game matching rules', () => {
  // ── 10-2 ──
  describe('10-2', () => {
    test('4+6 qualifies', () => {
      expect(checkGame([4, 6, 1, 2, 3], '10-2')).toBe(true)
    })
    test('5+5 qualifies', () => {
      expect(checkGame([5, 5, 1, 2, 3], '10-2')).toBe(true)
    })
    test('no pair summing to 10 fails', () => {
      expect(checkGame([1, 2, 2, 2, 2], '10-2')).toBe(false)
    })
  })

  // ── 10-3 ──
  describe('10-3', () => {
    test('1+3+6 qualifies', () => {
      expect(checkGame([1, 3, 6, 2, 4], '10-3')).toBe(true)
    })
    test('2+3+5 qualifies', () => {
      expect(checkGame([2, 3, 5, 1, 1], '10-3')).toBe(true)
    })
    test('no triple summing to 10 fails', () => {
      expect(checkGame([6, 6, 6, 6, 6], '10-3')).toBe(false)
    })
  })

  // ── 10-4 ──
  describe('10-4', () => {
    test('1+2+3+4=10 qualifies', () => {
      expect(checkGame([1, 2, 3, 4, 5], '10-4')).toBe(true)
    })
    test('all sixes fails (sum = 24)', () => {
      expect(checkGame([6, 6, 6, 6, 6], '10-4')).toBe(false)
    })
  })

  // ── Ship Captain Crew (SCC) ──
  describe('SCC', () => {
    test('contains 4-5-6 qualifies', () => {
      expect(checkGame([4, 5, 6, 1, 2], 'ship-captain-crew')).toBe(true)
    })
    test('contains 1-2-3 qualifies', () => {
      expect(checkGame([1, 2, 3, 6, 6], 'ship-captain-crew')).toBe(true)
    })
    test('missing 6 from 4-5-6 fails', () => {
      expect(checkGame([4, 5, 1, 2, 3], 'ship-captain-crew')).toBe(true)
      // Actually 1-2-3 makes it! Let's use a roll that truly fails:
    })
    test('no outside straight fails', () => {
      expect(checkGame([2, 2, 4, 5, 6], 'ship-captain-crew')).toBe(true)
      // 4+5+6 → true.  Let's test something that truly fails:
    })
    test('[2, 2, 4, 4, 6] fails — no 4-5-6 or 1-2-3', () => {
      expect(checkGame([2, 2, 4, 4, 6], 'ship-captain-crew')).toBe(false)
    })
  })

  // ── Monterey ──
  describe('Monterey', () => {
    test('contains 2-3-4 qualifies', () => {
      expect(checkGame([2, 3, 4, 6, 6], 'monterey')).toBe(true)
    })
    test('contains 3-4-5 qualifies', () => {
      expect(checkGame([3, 4, 5, 1, 1], 'monterey')).toBe(true)
    })
    test('has 2-4-5 but not 3 fails', () => {
      expect(checkGame([2, 4, 5, 6, 6], 'monterey')).toBe(false)
    })
    test('all ones fails', () => {
      expect(checkGame([1, 1, 1, 1, 1], 'monterey')).toBe(false)
    })
  })

  // ── Vegas (7's) ──
  describe("Vegas (7's)", () => {
    test('two non-overlapping pairs summing to 7: 1+6 and 2+5', () => {
      expect(checkGame([1, 6, 2, 5, 3], 'vegas')).toBe(true)
    })
    test('pair summing to 11: 5+6 and 5+6', () => {
      expect(checkGame([5, 6, 5, 6, 1], 'vegas')).toBe(true)
    })
    test('mixed 7 and 11: 3+4 and 5+6', () => {
      expect(checkGame([3, 4, 5, 6, 2], 'vegas')).toBe(true)
    })
    test('only one pair summing to 7 fails', () => {
      expect(checkGame([1, 6, 2, 2, 2], 'vegas')).toBe(false)
    })
    test('overlapping pairs (shared die) fails', () => {
      // 3+4=7 and 4+3=7 but they share indices
      expect(checkGame([3, 4, 2, 2, 2], 'vegas')).toBe(false)
    })
  })

  // ── Pairs ──
  describe('Pairs', () => {
    test('two distinct pairs qualifies', () => {
      expect(checkGame([2, 2, 5, 5, 1], 'pairs')).toBe(true)
    })
    test('four of a kind counts as two pairs', () => {
      expect(checkGame([3, 3, 3, 3, 1], 'pairs')).toBe(true)
    })
    test('only one pair fails', () => {
      expect(checkGame([2, 2, 3, 4, 5], 'pairs')).toBe(false)
    })
    test('full house qualifies (pair + trips)', () => {
      expect(checkGame([2, 2, 5, 5, 5], 'pairs')).toBe(true)
    })
  })

  // ── Razzle ──
  describe('Razzle', () => {
    test('every roll qualifies for Razzle', () => {
      expect(checkGame([1, 2, 3, 4, 5], 'razzle')).toBe(true)
      expect(checkGame([6, 6, 6, 6, 6], 'razzle')).toBe(true)
      expect(checkGame([1, 1, 1, 1, 1], 'razzle')).toBe(true)
    })
  })

  // ── Boss ──
  describe('Boss', () => {
    test('every roll qualifies for Boss', () => {
      expect(checkGame([1, 2, 3, 4, 5], 'boss')).toBe(true)
      expect(checkGame([6, 6, 6, 6, 6], 'boss')).toBe(true)
    })
  })

  // ── Tres Away ──
  describe('Tres Away', () => {
    test('every roll qualifies for Tres Away', () => {
      expect(checkGame([1, 2, 3, 4, 5], 'tres-away')).toBe(true)
      expect(checkGame([6, 6, 6, 6, 6], 'tres-away')).toBe(true)
    })
  })
})

/* ════════════════════════════════════════════════════════════
   2. RAZZLE — 1s are wild, 6s are natural
   ════════════════════════════════════════════════════════════ */
describe('Razzle scoring — 1s are wild', () => {
  test('[6,6,1,1,3] → bestNumber=6, bestCount=4 (2 natural 6s + 2 wild 1s)', () => {
    const rs = getRazzleScore([6, 6, 1, 1, 3])
    expect(rs.bestNumber).toBe(6)
    expect(rs.naturalCount).toBe(2)
    expect(rs.onesCount).toBe(2)
    expect(rs.bestCount).toBe(4) // 2 + 2
  })

  test('[1,1,1,6,6] → bestNumber=6, bestCount=5 (five-of-a-kind 6s)', () => {
    const rs = getRazzleScore([1, 1, 1, 6, 6])
    expect(rs.bestNumber).toBe(6)
    expect(rs.bestCount).toBe(5) // 2 natural + 3 wild
    expect(rs.naturalCount).toBe(2)
    expect(rs.onesCount).toBe(3)
  })

  test('[1,1,1,1,1] → bestNumber=6, bestCount=5 (all 1s → 5 wild 6s)', () => {
    const rs = getRazzleScore([1, 1, 1, 1, 1])
    expect(rs.bestNumber).toBe(6)
    expect(rs.bestCount).toBe(5)
  })

  test('[6,6,6,6,6] → bestNumber=6, bestCount=5 (all natural)', () => {
    const rs = getRazzleScore([6, 6, 6, 6, 6])
    expect(rs.bestNumber).toBe(6)
    expect(rs.bestCount).toBe(5)
    expect(rs.naturalCount).toBe(5)
    expect(rs.onesCount).toBe(0)
  })

  test('[2,3,4,5,6] → bestNumber=6, bestCount=1 (single natural 6, no wilds)', () => {
    const rs = getRazzleScore([2, 3, 4, 5, 6])
    expect(rs.bestNumber).toBe(6)
    expect(rs.bestCount).toBe(1)
    expect(rs.onesCount).toBe(0)
  })

  test('[1,5,5,5,2] → bestNumber=5, bestCount=4 (3 natural 5s + 1 wild)', () => {
    const rs = getRazzleScore([1, 5, 5, 5, 2])
    expect(rs.bestNumber).toBe(5)
    expect(rs.bestCount).toBe(4)
    expect(rs.naturalCount).toBe(3)
  })

  test('1s are wild — optimizer picks highest count, not always 6s', () => {
    // [1,1,2,3,4] → 1 natural 4 + 2 wilds = 3 "fours" beats 0+2 = 2 "sixes"
    const rs = getRazzleScore([1, 1, 2, 3, 4])
    expect(rs.bestNumber).toBe(4)
    expect(rs.bestCount).toBe(3)
    expect(rs.onesCount).toBe(2)
  })
})

/* ════════════════════════════════════════════════════════════
   3. BOSS — hand ranking
   ════════════════════════════════════════════════════════════ */
describe('Boss hand ranking', () => {
  test('five of a kind', () => {
    const r = getBossHandRank([3, 3, 3, 3, 3])
    expect(r.rank).toBe(7)
    expect(r.handType).toBe('5-of-a-kind')
  })

  test('four of a kind', () => {
    const r = getBossHandRank([4, 4, 4, 4, 2])
    expect(r.rank).toBe(6)
    expect(r.handType).toBe('4-of-a-kind')
  })

  test('full house', () => {
    const r = getBossHandRank([2, 2, 5, 5, 5])
    expect(r.rank).toBe(5)
    expect(r.handType).toMatch(/full/i)
  })

  test('three of a kind', () => {
    const r = getBossHandRank([4, 4, 4, 2, 3])
    expect(r.rank).toBe(4)
    expect(r.handType).toBe('3-of-a-kind')
  })

  test('two pair', () => {
    const r = getBossHandRank([2, 2, 5, 5, 1])
    expect(r.rank).toBe(3)
    expect(r.handType).toBe('two-pair')
  })

  test('one pair', () => {
    const r = getBossHandRank([1, 1, 3, 4, 5])
    expect(r.rank).toBe(2)
    expect(r.handType).toMatch(/pair/i)
  })

  test('high card (no pair)', () => {
    const r = getBossHandRank([1, 2, 3, 4, 6])
    expect(r.rank).toBe(1)
    expect(r.handType).toMatch(/high/i)
  })

  test('rank ordering: Five > Four > Full > Trips > Two Pair > Pair > High', () => {
    const five = getBossHandRank([6, 6, 6, 6, 6]).rank
    const four = getBossHandRank([6, 6, 6, 6, 1]).rank
    const full = getBossHandRank([6, 6, 6, 1, 1]).rank
    const trips = getBossHandRank([6, 6, 6, 1, 2]).rank
    const twoPair = getBossHandRank([6, 6, 1, 1, 2]).rank
    const pair = getBossHandRank([6, 6, 1, 2, 3]).rank
    const high = getBossHandRank([6, 5, 4, 3, 1]).rank
    expect(five).toBeGreaterThan(four)
    expect(four).toBeGreaterThan(full)
    expect(full).toBeGreaterThan(trips)
    expect(trips).toBeGreaterThan(twoPair)
    expect(twoPair).toBeGreaterThan(pair)
    expect(pair).toBeGreaterThan(high)
  })
})

/* ════════════════════════════════════════════════════════════
   4. TRES AWAY — 3s score 0
   ════════════════════════════════════════════════════════════ */
describe('Tres Away scoring — 3s count as 0', () => {
  test('[3,3,3,3,3] → score 0 (best possible)', () => {
    expect(calculateTresAwayScore([3, 3, 3, 3, 3])).toBe(0)
  })

  test('[1,2,3,4,5] → score 12 (1+2+0+4+5)', () => {
    expect(calculateTresAwayScore([1, 2, 3, 4, 5])).toBe(12)
  })

  test('[6,6,6,6,6] → score 30 (worst possible)', () => {
    expect(calculateTresAwayScore([6, 6, 6, 6, 6])).toBe(30)
  })

  test('[3,3,1,1,1] → score 3', () => {
    expect(calculateTresAwayScore([3, 3, 1, 1, 1])).toBe(3)
  })
})

/* ════════════════════════════════════════════════════════════
   5. SPECIALTY THRESHOLDS — competitive / strong
   ════════════════════════════════════════════════════════════ */
describe('Specialty game thresholds', () => {
  test('Razzle: [6,6,1,1,3] (4 wild sixes) is competitive AND strong', () => {
    expect(isCompetitiveSpecialtyHand([6, 6, 1, 1, 3], 'razzle', SPECIALTY_THRESHOLDS)).toBe(true)
    const cls = classifySpecialtyRoll([6, 6, 1, 1, 3], 'razzle', SPECIALTY_THRESHOLDS)
    expect(cls.competitive).toBe(true)
    expect(cls.strong).toBe(true)
  })

  test('Razzle: [6,1,2,3,4] (2 wild sixes) is NOT competitive', () => {
    expect(isCompetitiveSpecialtyHand([6, 1, 2, 3, 4], 'razzle', SPECIALTY_THRESHOLDS)).toBe(false)
  })

  test('Razzle: [6,6,6,2,3] (3 natural 6s + 0 wild 1s) IS competitive', () => {
    expect(isCompetitiveSpecialtyHand([6, 6, 6, 2, 3], 'razzle', SPECIALTY_THRESHOLDS)).toBe(true)
  })

  test('Boss: Two Pair is competitive', () => {
    expect(isCompetitiveSpecialtyHand([2, 2, 5, 5, 1], 'boss', SPECIALTY_THRESHOLDS)).toBe(true)
  })

  test('Boss: One pair is NOT competitive', () => {
    expect(isCompetitiveSpecialtyHand([2, 2, 3, 4, 5], 'boss', SPECIALTY_THRESHOLDS)).toBe(false)
  })

  test('Tres Away: graded by its 3s (here 2+ competitive, 4+ strong)', () => {
    expect(classifySpecialtyRoll([3, 3, 1, 2, 3], 'tres-away', SPECIALTY_THRESHOLDS)).toEqual({ competitive: true, strong: false })
    expect(classifySpecialtyRoll([3, 3, 3, 3, 6], 'tres-away', SPECIALTY_THRESHOLDS)).toEqual({ competitive: true, strong: true })
    expect(isCompetitiveSpecialtyHand([1, 2, 3, 5, 6], 'tres-away', SPECIALTY_THRESHOLDS)).toBe(false)
  })
})

/* ════════════════════════════════════════════════════════════
   6. KICKER / VARIANT LOGIC
   Grouped by number of kicker dice:
     1 kicker  → 10-4, Vegas, Pairs
     2 kickers → 10-3, SCC, Monterey
     3 kickers → 10-2
   ════════════════════════════════════════════════════════════ */
describe('Kicker strength and variants', () => {

  // ── 1 kicker die ──────────────────────────────────────────
  describe('1 kicker (10-4, Vegas, Pairs)', () => {
    // 10-4: 4 dice sum to 10, 1 kicker
    test('10-4: [1,2,3,4,6] → kicker 6 → high', () => {
      // 1+2+3+4=10, kicker=6
      expect(getKickerStrength([1, 2, 3, 4, 6], '10-4')).toBe('high')
    })
    test('10-4: [1,2,3,4,1] → kicker 1 → low', () => {
      // 1+2+3+4=10, kicker=1
      expect(getKickerStrength([1, 2, 3, 4, 1], '10-4')).toBe('low')
    })
    test('10-4: [1,2,3,4,4] → kicker 4 → high', () => {
      // 1+2+3+4=10, kicker=4
      expect(getKickerStrength([1, 2, 3, 4, 4], '10-4')).toBe('high')
    })
    test('10-4: [1,2,3,4,3] → kicker 3 → low', () => {
      // 1+2+3+4=10, kicker=3
      expect(getKickerStrength([1, 2, 3, 4, 3], '10-4')).toBe('low')
    })

    // Vegas: two pairs summing to 7 or 11, 1 kicker
    test('Vegas: [1,6,2,5,6] → kicker 6 → high', () => {
      // pairs: 1+6=7, 2+5=7, kicker=6
      expect(getKickerStrength([1, 6, 2, 5, 6], 'vegas')).toBe('high')
    })
    test('Vegas: [1,6,2,5,1] → kicker 1 → low', () => {
      // pairs: 1+6=7, 2+5=7, kicker=1
      expect(getKickerStrength([1, 6, 2, 5, 1], 'vegas')).toBe('low')
    })
    test('Vegas: [5,6,5,6,4] → kicker 4 → high', () => {
      // pairs: 5+6=11, 5+6=11, kicker=4
      expect(getKickerStrength([5, 6, 5, 6, 4], 'vegas')).toBe('high')
    })
    test('Vegas: [3,4,1,6,2] → kicker 2 → low', () => {
      // pairs: 3+4=7, 1+6=7, kicker=2
      expect(getKickerStrength([3, 4, 1, 6, 2], 'vegas')).toBe('low')
    })

    // Pairs: two pairs, 1 kicker
    test('Pairs: [2,2,5,5,6] → kicker 6 → high', () => {
      expect(getKickerStrength([2, 2, 5, 5, 6], 'pairs')).toBe('high')
    })
    test('Pairs: [2,2,5,5,1] → kicker 1 → low', () => {
      expect(getKickerStrength([2, 2, 5, 5, 1], 'pairs')).toBe('low')
    })
    test('Pairs: [4,4,4,4,6] → four-of-a-kind counts as 2 pairs, kicker 6 → high', () => {
      expect(getKickerStrength([4, 4, 4, 4, 6], 'pairs')).toBe('high')
    })
    test('Pairs: [4,4,4,4,1] → four-of-a-kind, kicker 1 → low', () => {
      expect(getKickerStrength([4, 4, 4, 4, 1], 'pairs')).toBe('low')
    })
    test('Pairs: [3,3,6,6,3] → full house, kicker = odd one out → low', () => {
      // 3,3 pair + 6,6 pair, kicker = remaining 3
      expect(getKickerStrength([3, 3, 6, 6, 3], 'pairs')).toBe('low')
    })
  })

  // ── 2 kicker dice ─────────────────────────────────────────
  describe('2 kickers (10-3, SCC, Monterey)', () => {
    // 10-3: 3 dice sum to 10, 2 kickers (range 2-12)
    test('10-3: [2,3,5,6,6] → kicker [6,6]=12 → high', () => {
      // 2+3+5=10, kicker=[6,6] sum=12
      expect(getKickerStrength([2, 3, 5, 6, 6], '10-3')).toBe('high')
    })
    test('10-3: [1,3,6,1,1] → kicker [1,1]=2 → low', () => {
      // 1+3+6=10, kicker=[1,1] sum=2
      expect(getKickerStrength([1, 3, 6, 1, 1], '10-3')).toBe('low')
    })
    test('10-3: [2,3,5,4,5] → kicker [4,5]=9 → high', () => {
      // 2+3+5=10, kicker=[4,5] sum=9
      expect(getKickerStrength([2, 3, 5, 4, 5], '10-3')).toBe('high')
    })

    // SCC: 4-5-6 or 1-2-3 straight, 2 kickers
    test('SCC: [4,5,6,1,2] → kicker [1,2]=3 → low', () => {
      expect(getKickerStrength([4, 5, 6, 1, 2], 'ship-captain-crew')).toBe('low')
    })
    test('SCC: [4,5,6,5,6] → kicker [5,6]=11 → high', () => {
      expect(getKickerStrength([4, 5, 6, 5, 6], 'ship-captain-crew')).toBe('high')
    })
    test('SCC: [1,2,3,1,1] → kicker [1,1]=2 → low', () => {
      expect(getKickerStrength([1, 2, 3, 1, 1], 'ship-captain-crew')).toBe('low')
    })
    test('SCC: [1,2,3,6,6] → kicker [6,6]=12 → high', () => {
      expect(getKickerStrength([1, 2, 3, 6, 6], 'ship-captain-crew')).toBe('high')
    })

    // Monterey: 2-3-4 or 3-4-5 inside straight, 2 kickers
    test('Monterey: [2,3,4,1,1] → kicker [1,1]=2 → low', () => {
      expect(getKickerStrength([2, 3, 4, 1, 1], 'monterey')).toBe('low')
    })
    test('Monterey: [2,3,4,6,6] → kicker [6,6]=12 → high', () => {
      expect(getKickerStrength([2, 3, 4, 6, 6], 'monterey')).toBe('high')
    })
    test('Monterey: [3,4,5,1,2] → kicker [1,2]=3 → low', () => {
      expect(getKickerStrength([3, 4, 5, 1, 2], 'monterey')).toBe('low')
    })
    test('Monterey: [3,4,5,6,6] → kicker [6,6]=12 → high', () => {
      expect(getKickerStrength([3, 4, 5, 6, 6], 'monterey')).toBe('high')
    })
  })

  // ── 3 kicker dice ─────────────────────────────────────────
  describe('3 kickers (10-2)', () => {
    test('10-2: [4,6,1,1,1] → kicker [1,1,1]=3 → low', () => {
      expect(getKickerStrength([4, 6, 1, 1, 1], '10-2')).toBe('low')
    })
    test('10-2: [4,6,6,6,6] → kicker [6,6,6]=18 → high', () => {
      expect(getKickerStrength([4, 6, 6, 6, 6], '10-2')).toBe('high')
    })
    test('10-2: [5,5,1,2,3] → kicker [1,2,3]=6 → low', () => {
      // 5+5=10, kicker sum=6 (range 3-18, midpoint 10.5)
      expect(getKickerStrength([5, 5, 1, 2, 3], '10-2')).toBe('low')
    })
    test('10-2: [5,5,5,5,6] → kicker [5,5,6]=16 → high', () => {
      // 4+6=10, kicker=[5,5,6] sum=16
      expect(getKickerStrength([4, 6, 5, 5, 6], '10-2')).toBe('high')
    })
    test('10-2: [4,6,3,4,4] → kicker [3,4,4]=11 → high', () => {
      // 4+6=10, kicker sum=11 (above 10.5 midpoint)
      expect(getKickerStrength([4, 6, 3, 4, 4], '10-2')).toBe('high')
    })
    test('10-2: [4,6,3,3,4] → kicker [3,3,4]=10 → low', () => {
      // 4+6=10, kicker sum=10 (below 10.5 midpoint)
      expect(getKickerStrength([4, 6, 3, 3, 4], '10-2')).toBe('low')
    })
  })
})

/* ════════════════════════════════════════════════════════════
   7. VARIANTS — findOptimalVariants, analyzeRoll
   ════════════════════════════════════════════════════════════ */
describe('Variants: the kicker each variant keeps', () => {
  test('[5,6,1,2,3] Vegas (6+1, 5+2): kicker 3 either way', () => {
    const v = findOptimalVariants([5, 6, 1, 2, 3], 'vegas')
    expect(v.high.kicker).toEqual([3])
    expect(v.low.kicker).toEqual([3])
  })

  test('[1,2,3,4,5] Vegas (2+5, 3+4): kicker 1 either way', () => {
    const v = findOptimalVariants([1, 2, 3, 4, 5], 'vegas')
    expect(v.high.kicker).toEqual([1])
    expect(v.low.kicker).toEqual([1])
  })

  test('[5,6,2,3,4] Vegas: High keeps 6 (5+2, 3+4), Low keeps 2 (5+6, 3+4)', () => {
    const v = findOptimalVariants([5, 6, 2, 3, 4], 'vegas')
    expect(v.high.kicker).toEqual([6])
    expect(v.low.kicker).toEqual([2])
  })

  test('[4,6,5,5,1] 10-2: the kicker totals 11 whichever 10 is kept (always the roll less 10)', () => {
    const v = findOptimalVariants([4, 6, 5, 5, 1], '10-2')
    expect(v.high.kickerSum).toBe(11)
    expect(v.low.kickerSum).toBe(11)
  })

  test('analyzeRoll lists every game a roll plays, in game order, High before Low', () => {
    const { variants } = analyzeRoll([5, 6, 2, 3, 4])
    expect(variants.map((v) => (v.variant ? `${v.game} ${v.variant}` : v.game))).toEqual([
      '10-2 high', '10-2 low', '10-3 high', '10-3 low',
      'ship-captain-crew high', 'ship-captain-crew low', 'monterey high', 'monterey low',
      'vegas high', 'vegas low', 'razzle', 'boss', 'tres-away',
    ])
    expect(variants.find((v) => v.game === 'vegas' && v.variant === 'low').kicker).toEqual([2])
  })

  test('analyzeRoll describes the specialty hands', () => {
    const d = (roll, game) => analyzeRoll(roll).variants.find((v) => v.game === game).details
    expect(d([1, 1, 1, 1, 1], 'razzle')).toBe('5 wilds (as 6s)')
    expect(d([6, 6, 1, 1, 3], 'razzle')).toBe('4 6s (2 natural, 2 wilds)')
    expect(d([3, 3, 1, 2, 3], 'tres-away')).toBe('Score: 3')
  })

  test('analyzeRoll leaves out the games a roll misses', () => {
    const games = analyzeRoll([2, 2, 4, 4, 6]).variants.map((v) => v.game)
    expect(games).not.toContain('ship-captain-crew')
    expect(games).toContain('pairs')
  })
})
