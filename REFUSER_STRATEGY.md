# Refuser Strategy - Implementation Summary

## Overview
The refuser strategy helps players decide whether to **accept** or **refuse** a called game. Unlike the hammer strategy (which focuses on making the best call), refusers must evaluate their current hand against the risk of re-rolling and facing a second (potentially harder) call.

## Core Philosophy

**Remember: The goal is to NOT LOSE, and refusal mechanics are CRITICAL**
- **First Refusal** (player immediately left of caller):
  - Can accept → Everyone plays the called game
  - Can refuse → Passes to Second Refusal
- **Second Refusal** (second player left of caller):
  - Can accept → Everyone plays the first call (first refuser re-rolls)
  - Can refuse → **BOTH refusers re-roll**, caller makes Second Call, NO MORE REFUSALS
- **Key Insight**: Your position (first vs second refusal) dramatically changes strategy
- Strategy balances "current hand quality" vs "expected value of re-rolling" vs "second call risk"

## Position Matters: First vs Second Refusal

### First Refusal Strategy
**You are the gatekeeper** - Your decision determines if second refusal even happens.

**Advantages:**
- If you accept, game is locked in (no second call risk)
- Can refuse weak hands knowing second refusal has another chance

**Disadvantages:**
- If you refuse and second accepts, YOU re-roll but everyone plays first call
- You don't know what second refusal will do

**Decision Framework:**
- **Strong hand (>70%ile)**: Usually ACCEPT (lock it in)
- **Medium hand (40-70%ile)**: Consider game difficulty + flexibility
- **Weak hand (<40%ile)**: Usually REFUSE (let second refusal decide)
- **Critical consideration**: If second refusal is likely to accept weak calls, be more conservative with refusals

### Second Refusal Strategy
**You have the final say** - Your decision determines if second call happens.

**Advantages:**
- You know first refusal already refused (they have weak hand for this game)
- Your accept locks in first call, your refuse triggers second call
- Can make informed decision based on first refusal's action

**Disadvantages:**
- If you refuse, BOTH you and first refusal re-roll (no escape from second call)
- Second call might be harder than first

**Decision Framework:**
- **Strong hand (>60%ile)**: ACCEPT (first refusal will re-roll, you keep strong hand)
- **Medium hand (35-60%ile)**: Evaluate second call predictions + your flexibility
- **Weak hand (<35%ile)**: REFUSE if predicted second call is easier or you need flexibility
- **Critical consideration**: First refusal already showed weakness, so accepting medium hands is more valuable

## The Refuser's Dilemma

### Key Decision Factors

1. **Current Hand Strength**: How strong is your hand for the called game?
2. **Game Difficulty**: How hard is this game to make?
3. **Your Position**: Are you first or second refusal?
4. **Second Call Likelihood**: What game will likely be called next?
5. **Roll Flexibility**: Can your current hand play multiple games well?
6. **Re-roll Risk**: What's your chance of improving vs. getting worse?
7. **Other Refuser's Likely Action**: What will the other refusal position do?

### The Core Trade-Off

```
Accept if: P(losing with current hand) < P(losing after refuse + re-roll)

P(losing after refuse) = P(worse hand) × P(losing with worse hand on game 1)
                       + P(better hand on game 1) × P(second call) × P(losing on game 2)
                       + P(same/similar hand) × P(losing with it)
```

## Strategic Scenarios

### Scenario 1: Strong Hand, Easy Game
```
Called: 10-2 High
Your Roll: [56666] → 10-2 High [666] (99.5%ile)
Flexibility: 8/10 games playable

Decision: ACCEPT
Reasoning: Excellent kicker on an easy game. Even if a harder second call comes, 
you'd need an exceptionally lucky re-roll to beat this hand. The flexibility 
means you're protected against most second calls anyway.
```

