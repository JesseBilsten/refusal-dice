const fs = require('fs');
const path = require('path');
const { 
  checkGame, 
  getBossHandRank,
  calculateTresAwayScore,
  getRazzleScore,
  analyzeRoll,
  calculateNormalizedStrength,
  calculateOffensiveStrength,
  calculateDefensiveStrength,
  STRENGTH_DATA_VERSION
} = require('../lib/game-validation');

// Parse command line arguments for Monte Carlo iterations
const args = process.argv.slice(2);
const iterations = args[0] ? parseInt(args[0]) : 10000;

console.log(`Starting unique rolls generation with ${iterations} Monte Carlo iterations...\n`);

// Generate all possible dice rolls
const diceRolls = [];
for (let i = 1; i <= 6; i++) {
  for (let j = 1; j <= 6; j++) {
    for (let k = 1; k <= 6; k++) {
      for (let l = 1; l <= 6; l++) {
        for (let m = 1; m <= 6; m++) {
          diceRolls.push([i, j, k, l, m]);
        }
      }
    }
  }
}

console.log(`Generated ${diceRolls.length} total rolls`);

// Calculate unique rolls and their counts
const countsMap = new Map();

diceRolls.forEach((roll, index) => {
  const normalized = [...roll].sort((a, b) => a - b).join('');
  if (!countsMap.has(normalized)) {
    countsMap.set(normalized, { 
      roll: [...roll].sort((a, b) => a - b),
      indices: [], 
      count: 0 
    });
  }
  countsMap.get(normalized).indices.push(index);
  countsMap.get(normalized).count++;
});

// Convert to array for processing
const uniqueRollsArray = Array.from(countsMap.values());

console.log(`Found ${uniqueRollsArray.length} unique roll combinations\n`);

// ==============================================================================
// TRES AWAY MONTE CARLO SIMULATOR
// ==============================================================================

// Simulate a single Tres Away game with a given strategy
const simulateTresAwayGame = (initialRoll, strategy) => {
  let remainingDice = [...initialRoll];
  let revealedDice = [];
  
  while (remainingDice.length > 0) {
    // Decide which dice to reveal based on strategy
    const toReveal = strategy.selectDiceToReveal(remainingDice);
    
    // Move revealed dice
    toReveal.forEach(die => {
      const idx = remainingDice.indexOf(die);
      if (idx !== -1) {
        remainingDice.splice(idx, 1);
        revealedDice.push(die);
      }
    });
    
    // If dice remain, roll them
    if (remainingDice.length > 0) {
      remainingDice = remainingDice.map(() => Math.floor(Math.random() * 6) + 1);
    }
  }
  
  // Calculate final score (3s = 0)
  return revealedDice.reduce((sum, die) => sum + (die === 3 ? 0 : die), 0);
};

// Strategy 1: Baseline heuristic
const baselineStrategy = {
  name: 'Baseline Heuristic',
  selectDiceToReveal: (dice) => {
    const diceCount = dice.length;
    const toReveal = [];
    
    // Always reveal 1s, 2s, and 3s
    dice.forEach(die => {
      if (die <= 3) toReveal.push(die);
    });
    
    // If we revealed at least one, return
    if (toReveal.length > 0) return toReveal;
    
    // Otherwise apply thresholds
    if (diceCount >= 3) {
      // With 3+ dice, reveal 4s
      dice.forEach(die => {
        if (die === 4) toReveal.push(die);
      });
    }
    
    if (diceCount === 4 && toReveal.length === 0) {
      // With 4 dice and no 4s or lower, reveal 2s and 3s
      dice.forEach(die => {
        if (die === 2 || die === 3) toReveal.push(die);
      });
    }
    
    // Must reveal at least one die
    if (toReveal.length === 0) {
      // Reveal the lowest die
      const lowest = Math.min(...dice);
      toReveal.push(lowest);
    }
    
    return toReveal;
  }
};

// Strategy 2: Greedy - always reveal all 1s, 2s, 3s
const greedyLowStrategy = {
  name: 'Greedy Low',
  selectDiceToReveal: (dice) => {
    const toReveal = dice.filter(die => die <= 3);
    
    // Must reveal at least one
    if (toReveal.length === 0) {
      const lowest = Math.min(...dice);
      return [lowest];
    }
    
    return toReveal;
  }
};

