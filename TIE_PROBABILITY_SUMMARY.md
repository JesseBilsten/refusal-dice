# Comprehensive Tie Probability System - Summary

## What Changed

Previously, tie probabilities were rough estimates that didn't account for:
- Multi-roll mechanics (most games have 3 rolls, not 1)
- Partial keeper rules (ability to keep dice between rolls)
- Kicker values (what the actual kicker digits are)

Now, the system properly models the complete opponent's journey to tie or beat you.

## How It Works

### For Kicker Games (10-2, 10-3, 10-4, SCC, Monterey, Vegas, Pairs)

**Step 1: Calculate base hand probability over 3 rolls**
```
Single roll probability (e.g., SCC has 31.64% to get 123 or 456)
Improvement factor (accounts for partial keepers, e.g., SCC = 1.5x)
P(make hand in 3 rolls) = min(0.95, (1 - (1 - p₁)³) × factor)

Example: SCC
p₁ = 0.3164 (31.64%)
factor = 1.5
P(3 rolls) = (1 - (1 - 0.3164)³) × 1.5 = ~95%
```

**Step 2: Calculate kicker tie/beat probability**
```
For PERFECT kickers (rawStrength ≥ 99.5%):
  Can only be TIED (not beaten)
  P(opponent ties) = (1/6)^N where N = number of kicker dice
  
  Examples:
  - 10-4 (1 kicker die): P(tie) = 1/6 = 16.67%
  - SCC (2 kicker dice): P(tie) = (1/6)² = 2.78%
  - 10-2 (3 kicker dice): P(tie) = (1/6)³ = 0.46%

For NON-PERFECT kickers:
  Can be TIED or BEATEN
  P(opponent ties/beats) = 1 - (rawStrength / 100)

Example: SCC high with [66] kicker
rawStrength = 100%
P(ties/beats) = (1/6)² = 2.78%

Example: SCC high with [23] kicker  
rawStrength = 27.78%
P(ties/beats) = 1 - 0.2778 = 72.22%
```

**Step 3: Combine probabilities**
```
P(tie/beat) = P(make hand) × P(tie/beat kicker)

Example: SCC high with [66] kicker (PERFECT)
P(tie/beat) = 0.95 × 0.0278 = 2.64%

Example: SCC high with [23] kicker (NON-PERFECT)
rawStrength = 27.78%
P(tie/beat) = 0.95 × (1 - 0.2778) = 68.6%

Example: 10-4 high with [6] kicker (PERFECT, only 1 kicker die!)
P(tie/beat) = 0.69 × (1/6) = 11.48%
```

### For Non-Kicker Games

**Boss** (2 rolls, exact matching):
- Uses strength tiers: perfect=0.4%, high=1%, good=3%, avg=10%, weak=30%
- Accounts for value-based ranking (exact match required to tie)

**Razzle** (3 rolls, wilds):
- Perfect (5 matching): 13.17% (calculated via dynamic programming)
- 4 matching: 40%
- 3 matching: 65%
- Weak: 85%

**Tres Away** (up to 5 rolls, scoring):
- Perfect score: 0.2%
- Excellent: 5%
- Good: 20%
- Higher scores: 50%

## Partial Keeper Rules

Each game has specific rules for what can be kept:

| Game | Keeper Rule | Improvement Factor |
|------|-------------|-------------------|
| 10-2 | Any 2 dice summing to 10 | 1.4x |
| 10-3 | Any 3 dice summing to 10 | 1.4x |
| 10-4 | Any 4 dice summing to 10 | 1.3x |
| SCC | [12xxx] or [65xxx] | 1.5x |
| Monterey | [23xxx], [34xxx], [45xxx] | 1.5x |
| Vegas | Partial 7/11 combos | 1.4x |
| Pairs | Any solo pair | 1.6x |

Higher improvement factors mean better keeper rules → higher probability of making the hand.

## Integration with Strength Calculations

The tie probability directly impacts offensive strength:

```javascript
// Calculate opponent's tie/beat probability
const tieProb = calculateOpponentTieOrBeatProbability(rawStrength, game, handDetails)

// Adjust percentile by subtracting tie risk
const adjustedPercentile = (rawStrength / 100) - tieProb

// Calculate offensive strength (probability of not having worst hand)
const offensiveStrength = (1 - Math.pow(1 - adjustedPercentile, numOpponents)) * 100
```

**Example with 2 opponents (3 players total):**

```
SCC high [654] with [66] kicker:
- rawStrength: 100%
- tieProb: 0.00 (0%)
- adjustedPercentile: 1.00 - 0.00 = 1.00
- offensiveStrength: (1 - (1 - 1.00)²) × 100 = 100%
✓ Nearly guaranteed to not have worst hand

Boss [666] 3-of-a-kind:
- rawStrength: 56%
- tieProb: 0.10 (10%)
- adjustedPercentile: 0.56 - 0.10 = 0.46
- offensiveStrength: (1 - (1 - 0.46)²) × 100 = 71%
✓ Good but not guaranteed
```

## Key Insights

1. **Perfect kickers CAN be tied**: SCC with [66] kicker has 2.64% tie risk because opponent can also get [66]
   - Probability = P(make hand) × P(exact kicker match)
   - 2 kicker dice: (1/6)² = 2.78%
   - 3 kicker dice: (1/6)³ = 0.46%
   - 1 kicker die: (1/6)¹ = 16.67%

2. **10-4 is riskiest for perfect hands**: With only 1 kicker die, even perfect kickers have 11.48% tie risk!

3. **Weak kickers are very risky**: SCC with [23] kicker has 68.6% tie risk because:
   - Make SCC (95% over 3 rolls) AND
   - Beat [23] kicker (72.2% chance)
   - Total: 68.6%

4. **Razzle is still riskiest overall**: Even perfect Razzle [66666] has 13.17% tie risk because ANY 5 matching dice tie (not just [66666])

5. **Boss is safest**: Perfect Boss [66666] has only 0.4% tie risk because ONLY [66666] ties (not any 5-of-a-kind)

6. **Number of opponents compounds risk**: With N opponents:
   ```
   P(at least one beats you) = 1 - (1 - p)^N
   
   Example: SCC perfect [66] with 2.64% tie risk per opponent
   - 1 opponent: 2.64%
   - 2 opponents: 5.20%
   - 3 opponents: 7.70%
   - 7 opponents: 17.4%
   ```

## Testing Examples

Run these scripts to explore the system:

```bash
# Test kicker game probabilities at different strength levels
node test-kicker-probabilities.js

# Test with actual roll scenarios
node test-kicker-scenarios.js

# Test UI integration and hammer strategy
node test-ui-integration.js
```

## Next Steps

With comprehensive tie probabilities in place, we can now:

1. ✅ Generate accurate offensive/defensive strength rankings
2. ⏳ Build hammer strategy recommendations (best first/second call)
3. ⏳ Build refuser strategy recommendations (which calls to accept)
4. ⏳ Create strategy UI (Hammer Mode vs Refuser Mode)
