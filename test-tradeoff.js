const { 
  generateHammerStrategy,
  calculateOpponentTieOrBeatProbability 
} = require('./src/lib/game-validation.js')

console.log('\n=== GAME DIFFICULTY vs KICKER STRENGTH TRADE-OFF ===\n')

// Specific example from user's question:
// Monterey Low with weak kicker (3) vs Vegas High with strong kicker (6)

const roll = [3, 4, 5, 6, 7]  // Can make both Monterey and Vegas
console.log('Roll: [34567] (fictitious 7 for illustration)')
console.log('Note: Using [34566] for real test\n')

const realRoll = [3, 4, 5, 6, 6]
console.log(`Testing with real roll: [${realRoll.join('')}]\n`)

const numOpponents = 2  // 3 players total

const strategy = generateHammerStrategy(realRoll, numOpponents)

console.log('='.repeat(70))
console.log('COMPARISON: Hard Game vs Easy Game')
console.log('='.repeat(70))

// Find Monterey and Vegas variants
const montereyLow = strategy.allRecommendations.find(r => r.game === 'monterey' && r.variant === 'low')
const montereyHigh = strategy.allRecommendations.find(r => r.game === 'monterey' && r.variant === 'high')
const vegasHigh = strategy.allRecommendations.find(r => r.game === 'vegas' && r.variant === 'high')
const vegasLow = strategy.allRecommendations.find(r => r.game === 'vegas' && r.variant === 'low')

const comparisons = [
  { name: 'Monterey Low', rec: montereyLow },
  { name: 'Monterey High', rec: montereyHigh },
  { name: 'Vegas High', rec: vegasHigh },
  { name: 'Vegas Low', rec: vegasLow }
].filter(c => c.rec)

comparisons.forEach(({ name, rec }) => {
  console.log(`\n${name}:`)
  console.log(`  Kicker: [${rec.kicker.join('')}]`)
  console.log(`  Game Difficulty: ${rec.gameInfo.gameDifficulty} (${(rec.gameInfo.baseOdds * 100).toFixed(1)}% single roll)`)
  console.log(`  Kicker Strength: ${rec.gameInfo.kickerStrength}`)
  console.log(`  Tie/Beat Risk: ${(rec.tieProbability * 100).toFixed(2)}%`)
  console.log(`  Chance of Losing: ${(100 - rec.offensiveStrength).toFixed(1)}%`)
  console.log(`  Explanation: ${rec.explanation}`)
})

console.log('\n' + '='.repeat(70))
console.log('BREAKDOWN: Why does tie risk differ?')
console.log('='.repeat(70))

const breakdown = [
  {
    game: 'Monterey',
    baseOdds: 0.2546,
    p3rolls: 0.88,
    example: montereyHigh
  },
  {
    game: 'Vegas',
    baseOdds: 0.3241,
    p3rolls: 0.95,
    example: vegasHigh
  }
]

breakdown.forEach(({ game, baseOdds, p3rolls, example }) => {
  if (!example) return
  
  console.log(`\n${game}:`)
  console.log(`  Base odds (1 roll): ${(baseOdds * 100).toFixed(1)}%`)
  console.log(`  Success over 3 rolls: ~${(p3rolls * 100).toFixed(0)}%`)
  console.log(`  Your kicker: [${example.kicker.join('')}]`)
  console.log(`  Raw strength: ${example.rawStrength.toFixed(1)}%`)
  
  const kickerPercentile = example.rawStrength / 100
  const pKickerBeat = 1 - kickerPercentile
  
  console.log(`  P(opponent beats kicker): ${(pKickerBeat * 100).toFixed(1)}%`)
  console.log(`  P(opponent makes hand AND beats kicker): ${(p3rolls * pKickerBeat * 100).toFixed(2)}%`)
  console.log(`  → This is your tie/beat risk: ${(example.tieProbability * 100).toFixed(2)}%`)
})

console.log('\n' + '='.repeat(70))
console.log('KEY INSIGHT')
console.log('='.repeat(70))
console.log('')
console.log('The system AUTOMATICALLY balances:')
console.log('  1. How hard it is for opponents to MAKE the game')
console.log('  2. How likely they are to BEAT YOUR KICKER if they make it')
console.log('')
console.log('Your goal: MINIMIZE chance of losing (having worst hand)')
console.log('')
console.log('Examples:')
console.log('  - HARD game (Monterey 25%) + WEAK kicker → moderate risk of losing')
console.log('  - EASY game (Vegas 32%) + STRONG kicker → low risk of losing')
console.log('  - EASY game (10-2 49%) + WEAK kicker → high risk of losing')
console.log('  - HARD game (Monterey 25%) + STRONG kicker → very low risk of losing')
console.log('')
console.log('The system recommends whichever has LOWEST chance of losing.')
console.log('')

console.log('\n' + '='.repeat(70))
console.log('ACTUAL RECOMMENDATION FOR THIS ROLL')
console.log('='.repeat(70))
console.log(`\n${strategy.summary}`)
console.log(`\nBest call: ${strategy.bestCall.game}${strategy.bestCall.variant ? ` ${strategy.bestCall.variant}` : ''}`)
console.log(`Chance of losing: ${(100 - strategy.bestCall.offensiveStrength).toFixed(1)}% | Tie risk: ${(strategy.bestCall.tieProbability * 100).toFixed(2)}%`)
