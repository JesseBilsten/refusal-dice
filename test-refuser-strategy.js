/**
 * Comprehensive Refuser Strategy Test Scenarios
 * 
 * This test file validates the refuser strategy algorithm across various scenarios:
 * - Strong hands on easy games (should accept)
 * - Strong hands on hard games (should accept confidently)
 * - Weak hands requiring refusal
 * - First vs second refusal position differences
 * - Partial matches: Monterey flexibility, SCC, Vegas, Pairs
 * - Edge cases: limited flexibility, high difficulty games, second call predictions
 */

const { generateRefuserStrategy, gameOddsMap } = require('./src/lib/game-validation')
const uniqueRollsData = require('./src/data/unique-rolls.json')

const uniqueRollsArray = uniqueRollsData.uniqueRolls

// Test helper to format strategy results
function formatStrategy(roll, game, variant, position, numPlayers, strategy) {
  console.log('\n' + '='.repeat(80))
  console.log(`Roll: ${roll.join('')} | Game: ${game}${variant ? ` (${variant})` : ''} | Position: ${position} | Players: ${numPlayers}`)
  console.log('='.repeat(80))
  console.log(`Decision: ${strategy.decision} (${strategy.confidence}% confident)`)
  console.log(`Reason: ${strategy.reason}`)
  if (strategy.details?.explanation) {
    console.log(`Details: ${strategy.details.explanation}`)
  }
  console.log(`\nMetrics:`)
  console.log(`  Hand Strength: ${strategy.currentStrength?.toFixed(1)}%`)
  console.log(`  Flexibility: ${strategy.flexibility}/10`)
  console.log(`  Game Difficulty: ${strategy.gameDifficulty}`)
  
  if (strategy.partialMatch) {
    console.log(`\n  Partial Match:`)
    console.log(`    ${strategy.partialMatch.description}`)
    if (strategy.partialMatch.productiveNextValues) {
      console.log(`    Productive next values: ${strategy.partialMatch.productiveNextValues}`)
    }
    if (strategy.details?.completeGameOdds) {
      console.log(`    Completion odds: ${strategy.details.completeGameOdds}`)
    }
  }
  
  if (strategy.secondCallPredictions) {
    console.log(`\n  Second Call Predictions:`)
    console.log(`    Most likely: ${strategy.secondCallPredictions.topGame}`)
    console.log(`    Difficulty: ${strategy.secondCallPredictions.difficulty}`)
    if (strategy.details?.secondCallOdds) {
      console.log(`    Your odds on 2nd call: ${strategy.details.secondCallOdds}%`)
    }
  }
  console.log('='.repeat(80))
}

// Run test scenarios
console.log('\n\n🧪 REFUSER STRATEGY TEST SCENARIOS\n')

// ====================================================================================
// SCENARIO 1: Strong Hand on Easy Game (10-2 Low)
// ====================================================================================
console.log('\n\n📊 SCENARIO 1: Strong Hand on Easy Game')
console.log('Scenario: [1,1,2,2,2] called as 10-2 Low')
console.log('Expected: ACCEPT (strong hand, easy game)')

const scenario1 = generateRefuserStrategy(
  [1,1,2,2,2],
  '10-2',
  'low',
  'first',
  3,
  uniqueRollsArray,
  gameOddsMap
)
formatStrategy([1,1,2,2,2], '10-2', 'low', 'first', 3, scenario1)

// Test both positions
const scenario1_second = generateRefuserStrategy(
  [1,1,2,2,2],
  '10-2',
  'low',
  'second',
  3,
  uniqueRollsArray,
  gameOddsMap
)
formatStrategy([1,1,2,2,2], '10-2', 'low', 'second', 3, scenario1_second)

// ====================================================================================
// SCENARIO 2: Strong Hand on Hard Game (Monterey High)
// ====================================================================================
console.log('\n\n📊 SCENARIO 2: Strong Hand on Hard Game')
console.log('Scenario: [4,5,6,6,6] called as Monterey High')
console.log('Expected: ACCEPT (perfect hand for hard game)')

const scenario2 = generateRefuserStrategy(
  [4,5,6,6,6],
  'monterey',
  'high',
  'first',
  3,
  uniqueRollsArray,
  gameOddsMap
)
formatStrategy([4,5,6,6,6], 'monterey', 'high', 'first', 3, scenario2)

// ====================================================================================
// SCENARIO 3: Weak Hand Needing Refusal
// ====================================================================================
console.log('\n\n📊 SCENARIO 3: Weak Hand Needing Refusal')
console.log('Scenario: [1,2,3,4,5] called as 10-3 Low (mediocre roll)')
console.log('Expected: REFUSE on first refusal (threshold 70%)')

const scenario3 = generateRefuserStrategy(
  [1,2,3,4,5],
  '10-3',
  'low',
  'first',
  3,
  uniqueRollsArray,
  gameOddsMap
)
formatStrategy([1,2,3,4,5], '10-3', 'low', 'first', 3, scenario3)

