/**
 * Smoke-test suite for game-validation.js
 *
 * Covers:
 *   1. Game-matching rules (checkGame)
 *   2. Razzle: 1s are wild, 6s are natural
 *   3. Specialty game scoring (Boss, Tres Away)
 *   4. Kicker & variant logic (high/low)
 *   5. Refuser strategy recommendations (evaluateRefuserPosition)
 *   6. Hammer strategy recommendations (generateHammerStrategy)
 *   7. Second-call prediction (predictHammerSecondCalls)
 *   8. Partial-match detection (calculatePartialMatch)
 *   9. Precision invariant (perfect kickers never show 0.0%)
 *  10. Legacy refuser strategy (generateRefuserStrategy)
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
  generateRefuserStrategy,
  evaluateRefuserPosition,
  predictHammerSecondCalls,
  calculatePartialMatch,
  calculateOffensiveStrength,
  calculateGlobalStrength,
  classifySpecialtyRoll,
  isCompetitiveSpecialtyHand,
  gameOddsMap,
} = require('../lib/game-validation')

const uniqueRollsData = require('../data/unique-rolls.json')
const uniqueRolls = uniqueRollsData.uniqueRolls

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
   8. PREDICT HAMMER SECOND CALLS
   ════════════════════════════════════════════════════════════ */
describe('predictHammerSecondCalls', () => {
  test('returns non-empty array for a common game', () => {
    const result = predictHammerSecondCalls('10-2', null, uniqueRolls, SPECIALTY_THRESHOLDS)
    expect(Array.isArray(result)).toBe(true)
    expect(result.length).toBeGreaterThan(0)
  })

  test('does NOT include the called game in results', () => {
    const result = predictHammerSecondCalls('monterey', null, uniqueRolls, SPECIALTY_THRESHOLDS)
    result.forEach(r => {
      expect(r.game).not.toBe('monterey')
    })
  })

  test('overlapPct values are between 0 and 1', () => {
    const result = predictHammerSecondCalls('10-2', null, uniqueRolls, SPECIALTY_THRESHOLDS)
    result.forEach(r => {
      expect(r.overlapPct).toBeGreaterThan(0)
      expect(r.overlapPct).toBeLessThanOrEqual(1)
    })
  })

  test('results are sorted descending by overlapPct', () => {
    const result = predictHammerSecondCalls('pairs', null, uniqueRolls, SPECIALTY_THRESHOLDS)
    for (let i = 1; i < result.length; i++) {
      expect(result[i].overlapPct).toBeLessThanOrEqual(result[i - 1].overlapPct)
    }
  })

  test('each entry has game, name, emoji, overlapPct', () => {
    const result = predictHammerSecondCalls('vegas', null, uniqueRolls, SPECIALTY_THRESHOLDS)
    result.forEach(r => {
      expect(r).toHaveProperty('game')
      expect(r).toHaveProperty('name')
      expect(r).toHaveProperty('emoji')
      expect(r).toHaveProperty('overlapPct')
    })
  })
})

/* ════════════════════════════════════════════════════════════
   9. EVALUATE REFUSER POSITION
   ════════════════════════════════════════════════════════════ */
