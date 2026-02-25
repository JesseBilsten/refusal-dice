import React from 'react'
import Die from '../Die'
import AnimatedDie from '../Die/AnimatedDie'
import { isDieLocked, groupLockedIndices } from '../../lib/component-helpers'

/**
 * DiceDisplay - Unified component for displaying dice rolls
 * 
 * @param {Array<number>} roll - Array of 5 dice values (1-6)
 * @param {string} size - Size variant: 'xs' | 'sm' | 'md' | 'lg'
 * @param {string} variant - Display variant: 'show' | 'hide' | 'select' | 'selected'
 * @param {Array<number>} lockedIndices - Array of indices (0-4) for locked dice
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

  // Get locked groups for visual styling
  const lockedGroups = groupLockedIndices(lockedIndices)
  const hasLockedDice = lockedIndices.length > 0

  // Gap class based on size
  const gapClasses = {
    xs: 'gap-0.5',
    sm: 'gap-1',
    md: 'gap-1.5',
    lg: 'gap-2',
  }

  // Container classes
  const containerClass = `inline-flex items-center ${gapClasses[size]} ${className}`

  // Render function for a single die
  const renderDie = (value, index) => {
    const isLocked = isDieLocked(index, lockedIndices)
    
    // Determine if this die is part of a locked group
    let lockedGroupIndex = -1
    if (isLocked) {
      lockedGroupIndex = lockedGroups.findIndex(group => group.includes(index))
    }
    
    // Wrapper classes for locked dice styling
    const wrapperClasses = isLocked
      ? `bg-primary/10 ring-1 ring-primary/30 rounded ${size === 'xs' ? 'p-0.5' : size === 'sm' ? 'p-1' : size === 'md' ? 'p-1' : 'p-1.5'}`
      : ''
    
    // Apply opacity to unlocked dice when there are locked dice
    const dieOpacity = hasLockedDice && !isLocked ? 'opacity-50' : 'opacity-100'
    
    const DieComponent = animated ? AnimatedDie : Die
    
    const dieElement = animated ? (
      <AnimatedDie
        key={index}
        value={value}
        isRolling={isRolling}
        onRollComplete={index === 4 ? onRollComplete : null} // Only call callback on last die
        size={size}
        className={dieOpacity}
      />
    ) : (
      <Die
        key={index}
        number={value}
        size={size}
        className={dieOpacity}
      />
    )

    // If locked, wrap in styled container
    return isLocked ? (
      <div key={`locked-${index}`} className={wrapperClasses}>
        {dieElement}
      </div>
    ) : (
      dieElement
    )
  }

  // Handle variant visibility
  if (variant === 'hide') {
    return null
  }

  return (
    <div className={`dice-display ${variant === 'selected' ? 'selected' : ''}`}>
      {/* Dice row */}
      <div className={containerClass} role="group" aria-label="Dice roll">
        {roll.map((value, index) => renderDie(value, index))}
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
