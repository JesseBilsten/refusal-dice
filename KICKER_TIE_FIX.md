# Kicker Game Tie Probability Fix

## Issue
Perfect kicker hands were incorrectly showing 0% tie risk, but they can still be TIED (though not beaten) by opponents who get the exact same kicker.

## Example
**SCC low [123] with [11] kicker:**
- This is the BEST possible low kicker (can't be beaten)
- But it CAN be tied if opponent also gets [123] [11]
- Was showing: 0% tie risk ❌
- Should show: 2.64% tie risk ✅

## Root Cause
The calculation was:
```javascript
pKickerTiesOrBeats = 1 - kickerPercentile
```

For perfect kickers (percentile = 100%), this gave:
```javascript
pKickerTiesOrBeats = 1 - 1.00 = 0.00  // Wrong!
```

## Solution
For perfect/near-perfect kickers, calculate the probability of getting EXACT same kicker:

```javascript
if (kickerPercentile >= 0.995) {
  // Perfect kicker - can only be tied, not beaten
  const numKickerDice = getKickerDiceCount(game)
  const pExactMatch = Math.pow(1/6, numKickerDice)
  pKickerTiesOrBeats = pExactMatch
} else {
  // Non-perfect kicker - can be tied or beaten
  pKickerTiesOrBeats = 1 - kickerPercentile
}
```

## Kicker Dice Counts by Game
- **10-4**: 1 kicker die → P(exact) = 1/6 = 16.67%
- **10-3, SCC, Monterey, Vegas**: 2 kicker dice → P(exact) = (1/6)² = 2.78%
- **10-2, Pairs**: 3 kicker dice → P(exact) = (1/6)³ = 0.46%

## Updated Perfect Hand Tie Probabilities
| Game | Kicker Dice | P(make hand) | P(exact kicker) | Total Tie Risk |
|------|-------------|--------------|-----------------|----------------|
| 10-4 | 1 | ~69% | 16.67% | **11.48%** |
| 10-3 | 2 | ~95% | 2.78% | **2.64%** |
| SCC | 2 | ~95% | 2.78% | **2.64%** |
| Monterey | 2 | ~88% | 2.78% | **2.44%** |
| Vegas | 2 | ~95% | 2.78% | **2.64%** |
| 10-2 | 3 | ~95% | 0.46% | **0.44%** |
| Pairs | 3 | ~95% | 0.46% | **0.44%** |

## Key Insights

### 1. More Kicker Dice = Safer
- **3 kicker dice** (10-2, Pairs): Only 0.44% tie risk
- **2 kicker dice** (SCC, 10-3, etc.): 2.44-2.64% tie risk
- **1 kicker die** (10-4): 11.48% tie risk!

### 2. 10-4 is Riskiest for Perfect Hands
Even with a perfect kicker, 10-4 has over 11% tie risk because opponents only need to match 1 die.

### 3. Comparison to Non-Kicker Games
**Perfect hand tie risks (ranked):**
1. Tres Away: 0.2% (safest scoring game)
2. Boss [66666]: 0.4% (exact match required)
3. 10-2/Pairs perfect: 0.44% (3 kicker dice)
4. Monterey perfect: 2.44% (2 kicker dice, lower base hand %)
5. SCC/10-3/Vegas perfect: 2.64% (2 kicker dice)
6. 10-4 perfect: 11.48% (only 1 kicker die)
7. Razzle [66666]: 13.17% (any 5 matching ties)

### 4. Multi-Player Impact
With 7 opponents (8 players total), a perfect SCC [66] kicker has:
```
P(at least one tie) = 1 - (1 - 0.0264)^7 = 17.4%
```

This is significant! In an 8-player game, there's nearly a 1-in-5 chance someone ties your perfect kicker.

## Testing
Run these scripts to verify:
```bash
node test-kicker-scenarios.js   # See specific roll examples
node test-kicker-probabilities.js  # See all games at all strength levels
node test-ui-integration.js     # Verify UI calculations
```

## Example Output
```
SCC low [123] with [11] kicker:
- Raw strength: 100.00
- Tie/Beat Risk: 2.64%  ✅ (was 0%)
- Offensive Strength: 100.00% (vs 2 opponents)

SCC high [654] with [66] kicker:
- Raw strength: 100.00
- Tie/Beat Risk: 2.64%  ✅ (was 0%)
- Offensive Strength: 100.00% (vs 2 opponents)
```

## Tie Mechanics in Gameplay
As you noted: "If all players [have perfect hands], then as long as there are more than 2 players, all players play the game again repeating this process until there's one player who's last."

This is why accounting for tie probability is critical - in multi-player games, even "perfect" hands carry meaningful tie risk, especially:
- Games with fewer kicker dice (10-4 worst at 11.48%)
- Games with more players (risk compounds: 1-(1-p)^N)
- Games with wilds or flexible matching (Razzle at 13.17%)
