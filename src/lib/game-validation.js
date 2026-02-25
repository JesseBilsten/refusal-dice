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
      // All rolls are playable in Razzle (1s are wild and count toward any number)
      // Even a single die can technically be played, though it's very weak
      return true
      
    case 'boss':
      // Boss: All rolls are valid (poker-style hands without straights/flushes)
      return true
      
    case 'tres-away':
      // Tres Away: All rolls are valid (lowest score wins, 3s = 0)
      return true
      
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

// Boss hand ranking helper - returns hand type and numeric rank (1-7)
const getBossHandRank = (roll) => {
  const counts = roll.reduce((acc, num) => {
    acc[num] = (acc[num] || 0) + 1
    return acc
  }, {})
  
  const countValues = Object.values(counts).sort((a, b) => b - a)
  const sortedDice = [...roll].sort((a, b) => b - a)
  
  // 5-of-a-kind (rank 7)
  if (countValues[0] === 5) {
    return {
      handType: '5-of-a-kind',
      rank: 7,
      primaryValue: sortedDice[0],
      kickers: []
    }
  }
  
  // 4-of-a-kind (rank 6)
  if (countValues[0] === 4) {
    const quadValue = Object.keys(counts).find(k => counts[k] === 4)
    const kicker = sortedDice.find(d => d !== parseInt(quadValue))
    return {
      handType: '4-of-a-kind',
      rank: 6,
      primaryValue: parseInt(quadValue),
      kickers: [kicker]
    }
  }
  
  // Full House (rank 5)
  if (countValues[0] === 3 && countValues[1] === 2) {
    const tripValue = Object.keys(counts).find(k => counts[k] === 3)
    const pairValue = Object.keys(counts).find(k => counts[k] === 2)
    return {
      handType: 'full-house',
      rank: 5,
      primaryValue: parseInt(tripValue),
      secondaryValue: parseInt(pairValue),
      kickers: []
    }
  }
  
  // 3-of-a-kind (rank 4)
  if (countValues[0] === 3) {
    const tripValue = Object.keys(counts).find(k => counts[k] === 3)
    const kickers = sortedDice.filter(d => d !== parseInt(tripValue)).sort((a, b) => b - a)
    return {
      handType: '3-of-a-kind',
      rank: 4,
      primaryValue: parseInt(tripValue),
      kickers
    }
  }
  
  // Two Pair (rank 3)
  if (countValues[0] === 2 && countValues[1] === 2) {
    const pairValues = Object.keys(counts)
      .filter(k => counts[k] === 2)
      .map(k => parseInt(k))
      .sort((a, b) => b - a)
    const kicker = sortedDice.find(d => !pairValues.includes(d))
    return {
      handType: 'two-pair',
      rank: 3,
      primaryValue: pairValues[0],
      secondaryValue: pairValues[1],
      kickers: [kicker]
    }
  }
  
  // Pair (rank 2)
  if (countValues[0] === 2) {
    const pairValue = Object.keys(counts).find(k => counts[k] === 2)
    const kickers = sortedDice.filter(d => d !== parseInt(pairValue)).sort((a, b) => b - a)
    return {
      handType: 'pair',
      rank: 2,
      primaryValue: parseInt(pairValue),
      kickers
    }
  }
  
  // High Card (rank 1)
  return {
    handType: 'high-card',
    rank: 1,
    primaryValue: sortedDice[0],
    kickers: sortedDice.slice(1)
  }
}

// Tres Away score calculator (3s = 0, other dice = face value)
const calculateTresAwayScore = (roll) => {
  return roll.reduce((sum, die) => sum + (die === 3 ? 0 : die), 0)
}

// Razzle score calculator (count 1s and 6s, then count max of any other number for tie-breaking)
const getRazzleScore = (roll) => {
  const counts = {}
  roll.forEach(d => counts[d] = (counts[d] || 0) + 1)
  
  const onesCount = counts[1] || 0
  const sixesCount = counts[6] || 0
  
  // Calculate the best possible hand using 1s as wilds
  // For each non-1 number, calculate total including wilds
  let bestNumber = 6 // Default to 6s (most valuable)
  let bestCount = sixesCount + onesCount // 6s including wilds
  let naturalCount = sixesCount // Natural 6s (not including wilds)
  
  // Check all other numbers (5, 4, 3, 2)
  for (let num = 5; num >= 2; num--) {
    const naturalOfThisNum = counts[num] || 0
    const totalWithWilds = naturalOfThisNum + onesCount
    
    // Only consider this if it beats our current best
    // (We prefer 6s, but if we have more of another number, consider it)
    if (totalWithWilds > bestCount) {
      bestNumber = num
      bestCount = totalWithWilds
      naturalCount = naturalOfThisNum
    }
  }
  
  // Special case: if all 1s, count as 6s
  if (onesCount === 5) {
    bestNumber = 6
    bestCount = 5
    naturalCount = 0
  }
  
  // Count "bonus keepers" - 1s and 6s that aren't part of the main matching set
  // These add strategic value even if not part of the best hand
  let bonusKeepers = 0
  
  // If best hand is 6s, no bonus keepers (all 1s/6s used in main set)
  // Otherwise, any 6s are bonus keepers
  if (bestNumber !== 6) {
    bonusKeepers += sixesCount
  }
  
  // Also check for bonus 1s (1s not used as wilds)
  // This happens when natural count of best number is >= bestCount - onesCount
  // Example: [1,1,2,2,2] - best is three 2s, using 0 wilds, so 2 bonus 1s
  const wildsUsed = bestCount - naturalCount
  const bonusOnes = onesCount - wildsUsed
  if (bonusOnes > 0 && bestNumber !== 6) {
    // Only count bonus 1s if bestNumber isn't 6 (since 1s and 6s are both keepers)
    bonusKeepers += bonusOnes
  }
  
  return {
    bestNumber,        // The number being matched (6, 5, 4, 3, or 2)
    bestCount,         // Total dice in that set (including 1s as wilds)
    naturalCount,      // Natural dice of that number (not counting 1s)
    onesCount,         // Number of 1s (wilds) in hand
    bonusKeepers,      // Extra 1s/6s not part of main set (strategic value)
    // For display purposes
    totalScore: bestCount * 100 + bestNumber * 10 + onesCount
  }
}

// Constants for strength calculations
const DEFAULT_DAMPENING = 0.5
const STRENGTH_DATA_VERSION = 6

// Game odds map - probability of making a valid hand for each game
const gameOddsMap = {
  '10-2': 49.07,
  '10-3': 53.43,
  '10-4': 22.25,
  'ship-captain-crew': 31.64,
  'monterey': 25.46,
  'vegas': 32.41,
  'pairs': 29.01,
  'razzle': 95.06,  // RAZZLE_ODDS
  'boss': 49.92,    // BOSS_ODDS (Pair or better)
  'tres-away': 89.68 // TRES_AWAY_ODDS
}

// Find optimal high and low kicker variants for kicker-based games
const findOptimalVariants = (roll, gameType) => {
  const result = { high: null, low: null }
  
  if (gameType === '10-2') {
    // Test all combinations of 2 dice that sum to 10
    let bestHigh = null, bestLow = null
    
    for (let i = 0; i < 5; i++) {
      for (let j = i + 1; j < 5; j++) {
        if (roll[i] + roll[j] === 10) {
          const kicker = roll.filter((_, idx) => idx !== i && idx !== j).sort((a, b) => a - b)
          const kickerSum = kicker.reduce((a, b) => a + b, 0)
          
          if (!bestHigh || kickerSum > bestHigh.kickerSum) {
            bestHigh = { kicker, kickerSum, diceUsed: [i, j] }
          }
          if (!bestLow || kickerSum < bestLow.kickerSum) {
            bestLow = { kicker, kickerSum, diceUsed: [i, j] }
          }
        }
      }
    }
    
    if (bestHigh) result.high = bestHigh
    if (bestLow) result.low = bestLow
    
  } else if (gameType === '10-3') {
    // Test all combinations of 3 dice that sum to 10
    let bestHigh = null, bestLow = null
    
    for (let i = 0; i < 5; i++) {
      for (let j = i + 1; j < 5; j++) {
        for (let k = j + 1; k < 5; k++) {
          if (roll[i] + roll[j] + roll[k] === 10) {
            const kicker = roll.filter((_, idx) => idx !== i && idx !== j && idx !== k).sort((a, b) => a - b)
            const kickerSum = kicker.reduce((a, b) => a + b, 0)
            
            if (!bestHigh || kickerSum > bestHigh.kickerSum) {
              bestHigh = { kicker, kickerSum, diceUsed: [i, j, k] }
            }
            if (!bestLow || kickerSum < bestLow.kickerSum) {
              bestLow = { kicker, kickerSum, diceUsed: [i, j, k] }
            }
          }
        }
      }
    }
    
    if (bestHigh) result.high = bestHigh
    if (bestLow) result.low = bestLow
    
  } else if (gameType === '10-4') {
    // Test all combinations of 4 dice that sum to 10
    let bestHigh = null, bestLow = null
    
    for (let i = 0; i < 5; i++) {
      const remaining = roll.filter((_, idx) => idx !== i)
      if (remaining.reduce((a, b) => a + b, 0) === 10) {
        const kicker = [roll[i]]
        const kickerSum = roll[i]
        
        if (!bestHigh || kickerSum > bestHigh.kickerSum) {
          bestHigh = { kicker, kickerSum, diceUsed: [0, 1, 2, 3, 4].filter(idx => idx !== i) }
        }
        if (!bestLow || kickerSum < bestLow.kickerSum) {
          bestLow = { kicker, kickerSum, diceUsed: [0, 1, 2, 3, 4].filter(idx => idx !== i) }
        }
      }
    }
    
    if (bestHigh) result.high = bestHigh
    if (bestLow) result.low = bestLow
    
  } else if (gameType === 'ship-captain-crew' || gameType === 'monterey') {
    // For straights, kicker is always the 2 remaining dice
    // Just return high/low based on kicker sum
    const isShip = gameType === 'ship-captain-crew'
    const hasHighStraight = roll.includes(4) && roll.includes(5) && roll.includes(6)
    const hasLowStraight = roll.includes(1) && roll.includes(2) && roll.includes(3)
    const hasLowInside = roll.includes(2) && roll.includes(3) && roll.includes(4)
    const hasHighInside = roll.includes(3) && roll.includes(4) && roll.includes(5)
    
    const hasStraight = isShip ? (hasHighStraight || hasLowStraight) : (hasLowInside || hasHighInside)
    
    if (hasStraight) {
      let straightDice
      if (isShip) {
        straightDice = hasHighStraight ? [4, 5, 6] : [1, 2, 3]
      } else {
        straightDice = hasHighInside ? [3, 4, 5] : [2, 3, 4]
      }
      
      const kicker = roll.filter((die) => {
        const dieIndex = straightDice.indexOf(die)
        if (dieIndex !== -1) {
          straightDice.splice(dieIndex, 1)
          return false
        }
        return true
      }).sort((a, b) => a - b)
      
      const kickerSum = kicker.reduce((a, b) => a + b, 0)
      result.high = { kicker, kickerSum, diceUsed: [] }
      result.low = { kicker, kickerSum, diceUsed: [] }
    }
    
  } else if (gameType === 'vegas') {
    // Find all valid pair combinations and pick best high/low
    const validPairs = []
    for (let i = 0; i < 5; i++) {
      for (let j = i + 1; j < 5; j++) {
        const sum = roll[i] + roll[j]
        if (sum === 7 || sum === 11) {
          validPairs.push([i, j])
        }
      }
    }
    
    let bestHigh = null, bestLow = null
    
    for (let i = 0; i < validPairs.length; i++) {
      for (let j = i + 1; j < validPairs.length; j++) {
        const [a1, a2] = validPairs[i]
        const [b1, b2] = validPairs[j]
        if (a1 !== b1 && a1 !== b2 && a2 !== b1 && a2 !== b2) {
          const usedIndices = [a1, a2, b1, b2]
          const kickerIndex = [0, 1, 2, 3, 4].find(idx => !usedIndices.includes(idx))
          const kicker = [roll[kickerIndex]]
          const kickerSum = roll[kickerIndex]
          
          if (!bestHigh || kickerSum > bestHigh.kickerSum) {
            bestHigh = { kicker, kickerSum, diceUsed: usedIndices }
          }
          if (!bestLow || kickerSum < bestLow.kickerSum) {
            bestLow = { kicker, kickerSum, diceUsed: usedIndices }
          }
        }
      }
    }
    
    if (bestHigh) result.high = bestHigh
    if (bestLow) result.low = bestLow
    
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
    
    // Find the kicker (unused die)
    const kickerIndex = used.indexOf(false)
    if (kickerIndex !== -1) {
      const kicker = [roll[kickerIndex]]
      const kickerSum = roll[kickerIndex]
      const diceUsed = used.map((u, i) => u ? i : -1).filter(i => i !== -1)
      
      result.high = { kicker, kickerSum, diceUsed }
      result.low = { kicker, kickerSum, diceUsed }
    }
  }
  
  return result.high || result.low ? result : null
}

