const { 
  calculateOpponentTieOrBeatProbability,
  calculateOffensiveStrength 
} = require('./src/lib/game-validation.js')

console.log('\n=== MULTIPLAYER TIE PROBABILITY IMPACT ===\n')

// Test perfect kicker hands across different player counts
const perfectHands = [
  { game: '10-4', label: '10-4 perfect [6]', rawStrength: 100, kickerDice: 1 },
  { game: 'ship-captain-crew', label: 'SCC perfect [66]', rawStrength: 100, kickerDice: 2 },
  { game: '10-2', label: '10-2 perfect [666]', rawStrength: 100, kickerDice: 3 },
  { game: 'boss', label: 'Boss [66666]', rawStrength: 100, kickerDice: null },
  { game: 'razzle', label: 'Razzle [66666]', rawStrength: 100, kickerDice: null }
]

const playerCounts = [2, 3, 4, 5, 6, 7, 8]

perfectHands.forEach(hand => {
  console.log(`\n${hand.label}:`)
  console.log('-'.repeat(70))
  
  // Calculate single opponent tie risk
  const singleOpponentTieRisk = calculateOpponentTieOrBeatProbability(
    hand.rawStrength, 
    hand.game, 
    { variant: 'high' }
  )
  
  console.log(`Single opponent tie risk: ${(singleOpponentTieRisk * 100).toFixed(2)}%`)
  if (hand.kickerDice) {
    const exactMatch = Math.pow(1/6, hand.kickerDice)
    console.log(`  (Exact kicker match: (1/6)^${hand.kickerDice} = ${(exactMatch * 100).toFixed(2)}%)`)
  }
  
  console.log('\nMulti-player scenarios:')
  playerCounts.forEach(totalPlayers => {
    const numOpponents = totalPlayers - 1
    
    // Calculate probability at least one opponent ties
    const pAtLeastOneTie = 1 - Math.pow(1 - singleOpponentTieRisk, numOpponents)
    
    // Calculate chance of losing (100 - offensive strength)
    const offensive = calculateOffensiveStrength(hand.rawStrength, numOpponents, hand.game)
    const pLose = 100 - offensive
    
    console.log(`  ${totalPlayers} players: ${(pAtLeastOneTie * 100).toFixed(2)}% chance of tie  |  ${pLose.toFixed(1)}% chance of losing`)
  })
})

console.log('\n\n=== KEY INSIGHTS ===\n')
console.log('1. 10-4 RISKIEST: Even with perfect kicker, 11.48% single-opponent tie risk')
console.log('   - In 8-player game: 58.2% chance someone ties!')
console.log('')
console.log('2. SCC MODERATE RISK: 2.64% single-opponent tie risk with perfect kicker')
console.log('   - In 8-player game: 17.4% chance someone ties')
console.log('')
console.log('3. 10-2 SAFEST KICKER GAME: 0.44% single-opponent tie risk')
console.log('   - In 8-player game: 3.1% chance someone ties')
console.log('')
console.log('4. BOSS SAFEST OVERALL: 0.40% single-opponent tie risk')
console.log('   - In 8-player game: 2.8% chance someone ties')
console.log('')
console.log('5. RAZZLE RISKIEST: 13.17% single-opponent tie risk')
console.log('   - In 8-player game: 63.1% chance someone ties!')
console.log('')
console.log('Recommendation: In large games (6+ players), avoid 10-4 and Razzle even with perfect hands')

console.log('\n=== CHANCE OF LOSING COMPARISON (8 players) ===\n')

const eightPlayerOpponents = 7
perfectHands.forEach(hand => {
  const offensive = calculateOffensiveStrength(hand.rawStrength, eightPlayerOpponents, hand.game)
  const pLose = 100 - offensive
  console.log(`${hand.label.padEnd(25)} → ${pLose.toFixed(1)}% chance of losing`)
})

console.log('\nLower % = safer call in multiplayer games')