### Scenario 2: Weak Hand, Easy Game
```
Called: 10-2 Low
Your Roll: [12346] → 10-2 Low [123] (3.2%ile)
Flexibility: 6/10 games playable
Most Likely Second Call: Ship-Captain-Crew or Pairs

Decision: REFUSE
Reasoning: Bottom-tier kicker on easy game = ~97% chance of being beaten or tied.
Re-rolling gives you ~50% chance of improvement, and the flexible nature of your
roll means the second call likely won't be much harder.
```

### Scenario 3: Medium Hand, Hard Game (The Dilemma)
```
Called: Monterey Low
Your Roll: [23456] → Monterey Low [234][56] (45%ile)
Flexibility: 5/10 games playable
Most Likely Second Call: Pairs or Vegas (easier than Monterey)

Decision: REFUSE or ACCEPT? (Situational)
- ACCEPT if: You have high flexibility (7+) and fear a shotgun/razzle second call
- REFUSE if: Second call is likely easier AND you have good re-roll probability
```

### Scenario 4: Good Hand, Hard Game
```
Called: Monterey High
Your Roll: [34566] → Monterey High [345][66] (92%ile)
Flexibility: 7/10 games playable

Decision: ACCEPT
Reasoning: Excellent kicker on hard game. Even though hard games are risky,
your kicker protects you. Re-rolling risks losing this strong hand, and most
second calls won't be easier than your current advantage.
```

## Game Difficulty Considerations

### Easy Games (>45% base probability)
- **10-2** (49%): Most likely accepted by everyone → kicker determines winner
- **10-3** (47%): Similar to 10-2, kicker-focused
- Strategy: Strong kicker = accept, weak kicker = refuse (easy to re-roll into)

### Medium Games (30-45% base probability)
- **Ship-Captain-Crew** (42%): Common second call
- **Vegas (7s)** (36%): 
- **Pairs** (39%):
- Strategy: Evaluate kicker AND flexibility. Medium difficulty means ~50/50 on re-roll.

### Hard Games (<30% base probability)
- **Monterey** (25%): Common first call for players with strong hands
- **10-4** (28%):
- Strategy: If you made it, consider accepting unless kicker is terrible. 
  Hard to re-roll into, but bad kicker = likely loss anyway.

### Special Games
- **Razzle**: Wild cards make it complex - evaluate your best count vs expected
- **Boss**: Hand rank matters more than kicker
- **Tres Away**: Lowest score wins - different evaluation

## Flexibility Scoring Impact

**High Flexibility (7-10 games)**: More valuable to keep
- Protects against variety of second calls
- Consider accepting marginal calls to preserve flexible roll
- You have "insurance" if second call comes

**Medium Flexibility (4-6 games)**: Standard decision-making
- Evaluate each game on its merits
- No special bonus for keeping the roll

**Low Flexibility (1-3 games)**: Dangerous position
- Limited options if you accept and caller switches strategy
- Consider refusing to get a more flexible roll
- Exception: If you're VERY strong in the called game, accept anyway

## Second Call Predictor Tool

### Purpose
A dedicated page/analysis tool that answers: **"If [Game X] is called first, what are the most likely second calls?"**

### Methodology
1. **For each possible first call** (e.g., "Monterey Low"):
   - Filter unique rolls table to rolls that CAN make that game
   - For each of those rolls, identify their OTHER strong calls (using hammer strategy)
   - Calculate distribution: What % would call 10-2H? What % would call SCC? etc.
   - Rank second calls by likelihood

2. **Output Format**:
```
First Call: Monterey Low
Most Likely Second Calls:
  1. Ship-Captain-Crew High (32.4%) - Complementary straight game
  2. Pairs (28.1%) - Easy fallback
  3. Vegas (18.6%) - Medium difficulty
  4. 10-2 High (12.3%) - Kicker-focused
  5. Razzle (8.6%) - Shotgun strategy
```