// Calculate raw strength (0-100) for a specific game variant
// Uses actual probability distributions for percentile-based rankings
const calculateRawStrength = (roll, gameVariant, thresholds = {}) => {
  // Percentile lookup tables based on actual dice probability distributions
  // For LOW variants: lower sum = better (lower percentile in table = rarer/stronger)
  // For HIGH variants: higher sum = better (invert the percentiles)
  
  const threeDicePercentiles = {
    3: 0.46, 4: 1.85, 5: 4.63, 6: 9.26, 7: 16.20, 8: 25.93,
    9: 37.50, 10: 50.00, 11: 62.50, 12: 74.07, 13: 83.80,
    14: 90.74, 15: 95.37, 16: 98.15, 17: 99.54, 18: 100.00
  }
  
  const twoDicePercentiles = {
    2: 2.78, 3: 8.33, 4: 16.67, 5: 27.78, 6: 41.67,
    7: 58.33, 8: 72.22, 9: 83.33, 10: 91.67, 11: 97.22, 12: 100.00
  }
  
  const oneDiePercentiles = {
    1: 16.67, 2: 33.33, 3: 50.00, 4: 66.67, 5: 83.33, 6: 100.00
  }
  
  // For kicker-based games with high/low variants
  if (gameVariant.endsWith('-high') || gameVariant.endsWith('-low')) {
    const baseGame = gameVariant.replace('-high', '').replace('-low', '')
    const isHigh = gameVariant.endsWith('-high')
    const variants = findOptimalVariants(roll, baseGame)
    
    if (!variants) return 0
    
    const variant = isHigh ? variants.high : variants.low
    if (!variant) return 0
    
    const kickerSum = variant.kickerSum
    let percentile, minPercentile
    
    // Select the appropriate percentile table based on game type
    if (baseGame === '10-2') {
      // 3-dice kicker
      percentile = threeDicePercentiles[kickerSum] || 50
      minPercentile = 0.46
    } else if (baseGame === '10-3' || baseGame === 'ship-captain-crew' || baseGame === 'monterey') {
      // 2-dice kicker
      percentile = twoDicePercentiles[kickerSum] || 50
      minPercentile = 2.78
    } else if (baseGame === '10-4' || baseGame === 'vegas' || baseGame === 'pairs') {
      // 1-die kicker
      percentile = oneDiePercentiles[kickerSum] || 50
      minPercentile = 16.67
    } else {
      return 1
    }
    
    // For LOW variants: lower percentile = stronger hand
    // For HIGH variants: higher percentile = stronger hand
    if (isHigh) {
      // High variant: percentile directly maps to strength
      // Best hand (100 percentile) = 100 strength
      // Worst hand (min percentile) = ~1 strength
      return Math.min(100, Math.max(1, percentile))
    } else {
      // Low variant: invert so lowest percentile = 100 strength
      // Formula: (100 + minPercentile) - percentile
      // Best hand (min percentile) = 100 strength
      // Worst hand (100 percentile) = minPercentile strength (~1-17)
      return Math.min(100, Math.max(1, (100 + minPercentile) - percentile))
    }
  }
  
  // Boss: All rolls are playable, rank by poker hand quality
  if (gameVariant === 'boss') {
    const handRank = getBossHandRank(roll)
    
    // Map rank 1-7 to strength scale (all hands get some value)
    // High card (1) gets 1-14, Pair (2) gets 15-28, Two Pair (3) gets 29-42, etc.
    const rankBases = {
      1: 1,   // High card
      2: 15,  // Pair
      3: 29,  // Two Pair
      4: 43,  // 3-of-a-kind
      5: 57,  // Full House
      6: 71,  // 4-of-a-kind
      7: 85   // 5-of-a-kind
    }
    
    const baseStrength = rankBases[handRank.rank] || 1
    
    // Add bonus for primary value (within same rank, higher cards better)
    const primaryBonus = (handRank.primaryValue / 6) * 10
    
    // Add small bonus for kickers
    const kickerBonus = handRank.kickers.length > 0 
      ? (handRank.kickers.reduce((a, b) => a + b, 0) / (handRank.kickers.length * 6)) * 4
      : 0
    
    return Math.min(100, Math.round(baseStrength + primaryBonus + kickerBonus))
  }
  
  // Tres Away: Tiered strength based on number of 3s and strategic flexibility
  if (gameVariant === 'tres-away') {
    const counts = {}
    roll.forEach(d => counts[d] = (counts[d] || 0) + 1)
    
    const threeCount = counts[3] || 0
    const sorted = [...roll].sort((a, b) => a - b)
    const lowestDie = sorted[0] // Must be put out first
    
    // Calculate base strength by number of 3s (strategic flexibility tiers)
    // More 3s = more control over when to stop rolling
    let baseStrength
    if (threeCount === 5) {
      // Perfect score of 0, best possible
      baseStrength = 100
    } else if (threeCount === 4) {
      // Score 0-6, high flexibility (can choose to roll or keep last die)
      baseStrength = 90
    } else if (threeCount === 3) {
      // Score 0-12, moderate flexibility
      baseStrength = 75
    } else if (threeCount === 2) {
      // Score 0-18, some flexibility
      baseStrength = 55
    } else if (threeCount === 1) {
      // Score 0-24, limited flexibility
      baseStrength = 35
    } else {
      // No 3s, least flexibility
      baseStrength = 15
    }
    
    // Adjust based on lowest die (what you MUST put out first in phase 1)
    // This is THE most critical factor - it directly determines your round 1 score
    // Must be weighted heavily enough to differentiate [1,6,6,6,6] from [2,2,2,2,4]
    let lowestDiePenalty = 0
    if (lowestDie === 1) {
      lowestDiePenalty = 2    // Best non-3 die
    } else if (lowestDie === 2) {
      lowestDiePenalty = 4    // 1 point worse than starting with 1
    } else if (lowestDie === 3) {
      lowestDiePenalty = 0    // Perfect, scores 0
    } else if (lowestDie === 4) {
      lowestDiePenalty = 8    // Starting to hurt badly
    } else if (lowestDie === 5) {
      lowestDiePenalty = 10   // Bad start
    } else if (lowestDie === 6) {
      lowestDiePenalty = 12   // Worst possible start
    }
    
    // Count "safe rounds" - how many 1s you can put out without rerolling
    // Having multiple 1s means you can safely play them across multiple rounds
    // Example: [1,1,1,1,4] can put out 1,1,1,1 for 4 rounds (score 4) before dealing with the 4
    // Example: [2,2,2,2,2] would put out one 2, then likely reroll the rest
    const onesCount = counts[1] || 0
    const safeRoundsBonus = onesCount * 2 // Each 1 gives 2 points (very valuable for multi-round control)
    
    // Count low dice (2s) that can be safely put out (less valuable than 1s)
    const twosCount = counts[2] || 0
    const lowDiceBonus = twosCount * 0.5 // 2s are okay but you might reroll instead
    
    // Calculate non-3 dice average (excluding 3s, what you might have to reroll)
    // This is secondary to the lowest die penalty
    const nonThrees = roll.filter(d => d !== 3)
    const avgNonThrees = nonThrees.length > 0 
      ? nonThrees.reduce((a, b) => a + b, 0) / nonThrees.length 
      : 0
    // Lower average is better (less to reroll/less penalty) - but weight it lower
    const avgPenalty = (avgNonThrees / 6) * 1.5
    
    return Math.max(1, Math.min(100, Math.round(
      baseStrength - lowestDiePenalty + safeRoundsBonus + lowDiceBonus - avgPenalty
    )))
  }
  
  // Razzle: All rolls are playable (even single matching die), strength based on count and value
  if (gameVariant === 'razzle') {
    const razzleScore = getRazzleScore(roll)
    
    // Five 6s = perfect, always 100 regardless of wilds
    if (razzleScore.bestNumber === 6 && razzleScore.bestCount === 5) {
      return 100
    }
    
    // For each tier: base strength by number and count
    // 5-of-a-kind: 5s=90-94, 4s=85-89, 3s=80-84, 2s=75-79
    // 4-of-a-kind: 6s=70-74, 5s=65-69, 4s=60-64, 3s=55-59, 2s=50-54
    // 3-of-a-kind: 6s=45-49, 5s=40-44, 4s=35-39, 3s=30-34, 2s=25-29
    // 2-of-a-kind: 6s=20-24, 5s=17-19, 4s=14-16, 3s=11-13, 2s=8-10
    // 1-of-a-kind: 6s=5-7, 5s=4-6, 4s=3-5, 3s=2-4, 2s=1-3
    
    let baseStrength
    if (razzleScore.bestCount === 5) {
      // 5-of-a-kind (not 6s, since that's handled above)
      const numberBases = { 5: 90, 4: 85, 3: 80, 2: 75 }
      baseStrength = numberBases[razzleScore.bestNumber] || 70
    } else if (razzleScore.bestCount === 4) {
      const numberBases = { 6: 70, 5: 65, 4: 60, 3: 55, 2: 50 }
      baseStrength = numberBases[razzleScore.bestNumber] || 45
    } else if (razzleScore.bestCount === 3) {
      const numberBases = { 6: 45, 5: 40, 4: 35, 3: 30, 2: 25 }
      baseStrength = numberBases[razzleScore.bestNumber] || 20
    } else if (razzleScore.bestCount === 2) {
      const numberBases = { 6: 20, 5: 17, 4: 14, 3: 11, 2: 8 }
      baseStrength = numberBases[razzleScore.bestNumber] || 5
    } else { // bestCount === 1
      const numberBases = { 6: 5, 5: 4, 4: 3, 3: 2, 2: 1 }
      baseStrength = numberBases[razzleScore.bestNumber] || 1
    }
    
    // Add flexibility bonus based on number of wilds (more 1s = easier to improve)
    // Max bonus is 4 points (so within each tier: most 1s = +4, no 1s = +0)
    const flexBonus = (razzleScore.onesCount / 5) * 4
    
    // Add bonus for having extra keepers (6s not part of main set)
    // This distinguishes [2,2,3,3,6] from [2,2,3,3,5]
    const keeperBonus = razzleScore.bonusKeepers * 2
    
    return Math.min(99, Math.round(baseStrength + flexBonus + keeperBonus))
  }
  
  // Pairs doesn't have detailed strength yet - return basic validation
  if (gameVariant === 'pairs') {
    return checkGame(roll, gameVariant) ? 50 : 0
  }
  
  return 0
}

// Calculate normalized strength with dampening
const calculateNormalizedStrength = (rawStrength, gameOdds, dampeningExponent = DEFAULT_DAMPENING) => {
  if (rawStrength === 0) return 0
  
  // Formula: normalizedStrength = rawStrength × (100/gameOdds)^dampeningExponent
  const multiplier = Math.pow(100 / gameOdds, dampeningExponent)
  return Math.min(100, Math.round(rawStrength * multiplier))
}

