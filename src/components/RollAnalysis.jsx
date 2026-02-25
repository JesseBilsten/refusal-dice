import React, { useMemo } from 'react'
import {
  generateHammerStrategy,
  gameOddsMap,
} from '../lib/game-validation'
import { GAMES_MAP, formatCallLabel, fmtPct } from '../lib/games-config'

/**
 * Shared roll analysis hook.
 * Computes all valid calls for a given dice roll, sorted strongest to weakest.
 * Uses rawStrength > 0 as the filter so games that always qualify
 * (razzle, boss, tres-away) are never excluded.
 *
 * @param {number[]} dice - Array of 5 dice values (1-6)
 * @param {number} numOpponents - Number of opponents (default 3)
 * @returns {{ recommendations: Array, strategy: object|null, isBark: boolean }}
 */
export const useRollAnalysis = (dice, numOpponents = 3) => {
  return useMemo(() => {
    if (!dice || dice.length !== 5 || dice.some(d => d < 1 || d > 6)) {
      return { recommendations: [], strategy: null, isBark: true }
    }

    const strategy = generateHammerStrategy(dice, numOpponents, gameOddsMap)
    const recs = (strategy?.allRecommendations || []).filter(
      (r) => r.rawStrength > 0
    )

    return {
      recommendations: recs,
      strategy,
      isBark: recs.length === 0,
    }
  }, [dice, numOpponents])
}

/**
 * Strength bar component — colored by strength tier.
 */
export const StrengthBar = ({ value, className = '' }) => {
  const barColor =
    value >= 70 ? 'bg-green-500' : value >= 40 ? 'bg-yellow-500' : 'bg-red-500'

  return (
    <div className={`h-1.5 bg-muted rounded-full overflow-hidden ${className}`}>
      <div
        className={`h-full rounded-full ${barColor}`}
        style={{ width: `${Math.max(value, 3)}%` }}
      />
    </div>
  )
}

/**
 * CallRow — a single recommendation row.
 * Supports two display variants:
 *   - "compact" (homepage): cascading scale + opacity, slide animation
 *   - "full" (strategy page): fixed size, all details shown
 */
export const CallRow = ({
  rec,
  rank = 0,
  total = 1,
  phase = 'in',
  variant = 'compact',
}) => {
  const g = GAMES_MAP[rec.game] || { name: rec.game, emoji: '🎲' }
  const label = formatCallLabel(rec)
  const str = rec.offensiveStrength

  if (variant === 'compact') {
    // Scale: rank 0 = full size, last rank = smallest
    const scale = Math.max(0.65, 1 - rank * (0.35 / Math.max(total - 1, 1)))
    const opacity = Math.max(0.3, 1 - rank * (0.7 / Math.max(total - 1, 1)))
    const delay = rank * 60

    return (
      <div
        className="transition-all duration-500"
        style={{
          opacity: phase === 'in' ? opacity : 0,
          transform:
            phase === 'in'
              ? `translateY(0) scale(${scale})`
              : phase === 'out'
              ? `translateY(-8px) scale(${scale})`
              : `translateY(16px) scale(${scale})`,
          transitionDelay: phase === 'in' ? `${delay}ms` : '0ms',
          transformOrigin: 'center top',
        }}
      >
        <div className="flex items-center gap-2 py-0.5">
          <span className="text-sm shrink-0 w-6 text-center">{g.emoji}</span>
          <span className="text-sm font-medium text-foreground truncate flex-1">
            {label}
          </span>
          <StrengthBar value={str} className="w-16 shrink-0" />
          <span className="text-xs font-mono text-muted-foreground w-10 text-right shrink-0">
            {fmtPct(str)}
          </span>
        </div>
      </div>
    )
  }

  // variant === 'full'
  return (
    <div className="flex items-center gap-3 py-1.5">
      <span className="text-base shrink-0 w-7 text-center">{g.emoji}</span>
      <span className="text-sm font-medium text-foreground flex-1">{label}</span>
      <StrengthBar value={str} className="w-20 shrink-0" />
      <span className="text-xs font-mono text-muted-foreground w-12 text-right shrink-0">
        {fmtPct(str)}
      </span>
    </div>
  )
}

/**
 * CallList — renders all recommendations or a "Bark" message.
 * @param {Object} props
 * @param {Array} props.recommendations - from useRollAnalysis
 * @param {boolean} props.isBark - true when no valid calls
 * @param {string} props.phase - animation phase ('idle'|'in'|'out')
 * @param {string} props.variant - 'compact' or 'full'
 */
export const CallList = ({
  recommendations,
  isBark,
  phase = 'in',
  variant = 'compact',
  className = '',
}) => {
  if (isBark) {
    return (
      <div
        className={`text-center py-4 transition-opacity duration-500 ${className}`}
        style={{ opacity: phase === 'in' ? 1 : 0 }}
      >
        <span className="text-2xl">🐕</span>
        <p className="text-sm font-semibold text-foreground mt-1">Bark!</p>
        <p className="text-xs text-muted-foreground">
          No good calls — pass the hammer.
        </p>
      </div>
    )
  }

  return (
    <div className={className}>
      {recommendations.map((rec, i) => (
        <CallRow
          key={`${rec.game}-${rec.variant}`}
          rec={rec}
          rank={i}
          total={recommendations.length}
          phase={phase}
          variant={variant}
        />
      ))}
    </div>
  )
}
