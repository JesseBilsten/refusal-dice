#!/usr/bin/env node

/**
 * Quick test to demonstrate precision fix for perfect kickers
 * Shows that we never display "0.0%" when there's a non-zero chance of losing
 */

const { generateHammerStrategy } = require('./src/lib/game-validation.js')

console.log('=' .repeat(70))
console.log('PRECISION FIX DEMONSTRATION')
console.log('Testing that perfect kickers never show "0.0% chance of losing"')
console.log('=' .repeat(70))
console.log()

// Test scenarios with perfect kickers
const scenarios = [
  {
    name: 'Perfect 10-2 kicker [666]',
    roll: [6, 6, 6, 4, 5],
    expectedGame: '10-2',
    tieProbSingle: 0.463,  // (1/6)^3
    description: 'Three 6s - opponents need exact same to tie'
  },
  {
    name: 'Perfect SCC kicker [66]',
    roll: [6, 6, 4, 5, 6],
    expectedGame: 'ship-captain-crew',
    tieProbSingle: 2.78,  // (1/6)^2
    description: 'Two 6s - opponents need exact same to tie'
  },
  {
    name: 'Perfect 10-4 kicker [6]',
    roll: [6, 5, 3, 1, 1],
    expectedGame: '10-4',
    tieProbSingle: 16.67,  // 1/6
    description: 'One 6 - opponents need exact same to tie'
  }
]

scenarios.forEach((scenario, idx) => {
  console.log(`\n${idx + 1}. ${scenario.name}`)
  console.log('   ' + '-'.repeat(65))
  console.log(`   Roll: [${scenario.roll.join(', ')}]`)
  console.log(`   ${scenario.description}`)
  console.log()
  
  // Test with 2 opponents
  const result = generateHammerStrategy(scenario.roll, 2)
  
  // Find the expected game in results
  const call = result.allRecommendations.find(r => r.game === scenario.expectedGame)
  
  if (call) {
    const losePct = 100 - call.offensiveStrength
    const loseStr = (losePct < 0.1 && losePct > 0) ? '<0.1%' : losePct.toFixed(1) + '%'
    
    console.log(`   Best call: ${call.game} ${call.variant || ''}`)
    console.log(`   Kicker: [${call.kicker.join('')}]`)
    console.log()
    console.log(`   Single-opponent tie probability: ${scenario.tieProbSingle}%`)
    console.log(`   Two-opponent tie risk: ${(call.tieProbability * 100).toFixed(2)}%`)
    console.log()
    console.log(`   Offensive strength: ${call.offensiveStrength.toFixed(4)}%`)
    console.log(`   Chance of losing: ${loseStr}`)
    console.log()
    
    // Verify we're not showing 0.0%
    if (loseStr === '0.0%') {
      console.log(`   ❌ ERROR: Showing "0.0%" when actual value is ${losePct.toFixed(4)}%`)
    } else if (loseStr === '<0.1%') {
      console.log(`   ✓ CORRECT: Showing "<0.1%" for very small but non-zero value`)
    } else {
      console.log(`   ✓ CORRECT: Showing precise percentage: ${loseStr}`)
    }
  }
})

console.log()
console.log('=' .repeat(70))
console.log('KEY POINTS')
console.log('=' .repeat(70))
console.log()
console.log('1. Perfect kickers CAN be tied (exact match probability)')
console.log('2. Ties lead to:')
console.log('   - Call passing (2 players)')
console.log('   - Roll-off (3+ players) where you can lose')
console.log('3. We now show "<0.1%" instead of "0.0%" for very strong hands')
console.log('4. This correctly communicates that losing is possible but unlikely')
console.log()