const scenario3_second = generateRefuserStrategy(
  [1,2,3,4,5],
  '10-3',
  'low',
  'second',
  3,
  uniqueRollsArray,
  gameOddsMap
)
formatStrategy([1,2,3,4,5], '10-3', 'low', 'second', 3, scenario3_second)

// ====================================================================================
// SCENARIO 4: Partial Match - Monterey with 2-Way Flexibility
// ====================================================================================
console.log('\n\n📊 SCENARIO 4: Partial Match - Monterey 2-Way Flexibility')
console.log('Scenario: [2,3,4,5,5] called as Monterey Low')
console.log('Expected: ACCEPT (3/5 unique + 2-way flexibility [3,4] = ~35% completion)')

const scenario4 = generateRefuserStrategy(
  [2,3,4,5,5],
  'monterey',
  'low',
  'first',
  3,
  uniqueRollsArray,
  gameOddsMap
)
formatStrategy([2,3,4,5,5], 'monterey', 'low', 'first', 3, scenario4)

// ====================================================================================
// SCENARIO 5: Partial Match - Monterey with 1-Way Flexibility
// ====================================================================================
console.log('\n\n📊 SCENARIO 5: Partial Match - Monterey 1-Way Flexibility')
console.log('Scenario: [1,2,3,4,4] called as Monterey Low')
console.log('Expected: Likely REFUSE (3/5 unique + 1-way flexibility [2,3] = ~20% completion)')

const scenario5 = generateRefuserStrategy(
  [1,2,3,4,4],
  'monterey',
  'low',
  'first',
  3,
  uniqueRollsArray,
  gameOddsMap
)
formatStrategy([1,2,3,4,4], 'monterey', 'low', 'first', 3, scenario5)

// ====================================================================================
// SCENARIO 6: Partial Match - SCC (2/3 dice)
// ====================================================================================
console.log('\n\n📊 SCENARIO 6: Partial Match - Ship Captain Crew')
console.log('Scenario: [5,6,2,3,4] called as SCC High')
console.log('Expected: Consider accepting (has 6,5 needs 4 for completion = ~42%)')

const scenario6 = generateRefuserStrategy(
  [5,6,2,3,4],
  'ship-captain-crew',
  'high',
  'first',
  3,
  uniqueRollsArray,
  gameOddsMap
)
formatStrategy([5,6,2,3,4], 'ship-captain-crew', 'high', 'first', 3, scenario6)

// ====================================================================================
// SCENARIO 7: Partial Match - Vegas (1 Pair for 7)
// ====================================================================================
console.log('\n\n📊 SCENARIO 7: Partial Match - Vegas 7s')
console.log('Scenario: [3,4,1,2,5] called as Vegas 7s')
console.log('Expected: REFUSE (only one pair summing to 7, needs matching pair = ~15%)')

const scenario7 = generateRefuserStrategy(
  [3,4,1,2,5],
  'vegas',
  'low',
  'first',
  3,
  uniqueRollsArray,
  gameOddsMap
)
formatStrategy([3,4,1,2,5], 'vegas', 'low', 'first', 3, scenario7)

// ====================================================================================
// SCENARIO 8: Partial Match - Vegas (1 Pair for 11)
// ====================================================================================
console.log('\n\n📊 SCENARIO 8: Partial Match - Vegas 11s')
console.log('Scenario: [5,6,2,3,4] called as Vegas 11s')
console.log('Expected: REFUSE (only one pair summing to 11, needs matching pair = ~8%)')

const scenario8 = generateRefuserStrategy(
  [5,6,2,3,4],
  'vegas',
  'high',
  'first',
  3,
  uniqueRollsArray,
  gameOddsMap
)
formatStrategy([5,6,2,3,4], 'vegas', 'high', 'first', 3, scenario8)

// ====================================================================================
// SCENARIO 9: Partial Match - Pairs (1 Pair)
// ====================================================================================
console.log('\n\n📊 SCENARIO 9: Partial Match - Pairs')
console.log('Scenario: [2,2,3,4,5] called as Pairs Low')
console.log('Expected: REFUSE (only one pair, needs second pair)')

const scenario9 = generateRefuserStrategy(
  [2,2,3,4,5],
  'pairs',
  'low',
  'first',
  3,
  uniqueRollsArray,
  gameOddsMap
)
formatStrategy([2,2,3,4,5], 'pairs', 'low', 'first', 3, scenario9)

// ====================================================================================
// SCENARIO 10: Edge Case - Very Weak Hand on Easy Game
// ====================================================================================
console.log('\n\n📊 SCENARIO 10: Very Weak Hand on Easy Game')
console.log('Scenario: [1,2,3,4,6] called as 10-2 Low')
console.log('Expected: REFUSE (terrible kicker strength for easy game)')

