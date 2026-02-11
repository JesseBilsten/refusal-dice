const { calculateOpponentTieOrBeatProbability, calculateKickerGameTieProbability } = require('./src/lib/game-validation.js')

console.log('\n=== KICKER GAME TIE PROBABILITIES ===\n')

// Test kicker games with different strength levels
const games = ['10-2', '10-3', '10-4', 'ship-captain-crew', 'monterey', 'vegas', 'pairs']
const strengthLevels = [
  { strength: 99.5, label: 'Perfect (99.5%)' },
  { strength: 90, label: 'Excellent (90%)' },
  { strength: 75, label: 'Good (75%)' },
  { strength: 50, label: 'Average (50%)' },
  { strength: 25, label: 'Weak (25%)' }
]

games.forEach(game => {
  console.log(`\n${game.toUpperCase()}:`)
  console.log('-'.repeat(60))
  
  strengthLevels.forEach(({ strength, label }) => {
    const tieProb = calculateOpponentTieOrBeatProbability(strength, game, { variant: 'high' })
    const percentage = (tieProb * 100).toFixed(2)
    console.log(`${label.padEnd(25)} → ${percentage}% opponent tie/beat risk`)
  })
})

console.log('\n\n=== HIGH VS LOW VARIANT COMPARISON ===\n')

// Compare high vs low variants at same strength
const testGame = 'ship-captain-crew'
const testStrength = 75

const highVariant = calculateOpponentTieOrBeatProbability(testStrength, testGame, { variant: 'high' })
const lowVariant = calculateOpponentTieOrBeatProbability(testStrength, testGame, { variant: 'low' })

console.log(`Game: ${testGame}`)
console.log(`Strength: ${testStrength}%`)
console.log(`High variant tie risk: ${(highVariant * 100).toFixed(2)}%`)
console.log(`Low variant tie risk: ${(lowVariant * 100).toFixed(2)}%`)

console.log('\n\n=== MULTI-ROLL GAME COMPARISON ===\n')

// Compare different game types at perfect strength
const perfectStrength = 99.5
const allGames = ['boss', 'razzle', 'tres-away', '10-2', 'ship-captain-crew', 'monterey', 'vegas', 'pairs']

console.log('Perfect hands (99.5% strength) - Opponent tie/beat risk:\n')
allGames.forEach(game => {
  const tieProb = calculateOpponentTieOrBeatProbability(perfectStrength, game, { variant: 'high' })
  const percentage = (tieProb * 100).toFixed(2)
  console.log(`${game.padEnd(25)} → ${percentage.padStart(6)}%`)
})

console.log('\n=== INTERPRETATION ===\n')
console.log('Lower % = safer hand (harder for opponent to tie/beat)')
console.log('Higher % = riskier hand (easier for opponent to tie/beat)')
console.log('\nPERFECT HANDS - Tie Risk (can be tied but not beaten):')
console.log('Boss [66666] at 0.40% is safest (exact match required, 2 rolls)')
console.log('Razzle [66666] at 13.17% is riskiest (any 5 matching ties, 3 rolls + wilds)')
console.log('\nPERFECT KICKER HANDS - Tie Risk by # of kicker dice:')
console.log('10-4 (1 kicker die) → 11.48% tie risk')
console.log('SCC, 10-3, Vegas, Monterey (2 kicker dice) → 2.44-2.64% tie risk')
console.log('10-2, Pairs (3 kicker dice) → 0.44% tie risk')
console.log('\nKey: More kicker dice = lower tie probability = safer hand')
