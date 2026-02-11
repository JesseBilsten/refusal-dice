const { checkGame, calculatePartialMatch } = require('./src/lib/game-validation.js')

const roll = [6, 5, 3, 2, 1]

console.log('Roll:', roll)
console.log('Has SCC?', checkGame(roll, 'ship-captain-crew'))
console.log('Sorted:', [...roll].sort((a,b) => a - b))
console.log('Contains 6?', roll.includes(6))
console.log('Contains 5?', roll.includes(5))
console.log('Contains 4?', roll.includes(4))
console.log()

const partial = calculatePartialMatch(roll, 'ship-captain-crew', null)
console.log('Partial match:', partial)
