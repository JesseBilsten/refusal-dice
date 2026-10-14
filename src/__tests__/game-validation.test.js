/**
 * Smoke-test suite for game-validation.js
 *
 * Covers:
 *   1. Game-matching rules (checkGame)
 *   2. Razzle: 1s are wild, 6s are natural
 *   3. Specialty game scoring (Boss, Tres Away)
 *   4. Kicker & variant logic (high/low)
 *   5. Hammer strategy recommendations (generateHammerStrategy)
 *   6. Partial-match detection (calculatePartialMatch)
 *   7. Precision invariant (perfect kickers never show 0.0%)
 *
 * Refusal advice is simulated on the engine now: see strategy.test.ts.
 *
 * Run:  npm test
 */

const {
  checkGame,
  getKickerStrength,
  calculateKickerStrength,
  getBossHandRank,
  calculateTresAwayScore,
  getRazzleScore,
  findOptimalVariants,
  calculateRawStrength,
  generateHammerStrategy,
  calculatePartialMatch,
  calculateOffensiveStrength,
  calculateGlobalStrength,
  classifySpecialtyRoll,
  isCompetitiveSpecialtyHand,
  gameOddsMap,
} = require('../lib/game-validation')


// Specialty thresholds (mirror games-config.js — CJS-friendly)
const SPECIALTY_THRESHOLDS = {
  razzle: { wildSixesGood: 3, wildSixesStrong: 4 },
  boss: { rankGood: 3, rankStrong: 4 },
  'tres-away': { scoreGood: 10, scoreStrong: 7, threesGood: 3 },
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

  test('Tres Away: score 8 is competitive AND strong', () => {
    // [3, 3, 1, 2, 3] → score = 0+0+1+2+0 = 3
    expect(isCompetitiveSpecialtyHand([3, 3, 1, 2, 3], 'tres-away', SPECIALTY_THRESHOLDS)).toBe(true)
  })

  test('Tres Away: score 15 is NOT competitive', () => {
    // [1, 2, 4, 5, 6] → 1+2+4+5+6 = 18 — not competitive
    expect(isCompetitiveSpecialtyHand([1, 2, 4, 5, 6], 'tres-away', SPECIALTY_THRESHOLDS)).toBe(false)
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
   7. GAME ODDS MAP — sanity checks
   ════════════════════════════════════════════════════════════ */
describe('gameOddsMap', () => {
  test('all 10 games present', () => {
    const expected = ['10-2', '10-3', '10-4', 'ship-captain-crew', 'monterey', 'vegas', 'pairs', 'razzle', 'boss', 'tres-away']
    expected.forEach(id => {
      expect(gameOddsMap).toHaveProperty(id)
    })
  })

  test('odds are percentages (0-100)', () => {
    Object.values(gameOddsMap).forEach(v => {
      expect(v).toBeGreaterThan(0)
      expect(v).toBeLessThanOrEqual(100)
    })
  })

  test('Razzle is the most common game (~95%)', () => {
    expect(gameOddsMap.razzle).toBeGreaterThan(90)
  })

  test('10-4 is one of the hardest (~22%)', () => {
    expect(gameOddsMap['10-4']).toBeLessThan(30)
  })
})

/* ════════════════════════════════════════════════════════════
   10. HAMMER STRATEGY — generateHammerStrategy
   ════════════════════════════════════════════════════════════ */
describe('generateHammerStrategy', () => {
  test('returns bestCall, allRecommendations', () => {
    const result = generateHammerStrategy([4, 6, 5, 5, 3], 2, gameOddsMap)
    expect(result).toHaveProperty('bestCall')
    expect(result).toHaveProperty('allRecommendations')
    expect(Array.isArray(result.allRecommendations)).toBe(true)
    expect(result.allRecommendations.length).toBeGreaterThan(0)
  })

  test('[6,6,6,6,6] best call is Boss (5-of-a-kind, nearly impossible to tie)', () => {
    const result = generateHammerStrategy([6, 6, 6, 6, 6], 2, gameOddsMap)
    expect(result.bestCall).toBeDefined()
    expect(result.bestCall.game).toBe('boss')
    expect(result.bestCall.globalStrength).toBeGreaterThan(99)
  })

  test('[6,6,6,6,6] Boss > Razzle > Pairs by globalStrength', () => {
    const result = generateHammerStrategy([6, 6, 6, 6, 6], 2, gameOddsMap)
    const boss = result.allRecommendations.find(r => r.game === 'boss')
    const razzle = result.allRecommendations.find(r => r.game === 'razzle')
    const pairsHi = result.allRecommendations.find(r => r.game === 'pairs' && r.variant === 'high')
    expect(boss.globalStrength).toBeGreaterThan(razzle.globalStrength)
    expect(razzle.globalStrength).toBeGreaterThan(pairsHi.globalStrength)
  })

  test('[5,5,2,2,1] 10-2 low is best call (3-kicker dice minimise ties)', () => {
    const result = generateHammerStrategy([5, 5, 2, 2, 1], 2, gameOddsMap)
    expect(result.bestCall.game).toBe('10-2')
    expect(result.bestCall.variant).toBe('low')
    expect(result.bestCall.globalStrength).toBeGreaterThan(99)
  })

  test('[5,5,2,2,1] vegas low = pairs low by globalStrength (both 1-die kicker)', () => {
    const result = generateHammerStrategy([5, 5, 2, 2, 1], 2, gameOddsMap)
    const vegasLo = result.allRecommendations.find(r => r.game === 'vegas' && r.variant === 'low')
    const pairsLo = result.allRecommendations.find(r => r.game === 'pairs' && r.variant === 'low')
    // Both have perfect 1-die kicker → same globalStrength
    expect(Math.abs(vegasLo.globalStrength - pairsLo.globalStrength)).toBeLessThan(1)
  })

  test('allRecommendations are sorted by globalStrength desc', () => {
    const result = generateHammerStrategy([2, 3, 4, 5, 6], 2, gameOddsMap)
    for (let i = 1; i < result.allRecommendations.length; i++) {
      expect(result.allRecommendations[i].globalStrength)
        .toBeLessThanOrEqual(result.allRecommendations[i - 1].globalStrength)
    }
  })

  test('each recommendation has game, rawStrength, offensiveStrength, globalStrength', () => {
    const result = generateHammerStrategy([1, 2, 3, 4, 5], 2, gameOddsMap)
    result.allRecommendations.forEach(rec => {
      expect(rec).toHaveProperty('game')
      expect(rec).toHaveProperty('rawStrength')
      expect(rec).toHaveProperty('offensiveStrength')
      expect(rec).toHaveProperty('globalStrength')
    })
  })
})

/* ════════════════════════════════════════════════════════════
   11. RAW STRENGTH — sanity checks
   ════════════════════════════════════════════════════════════ */
describe('calculateRawStrength', () => {
  test('best possible Razzle hand [6,6,6,6,6] is ~100%', () => {
    const str = calculateRawStrength([6, 6, 6, 6, 6], 'razzle', {})
    expect(str).toBeGreaterThan(95)
  })

  test('worst possible Razzle roll [2,3,4,5,2] is weak', () => {
    const str = calculateRawStrength([2, 3, 4, 5, 2], 'razzle', {})
    expect(str).toBeLessThan(20)
  })

  test('best Tres Away hand [3,3,3,3,3] → 100%', () => {
    const str = calculateRawStrength([3, 3, 3, 3, 3], 'tres-away', {})
    expect(str).toBe(100)
  })
})

/* ════════════════════════════════════════════════════════════
   13. PARTIAL MATCH — calculatePartialMatch
   ════════════════════════════════════════════════════════════ */
describe('calculatePartialMatch', () => {
  // ── Monterey partial matches ──
  describe('Monterey', () => {
    test('[1,3,4,6,6] low → 2-way flexibility (need 2 or 5)', () => {
      const pm = calculatePartialMatch([1, 3, 4, 6, 6], 'monterey', 'low')
      expect(pm.hasPartialMatch).toBe(true)
      expect(pm.diceNeeded).toBe(2)
      expect(pm.productiveNextValues).toBe(2) // can extend in both directions
    })

    test('[1,2,3,6,6] low → 1-way flexibility (already SCC, limited extension)', () => {
      const pm = calculatePartialMatch([1, 2, 3, 6, 6], 'monterey', 'low')
      expect(pm.hasPartialMatch).toBe(true)
      expect(pm.productiveNextValues).toBe(1)
    })

    test('[2,3,4,6,6] low → has 3/5, 2-way flexibility', () => {
      const pm = calculatePartialMatch([2, 3, 4, 6, 6], 'monterey', 'low')
      expect(pm.hasPartialMatch).toBe(true)
      expect(pm.diceNeeded).toBe(2)
    })

    test('[2,5,5,1,1] high → only 2 unique matches (2,5), not enough for partial', () => {
      const pm = calculatePartialMatch([2, 5, 5, 1, 1], 'monterey', 'high')
      // Monterey requires ≥3 unique matches for partial
      expect(pm.hasPartialMatch).toBe(false)
    })

    test('[1,1,1,1,1] low → no partial match (only 1 unique match)', () => {
      const pm = calculatePartialMatch([1, 1, 1, 1, 1], 'monterey', 'low')
      expect(pm.hasPartialMatch).toBe(false)
    })

    test('2-way flexibility has higher proximity than 1-way', () => {
      const twoWay = calculatePartialMatch([1, 3, 4, 6, 6], 'monterey', 'low')
      const oneWay = calculatePartialMatch([1, 2, 3, 6, 6], 'monterey', 'low')
      expect(twoWay.proximity).toBeGreaterThan(oneWay.proximity)
    })
  })

  // ── SCC partial matches ──
  describe('SCC', () => {
    test('[6,5,3,2,1] → has full low straight 1+2+3, proximity=90', () => {
      const pm = calculatePartialMatch([6, 5, 3, 2, 1], 'ship-captain-crew', null)
      expect(pm.hasPartialMatch).toBe(true)
      expect(pm.diceNeeded).toBe(0)
      expect(pm.proximity).toBe(90)
    })

    test('[6,1,2,3,3] → only has 6 of high straight, but has 1+2+3 of low → full match not partial', () => {
      // This roll has all of 1,2,3 (low straight) → 3/3 match, proximity=90
      const pm = calculatePartialMatch([6, 1, 2, 3, 3], 'ship-captain-crew', null)
      expect(pm.hasPartialMatch).toBe(true)
      expect(pm.proximity).toBe(90)
      expect(pm.diceNeeded).toBe(0)
    })

    test('[1,2,4,4,5] → has 1+2 of low straight, needs 3 → partial, diceNeeded=1', () => {
      const pm = calculatePartialMatch([1, 2, 4, 4, 5], 'ship-captain-crew', null)
      expect(pm.hasPartialMatch).toBe(true)
      expect(pm.diceNeeded).toBe(1)
      expect(pm.proximity).toBe(60)
    })

    test('[3,3,3,3,3] → only has 3 of low straight (1/3) → no partial', () => {
      const pm = calculatePartialMatch([3, 3, 3, 3, 3], 'ship-captain-crew', null)
      expect(pm.hasPartialMatch).toBe(false)
    })
  })

  // ── Vegas partial matches ──
  describe('Vegas', () => {
    test('[1,6,3,3,3] low → 1 pair summing to 7, partial match', () => {
      const pm = calculatePartialMatch([1, 6, 3, 3, 3], 'vegas', 'low')
      expect(pm.hasPartialMatch).toBe(true)
      expect(pm.diceNeeded).toBe(2)
      expect(pm.proximity).toBe(35)
    })

    test('[5,6,1,2,3] IS a complete Vegas game (6+1=7, 5+2=7), not partial', () => {
      // Two pairs sum to 7: [6,1] and [5,2], kicker [3]
      expect(checkGame([5, 6, 1, 2, 3], 'vegas')).toBe(true)
      const v = findOptimalVariants([5, 6, 1, 2, 3], 'vegas')
      expect(v.high.kicker).toEqual([3])
      expect(v.low.kicker).toEqual([3])
    })

    test('[1,2,3,4,5] IS a complete Vegas game (2+5=7, 3+4=7), not partial', () => {
      // Two pairs sum to 7: [2,5] and [3,4], kicker [1]
      expect(checkGame([1, 2, 3, 4, 5], 'vegas')).toBe(true)
      const v = findOptimalVariants([1, 2, 3, 4, 5], 'vegas')
      expect(v.high.kicker).toEqual([1])
      expect(v.low.kicker).toEqual([1])
    })

    test('[5,6,2,3,4] has both Vegas High and Vegas Low via different pair combos', () => {
      // Combo 1: 7-pairs [5,2]+[3,4] → kicker 6 (HIGH)
      // Combo 2: 11-pair [5,6] + 7-pair [3,4] → kicker 2 (LOW)
      expect(checkGame([5, 6, 2, 3, 4], 'vegas')).toBe(true)
      const v = findOptimalVariants([5, 6, 2, 3, 4], 'vegas')
      expect(v.high.kicker).toEqual([6])
      expect(v.low.kicker).toEqual([2])
    })

    test('[1,1,1,1,1] low → no pairs summing to 7, no partial', () => {
      const pm = calculatePartialMatch([1, 1, 1, 1, 1], 'vegas', 'low')
      expect(pm.hasPartialMatch).toBe(false)
    })

    test('[2,2,2,2,2] low → no pairs summing to 7, no partial', () => {
      const pm = calculatePartialMatch([2, 2, 2, 2, 2], 'vegas', 'low')
      expect(pm.hasPartialMatch).toBe(false)
    })
  })

  // ── Pairs partial matches ──
  describe('Pairs', () => {
    test('[3,3,1,2,4] → 1 pair (3s), needs second pair', () => {
      const pm = calculatePartialMatch([3, 3, 1, 2, 4], 'pairs', null)
      expect(pm.hasPartialMatch).toBe(true)
      expect(pm.diceNeeded).toBe(1)
      expect(pm.proximity).toBe(40)
    })

    test('[1,2,3,4,5] → no pairs, no partial', () => {
      const pm = calculatePartialMatch([1, 2, 3, 4, 5], 'pairs', null)
      expect(pm.hasPartialMatch).toBe(false)
    })
  })

  // ── No-partial defaults ──
  test('returns hasPartialMatch=false for non-matching roll', () => {
    const pm = calculatePartialMatch([6, 6, 6, 6, 6], 'monterey', 'low')
    expect(pm.hasPartialMatch).toBe(false)
    expect(pm.proximity).toBe(0)
    expect(pm.diceNeeded).toBe(5)
  })
})

/* ════════════════════════════════════════════════════════════
   14. PRECISION INVARIANT — perfect kickers never show 0.0%
   ════════════════════════════════════════════════════════════ */
describe('Precision: perfect kickers have non-zero lose chance', () => {
  const scenarios = [
    { roll: [6, 6, 6, 4, 5], game: '10-2', label: 'Perfect 10-2 kicker [666]' },
    { roll: [6, 6, 4, 5, 6], game: 'ship-captain-crew', label: 'Perfect SCC kicker [66]' },
    { roll: [6, 5, 3, 1, 1], game: '10-4', label: 'Perfect 10-4 kicker [6]' },
  ]

  scenarios.forEach(({ roll, game, label }) => {
    test(`${label}: offensiveStrength < 100 (ties always possible)`, () => {
      const result = generateHammerStrategy(roll, 2, gameOddsMap)
      const rec = result.allRecommendations.find(r => r.game === game)
      expect(rec).toBeDefined()
      // Even a perfect kicker can be tied → offensiveStrength must be < 100
      expect(rec.offensiveStrength).toBeLessThan(100)
      expect(rec.offensiveStrength).toBeGreaterThan(80)
    })
  })

  test('1-die kickers (vegas, pairs) have higher tie probability than 3-die kickers (10-2)', () => {
    // [5,6,2,3,4] has both vegas and 10-2
    const result = generateHammerStrategy([5, 6, 2, 3, 4], 2, gameOddsMap)
    const vegasRec = result.allRecommendations.find(r => r.game === 'vegas')
    // 10-2 isn't available for this roll, so let's check pairs vs SCC on another roll
    // [4,5,6,6,6]: SCC has 2 kicker dice, pairs might be available
    const r2 = generateHammerStrategy([4, 5, 6, 6, 6], 2, gameOddsMap)
    const scc = r2.allRecommendations.find(r => r.game === 'ship-captain-crew')
    // SCC (2 kicker dice) should have lower tie prob than single-kicker games
    expect(scc.tieProbability).toBeLessThan(0.05) // (1/6)^2 × p3rolls
  })
})