// Strategy 3: Expected value based
const expectedValueStrategy = {
  name: 'Expected Value',
  selectDiceToReveal: (dice) => {
    const diceCount = dice.length;
    const toReveal = [];
    
    // Expected value of a single die roll is 3.5 (or 2.33 counting 3s as 0)
    const expectedReroll = 2.33;
    
    dice.forEach(die => {
      const dieValue = die === 3 ? 0 : die;
      
      // Reveal if die value is below expected reroll value
      if (dieValue <= expectedReroll) {
        toReveal.push(die);
      }
    });
    
    // Must reveal at least one
    if (toReveal.length === 0) {
      const lowest = Math.min(...dice);
      toReveal.push(lowest);
    }
    
    return toReveal;
  }
};

// Strategy 4: Conservative - reveal only optimal dice
const conservativeStrategy = {
  name: 'Conservative',
  selectDiceToReveal: (dice) => {
    // Always keep only one die to maximize rerolls
    const lowest = Math.min(...dice);
    return [lowest];
  }
};

console.log('Running Tres Away Monte Carlo simulations...');

const strategies = [baselineStrategy, greedyLowStrategy, expectedValueStrategy, conservativeStrategy];
const strategyResults = {};

strategies.forEach(strategy => {
  console.log(`  Testing ${strategy.name}...`);
  let totalScore = 0;
  
  // Run simulations on a sample of rolls
  const sampleSize = Math.min(iterations, diceRolls.length);
  for (let i = 0; i < sampleSize; i++) {
    const roll = diceRolls[Math.floor(Math.random() * diceRolls.length)];
    const score = simulateTresAwayGame(roll, strategy);
    totalScore += score;
  }
  
  const avgScore = totalScore / sampleSize;
  strategyResults[strategy.name] = avgScore;
  console.log(`    Average score: ${avgScore.toFixed(2)}`);
});

// Find best strategy
const bestStrategyName = Object.keys(strategyResults).reduce((a, b) => 
  strategyResults[a] < strategyResults[b] ? a : b
);

const TRES_AWAY_EXPECTED = Math.round(strategyResults[bestStrategyName] * 100) / 100;

console.log(`\n✓ Optimal Tres Away strategy: ${bestStrategyName}`);
console.log(`✓ Expected average score: ${TRES_AWAY_EXPECTED}\n`);

// ==============================================================================
// RAZZLE MONTE CARLO SIMULATOR
// ==============================================================================

// Simulate a single Razzle game with optimal strategy
// Keep all 1s and 6s, reroll everything else, up to 3 total rolls
const simulateRazzleGame = (initialRoll) => {
  let currentRoll = [...initialRoll];
  let keptDice = [];
  
  // We get 3 total rolls
  for (let rollNum = 0; rollNum < 3; rollNum++) {
    // Separate 1s/6s from other dice
    const ones = currentRoll.filter(d => d === 1);
    const sixes = currentRoll.filter(d => d === 6);
    const others = currentRoll.filter(d => d !== 1 && d !== 6);
    
    // Keep all 1s and 6s
    keptDice.push(...ones, ...sixes);
    
    // If no dice to reroll, we're done
    if (others.length === 0) {
      break;
    }
    
    // Reroll the non-1/6 dice for next iteration
    if (rollNum < 2) { // Don't roll after the 3rd roll
      currentRoll = others.map(() => Math.floor(Math.random() * 6) + 1);
    }
  }
  
  // Count the number of 1s and 6s we kept
  const onesCount = keptDice.filter(d => d === 1).length;
  const sixesCount = keptDice.filter(d => d === 6).length;
  
  return { ones: onesCount, sixes: sixesCount, total: onesCount + sixesCount };
};

console.log('Running Razzle Monte Carlo simulation...');

let totalOnes = 0;
let totalSixes = 0;
let totalMatching = 0;

// Run simulations on all possible initial rolls
const razzleSampleSize = Math.min(iterations, diceRolls.length);
for (let i = 0; i < razzleSampleSize; i++) {
  const roll = diceRolls[Math.floor(Math.random() * diceRolls.length)];
  const result = simulateRazzleGame(roll);
  totalOnes += result.ones;
  totalSixes += result.sixes;
  totalMatching += result.total;
}

const avgOnes = totalOnes / razzleSampleSize;
const avgSixes = totalSixes / razzleSampleSize;
const avgTotal = totalMatching / razzleSampleSize;

const RAZZLE_EXPECTED_TOTAL = Math.round(avgTotal * 100) / 100;

console.log(`✓ Expected 1s: ${avgOnes.toFixed(2)}`);
console.log(`✓ Expected 6s: ${avgSixes.toFixed(2)}`);
console.log(`✓ Expected total (1s + 6s): ${RAZZLE_EXPECTED_TOTAL}\n`);

