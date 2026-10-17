import React, { useEffect, useRef } from 'react'
import { getGameName } from '../../lib/games-config'
import Die from './Die'
import DiceGroup from './DiceGroup'
import { handGroups } from './hand-groups'

/**
 * A roll shown for a game: the dice that make it outlined in blue and
 * labeled with the game, then the kicker (dashed, with its total). A roll
 * that misses the game, or a specialty game, shows as one row.
 *
 * - `size`: a Die size ('xs' | 'sm' | 'md' | 'lg'); xs and sm are compact
 *   (outlines, no labels) for tables
 * - `rollIds`: per-die roll counters, by position, to animate re-rolls. A
 *   die that moves between groups without a new roll (put out, say)
 *   slides there instead of rolling again
 * - `kept` / `onToggleKeep(i)`: tap a die to keep it (modeled games)
 * - `locked`: positions that can't be tapped (dice put out, or a Boss's hand)
 * - `dimension`: '3d' or 'flat', overriding the player's 3D setting
 * - `putOut`: Tres Away, the positions put out so far (default: the best
 *   first put-out from this roll, labeled "put out first")
 *
 * Boss outlines the dice that make the poker hand (the high die for a high
 * die), Razzle the chosen number plus wild 1s, Tres Away the dice put out.
 */
export default function Hand({
  dice,
  game,
  variant,
  size = 'md',
  rollIds,
  kept,
  onToggleKeep,
  labels,
  putOut,
  dimension,
  locked,
  className,
}) {
  // Small sizes are compact (outlines, no labels) unless `labels` says otherwise
  const compact = !(labels ?? !(size === 'xs' || size === 'sm'))
  const groups = handGroups(dice, game, variant, { putOut })
  // The roll each position last showed, so a die that only changed groups doesn't roll again
  const shown = useRef({})
  useEffect(() => {
    shown.current = Object.fromEntries(dice.map((_, i) => [i, rollIds?.[i] || 0]))
  })
  const name = game ? getGameName(game) : null
  const variantName = variant
    ? `${variant[0].toUpperCase()}${variant.slice(1)} `
    : ''
  return (
    <span
      className={`inline-flex items-start ${compact ? 'flex-nowrap' : 'flex-wrap'} ${compact ? 'gap-1' : 'gap-2'} ${className || ''}`}
      role="group"
      aria-label={`${dice.filter(Boolean).join(', ')}${name ? ` for ${name}` : ''}`}
    >
      {groups.map((g) => (
        <DiceGroup
          key={g.tone}
          tone={g.tone}
          compact={compact}
          label={
            g.label === 'game'
              ? g.detail
                ? `${name} · ${g.detail}`
                : name
              : g.label === 'kicker'
                ? `${variantName}kicker ${g.kickerTotal}`
                : g.label === 'miss'
                  ? `No ${name}`
                  : null
          }
        >
          {g.indices.map((i) => (
            <Die
              key={i}
              value={dice[i]}
              size={size}
              rollId={rollIds?.[i] || 0}
              settled={shown.current[i] === (rollIds?.[i] || 0)}
              dimension={dimension}
              kept={kept ? kept.includes(i) : undefined}
              locked={locked?.includes(i)}
              onClick={
                onToggleKeep && dice[i] ? () => onToggleKeep(i) : undefined
              }
              label={
                onToggleKeep
                  ? locked?.includes(i)
                    ? `Die showing ${dice[i]} (locked)`
                    : `${kept?.includes(i) ? 'Kept' : 'Keep'} die showing ${dice[i]}`
                  : undefined
              }
            />
          ))}
        </DiceGroup>
      ))}
    </span>
  )
}