/**
 * Calculate tie/beat probability for kicker-based games
 * Accounts for multi-roll mechanics with partial keepers
 * 
 * @param {number} rawStrength - Hand strength (0-100)
 * @param {string} game - Game type
 * @param {object} handDetails - Kicker values, variant (high/low), etc.
 * @returns {number} - Probability opponent ties or beats
 */
const calculateKickerGameTieProbability = (rawStrength, game, handDetails = {}) => {
  // Base probability of making the hand in 1 roll
  const singleRollOdds = {
    '10-2': 0.4907,           // 49.07%
    '10-3': 0.5343,           // 53.43%
    '10-4': 0.2225,           // 22.25%
    'ship-captain-crew': 0.3164,  // 31.64% (has 1,2,3 or 4,5,6)
    'monterey': 0.2546,       // 25.46% (has 2,3,4 or 3,4,5 or 4,5,6)
    'vegas': 0.3241,          // 32.41% (has 7 or 11)
    'pairs': 0.2901           // 29.01% (has at least 1 pair)
  }
  
  // With partial keepers over 3 rolls, probability increases
  // Improvement factor accounts for keeper rules
  const improvementFactors = {
    '10-2': 1.4,              // Can keep any 2 dice summing to 10
    '10-3': 1.4,              // Can keep any 3 dice summing to 10
    '10-4': 1.3,              // Can keep 4 dice summing to 10
    'ship-captain-crew': 1.5, // Can keep [12xxx] or [65xxx]
    'monterey': 1.5,          // Can keep [23xxx], [34xxx], [45xxx]
    'vegas': 1.4,             // Can keep partial 7/11 combos
    'pairs': 1.6              // Can keep any solo pair
  }
  
  const p1 = singleRollOdds[game] || 0.3
  const factor = improvementFactors[game] || 1.3
  
  // Estimate 3-roll success rate
  const p3rolls = Math.min(0.95, (1 - Math.pow(1 - p1, 3)) * factor)
  
  // Kicker probability depends on strength
  // rawStrength represents how good your kicker is RELATIVE TO THE VARIANT
  // For BOTH high and low variants:
  //   - 100% rawStrength = best possible kicker → can only be TIED (not beaten)
  //   - 0% rawStrength = worst possible kicker → can be tied or beaten by everyone
  const kickerPercentile = rawStrength / 100
  
  let pKickerTiesOrBeats
  
  // For perfect or near-perfect kickers, can only be tied (not beaten)
  // Calculate probability of getting EXACT same kicker
  if (kickerPercentile >= 0.995) {
    // Number of kicker dice varies by game
    const kickerDiceCount = {
      '10-2': 3,           // 3 kicker dice
      '10-3': 2,           // 2 kicker dice
      '10-4': 1,           // 1 kicker die
      'ship-captain-crew': 2,  // 2 kicker dice
      'monterey': 2,       // 2 kicker dice
      'vegas': 1,          // 1 kicker die (4 game dice in 2 pairs)
      'pairs': 1           // 1 kicker die (4 game dice in 2 pairs)
    }
    
    const numKickerDice = kickerDiceCount[game] || 2
    
    // For a perfect kicker, opponent must get EXACT same values
    // P(exact match on N dice) = (1/6)^N
    const pExactMatch = Math.pow(1/6, numKickerDice)
    pKickerTiesOrBeats = pExactMatch
  } else {
    // Non-perfect kicker: opponent can tie OR beat
    // (1 - percentile) = probability of getting equal or better kicker
    pKickerTiesOrBeats = 1 - kickerPercentile
  }
  
  // Combined: P(get hand) × P(kicker ties/beats)
  return Math.min(0.95, p3rolls * pKickerTiesOrBeats)
}

/**
 * Calculate the probability an opponent can tie or beat your hand
 * Comprehensive calculation accounting for:
 * - Multi-roll mechanics (3 rolls for most, 2 for Boss, up to 5 for Tres Away)
 * - Partial keeper rules (what can be kept between rolls)
 * - Kicker values (for games with kickers)
 * 
 * @param {number} rawStrength - Your hand's raw strength (0-100)
 * @param {string} game - Game type
 * @param {object} handDetails - Details about your hand (kicker, variant, etc.)
 * @returns {number} - Probability (0-1) that an opponent can tie or beat
 */
const calculateOpponentTieOrBeatProbability = (rawStrength, game = null, handDetails = {}) => {
  // BOSS: 2 rolls, no wilds, exact matching required
  if (game === 'boss') {
    if (rawStrength >= 99.5) {
      return 0.004  // 0.4% - [66666] exact match
    } else if (rawStrength >= 95) {
      return 0.01   // 1%
    } else if (rawStrength >= 80) {
      return 0.03   // 3%
    } else if (rawStrength >= 50) {
      return 0.10   // 10%
    } else {
      return 0.30   // 30%
    }
  }
  
  // RAZZLE: 3 rolls, 1s and 6s are wild
  if (game === 'razzle') {
    if (rawStrength >= 99.5) {
      return 0.1317  // 13.17% - Any 5 matching
    } else if (rawStrength >= 90) {
      return 0.40    // 40% - 4+ matching
    } else if (rawStrength >= 70) {
      return 0.65    // 65% - 3+ matching
    } else {
      return 0.85    // 85%
    }
  }
  
  // TRES AWAY: Up to 5 rolls, score-based
  if (game === 'tres-away') {
    if (rawStrength >= 99.5) {
      return 0.002   // 0.2% - Perfect score
    } else if (rawStrength >= 90) {
      return 0.05    // 5%
    } else if (rawStrength >= 70) {
      return 0.20    // 20%
    } else {
      return 0.50    // 50%
    }
  }
  
  // KICKER GAMES: Multi-roll with partial keepers
  const kickerGames = ['10-2', '10-3', '10-4', 'ship-captain-crew', 'monterey', 'vegas', 'pairs']
  if (kickerGames.includes(game)) {
    return calculateKickerGameTieProbability(rawStrength, game, handDetails)
  }
  
  // Default fallback
  return 0.01
}

/**
 * Estimate tie probability for a given hand strength (LEGACY wrapper)
 * Delegates to comprehensive calculator
 * 
 * @param {number} rawStrength - Hand's raw strength (0-100)
 * @param {string} game - Game type
 * @returns {number} - Estimated tie probability (0-1)
 */
const estimateTieProbability = (rawStrength, game = null) => {
  // Delegate to comprehensive calculator with no handDetails
  return calculateOpponentTieOrBeatProbability(rawStrength, game, {})
}

/**
 * Asymmetric sigmoid for always-valid games (Razzle, Boss, Tres Away).
 *
 * Maps rawStrength → display percentage using an S-curve centred on the
 * "target average" — the hand quality an opponent is expected to achieve
 * after all their re-rolls.  The curve is calibrated so that:
 *
 *   f(minRaw)  ≈  1 %   (worst possible hand)
 *   f(midpoint) = 50 %   (target average)
 *   f(maxRaw)  ≈ 99 %   (best possible hand)
 *
 * The steepness differs above and below the midpoint (asymmetric sigmoid)
 * so the 1 % and 99 % endpoints are honoured simultaneously even when the
 * lower and upper halves of the rawStrength range differ in width.
 *
 * @param {number} rawStrength - 0-100 raw hand strength
 * @param {number} midpoint    - rawStrength value that maps to 50 %
 * @param {number} minRaw      - lowest observed rawStrength for this game
 * @param {number} maxRaw      - highest observed rawStrength for this game
 * @returns {number} 1-99 display percentage
 */
const sigmoidStrength = (rawStrength, midpoint, minRaw, maxRaw) => {
  if (rawStrength <= 0) return 0

  const ln99 = Math.log(99) // ≈ 4.595
  const k = rawStrength <= midpoint
    ? ln99 / Math.max(1, midpoint - minRaw)   // f(minRaw) ≈ 1 %
    : ln99 / Math.max(1, maxRaw - midpoint)    // f(maxRaw) ≈ 99 %

  const sigmoid = 1 / (1 + Math.exp(-k * (rawStrength - midpoint)))
  return Math.max(1, Math.min(99, sigmoid * 100))
}

/**
 * Configuration for always-valid games that use sigmoid-based strength.
 *
 * midpoint – the rawStrength that maps to 50 %.  This represents the
 *            quality an average opponent achieves after taking all their
 *            re-rolls:
 *
 *   • Razzle  (3 rolls, keeping 1s/6s): opponents average ~4 sixes → raw 70
 *   • Boss    (2 rolls, poker hands):   opponents average ~3-of-a-kind → raw 45
 *   • Tres Away (5 rolls, score-based): opponents average ~two 3s → raw 55
 */
const SIGMOID_CONFIGS = {
  'razzle':    { midpoint: 70, minRaw:  5, maxRaw: 100 },
  'boss':      { midpoint: 45, minRaw: 11, maxRaw:  95 },
  'tres-away': { midpoint: 55, minRaw:  2, maxRaw: 100 },
}

/**
 * Calculate offensive strength - probability of NOT having the worst hand when YOU call the game
 * This is used when you have the hammer and are choosing which game to call
 * 
 * For always-valid games (Razzle, Boss, Tres Away) an asymmetric sigmoid is
 * used.  The sigmoid is centred on the expected average opponent outcome
 * after their re-rolls, so 50 % means "you're about as good as a typical
 * opponent."  This replaces the old formula which subtracted a flat
 * tie-or-beat probability from the percentile — that approach produced 0 %
 * for any hand below the tie threshold (e.g. every Razzle hand < 4 sixes).
 *
 * For kicker-based games the original percentile-minus-tie formula is used,
 * with opponent-count scaling via (1 - pStrictlyBetter)^numOpponents.
 * 
 * @param {number} rawStrength - Your hand's raw strength (0-100) in this game
 * @param {number} numOpponents - Number of opponents (total players - 1)
 * @param {string} game - Game type for tie estimation (optional)
 * @returns {number} - Probability (0-100) that you won't lose
 */
const calculateOffensiveStrength = (rawStrength, numOpponents = 2, game = null) => {
  if (rawStrength === 0) return 0

  // No opponents: return raw percentile (intrinsic hand quality, no competitive scaling)
  if (numOpponents === 0) return rawStrength

  // Always-valid games: use sigmoid curve so every valid hand gets ≥ 1 %
  const cfg = game && SIGMOID_CONFIGS[game]
  if (cfg) {
    return sigmoidStrength(rawStrength, cfg.midpoint, cfg.minRaw, cfg.maxRaw)
  }
  
  // Kicker games: percentile-minus-tie formula with opponent scaling
  const tieProbability = estimateTieProbability(rawStrength, game)
  
  // Convert rawStrength (0-100) to percentile (what % of hands you beat strictly)
  // Subtract tie probability to get probability of strictly beating an opponent
  const percentile = rawStrength / 100
  const pStrictlyBetter = Math.max(0, percentile - tieProbability)
  
  // Probability that a single opponent has a strictly worse hand
  // Probability that ALL opponents have better or equal hands = (1 - pStrictlyBetter)^numOpponents
  // Probability that AT LEAST ONE opponent is strictly worse = 1 - (1 - pStrictlyBetter)^numOpponents
  const pAtLeastOneWorse = 1 - Math.pow(1 - pStrictlyBetter, numOpponents)
  
  // Preserve precision - don't round to integer
  // This ensures we never show "0.0% chance of losing" when there's actually a small tie risk
  return pAtLeastOneWorse * 100
}

/**
 * Calculate global strength — a unified cross-game metric for ranking which game
 * to call.  Unlike offensiveStrength (which uses different formulas for
 * always-valid vs kicker games), globalStrength uses a single formula for ALL
 * games so the values are directly comparable.
 *
 * Formula:
 *   pThreat  = P(one opponent ties or beats your hand)   [already includes
 *              P(makes game) for kicker games, and is raw for always-valid games]
 *   P(worst) = pThreat ^ numOpponents   [ALL opponents must beat you]
 *   globalStrength = (1 − P(worst)) × 100
 *
 * @param {number} rawStrength  - Hand's raw strength (0-100)
 * @param {number} numOpponents - Number of opponents (total players − 1)
 * @param {string} game         - Game type
 * @param {object} handDetails  - Kicker, variant, etc.
 * @returns {number} 0-100 probability you don't have the worst hand
 */