// ==============================================================================
// BOSS HAND DISTRIBUTION CALCULATOR
// ==============================================================================

console.log('Calculating Boss hand distribution...');

// Get hand ranks for all unique rolls weighted by permutation count
const handRanks = [];
uniqueRollsArray.forEach(rollData => {
  const handRank = getBossHandRank(rollData.roll);
  // Add this rank multiple times based on permutation count
  for (let i = 0; i < rollData.count; i++) {
    handRanks.push(handRank.rank);
  }
});

// Calculate odds for each hand type or better
const handTypeOdds = {};
for (let rank = 1; rank <= 7; rank++) {
  const orBetter = handRanks.filter(r => r >= rank).length;
  const percentage = Math.round((orBetter / handRanks.length) * 10000) / 100;
  handTypeOdds[rank] = percentage;
}

const handTypeNames = {
  1: 'High Card',
  2: 'Pair',
  3: 'Two Pair',
  4: '3-of-a-kind',
  5: 'Full House',
  6: '4-of-a-kind',
  7: '5-of-a-kind'
};

console.log('Boss hand type odds (or better):');
for (let rank = 7; rank >= 1; rank--) {
  console.log(`  ${handTypeNames[rank]}: ${handTypeOdds[rank]}%`);
}

// Sort to find median for threshold
handRanks.sort((a, b) => a - b);
const medianIndex = Math.floor(handRanks.length / 2);
const BOSS_MEDIAN = handRanks[medianIndex];

// Use "Pair or better" as the strategic viability odds (most common threshold)
const BOSS_ODDS = handTypeOdds[2]; // Pair or better

console.log(`✓ Boss median hand rank: ${BOSS_MEDIAN} (${handTypeNames[BOSS_MEDIAN]})`);
console.log(`✓ Boss strategic viability odds (Pair or better): ${BOSS_ODDS}%\n`);

// ==============================================================================
// TRES AWAY ODDS CALCULATOR
// ==============================================================================

console.log('Calculating Tres Away strategic viability odds...');

// Count how many rolls score less than the expected average (7.33)
let belowAverage = 0;
uniqueRollsArray.forEach(rollData => {
  const score = calculateTresAwayScore(rollData.roll);
  if (score < TRES_AWAY_EXPECTED) {
    belowAverage += rollData.count;
  }
});

const TRES_AWAY_ODDS = Math.round((belowAverage / diceRolls.length) * 10000) / 100;

console.log(`✓ Tres Away strategic viability odds (score < ${TRES_AWAY_EXPECTED}): ${TRES_AWAY_ODDS}%\n`);

// ==============================================================================
// RAZZLE ODDS CALCULATOR
// ==============================================================================

console.log('Calculating Razzle strategic viability odds...');

// Count how many rolls have matching dice >= expected average
// A roll "matches" if it has enough 1s/6s OR enough of any other matching dice
const countMatchingDice = (roll) => {
  const counts = {};
  roll.forEach(d => counts[d] = (counts[d] || 0) + 1);
  const onesAndSixes = (counts[1] || 0) + (counts[6] || 0);
  
  // Get the highest count of any single other number
  const otherCounts = Object.entries(counts)
    .filter(([num]) => num !== '1' && num !== '6')
    .map(([_, count]) => count);
  const maxOtherCount = otherCounts.length > 0 ? Math.max(...otherCounts) : 0;
  
  return { onesAndSixes, maxOtherCount };
};

let aboveAverageRazzle = 0;
uniqueRollsArray.forEach(rollData => {
  const { onesAndSixes, maxOtherCount } = countMatchingDice(rollData.roll);
  
  // Consider a roll "viable" if:
  // 1. It has >= expected 1s/6s, OR
  // 2. It has a high count of other matching dice (4-5 of a kind beats most hands)
  if (onesAndSixes >= RAZZLE_EXPECTED_TOTAL || maxOtherCount >= 4) {
    aboveAverageRazzle += rollData.count;
  }
});

const RAZZLE_ODDS = Math.round((aboveAverageRazzle / diceRolls.length) * 10000) / 100;

console.log(`✓ Razzle strategic viability odds (${RAZZLE_EXPECTED_TOTAL}+ matching dice): ${RAZZLE_ODDS}%\n`);

// ==============================================================================
// GAME ODDS MAP
// ==============================================================================

