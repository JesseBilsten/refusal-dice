/**
 * Shared games configuration — single source of truth for all game metadata.
 * Import this instead of defining GAMES/GAMES_MAP per-page.
 */

export const GAMES = [
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
  { id: 'barking', name: 'Barking', emoji: '🐶', hasVariants: false },
]

/** IDs of always-playable specialty games */
export const SPECIALTY_GAME_IDS = ['razzle', 'boss', 'tres-away']

/** Quick check: is this game an always-playable specialty game? */
export const isSpecialtyGame = (id) => SPECIALTY_GAME_IDS.includes(id)

/* ── Competitive thresholds ──
 * Each specialty game is technically playable on every roll, but these
 * thresholds define a "competitive hand" where a player would feel
 * confident calling the game at the table.
 *
 * Two tiers per game:
 *   Competitive — the primary threshold shown in odds displays.
 *   Strong      — a higher bar for premium hands.
 *
 * Razzle  competitive: 3+ wild sixes →  21.0%  (1632 / 7776)
 *         strong:      4+ wild sixes →   4.5%  ( 352 / 7776)
 * Boss    competitive: Two Pair+     →  44.4%  (3456 / 7776)
 *         strong:      Trips+        →  21.3%  (1656 / 7776)
 * Tres    competitive: Score ≤ 10    →  18.2%  (1413 / 7776)
 *         strong:      Score ≤ 7     →   6.1%  ( 477 / 7776)
 */
export const SPECIALTY_THRESHOLDS = {
  razzle: {
    /** Minimum wild sixes (1s + 6s) for a competitive Razzle hand */
    wildSixesGood: 3,
    /** Strong threshold — very confident call */
    wildSixesStrong: 4,
  },
  boss: {
    /** Minimum Boss rank for a competitive hand (3 = Two Pair) */
    rankGood: 3,
    /** Strong threshold — Trips or better (rank 4) */
    rankStrong: 4,
  },
  'tres-away': {
    /** Maximum Tres Away score (sum of non-3 dice) for competitive */
    scoreGood: 10,
    /** Strong threshold — very low score */
    scoreStrong: 7,
    /** Minimum threes for a different competitive measure */
    threesGood: 3,
  },
}

/**
 * Toggle filter configs for the specialty game drill-down panels.
 * Each entry maps a game ID to an array of filter options.
 * 'competitive' is the default tier (~20% threshold).
 * 'strong' is the premium tier for the best hands.
 */
export const SPECIALTY_FILTERS = {
  razzle: [
    { id: 'competitive', label: '3+ Sixes', description: 'Competitive (~21%)' },
    { id: 'strong', label: '4+ / 5-Kind', description: 'Strong (~4.5%)' },
  ],
  boss: [
    { id: 'competitive', label: 'Two Pair+', description: 'Competitive (~44%)' },
    { id: 'strong', label: 'Trips+', description: 'Strong (~21%)' },
  ],
  'tres-away': [
    { id: 'competitive', label: 'Score ≤ 10', description: 'Competitive (~18%)' },
    { id: 'strong', label: 'Score ≤ 7', description: 'Strong (~6%)' },
  ],
}

/** Lookup map by game id */
export const GAMES_MAP = Object.fromEntries(
  GAMES.map(g => [g.id, g])
)

/** Get display name for a game id */
export const getGameName = (id) => GAMES_MAP[id]?.name || id

/** Get emoji for a game id */
export const getGameEmoji = (id) => GAMES_MAP[id]?.emoji || '🎲'

/** Get the detail-page path for a game id, e.g. '/games/10-2' */
export const getGamePath = (id) => `/games/${id}`

/**
 * Format a recommendation into a display label.
 * e.g. "10-2 High", "Boss", "Razzle"
 */
export const formatCallLabel = (rec) => {
  const g = GAMES_MAP[rec.game] || { name: rec.game }
  const variant = rec.variant
    ? ` ${rec.variant === 'high' ? 'High' : 'Low'}`
    : ''
  return `${g.name}${variant}`
}

/**
 * Format strength percentage.
 * Never rounds to 100% unless truly 100%.
 */
export const fmtPct = (v) => {
  if (v >= 100) return '100%'
  if (v >= 99.5) return '>99%'
  if (v < 1 && v > 0) return '<1%'
  return `${Math.round(v)}%`
}