const calculateGlobalStrength = (rawStrength, numOpponents = 2, game = null, handDetails = {}) => {
  if (rawStrength === 0) return 0

  // No opponents: return raw percentile (intrinsic hand quality, no competitive scaling)
  if (numOpponents === 0) return rawStrength

  const pThreat = calculateOpponentTieOrBeatProbability(rawStrength, game, handDetails)

  // P(you have the worst hand) = P(all opponents tie or beat you)
  const pWorst = Math.pow(pThreat, numOpponents)

  return Math.max(0, Math.min(100, (1 - pWorst) * 100))
}

/**
 * Calculate defensive strength - probability of NOT having the worst hand when accepting a call
 * This is used when someone else calls and you're deciding whether to accept or refuse
 * 
 * @param {number} rawStrength - Your hand's raw strength (0-100) in the called game
 * @param {number} numOpponents - Number of opponents (total players - 1)
 * @param {string} game - Game type for tie estimation (optional)
 * @returns {number} - Probability (0-100) that you won't lose
 */
const calculateDefensiveStrength = (rawStrength, numOpponents = 2, game = null) => {
  // Defensive uses same calculation as offensive
  // The difference is contextual: defensive is "can I accept this call?"
  // vs offensive is "should I call this game?"
  // 
  // Future enhancement: could weight this differently to account for
  // the caller likely having a strong hand in the game they chose
  return calculateOffensiveStrength(rawStrength, numOpponents, game)
}

/**
 * Generate hammer strategy recommendations for a roll
 * Analyzes all playable variants and recommends best calls to minimize your chance of losing
 * (having the worst hand). Remember: the goal is NOT TO LOSE, not to "win".
 * 
 * @param {Array} roll - Array of 5 dice values
 * @param {number} numOpponents - Number of opponents (total players - 1)
 * @param {object} gameOddsMap - Game odds mapping (optional)
 * @param {object} thresholds - Strength thresholds (optional)
 * @param {number} dampeningExponent - Dampening exponent (optional)
 * @returns {object} - Strategy recommendations with detailed analysis
 */
const generateHammerStrategy = (roll, numOpponents = 2, gameOddsMap = {}, thresholds = {}, dampeningExponent = DEFAULT_DAMPENING) => {
  const analysis = analyzeRoll(roll, gameOddsMap, thresholds, dampeningExponent)
  
  // Calculate offensive strength for each playable variant
  const recommendations = analysis.variants
    .filter(v => v.rawStrength > 0)
    .map(v => {
      const handDetails = {
        variant: v.variant,
        kicker: v.kicker,
        rawStrength: v.rawStrength
      }
      
      const tieProb = calculateOpponentTieOrBeatProbability(v.rawStrength, v.game, handDetails)
      const offensive = calculateOffensiveStrength(v.rawStrength, numOpponents, v.game)
      const global = calculateGlobalStrength(v.rawStrength, numOpponents, v.game, handDetails)
      
      // Analyze the trade-off between game difficulty and kicker strength
      const gameInfo = analyzeGameDifficulty(v.game, v.rawStrength, v.kicker, v.variant)
      
      return {
        game: v.game,
        variant: v.variant,
        rawStrength: v.rawStrength,
        offensiveStrength: offensive,
        globalStrength: global,
        tieProbability: tieProb,
        kicker: v.kicker,
        details: v.details,
        gameInfo,
        // Strategic explanation
        explanation: generateCallExplanation(v, offensive, tieProb, gameInfo, numOpponents)
      }
    })
    .sort((a, b) => b.globalStrength - a.globalStrength)
  
  // Get top 3 recommendations
  const topRecommendations = recommendations.slice(0, 3)
  
  return {
    bestCall: topRecommendations[0] || null,
    secondBestCall: topRecommendations[1] || null,
    thirdBestCall: topRecommendations[2] || null,
    allRecommendations: recommendations,
    flexibility: analysis.flexibility,
    summary: generateStrategySummary(topRecommendations, numOpponents)
  }
}

/**
 * Analyze game difficulty vs kicker strength trade-off
 */
const analyzeGameDifficulty = (game, rawStrength, kicker, variant) => {
  const kickerGames = ['10-2', '10-3', '10-4', 'ship-captain-crew', 'monterey', 'vegas', 'pairs']
  
  if (!kickerGames.includes(game)) {
    return {
      hasKicker: false,
      gameDifficulty: game === 'boss' ? 'medium' : game === 'razzle' ? 'easy' : 'hard',
      kickerStrength: null
    }
  }
  
  // Base hand odds
  const singleRollOdds = {
    '10-2': 0.4907,
    '10-3': 0.5343,
    '10-4': 0.2225,
    'ship-captain-crew': 0.3164,
    'monterey': 0.2546,
    'vegas': 0.3241,
    'pairs': 0.2901
  }
  
  const baseOdds = singleRollOdds[game] || 0.3
  const gameDifficulty = baseOdds > 0.45 ? 'easy' : baseOdds > 0.30 ? 'medium' : 'hard'
  
  // Kicker strength (simplified: rawStrength reflects kicker quality)
  const kickerStrength = rawStrength >= 90 ? 'excellent' : 
                         rawStrength >= 70 ? 'strong' :
                         rawStrength >= 50 ? 'moderate' :
                         rawStrength >= 30 ? 'weak' : 'poor'
  
  return {
    hasKicker: true,
    gameDifficulty,
    kickerStrength,
    baseOdds,
    kickerValue: kicker
  }
}

/**
 * Generate explanation for a specific call recommendation
 */
const generateCallExplanation = (variant, offensive, tieProb, gameInfo, numOpponents) => {
  const gameLabel = `${variant.game}${variant.variant ? `-${variant.variant}` : ''}`
  
  // Calculate probability of losing (having worst hand)
  // Show <0.1% instead of 0.0% for very small but non-zero probabilities
  const pLose = 100 - offensive
  const losePct = (pLose < 0.1 && pLose > 0) ? '<0.1' : pLose.toFixed(1)
  
  if (!gameInfo.hasKicker) {
    // Non-kicker games (Boss, Razzle, Tres Away)
    const tiePct = (tieProb * 100).toFixed(1)
    const tieRiskLabel = tieProb < 0.02 ? 'very low' : 
                         tieProb < 0.05 ? 'low' : 
                         tieProb < 0.10 ? 'moderate' :
                         tieProb < 0.20 ? 'significant' : 'high'
    
    if (pLose <= 5) {
      return `Excellent - ${gameLabel} with only ${losePct}% chance of losing. ${tieRiskLabel.charAt(0).toUpperCase() + tieRiskLabel.slice(1)} tie risk (${tiePct}%).`
    } else if (pLose <= 20) {
      return `Strong - ${gameLabel} with ${losePct}% chance of losing. Tie risk: ${tiePct}%.`
    } else if (pLose <= 40) {
      return `Moderate - ${gameLabel} with ${losePct}% chance of losing. Consider alternatives if available.`
    } else {
      return `Risky - ${gameLabel} with ${losePct}% chance of losing. High tie/beat risk (${tiePct}%).`
    }
  }
  
  // Kicker games - explain trade-off
  const parts = []
  
  if (pLose <= 5) {
    parts.push(`Excellent`)
  } else if (pLose <= 20) {
    parts.push(`Strong`)
  } else if (pLose <= 40) {
    parts.push(`Moderate`)
  } else {
    parts.push(`Risky`)
  }
  
  // Explain the combination
  if (gameInfo.gameDifficulty === 'hard' && gameInfo.kickerStrength === 'excellent') {
    parts.push(`- hard game to make but ${gameInfo.kickerStrength} kicker protects you`)
  } else if (gameInfo.gameDifficulty === 'easy' && gameInfo.kickerStrength === 'poor') {
    parts.push(`- easy game to make but ${gameInfo.kickerStrength} kicker is vulnerable`)
  } else if (gameInfo.gameDifficulty === 'hard' && ['weak', 'poor'].includes(gameInfo.kickerStrength)) {
    parts.push(`- difficult game with ${gameInfo.kickerStrength} kicker makes this risky`)
  } else if (gameInfo.gameDifficulty === 'easy' && ['excellent', 'strong'].includes(gameInfo.kickerStrength)) {
    parts.push(`- easy game with ${gameInfo.kickerStrength} kicker makes this safe`)
  } else {
    parts.push(`- ${gameInfo.gameDifficulty} game, ${gameInfo.kickerStrength} kicker`)
  }
  
  parts.push(`(${losePct}% chance of losing, ${(tieProb * 100).toFixed(1)}% tie risk)`)
  
  return parts.join(' ')
}

/**
 * Generate overall strategy summary
 */
const generateStrategySummary = (topRecommendations, numOpponents) => {
  if (topRecommendations.length === 0) {
    return 'No playable games available.'
  }
  
  const best = topRecommendations[0]
  const second = topRecommendations[1]
  
  const playerWord = numOpponents === 1 ? 'opponent' : 'opponents'
  // Show <0.1% instead of 0.0% for very small but non-zero probabilities
  const loseBest = 100 - best.offensiveStrength
  const pLoseBest = (loseBest < 0.1 && loseBest > 0) ? '<0.1' : loseBest.toFixed(1)
  
  if (!second) {
    return `Call ${best.game}${best.variant ? ` ${best.variant}` : ''} - your only option (${pLoseBest}% chance of losing vs ${numOpponents} ${playerWord}).`
  }
  
  const strengthDiff = best.offensiveStrength - second.offensiveStrength
  const loseSecond = 100 - second.offensiveStrength
  const pLoseSecond = (loseSecond < 0.1 && loseSecond > 0) ? '<0.1' : loseSecond.toFixed(1)
  
  if (strengthDiff >= 20) {
    return `Clear choice: ${best.game}${best.variant ? ` ${best.variant}` : ''} (${pLoseBest}% lose) is significantly safer than alternatives.`
  } else if (strengthDiff >= 10) {
    return `Best call: ${best.game}${best.variant ? ` ${best.variant}` : ''} (${pLoseBest}% lose). Backup: ${second.game}${second.variant ? ` ${second.variant}` : ''} (${pLoseSecond}% lose).`
  } else {
    return `Close decision: ${best.game}${best.variant ? ` ${best.variant}` : ''} (${pLoseBest}% lose) and ${second.game}${second.variant ? ` ${second.variant}` : ''} (${pLoseSecond}% lose) are similar. Consider preference.`
  }
}

