const { analyzeRoll, calculateOpponentTieOrBeatProbability } = require('./src/lib/game-validation.js')

console.log('\n=== REAL ROLL EXAMPLES ===\n')

// Test with actual rolls to see how kickers work
const testRolls = [
  { dice: [6, 6, 6, 6, 6], label: 'Perfect SCC high' },
  { dice: [6, 5, 4, 3, 2], label: 'SCC high [654] with low kicker' },
  { dice: [6, 5, 4, 6, 6], label: 'SCC high [654] with [66] kicker' },
  { dice: [1, 2, 3, 5, 5], label: 'SCC low [123] with [55] kicker' },
  { dice: [1, 2, 3, 1, 1], label: 'SCC low [123] with [11] kicker' },
]

testRolls.forEach(({ dice, label }) => {
  console.log(`\n${label}: [${dice.join('')}]`)
  console.log('-'.repeat(60))
  
  const analysis = analyzeRoll(dice)
  
  // Find SCC variants
  const sccVariants = analysis.variants.filter(v => v.game === 'ship-captain-crew')
  
  sccVariants.forEach(v => {
    console.log(`\nVariant: ${v.variant}`)
    console.log(`Raw strength: ${v.rawStrength.toFixed(2)}`)
    console.log(`Kicker: [${v.kicker.join('')}]`)
    console.log(`Details: ${v.details}`)
    
    // Calculate tie probability with explicit kicker info
    const handDetails = {
      variant: v.variant,
      kicker: v.kicker,
      rawStrength: v.rawStrength
    }
    
    const tieProb = calculateOpponentTieOrBeatProbability(v.rawStrength, v.game, handDetails)
    console.log(`Opponent tie/beat risk: ${(tieProb * 100).toFixed(2)}%`)
  })
})

console.log('\n\n=== KICKER INTERPRETATION ===\n')
console.log('For kicker games, tie risk = P(opponent makes hand) × P(kicker ties/beats)')
console.log('- High rawStrength = strong kicker → low tie risk')
console.log('- Low rawStrength = weak kicker → high tie risk')
console.log('\nPERFECT KICKERS CAN STILL BE TIED:')
console.log('- SCC [654] with [66] kicker → 2.64% tie risk (opponent gets exact [66])')
console.log('- SCC [123] with [11] kicker → 2.64% tie risk (opponent gets exact [11])')
console.log('- Tie probability = P(make hand) × (1/6)^N where N = kicker dice count')
console.log('\nNON-PERFECT KICKERS:')
console.log('- SCC [654] with [23] kicker → ~68.6% tie risk')
console.log('- Opponent can beat with better kicker OR tie with exact match')
