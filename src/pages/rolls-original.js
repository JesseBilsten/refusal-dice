import React, { useState, useMemo, startTransition, useEffect } from 'react'
import { graphql } from 'gatsby'
import Layout from '../components/layout'
import { Badge } from '../components/ui/badge'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { ToggleGroup, ToggleGroupItem } from '../components/ui/toggle-group'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table'
import { Label } from '../components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Slider } from '../components/ui/slider'
import { LayoutGrid, TableProperties } from 'lucide-react'
import uniqueRollsData from '../data/unique-rolls.json'
import SecondCallDistribution from '../components/SecondCallDistribution'
import { 
  checkGame, 
  getKickerStrength, 
  calculateOffensiveStrength,
  calculateDefensiveStrength,
  getBossHandRank,
  calculateTresAwayScore,
  getRazzleScore,
  STRENGTH_DATA_VERSION,
  gameOddsMap
} from '../lib/game-validation'

// Memoized component for individual unique roll items
const UniqueRollItem = React.memo(({ roll, count, isMatching, badgeProps }) => {
  const defaultBadgeProps = {
    variant: isMatching ? 'default' : 'secondary',
    className: 'transition-all'
  }
  
  const finalBadgeProps = badgeProps || defaultBadgeProps
  
  return (
    <div className="relative m-0.5">
      <Badge {...finalBadgeProps}>
        {roll[0]}{roll[1]}{roll[2]}{roll[3]}{roll[4]}
      </Badge>
      <Badge
        variant="destructive"
        className="absolute -top-1 -right-1 h-4 min-w-4 px-1 text-xs flex items-center justify-center"
      >
        {count}
      </Badge>
    </div>
  )
})

const GAMES = [
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
]

