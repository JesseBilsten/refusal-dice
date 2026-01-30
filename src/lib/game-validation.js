// Game validation functions
// Extracted for use in both browser and Node.js build scripts

const checkGame = (roll, gameType) => {
  const counts = roll.reduce((acc, num) => {
    acc[num] = (acc[num] || 0) + 1
    return acc
  }, {})
  
  switch (gameType) {
    case '10-2':
      // 2 dice add up to 10 (remaining 3 dice determine high/low strength, but any is valid)
      for (let i = 0; i < 5; i++) {
        for (let j = i + 1; j < 5; j++) {
          if (roll[i] + roll[j] === 10) {
            return true
          }
        }
      }
      return false
      
    case '10-3':
      // 3 dice add up to 10 (remaining 2 dice determine high/low strength, but any is valid)
      for (let i = 0; i < 5; i++) {
        for (let j = i + 1; j < 5; j++) {
          for (let k = j + 1; k < 5; k++) {
            if (roll[i] + roll[j] + roll[k] === 10) {
              return true
            }
          }
        }
      }
      return false
      
    case '10-4':
      // 4 dice add up to 10 (remaining 1 die determines high/low strength, but any is valid)
      for (let i = 0; i < 5; i++) {
        const remaining = roll.filter((_, idx) => idx !== i)
        if (remaining.reduce((a, b) => a + b, 0) === 10) {
          return true
        }
      }
      return false
      
    case 'ship-captain-crew':
      // Outside straight: must contain 4-5-6 or 1-2-3
      const hasHighStraight = roll.includes(4) && roll.includes(5) && roll.includes(6)
      const hasLowStraight = roll.includes(1) && roll.includes(2) && roll.includes(3)
      return hasHighStraight || hasLowStraight
      
    case 'monterey':
      // Inside straight: must contain 2-3-4 or 3-4-5
      const hasLowInside = roll.includes(2) && roll.includes(3) && roll.includes(4)
      const hasHighInside = roll.includes(3) && roll.includes(4) && roll.includes(5)
      return hasLowInside || hasHighInside
      
    case 'vegas':
      // Two pairs of dice that sum to 7 or 11
      // Find all possible pairs that sum to 7 or 11
      const validPairs = []
      for (let i = 0; i < 5; i++) {
        for (let j = i + 1; j < 5; j++) {
          const sum = roll[i] + roll[j]
          if (sum === 7 || sum === 11) {
            validPairs.push([i, j])
          }
        }
      }
      
      // Check if we can find 2 non-overlapping pairs
      if (validPairs.length < 2) return false
      
      for (let i = 0; i < validPairs.length; i++) {
        for (let j = i + 1; j < validPairs.length; j++) {
          const [a1, a2] = validPairs[i]
          const [b1, b2] = validPairs[j]
          // Check if pairs don't share any dice
          if (a1 !== b1 && a1 !== b2 && a2 !== b1 && a2 !== b2) {
            return true
          }
        }
      }
      return false
      
    case 'pairs':
      // Two pairs (4 of a kind counts as 2 pairs of the same number)
      const totalPairs = Object.values(counts).reduce((total, count) => {
        return total + Math.floor(count / 2)
      }, 0)
      return totalPairs >= 2
      
    case 'razzle':
      // Most of one number (aces/1s are wild and count as any number)
      const aceCount = counts[1] || 0
      let maxCount = 0
      for (let num = 2; num <= 6; num++) {
        const total = (counts[num] || 0) + aceCount
        maxCount = Math.max(maxCount, total)
      }
      // Also check if all are aces
      if (aceCount >= 3) maxCount = Math.max(maxCount, aceCount)
      return maxCount >= 3
      
    default:
      return false
  }
}

// Helper function to calculate kicker strength based on remaining dice
const calculateKickerStrength = (kickerDice) => {
  if (kickerDice.length === 1) {
    // Single die: 4-6 is high, 1-3 is low
    return kickerDice[0] >= 4 ? 'high' : 'low'
  } else if (kickerDice.length === 2) {
    // Two dice: range 2-12, closer to 12 is high, closer to 2 is low
    const sum = kickerDice.reduce((a, b) => a + b, 0)
    const distToHigh = Math.abs(12 - sum)
    const distToLow = Math.abs(2 - sum)
    return distToHigh < distToLow ? 'high' : 'low'
  } else if (kickerDice.length === 3) {
    // Three dice: range 3-18, closer to 18 is high, closer to 3 is low
    const sum = kickerDice.reduce((a, b) => a + b, 0)
    const distToHigh = Math.abs(18 - sum)
    const distToLow = Math.abs(3 - sum)
    return distToHigh < distToLow ? 'high' : 'low'
  }
  return ''
}