// Analyze a roll across all games and variants
const analyzeRoll = (roll, gameOddsMap = {}, thresholds = {}, dampeningExponent = DEFAULT_DAMPENING) => {
  const variants = []
  const gameTypes = [
    '10-2', '10-3', '10-4', 
    'ship-captain-crew', 'monterey', 'vegas',
    'pairs', 'razzle', 'boss', 'tres-away'
  ]
  
  gameTypes.forEach(gameType => {
    const isValid = checkGame(roll, gameType)
    
    if (!isValid) return
    
    // Check if game has high/low variants
    const hasVariants = ['10-2', '10-3', '10-4', 'ship-captain-crew', 'monterey', 'vegas', 'pairs'].includes(gameType)
    
    if (hasVariants) {
      const optimalVariants = findOptimalVariants(roll, gameType)
      
      if (optimalVariants) {
        // High variant
        if (optimalVariants.high) {
          const rawStrength = calculateRawStrength(roll, `${gameType}-high`, thresholds)
          
          variants.push({
            game: gameType,
            variant: 'high',
            rawStrength,
            kicker: optimalVariants.high.kicker,
            diceUsed: optimalVariants.high.diceUsed,
            details: `Kicker: ${optimalVariants.high.kicker.join(',')}`
          })
        }
        
        // Low variant
        if (optimalVariants.low) {
          const rawStrength = calculateRawStrength(roll, `${gameType}-low`, thresholds)
          
          variants.push({
            game: gameType,
            variant: 'low',
            rawStrength,
            kicker: optimalVariants.low.kicker,
            diceUsed: optimalVariants.low.diceUsed,
            details: `Kicker: ${optimalVariants.low.kicker.join(',')}`
          })
        }
      }
    } else {
      // Games without variants
      const rawStrength = calculateRawStrength(roll, gameType, thresholds)
      
      let details = ''
      if (gameType === 'boss') {
        const handRank = getBossHandRank(roll)
        details = `${handRank.handType} (${handRank.primaryValue}${handRank.kickers.length > 0 ? `, kickers: ${handRank.kickers.join(',')}` : ''})`
      } else if (gameType === 'tres-away') {
        const score = calculateTresAwayScore(roll)
        details = `Score: ${score}`
      } else if (gameType === 'razzle') {
        const razzleScore = getRazzleScore(roll)
        if (razzleScore.onesCount > 0 && razzleScore.bestNumber !== 6) {
          // Show the composition: e.g., "5 fives (4 wilds)"
          const wildText = razzleScore.onesCount === 1 ? '1 wild' : `${razzleScore.onesCount} wilds`
          details = `${razzleScore.bestCount} ${razzleScore.bestNumber}s (${wildText})`
        } else if (razzleScore.onesCount === 5) {
          details = `5 wilds (as 6s)`
        } else if (razzleScore.bestNumber === 6) {
          const naturalSixes = razzleScore.naturalCount
          const wilds = razzleScore.onesCount
          if (wilds > 0) {
            details = `${razzleScore.bestCount} 6s (${naturalSixes} natural, ${wilds} wild${wilds > 1 ? 's' : ''})`
          } else {
            details = `${razzleScore.bestCount} 6s`
          }
        } else {
          details = `${razzleScore.bestCount} ${razzleScore.bestNumber}s`
        }
      }
      
      variants.push({
        game: gameType,
        variant: null,
        rawStrength,
        kicker: [],
        diceUsed: [],
        details
      })
    }
  })
  
  // Sort by normalized strength (descending) - calculated on-the-fly for comparison
  variants.sort((a, b) => {
    const aNormalized = calculateNormalizedStrength(
      a.rawStrength,
      gameOddsMap[a.game] || 50,
      dampeningExponent
    )
    const bNormalized = calculateNormalizedStrength(
      b.rawStrength,
      gameOddsMap[b.game] || 50,
      dampeningExponent
    )
    return bNormalized - aNormalized
  })
  
  // Calculate flexibility (number of unique games playable)
  const uniqueGames = new Set(variants.filter(v => v.rawStrength > 0).map(v => v.game))
  const flexibility = uniqueGames.size
  
  // Get best calls (temporary tie-breaking: normalized → raw → flexibility)
  const validVariants = variants.filter(v => v.rawStrength > 0)
  const bestCall = validVariants[0] || null
  const secondBestCall = validVariants[1] || null
  
  return {
    variants,
    flexibility,
    bestCall,
    secondBestCall,
    rankedCalls: validVariants
  }
}

/**
 * Analyze what second calls are most likely after a given first call
 * 
 * @param {string} firstCall - The game called first (e.g., '10-2', 'monterey', etc.)
 * @param {string} firstCallVariant - The variant if applicable (e.g., 'high', 'low')
 * @param {Array} uniqueRollsData - Array of unique roll objects with analysis
 * @param {number} numOpponents - Number of opponents (affects offensive strength calculations)
 * @returns {Object} Distribution of likely second calls with percentages
 */
const analyzeSecondCallDistribution = (firstCall, firstCallVariant, uniqueRollsData, numOpponents = 2) => {
  if (!uniqueRollsData || !Array.isArray(uniqueRollsData)) {
    return {
      firstCall: `${firstCall}${firstCallVariant ? `-${firstCallVariant}` : ''}`,
      error: 'No unique rolls data provided',
      secondCallDistribution: []
    }
  }
  
  // Filter to rolls that can make the first call
  const rollsWithFirstCall = uniqueRollsData.filter(rollData => {
    const variants = rollData.analysis?.variants || []
    return variants.some(v => 
      v.game === firstCall && 
      (!firstCallVariant || v.variant === firstCallVariant) &&
      v.rawStrength > 0
    )
  })
  
  if (rollsWithFirstCall.length === 0) {
    return {
      firstCall: `${firstCall}${firstCallVariant ? `-${firstCallVariant}` : ''}`,
      error: 'No rolls can make this game',
      secondCallDistribution: []
    }
  }
  
  // For each roll, determine what their best SECOND call would be
  // (excluding the first call from consideration)
  const secondCallCounts = {}
  const secondCallStrengths = {}
  const secondCallExamples = {}
  let totalRolls = 0
  
  rollsWithFirstCall.forEach(rollData => {
    const variants = rollData.analysis?.variants || []
    
    // Get all viable calls EXCEPT the first call
    // IMPORTANT: Second call must be a different GAME, not just different variant
    // E.g., if first call is "Monterey Low", second cannot be "Monterey High"
    const otherCalls = variants
      .filter(v => {
        // Exclude the ENTIRE game (all variants) if it matches first call game
        if (v.game === firstCall) return false
        // Only include playable games
        return v.rawStrength > 0
      })
      .map(v => {
        // Calculate offensive strength for ranking
        const offensive = calculateOffensiveStrength(v.rawStrength, numOpponents, v.game)
        return {
          game: v.game,
          variant: v.variant,
          rawStrength: v.rawStrength,
          offensiveStrength: offensive,
          rollExample: rollData.roll
        }
      })
      .sort((a, b) => b.offensiveStrength - a.offensiveStrength) // Best second call first
    
    // Use the best alternative call as the predicted second call
    if (otherCalls.length > 0) {
      const bestSecondCall = otherCalls[0]
      const key = bestSecondCall.variant 
        ? `${bestSecondCall.game}-${bestSecondCall.variant}`
        : bestSecondCall.game
      
      secondCallCounts[key] = (secondCallCounts[key] || 0) + rollData.count
      totalRolls += rollData.count
      
      // Track average strength for this second call
      if (!secondCallStrengths[key]) {
        secondCallStrengths[key] = []
        secondCallExamples[key] = []
      }
      secondCallStrengths[key].push(bestSecondCall.offensiveStrength)
      
      // Keep up to 5 example rolls for each second call
      if (secondCallExamples[key].length < 5) {
        secondCallExamples[key].push({
          roll: rollData.roll.join(''),
          strength: bestSecondCall.offensiveStrength.toFixed(1)
        })
      }
    }
  })
  
  // Convert counts to distribution with percentages
  const distribution = Object.keys(secondCallCounts)
    .map(gameKey => {
      const count = secondCallCounts[gameKey]
      const percentage = (count / totalRolls) * 100
      const avgStrength = secondCallStrengths[gameKey].reduce((a, b) => a + b, 0) / secondCallStrengths[gameKey].length
      
      // Parse game and variant from key
      const parts = gameKey.split('-')
      let game, variant
      if (['low', 'high'].includes(parts[parts.length - 1])) {
        variant = parts.pop()
        game = parts.join('-')
      } else {
        game = gameKey
        variant = null
      }
      
      return {
        game,
        variant,
        displayName: variant ? `${game} ${variant}` : game,
        count,
        percentage: percentage.toFixed(2),
        avgOffensiveStrength: avgStrength.toFixed(1),
        examples: secondCallExamples[gameKey]
      }
    })
    .sort((a, b) => b.percentage - a.percentage) // Sort by likelihood
  
  return {
    firstCall: `${firstCall}${firstCallVariant ? `-${firstCallVariant}` : ''}`,
    totalRolls: rollsWithFirstCall.length,
    totalInstances: totalRolls,
    secondCallDistribution: distribution,
    topSecondCall: distribution[0] || null,
    insights: generateSecondCallInsights(firstCall, firstCallVariant, distribution)
  }
}

/**
 * Generate strategic insights about second call patterns
 */
const generateSecondCallInsights = (firstCall, firstCallVariant, distribution) => {
  if (distribution.length === 0) return []
  
  const insights = []
  const top = distribution[0]
  const topPct = parseFloat(top.percentage)
  
  // Dominant second call
  if (topPct > 40) {
    insights.push(`Strong preference: ${top.displayName} (${top.percentage}%) is the dominant second call`)
  } else if (topPct > 25) {
    insights.push(`Most likely: ${top.displayName} (${top.percentage}%), but alternatives are common`)
  } else {
    insights.push(`Varied strategies: No dominant second call (top is ${top.displayName} at ${top.percentage}%)`)
  }
  
  // Game difficulty shift analysis
  const gameDifficulty = {
    '10-2': 'easy',
    '10-3': 'easy',
    'ship-captain-crew': 'medium',
    'vegas': 'medium',
    'pairs': 'medium',
    '10-4': 'hard',
    'monterey': 'hard',
    'razzle': 'special',
    'boss': 'special',
    'tres-away': 'special'
  }
  
  const firstDifficulty = gameDifficulty[firstCall] || 'unknown'
  const topSecondDifficulty = gameDifficulty[top.game] || 'unknown'
  
  if (firstDifficulty === 'hard' && topSecondDifficulty === 'medium') {
    insights.push(`Difficulty shift: Hard first call → Medium second (catching refusers who couldn't make first)`)
  } else if (firstDifficulty === 'easy' && topSecondDifficulty === 'hard') {
    insights.push(`Difficulty shift: Easy first call → Hard second (eliminating weak kickers)`)
  } else if (firstDifficulty === topSecondDifficulty) {
    insights.push(`Consistent difficulty: Both calls are ${firstDifficulty} games`)
  }
  
  // Complementary games (straights)
  const straightGames = ['ship-captain-crew', 'monterey']
  if (straightGames.includes(firstCall) && straightGames.includes(top.game)) {
    insights.push(`Complementary: Both calls require straights (${firstCall} → ${top.game})`)
  }
  
  return insights
}

/**
 * Calculate partial match value for games that allow partial matches
 * Returns proximity score (0-100) indicating how close roll is to completing the game
 * 
 * @param {Array} roll - Current dice roll
 * @param {string} game - Game name
 * @param {string} variant - Game variant (high/low)
 * @returns {Object} { hasPartialMatch: boolean, proximity: number, diceNeeded: number, description: string }
 */