const RollsPage = ({ data }) => {
  // View state
  const [viewMode, setViewMode] = useState('unique') // 'all' or 'unique'
  const [layoutMode, setLayoutMode] = useState('grid') // 'grid' or 'table'
  const [hasRenderedAll, setHasRenderedAll] = useState(false)
  const [isPending, setIsPending] = useState(false)
  
  // Game selection
  const [selectedGame, setSelectedGame] = useState(null)
  const [selectedVariant, setSelectedVariant] = useState(null) // 'high' or 'low'
  
  // Game-specific modifiers
  const [razzleMinCount, setRazzleMinCount] = useState(4)
  const [razzleTargetValue, setRazzleTargetValue] = useState(6)
  const [tresAwayMaxScore, setTresAwayMaxScore] = useState(uniqueRollsData.thresholds?.tresAwayExpected || 7.31)
  const [bossMinRank, setBossMinRank] = useState(4) // 4 = Three of a Kind or better
  
  // Table state
  const [sortColumn, setSortColumn] = useState(null)
  const [sortDirection, setSortDirection] = useState('desc')
  
  // Settings
  const [playerCount, setPlayerCount] = useState(3)

  // Parse URL parameters on mount to auto-select game filter
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const gameParam = params.get('game')
      const viewParam = params.get('view')
      
      if (gameParam) {
        const game = GAMES.find(g => g.id === gameParam)
        if (game) {
          setSelectedGame(gameParam)
        }
      }
      
      if (viewParam === 'table') {
        setLayoutMode('table')
      }
    }
  }, [])

  // Generate all possible dice rolls
  const diceRolls = useMemo(() => {
    const rolls = []
    for (let i = 0; i < 6; i++) {
      for (let j = 0; j < 6; j++) {
        for (let k = 0; k < 6; k++) {
          for (let l = 0; l < 6; l++) {
            for (let m = 0; m < 6; m++) {
              rolls.push([i + 1, j + 1, k + 1, l + 1, m + 1])
            }
          }
        }
      }
    }
    return rolls
  }, [])

  const uniqueRollsArray = uniqueRollsData.uniqueRolls
  const rollCounts = uniqueRollsData.uniqueCount

  // Calculate matching rolls based on selected game and modifiers
  const { matchingRolls, matchingUniqueRolls, matchingCount } = useMemo(() => {
    if (!selectedGame) {
      return { matchingRolls: new Set(), matchingUniqueRolls: new Set(), matchingCount: 0 }
    }
    
    const matching = new Set()
    const uniqueMatching = new Set()
    
    // Special handling for Razzle
    if (selectedGame === 'razzle') {
      diceRolls.forEach((roll, index) => {
        // Count 1s and 6s (1s are wild for 6s)
        const ones = roll.filter(d => d === 1).length
        const sixes = roll.filter(d => d === 6).length
        const wildSixes = ones + sixes
        
        // Check for 5+ of any other number (using 1s as wilds)
        const counts = {}
        roll.forEach(d => counts[d] = (counts[d] || 0) + 1)
        
        let hasFiveOfOther = false
        for (let num = 2; num <= 5; num++) {
          const naturalCount = counts[num] || 0
          if (naturalCount + ones >= 5) {
            hasFiveOfOther = true
            break
          }
        }
        
        // Include if 4+ wild 6s OR 5+ of any other number
        if (wildSixes >= 4 || hasFiveOfOther) {
          matching.add(index)
        }
      })
      
      uniqueRollsArray.forEach((rollData, index) => {
        const roll = rollData.roll
        
        // Count 1s and 6s (1s are wild for 6s)
        const ones = roll.filter(d => d === 1).length
        const sixes = roll.filter(d => d === 6).length
        const wildSixes = ones + sixes
        
        // Check for 5+ of any other number (using 1s as wilds)
        const counts = {}
        roll.forEach(d => counts[d] = (counts[d] || 0) + 1)
        
        let hasFiveOfOther = false
        for (let num = 2; num <= 5; num++) {
          const naturalCount = counts[num] || 0
          if (naturalCount + ones >= 5) {
            hasFiveOfOther = true
            break
          }
        }
        
        // Include if 4+ wild 6s OR 5+ of any other number
        if (wildSixes >= 4 || hasFiveOfOther) {
          uniqueMatching.add(index)
        }
      })
    }
    // Special handling for Tres Away
    else if (selectedGame === 'tres-away') {
      diceRolls.forEach((roll, index) => {
        if (!roll.includes(3)) return
        const score = calculateTresAwayScore(roll)
        if (score <= tresAwayMaxScore) {
          matching.add(index)
        }
      })
      
      uniqueRollsArray.forEach((rollData, index) => {
        if (!rollData.roll.includes(3)) return
        const score = calculateTresAwayScore(rollData.roll)
        if (score <= tresAwayMaxScore) {
          uniqueMatching.add(index)
        }
      })
    }
    // Special handling for Boss
    else if (selectedGame === 'boss') {
      diceRolls.forEach((roll, index) => {
        const handRank = getBossHandRank(roll)
        if (handRank.rank >= bossMinRank) {
          matching.add(index)
        }
      })
      
      uniqueRollsArray.forEach((rollData, index) => {
        const handRank = getBossHandRank(rollData.roll)
        if (handRank.rank >= bossMinRank) {
          uniqueMatching.add(index)
        }
      })
    }
    // Kicker games
    else {
      diceRolls.forEach((roll, index) => {
        if (!checkGame(roll, selectedGame)) return
        
        // If variant is selected, check it matches
        if (selectedVariant) {
          const strength = getKickerStrength(roll, selectedGame)
          if (strength === selectedVariant) {
            matching.add(index)
          }
        } else {
          matching.add(index)
        }
      })
      
      uniqueRollsArray.forEach((rollData, index) => {
        if (!checkGame(rollData.roll, selectedGame)) return
        
        if (selectedVariant) {
          const strength = getKickerStrength(rollData.roll, selectedGame)
          if (strength === selectedVariant) {
            uniqueMatching.add(index)
          }
        } else {
          uniqueMatching.add(index)
        }
      })
    }
    
    return { 
      matchingRolls: matching, 
      matchingUniqueRolls: uniqueMatching,
      matchingCount: matching.size 
    }
  }, [selectedGame, selectedVariant, razzleMinCount, razzleTargetValue, tresAwayMaxScore, bossMinRank, diceRolls, uniqueRollsArray])

  // Calculate game counts for buttons
  const gameCounts = useMemo(() => {
    const counts = {}
    
    GAMES.forEach(game => {
      let count = 0
      
      if (selectedGame) {
        // Count within current subset
        matchingRolls.forEach(idx => {
          const roll = diceRolls[idx]
          if (game.id === 'razzle' || game.id === 'boss' || game.id === 'tres-away') {
            if (checkGame(roll, game.id)) count++
          } else {
            if (checkGame(roll, game.id)) count++
          }
        })
      } else {
        // Count in full dataset
        diceRolls.forEach(roll => {
          if (checkGame(roll, game.id)) count++
        })
      }
      
      counts[game.id] = count
    })
    
    return counts
  }, [selectedGame, matchingRolls, diceRolls])

  // Handlers
  const handleGameSelect = (gameId) => {
    setIsPending(true)
    startTransition(() => {
      if (selectedGame === gameId) {
        setSelectedGame(null)
        setSelectedVariant(null)
      } else {
        setSelectedGame(gameId)
        setSelectedVariant(null)
      }
      setIsPending(false)
    })
  }

  const handleViewModeChange = (value) => {
    if (value) {
      setIsPending(true)
      startTransition(() => {
        setViewMode(value)
        if (value === 'all') {
          setHasRenderedAll(true)
        }
        requestAnimationFrame(() => {
          setTimeout(() => setIsPending(false), 100)
        })
      })
    }
  }

  const handleLayoutModeChange = (value) => {
    if (value) {
      setLayoutMode(value)
    }
  }

  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('desc')
    }
  }

  // Render grid view
  const gridView = useMemo(() => {
    const rollsToRender = viewMode === 'all' ? diceRolls : uniqueRollsArray.map(r => r.roll)
    
    return rollsToRender.map((roll, index) => {
      const isMatching = viewMode === 'all' 
        ? matchingRolls.has(index)
        : matchingUniqueRolls.has(index)
      
      const count = viewMode === 'all' ? null : uniqueRollsArray[index].count
      
      if (viewMode === 'all') {
        return (
          <Badge
            key={index}
            variant={isMatching ? 'default' : 'secondary'}
            className="m-0.5 transition-all"
          >
            {roll[0]}{roll[1]}{roll[2]}{roll[3]}{roll[4]}
          </Badge>
        )
      } else {
        return (
          <UniqueRollItem
            key={index}
            roll={roll}
            count={count}
            isMatching={isMatching}
          />
        )
      }
    })
  }, [viewMode, diceRolls, uniqueRollsArray, matchingRolls, matchingUniqueRolls])

  const selectedGameObj = GAMES.find(g => g.id === selectedGame)

  return (
    <Layout>
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="my-8 text-center">
          <h1 className="text-4xl font-bold text-foreground">
            Roll Analysis
          </h1>
          <p className="text-lg text-muted-foreground mt-2">
            Analyze probabilities and distributions for all 7,776 possible rolls
          </p>
        </div>

        {/* Search/Filter/Settings Card */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Filters & Settings</CardTitle>
                <CardDescription>
                  Select a game and modifiers to analyze roll distributions
                </CardDescription>
              </div>
              
              {/* View Toggles - Right Aligned */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Label className="text-xs text-muted-foreground">Rolls:</Label>
                  <ToggleGroup type="single" value={viewMode} onValueChange={handleViewModeChange}>
                    <ToggleGroupItem value="unique" aria-label="Unique rolls" title="Unique rolls">
                      Unique ({rollCounts})
                    </ToggleGroupItem>
                    <ToggleGroupItem value="all" aria-label="All rolls" title="All 7,776 rolls">
                      All (7,776)
                    </ToggleGroupItem>
                  </ToggleGroup>
                </div>
                
                <div className="flex items-center gap-2">
                  <Label className="text-xs text-muted-foreground">Layout:</Label>
                  <ToggleGroup type="single" value={layoutMode} onValueChange={handleLayoutModeChange}>
                    <ToggleGroupItem value="grid" aria-label="Grid view">
                      <LayoutGrid className="h-4 w-4" />
                    </ToggleGroupItem>
                    <ToggleGroupItem value="table" aria-label="Table view">
                      <TableProperties className="h-4 w-4" />
                    </ToggleGroupItem>
                  </ToggleGroup>
                </div>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Game Selection */}
            <div>
              <Label className="text-sm font-medium mb-3 block">Select Game</Label>
              <div className="flex flex-wrap gap-2">
                {GAMES.map(game => {
                  const count = gameCounts[game.id] || 0
                  const isSelected = selectedGame === game.id
                  
                  return (
                    <Button
                      key={game.id}
                      onClick={() => handleGameSelect(game.id)}
                      variant={isSelected ? 'default' : 'outline'}
                      className="transition-all"
                    >
                      <span className="mr-2">{game.emoji}</span>
                      {game.name}
                      <Badge variant="secondary" className="ml-2">
                        {count.toLocaleString()}
                      </Badge>
                    </Button>
                  )
                })}
              </div>
            </div>

            {/* Game-Specific Modifiers */}
            {selectedGame && (
              <div className="space-y-4 pt-4 border-t border-border">
                <Label className="text-sm font-medium">Game Modifiers</Label>
                
                {/* Kicker Games: High/Low Variant */}
                {selectedGameObj?.hasVariants && (
                  <div className="flex items-center gap-4">
                    <Label className="text-sm text-muted-foreground w-24">Variant:</Label>
                    <ToggleGroup type="single" value={selectedVariant || ''} onValueChange={setSelectedVariant}>
                      <ToggleGroupItem value="">All</ToggleGroupItem>
                      <ToggleGroupItem value="low">Low</ToggleGroupItem>
                      <ToggleGroupItem value="high">High</ToggleGroupItem>
                    </ToggleGroup>
                  </div>
                )}

                {/* Razzle Settings */}
                {selectedGame === 'razzle' && (
                  <>
                    <div className="flex items-center gap-4">
                      <Label className="text-sm text-muted-foreground w-24">Target Value:</Label>
                      <Select value={razzleTargetValue.toString()} onValueChange={(v) => setRazzleTargetValue(parseInt(v))}>
                        <SelectTrigger className="w-[180px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">Aces (1s)</SelectItem>
                          <SelectItem value="2">Twos</SelectItem>
                          <SelectItem value="3">Threes</SelectItem>
                          <SelectItem value="4">Fours</SelectItem>
                          <SelectItem value="5">Fives</SelectItem>
                          <SelectItem value="6">Sixes</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center gap-4">
                      <Label className="text-sm text-muted-foreground w-24">Min Count:</Label>
                      <Select value={razzleMinCount.toString()} onValueChange={(v) => setRazzleMinCount(parseInt(v))}>
                        <SelectTrigger className="w-[180px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1+ matching</SelectItem>
                          <SelectItem value="2">2+ matching</SelectItem>
                          <SelectItem value="3">3+ matching</SelectItem>
                          <SelectItem value="4">4+ matching</SelectItem>
                          <SelectItem value="5">5 matching</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}

                {/* Tres Away Score Range */}
                {selectedGame === 'tres-away' && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm text-muted-foreground">Max Score:</Label>
                      <span className="text-sm font-medium">{tresAwayMaxScore.toFixed(2)}</span>
                    </div>
                    <Slider
                      value={[tresAwayMaxScore]}
                      onValueChange={([val]) => setTresAwayMaxScore(val)}
                      min={0}
                      max={30}
                      step={0.1}
                      className="w-full"
                    />
                    <p className="text-xs text-muted-foreground">
                      Average score: {(uniqueRollsData.thresholds?.tresAwayExpected || 7.31).toFixed(2)}
                    </p>
                  </div>
                )}

                {/* Boss Hand Strength Range */}
                {selectedGame === 'boss' && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm text-muted-foreground">Minimum Hand:</Label>
                      <span className="text-sm font-medium">
                        {bossMinRank === 2 && 'Pair'}
                        {bossMinRank === 3 && 'Two Pair'}
                        {bossMinRank === 4 && '3-of-a-kind'}
                        {bossMinRank === 5 && 'Full House'}
                        {bossMinRank === 6 && '4-of-a-kind'}
                        {bossMinRank === 7 && '5-of-a-kind'}
                      </span>
                    </div>
                    <Slider
                      value={[bossMinRank]}
                      onValueChange={([val]) => setBossMinRank(val)}
                      min={2}
                      max={7}
                      step={1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Pair</span>
                      <span>5-of-a-kind</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Player Count */}
            <div className="flex items-center gap-4 pt-4 border-t border-border">
              <Label className="text-sm text-muted-foreground w-24">Players:</Label>
              <Select value={playerCount.toString()} onValueChange={(v) => setPlayerCount(parseInt(v))}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2">2 Players</SelectItem>
                  <SelectItem value="3">3 Players</SelectItem>
                  <SelectItem value="4">4 Players</SelectItem>
                  <SelectItem value="5">5 Players</SelectItem>
                  <SelectItem value="6">6 Players</SelectItem>
                  <SelectItem value="7">7 Players</SelectItem>
                  <SelectItem value="8">8 Players</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Odds Summary */}
        {selectedGame && (
          <div className="mb-6">
            <SecondCallDistribution
              gameId={selectedGame}
              hasVariants={selectedGameObj?.hasVariants || false}
              variant={selectedVariant}
              numOpponents={playerCount - 1}
              showTabs={false}
              title="Odds Summary"
              description={`Showing ${matchingCount.toLocaleString()} of 7,776 rolls (${((matchingCount / 7776) * 100).toFixed(2)}%)`}
            />
          </div>
        )}

        {/* Results Display */}
        <Card className="relative left-1/2 right-1/2 -mx-[50vw] w-screen">
          <CardHeader>
            <CardTitle>
              {selectedGame 
                ? `${selectedGameObj?.emoji} ${selectedGameObj?.name}${selectedVariant ? ` (${selectedVariant})` : ''} Rolls`
                : 'All Possible Rolls'
              }
            </CardTitle>
          </CardHeader>
          <CardContent
            style={{
              display: layoutMode === 'table' ? 'block' : 'flex',
              flexWrap: layoutMode === 'table' ? 'nowrap' : 'wrap',
              fontFamily: 'monospace',
              ...(layoutMode !== 'table' && { contain: 'layout style paint' }),
              opacity: isPending ? 0.6 : 1,
              transition: 'opacity 150ms ease-in-out',
            }}
          >
            {layoutMode === 'grid' ? (
              <>{gridView}</>
            ) : (
              <Table>
                <TableHeader className="sticky top-0 bg-background z-20 border-b shadow-sm">
                  <TableRow className="border-b">
                    <TableHead 
                      className="sticky left-0 bg-background z-30 cursor-pointer hover:bg-muted border-r"
                      onClick={() => handleSort('roll')}
                    >
                      Roll {sortColumn === 'roll' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </TableHead>
                    <TableHead className="text-center hidden lg:table-cell">10-2 L</TableHead>
                    <TableHead className="text-center hidden lg:table-cell">10-2 H</TableHead>
                    <TableHead className="text-center hidden lg:table-cell">10-3 L</TableHead>
                    <TableHead className="text-center hidden lg:table-cell">10-3 H</TableHead>
                    <TableHead className="text-center hidden lg:table-cell">10-4 L</TableHead>
                    <TableHead className="text-center hidden lg:table-cell">10-4 H</TableHead>
                    <TableHead className="text-center hidden lg:table-cell">SCC L</TableHead>
                    <TableHead className="text-center hidden lg:table-cell">SCC H</TableHead>
                    <TableHead className="text-center hidden lg:table-cell">Mont L</TableHead>
                    <TableHead className="text-center hidden lg:table-cell">Mont H</TableHead>
                    <TableHead className="text-center hidden lg:table-cell">7's L</TableHead>
                    <TableHead className="text-center hidden lg:table-cell">7's H</TableHead>
                    <TableHead className="text-center hidden lg:table-cell">Pairs L</TableHead>
                    <TableHead className="text-center hidden lg:table-cell">Pairs H</TableHead>
                    <TableHead className="text-center hidden lg:table-cell">Razzle</TableHead>
                    <TableHead className="text-center hidden lg:table-cell">Boss</TableHead>
                    <TableHead className="text-center hidden lg:table-cell">Tres</TableHead>
                    <TableHead className="text-center">Flex</TableHead>
                    <TableHead className="text-center">Off%</TableHead>
                    <TableHead className="text-center hidden lg:table-cell">Def%</TableHead>
                    <TableHead className="text-center">Best</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {uniqueRollsArray.map((rollData, index) => {
                    const isHighlighted = matchingUniqueRolls.has(index)
                    const analysis = rollData.analysis || {}
                    const variants = analysis.variants || []
                    
                    const rawStrengthMap = {}
                    variants.forEach(v => {
                      const key = v.variant ? `${v.game}-${v.variant}` : v.game
                      rawStrengthMap[key] = v.rawStrength
                    })
                    
                    const getStrength = (game, variant) => {
                      const key = variant ? `${game}-${variant}` : game
                      const strength = rawStrengthMap[key]
                      return strength ? Math.round(strength) : 0
                    }
                    
                    const numOpponents = playerCount - 1
                    const dynamicOffensiveStrength = analysis.bestCall 
                      ? calculateOffensiveStrength(analysis.bestCall.rawStrength, numOpponents, analysis.bestCall.game)
                      : 0
                    
                    let dynamicDefensiveStrength = 0
                    if (variants.length > 0) {
                      const defensiveStrengths = variants.map(v => 
                        calculateDefensiveStrength(v.rawStrength, numOpponents, v.game)
                      )
                      const avgDefensive = defensiveStrengths.reduce((a, b) => a + b, 0) / defensiveStrengths.length
                      const flexibilityBonus = Math.min(20, analysis.flexibility * 2)
                      dynamicDefensiveStrength = Math.min(100, avgDefensive + flexibilityBonus)
                    }
                    
                    return (
                      <TableRow key={index} className={isHighlighted ? 'bg-primary/10' : ''}>
                        <TableCell className="sticky left-0 bg-background z-10 font-mono font-semibold border-r shadow-sm text-xs lg:text-sm px-2 lg:px-3 py-1 lg:py-2">
                          {rollData.roll.join('')}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-center font-mono text-sm">{getStrength('10-2', 'low') || '-'}</TableCell>
                        <TableCell className="hidden lg:table-cell text-center font-mono text-sm">{getStrength('10-2', 'high') || '-'}</TableCell>
                        <TableCell className="hidden lg:table-cell text-center font-mono text-sm">{getStrength('10-3', 'low') || '-'}</TableCell>
                        <TableCell className="hidden lg:table-cell text-center font-mono text-sm">{getStrength('10-3', 'high') || '-'}</TableCell>
                        <TableCell className="hidden lg:table-cell text-center font-mono text-sm">{getStrength('10-4', 'low') || '-'}</TableCell>
                        <TableCell className="hidden lg:table-cell text-center font-mono text-sm">{getStrength('10-4', 'high') || '-'}</TableCell>
                        <TableCell className="hidden lg:table-cell text-center font-mono text-sm">{getStrength('ship-captain-crew', 'low') || '-'}</TableCell>
                        <TableCell className="hidden lg:table-cell text-center font-mono text-sm">{getStrength('ship-captain-crew', 'high') || '-'}</TableCell>
                        <TableCell className="hidden lg:table-cell text-center font-mono text-sm">{getStrength('monterey', 'low') || '-'}</TableCell>
                        <TableCell className="hidden lg:table-cell text-center font-mono text-sm">{getStrength('monterey', 'high') || '-'}</TableCell>
                        <TableCell className="hidden lg:table-cell text-center font-mono text-sm">{getStrength('vegas', 'low') || '-'}</TableCell>
                        <TableCell className="hidden lg:table-cell text-center font-mono text-sm">{getStrength('vegas', 'high') || '-'}</TableCell>
                        <TableCell className="hidden lg:table-cell text-center font-mono text-sm">{getStrength('pairs', 'low') || '-'}</TableCell>
                        <TableCell className="hidden lg:table-cell text-center font-mono text-sm">{getStrength('pairs', 'high') || '-'}</TableCell>
                        <TableCell className="hidden lg:table-cell text-center font-mono text-sm">{getStrength('razzle') || '-'}</TableCell>
                        <TableCell className="hidden lg:table-cell text-center font-mono text-sm">{getStrength('boss') || '-'}</TableCell>
                        <TableCell className="hidden lg:table-cell text-center font-mono text-sm">{getStrength('tres-away') || '-'}</TableCell>
                        <TableCell className="text-center font-mono text-xs lg:text-sm font-semibold px-2 lg:px-3">{analysis.flexibility || 0}</TableCell>
                        <TableCell className="text-center font-mono text-xs lg:text-sm font-bold text-orange-600 dark:text-orange-400 px-2 lg:px-3">
                          {dynamicOffensiveStrength.toFixed(1)}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-center font-mono text-sm font-bold text-blue-600 dark:text-blue-400">
                          {dynamicDefensiveStrength.toFixed(1)}
                        </TableCell>
                        <TableCell className="text-center font-mono text-xs lg:text-sm font-bold text-primary px-2 lg:px-3">
                          {analysis.overallPercentile || 0}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </section>
    </Layout>
  )
}

export default RollsPage

export const query = graphql`
  query {
    allFile {
      edges {
        node {
          relativePath
          prettySize
          extension
          birthTime(fromNow: true)
        }
      }
    }
  }
`
