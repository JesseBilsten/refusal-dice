# Hammer Strategy - Implementation Summary

## Overview
The hammer strategy recommendations help players choose the best game to call when they have the "hammer" (first caller position). The goal is to **minimize your chance of losing** (having the worst hand), not to "win" - since this is a last-man-standing game where you win by avoiding elimination.

## Core Philosophy

**Remember: The goal is NOT TO LOSE**
- Players lose when they have the worst hand
- Players are eliminated after losing 3 times
- "Winning" is the result of all other players being eliminated
- Strategy focuses on avoiding being the worst, not being the best

## How It Works

### 1. Analyzes All Playable Games
For a given roll, the system:
- Identifies all valid games and variants
- Calculates raw strength for each option
- Determines probability of NOT having worst hand vs N opponents
- Evaluates tie/beat risk

### 2. Balances Game Difficulty vs Kicker Strength

**The Core Trade-Off:**
```
Tie/Beat Risk = P(opponent makes game) × P(opponent beats/ties kicker)
Chance of Losing = 1 - P(not having worst hand vs N opponents)
```

**Examples:**
- **Hard game + Excellent kicker**: Monterey (25% base) with [66] = 2.44% tie risk → <0.1% chance of losing
- **Easy game + Weak kicker**: 10-2 (49% base) with [23] = 35.6% tie risk → 53-100% chance of losing
- **Hard game + Weak kicker**: Monterey (25% base) with [3] = 48.8% tie risk → 100% chance of losing
- **Easy game + Excellent kicker**: 10-2 (49% base) with [666] = 0.44% tie risk → <0.1% chance of losing

### 3. Recommends Top 3 Options

The strategy returns:
- **Best Call**: Lowest chance of losing
- **Second Best Call**: Backup option if first is refused
- **Third Best Call**: Additional fallback
- **Summary**: Strategic explanation of the decision

### 4. Provides Detailed Explanations

Each recommendation includes:
- Chance of losing (percentage)
- Tie/beat risk percentage
- Game difficulty classification (easy/medium/hard)
- Kicker strength assessment (poor/weak/moderate/strong/excellent)
- Strategic explanation of the trade-off

## Usage

```javascript
const strategy = generateHammerStrategy(roll, numOpponents)

console.log(strategy.summary)
// "Best call: monterey high (<0.1% lose). Backup: 10-2 high (11.0% lose)."

console.log(strategy.bestCall)
// {
//   game: 'monterey',
//   variant: 'high',
//   offensiveStrength: 99.95,  // Technical: P(not worst) ≈ 99.95%
//   tieProbability: 0.0244,
//   kicker: [6, 6],
//   gameInfo: { gameDifficulty: 'hard', kickerStrength: 'excellent' },
//   explanation: "Excellent - hard game to make but excellent kicker protects you (<0.1% chance of losing, 2.4% tie risk)"
// }
```

## Game Difficulty Classifications

Based on single-roll base probability:
- **Easy**: >45% (10-2, 10-3)
- **Medium**: 30-45% (SCC, Vegas, Pairs)
- **Hard**: <30% (10-4, Monterey)

## Kicker Strength Classifications

Based on rawStrength percentile:
- **Excellent**: ≥90%
- **Strong**: 70-89%
- **Moderate**: 50-69%
- **Weak**: 30-49%
- **Poor**: <30%

## Strategic Insights

### Player Count Impact
As opponents increase, tie risk compounds. Even **perfect kickers can be tied** (opponents roll exact same kicker):

```
P(at least one opponent ties you) = 1 - (1 - p_tie)^N

Example: SCC perfect [66] (2.78% single-opponent tie risk)
- 2 opponents: 5.4% chance at least one ties → <0.1% chance of losing*
- 4 opponents: 10.6% chance at least one ties → <0.1% chance of losing*
- 7 opponents: 18.1% chance at least one ties → 0.2% chance of losing*

Example: 10-2 perfect [666] (0.46% single-opponent tie risk)
- 2 opponents: 0.9% chance at least one ties → <0.1% chance of losing*
- 4 opponents: 1.8% chance at least one ties → <0.1% chance of losing*
- 7 opponents: 3.2% chance at least one ties → <0.1% chance of losing*
```

