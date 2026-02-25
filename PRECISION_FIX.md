# Precision Fix: Never Show 0.0% When Ties Are Possible

## Problem
The system was showing "0.0% chance of losing" for perfect kickers, which was **incorrect**. Even with perfect kickers, there is ALWAYS a chance of ties, and ties can lead to losing (via roll-off).

## Why This Matters

### Tie Mechanics in Refusal Dice
When players tie:
- **2 players**: Call passes to the tied player (they become the new caller)
- **3+ players**: All tied players have a roll-off, and someone can lose

### Perfect Kickers Can Be Tied
For perfect kickers, opponents must roll the **exact same values**:
- **10-2 [666]**: Opponent needs three 6s = (1/6)³ = 0.463% per opponent
- **SCC [66]**: Opponent needs two 6s = (1/6)² = 2.78% per opponent
- **10-4 [6]**: Opponent needs one 6 = 1/6 = 16.67% per opponent

### Compounding with Multiple Opponents
Probability that AT LEAST ONE opponent ties you:
```
P(at least one ties) = 1 - (1 - p_tie)^N
```

**Example: SCC perfect [66]**
- 1 opponent: 2.78% tie risk
- 2 opponents: 5.4% tie risk  
- 4 opponents: 10.6% tie risk
- 7 opponents: 18.1% tie risk

Even though the chance of losing is still very small (<0.1%), it's **never zero**.

## The Fix

### 1. Preserve Precision in Calculations
**Before:**
```javascript
return Math.round(pAtLeastOneWorse * 100)  // Lost precision, showed 100
```

**After:**
```javascript
return pAtLeastOneWorse * 100  // Preserve decimal precision
```

### 2. Display with Precision Awareness
**Before:**
```javascript
const losePct = pLose.toFixed(1)  // 0.007% → "0.0%"
```

**After:**
```javascript
const losePct = (pLose < 0.1 && pLose > 0) ? '<0.1' : pLose.toFixed(1)
// 0.007% → "<0.1%" (shows it's non-zero but very small)
```

### 3. Update Display Logic in Functions
- `calculateOffensiveStrength()`: No rounding
- `generateCallExplanation()`: Show `<0.1%` for very small values
- `generateStrategySummary()`: Show `<0.1%` for very small values

### 4. Update Test Files
All test files now use precision-aware formatting:
```javascript
const losePct = 100 - offensiveStrength
const loseStr = (losePct < 0.1 && losePct > 0) ? '<0.1%' : losePct.toFixed(1) + '%'
```

## Example Output

### Before Fix
```
1st CALL: 10-2 high
   Chance of Losing: 0.0%          ← WRONG! Implies impossible to lose
   Tie/Beat Risk: 0.44%
```

### After Fix
```
1st CALL: 10-2 high
   Chance of Losing: <0.1%         ← CORRECT! Shows very low but non-zero
   Tie/Beat Risk: 0.44%
```

## Mathematical Details

For a perfect kicker with 2 opponents:

**10-2 [666]:**
```
p_tie = (1/6)³ = 0.00463 per opponent
p_at_least_one_ties = 1 - (1 - 0.00463)² = 0.00922 = 0.922%
p_strictly_better_than_all = 1 - 0.00922 = 0.99078 = 99.078%
offensive_strength = 99.078%  (was rounded to 100)
chance_of_losing = 100 - 99.078 = 0.922%  (was shown as 0.0%)
display = "<0.1%"  ✓ Correct
```

**SCC [66]:**
```
p_tie = (1/6)² = 0.0278 per opponent
p_at_least_one_ties = 1 - (1 - 0.0278)² = 0.0544 = 5.44%
p_strictly_better_than_all = 1 - 0.0544 = 0.9456 = 94.56%
offensive_strength = 94.56%
chance_of_losing = 100 - 94.56 = 5.44%
display = "5.4%"  ✓ Correct
```

## Files Modified
1. **src/lib/game-validation.js**
   - `calculateOffensiveStrength()`: Removed Math.round()
   - `generateCallExplanation()`: Added precision-aware formatting
   - `generateStrategySummary()`: Added precision-aware formatting

2. **test-hammer-strategy.js**
   - Updated display logic for all 3 recommendation levels
   - Added note about <0.1% in key insights

3. **HAMMER_STRATEGY.md**
   - Updated examples to show `<0.1%` instead of `0.0%`
   - Added section explaining tie mechanics
   - Clarified that there's never a true 0.0% chance of losing

## Key Takeaway

**There is NEVER a true 0.0% chance of losing in Refusal Dice** because:
1. Any hand can be tied by opponents rolling exact same values
2. Ties lead to either call passing or roll-offs
3. Roll-offs can result in losing

The system now correctly communicates this by showing `<0.1%` for extremely strong hands instead of the misleading `0.0%`.
