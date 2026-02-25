/**
 * Roll Strength Classification System
 * 
 * Calculates a combined strength score for a given roll + game combination,
 * considering both game difficulty and kicker strength to classify calls
 * into rarity tiers (Legendary, Epic, Rare, Uncommon, Common).
 * 
 * Design goals:
 * - 10-2 with good kicker ≈ Shotgun/Monterey with good kicker
 * - Vegas with perfect kicker caps at Epic (not Legendary)
 * - Hard games with top kickers = Legendary
 * - Easy games need exceptional kickers for high tiers
 */

// Game difficulty ratings (0-1 scale, based on single-roll probability)
// Lower probability = harder game = higher base score potential
const GAME_DIFFICULTY = {
  '10-2': 0.49,        // ~49% - easiest
  '10-3': 0.47,        // ~47% - easy
  'vegas': 0.36,       // ~36% - medium
  'pairs': 0.39,       // ~39% - medium
  'ship-captain-crew': 0.42, // ~42% - medium-easy
  '10-4': 0.28,        // ~28% - medium-hard
  'monterey': 0.25,    // ~25% - hard
  'razzle': 1.0,       // 100% - always playable, strength varies wildly
  'boss': 1.0,         // 100% - always playable, poker hands
  'tres-away': 1.0,    // 100% - always playable, golf scoring
}

// Kicker strength percentile mapping
// Maps descriptive strength to percentile rank (0-100)
const KICKER_PERCENTILES = {
  // Perfect kickers (top tier)
  'perfect': 100,
  'excellent': 95,
  
  // Strong kickers
  'strong': 85,
  'good': 75,
  
  // Average kickers  
  'average': 50,
  'fair': 40,
  
  // Weak kickers
  'weak': 25,
  'poor': 10,
  'minimal': 5,
}

/**
 * Calculate roll strength score combining game difficulty and kicker quality
 * @param {string} gameSlug - Game identifier (e.g., '10-2', 'monterey')
 * @param {string} kickerStrength - Kicker strength descriptor
 * @param {number} offensiveStrength - Optional: offensive strength percentage (0-100)
 * @returns {number} Combined strength score (0-100)
 */
export function calculateRollStrength(gameSlug, kickerStrength, offensiveStrength = null) {
  const gameDifficulty = GAME_DIFFICULTY[gameSlug] || 0.5
  const kickerPercentile = KICKER_PERCENTILES[kickerStrength] || 50
  
  // Invert difficulty (harder games = higher score potential)
  const difficultyScore = (1 - gameDifficulty) * 100
  
  // Weight formula: Harder games get more weight from game difficulty
  // Easy games need exceptional kickers to rank high
  let difficultyWeight, kickerWeight
  
  if (gameDifficulty > 0.4) {
    // Easy games (10-2, 10-3, SCC): Kicker matters more
    difficultyWeight = 0.3
    kickerWeight = 0.7
  } else if (gameDifficulty > 0.25) {
    // Medium games (Vegas, Pairs, 10-4): Balanced
    difficultyWeight = 0.5
    kickerWeight = 0.5
  } else {
    // Hard games (Monterey): Game difficulty matters more
    difficultyWeight = 0.6
    kickerWeight = 0.4
  }
  
  // Special handling for always-playable games (Razzle, Boss, Tres Away)
  if (gameDifficulty >= 1.0) {
    // Use offensive strength if available, otherwise kicker only
    if (offensiveStrength !== null) {
      return offensiveStrength
    }
    // For these games, kicker/hand strength is everything
    return kickerPercentile * 0.8 // Cap at 80 for always-playable without offensive data
  }
  
  const combinedScore = (difficultyScore * difficultyWeight) + (kickerPercentile * kickerWeight)
  
  return Math.min(100, Math.max(0, combinedScore))
}

/**
 * Classify roll strength into rarity tier
 * @param {number} strength - Roll strength score (0-100)
 * @returns {string} Rarity tier: 'legendary', 'epic', 'rare', 'uncommon', 'common'
 */
export function classifyRarity(strength) {
  if (strength >= 85) return 'legendary'  // Top 15%: Hard games + top kickers
  if (strength >= 70) return 'epic'       // 70-85%: Near-perfect calls
  if (strength >= 50) return 'rare'       // 50-70%: Above-average including minimums
  if (strength >= 30) return 'uncommon'   // 30-50%: Callable but kicker misaligned
  return 'common'                         // <30%: Everything else
}