// Load existing odds from 5dice.json
let gameOddsMap = {
  '10-2': 49.07,
  '10-3': 53.43,
  '10-4': 22.25,
  'ship-captain-crew': 31.64,
  'monterey': 25.46,
  'vegas': 32.41,
  'pairs': 29.01,
  'razzle': RAZZLE_ODDS,
  'boss': BOSS_ODDS,
  'tres-away': TRES_AWAY_ODDS
};

// ==============================================================================
// ANALYZE ALL ROLLS
// ==============================================================================

console.log('Analyzing strength for all 252 unique rolls...');

const thresholds = {
  bossMedian: BOSS_MEDIAN,
  tresAwayExpected: TRES_AWAY_EXPECTED,
  razzleExpectedTotal: RAZZLE_EXPECTED_TOTAL,
  bossOdds: BOSS_ODDS,
  tresAwayOdds: TRES_AWAY_ODDS,
  razzleOdds: RAZZLE_ODDS
};

uniqueRollsArray.forEach((rollData, index) => {
  const analysis = analyzeRoll(rollData.roll, gameOddsMap, thresholds);
  rollData.analysis = analysis;
  
  if ((index + 1) % 50 === 0) {
    console.log(`  Processed ${index + 1}/${uniqueRollsArray.length} rolls...`);
  }
});

console.log(`✓ Completed analysis for all ${uniqueRollsArray.length} unique rolls\n`);

// ==============================================================================
// CALCULATE OVERALL PERCENTILE RANKINGS
// ==============================================================================

console.log('Calculating overall percentile rankings...');

// Sort rolls by their best strength (using the same metric that determines bestCall)
const sortedByStrength = [...uniqueRollsArray].sort((a, b) => {
  const aCall = a.analysis?.bestCall;
  const bCall = b.analysis?.bestCall;
  
  if (!aCall && !bCall) return 0;
  if (!aCall) return -1;
  if (!bCall) return 1;
  
  // Use normalized strength for comparison (same as bestCall logic)
  const aNormalized = calculateNormalizedStrength(aCall.rawStrength, gameOddsMap[aCall.game] || 50);
  const bNormalized = calculateNormalizedStrength(bCall.rawStrength, gameOddsMap[bCall.game] || 50);
  
  return aNormalized - bNormalized; // Ascending order (worst to best)
});

// Assign percentile ranks (1-100 scale)
sortedByStrength.forEach((rollData, index) => {
  // Percentile: 1 = worst, 100 = best
  // Use Math.ceil to ensure we get 1-100 range (not 0-100)
  const percentile = Math.ceil(((index + 1) / uniqueRollsArray.length) * 100);
  
  // Find the original roll in uniqueRollsArray and update it
  const originalRoll = uniqueRollsArray.find(r => 
    r.roll.every((die, i) => die === rollData.roll[i])
  );
  
  if (originalRoll && originalRoll.analysis) {
    originalRoll.analysis.overallPercentile = percentile;
  }
});

console.log(`✓ Assigned percentile rankings (1-100) to all rolls\n`);

// ==============================================================================
// CALCULATE OFFENSIVE AND DEFENSIVE RANKINGS
// ==============================================================================

console.log('Calculating offensive and defensive rankings...');

// Default to 3 total players (2 opponents) for ranking calculations
// This can be adjusted in the UI with advanced settings
const DEFAULT_NUM_OPPONENTS = 2;

// For each roll, calculate offensive strength for their best call
// Offensive = "How good is this roll when I have the hammer and call my best game?"
uniqueRollsArray.forEach(rollData => {
  if (rollData.analysis && rollData.analysis.bestCall) {
    const bestCall = rollData.analysis.bestCall;
    const offensiveStrength = calculateOffensiveStrength(
      bestCall.rawStrength, 
      DEFAULT_NUM_OPPONENTS
    );
    rollData.analysis.offensiveStrength = offensiveStrength;
  } else {
    rollData.analysis.offensiveStrength = 0;
  }
});

// Sort by offensive strength to assign offensive percentile rankings
const sortedByOffensive = [...uniqueRollsArray].sort((a, b) => {
  const aOffensive = a.analysis?.offensiveStrength || 0;
  const bOffensive = b.analysis?.offensiveStrength || 0;
  return aOffensive - bOffensive; // Ascending: worst to best
});

sortedByOffensive.forEach((rollData, index) => {
  const percentile = Math.ceil(((index + 1) / uniqueRollsArray.length) * 100);
  const originalRoll = uniqueRollsArray.find(r => 
    r.roll.every((die, i) => die === rollData.roll[i])
  );
  if (originalRoll && originalRoll.analysis) {
    originalRoll.analysis.offensiveRanking = percentile;
  }
});

