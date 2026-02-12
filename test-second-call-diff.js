const { analyzeSecondCallDistribution, getKickerStrength, checkGame } = require('./src/lib/game-validation.js');
const uniqueRolls = require('./src/data/unique-rolls.json');

// Simulate what 2nd call predictor does
const result1 = analyzeSecondCallDistribution('monterey', 'low', uniqueRolls.uniqueRolls, 2);
console.log('2nd Call Predictor (all rolls):');
console.log('Total rolls:', result1.totalRolls);
console.log('Total instances:', result1.totalInstances);
const vegas1 = result1.secondCallDistribution.find(d => d.displayName === 'vegas low');
console.log('Vegas low:', vegas1);

// Simulate what detail page should do (filter first, then analyze)
const filteredRolls = uniqueRolls.uniqueRolls.filter(rollData => {
  if (!checkGame(rollData.roll, 'monterey')) return false;
  const strength = getKickerStrength(rollData.roll, 'monterey');
  return strength === 'low';
});
const result2 = analyzeSecondCallDistribution('monterey', 'low', filteredRolls, 2);
console.log('\nDetail Page (pre-filtered):');
console.log('Total rolls:', result2.totalRolls);
console.log('Total instances:', result2.totalInstances);
const vegas2 = result2.secondCallDistribution.find(d => d.displayName === 'vegas low');
console.log('Vegas low:', vegas2);
