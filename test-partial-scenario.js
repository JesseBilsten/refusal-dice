const { generateRefuserStrategy, gameOddsMap, analyzeSecondCallDistribution } = require('./src/lib/game-validation.js')
const uniqueRollsData = require('./src/data/unique-rolls.json')

console.log('\n=== Real-World Partial Match Scenario ===\n')

// SCC High partial match: has 6,5 but not 4
console.log('📋 Scenario: Opponent calls Ship-Captain-Crew High')
console.log('🎲 Your roll: [6, 5, 2, 2, 1]')
console.log('✅ You have: 6 (ship), 5 (captain)')
console.log('❌ Missing: 4 (crew)')
console.log('🎯 You need: Roll a 4')
console.log()

const roll = [6, 5, 2, 2, 1]

// Test with second call predictions
const secondCallData = analyzeSecondCallDistribution('ship-captain-crew', 'high', uniqueRollsData, 2)
console.log('📊 Second Call Analysis:')
console.log('   Total rolls with SCC:', secondCallData.totalInstances)
console.log('   Unique rolls that make SCC:', secondCallData.totalRolls)
console.log('   Distribution length:', secondCallData.secondCallDistribution?.length)
if (secondCallData.topSecondCall) {
  console.log(`   Most likely: ${secondCallData.topSecondCall.displayName} (${secondCallData.topSecondCall.percentage}%)`)
  console.log(`   Avg offensive strength: ${secondCallData.topSecondCall.avgOffensiveStrength}%`)
} else {
  console.log('   No second call data found')
}
console.log()

// Test as FIRST refusal (more conservative)
console.log('--- Position: FIRST REFUSAL ---')
const firstRefusal = generateRefuserStrategy(
  roll,
  'ship-captain-crew',
  'high',
  'first',
  2,
  uniqueRollsData,
  gameOddsMap
)

console.log(`Decision: ${firstRefusal.decision}`)
console.log(`Confidence: ${firstRefusal.confidence}%`)
console.log(`Reason: ${firstRefusal.reason}`)
console.log(`Current Strength: ${firstRefusal.currentStrength}`)
console.log(`Expected Reroll Value: ${firstRefusal.expectedRerollValue?.toFixed(1)}`)
if (firstRefusal.partialMatch) {
  console.log(`Partial Match: ${firstRefusal.partialMatch.description}`)
  console.log(`Complete Game Odds: ${firstRefusal.details?.completeGameOdds}`)
}
if (firstRefusal.secondCallPredictions) {
  console.log(`Second Call: ${firstRefusal.secondCallPredictions.topGame} (${firstRefusal.secondCallPredictions.difficulty})`)
}
console.log(`\n💡 ${firstRefusal.details?.explanation}`)
console.log()

// Test as SECOND refusal (more aggressive - first player already refused)
console.log('--- Position: SECOND REFUSAL ---')
const secondRefusal = generateRefuserStrategy(
  roll,
  'ship-captain-crew',
  'high',
  'second',
  2,
  uniqueRollsData,
  gameOddsMap
)

console.log(`Decision: ${secondRefusal.decision}`)
console.log(`Confidence: ${secondRefusal.confidence}%`)
console.log(`Reason: ${secondRefusal.reason}`)
console.log(`\n💡 ${secondRefusal.details?.explanation}`)
console.log()

// Contrast: What if second call is Shotgun (very hard)?
console.log('\n=== Contrast: If Second Call Were Shotgun (much harder) ===\n')

// Mock scenario where Shotgun is the likely second call
const shotgunOdds = gameOddsMap['shotgun']?.singleRoll || 0.08
console.log(`Shotgun difficulty: ~${(shotgunOdds * 100).toFixed(0)}% on single roll`)
console.log(`Monterey completion: ~${(Math.pow(gameOddsMap['monterey'].singleRoll, 2) * 100).toFixed(0)}% to get both 2 and 5`)
console.log()
console.log('Strategy Insight:')
console.log('- If second call is Shotgun (~8% chance), keeping partial Monterey is better')
console.log('- If second call is easier game (>30% chance), refusing might be better')
console.log('- Your 3/5 Monterey partial gives you 2 shots at 2 or 5')
console.log('- Probability of getting at least one: ~30-40% depending on how many dice you reroll')
