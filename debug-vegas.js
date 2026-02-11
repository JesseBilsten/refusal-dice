const { checkGame, calculatePartialMatch } = require('./src/lib/game-validation.js')

const roll = [1, 6, 2, 3, 4]

console.log('Roll:', roll)
console.log('Checking Vegas Low (sum to 7)...')
console.log('Has Vegas Low?', checkGame(roll, 'vegas'))

// Check for pairs manually
console.log('\nManual pair check:')
for (let i = 0; i < roll.length; i++) {
  for (let j = i + 1; j < roll.length; j++) {
    const sum = roll[i] + roll[j]
    console.log(`  [${roll[i]}, ${roll[j]}] = ${sum}`, sum === 7 ? '✓' : '')
  }
}

console.log('\nPartial match result:')
const partial = calculatePartialMatch(roll, 'vegas', 'low')
console.log(partial)
