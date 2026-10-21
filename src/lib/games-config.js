/**
 * Shared games configuration — single source of truth for all game metadata.
 * Import this instead of defining GAMES/GAMES_MAP per-page.
 *
 * CommonJS so Node scripts (gatsby-node.js, src/data generators) can require
 * it too; pages and components use named imports as usual.
 */

/** `name` is the short label; `fullName` is for places with room to spare. */
const GAMES = [
  { id: '10-2', name: '10-2', emoji: '✌️', hasVariants: true },
  { id: '10-3', name: '10-3', emoji: '👌', hasVariants: true },
  { id: '10-4', name: '10-4', emoji: '🔫', hasVariants: true },
  { id: 'ship-captain-crew', name: 'SCC', fullName: 'Ship, Captain, Crew', emoji: '⚓️', hasVariants: true },
  { id: 'monterey', name: 'Monterey', emoji: '🔄', hasVariants: true },
  { id: 'vegas', name: "7's", emoji: '🎰', hasVariants: true },
  { id: 'pairs', name: 'Pairs', emoji: '🍐', hasVariants: true },
  { id: 'razzle', name: 'Razzle', emoji: '✨', hasVariants: false },
  { id: 'boss', name: 'Boss', emoji: '👑', hasVariants: false },
  { id: 'tres-away', name: 'Tres Away', emoji: '⛳', hasVariants: false },
  { id: 'barking', name: 'Barking', emoji: '🐶', hasVariants: false },
]

/** Every callable game (Barking is an action, not a game) */
const CALLABLE_GAMES = GAMES.filter(g => g.id !== 'barking')

/** Games decided by making a hand and then comparing kickers (have high/low variants) */
const KICKER_GAME_IDS = GAMES.filter(g => g.hasVariants).map(g => g.id)

/** IDs of always-playable specialty games */
const SPECIALTY_GAME_IDS = ['razzle', 'boss', 'tres-away']

/** Quick check: is this game an always-playable specialty game? */
const isSpecialtyGame = (id) => SPECIALTY_GAME_IDS.includes(id)

/* ── Competitive thresholds ──
 * Each specialty game is technically playable on every roll; these define
 * a "competitive hand" worth calling, in two tiers: Competitive (the main
 * odds displays) and Strong (premium hands).
 *
 * Razzle and Boss aren't here: their thresholds are worked out from the
 * call odds (callThresholds() in OddsLab/specialty-calls.js), which fills
 * them in. Tres Away's are by score, which the call odds don't group by:
 *   Tres    competitive: Score ≤ 10    →  18.2%  (1413 / 7776)
 *           strong:      Score ≤ 7     →   6.1%  ( 477 / 7776)
 */
const SPECIALTY_THRESHOLDS = {
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
 * 'competitive' is the default tier.
 * 'strong' is the premium tier for the best hands.
 */
const SPECIALTY_FILTERS = {
  // Razzle and Boss: callFilters() in OddsLab/specialty-calls.js
  'tres-away': [
    { id: 'competitive', label: 'Score ≤ 10' },
    { id: 'strong', label: 'Score ≤ 7' },
  ],
}

/** Lookup map by game id */
const GAMES_MAP = Object.fromEntries(
  GAMES.map(g => [g.id, g])
)

/** Get the long display name for a game id, e.g. 'Ship, Captain, Crew' */
const getGameFullName = (id) => GAMES_MAP[id]?.fullName || getGameName(id)

/** Get display name for a game id */
const getGameName = (id) => GAMES_MAP[id]?.name || id

/** Get emoji for a game id */
const getGameEmoji = (id) => GAMES_MAP[id]?.emoji || '🎲'

/** Get the detail-page path for a game id, e.g. '/games/10-2' */
const getGamePath = (id) => `/games/${id}`

/**
 * Format a recommendation into a display label.
 * e.g. "10-2 High", "Boss", "Razzle"
 */
const formatCallLabel = (rec) => {
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
const fmtPct = (v) => {
  if (v >= 100) return '100%'
  if (v >= 99.5) return '>99%'
  if (v < 1 && v > 0) return '<1%'
  return `${Math.round(v)}%`
}

module.exports = {
  GAMES,
  CALLABLE_GAMES,
  KICKER_GAME_IDS,
  SPECIALTY_GAME_IDS,
  isSpecialtyGame,
  SPECIALTY_THRESHOLDS,
  SPECIALTY_FILTERS,
  GAMES_MAP,
  getGameFullName,
  getGameName,
  getGameEmoji,
  getGamePath,
  formatCallLabel,
  fmtPct,
}
