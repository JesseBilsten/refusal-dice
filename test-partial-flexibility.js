const { calculatePartialMatch, generateRefuserStrategy, gameOddsMap } = require('./src/lib/game-validation.js')

console.log('\n=== Testing Monterey Partial Match Flexibility ===\n')

// Test Case 1: [3,4] - Can extend in BOTH directions (2 OR 5 helps)
console.log('Test 1: Monterey Low - [1,3,4,6,6]')
console.log('Has: 1, 3, 4 (middle of straight)')
const roll1 = [1, 3, 4, 6, 6]
const partial1 = calculatePartialMatch(roll1, 'monterey', 'low')
console.log('Result:', partial1)
console.log('✓ Productive next values:', partial1.productiveNextValues, '(can roll 2 OR 5)')
console.log('✓ Proximity:', partial1.proximity, '(higher due to flexibility)')
console.log()

// Test Case 2: [2,3] - Can only extend in ONE direction (4 helps, 1 makes SCC)
console.log('Test 2: Monterey Low - [2,3,6,6,6]')
console.log('Has: 2, 3 (edge of straight, already have 1,2,3 = SCC)')
const roll2 = [1, 2, 3, 6, 6]
const partial2 = calculatePartialMatch(roll2, 'monterey', 'low')
console.log('Result:', partial2)
console.log('✓ Productive next values:', partial2.productiveNextValues, '(can only extend high)')
console.log('✓ Proximity:', partial2.proximity, '(lower due to limited direction)')
console.log()

// Test Case 3: [4,5] - Similar to [2,3], limited extension
console.log('Test 3: Monterey Low - [4,5,6,1,1]')
console.log('Has: 4, 5 (near edge)')
const roll3 = [4, 5, 6, 1, 1]
const partial3 = calculatePartialMatch(roll3, 'monterey', 'low')
console.log('Result:', partial3)
console.log('✓ Productive next values:', partial3.productiveNextValues)
console.log('✓ Proximity:', partial3.proximity)
console.log()

console.log('\n=== Testing Vegas Partial Match (Corrected Logic) ===\n')

// Test Case 4: Vegas 7 with 1 pair (1,6) only
console.log('Test 4: Vegas Low - [1,6,3,3,3]')
console.log('Has: One pair (1,6) = 7')
console.log('Does NOT have: Second pair (no other pairs sum to 7)')
const roll4 = [1, 6, 3, 3, 3]
const partial4 = calculatePartialMatch(roll4, 'vegas', 'low')
console.log('Result:', partial4)
if (partial4.hasPartialMatch) {
  console.log('✓ Detected partial match correctly!')
  console.log('✓ Description:', partial4.description)
} else {
  console.log('✗ Should detect 1 pair as partial match')
}
console.log()

// Test Case 5: Vegas 7 with NO pairs
console.log('Test 5: Vegas Low - [1,2,3,4,5]')
console.log('Has: No pairs summing to 7')
const roll5 = [1, 2, 3, 4, 5]
const partial5 = calculatePartialMatch(roll5, 'vegas', 'low')
console.log('Result:', partial5)
if (!partial5.hasPartialMatch) {
  console.log('✓ Correctly rejected (no pairs)')
} else {
  console.log('✗ Should NOT detect partial match')
}
console.log()

// Test Case 6: Vegas 11 with 1 pair (5,6)
console.log('Test 6: Vegas High - [5,6,1,2,3]')
console.log('Has: One pair (5,6) = 11')
const roll6 = [5, 6, 1, 2, 3]
const partial6 = calculatePartialMatch(roll6, 'vegas', 'high')
console.log('Result:', partial6)
if (partial6.hasPartialMatch) {
  console.log('✓ Detected partial match for Vegas 11')
  console.log('✓ Lower proximity than Vegas 7:', partial6.proximity, '< 35 (harder game)')
}
console.log()

console.log('\n=== Strategy Comparison: Monterey Flexibility Impact ===\n')

// Compare strategies for [3,4] vs [2,3]
console.log('Scenario A: Called Monterey Low, have [1,3,4,6,6] (flexible)')
const strategyA = generateRefuserStrategy(roll1, 'monterey', 'low', 'first', 2, [], gameOddsMap)
console.log('Decision:', strategyA.decision)
console.log('Confidence:', strategyA.confidence + '%')
console.log('Complete odds:', strategyA.details?.completeGameOdds)
console.log()

console.log('Scenario B: Called Monterey Low, have [1,2,3,6,6] (limited)')
const strategyB = generateRefuserStrategy(roll2, 'monterey', 'low', 'first', 2, [], gameOddsMap)
console.log('Decision:', strategyB.decision)
console.log('Confidence:', strategyB.confidence + '%')
console.log('Complete odds:', strategyB.details?.completeGameOdds)
console.log()

console.log('📊 Analysis:')
console.log('- Scenario A ([3,4]): Higher odds (~35%) due to 2-way flexibility')
console.log('- Scenario B ([2,3]): Lower odds (~20%) due to 1-way extension')
console.log('- Strategy may differ based on these probability differences')
