// Calculate the actual distribution of kicker sums for each game type
// This will be used to create percentile-based strength rankings

function getAllThreeDiceCombinations() {
  const combinations = []
  for (let i = 1; i <= 6; i++) {
    for (let j = 1; j <= 6; j++) {
      for (let k = 1; k <= 6; k++) {
        combinations.push([i, j, k])
      }
    }
  }
  return combinations
}

function getAllTwoDiceCombinations() {
  const combinations = []
  for (let i = 1; i <= 6; i++) {
    for (let j = 1; j <= 6; j++) {
      combinations.push([i, j])
    }
  }
  return combinations
}

function getAllOneDiceCombinations() {
  return [[1], [2], [3], [4], [5], [6]]
}

// Calculate distribution for 3-dice kicker (10-2, Vegas would be similar)
const threeDice = getAllThreeDiceCombinations()
const threeDiceSums = {}
threeDice.forEach(dice => {
  const sum = dice.reduce((a, b) => a + b, 0)
  threeDiceSums[sum] = (threeDiceSums[sum] || 0) + 1
})

console.log('3-Dice Kicker Distribution (10-2):')
console.log('Sum | Count | Cumulative | Percentile')
let cumulative = 0
const total3 = threeDice.length
for (let sum = 3; sum <= 18; sum++) {
  cumulative += threeDiceSums[sum] || 0
  const percentile = (cumulative / total3) * 100
  console.log(`${sum.toString().padStart(3)} | ${(threeDiceSums[sum] || 0).toString().padStart(5)} | ${cumulative.toString().padStart(10)} | ${percentile.toFixed(2)}%`)
}

// Calculate distribution for 2-dice kicker (10-3, SCC, Monterey)
const twoDice = getAllTwoDiceCombinations()
const twoDiceSums = {}
twoDice.forEach(dice => {
  const sum = dice.reduce((a, b) => a + b, 0)
  twoDiceSums[sum] = (twoDiceSums[sum] || 0) + 1
})

console.log('\n2-Dice Kicker Distribution (10-3, SCC, Monterey):')
console.log('Sum | Count | Cumulative | Percentile')
cumulative = 0
const total2 = twoDice.length
for (let sum = 2; sum <= 12; sum++) {
  cumulative += twoDiceSums[sum] || 0
  const percentile = (cumulative / total2) * 100
  console.log(`${sum.toString().padStart(3)} | ${(twoDiceSums[sum] || 0).toString().padStart(5)} | ${cumulative.toString().padStart(10)} | ${percentile.toFixed(2)}%`)
}

// Calculate distribution for 1-die kicker (10-4, Vegas, Pairs)
const oneDice = getAllOneDiceCombinations()
const oneDiceSums = {}
oneDice.forEach(dice => {
  const sum = dice.reduce((a, b) => a + b, 0)
  oneDiceSums[sum] = (oneDiceSums[sum] || 0) + 1
})

console.log('\n1-Die Kicker Distribution (10-4, Vegas, Pairs):')
console.log('Value | Count | Cumulative | Percentile')
cumulative = 0
const total1 = oneDice.length
for (let sum = 1; sum <= 6; sum++) {
  cumulative += oneDiceSums[sum] || 0
  const percentile = (cumulative / total1) * 100
  console.log(`${sum.toString().padStart(5)} | ${(oneDiceSums[sum] || 0).toString().padStart(5)} | ${cumulative.toString().padStart(10)} | ${percentile.toFixed(2)}%`)
}

// Generate lookup tables for code
console.log('\n\n// Percentile lookup for 3-dice kicker (for low variant)')
console.log('const threeDicePercentiles = {')
cumulative = 0
for (let sum = 3; sum <= 18; sum++) {
  cumulative += threeDiceSums[sum] || 0
  const percentile = ((cumulative / total3) * 100).toFixed(2)
  console.log(`  ${sum}: ${percentile},`)
}
console.log('}')

console.log('\n// Percentile lookup for 2-dice kicker (for low variant)')
console.log('const twoDicePercentiles = {')
cumulative = 0
for (let sum = 2; sum <= 12; sum++) {
  cumulative += twoDiceSums[sum] || 0
  const percentile = ((cumulative / total2) * 100).toFixed(2)
  console.log(`  ${sum}: ${percentile},`)
}
console.log('}')

console.log('\n// Percentile lookup for 1-die kicker (for low variant)')
console.log('const oneDiePercentiles = {')
cumulative = 0
for (let sum = 1; sum <= 6; sum++) {
  cumulative += oneDiceSums[sum] || 0
  const percentile = ((cumulative / total1) * 100).toFixed(2)
  console.log(`  ${sum}: ${percentile},`)
}
console.log('}')
