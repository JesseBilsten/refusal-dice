// Component helper utilities for DiceDisplay and GameDisplay

/**
 * Get rarity tier information based on strength value
 * @param {number} strength - Strength value (0-100)
 * @returns {Object} Tier object with color classes and label
 */
export const getRarityTier = (strength) => {
  if (strength >= 90) {
    return {
      tier: 'legendary',
      label: 'Legendary',
      bgClass: 'bg-legendary',
      textClass: 'text-legendary-foreground',
      borderClass: 'border-legendary-border',
      badgeVariant: 'legendary',
    }
  } else if (strength >= 75) {
    return {
      tier: 'epic',
      label: 'Epic',
      bgClass: 'bg-epic',
      textClass: 'text-epic-foreground',
      borderClass: 'border-epic-border',
      badgeVariant: 'epic',
    }
  } else if (strength >= 50) {
    return {
      tier: 'rare',
      label: 'Rare',
      bgClass: 'bg-rare',
      textClass: 'text-rare-foreground',
      borderClass: 'border-rare-border',
      badgeVariant: 'rare',
    }
  } else if (strength >= 25) {
    return {
      tier: 'uncommon',
      label: 'Uncommon',
      bgClass: 'bg-uncommon',
      textClass: 'text-uncommon-foreground',
      borderClass: 'border-uncommon-border',
      badgeVariant: 'uncommon',
    }
  } else {
    return {
      tier: 'common',
      label: 'Common',
      bgClass: 'bg-common',
      textClass: 'text-common-foreground',
      borderClass: 'border-common-border',
      badgeVariant: 'default',
    }
  }
}

/**
 * Calculate odds of improving a roll
 * @param {Array<number>} roll - Current roll (5 dice)
 * @param {string} gameId - Target game ID
 * @param {string|null} variant - Game variant ('high', 'low', or null)
 * @param {Object} analysis - Optional pre-computed analysis object
 * @returns {Object|null} Odds information or null if not applicable
 */
export const calculateOddsImprovement = (roll, gameId = null, variant = null, analysis = null) => {
  if (!roll || roll.length !== 5) return null
  
  // If we have pre-computed analysis, extract odds from it
  if (analysis) {
    // For getting the game outright (don't have it yet)
    if (gameId && !analysis.hasGame) {
      // Calculate probability of getting target game on reroll
      // This would need access to probability tables
      return {
        type: 'acquire',
        gameId,
        variant,
        probability: null, // TODO: implement probability calculation
        description: `Odds of getting ${gameId}${variant ? ` (${variant})` : ''}`
      }
    }
    
    // For improving kicker on existing game
    if (gameId && analysis.hasGame && analysis.kicker !== undefined) {
      return {
        type: 'improve-kicker',
        gameId,
        variant,
        currentKicker: analysis.kicker,
        probability: null, // TODO: implement kicker improvement odds
        description: `Odds of improving kicker (current: ${analysis.kicker})`
      }
    }
    
    // For partial match improvement
    if (analysis.partialMatch) {
      return {
        type: 'complete-partial',
        gameId: analysis.partialMatch.game,
        probability: null, // TODO: implement partial completion odds
        description: `Odds of completing ${analysis.partialMatch.game}`
      }
    }
  }
  
  return null
}

/**
 * Group locked indices into contiguous ranges for visual styling
 * @param {Array<number>} lockedIndices - Array of locked dice indices (0-4)
 * @returns {Array<Array<number>>} Array of contiguous index ranges
 */
export const groupLockedIndices = (lockedIndices = []) => {
  if (!lockedIndices || lockedIndices.length === 0) return []
  
  // Sort indices
  const sorted = [...lockedIndices].sort((a, b) => a - b)
  
  // Group into contiguous ranges
  const groups = []
  let currentGroup = [sorted[0]]
  
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] === currentGroup[currentGroup.length - 1] + 1) {
      // Contiguous, add to current group
      currentGroup.push(sorted[i])
    } else {
      // Gap found, start new group
      groups.push(currentGroup)
      currentGroup = [sorted[i]]
    }
  }
  
  // Don't forget the last group
  groups.push(currentGroup)
  
  return groups
}

/**
 * Check if a die index is locked
 * @param {number} index - Die index (0-4)
 * @param {Array<number>} lockedIndices - Array of locked indices
 * @returns {boolean}
 */
export const isDieLocked = (index, lockedIndices = []) => {
  return lockedIndices.includes(index)
}

/**
 * Get size classes for dice based on size variant
 * @param {string} size - Size variant ('xs', 'sm', 'md', 'lg')
 * @returns {Object} Size configuration
 */
export const getDiceSizeConfig = (size = 'md') => {
  const configs = {
    xs: {
      dieSize: '1rem',      // 16px
      gap: 'gap-0.5',
      className: 'text-xs',
      pipScale: 0.5,
    },
    sm: {
      dieSize: '1.5rem',    // 24px
      gap: 'gap-1',
      className: 'text-sm',
      pipScale: 0.75,
    },
    md: {
      dieSize: '2rem',      // 32px
      gap: 'gap-1.5',
      className: 'text-base',
      pipScale: 1,
    },
    lg: {
      dieSize: '3rem',      // 48px
      gap: 'gap-2',
      className: 'text-lg',
      pipScale: 1.5,
    },
  }
  
  return configs[size] || configs.md
}