const calculatePartialMatch = (roll, game, variant) => {
  const sorted = [...roll].sort((a, b) => a - b)
  
  // Monterey: Need straight (1,2,3,4,5 or 2,3,4,5,6)
  if (game === 'monterey') {
    const lowStraight = [1, 2, 3, 4, 5]
    const highStraight = [2, 3, 4, 5, 6]
    const target = variant === 'low' ? lowStraight : highStraight
    
    // Count unique matching values (not total dice)
    const uniqueMatches = new Set(target.filter(val => roll.includes(val)))
    const matches = uniqueMatches.size
    const diceNeeded = 5 - matches
    
    if (matches >= 3) {
      // Check which values we have to determine flexibility
      const hasValues = Array.from(uniqueMatches).sort((a,b) => a - b)
      
      // Calculate how many "productive" next values exist
      // Edge positions (e.g., [2,3] or [4,5]) have only 1 productive next value
      // Middle positions (e.g., [3,4] or [2,4]) have 2 productive next values
      const missing = target.filter(val => !roll.includes(val))
      
      // For 3/5 match: check if the missing values allow multiple productive paths
      let productiveNextValues = 0
      if (matches === 3) {
        // Count how many single missing values would advance the straight without completing other games
        const lowStraightComplete = variant === 'low' ? 
          (roll.includes(1) && roll.includes(2) && roll.includes(3)) : 
          (roll.includes(2) && roll.includes(3) && roll.includes(4))
        const highStraightComplete = variant === 'high' ?
          (roll.includes(4) && roll.includes(5) && roll.includes(6)) :
          (roll.includes(3) && roll.includes(4) && roll.includes(5))
        
        // If we already have 3 consecutive (SCC), fewer productive options
        if (lowStraightComplete || highStraightComplete) {
          productiveNextValues = 1 // Can only extend in one direction
        } else {
          productiveNextValues = Math.min(2, missing.length) // Can extend in both directions
        }
      } else {
        productiveNextValues = 2 // 4/5 match is very close
      }
      
      // Adjust proximity based on flexibility
      const baseProximity = matches * 20 // 3=60, 4=80
      const flexibilityBonus = productiveNextValues === 2 ? 10 : 0
      const proximity = Math.min(90, baseProximity + flexibilityBonus)
      
      return {
        hasPartialMatch: true,
        proximity,
        diceNeeded,
        productiveNextValues,
        description: `Have ${matches}/5 unique dice for Monterey ${variant}. Need ${diceNeeded} more. ${productiveNextValues === 2 ? 'Can extend in both directions.' : 'Limited extension direction.'}`
      }
    }
  }
  
  // Ship-Captain-Crew: Need 6,5,4 OR 1,2,3 (either straight)
  if (game === 'ship-captain-crew') {
    // Check high straight (6,5,4)
    const highMatches = [roll.includes(6), roll.includes(5), roll.includes(4)].filter(Boolean).length
    // Check low straight (1,2,3)
    const lowMatches = [roll.includes(1), roll.includes(2), roll.includes(3)].filter(Boolean).length
    
    // Use whichever straight has more matches
    const matches = Math.max(highMatches, lowMatches)
    const diceNeeded = 3 - matches
    const whichStraight = highMatches >= lowMatches ? 'high (6-5-4)' : 'low (1-2-3)'
    
    if (matches >= 2) {
      const proximity = matches === 2 ? 60 : 90
      return {
        hasPartialMatch: true,
        proximity,
        diceNeeded,
        description: `Have ${matches}/3 required dice for SCC ${whichStraight}. Need ${diceNeeded === 1 ? 'one more' : 'two more'}.`
      }
    }
  }
  
  // Vegas: Need TWO pairs that sum to 7 or 11
  if (game === 'vegas') {
    const target = variant === 'low' ? 7 : 11
    
    // Find all pairs that sum to target
    const pairs = []
    for (let i = 0; i < roll.length; i++) {
      for (let j = i + 1; j < roll.length; j++) {
        if (roll[i] + roll[j] === target) {
          pairs.push([i, j])
        }
      }
    }
    
    // If we have exactly 1 pair, that's a partial match
    // Keep that pair, roll the other 3 dice to find another pair
    if (pairs.length === 1) {
      // Probability of making another pair summing to target in 3 dice
      // For target 7: pairs are (1,6), (2,5), (3,4) - 6 combinations out of 216 = ~2.8%
      // For target 11: pairs are (5,6) - 1 combination out of 216 = ~0.5%
      // But over multiple rolls, odds improve
      const proximity = variant === 'low' ? 35 : 25 // Lower for Vegas 11 (harder)
      
      return {
        hasPartialMatch: true,
        proximity,
        diceNeeded: 2, // Need 2 more dice forming a pair
        description: `Have 1 pair summing to ${target} for Vegas ${variant}. Need another pair summing to ${target}.`
      }
    }
  }
  
  // Pairs: Need at least 2 pairs
  if (game === 'pairs') {
    const counts = {}
    roll.forEach(d => counts[d] = (counts[d] || 0) + 1)
    const pairs = Object.values(counts).filter(c => c >= 2).length
    
    if (pairs === 1) {
      return {
        hasPartialMatch: true,
        proximity: 40,
        diceNeeded: 1,
        description: `Have 1 pair. Need 1 more matching die to make 2 pairs.`
      }
    }
  }
  
  return {
    hasPartialMatch: false,
    proximity: 0,
    diceNeeded: 5,
    description: 'No significant progress toward this game.'
  }
}

/**
 * Generate refuser strategy recommendation
 * 
 * @param {Array} roll - The current roll [d1, d2, d3, d4, d5]
 * @param {string} calledGame - The game that was called (e.g., '10-2', 'monterey')
 * @param {string} calledVariant - The variant if applicable ('high', 'low', or null)
 * @param {string} position - Refusal position: 'first' or 'second'
 * @param {number} numOpponents - Number of opponents (for strength calculations)
 * @param {Object} uniqueRollsData - Unique rolls data for second call predictions
 * @param {Object} gameOddsMap - Game odds mapping
 * @returns {Object} Strategy recommendation with accept/refuse decision
 */
const generateRefuserStrategy = (
  roll, 
  calledGame, 
  calledVariant, 
  position = 'first',
  numOpponents = 2,
  uniqueRollsData = [],
  gameOddsMap = {}
) => {
  // Analyze current roll
  const analysis = analyzeRoll(roll, gameOddsMap)
  
  // Check if roll can make the called game
  const canMakeGame = checkGame(roll, calledGame)
  
  // Check for partial match if we can't make the game
  let partialMatch = null
  if (!canMakeGame) {
    partialMatch = calculatePartialMatch(roll, calledGame, calledVariant)
    
    // If no partial match, must refuse
    if (!partialMatch.hasPartialMatch) {
      return {
        decision: 'REFUSE',
        confidence: 100,
        reason: 'Cannot make the called game',
        currentStrength: 0,
        expectedRerollValue: 50,
        secondCallPredictions: null,
        position,
        partialMatch,
        details: {
          mustRefuse: true,
          explanation: `Your roll cannot make ${calledGame}${calledVariant ? ` ${calledVariant}` : ''}. ${partialMatch.description} You must refuse and hope for a better hand or easier second call.`
        }
      }
    }
  }
  
  // Find the variant that matches the called game (if we have it)
  let calledVariantData = null
  let currentStrength = 0
  
  if (canMakeGame) {
    calledVariantData = analysis.variants.find(v => {
      if (calledVariant) {
        return v.game === calledGame && v.variant === calledVariant
      } else {
        return v.game === calledGame
      }
    })
    
    if (!calledVariantData) {
      return {
        decision: 'REFUSE',
        confidence: 100,
        reason: 'Cannot make the called variant',
        currentStrength: 0,
        expectedRerollValue: 50,
        secondCallPredictions: null,
        position,
        partialMatch: null,
        details: {
          mustRefuse: true,
          explanation: `Your roll cannot make ${calledGame} ${calledVariant || ''}. Refuse and re-roll.`
        }
      }
    }
    
    currentStrength = calledVariantData.rawStrength
  } else {
    // Use partial match proximity as pseudo-strength
    currentStrength = partialMatch.proximity
  }
  
  const flexibility = analysis.flexibility
  
  // Get second call predictions
  const secondCallAnalysis = analyzeSecondCallDistribution(
    calledGame,
    calledVariant,
    uniqueRollsData,
    numOpponents
  )
  
  const topSecondCall = secondCallAnalysis.topSecondCall
  
  // Calculate expected re-roll value
  // gameOddsMap values are percentages (e.g., 49.07), not objects
  const gameOddsPct = gameOddsMap[calledGame] || 35
  const pMakeOnReroll = gameOddsPct / 100
  const expectedRerollStrength = pMakeOnReroll * 50 // Assume median strength if made
  
  // Game difficulty classification
  const gameDifficulty = gameOddsPct > 45 ? 'easy' : 
                         gameOddsPct > 30 ? 'medium' : 'hard'
  
  // Position-specific thresholds
  const acceptThreshold = position === 'first' ? 70 : 60
  const refuseThreshold = position === 'first' ? 40 : 35
  
  // Decision logic
  let decision = 'UNCERTAIN'
  let confidence = 50
  let reason = ''
  let explanation = ''
  
  // === PARTIAL MATCH LOGIC ===
  if (partialMatch && partialMatch.hasPartialMatch) {
    // We have a partial match but not the complete game
    // Decision: Accept partial match if second call is likely harder OR if we're very close
    
    const rerollOdds = pMakeOnReroll || 0.35
    let completeGameOdds
    
    // Calculate probability more accurately based on game type
    if (calledGame === 'monterey' && partialMatch.diceNeeded === 2) {
      // Monterey odds depend on flexibility (productiveNextValues)
      if (partialMatch.productiveNextValues === 2) {
        // Can match on 2 different values (e.g., [3,4] can get 2 or 5)
        // First roll: 2/6 chance. If miss, second roll: 2/6 chance
        // Combined: 1 - (4/6)^2 = ~55% to get ONE of them, then need the other
        completeGameOdds = 0.35 // Decent odds with 2-way flexibility
      } else {
        // Can only match on 1 value (e.g., [2,3] can only productively get 4)
        // Much harder - need specific sequence
        completeGameOdds = 0.20 // Lower odds with 1-way extension
      }
    } else if (calledGame === 'vegas' && partialMatch.diceNeeded === 2) {
      // Vegas: have 1 pair, need another pair summing to target
      // Over 2-3 rolls, chance of getting matching pair
      completeGameOdds = calledVariant === 'low' ? 0.15 : 0.08 // Vegas 7 easier than Vegas 11
    } else if (calledGame === 'ship-captain-crew' && partialMatch.diceNeeded === 1) {
      // Need 1 specific die (4, 5, or 6), 1 in 6 chance per roll, ~3 rolls = ~40%
      completeGameOdds = 1 - Math.pow(5/6, 3)
    } else if (partialMatch.diceNeeded === 1) {
      // Generic: 1 specific value needed, multiple rolls
      const valueProb = 1/6
      completeGameOdds = 1 - Math.pow(1 - valueProb, 2) // 2 rerolls
    } else {
      // Generic: use rough power estimate
      completeGameOdds = Math.pow(rerollOdds, partialMatch.diceNeeded * 0.5)
    }
    
    if (topSecondCall) {
      // Compare: keeping partial match + rolling to complete it vs. refusing and rolling for second call
      const secondCallOdds = (gameOddsMap[topSecondCall.game] || 35) / 100
      
      // If second call is much harder than completing current game, consider accepting partial
      if (partialMatch.proximity >= 60 && completeGameOdds > secondCallOdds * 1.5) {
        decision = 'ACCEPT'
        confidence = 70
        reason = 'Strong partial match + hard second call'
        explanation = `${partialMatch.description} Rolling to complete ${calledGame} (~${(completeGameOdds * 100).toFixed(0)}% chance) is easier than likely second call ${topSecondCall.displayName} (~${(secondCallOdds * 100).toFixed(0)}%). Accept the partial match.`
      } else if (partialMatch.diceNeeded === 1 && completeGameOdds > 0.15) {
        decision = 'ACCEPT'
        confidence = 65
        reason = 'One die away from game'
        explanation = `${partialMatch.description} Only need 1 specific die (~${(completeGameOdds * 100).toFixed(0)}% per roll). Accept and try to complete it.`
      } else {
        decision = 'REFUSE'
        confidence = 75
        reason = 'Partial match too weak'
        explanation = `${partialMatch.description} But completing the game is difficult (~${(completeGameOdds * 100).toFixed(0)}%). Second call likely ${topSecondCall.displayName}. Better to refuse and re-roll all dice.`
      }
    } else {
      // No second call data - use generic logic
      if (partialMatch.proximity >= 70 || partialMatch.diceNeeded === 1) {
        decision = 'ACCEPT'
        confidence = 60
        reason = 'Close to completing game'
        explanation = `${partialMatch.description} Accept and try to complete it.`
      } else {
        decision = 'REFUSE'
        confidence = 70
        reason = 'Too far from completing game'
        explanation = `${partialMatch.description} Too difficult to complete. Refuse and re-roll.`
      }
    }
    
    return {
      decision,
      confidence,
      reason,
      position,
      currentStrength: partialMatch.proximity,
      flexibility,
      gameDifficulty,
      expectedRerollValue: completeGameOdds * 75, // Expected value if we complete it
      secondCallPredictions: topSecondCall ? {
        topGame: topSecondCall.displayName,
        percentage: topSecondCall.percentage,
        difficulty: (() => {
          const odds = gameOddsMap[topSecondCall.game] || 35
          return odds < 30 ? 'hard' : odds < 45 ? 'medium' : 'easy'
        })()
      } : null,
      partialMatch,
      details: {
        hasPartialMatch: true,
        completeGameOdds: (completeGameOdds * 100).toFixed(1) + '%',
        explanation
      }
    }
  }
  
  // === COMPLETE GAME LOGIC (original) ===
  // Excellent hand - almost always accept
  if (currentStrength >= 90) {
    decision = 'ACCEPT'
    confidence = 95
    reason = 'Excellent hand strength'
    explanation = `Your ${calledGame} ${calledVariant || ''} is in the top 10% (${currentStrength.toFixed(1)}%ile). This is too strong to give up. Accept and play it.`
  }
  // Strong hand
  else if (currentStrength >= acceptThreshold) {
    decision = 'ACCEPT'
    confidence = position === 'second' ? 85 : 75
    reason = 'Strong hand for called game'
    explanation = position === 'second'
      ? `You're in second refusal with a strong hand (${currentStrength.toFixed(1)}%ile). First refusal showed weakness. Accept and make them re-roll.`
      : `Strong hand (${currentStrength.toFixed(1)}%ile). Lock it in by accepting.`
  }
  // Weak hand
  else if (currentStrength < refuseThreshold) {
    decision = 'REFUSE'
    confidence = 80
    reason = 'Weak hand - better to re-roll'
    
    if (topSecondCall) {
      const secondCallEasier = topSecondCall.avgOffensiveStrength < currentStrength
      if (secondCallEasier) {
        explanation = `Weak hand (${currentStrength.toFixed(1)}%ile). Most likely second call is ${topSecondCall.displayName} which appears easier. Refuse and re-roll.`
        confidence = 85
      } else {
        explanation = `Weak hand (${currentStrength.toFixed(1)}%ile). Second call likely ${topSecondCall.displayName}. Re-roll for better position.`
      }
    } else {
      explanation = `Weak hand (${currentStrength.toFixed(1)}%ile). Re-rolling gives ~50% chance of improvement. Refuse.`
    }
  }
  // Medium hand - most complex decision
  else {
    // Consider flexibility
    const hasHighFlexibility = flexibility >= 7
    
    // Hard game with medium hand
    if (gameDifficulty === 'hard') {
      if (hasHighFlexibility) {
        decision = 'ACCEPT'
        confidence = 65
        reason = 'Medium hand on hard game + high flexibility'
        explanation = `You made a hard game (${currentStrength.toFixed(1)}%ile) with ${flexibility}/10 flexibility. Hard to re-roll into this game. Accept.`
      } else {
        decision = 'REFUSE'
        confidence = 60
        reason = 'Medium hand on hard game, low flexibility'
        explanation = `Medium strength (${currentStrength.toFixed(1)}%ile) but only ${flexibility}/10 flexibility. Refuse for better second call options.`
      }
    }
    // Easy game with medium hand
    else if (gameDifficulty === 'easy') {
      decision = 'REFUSE'
      confidence = 70
      reason = 'Medium hand on easy game - likely to be beaten'
      explanation = `Only ${currentStrength.toFixed(1)}%ile on an easy game. Many opponents will make this and likely beat you. Refuse.`
    }
    // Medium game with medium hand
    else {
      if (position === 'second') {
        decision = 'ACCEPT'
        confidence = 60
        reason = 'Second refusal advantage with medium hand'
        explanation = `First refusal showed weakness. Your ${currentStrength.toFixed(1)}%ile is reasonable for second refusal position. Accept.`
      } else {
        // Check second call predictions
        if (topSecondCall) {
          const likelyEasier = parseFloat(topSecondCall.percentage) > 30 && gameDifficulty === 'medium'
          if (likelyEasier && hasHighFlexibility) {
            decision = 'ACCEPT'
            confidence = 55
            reason = 'Flexibility protects against likely second calls'
            explanation = `${currentStrength.toFixed(1)}%ile with ${flexibility}/10 flexibility. Top second call ${topSecondCall.displayName} (${topSecondCall.percentage}%). Your flexibility helps. Marginal accept.`
          } else {
            decision = 'REFUSE'
            confidence = 55
            reason = 'Medium hand, uncertain second call'
            explanation = `${currentStrength.toFixed(1)}%ile is borderline. Second call likely ${topSecondCall.displayName}. Refuse for re-roll opportunity.`
          }
        } else {
          decision = 'UNCERTAIN'
          confidence = 50
          reason = 'Borderline decision'
          explanation = `${currentStrength.toFixed(1)}%ile is right on the edge. Consider opponent tendencies and your risk tolerance.`
        }
      }
    }
  }
  
  return {
    decision,
    confidence,
    reason,
    position,
    currentStrength,
    flexibility,
    gameDifficulty,
    expectedRerollValue: expectedRerollStrength,
    secondCallPredictions: topSecondCall ? {
      topGame: topSecondCall.displayName,
      percentage: topSecondCall.percentage,
      difficulty: (() => {
        const odds = gameOddsMap[topSecondCall.game] || 35
        return odds < 30 ? 'hard' : odds < 45 ? 'medium' : 'easy'
      })()
    } : null,
    partialMatch: null, // No partial match - we have the complete game
    details: {
      explanation,
      acceptThreshold,
      refuseThreshold,
      canMakeGame: true,
      handDetails: calledVariantData
    }
  }
}