// Helper function to get kicker dice for each game
const getKickerStrength = (roll, gameType) => {
  if (gameType === '10-2') {
    // Find 2 dice that sum to 10, remaining 3 are kicker
    for (let i = 0; i < 5; i++) {
      for (let j = i + 1; j < 5; j++) {
        if (roll[i] + roll[j] === 10) {
          const kicker = roll.filter((_, idx) => idx !== i && idx !== j)
          return calculateKickerStrength(kicker)
        }
      }
    }
  } else if (gameType === '10-3') {
    // Find 3 dice that sum to 10, remaining 2 are kicker
    for (let i = 0; i < 5; i++) {
      for (let j = i + 1; j < 5; j++) {
        for (let k = j + 1; k < 5; k++) {
          if (roll[i] + roll[j] + roll[k] === 10) {
            const kicker = roll.filter((_, idx) => idx !== i && idx !== j && idx !== k)
            return calculateKickerStrength(kicker)
          }
        }
      }
    }
  } else if (gameType === '10-4') {
    // Find 4 dice that sum to 10, remaining 1 is kicker
    for (let i = 0; i < 5; i++) {
      const remaining = roll.filter((_, idx) => idx !== i)
      if (remaining.reduce((a, b) => a + b, 0) === 10) {
        return calculateKickerStrength([roll[i]])
      }
    }
  } else if (gameType === 'ship-captain-crew') {
    // Find the straight (456 or 123), remaining 2 are kicker
    const hasHighStraight = roll.includes(4) && roll.includes(5) && roll.includes(6)
    const hasLowStraight = roll.includes(1) && roll.includes(2) && roll.includes(3)
    
    let straightDice = hasHighStraight ? [4, 5, 6] : hasLowStraight ? [1, 2, 3] : []
    const kicker = roll.filter((die) => {
      const dieIndex = straightDice.indexOf(die)
      if (dieIndex !== -1) {
        straightDice.splice(dieIndex, 1)
        return false
      }
      return true
    })
    return calculateKickerStrength(kicker)
  } else if (gameType === 'monterey') {
    // Find the straight (234 or 345), remaining 2 are kicker
    const hasLowInside = roll.includes(2) && roll.includes(3) && roll.includes(4)
    const hasHighInside = roll.includes(3) && roll.includes(4) && roll.includes(5)
    
    let straightDice = hasHighInside ? [3, 4, 5] : hasLowInside ? [2, 3, 4] : []
    const kicker = roll.filter((die) => {
      const dieIndex = straightDice.indexOf(die)
      if (dieIndex !== -1) {
        straightDice.splice(dieIndex, 1)
        return false
      }
      return true
    })
    return calculateKickerStrength(kicker)
  } else if (gameType === 'vegas') {
    // Find all possible pairs that sum to 7 or 11
    const validPairs = []
    for (let i = 0; i < 5; i++) {
      for (let j = i + 1; j < 5; j++) {
        const sum = roll[i] + roll[j]
        if (sum === 7 || sum === 11) {
          validPairs.push([i, j])
        }
      }
    }
    
    // Find 2 non-overlapping pairs and get the kicker
    for (let i = 0; i < validPairs.length; i++) {
      for (let j = i + 1; j < validPairs.length; j++) {
        const [a1, a2] = validPairs[i]
        const [b1, b2] = validPairs[j]
        // Check if pairs don't share any dice
        if (a1 !== b1 && a1 !== b2 && a2 !== b1 && a2 !== b2) {
          // Found valid pairs, find kicker
          const usedIndices = [a1, a2, b1, b2]
          const kickerIndex = [0, 1, 2, 3, 4].find(idx => !usedIndices.includes(idx))
          return calculateKickerStrength([roll[kickerIndex]])
        }
      }
    }
    return ''
  } else if (gameType === 'pairs') {
    // Find two pairs (4 of a kind counts as 2 pairs), remaining 1 is kicker
    const counts = roll.reduce((acc, num) => {
      acc[num] = (acc[num] || 0) + 1
      return acc
    }, {})
    
    // Mark dice that form pairs
    const used = new Array(5).fill(false)
    let pairsMarked = 0
    
    Object.entries(counts).forEach(([value, count]) => {
      const pairsFromThis = Math.floor(count / 2)
      const diceToMark = pairsFromThis * 2 // Each pair needs 2 dice
      
      let marked = 0
      for (let i = 0; i < 5 && marked < diceToMark && pairsMarked < 2; i++) {
        if (roll[i] === parseInt(value) && !used[i]) {
          used[i] = true
          marked++
          if (marked % 2 === 0) pairsMarked++ // Count complete pairs
        }
      }
    })
    
    const kicker = roll.filter((_, idx) => !used[idx])
    return calculateKickerStrength(kicker)
  }
  return ''
}

// Export for use in both browser and Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { checkGame, getKickerStrength, calculateKickerStrength }
}

export { checkGame, getKickerStrength, calculateKickerStrength }
