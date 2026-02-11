// Calculate tie probabilities for perfect kickers

const tieProb102 = Math.pow(1/6, 3) // 0.00463 (0.463%)
const tieProbSCC = Math.pow(1/6, 2) // 0.0278 (2.78%)

console.log('Tie probabilities for perfect kickers:')
console.log('  10-2 [666]:', (tieProb102 * 100).toFixed(3) + '%')
console.log('  SCC [66]:', (tieProbSCC * 100).toFixed(3) + '%')
console.log()

console.log('Chance AT LEAST ONE opponent ties you (causing roll-off or pass):')
console.log('(This is the actual "tie risk" that could cause you to lose)\n')

const opponents = [2, 4, 7]
opponents.forEach(N => {
  const atLeastOne102 = 1 - Math.pow(1 - tieProb102, N)
  const atLeastOneSCC = 1 - Math.pow(1 - tieProbSCC, N)
  console.log(`  ${N} opponents:`)
  console.log(`    10-2 [666]: ${(atLeastOne102 * 100).toFixed(3)}%`)
  console.log(`    SCC [66]:   ${(atLeastOneSCC * 100).toFixed(3)}%`)
})

console.log()
console.log('NOTE: Even with perfect kickers, there is ALWAYS a chance of ties.')
console.log('Ties lead to either:')
console.log('  - Call passing to tied player (2 players)')
console.log('  - Roll-off among all tied players (3+ players)')
