const { generateHammerStrategy, gameOddsMap } = require('./src/lib/game-validation.js');

console.log('=== Testing Example Hands ===\n');

// Hand 1: [2,3,3,4,4]
console.log('1. Hand [2,3,3,4,4] - Pairs vs Vegas tiebreaker:');
let result = generateHammerStrategy([2,3,3,4,4], 2, gameOddsMap);
console.log('   Top 2:', result.allRecommendations.slice(0,2).map(r => 
  `${r.game}${r.variant ? '-'+r.variant : ''} (${r.globalStrength.toFixed(1)}%, base:${r.gameInfo.baseProbabilityPct}%)`
).join(' | '));
console.log('   Summary:', result.summary);
console.log('');

// Hand 2: [1,1,1,2,6]
console.log('2. Hand [1,1,1,2,6] - Boss vs Razzle explanation:');
result = generateHammerStrategy([1,1,1,2,6], 2, gameOddsMap);
console.log('   Top 3:', result.allRecommendations.slice(0,3).map(r => 
  `${r.game}${r.variant ? '-'+r.variant : ''} (${r.globalStrength.toFixed(1)}%)`
).join(' | '));
console.log('   Best:', result.bestCall.game, '-', result.bestCall.explanation);
console.log('');

// Hand 3: [5,6,6,6,6]
console.log('3. Hand [5,6,6,6,6] - Specialty game rankings:');
result = generateHammerStrategy([5,6,6,6,6], 2, gameOddsMap);
console.log('   Top 3:', result.allRecommendations.slice(0,3).map(r => 
  `${r.game}${r.variant ? '-'+r.variant : ''} (${r.globalStrength.toFixed(1)}%)`
).join(' | '));
console.log('   Boss:', result.bestCall.explanation);
console.log('');

// Hand 4: [6,2,5,3,2]
console.log('4. Hand [6,2,5,3,2] - Strong hand (NOT a bark):');
result = generateHammerStrategy([6,2,5,3,2], 2, gameOddsMap);
console.log('   Best:', result.bestCall.game + (result.bestCall.variant ? '-'+result.bestCall.variant : ''), 
  `(${result.bestCall.globalStrength.toFixed(1)}%)`);
console.log('   Explanation:', result.bestCall.explanation);
console.log('');

// Hand 5: Weak hand to test bark threshold
console.log('5. Hand [2,3,4,5,6] - Testing bark threshold:');
result = generateHammerStrategy([2,3,4,5,6], 2, gameOddsMap);
const bestLoseChance = 100 - result.bestCall.offensiveStrength;
console.log('   Best option:', result.bestCall.game + (result.bestCall.variant ? '-'+result.bestCall.variant : ''),
  `(${bestLoseChance.toFixed(1)}% chance to lose)`);
console.log('   Summary:', result.summary);
console.log('');

console.log('=== All Tests Complete ===');
