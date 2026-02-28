import React from 'react'
import Die from '../Die'
import AnimatedDie from '../Die/AnimatedDie'
import { isDieLocked, groupLockedIndices, getRarityTier } from '../../lib/component-helpers'

/**
 * DiceDisplay - Unified component for displaying dice rolls
 * 
 * @param {Array<number>} roll - Array of 5 dice values (1-6)
 * @param {string} size - Size variant: 'xs' | 'sm' | 'md' | 'lg'
 * @param {string} variant - Display variant: 'show' | 'hide' | 'select' | 'selected'
 * @param {Array<number>} lockedIndices - Array of indices (0-4) for locked dice (deprecated, use groups)
 * @param {Array<Object>} groups - Array of group objects: { indices: number[], label: string, strength: number }
 * @param {boolean} showOdds - Whether to show odds information below dice
 * @param {Object} oddsData - Odds information object
 * @param {boolean} animated - Whether to use AnimatedDie for animation
 * @param {boolean} isRolling - Whether dice are currently rolling (animated mode)
 * @param {Function} onRollComplete - Callback when roll animation completes
 * @param {string} className - Additional CSS classes
 */
const DiceDisplay = ({
  roll = [1, 2, 3, 4, 5],
  size = 'md',
  variant = 'show',
  lockedIndices = [],
  groups = null,
  showOdds = false,
  oddsData = null,
  animated = false,
  isRolling = false,
  onRollComplete = null,
  className = '',
}) => {
  // Validate roll
  if (!roll || roll.length !== 5) {
    return <div className="text-destructive text-sm">Invalid roll (must be 5 dice)</div>
  }

  // Handle variant visibility
  if (variant === 'hide') {
    return null
  }

  // Rarity color configuration with dark backgrounds and vibrant borders/text
  const getRarityStyles = (strength) => {
    const tier = getRarityTier(strength)
    
    const styles = {
      legendary: {
        bg: 'bg-legendary',
        border: 'border-legendary-border',
        text: 'text-legendary-border',
        glow: 'shadow-lg shadow-legendary-border/50',
        labelText: 'text-legendary-border',
      },
      epic: {
        bg: 'bg-epic',
        border: 'border-epic-border',
        text: 'text-epic-border',
        glow: 'shadow-lg shadow-epic-border/50',
        labelText: 'text-epic-border',
      },
      rare: {
        bg: 'bg-rare',
        border: 'border-rare-border',
        text: 'text-rare-border',
        glow: 'shadow-lg shadow-rare-border/50',
        labelText: 'text-rare-border',
      },
      uncommon: {
        bg: 'bg-uncommon',
        border: 'border-uncommon-border',
        text: 'text-uncommon-border',
        glow: 'shadow-lg shadow-uncommon-border/50',
        labelText: 'text-uncommon-border',
      },
      common: {
        bg: 'bg-common',
        border: 'border-common-border',
        text: 'text-common-border',
        glow: 'shadow-lg shadow-common-border/50',
        labelText: 'text-common-border',
      },
    }
    
    return styles[tier.tier] || styles.common
  }

  // Gap class based on size
  const gapClasses = {
    xs: 'gap-0.5',
    sm: 'gap-1',
    md: 'gap-1.5',
    lg: 'gap-2',
  }

  // Padding for group containers
  const groupPadding = {
    xs: 'p-0.5',
    sm: 'p-1',
    md: 'p-1.5',
    lg: 'p-2',
  }

  // Label font size
  const labelSize = {
    xs: 'text-[0.5rem]',
    sm: 'text-[0.6rem]',
    md: 'text-xs',
    lg: 'text-sm',
  }

  // Render a single die
  const renderDie = (value, index, additionalClasses = '') => {
    const DieComponent = animated ? AnimatedDie : Die
    
    return animated ? (
      <AnimatedDie
        key={index}
        value={value}
        isRolling={isRolling}
        onRollComplete={index === 4 ? onRollComplete : null}
        size={size}
        className={additionalClasses}
      />
    ) : (
      <Die
        key={index}
        number={value}
        size={size}
        className={additionalClasses}
      />
    )
  }

  // Render a group of dice with label and rarity styling
  const renderGroup = (group, groupIndex) => {
    const { indices, label, strength = 50 } = group
    const rarityStyles = getRarityStyles(strength)
    
    return (
      <div key={`group-${groupIndex}`} className="inline-flex flex-col items-start relative">
        {/* Dice container */}
        <div className={`
          flex
          relative
          z-0
          ${rarityStyles.bg}
          ${rarityStyles.border}
          ${rarityStyles.glow}
          border-2
          rounded-t-lg rounded-br-lg
          ${groupPadding[size]}
          shadow-[inset_0_1px_1px_rgba(0,0,0,0.2),inset_1px_0_1px_rgba(0,0,0,0.2)]
        `}>
          {indices.map((dieIndex) => renderDie(roll[dieIndex], dieIndex))}
        </div>
        
        {/* Label */}
        {label && (
          <div className={`
            relative
            z-10
            -mt-0.5
            ${rarityStyles.bg}
            ${rarityStyles.border}
            ${rarityStyles.labelText}
            ${labelSize[size]}
            px-3 pt-0.5 pb-1
            border-2 border-t-0
            rounded-b-lg rounded-br-lg
            font-semibold
            whitespace-nowrap
            shadow-[inset_1px_0_1px_rgba(0,0,0,0.2)]
          `}>
            {label}
          </div>
        )}
      </div>
    )
  }

  // Build grouped display
  if (groups && groups.length > 0) {
    // New groups-based rendering
    const allGroupedIndices = new Set()
    groups.forEach(g => g.indices.forEach(i => allGroupedIndices.add(i)))
    
    const ungroupedIndices = []
    for (let i = 0; i < 5; i++) {
      if (!allGroupedIndices.has(i)) {
        ungroupedIndices.push(i)
      }
    }

    return (
      <div className={`dice-display ${variant === 'selected' ? 'selected' : ''} ${className}`}>
        <div className={`inline-flex items-end ${gapClasses[size]}`} role="group" aria-label="Dice roll">
          {/* Render groups in order they appear in the roll */}
          {groups.map((group, idx) => renderGroup(group, idx))}
          
          {/* Render ungrouped dice */}
          {ungroupedIndices.map((dieIndex) => (
            renderDie(roll[dieIndex], dieIndex, 'opacity-50')
          ))}
        </div>

        {/* Odds information (optional) */}
        {showOdds && oddsData && (
          <div className={`text-muted-foreground mt-2 ${size === 'xs' ? 'text-xs' : size === 'sm' ? 'text-xs' : 'text-sm'}`}>
            {oddsData.description && (
              <div>{oddsData.description}</div>
            )}
            {oddsData.probability !== null && oddsData.probability !== undefined && (
              <div className="font-medium">
                {(oddsData.probability * 100).toFixed(1)}% chance
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  // Legacy rendering with lockedIndices (backward compatibility)
  const lockedGroups = groupLockedIndices(lockedIndices)
  const hasLockedDice = lockedIndices.length > 0

  const renderLegacyDie = (value, index) => {
    const isLocked = isDieLocked(index, lockedIndices)
    
    const wrapperClasses = isLocked
      ? `bg-primary/10 ring-1 ring-primary/30 rounded ${groupPadding[size]}`
      : ''
    
    const dieOpacity = hasLockedDice && !isLocked ? 'opacity-50' : 'opacity-100'
    
    const dieElement = renderDie(value, index, dieOpacity)

    return isLocked ? (
      <div key={`locked-${index}`} className={wrapperClasses}>
        {dieElement}
      </div>
    ) : (
      dieElement
    )
  }

  return (
    <div className={`dice-display ${variant === 'selected' ? 'selected' : ''}`}>
      {/* Legacy dice row */}
      <div className={`inline-flex items-center ${gapClasses[size]} ${className}`} role="group" aria-label="Dice roll">
        {roll.map((value, index) => renderLegacyDie(value, index))}
      </div>

      {/* Odds information (optional) */}
      {showOdds && oddsData && (
        <div className={`text-muted-foreground mt-1 ${size === 'xs' ? 'text-xs' : size === 'sm' ? 'text-xs' : 'text-sm'}`}>
          {oddsData.description && (
            <div>{oddsData.description}</div>
          )}
          {oddsData.probability !== null && oddsData.probability !== undefined && (
            <div className="font-medium">
              {(oddsData.probability * 100).toFixed(1)}% chance
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default DiceDisplay