3. **Strategic Insights**:
- **Complementary games**: First call was Monterey → hands that make Monterey often have straights → likely second is SCC
- **Difficulty shifts**: Hard first call → often easier second call (to catch refusers who couldn't make first)
- **Kicker variance**: Same game, opposite variant (Monterey Low → Monterey High)

### Implementation Plan
- [ ] Create new page: `src/pages/second-call-predictor.js`
- [ ] Build analysis function: `analyzeSecondCallDistribution(firstCall)`
- [ ] Use unique rolls data + hammer strategy to generate predictions
- [ ] Display interactive table showing all first call → second call probabilities
- [ ] Add filtering by flexibility threshold
- [ ] Show example rolls for each prediction

## Second Call Prediction Model

### Common Calling Patterns

**IMPORTANT RULE**: Second call must be a **completely different game** from the first call. You cannot call the same game with a different variant (e.g., Monterey Low → Monterey High is not allowed).

**After Easy Games (10-2, 10-3):**
- Likely second call: Medium difficulty (SCC, Pairs, Vegas)
- Reasoning: Caller wants to eliminate weak kickers who accepted first call

**After Medium Games:**
- Likely second call: Hard game or another medium
- Reasoning: Caller testing who refused and why

**After Hard Games (Monterey, 10-4):**
- Likely second call: Usually easier (SCC, Pairs) or very hard (Razzle, Boss)
- Reasoning: Catch refusers who couldn't make the first game

### Caller Psychology Considerations

1. **Sequential Difficulty**: Many callers go easy → hard or hard → easy
2. **Game Switching**: Must change to entirely different game (not variant)
3. **Complementary Games**: Monterey → SCC (both need straights)
4. **Shotgun Strategy**: Hard game → Special game (Razzle, Boss, Tres Away)

## Decision Matrix

### First Refusal Position

| Current Hand | Game Difficulty | Flexibility | Recommendation |
|--------------|----------------|-------------|----------------|
| Excellent (>90%ile) | Any | Any | ACCEPT |
| Strong (70-90%ile) | Easy/Medium | Any | ACCEPT |
| Strong (70-90%ile) | Hard | High (7+) | ACCEPT |
| Strong (70-90%ile) | Hard | Low (<4) | CONSIDER REFUSE |
| Moderate (50-70%ile) | Easy | Low | REFUSE |
| Moderate (50-70%ile) | Medium/Hard | High | ACCEPT |
| Moderate (50-70%ile) | Medium/Hard | Low | REFUSE |
| Weak (<50%ile) | Easy | Any | REFUSE |
| Weak (<50%ile) | Medium/Hard | High (7+) | SITUATIONAL* |
| Weak (<50%ile) | Medium/Hard | Low | REFUSE |

\*Situational: If you barely made the game and have high flexibility, consider accepting to avoid harder second call

### Second Refusal Position

| Current Hand | Game Difficulty | Flexibility | Recommendation |
|--------------|----------------|-------------|----------------|
| Excellent (>90%ile) | Any | Any | ACCEPT |
| Strong (70-90%ile) | Any | Any | ACCEPT (first refuser re-rolls) |
| Moderate (50-70%ile) | Easy | Any | ACCEPT (capitalize on first refuser's weakness) |
| Moderate (50-70%ile) | Medium | High (7+) | ACCEPT |
| Moderate (50-70%ile) | Medium | Low | Check second call predictions |
| Moderate (50-70%ile) | Hard | Any | ACCEPT (hard games rarely easier second call) |
| Weak (30-50%ile) | Easy | Any | Check second call - might ACCEPT |
| Weak (30-50%ile) | Medium/Hard | Any | REFUSE (need easier second call) |
| Very Weak (<30%ile) | Any | Any | REFUSE (force second call) |

**Key Difference**: Second refusal can be more aggressive accepting medium hands because first refusal already showed weakness.

## Re-Roll Mathematics

### Expected Value Calculation

```javascript
// Probability of making called game on re-roll
const P_make_game = gameOddsMap[game].singleRoll

// Expected strength if you make it (simplified: assume median ~50%ile)
const E_strength_if_made = 50

// Expected strength on re-roll
const E_reroll = P_make_game × E_strength_if_made + (1 - P_make_game) × 0

// Compare to current strength
if (current_strength > E_reroll) {
  // Current hand is above expectation → ACCEPT
} else {
  // Re-roll has better expected value → REFUSE
}
```

### Refinements to Add:
1. **Second call probability distribution**
2. **Flexibility bonus to expected value**
3. **Opponent count impact** (more opponents = higher threshold to accept)

## Implementation Checklist

### Core Functions Needed:
- [ ] `generateRefuserStrategy(roll, calledGame, numOpponents)`
- [ ] `predictSecondCall(calledGame, rollStrength)` 
- [ ] `calculateRerollExpectedValue(calledGame, secondCallDistribution)`
- [ ] `evaluateAcceptanceThreshold(currentStrength, rerollEV, flexibility)`
- [ ] `getFlexibilityBonus(flexibility, secondCallUncertainty)`

### Data Requirements:
- [ ] Second call probability distributions by first call
- [ ] Re-roll outcome distributions by game
- [ ] Flexibility impact on defensive strength
- [ ] Acceptance thresholds by player count

### UI Components:
- [ ] Visual "Accept/Refuse" recommendation badge
- [ ] Probability breakdown display
- [ ] Second call predictions with %
- [ ] "What if I refuse?" simulation
- [ ] Comparison of current vs expected re-roll strength

## Key Differences from Hammer Strategy

| Aspect | Hammer Strategy | Refuser Strategy |
|--------|----------------|------------------|
| **Goal** | Choose best call to make | Decide accept vs refuse |
| **Control** | Full (choose from all valid games) | Limited (accept or re-roll) |
| **Risk** | Tie/beat risk from opponents | Re-roll risk + second call risk |
| **Flexibility** | Nice bonus | Critical factor |
| **Opponent Count** | More = call harder games | More = higher accept threshold |
| **Second Call** | N/A (you are calling) | Major consideration |

## Testing Scenarios

### Test Case 1: Clear Accept
```javascript
// Strong hand on medium game
roll: [45666]
called: 'ship-captain-crew-high'
result: [456][66] = 94%ile
flexibility: 8/10
→ ACCEPT (99% confidence)
```

### Test Case 2: Clear Refuse  
```javascript
// Weak hand on easy game
roll: [12234]
called: '10-2-low'
result: [12] = 1.8%ile
flexibility: 4/10
→ REFUSE (98% confidence)
```

### Test Case 3: Difficult Decision
```javascript
// Medium hand on hard game, good flexibility
roll: [23456]
called: 'monterey-low'
result: [234][56] = 45%ile
flexibility: 7/10
predicted_second: 'pairs' (easier, 39% vs 25%)
→ SITUATIONAL (need second call prediction)
```

## Questions Resolved

1. ✅ **Second Call Data**: Building "Second Call Predictor" tool using unique rolls + hammer strategy
2. ✅ **Refusal Rules**: Only ONE refusal round, BOTH players must refuse to trigger second call
3. ✅ **Position Matters**: First vs second refusal have different strategies
4. ✅ **Re-roll Scenarios**: 
   - First refuses + Second accepts = First re-rolls, everyone plays first call
   - Both refuse = Both re-roll, everyone plays second call
5. ✅ **Modeling**: Assume callers use hammer strategy for best statistical predictions

## Questions Still Open

1. **Tie-Breaking**: When accept/refuse odds are similar (45-55% range), what's the tiebreaker?
2. **Opponent Reading**: Should we add "player skill" factors to predictions?
3. **Bluffing**: Do we eventually model deceptive calling strategies?
4. **Historical Data**: Can we track actual game second calls to validate predictions?

## Next Steps

1. Gather data on second call patterns from real games
2. Build probability model for re-roll outcomes by game
3. Create decision tree/algorithm for accept/refuse
4. Implement UI components to display recommendations
5. Add "practice mode" where players can test decisions
6. Build historical tracking of accept/refuse outcomes

---

*This document is a work in progress. Strategy will be refined as we gather more data and test edge cases.*
