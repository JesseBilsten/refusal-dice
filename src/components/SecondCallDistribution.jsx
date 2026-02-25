import React, { useMemo } from 'react'
import { Badge } from './ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'
import VariantSelector from './VariantSelector'
import { analyzeSecondCallDistribution, checkGame, getKickerStrength } from '../lib/game-validation'
import uniqueRollsData from '../data/unique-rolls.json'

const GAMES = [
  { id: '10-2', name: '10-2', emoji: '✌️' },
  { id: '10-3', name: '10-3', emoji: '👌' },
  { id: '10-4', name: '10-4', emoji: '🔫' },
  { id: 'ship-captain-crew', name: 'Ship, Captain, Crew', emoji: '⚓️' },
  { id: 'monterey', name: 'Monterey', emoji: '🔄' },
  { id: 'vegas', name: "7's", emoji: '🎰' },
  { id: 'pairs', name: 'Pairs', emoji: '🍐' },
  { id: 'razzle', name: 'Razzle', emoji: '✨' },
  { id: 'boss', name: 'Boss', emoji: '👑' },
  { id: 'tres-away', name: 'Tres Away', emoji: '⛳' },
]

/**
 * SecondCallDistribution Component
 * 
 * Displays second call distribution analysis for a given game and variant.
 * Uses the same calculation method as the 2nd Call Predictor page.
 * 
 * @param {Object} props
 * @param {string} props.gameId - The game identifier
 * @param {boolean} props.hasVariants - Whether the game has kicker variants
 * @param {number} props.numOpponents - Number of opponents (default: 2)
 * @param {boolean} props.showTabs - If true and hasVariants, show tabs for All/High/Low
 * @param {string} props.variant - If provided and !showTabs, only show this variant
 */
const SecondCallDistribution = ({ 
  gameId, 
  hasVariants = false, 
  numOpponents = 2,
  showTabs = false,
  variant = null,
  title = "Other Games Playable on Same Rolls",
  description = null
}) => {
  // Calculate distributions
  const distributions = useMemo(() => {
    if (hasVariants && showTabs) {
      // For tabs view: pre-filter rolls by game, then by variant
      // Start with all rolls that can play this game
      const allGameRolls = uniqueRollsData.uniqueRolls.filter(rollData => {
        return checkGame(rollData.roll, gameId)
      })
      
      // Filter to only HIGH variant rolls
      const highRolls = allGameRolls.filter(rollData => {
        const strength = getKickerStrength(rollData.roll, gameId)
        return strength === 'high'
      })
      
      // Filter to only LOW variant rolls
      const lowRolls = allGameRolls.filter(rollData => {
        const strength = getKickerStrength(rollData.roll, gameId)
        return strength === 'low'
      })
      
      // Pass pre-filtered rolls and NULL variant (we've already filtered)
      return {
        all: analyzeSecondCallDistribution(gameId, null, allGameRolls, numOpponents),
        high: analyzeSecondCallDistribution(gameId, null, highRolls, numOpponents),
        low: analyzeSecondCallDistribution(gameId, null, lowRolls, numOpponents)
      }
    } else {
      // For single view: also pre-filter by game and variant
      if (hasVariants && variant) {
        // Pre-filter to game + specific variant
        const gameRolls = uniqueRollsData.uniqueRolls.filter(rollData => {
          if (!checkGame(rollData.roll, gameId)) return false
          const strength = getKickerStrength(rollData.roll, gameId)
          return strength === variant
        })
        return {
          selected: analyzeSecondCallDistribution(gameId, null, gameRolls, numOpponents)
        }
      } else {
        // No variant or no variants for this game - just filter by game
        const gameRolls = uniqueRollsData.uniqueRolls.filter(rollData => {
          return checkGame(rollData.roll, gameId)
        })
        return {
          selected: analyzeSecondCallDistribution(gameId, null, gameRolls, numOpponents)
        }
      }
    }
  }, [gameId, hasVariants, numOpponents, showTabs, variant])

  // Render distribution table
  const renderDistributionTable = (analysis) => {
    if (!analysis || analysis.error) {
      return (
        <p className="text-center text-muted-foreground py-8">
          {analysis?.error || 'No data available'}
        </p>
      )
    }

    const distribution = analysis.secondCallDistribution || []

    if (distribution.length === 0) {
      return (
        <p className="text-center text-muted-foreground py-8">
          No alternative calls found
        </p>
      )
    }

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]">Rank</TableHead>
            <TableHead>Second Call</TableHead>
            <TableHead className="text-right">Likelihood</TableHead>
            <TableHead className="text-right">Count</TableHead>
            <TableHead className="text-right">Avg Strength</TableHead>
            <TableHead>Example Rolls</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {distribution.map((call, idx) => (
            <TableRow key={idx}>
              <TableCell>
                <Badge variant={idx === 0 ? 'default' : 'secondary'}>
                  #{idx + 1}
                </Badge>
              </TableCell>
              <TableCell className="font-medium">
                <span className="flex items-center gap-2">
                  {GAMES.find(g => g.id === call.game)?.emoji || '🎲'}
                  {call.displayName}
                </span>
              </TableCell>
              <TableCell className="text-right">
                <Badge 
                  variant="outline"
                  className={
                    parseFloat(call.percentage) > 30 
                      ? 'bg-green-500/10 text-green-700 dark:text-green-400'
                      : parseFloat(call.percentage) > 15
                      ? 'bg-blue-500/10 text-blue-700 dark:text-blue-400'
                      : ''
                  }
                >
                  {call.percentage}%
                </Badge>
              </TableCell>
              <TableCell className="text-right font-mono text-sm">
                {call.count}
              </TableCell>
              <TableCell className="text-right font-mono text-sm">
                {call.avgOffensiveStrength}%
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {call.examples.slice(0, 3).map((ex, i) => (
                    <Badge 
                      key={i} 
                      variant="secondary" 
                      className="font-mono text-xs"
                      title={`Strength: ${ex.strength}%`}
                    >
                      {ex.roll}
                    </Badge>
                  ))}
                  {call.examples.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{call.examples.length - 3}
                    </Badge>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    )
  }

  // Auto-generate description if not provided
  const autoDescription = useMemo(() => {
    if (description) return description
    
    if (showTabs && hasVariants) {
      return "When you can play this game, what other games are available as your second call?"
    } else if (hasVariants && variant) {
      const analysis = distributions.selected
      return `Based on ${analysis?.totalRolls || 0} unique rolls (${analysis?.totalInstances || 0} total instances) that can make this game`
    } else {
      const analysis = distributions.selected
      return `Based on ${analysis?.totalRolls || 0} unique rolls (${analysis?.totalInstances || 0} total instances) that can make this game`
    }
  }, [description, showTabs, hasVariants, variant, distributions])

  const [selectedVariant, setSelectedVariant] = React.useState('all')
  if (showTabs && hasVariants) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{autoDescription}</CardDescription>
        </CardHeader>
        <CardContent>
          <VariantSelector
            selectedVariant={selectedVariant}
            onChange={setSelectedVariant}
            className="mb-4"
          />
          {selectedVariant === 'all' && renderDistributionTable(distributions.all)}
          {selectedVariant === 'high' && renderDistributionTable(distributions.high)}
          {selectedVariant === 'low' && renderDistributionTable(distributions.low)}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{autoDescription}</CardDescription>
      </CardHeader>
      <CardContent>
        {renderDistributionTable(distributions.selected)}
      </CardContent>
    </Card>
  )
}

export default SecondCallDistribution