**Important:** There is **never a true 0.0%** chance of losing! When ties occur:
- **2 players**: Call passes to tied player (you don't lose that round)
- **3+ players**: All tied players have a roll-off (you could lose the roll-off)

\*Chance of losing accounts for tie resolution mechanics

### When Game Difficulty Matters Most
- **3 players**: Kicker strength dominates (fewer opponents)
- **8 players**: Game difficulty becomes critical (more opponents trying)

### Optimal Strategy
1. **Always call your lowest-losing-chance option**
2. **Have a backup ready** (second call)
3. **In close decisions** (similar lose %), consider:
   - Personal game preference
   - Opponent skill levels
   - Recent game history (avoid patterns)

## Example Scenarios

### Scenario 1: Clear Winner
```
Roll: [23466]
Best: Monterey High [234][66] - 100% offensive, 2.44% tie risk
Second: 10-2 High - 47% offensive, 35.6% tie risk

Strategy: Clear winner - call Monterey High
```

### Scenario 2: Close Decision
```
Roll: [65466]
Best: 10-2 High [566] - 100% offensive, 0.44% tie risk
Second: SCC High [654][66] - 100% offensive, 2.64% tie risk

Strategy: Both excellent - choose based on preference
(10-2 slightly safer with more kicker dice)
```

### Scenario 3: Weak Roll
```
Roll: [23416]
Best: 10-4 High [6] - 99% offensive, 11.48% tie risk
Second: 10-2 Low [123] - 97% offensive, 8.36% tie risk

Strategy: Limited good options - 10-4 is best but risky
Consider refusing if opponents look strong
```

## Integration Points

### Current Implementation
- ✅ `generateHammerStrategy()` function in game-validation.js
- ✅ Comprehensive tie probability calculations
- ✅ Game difficulty analysis
- ✅ Kicker strength assessment
- ✅ Multi-opponent scaling

### Next Steps
- ⏳ Add UI component in rolls.js
- ⏳ Create "Hammer Mode" toggle
- ⏳ Display recommendations with visual indicators
- ⏳ Show comparison table of top options
- ⏳ Add "Why is this better?" explanations

## Test Files

Run these to verify functionality:
```bash
node test-hammer-strategy.js  # Comprehensive scenarios
node test-tradeoff.js          # Game difficulty vs kicker strength
node test-weak-kicker.js       # Specific weak kicker scenario
```

## Key Formulas

**Offensive Strength:**
```javascript
tieProbability = calculateOpponentTieOrBeatProbability(rawStrength, game, handDetails)
adjustedPercentile = (rawStrength / 100) - tieProbability
offensiveStrength = (1 - Math.pow(1 - adjustedPercentile, numOpponents)) × 100
```

**Kicker Game Tie Probability:**
```javascript
p3rolls = min(0.95, (1 - (1 - p1)³) × improvementFactor)

if (rawStrength >= 99.5) {
  pKickerTie = (1/6)^numKickerDice  // Perfect kicker - exact match only
} else {
  pKickerTie = 1 - (rawStrength / 100)  // Non-perfect - can be beaten
}

tieProbability = p3rolls × pKickerTie
```

## Design Philosophy

The hammer strategy is designed to:
1. **Simplify complex decisions** - One clear recommendation
2. **Explain the trade-offs** - Users understand WHY
3. **Account for all factors** - Multi-roll, kickers, opponents
4. **Scale with player count** - Adjust strategy for game size
5. **Provide backups** - Always have a second call ready

The goal is to take the mathematical complexity out of the player's hands while still teaching them the underlying strategy through clear explanations.