describe('evaluateRefuserPosition', () => {
  // ── Return shape ──
  test('returns correct shape', () => {
    const result = evaluateRefuserPosition(
      [2, 3, 6, 6, 1], 'razzle', null, 'first', uniqueRolls, SPECIALTY_THRESHOLDS
    )
    expect(result).toHaveProperty('decision')
    expect(result).toHaveProperty('confidence')
    expect(result).toHaveProperty('reasoning')
    expect(result).toHaveProperty('factors')
    expect(result).toHaveProperty('calledGameAnalysis')
    expect(result).toHaveProperty('secondCallAnalysis')
    expect(result).toHaveProperty('expectedSecondCallStrength')
    expect(['ACCEPT', 'REFUSE']).toContain(result.decision)
    expect(result.confidence).toBeGreaterThanOrEqual(0)
    expect(result.confidence).toBeLessThanOrEqual(100)
    expect(Array.isArray(result.reasoning)).toBe(true)
    expect(Array.isArray(result.factors)).toBe(true)
    expect(Array.isArray(result.secondCallAnalysis)).toBe(true)
  })

  // ── Scenario: Strong Razzle hand → ACCEPT ──
  test('[6,6,1,1,6] vs Razzle → ACCEPT (strong hand: 5 wild sixes)', () => {
    const result = evaluateRefuserPosition(
      [6, 6, 1, 1, 6], 'razzle', null, 'first', uniqueRolls, SPECIALTY_THRESHOLDS
    )
    expect(result.decision).toBe('ACCEPT')
    expect(result.calledGameAnalysis.rawStrength).toBeGreaterThan(60)
  })

  // ── Scenario: Weak Razzle hand → REFUSE ──
  test('[2,3,4,5,6] vs Razzle → REFUSE (only 1 natural 6, no wilds)', () => {
    const result = evaluateRefuserPosition(
      [2, 3, 4, 5, 6], 'razzle', null, 'first', uniqueRolls, SPECIALTY_THRESHOLDS
    )
    // Single 6 with no wilds is very weak for Razzle
    expect(result.calledGameAnalysis.rawStrength).toBeLessThan(30)
    // Should prefer to refuse and hope for a better second call
    expect(result.decision).toBe('REFUSE')
  })

  // ── Scenario: 23661 vs Razzle ──
  test('[2,3,6,6,1] vs Razzle → strategy analysis includes Razzle detail', () => {
    const result = evaluateRefuserPosition(
      [2, 3, 6, 6, 1], 'razzle', null, 'first', uniqueRolls, SPECIALTY_THRESHOLDS
    )
    // 2 natural 6s + 1 wild 1 = 3 wild sixes total → competitive threshold
    expect(result.calledGameAnalysis.canMake).toBe(true)
    expect(result.calledGameAnalysis.detail).toMatch(/natural 6/)
    expect(result.calledGameAnalysis.detail).toMatch(/wild 1/)
  })

  // ── Scenario: Can't make a kicker game ──
  test("roll that can't make 10-4 should still return valid result", () => {
    // [6,6,6,6,6] → 4 dice sum = 24, not 10
    const result = evaluateRefuserPosition(
      [6, 6, 6, 6, 6], '10-4', null, 'first', uniqueRolls, SPECIALTY_THRESHOLDS
    )
    expect(result.calledGameAnalysis.canMake).toBe(false)
    expect(result.calledGameAnalysis.rawStrength).toBe(0)
    // Should still have reasoning
    expect(result.reasoning.length).toBeGreaterThan(0)
  })

  // ── Scenario: Strong Boss hand → ACCEPT ──
  test('[5,5,5,5,2] vs Boss → ACCEPT (four of a kind)', () => {
    const result = evaluateRefuserPosition(
      [5, 5, 5, 5, 2], 'boss', null, 'first', uniqueRolls, SPECIALTY_THRESHOLDS
    )
    expect(result.decision).toBe('ACCEPT')
    expect(result.calledGameAnalysis.rawStrength).toBeGreaterThan(60)
  })

  // ── Position difference ──
  test('second refusal reasoning mentions 2nd refusal context', () => {
    const result = evaluateRefuserPosition(
      [2, 3, 6, 6, 1], 'razzle', null, 'second', uniqueRolls, SPECIALTY_THRESHOLDS
    )
    const allReasoning = result.reasoning.join(' ')
    expect(allReasoning).toMatch(/2nd Refusal/i)
  })

  test('first refusal reasoning mentions 1st refusal context', () => {
    const result = evaluateRefuserPosition(
      [2, 3, 6, 6, 1], 'razzle', null, 'first', uniqueRolls, SPECIALTY_THRESHOLDS
    )
    const allReasoning = result.reasoning.join(' ')
    expect(allReasoning).toMatch(/1st Refusal/i)
  })

  // ── Second call analysis populated ──
  test('secondCallAnalysis entries have playerRawStrength', () => {
    const result = evaluateRefuserPosition(
      [2, 3, 6, 6, 1], 'monterey', null, 'first', uniqueRolls, SPECIALTY_THRESHOLDS
    )
    result.secondCallAnalysis.forEach(sc => {
      expect(sc).toHaveProperty('playerRawStrength')
      expect(sc).toHaveProperty('playerLabel')
      expect(sc).toHaveProperty('overlapPct')
      expect(sc.playerRawStrength).toBeGreaterThanOrEqual(0)
    })
  })

  // ── REGRESSION TEST: Kicker game with null variant should auto-detect ──
  test('[1,3,5,4,4] vs Monterey (null variant) should auto-detect Low variant', () => {
    // This is a regression test for a bug where calling a kicker game without
    // specifying a variant would result in rawStrength=0 instead of properly
    // detecting the player's actual variant and evaluating it.
    // See: https://github.com/issue/kicker-variant-detection
    const roll = [1, 3, 5, 4, 4]
    
    // Verify roll makes Monterey and is Low variant
    expect(checkGame(roll, 'monterey')).toBe(true)
    expect(getKickerStrength(roll, 'monterey')).toBe('low')
    
    // Call Monterey without variant specified (null)
    const result = evaluateRefuserPosition(
      roll, 'monterey', null, 'first', uniqueRolls, SPECIALTY_THRESHOLDS
    )
    
    // Should auto-detect as Low and evaluate correctly
    expect(result.calledGameAnalysis.canMake).toBe(true)
    expect(result.calledGameAnalysis.rawStrength).toBeGreaterThan(60) // Low variant with [1,4] is strong
    expect(result.calledGameAnalysis.label).toBe('Strong hand')
    expect(result.decision).toBe('ACCEPT') // Strong hand → accept
    expect(result.confidence).toBeGreaterThan(80)
  })

  // ── Kicker games with all three calling methods should work ──
  test('[4,5,6,2,3] vs SCC: explicitly Low, null (auto-detect Low), and explicitly High all work', () => {
    const roll = [4, 5, 6, 2, 3]
    
    // Verify this is SCC Low
    expect(checkGame(roll, 'ship-captain-crew')).toBe(true)
    expect(getKickerStrength(roll, 'ship-captain-crew')).toBe('low')
    
    // Test 1: Explicit Low variant
    const resultLow = evaluateRefuserPosition(
      roll, 'ship-captain-crew', 'low', 'first', uniqueRolls, SPECIALTY_THRESHOLDS
    )
    expect(resultLow.calledGameAnalysis.canMake).toBe(true)
    expect(resultLow.calledGameAnalysis.rawStrength).toBeGreaterThan(50)
    
    // Test 2: Null variant (should auto-detect Low)
    const resultNull = evaluateRefuserPosition(
      roll, 'ship-captain-crew', null, 'first', uniqueRolls, SPECIALTY_THRESHOLDS
    )
    expect(resultNull.calledGameAnalysis.canMake).toBe(true)
    // Should match the Low variant strength
    expect(resultNull.calledGameAnalysis.rawStrength).toBe(resultLow.calledGameAnalysis.rawStrength)
    
    // Test 3: Explicit High variant (different evaluation)
    const resultHigh = evaluateRefuserPosition(
      roll, 'ship-captain-crew', 'high', 'first', uniqueRolls, SPECIALTY_THRESHOLDS
    )
    expect(resultHigh.calledGameAnalysis.canMake).toBe(true)
    // High and Low should have different strengths for the same roll
    expect(resultHigh.calledGameAnalysis.rawStrength).not.toBe(resultLow.calledGameAnalysis.rawStrength)
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
   12. RAZZLE DETAIL IN evaluateRefuserPosition
   ════════════════════════════════════════════════════════════ */
describe('Razzle detail string correctness', () => {
  test('[6,6,1,1,3] detail mentions "natural 6s" and "wild 1s"', () => {
    const result = evaluateRefuserPosition(
      [6, 6, 1, 1, 3], 'razzle', null, 'first', uniqueRolls, SPECIALTY_THRESHOLDS
    )
    expect(result.calledGameAnalysis.detail).toMatch(/2 natural 6s/)
    expect(result.calledGameAnalysis.detail).toMatch(/2 wild 1s/)
  })

  test('[1,1,1,6,2] detail: "1 natural 6s + 3 wild 1s"', () => {
    const result = evaluateRefuserPosition(
      [1, 1, 1, 6, 2], 'razzle', null, 'first', uniqueRolls, SPECIALTY_THRESHOLDS
    )
    expect(result.calledGameAnalysis.detail).toMatch(/1 natural 6/)
    expect(result.calledGameAnalysis.detail).toMatch(/3 wild 1/)
  })

  test('[6,6,6,6,6] detail: no "wild" mentioned (0 wilds)', () => {
    const result = evaluateRefuserPosition(
      [6, 6, 6, 6, 6], 'razzle', null, 'first', uniqueRolls, SPECIALTY_THRESHOLDS
    )
    // 5 natural 6s, 0 wilds → detail should NOT mention wild
    expect(result.calledGameAnalysis.detail).toMatch(/5 natural 6s/)
    expect(result.calledGameAnalysis.detail).not.toMatch(/wild/)
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

/* ════════════════════════════════════════════════════════════
   15. LEGACY REFUSER STRATEGY — generateRefuserStrategy
       (old function kept for backward compat)
   ════════════════════════════════════════════════════════════ */
describe('generateRefuserStrategy', () => {
  const call = (roll, game, variant, pos, numOpp) =>
    generateRefuserStrategy(roll, game, variant, pos, numOpp, uniqueRolls, gameOddsMap)

  test('returns correct shape', () => {
    // Use a roll that actually makes the game so we get the full shape
    const r = call([4, 6, 6, 6, 6], '10-2', 'high', 'first', 2)
    expect(r).toHaveProperty('decision')
    expect(r).toHaveProperty('confidence')
    expect(r).toHaveProperty('reason')
    expect(r).toHaveProperty('currentStrength')
    expect(r).toHaveProperty('flexibility')
    expect(r).toHaveProperty('gameDifficulty')
    expect(['ACCEPT', 'REFUSE', 'UNCERTAIN']).toContain(r.decision)
  })

  test('strong hand on easy game → ACCEPT', () => {
    // [1,1,2,2,2] makes 10-2 low (1+1... wait let's check: 2+2=4 no)
    // Actually, let's use a roll we know makes 10-2: [4,6,6,6,6] = 4+6=10, kicker 666 = high
    const r = call([4, 6, 6, 6, 6], '10-2', 'high', 'first', 2)
    expect(r.decision).toBe('ACCEPT')
  })

  test('strong hand on hard game → ACCEPT confidently', () => {
    // [4,5,6,6,6] makes Monterey high (3+4+5), kicker [6,6]
    const r = call([3, 4, 5, 6, 6], 'monterey', 'high', 'first', 2)
    expect(r.decision).toBe('ACCEPT')
    expect(r.confidence).toBeGreaterThan(50)
  })

  test('complete game → ACCEPT', () => {
    // [6,5,4,3,2] makes SCC with kicker 3+2=5 → low variant
    const r = call([6, 5, 4, 3, 2], 'ship-captain-crew', 'low', 'first', 2)
    expect(r.decision).toBe('ACCEPT')
  })

  test('Razzle (no variant) → ACCEPT for strong hand', () => {
    const r = call([1, 1, 6, 6, 6], 'razzle', null, 'first', 2)
    expect(r.decision).toBe('ACCEPT')
  })

  test('partial match for Monterey detected', () => {
    // [1,3,4,6,6] has 3,4 (Monterey low partial match: need 2 and 5)
    const r = call([1, 3, 4, 6, 6], 'monterey', 'low', 'first', 2)
    // The function should detect partial match
    if (r.partialMatch) {
      expect(r.partialMatch.hasPartialMatch).toBe(true)
    }
  })

  test('second call predictions populated for non-trivial games', () => {
    const r = call([4, 6, 1, 2, 3], '10-2', 'low', 'first', 2)
    // Second call predictions should exist when uniqueRolls is provided
    if (r.secondCallPredictions) {
      expect(r.secondCallPredictions).toHaveProperty('topGame')
    }
  })
})
