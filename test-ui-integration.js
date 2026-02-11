const { 
  analyzeRoll, 
  calculateOffensiveStrength,
  calculateDefensiveStrength,
  calculateOpponentTieOrBeatProbability 
} = require('./src/lib/game-validation.js')

console.log('\n=== UI INTEGRATION TEST ===\n')

// Test roll that has multiple game options
const testRoll = [6, 5, 4, 6, 6]
console.log(`Test roll: [${testRoll.join('')}]`)

const analysis = analyzeRoll(testRoll)
console.log(`\nFlexibility: ${analysis.flexibility} games`)
console.log(`Best call: ${analysis.bestCall?.game} (${analysis.bestCall?.variant || 'no variant'})`)

console.log('\n=== ALL VARIANTS ===\n')

const numOpponents = 2  // 3 players total

analysis.variants.forEach((v, i) => {
  if (v.rawStrength === 0) return  // Skip unplayable
  
  console.log(`\n${i + 1}. ${v.game.toUpperCase()}${v.variant ? ` (${v.variant})` : ''}`)
  console.log(`   Raw Strength: ${v.rawStrength.toFixed(2)}`)
  console.log(`   Details: ${v.details}`)
  
  // Calculate tie probability
  const handDetails = {
    variant: v.variant,
    kicker: v.kicker,
    rawStrength: v.rawStrength
  }
  const tieProb = calculateOpponentTieOrBeatProbability(v.rawStrength, v.game, handDetails)
  console.log(`   Tie/Beat Risk: ${(tieProb * 100).toFixed(2)}%`)
  
  // Calculate offensive strength (for making calls)
  const offensive = calculateOffensiveStrength(v.rawStrength, numOpponents, v.game)
  console.log(`   Offensive Strength: ${offensive.toFixed(2)}% (vs ${numOpponents} opponents)`)
  
  // Calculate defensive strength (for accepting calls)
  const defensive = calculateDefensiveStrength(v.rawStrength, numOpponents, v.game)
  console.log(`   Defensive Strength: ${defensive.toFixed(2)}%`)
})

console.log('\n=== BEST CALLS FOR HAMMER STRATEGY ===\n')

// Sort by offensive strength
const validVariants = analysis.variants.filter(v => v.rawStrength > 0)
const sorted = validVariants.map(v => {
  const offensive = calculateOffensiveStrength(v.rawStrength, numOpponents, v.game)
  return { ...v, offensive }
}).sort((a, b) => b.offensive - a.offensive)

console.log('Recommended call order (highest offensive strength first):\n')
sorted.slice(0, 5).forEach((v, i) => {
  const label = `${v.game}${v.variant ? `-${v.variant}` : ''}`
  console.log(`${i + 1}. ${label.padEnd(25)} → ${v.offensive.toFixed(2)}% offensive`)
})

console.log('\n\n=== INTERPRETATION ===\n')
console.log('Lower chance of losing = better choice for making calls')
console.log('The tie/beat risk is automatically factored into the calculation')
console.log('Games with lower tie risk will have lower chance of losing')
console.log('\nFor this roll [65466]:')
console.log('- 10-2 high with [566] has 0.0% chance of losing (0.44% tie risk, 3 kicker dice)')
console.log('- SCC high with [66] has 0.0% chance of losing (2.64% tie risk, 2 kicker dice)')
console.log('- Boss 3-of-a-kind has 29.0% chance of losing (10% tie risk)')
console.log('\nNote: Perfect kickers CAN be tied if opponent gets exact same kicker')
console.log('Tie probability = P(make hand) × (1/6)^N where N = # kicker dice')
