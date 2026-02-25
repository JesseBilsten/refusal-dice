# Tie Probability Calculation System

## Overview
The system calculates the probability that an opponent can tie or beat your hand, accounting for:
- Multi-roll mechanics (3 rolls for most games, 2 for Boss, up to 5 for Tres Away)
- Partial keeper rules (what dice can be kept between rolls)
- Kicker values (for games like 10-2, SCC, Monterey, etc.)
- Number of opponents

## Game-Specific Calculations

### Boss (2 rolls, no wilds)
- Perfect [66666]: 0.4% tie risk (exact match required)
- High hands: 1% tie risk
- Good hands: 3% tie risk
- Average hands: 10% tie risk
- Weak hands: 30% tie risk

### Razzle (3 rolls, 1s and 6s are wild)
- Perfect 5 matching: 13.17% tie risk (any 5 matching ties)
- 4+ matching: 40% tie risk
- 3+ matching: 65% tie risk
- Weak hands: 85% tie risk

### Tres Away (up to 5 rolls, score-based)
- Perfect score (0): 0.2% tie risk
- Excellent (1-2): 5% tie risk
- Good (3-5): 20% tie risk
- Higher scores: 50% tie risk

### Kicker Games (3 rolls with partial keepers)

**Base Hand Probabilities (single roll):**
- 10-2: 49.07%
- 10-3: 53.43%
- 10-4: 22.25%
- SCC: 31.64% (has 123 or 456)
- Monterey: 25.46% (has 234, 345, or 456)
- Vegas: 32.41% (has 7 or 11)
- Pairs: 29.01% (has at least 1 pair)

**Improvement Factors (with partial keepers over 3 rolls):**
- 10-2: 1.4x (can keep any 2 dice summing to 10)
- 10-3: 1.4x (can keep any 3 dice summing to 10)
- 10-4: 1.3x (can keep 4 dice summing to 10)
- SCC: 1.5x (can keep [12xxx] or [65xxx])
- Monterey: 1.5x (can keep [23xxx], [34xxx], [45xxx])
- Vegas: 1.4x (can keep partial 7/11)
- Pairs: 1.6x (can keep any solo pair)

**3-Roll Success Rate:**
P(make hand in 3 rolls) = min(0.95, (1 - (1 - p₁)³) × improvement_factor)

**Kicker Calculation:**
- rawStrength represents kicker quality (0% = worst, 100% = best)
- P(opponent beats kicker) = 1 - (rawStrength / 100)
- Same formula for BOTH high and low variants
  - High variant: rawStrength 100% = [66] kicker → 0% opponent beat chance
  - Low variant: rawStrength 100% = [11] kicker → 0% opponent beat chance

**Combined Probability:**
P(tie/beat) = P(make hand in 3 rolls) × P(opponent beats kicker)

## Examples

### Ship-Captain-Crew High [654] with [66] kicker
- rawStrength: 100%
- P(make SCC in 3 rolls): ~95%
- P(beat [66] kicker): 1 - 1.00 = 0%
- **Total tie risk: 0%**

### Ship-Captain-Crew High [654] with [23] kicker
- rawStrength: 27.78%
- P(make SCC in 3 rolls): ~95%
- P(beat [23] kicker): 1 - 0.2778 = 72.22%
- **Total tie risk: ~68.6%**

### Ship-Captain-Crew Low [123] with [11] kicker
- rawStrength: 100% (best low kicker)
- P(make SCC in 3 rolls): ~95%
- P(beat [11] kicker in low): 1 - 1.00 = 0%
- **Total tie risk: 0%**

## Usage in Strength Calculations

The tie probability is used in offensive/defensive strength:

```javascript
// Offensive strength (probability of NOT having worst hand)
const tieProbability = calculateOpponentTieOrBeatProbability(rawStrength, game, handDetails)
const adjustedPercentile = (rawStrength / 100) - tieProbability
const offensiveStrength = (1 - Math.pow(1 - adjustedPercentile, numOpponents)) * 100

// Higher tie probability → lower offensive strength → riskier call
```

## Key Insights

1. **Razzle is riskiest**: Even perfect hands have 13.17% tie risk due to wilds
2. **Boss is safest**: Perfect hands have only 0.4% tie risk (exact match required)
3. **Kicker games scale linearly**: Tie risk = base_hand_probability × (1 - kicker_percentile)
4. **Partial keepers matter**: Improvement factors range from 1.3x to 1.6x
5. **Number of opponents compounds risk**: With N opponents, P(someone beats you) = 1 - (1 - p)^N
