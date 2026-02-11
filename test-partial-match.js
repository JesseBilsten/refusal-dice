const { calculatePartialMatch, generateRefuserStrategy, gameOddsMap } = require('./src/lib/game-validation.js')

console.log('\n=== Testing Partial Match Detection ===\n')

// Test 1: Monterey Low with 3,4 (your example)
console.log('Test 1: Monterey Low with [1,3,4,6,6]')
const roll1 = [1, 3, 4, 6, 6]
const partial1 = calculatePartialMatch(roll1, 'monterey', 'low')
console.log('Result:', partial1)
console.log('Expected: hasPartialMatch=true, proximity~60-80, diceNeeded=2')
console.log()

// Test 2: Monterey High with 2,5
console.log('Test 2: Monterey High with [2,5,5,1,1]')
const roll2 = [2, 5, 5, 1, 1]
const partial2 = calculatePartialMatch(roll2, 'monterey', 'high')
console.log('Result:', partial2)
console.log('Expected: hasPartialMatch=true, proximity~40, diceNeeded=3')
console.log()

// Test 3: Ship-Captain-Crew with 6,5 (missing 4)
console.log('Test 3: SCC with [6,5,3,2,1]')
const roll3 = [6, 5, 3, 2, 1]
const partial3 = calculatePartialMatch(roll3, 'ship-captain-crew', null)
console.log('Result:', partial3)
console.log('Expected: hasPartialMatch=true, proximity=60, diceNeeded=1')
console.log()

// Test 4: Pairs with 1 pair (need 2 pairs)
console.log('Test 4: Pairs with [3,3,1,2,4]')
const roll4 = [3, 3, 1, 2, 4]
const partial4 = calculatePartialMatch(roll4, 'pairs', null)
console.log('Result:', partial4)
console.log('Expected: hasPartialMatch=true, proximity=40, diceNeeded=1')
console.log()

// Test 5: No partial match - Vegas with random dice
console.log('Test 5: Vegas Low with [1,2,3,4,6]')
const roll5 = [1, 2, 3, 4, 6]
const partial5 = calculatePartialMatch(roll5, 'vegas', 'low')
console.log('Result:', partial5)
console.log()

console.log('\n=== Testing Refuser Strategy with Partial Matches ===\n')

// Test 6: Monterey Low call with partial match
console.log('Test 6: Called Monterey Low, have [1,3,4,6,6] (partial match)')
const strategy1 = generateRefuserStrategy(
  roll1, 
  'monterey', 
  'low',
  'first',
  2,
  [], // No second call data for simple test
  gameOddsMap
)
console.log('Decision:', strategy1.decision)
console.log('Confidence:', strategy1.confidence)
console.log('Reason:', strategy1.reason)
console.log('Explanation:', strategy1.details?.explanation)
console.log('Partial Match:', strategy1.partialMatch)
console.log()

// Test 7: SCC with 6,5,4 (complete game)
console.log('Test 7: Called SCC, have [6,5,4,3,2] (complete game)')
const roll7 = [6, 5, 4, 3, 2]
const strategy7 = generateRefuserStrategy(
  roll7,
  'ship-captain-crew',
  'high',
  'first',
  2,
  [],
  gameOddsMap
)
console.log('Decision:', strategy7.decision)
console.log('Confidence:', strategy7.confidence)
console.log('Reason:', strategy7.reason)
console.log('Partial Match:', strategy7.partialMatch)
console.log()

// Test 8: SCC with only 6 (no partial match - only 1/3)
console.log('Test 8: Called SCC, have [6,1,2,3,3] (only 1/3 required)')
const roll8 = [6, 1, 2, 3, 3]
const partial8 = calculatePartialMatch(roll8, 'ship-captain-crew', null)
console.log('Partial match check:', partial8)
const strategy8 = generateRefuserStrategy(
  roll8,
  'ship-captain-crew',
  'low',
  'first',
  2,
  [],
  gameOddsMap
)
console.log('Decision:', strategy8.decision)
console.log('Confidence:', strategy8.confidence)
console.log('Reason:', strategy8.reason)
console.log()

console.log('\n=== Summary ===')
console.log('Partial match detection allows strategic acceptance of incomplete games')
console.log('when the odds of completing are better than likely second call difficulty.')