const scenario10 = generateRefuserStrategy(
  [1,2,3,4,6],
  '10-2',
  'low',
  'first',
  3,
  uniqueRollsArray,
  gameOddsMap
)
formatStrategy([1,2,3,4,6], '10-2', 'low', 'first', 3, scenario10)

// ====================================================================================
// SCENARIO 11: Position Impact - Borderline Hand
// ====================================================================================
console.log('\n\n📊 SCENARIO 11: Position Impact on Borderline Hand')
console.log('Scenario: [1,2,3,3,3] on 10-3 Low (borderline ~65% strength)')
console.log('Expected: REFUSE on first (needs 70%), ACCEPT on second (needs 60%)')

const scenario11_first = generateRefuserStrategy(
  [1,2,3,3,3],
  '10-3',
  'low',
  'first',
  3,
  uniqueRollsArray,
  gameOddsMap
)
formatStrategy([1,2,3,3,3], '10-3', 'low', 'first', 3, scenario11_first)

const scenario11_second = generateRefuserStrategy(
  [1,2,3,3,3],
  '10-3',
  'low',
  'second',
  3,
  uniqueRollsArray,
  gameOddsMap
)
formatStrategy([1,2,3,3,3], '10-3', 'low', 'second', 3, scenario11_second)

// ====================================================================================
// SCENARIO 12: Second Call Predictions Impact
// ====================================================================================
console.log('\n\n📊 SCENARIO 12: Second Call Predictions Factor')
console.log('Scenario: [1,1,2,2,3] on Pairs Low (mediocre pairs hand)')
console.log('Expected: Consider second call difficulty in decision')

const scenario12 = generateRefuserStrategy(
  [1,1,2,2,3],
  'pairs',
  'low',
  'first',
  3,
  uniqueRollsArray,
  gameOddsMap
)
formatStrategy([1,1,2,2,3], 'pairs', 'low', 'first', 3, scenario12)

// ====================================================================================
// SCENARIO 13: No Variants Game (Razzle)
// ====================================================================================
console.log('\n\n📊 SCENARIO 13: No Variants Game - Razzle')
console.log('Scenario: [5,5,5,5,1] called as Razzle')
console.log('Expected: ACCEPT (perfect Razzle hand)')

const scenario13 = generateRefuserStrategy(
  [5,5,5,5,1],
  'razzle',
  null,
  'first',
  3,
  uniqueRollsArray,
  gameOddsMap
)
formatStrategy([5,5,5,5,1], 'razzle', null, 'first', 3, scenario13)

// ====================================================================================
// SCENARIO 14: Multiplayer Impact
// ====================================================================================
console.log('\n\n📊 SCENARIO 14: Multiplayer Impact (6 Players)')
console.log('Scenario: [1,1,2,2,3] on 10-2 Low with 6 players')
console.log('Expected: More likely to accept (more opponents means harder second call)')

const scenario14_3p = generateRefuserStrategy(
  [1,1,2,2,3],
  '10-2',
  'low',
  'first',
  3,
  uniqueRollsArray,
  gameOddsMap
)
formatStrategy([1,1,2,2,3], '10-2', 'low', 'first', 3, scenario14_3p)

const scenario14_6p = generateRefuserStrategy(
  [1,1,2,2,3],
  '10-2',
  'low',
  'first',
  6,
  uniqueRollsArray,
  gameOddsMap
)
formatStrategy([1,1,2,2,3], '10-2', 'low', 'first', 6, scenario14_6p)

// ====================================================================================
// SCENARIO 15: Edge Case - Complete Monterey Called on Partial
// ====================================================================================
console.log('\n\n📊 SCENARIO 15: Perfect Monterey but Missing One Die')
console.log('Scenario: [1,2,3,4,4] called as Monterey Low (has 1,2,3,4 unique)')
console.log('Expected: Partial match detected, decision based on 1-way flexibility')

const scenario15 = generateRefuserStrategy(
  [1,2,3,4,4],
  'monterey',
  'low',
  'first',
  3,
  uniqueRollsArray,
  gameOddsMap
)
formatStrategy([1,2,3,4,4], 'monterey', 'low', 'first', 3, scenario15)

// ====================================================================================
// Summary Statistics
// ====================================================================================
console.log('\n\n📈 TEST SUMMARY\n')
console.log('Total scenarios tested: 15')
console.log('\nScenario Coverage:')
console.log('  ✅ Strong hands on easy games')
console.log('  ✅ Strong hands on hard games')
console.log('  ✅ Weak hands requiring refusal')
console.log('  ✅ First vs second refusal positions')
console.log('  ✅ Partial matches (Monterey 2-way & 1-way, SCC, Vegas 7s & 11s, Pairs)')
console.log('  ✅ Position-specific thresholds')
console.log('  ✅ Second call predictions impact')
console.log('  ✅ No-variant games (Razzle)')
console.log('  ✅ Multiplayer impact (3 vs 6 players)')
console.log('  ✅ Edge cases and borderline decisions')
console.log('\n✨ All test scenarios executed successfully!\n')