/* ══════════════════════════════════════════════════════════════════
 * SPECIALTY GAME CLASSIFICATION
 * Single source of truth for competitive-hand thresholds.
 * Thresholds are defined in games-config.js (SPECIALTY_THRESHOLDS).
 * These functions consume those thresholds so every page shows
 * consistent numbers.
 * ══════════════════════════════════════════════════════════════════ */

/**
 * Classify a roll against all specialty filter tiers for a given game.
 * Returns an object mapping filter IDs ('competitive', 'strong') to booleans.
 *
 * Thresholds (from games-config.js SPECIALTY_THRESHOLDS):
 *   Razzle  – competitive: 3+ wild sixes (1s or 6s) OR 5-of-a-kind
 *           – strong:      4+ wild sixes OR 5-of-a-kind
 *   Boss    – competitive: Two Pair+ (rank ≥ 3)
 *           – strong:      Trips+    (rank ≥ 4)
 *   Tres    – competitive: score ≤ 10
 *           – strong:      score ≤ 7
 */
function classifySpecialtyRoll(roll, gameId, thresholds) {
  if (gameId === 'razzle') {
    const rs = getRazzleScore(roll)
    const wildSixes = roll.filter(d => d === 1 || d === 6).length
    return {
      competitive: wildSixes >= thresholds.razzle.wildSixesGood || rs.bestCount >= 5,
      strong:      wildSixes >= thresholds.razzle.wildSixesStrong || rs.bestCount >= 5,
    }
  }
  if (gameId === 'boss') {
    const hr = getBossHandRank(roll)
    return {
      competitive: hr.rank >= thresholds.boss.rankGood,
      strong:      hr.rank >= thresholds.boss.rankStrong,
    }
  }
  if (gameId === 'tres-away') {
    const score = calculateTresAwayScore(roll)
    return {
      competitive: score <= thresholds['tres-away'].scoreGood,
      strong:      score <= thresholds['tres-away'].scoreStrong,
    }
  }
  return {}
}

/**
 * Quick boolean: does this roll meet the "competitive" bar for a specialty game?
 * This is the ~20% threshold used for the main odds display.
 */
function isCompetitiveSpecialtyHand(roll, gameId, thresholds) {
  const cls = classifySpecialtyRoll(roll, gameId, thresholds)
  return cls.competitive === true
}

/* ══════════════════════════════════════════════════════════════════
 * REFUSER STRATEGY — "Hammer called X, should I accept or refuse?"
 *
 * The refuser doesn't know the Hammer's hand — only the game called.
 * Step 1: Find rolls that qualify for the called game → these are
 *         the Hammer's likely hands.
 * Step 2: See what OTHER games those hands commonly also qualify for
 *         → those are the likely second calls if the refuser refuses.
 * Step 3: Evaluate the PLAYER's hand at the called game AND at each
 *         likely second call.
 * Step 4: Compare and recommend ACCEPT or REFUSE.
 * ══════════════════════════════════════════════════════════════════ */

/**
 * Given a called game, determine the most likely second calls the
 * Hammer would make (based on what co-playable games their hand
 * also qualifies for).
 *
 * @param {string} calledGame        - game ID the Hammer called
 * @param {string|null} calledVariant - 'high', 'low', or null
 * @param {Array} uniqueRolls        - unique-rolls.json .uniqueRolls
 * @param {Object} thresholds        - SPECIALTY_THRESHOLDS from games-config
 * @returns {Array<{game, variant, name, emoji, overlapPct}>}
 */
function predictHammerSecondCalls(calledGame, calledVariant, uniqueRolls, thresholds) {
  // GAMES list (duplicated inline to keep game-validation CJS-compatible)
  const GAMES_LIST = [
    { id: '10-2', name: '10-2', emoji: '✌️', hasVariants: true },
    { id: '10-3', name: '10-3', emoji: '👌', hasVariants: true },
    { id: '10-4', name: '10-4', emoji: '🔫', hasVariants: true },
    { id: 'ship-captain-crew', name: 'SCC', emoji: '⚓️', hasVariants: true },
    { id: 'monterey', name: 'Monterey', emoji: '🔄', hasVariants: true },
    { id: 'vegas', name: "7's", emoji: '🎰', hasVariants: true },
    { id: 'pairs', name: 'Pairs', emoji: '🍐', hasVariants: true },
    { id: 'razzle', name: 'Razzle', emoji: '✨', hasVariants: false },
    { id: 'boss', name: 'Boss', emoji: '👑', hasVariants: false },
    { id: 'tres-away', name: 'Tres Away', emoji: '⛳', hasVariants: false },
  ]
  const GAMES_LOOKUP = Object.fromEntries(GAMES_LIST.map(g => [g.id, g]))
  const SPEC_IDS = ['razzle', 'boss', 'tres-away']

  if (!uniqueRolls || !Array.isArray(uniqueRolls) || !thresholds) return []

  // 1. Filter to rolls that qualify for the called game
  const qualifyingRolls = uniqueRolls.filter(r => {
    if (!checkGame(r.roll, calledGame)) return false
    if (calledVariant) {
      const ks = getKickerStrength(r.roll, calledGame)
      if (ks !== calledVariant) return false
    }
    // Specialty games: only count competitive-threshold rolls
    if (SPEC_IDS.includes(calledGame)) {
      return isCompetitiveSpecialtyHand(r.roll, calledGame, thresholds)
    }
    return true
  })

  const totalQ = qualifyingRolls.length || 1
  const counts = {}

  // 2. For each qualifying roll, find co-playable games (excluding the called game)
  qualifyingRolls.forEach(r => {
    const seen = new Set()
    ;(r.analysis?.variants || []).forEach(v => {
      // Skip the called game (and its variant family)
      if (v.game === calledGame) return
      const key = v.variant ? `${v.game}__${v.variant}` : v.game
      if (seen.has(key)) return

      // Specialty games: apply competitive threshold
      if (SPEC_IDS.includes(v.game)) {
        const cls = classifySpecialtyRoll(r.roll, v.game, thresholds)
        if (!cls.competitive) return
      }

      seen.add(key)
      if (!counts[key]) {
        const g = GAMES_LOOKUP[v.game]
        const vLabel = v.variant ? ` ${v.variant.charAt(0).toUpperCase() + v.variant.slice(1)}` : ''
        counts[key] = {
          game: v.game,
          variant: v.variant,
          name: g ? `${g.name}${vLabel}` : v.game,
          emoji: g?.emoji || '🎲',
          count: 0,
        }
      }
      counts[key].count += 1
    })
  })

  return Object.values(counts)
    .map(c => ({ ...c, overlapPct: c.count / totalQ }))
    .sort((a, b) => b.overlapPct - a.overlapPct)
}