/**
 * Get rarity classification for a specific game + kicker combination
 * @param {string} gameSlug - Game identifier
 * @param {string} kickerStrength - Kicker strength descriptor
 * @param {number} offensiveStrength - Optional: offensive strength percentage
 * @returns {object} { rarity: string, strength: number }
 */
export function getRarityForCall(gameSlug, kickerStrength, offensiveStrength = null) {
  const strength = calculateRollStrength(gameSlug, kickerStrength, offensiveStrength)
  const rarity = classifyRarity(strength)
  
  return { rarity, strength }
}

/**
 * Infer kicker strength from kicker values for common games
 * This is a heuristic based on typical kicker patterns
 * @param {string} gameSlug - Game identifier
 * @param {Array<number>} kickers - Array of kicker dice values
 * @returns {string} Kicker strength descriptor
 */
export function inferKickerStrength(gameSlug, kickers) {
  if (!kickers || kickers.length === 0) return 'average'
  
  const sum = kickers.reduce((a, b) => a + b, 0)
  const avg = sum / kickers.length
  
  // Game-specific kicker evaluation
  switch (gameSlug) {
    case '10-2':
      // 3 kicker dice: best is [1,1,1]=3, worst is [6,6,6]=18
      if (kickers.length === 3) {
        if (sum <= 4) return 'perfect'      // [1,1,1] or [1,1,2]
        if (sum <= 6) return 'excellent'    // [1,1,3], [1,2,2]
        if (sum <= 8) return 'strong'       // [1,1,5], [1,2,3]
        if (sum <= 10) return 'good'        // [1,3,3], [2,2,3]
        if (sum <= 12) return 'average'
        if (sum <= 14) return 'fair'
        return 'weak'
      }
      break
      
    case 'monterey':
    case 'ship-captain-crew':
      // 2 kicker dice
      if (kickers.length === 2) {
        if (sum <= 3) return 'perfect'      // [1,1], [1,2]
        if (sum <= 4) return 'excellent'    // [1,3], [2,2]
        if (sum <= 6) return 'strong'       // [1,5], [2,4]
        if (sum <= 8) return 'good'
        if (sum <= 10) return 'average'
        return 'fair'
      }
      break
      
    case '10-4':
      // 1 kicker die: best is 1, worst is 6
      if (kickers.length === 1) {
        if (kickers[0] === 1) return 'perfect'
        if (kickers[0] === 2) return 'excellent'
        if (kickers[0] === 3) return 'strong'
        if (kickers[0] === 4) return 'good'
        if (kickers[0] === 5) return 'fair'
        return 'weak'
      }
      break
      
    case 'vegas':
    case 'pairs':
      // 1 kicker die typically
      if (kickers.length === 1) {
        if (kickers[0] <= 2) return 'excellent'
        if (kickers[0] <= 3) return 'strong'
        if (kickers[0] <= 4) return 'good'
        return 'average'
      }
      break
  }
  
  // Fallback: use average value
  if (avg <= 2) return 'excellent'
  if (avg <= 3) return 'strong'
  if (avg <= 4) return 'good'
  return 'average'
}

/**
 * Get Tailwind CSS classes for rarity badge
 * @param {string} rarity - Rarity tier
 * @returns {string} Tailwind class names
 */
export function getRarityClasses(rarity) {
  const baseClasses = 'border-2'
  
  switch (rarity) {
    case 'legendary':
      return `${baseClasses} bg-legendary text-legendary-foreground border-legendary-border`
    case 'epic':
      return `${baseClasses} bg-epic text-epic-foreground border-epic-border`
    case 'rare':
      return `${baseClasses} bg-rare text-rare-foreground border-rare-border`
    case 'uncommon':
      return `${baseClasses} bg-uncommon text-uncommon-foreground border-uncommon-border`
    case 'common':
      return `${baseClasses} bg-common text-common-foreground border-common-border`
    default:
      return `${baseClasses} bg-muted text-muted-foreground border-border`
  }
}

/**
 * Get display label for rarity
 * @param {string} rarity - Rarity tier
 * @returns {string} Display label
 */
export function getRarityLabel(rarity) {
  return rarity.charAt(0).toUpperCase() + rarity.slice(1)
}
