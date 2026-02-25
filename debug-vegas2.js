const { checkGame } = require('./src/lib/game-validation.js')

const roll = [1, 6, 2, 2, 5]

console.log('Roll:', roll)
console.log('Has Vegas Low?', checkGame(roll, 'vegas'))

console.log('\nPairs that sum to 7:')
const target = 7
for (let i = 0; i < roll.length; i++) {
  for (let j = i + 1; j < roll.length; j++) {
    if (roll[i] + roll[j] === target) {
      console.log(`  indices [${i},${j}]: [${roll[i]}, ${roll[j]}] = ${target}`)
    }
  }
}