/**
 * Evaluate a refuser's hand against the called game AND its likely
 * second calls.  Returns a structured recommendation.
 *
 * @param {number[]} roll             - the refuser's 5-die roll
 * @param {string}   calledGame       - game ID the Hammer called
 * @param {string|null} calledVariant - 'high', 'low', or null
 * @param {'first'|'second'} position - refusal position
 * @param {Array}    uniqueRolls      - unique-rolls .uniqueRolls
 * @param {Object}   thresholds       - SPECIALTY_THRESHOLDS
 */
function evaluateRefuserPosition(roll, calledGame, calledVariant, position, uniqueRolls, thresholds) {
  const SPEC_IDS = ['razzle', 'boss', 'tres-away']
  const KICKER_GAMES = ['10-2', '10-3', '10-4', 'ship-captain-crew', 'monterey', 'vegas', 'pairs']

  // ── 1. Evaluate player's hand at the called game ──
  const canMakeCalled = checkGame(roll, calledGame)
  let calledRaw = 0
  let calledDetail = ''
  if (canMakeCalled) {
    // For kicker games, if variant not specified, auto-detect player's actual variant
    let gameVariant = calledVariant ? `${calledGame}-${calledVariant}` : calledGame
    if (!calledVariant && KICKER_GAMES.includes(calledGame)) {
      const detectedVariant = getKickerStrength(roll, calledGame)
      if (detectedVariant) {
        gameVariant = `${calledGame}-${detectedVariant}`
      }
    }
    
    calledRaw = calculateRawStrength(roll, gameVariant, {})
    // For specialty games provide contextual detail
    if (calledGame === 'razzle') {
      const rs = getRazzleScore(roll)
      const wilds = roll.filter(d => d === 1).length
      const sixes = roll.filter(d => d === 6).length
      calledDetail = `${sixes} natural 6s${wilds > 0 ? ` + ${wilds} wild 1${wilds > 1 ? 's' : ''}` : ''} (${sixes + wilds} total)`
    } else if (calledGame === 'boss') {
      const hr = getBossHandRank(roll)
      calledDetail = hr.handType
    } else if (calledGame === 'tres-away') {
      const score = calculateTresAwayScore(roll)
      calledDetail = `Score ${score}`
    }
  }

  const calledGameAnalysis = {
    canMake: canMakeCalled,
    rawStrength: calledRaw,
    detail: calledDetail,
    label: canMakeCalled
      ? (calledRaw >= 60 ? 'Strong hand' : calledRaw >= 35 ? 'Decent hand' : 'Weak hand')
      : "You can't make this game",
  }

  // ── 2. Predict the Hammer's likely second calls ──
  const hammerSecondCalls = predictHammerSecondCalls(
    calledGame, calledVariant, uniqueRolls, thresholds
  )

  // ── 3. Evaluate player's hand at each likely second call ──
  const secondCallAnalysis = hammerSecondCalls.slice(0, 8).map(sc => {
    const playerCanMake = checkGame(roll, sc.game)
    let playerRaw = 0
    let playerDetail = ''

    if (playerCanMake) {
      const scVariant = sc.variant ? `${sc.game}-${sc.variant}` : sc.game
      playerRaw = calculateRawStrength(roll, scVariant, {})

      // Penalise non-competitive specialty hands
      if (SPEC_IDS.includes(sc.game) && !isCompetitiveSpecialtyHand(roll, sc.game, thresholds)) {
        playerRaw = playerRaw * 0.5
      }

      if (sc.game === 'razzle') {
        const wilds = roll.filter(d => d === 1).length
        const sixes = roll.filter(d => d === 6).length
        playerDetail = `${sixes} natural 6s${wilds > 0 ? ` + ${wilds} wild${wilds > 1 ? 's' : ''}` : ''}`
      } else if (sc.game === 'boss') {
        playerDetail = getBossHandRank(roll).handType
      } else if (sc.game === 'tres-away') {
        playerDetail = `Score ${calculateTresAwayScore(roll)}`
      } else if (sc.variant) {
        const opt = findOptimalVariants(roll, sc.game)
        const v = sc.variant === 'high' ? opt?.high : opt?.low
        if (v) playerDetail = `Kicker: ${v.kicker.join(', ')}`
      }
    }

    return {
      ...sc,
      playerCanMake,
      playerRawStrength: playerRaw,
      playerDetail,
      playerLabel: !playerCanMake
        ? "Can't make this game"
        : playerRaw >= 60 ? 'Strong hand'
        : playerRaw >= 35 ? 'Decent hand'
        : 'Weak hand',
    }
  })

  // ── 4. Compute weighted expected second-call value ──
  let weightedVal = 0
  let totalWeight = 0
  let bestAlt = null
  let bestAltScore = 0

  secondCallAnalysis.forEach(sc => {
    weightedVal += sc.playerRawStrength * sc.overlapPct
    totalWeight += sc.overlapPct
    if (sc.playerRawStrength > bestAltScore) {
      bestAltScore = sc.playerRawStrength
      bestAlt = sc
    }
  })

  const expectedSecondCallStrength = totalWeight > 0 ? weightedVal / totalWeight : 0

  // ── 5. Build decision ──
  const reasoning = []
  const factors = []
  let decision = 'ACCEPT'
  let confidence = 50

  if (!canMakeCalled) {
    // Can't make the called game at all
    if (bestAlt && bestAlt.playerCanMake && bestAltScore > 20) {
      decision = 'REFUSE'
      confidence = Math.min(90, Math.round(60 + bestAltScore * 0.3))
      reasoning.push(
        `You can't make ${_gn(calledGame)}. Refusing gives a ${(bestAlt.overlapPct * 100).toFixed(0)}% chance the second call is ${bestAlt.name}, where your hand is ${bestAlt.playerLabel.toLowerCase()}.`
      )
    } else {
      decision = 'ACCEPT'
      confidence = 30
      reasoning.push(
        `You can't make ${_gn(calledGame)}, and the likely second calls aren't much better for you. Accept and hope others are weaker.`
      )
    }
  } else if (calledRaw >= 65) {
    // Strong at the called game
    decision = 'ACCEPT'
    confidence = Math.min(95, Math.round(55 + calledRaw * 0.4))
    reasoning.push(
      `Your hand is strong at ${_gn(calledGame)} (${calledRaw.toFixed(0)}% strength${calledDetail ? ' — ' + calledDetail : ''}). Accept and play confidently.`
    )
  } else if (calledRaw >= 40) {
    // Decent — compare to expected second call
    if (expectedSecondCallStrength > calledRaw + 10) {
      decision = 'REFUSE'
      confidence = Math.min(85, Math.round(45 + (expectedSecondCallStrength - calledRaw)))
      reasoning.push(
        `Decent at ${_gn(calledGame)} (${calledRaw.toFixed(0)}%), but your expected second-call strength is better (${expectedSecondCallStrength.toFixed(0)}%).`
      )
      if (bestAlt) {
        reasoning.push(
          `Most likely upgrade: ${bestAlt.name} (${(bestAlt.overlapPct * 100).toFixed(0)}% chance) where your hand scores ${bestAltScore.toFixed(0)}%.`
        )
      }
    } else {
      decision = 'ACCEPT'
      confidence = Math.min(80, Math.round(40 + calledRaw * 0.35))
      reasoning.push(
        `Decent at ${_gn(calledGame)} (${calledRaw.toFixed(0)}%${calledDetail ? ' — ' + calledDetail : ''}). Second-call alternatives aren't significantly better.`
      )
    }
  } else {
    // Weak at the called game
    if (expectedSecondCallStrength > calledRaw) {
      decision = 'REFUSE'
      confidence = Math.min(90, Math.round(50 + (expectedSecondCallStrength - calledRaw) * 1.5))
      reasoning.push(
        `Weak hand for ${_gn(calledGame)} (${calledRaw.toFixed(0)}%${calledDetail ? ' — ' + calledDetail : ''}). Refusing gives better expected outcome (${expectedSecondCallStrength.toFixed(0)}%).`
      )
      if (bestAlt && bestAlt.playerCanMake) {
        reasoning.push(
          `Best case: ${bestAlt.name} (${(bestAlt.overlapPct * 100).toFixed(0)}% likely) where you score ${bestAltScore.toFixed(0)}%.`
        )
      }
    } else {
      decision = 'ACCEPT'
      confidence = Math.round(35 + calledRaw * 0.3)
      reasoning.push(
        `Weak at ${_gn(calledGame)} (${calledRaw.toFixed(0)}%), but second-call options are no better. Accept and hope for the best.`
      )
    }
  }

  // Position modifier
  if (position === 'second') {
    reasoning.push(
      "As 2nd Refusal, if you refuse the Hammer must pick their second call — there's no more negotiation."
    )
    if (decision === 'REFUSE') confidence = Math.min(95, confidence + 5)
  } else {
    reasoning.push(
      "As 1st Refusal, if you refuse the 2nd Refusal still gets a chance to accept or refuse."
    )
  }

  // Factors summary for the UI
  factors.push({
    label: `Your ${_gn(calledGame)} strength`,
    value: calledRaw.toFixed(0) + '%',
    positive: calledRaw >= 40,
  })
  factors.push({
    label: 'Expected 2nd-call strength',
    value: expectedSecondCallStrength.toFixed(0) + '%',
    positive: expectedSecondCallStrength > calledRaw,
  })
  if (bestAlt) {
    factors.push({
      label: `Best alt: ${bestAlt.name} (${(bestAlt.overlapPct * 100).toFixed(0)}% likely)`,
      value: bestAltScore.toFixed(0) + '%',
      positive: bestAltScore > calledRaw,
    })
  }

  return {
    decision,
    confidence,
    reasoning,
    factors,
    calledGameAnalysis,
    secondCallAnalysis,
    bestSecondCallForPlayer: bestAlt,
    expectedSecondCallStrength,
  }
}

/** Tiny helper — game display name (avoids importing GAMES_MAP) */
function _gn(id) {
  const m = {
    '10-2': '10-2', '10-3': '10-3', '10-4': '10-4',
    'ship-captain-crew': 'SCC', monterey: 'Monterey',
    vegas: "7's", pairs: 'Pairs',
    razzle: 'Razzle', boss: 'Boss', 'tres-away': 'Tres Away',
  }
  return m[id] || id
}

// Export for use in both browser and Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { 
    checkGame, 
    getKickerStrength, 
    calculateKickerStrength,
    getBossHandRank,
    calculateTresAwayScore,
    getRazzleScore,
    findOptimalVariants,
    calculateRawStrength,
    calculateNormalizedStrength,
    calculateOffensiveStrength,
    calculateGlobalStrength,
    calculateDefensiveStrength,
    estimateTieProbability,
    calculateOpponentTieOrBeatProbability,
    calculateKickerGameTieProbability,
    generateHammerStrategy,
    analyzeRoll,
    analyzeSecondCallDistribution,
    calculatePartialMatch,
    generateRefuserStrategy,
    classifySpecialtyRoll,
    isCompetitiveSpecialtyHand,
    predictHammerSecondCalls,
    evaluateRefuserPosition,
    DEFAULT_DAMPENING,
    STRENGTH_DATA_VERSION,
    gameOddsMap
  }
}

export { 
  checkGame, 
  getKickerStrength, 
  calculateKickerStrength,
  getBossHandRank,
  calculateTresAwayScore,
  getRazzleScore,
  findOptimalVariants,
  calculateRawStrength,
  calculateNormalizedStrength,
  calculateOffensiveStrength,
  calculateGlobalStrength,
  calculateDefensiveStrength,
  estimateTieProbability,
  calculateOpponentTieOrBeatProbability,
  calculateKickerGameTieProbability,
  generateHammerStrategy,
  analyzeRoll,
  analyzeSecondCallDistribution,
  calculatePartialMatch,
  generateRefuserStrategy,
  classifySpecialtyRoll,
  isCompetitiveSpecialtyHand,
  predictHammerSecondCalls,
  evaluateRefuserPosition,
  DEFAULT_DAMPENING,
  STRENGTH_DATA_VERSION,
  gameOddsMap
}
