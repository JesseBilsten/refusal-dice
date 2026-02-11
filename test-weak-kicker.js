const { generateHammerStrategy } = require('./src/lib/game-validation.js')

console.log('\n=== SPECIFIC SCENARIO: Weak Kicker vs Strong Kicker ===\n')

// Roll that can make Monterey with weak kicker OR Vegas with strong kicker
const roll = [2, 3, 4, 1, 6]
console.log(`Roll: [${roll.join('')}]`)
console.log('Options: Monterey Low [234] with [1] kicker (weak for low)')
console.log('     vs: Vegas High with [6] kicker (strong for high)\n')

const numOpponents = 2

const strategy = generateHammerStrategy(roll, numOpponents)

console.log('='.repeat(70))
console.log('TOP RECOMMENDATIONS')
console.log('='.repeat(70))

const top5 = strategy.allRecommendations.slice(0, 5)
top5.forEach((rec, i) => {
  console.log(`\n${i + 1}. ${rec.game.toUpperCase()}${rec.variant ? ` ${rec.variant}` : ''}`)
  console.log(`   Kicker: [${rec.kicker.join('')}] (${rec.gameInfo.kickerStrength || 'N/A'})`)
  console.log(`   Game: ${rec.gameInfo.gameDifficulty} (${(rec.gameInfo.baseOdds * 100).toFixed(1)}% base)`)
  console.log(`   Chance of Losing: ${(100 - rec.offensiveStrength).toFixed(1)}%`)
  console.log(`   Tie Risk: ${(rec.tieProbability * 100).toFixed(2)}%`)
  console.log(`   ${rec.explanation}`)
})

console.log('\n' + '='.repeat(70))
console.log('DETAILED ANALYSIS')
console.log('='.repeat(70))

// Find the specific comparisons
const montereyLow = strategy.allRecommendations.find(r => r.game === 'monterey' && r.variant === 'low')
const vegasHigh = strategy.allRecommendations.find(r => r.game === 'vegas' && r.variant === 'high')

if (montereyLow && vegasHigh) {
  console.log('\nMonterey Low [234] with [1] kicker:')
  console.log(`  Base game probability (1 roll): ${(montereyLow.gameInfo.baseOdds * 100).toFixed(1)}%`)
  console.log(`  Success over 3 rolls: ~88%`)
  console.log(`  Kicker strength: ${montereyLow.gameInfo.kickerStrength} (${montereyLow.rawStrength.toFixed(1)}% percentile)`)
  console.log(`  P(opponent beats/ties kicker): ${((1 - montereyLow.rawStrength/100) * 100).toFixed(1)}%`)
  console.log(`  Combined tie/beat risk: ${(montereyLow.tieProbability * 100).toFixed(2)}%`)
  console.log(`  Chance of losing: ${(100 - montereyLow.offensiveStrength).toFixed(1)}%`)
  
  console.log('\nVegas High with [6] kicker:')
  console.log(`  Base game probability (1 roll): ${(vegasHigh.gameInfo.baseOdds * 100).toFixed(1)}%`)
  console.log(`  Success over 3 rolls: ~95%`)
  console.log(`  Kicker strength: ${vegasHigh.gameInfo.kickerStrength} (${vegasHigh.rawStrength.toFixed(1)}% percentile)`)
  console.log(`  P(opponent beats/ties kicker): ${((1 - vegasHigh.rawStrength/100) * 100).toFixed(1)}%`)
  console.log(`  Combined tie/beat risk: ${(vegasHigh.tieProbability * 100).toFixed(2)}%`)
  console.log(`  Chance of losing: ${(100 - vegasHigh.offensiveStrength).toFixed(1)}%`)
  
  console.log('\n' + '-'.repeat(70))
  console.log('VERDICT:')
  if (montereyLow.offensiveStrength > vegasHigh.offensiveStrength) {
    const diff = (100 - montereyLow.offensiveStrength) - (100 - vegasHigh.offensiveStrength)
    console.log(`Monterey Low safer by ${Math.abs(diff).toFixed(1)}% - the harder game compensates for the weaker kicker`)
  } else if (vegasHigh.offensiveStrength > montereyLow.offensiveStrength) {
    const diff = (100 - vegasHigh.offensiveStrength) - (100 - montereyLow.offensiveStrength)
    console.log(`Vegas High safer by ${Math.abs(diff).toFixed(1)}% - the easier game + stronger kicker is better`)
  } else {
    console.log('Tied - both options have same risk of losing')
  }
}

console.log('\n' + '='.repeat(70))
console.log('CONCLUSION')
console.log('='.repeat(70))
console.log('')
console.log('The hammer strategy automatically balances:')
console.log('  • Game difficulty (how hard for opponents to make it)')
console.log('  • Kicker strength (how likely they beat your kicker if they make it)')
console.log('')
console.log('Your goal: MINIMIZE your chance of LOSING (having worst hand)')
console.log('')
console.log('You do NOT need to manually calculate this trade-off!')
console.log('Just choose the option with the LOWEST chance of losing.')
console.log('')