// For defensive ranking, calculate average defensive strength across all playable games
// Defensive = "How good is this roll for accepting various calls from others?"
uniqueRollsArray.forEach(rollData => {
  if (rollData.analysis && rollData.analysis.variants && rollData.analysis.variants.length > 0) {
    // Calculate average defensive strength across all valid games
    const defensiveStrengths = rollData.analysis.variants.map(variant => 
      calculateDefensiveStrength(variant.rawStrength, DEFAULT_NUM_OPPONENTS)
    );
    const avgDefensiveStrength = defensiveStrengths.reduce((a, b) => a + b, 0) / defensiveStrengths.length;
    rollData.analysis.defensiveStrength = Math.round(avgDefensiveStrength);
    
    // Also track flexibility-weighted defensive strength (more games = better)
    const flexibilityBonus = Math.min(20, rollData.analysis.flexibility * 2); // Up to +20% for high flexibility
    rollData.analysis.defensiveStrengthWeighted = Math.min(100, Math.round(avgDefensiveStrength + flexibilityBonus));
  } else {
    rollData.analysis.defensiveStrength = 0;
    rollData.analysis.defensiveStrengthWeighted = 0;
  }
});

// Sort by weighted defensive strength to assign defensive percentile rankings
const sortedByDefensive = [...uniqueRollsArray].sort((a, b) => {
  const aDefensive = a.analysis?.defensiveStrengthWeighted || 0;
  const bDefensive = b.analysis?.defensiveStrengthWeighted || 0;
  return aDefensive - bDefensive; // Ascending: worst to best
});

sortedByDefensive.forEach((rollData, index) => {
  const percentile = Math.ceil(((index + 1) / uniqueRollsArray.length) * 100);
  const originalRoll = uniqueRollsArray.find(r => 
    r.roll.every((die, i) => die === rollData.roll[i])
  );
  if (originalRoll && originalRoll.analysis) {
    originalRoll.analysis.defensiveRanking = percentile;
  }
});

console.log(`✓ Calculated offensive and defensive rankings for all rolls\n`);

// ==============================================================================
// WRITE OUTPUT
// ==============================================================================

const outputData = {
  version: STRENGTH_DATA_VERSION,
  generatedAt: new Date().toISOString(),
  monteCarloIterations: iterations,
  optimalTresAwayStrategy: bestStrategyName,
  thresholds: {
    bossMedian: BOSS_MEDIAN,
    tresAwayExpected: TRES_AWAY_EXPECTED,
    bossOdds: BOSS_ODDS,
    tresAwayOdds: TRES_AWAY_ODDS
  },
  bossHandDistribution: handTypeOdds,
  tresAwayScoreDistribution: (() => {
    // Calculate distribution of scores
    const scoreMap = {};
    uniqueRollsArray.forEach(rollData => {
      const score = calculateTresAwayScore(rollData.roll);
      if (!scoreMap[score]) {
        scoreMap[score] = 0;
      }
      scoreMap[score] += rollData.count;
    });
    
    // Convert to percentages and cumulative
    const distribution = {};
    Object.keys(scoreMap).sort((a, b) => parseInt(a) - parseInt(b)).forEach(score => {
      const percentage = Math.round((scoreMap[score] / diceRolls.length) * 10000) / 100;
      distribution[score] = {
        count: scoreMap[score],
        percentage,
        betterThanAverage: parseInt(score) <= TRES_AWAY_EXPECTED
      };
    });
    
    return distribution;
  })(),
  totalRolls: diceRolls.length,
  uniqueCount: uniqueRollsArray.length,
  uniqueRolls: uniqueRollsArray
};

const outputPath = path.join(__dirname, 'unique-rolls.json');
fs.writeFileSync(outputPath, JSON.stringify(outputData, null, 2));

console.log(`✓ Saved to ${outputPath}`);
console.log(`\nGeneration complete!`);
console.log(`  Version: ${STRENGTH_DATA_VERSION}`);
console.log(`  Monte Carlo iterations: ${iterations}`);
console.log(`  Optimal Tres Away strategy: ${bestStrategyName} (avg score: ${TRES_AWAY_EXPECTED})`);
console.log(`  Boss median rank: ${BOSS_MEDIAN} (${BOSS_ODDS}% above)`);
console.log(`  Tres Away odds: ${TRES_AWAY_ODDS}%`);

