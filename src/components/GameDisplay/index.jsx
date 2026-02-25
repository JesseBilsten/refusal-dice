import React from 'react'
import { Link } from 'gatsby'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../ui/card'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { getRarityTier } from '../../lib/component-helpers'
import { GAMES_MAP } from '../../lib/games-config'
import { cn } from '../../lib/utils'

/**
 * GameDisplay - Unified component for displaying games
 * 
 * @param {string} gameId - Game identifier (e.g., '10-2', 'razzle')
 * @param {string} variant - Game variant: 'high' | 'low' | null
 * @param {string} displayStyle - Display style: 'card' | 'slat'
 * @param {boolean} showStrength - Whether to show strength indicator
 * @param {number} strengthValue - Strength value (0-100) for rarity tier
 * @param {boolean} selected - Whether this game is selected
 * @param {Function} onClick - Click handler for interactive cards
 * @param {boolean} showNavigation - Whether to show navigation buttons (slat style)
 * @param {boolean} compact - Compact variant for smaller displays
 * @param {React.ReactNode} children - Additional content to display
 * @param {Object} metadata - Additional game metadata (description, probability, etc.)
 * @param {string} className - Additional CSS classes
 */
const GameDisplay = ({
  gameId,
  variant = null,
  displayStyle = 'card',
  showStrength = false,
  strengthValue = null,
  selected = false,
  onClick = null,
  showNavigation = false,
  compact = false,
  children = null,
  metadata = {},
  className = '',
}) => {
  // Get game info from config
  const game = GAMES_MAP?.[gameId]
  
  if (!game) {
    return <div className="text-destructive text-sm">Invalid game ID: {gameId}</div>
  }

  // Get rarity tier if strength is provided
  const rarityTier = showStrength && strengthValue !== null ? getRarityTier(strengthValue) : null

  // Build variant label
  const variantLabel = variant ? ` (${variant.charAt(0).toUpperCase() + variant.slice(1)})` : ''
  const displayName = `${game.name}${variantLabel}`

  // Card style rendering
  if (displayStyle === 'card') {
    const cardClasses = cn(
      'transition-all duration-200 cursor-pointer',
      selected ? 'border-primary bg-primary/20 ring-2 ring-primary' : 'border-border hover:border-primary/50',
      compact ? 'p-3' : 'p-4',
      onClick ? 'hover:shadow-md hover:scale-[1.02] active:scale-95' : '',
      className
    )

    return (
      <Card 
        className={cardClasses} 
        onClick={onClick}
        role={onClick ? 'button' : undefined}
        tabIndex={onClick ? 0 : undefined}
        onKeyDown={onClick ? (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onClick(e)
          }
        } : undefined}
      >
        <CardContent className={compact ? 'p-3' : 'p-4'}>
          {/* Game emoji and name */}
          <div className="flex flex-col items-center justify-center gap-2">
            <div className={compact ? 'text-3xl' : 'text-4xl'} role="img" aria-label={game.name}>
              {game.emoji}
            </div>
            <div className={cn('font-semibold text-center', compact ? 'text-sm' : 'text-base')}>
              {displayName}
            </div>
            
            {/* Strength indicator */}
            {showStrength && rarityTier && (
              <Badge 
                className={cn(
                  rarityTier.bgClass, 
                  rarityTier.textClass,
                  'text-xs font-medium'
                )}
              >
                {rarityTier.label}
              </Badge>
            )}

            {/* Metadata display (probability, roll count, etc.) */}
            {metadata.probability !== undefined && (
              <div className="text-lg font-bold text-primary">
                {(metadata.probability * 100).toFixed(1)}%
              </div>
            )}
            
            {metadata.rollCount !== undefined && (
              <div className="text-xs text-muted-foreground">
                {metadata.rollCount.toLocaleString()} rolls
              </div>
            )}
          </div>

          {/* Additional content */}
          {children && <div className="mt-3">{children}</div>}
        </CardContent>
      </Card>
    )
  }

  // Slat style rendering (horizontal card)
  if (displayStyle === 'slat') {
    const slatClasses = cn(
      'transition-all duration-200',
      selected ? 'border-primary bg-primary/10' : 'border-border',
      className
    )

    return (
      <Card className={slatClasses}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6">
          {/* Left: Text content */}
          <div className="flex flex-col gap-3">
            <CardHeader className="p-0">
              <div className="flex items-center gap-3">
                <span className="text-4xl" role="img" aria-label={game.name}>
                  {game.emoji}
                </span>
                <div>
                  <CardTitle className="text-2xl">{displayName}</CardTitle>
                  {metadata.description && (
                    <CardDescription className="mt-1">
                      {metadata.description}
                    </CardDescription>
                  )}
                </div>
              </div>
            </CardHeader>

            {/* Metadata badges */}
            <div className="flex flex-wrap gap-2">
              {metadata.probability !== undefined && (
                <Badge variant="default">
                  {(metadata.probability * 100).toFixed(1)}% single-roll
                </Badge>
              )}
              
              {showStrength && rarityTier && (
                <Badge 
                  className={cn(
                    rarityTier.bgClass, 
                    rarityTier.textClass
                  )}
                >
                  {rarityTier.label} strength
                </Badge>
              )}
              
              {metadata.playable && (
                <Badge variant="secondary">
                  Playable
                </Badge>
              )}
            </div>

            {/* Navigation buttons */}
            {showNavigation && (
              <div className="flex gap-2 mt-auto">
                <Button asChild variant="outline" size="sm">
                  <Link to={`/games/${gameId}`}>
                    Learn more →
                  </Link>
                </Button>
                <Button asChild variant="ghost" size="sm">
                  <Link to={`/odds?game=${gameId}`}>
                    Explore rolls →
                  </Link>
                </Button>
              </div>
            )}
          </div>

          {/* Right: Visual content (examples, etc.) */}
          <div className="flex items-center justify-center">
            {children || (
              <div className="text-muted-foreground text-sm text-center">
                {/* Placeholder for dice examples or other visuals */}
                <div className="text-4xl opacity-50">{game.emoji}</div>
              </div>
            )}
          </div>
        </div>
      </Card>
    )
  }

  return null
}

export default GameDisplay
