const { generateHammerStrategy } = require('./src/lib/game-validation.js')

console.log('\n=== HAMMER STRATEGY RECOMMENDATIONS ===\n')

// Test scenarios showing trade-offs between game difficulty and kicker strength

const scenarios = [
  {
    name: 'Hard game, excellent kicker',
    roll: [2, 3, 4, 6, 6],
    description: 'Monterey [234] with [66] kicker vs easier games'
  },
  {
    name: 'Easy game, weak kicker',
    roll: [6, 5, 4, 3, 2],
    description: 'Vegas with low kicker vs harder games with better kickers'
  },
  {
    name: 'Multiple strong options',
    roll: [6, 5, 4, 6, 6],
    description: 'SCC [654] with [66] kicker, 10-2 high, Boss 3-of-a-kind'
  },
  {
    name: 'Weak roll',
    roll: [1, 2, 3, 4, 5],
    description: 'Only straights available, all with weak kickers'
  },
  {
    name: 'Perfect Razzle',
    roll: [6, 6, 6, 6, 6],
    description: 'Perfect in multiple games - which to call?'
  }
]

scenarios.forEach(scenario => {
  console.log(`\n${'='.repeat(70)}`)
  console.log(`SCENARIO: ${scenario.name}`)
  console.log(`Roll: [${scenario.roll.join('')}]`)
  console.log(`${scenario.description}`)
  console.log('='.repeat(70))
  
  // Test with different player counts
  const playerCounts = [3, 5, 8]  // Total players
  
  playerCounts.forEach(totalPlayers => {
    const numOpponents = totalPlayers - 1
    
    console.log(`\n--- ${totalPlayers} Players (${numOpponents} opponents) ---`)
    
    const strategy = generateHammerStrategy(scenario.roll, numOpponents)
    
    console.log(`\nSUMMARY: ${strategy.summary}`)
    console.log(`Flexibility: ${strategy.flexibility} games available`)
    
    if (strategy.bestCall) {
      const losePct = 100 - strategy.bestCall.offensiveStrength
      const loseStr = (losePct < 0.1 && losePct > 0) ? '<0.1%' : losePct.toFixed(1) + '%'
      console.log(`\n1st CALL: ${strategy.bestCall.game.toUpperCase()}${strategy.bestCall.variant ? ` ${strategy.bestCall.variant}` : ''}`)
      console.log(`   Chance of Losing: ${loseStr}`)
      console.log(`   Tie/Beat Risk: ${(strategy.bestCall.tieProbability * 100).toFixed(2)}%`)
      console.log(`   Kicker: [${strategy.bestCall.kicker.join('')}]`)
      console.log(`   ${strategy.bestCall.explanation}`)
    }
    
    if (strategy.secondBestCall) {
      const losePct = 100 - strategy.secondBestCall.offensiveStrength
      const loseStr = (losePct < 0.1 && losePct > 0) ? '<0.1%' : losePct.toFixed(1) + '%'
      console.log(`\n2nd CALL: ${strategy.secondBestCall.game.toUpperCase()}${strategy.secondBestCall.variant ? ` ${strategy.secondBestCall.variant}` : ''}`)
      console.log(`   Chance of Losing: ${loseStr}`)
      console.log(`   Tie/Beat Risk: ${(strategy.secondBestCall.tieProbability * 100).toFixed(2)}%`)
      console.log(`   Kicker: [${strategy.secondBestCall.kicker.join('')}]`)
      console.log(`   ${strategy.secondBestCall.explanation}`)
    }
    
    if (strategy.thirdBestCall) {
      const losePct = 100 - strategy.thirdBestCall.offensiveStrength
      const loseStr = (losePct < 0.1 && losePct > 0) ? '<0.1%' : losePct.toFixed(1) + '%'
      console.log(`\n3rd CALL: ${strategy.thirdBestCall.game.toUpperCase()}${strategy.thirdBestCall.variant ? ` ${strategy.thirdBestCall.variant}` : ''}`)
      console.log(`   Chance of Losing: ${loseStr}`)
      console.log(`   Tie/Beat Risk: ${(strategy.thirdBestCall.tieProbability * 100).toFixed(2)}%`)
    }
  })
})

console.log('\n\n' + '='.repeat(70))
console.log('KEY INSIGHTS')
console.log('='.repeat(70))
console.log('')
console.log('1. GAME DIFFICULTY vs KICKER STRENGTH:')
console.log('   - Hard game + excellent kicker = protects you from losing')
console.log('   - Easy game + weak kicker = opponents likely to match/beat you')
console.log('   - Choose option with LOWEST chance of losing')
console.log('')
console.log('2. PLAYER COUNT MATTERS:')
console.log('   - More opponents = tie risk compounds')
console.log('   - Your chance of losing increases with more players')
console.log('   - NOTE: Even perfect kickers show "<0.1% lose" (never true 0.0%!)')
console.log('')
console.log('3. SECOND CALL BACKUP:')
console.log('   - Always have a backup ready if first call is refused')
console.log('   - Large difference in lose % indicates limited flexibility')
console.log('')
