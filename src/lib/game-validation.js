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


// Exact single-roll odds (%) for each kicker game, counted with checkGame over
// all 7,776 ordered rolls so they can never drift from the rules.
const KICKER_GAME_IDS = ['10-2', '10-3', '10-4', 'ship-captain-crew', 'monterey', 'vegas', 'pairs']
const SINGLE_ROLL_ODDS = (() => {
  const counts = Object.fromEntries(KICKER_GAME_IDS.map(id => [id, 0]))
  for (let i = 0; i < 7776; i++) {
    const roll = [0, 1, 2, 3, 4].map(d => (Math.floor(i / Math.pow(6, d)) % 6) + 1)
    KICKER_GAME_IDS.forEach(id => {
      if (checkGame(roll, id)) counts[id]++
    })
  }
  return Object.fromEntries(
    KICKER_GAME_IDS.map(id => [id, Math.round((counts[id] / 7776) * 10000) / 100])
  )
})()

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

/** A specialty game's hand, in words: "Two pair (5, kickers: 2)", "Score: 7", "4 6s (2 wild)" */
const specialtyDetails = (roll, gameType) => {
  if (gameType === 'boss') {
    const handRank = getBossHandRank(roll)
    return `${handRank.handType} (${handRank.primaryValue}${handRank.kickers.length > 0 ? `, kickers: ${handRank.kickers.join(',')}` : ''})`
  }
  if (gameType === 'tres-away') return `Score: ${calculateTresAwayScore(roll)}`
  if (gameType === 'razzle') {
    const rs = getRazzleScore(roll)
    if (rs.onesCount === 5) return '5 wilds (as 6s)'
    if (rs.onesCount > 0) {
      const wilds = rs.onesCount === 1 ? '1 wild' : `${rs.onesCount} wilds`
      return rs.bestNumber === 6
        ? `${rs.bestCount} 6s (${rs.naturalCount} natural, ${wilds})`
        : `${rs.bestCount} ${rs.bestNumber}s (${wilds})`
    }
    return `${rs.bestCount} ${rs.bestNumber}s`
  }
  return ''
}

/**
 * Every game a roll plays, and how: each kicker game it makes, once per
 * variant with the kicker that variant keeps (the highest kicker for High,
 * the lowest for Low), and every specialty game. Rules only, in game order;
 * how good each call is comes from the computed call odds (strategy/), not
 * from here.
 */
const analyzeRoll = (roll) => {
  const variants = []
  const gameTypes = [
    '10-2', '10-3', '10-4',
    'ship-captain-crew', 'monterey', 'vegas',
    'pairs', 'razzle', 'boss', 'tres-away'
  ]
  gameTypes.forEach(gameType => {
    if (!checkGame(roll, gameType)) return
    if (KICKER_GAME_IDS.includes(gameType)) {
      const optimal = findOptimalVariants(roll, gameType)
      if (!optimal) return
      ;['high', 'low'].forEach(variant => {
        const v = optimal[variant]
        if (!v) return
        variants.push({
          game: gameType,
          variant,
          kicker: v.kicker,
          diceUsed: v.diceUsed,
          details: `Kicker: ${v.kicker.join(',')}`
        })
      })
    } else {
      variants.push({ game: gameType, variant: null, kicker: [], diceUsed: [], details: specialtyDetails(roll, gameType) })
    }
  })
  return { variants }
}

/* ══════════════════════════════════════════════════════════════════
 * SPECIALTY GAME CLASSIFICATION
 * Single source of truth for competitive-hand thresholds.
 * Thresholds come from callThresholds() (OddsLab/specialty-calls.js).
 * These functions consume those thresholds so every page shows
 * consistent numbers.
 * ══════════════════════════════════════════════════════════════════ */

/**
 * Classify a roll against all specialty filter tiers for a given game.
 * Returns an object mapping filter IDs ('competitive', 'strong') to booleans.
 *
 * Thresholds (callThresholds() in OddsLab/specialty-calls.js, which works
 * Razzle's and Boss's out from the call odds):
 *   Razzle  – wildSixesGood/Strong wild sixes (1s or 6s) OR 5-of-a-kind
 *   Boss    – rank ≥ rankGood/rankStrong (1 = high card)
 *   Tres    – at least threesGood/threesStrong 3s
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
    const threes = roll.filter(d => d === 3).length
    return {
      competitive: threes >= thresholds['tres-away'].threesGood,
      strong:      threes >= thresholds['tres-away'].threesStrong,
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

// Export for use in both browser and Node.js
// Export for use in both browser and Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    checkGame,
    getKickerStrength,
    getBossHandRank,
    calculateTresAwayScore,
    getRazzleScore,
    findOptimalVariants,
    analyzeRoll,
    classifySpecialtyRoll,
    isCompetitiveSpecialtyHand,
    SINGLE_ROLL_ODDS
  }
}

export {
  checkGame,
  getKickerStrength,
  getBossHandRank,
  calculateTresAwayScore,
  getRazzleScore,
  findOptimalVariants,
  analyzeRoll,
  classifySpecialtyRoll,
  isCompetitiveSpecialtyHand,
  SINGLE_ROLL_ODDS
}
