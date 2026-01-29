import React, { useState, useMemo } from 'react'
import { graphql } from 'gatsby'
import Layout from '../components/layout'
import { Badge } from '../components/ui/badge'
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { ToggleGroup, ToggleGroupItem } from '../components/ui/toggle-group'
import uniqueRollsData from '../data/unique-rolls.json'

// Game validation functions
const checkGame = (roll, gameType) => {
  const counts = roll.reduce((acc, num) => {
    acc[num] = (acc[num] || 0) + 1
    return acc
  }, {})
  
  switch (gameType) {
    case '10-2':
      // 2 dice add up to 10 (remaining 3 dice determine high/low strength, but any is valid)
      for (let i = 0; i < 5; i++) {
        for (let j = i + 1; j < 5; j++) {
          if (roll[i] + roll[j] === 10) {
            return true
          }
        }
      }
      return false
      
    case '10-3':
      // 3 dice add up to 10 (remaining 2 dice determine high/low strength, but any is valid)
      for (let i = 0; i < 5; i++) {
        for (let j = i + 1; j < 5; j++) {
          for (let k = j + 1; k < 5; k++) {
            if (roll[i] + roll[j] + roll[k] === 10) {
              return true
            }
          }
        }
      }
      return false
      
    case '10-4':
      // 4 dice add up to 10 (remaining 1 die determines high/low strength, but any is valid)
      for (let i = 0; i < 5; i++) {
        const remaining = roll.filter((_, idx) => idx !== i)
        if (remaining.reduce((a, b) => a + b, 0) === 10) {
          return true
        }
      }
      return false
      
    case 'ship-captain-crew':
      // Outside straight: must contain 4-5-6 or 1-2-3
      const hasHighStraight = roll.includes(4) && roll.includes(5) && roll.includes(6)
      const hasLowStraight = roll.includes(1) && roll.includes(2) && roll.includes(3)
      return hasHighStraight || hasLowStraight
      
    case 'monterey':
      // Inside straight: must contain 2-3-4 or 3-4-5
      const hasLowInside = roll.includes(2) && roll.includes(3) && roll.includes(4)
      const hasHighInside = roll.includes(3) && roll.includes(4) && roll.includes(5)
      return hasLowInside || hasHighInside
      
    case 'vegas':
      // Two pairs of dice that sum to 7 or 11
      // Find all possible pairs that sum to 7 or 11
      const validPairs = []
      for (let i = 0; i < 5; i++) {
        for (let j = i + 1; j < 5; j++) {
          const sum = roll[i] + roll[j]
          if (sum === 7 || sum === 11) {
            validPairs.push([i, j])
          }
        }
      }
      
      // Check if we can find 2 non-overlapping pairs
      if (validPairs.length < 2) return false
      
      for (let i = 0; i < validPairs.length; i++) {
        for (let j = i + 1; j < validPairs.length; j++) {
          const [a1, a2] = validPairs[i]
          const [b1, b2] = validPairs[j]
          // Check if pairs don't share any dice
          if (a1 !== b1 && a1 !== b2 && a2 !== b1 && a2 !== b2) {
            return true
          }
        }
      }
      return false
      
    case 'pairs':
      // Two pairs (4 of a kind counts as 2 pairs of the same number)
      const totalPairs = Object.values(counts).reduce((total, count) => {
        return total + Math.floor(count / 2)
      }, 0)
      return totalPairs >= 2
      
    case 'razzle':
      // Most of one number (aces/1s are wild and count as any number)
      const aceCount = counts[1] || 0
      let maxCount = 0
      for (let num = 2; num <= 6; num++) {
        const total = (counts[num] || 0) + aceCount
        maxCount = Math.max(maxCount, total)
      }
      // Also check if all are aces
      if (aceCount >= 3) maxCount = Math.max(maxCount, aceCount)
      return maxCount >= 3
      
    default:
      return false
  }
}

// Helper function to calculate kicker strength based on remaining dice
const calculateKickerStrength = (kickerDice) => {
  if (kickerDice.length === 1) {
    // Single die: 4-6 is high, 1-3 is low
    return kickerDice[0] >= 4 ? 'high' : 'low'
  } else if (kickerDice.length === 2) {
    // Two dice: range 2-12, closer to 12 is high, closer to 2 is low
    const sum = kickerDice.reduce((a, b) => a + b, 0)
    const distToHigh = Math.abs(12 - sum)
    const distToLow = Math.abs(2 - sum)
    return distToHigh < distToLow ? 'high' : 'low'
  } else if (kickerDice.length === 3) {
    // Three dice: range 3-18, closer to 18 is high, closer to 3 is low
    const sum = kickerDice.reduce((a, b) => a + b, 0)
    const distToHigh = Math.abs(18 - sum)
    const distToLow = Math.abs(3 - sum)
    return distToHigh < distToLow ? 'high' : 'low'
  }
  return ''
}

// Helper function to get kicker dice for each game
const getKickerStrength = (roll, gameType) => {
  if (gameType === '10-2') {
    // Find 2 dice that sum to 10, remaining 3 are kicker
    for (let i = 0; i < 5; i++) {
      for (let j = i + 1; j < 5; j++) {
        if (roll[i] + roll[j] === 10) {
          const kicker = roll.filter((_, idx) => idx !== i && idx !== j)
          return calculateKickerStrength(kicker)
        }
      }
    }
  } else if (gameType === '10-3') {
    // Find 3 dice that sum to 10, remaining 2 are kicker
    for (let i = 0; i < 5; i++) {
      for (let j = i + 1; j < 5; j++) {
        for (let k = j + 1; k < 5; k++) {
          if (roll[i] + roll[j] + roll[k] === 10) {
            const kicker = roll.filter((_, idx) => idx !== i && idx !== j && idx !== k)
            return calculateKickerStrength(kicker)
          }
        }
      }
    }
  } else if (gameType === '10-4') {
    // Find 4 dice that sum to 10, remaining 1 is kicker
    for (let i = 0; i < 5; i++) {
      const remaining = roll.filter((_, idx) => idx !== i)
      if (remaining.reduce((a, b) => a + b, 0) === 10) {
        return calculateKickerStrength([roll[i]])
      }
    }
  } else if (gameType === 'ship-captain-crew') {
    // Find the straight (456 or 123), remaining 2 are kicker
    const hasHighStraight = roll.includes(4) && roll.includes(5) && roll.includes(6)
    const hasLowStraight = roll.includes(1) && roll.includes(2) && roll.includes(3)
    
    let straightDice = hasHighStraight ? [4, 5, 6] : hasLowStraight ? [1, 2, 3] : []
    const kicker = roll.filter((die) => {
      const dieIndex = straightDice.indexOf(die)
      if (dieIndex !== -1) {
        straightDice.splice(dieIndex, 1)
        return false
      }
      return true
    })
    return calculateKickerStrength(kicker)
  } else if (gameType === 'monterey') {
    // Find the straight (234 or 345), remaining 2 are kicker
    const hasLowInside = roll.includes(2) && roll.includes(3) && roll.includes(4)
    const hasHighInside = roll.includes(3) && roll.includes(4) && roll.includes(5)
    
    let straightDice = hasHighInside ? [3, 4, 5] : hasLowInside ? [2, 3, 4] : []
    const kicker = roll.filter((die) => {
      const dieIndex = straightDice.indexOf(die)
      if (dieIndex !== -1) {
        straightDice.splice(dieIndex, 1)
        return false
      }
      return true
    })
    return calculateKickerStrength(kicker)
  } else if (gameType === 'vegas') {
    // Find all possible pairs that sum to 7 or 11
    const validPairs = []
    for (let i = 0; i < 5; i++) {
      for (let j = i + 1; j < 5; j++) {
        const sum = roll[i] + roll[j]
        if (sum === 7 || sum === 11) {
          validPairs.push([i, j])
        }
      }
    }
    
    // Find 2 non-overlapping pairs and get the kicker
    for (let i = 0; i < validPairs.length; i++) {
      for (let j = i + 1; j < validPairs.length; j++) {
        const [a1, a2] = validPairs[i]
        const [b1, b2] = validPairs[j]
        // Check if pairs don't share any dice
        if (a1 !== b1 && a1 !== b2 && a2 !== b1 && a2 !== b2) {
          // Found valid pairs, find kicker
          const usedIndices = [a1, a2, b1, b2]
          const kickerIndex = [0, 1, 2, 3, 4].find(idx => !usedIndices.includes(idx))
          return calculateKickerStrength([roll[kickerIndex]])
        }
      }
    }
    return ''
  } else if (gameType === 'pairs') {
    // Find two pairs (4 of a kind counts as 2 pairs), remaining 1 is kicker
    const counts = roll.reduce((acc, num) => {
      acc[num] = (acc[num] || 0) + 1
      return acc
    }, {})
    
    // Mark dice that form pairs
    const used = new Array(5).fill(false)
    let pairsMarked = 0
    
    Object.entries(counts).forEach(([value, count]) => {
      const pairsFromThis = Math.floor(count / 2)
      const diceToMark = pairsFromThis * 2 // Each pair needs 2 dice
      
      let marked = 0
      for (let i = 0; i < 5 && marked < diceToMark && pairsMarked < 2; i++) {
        if (roll[i] === parseInt(value) && !used[i]) {
          used[i] = true
          marked++
          if (marked % 2 === 0) pairsMarked++ // Count complete pairs
        }
      }
    })
    
    const kicker = roll.filter((_, idx) => !used[idx])
    return calculateKickerStrength(kicker)
  }
  return ''
}

const GAMES = [
  { id: '10-3', name: '10-3', emoji: '👌' },
  { id: '10-2', name: '10-2', emoji: '✌️' },
  { id: 'vegas', name: "7's", emoji: '🎰' },
  { id: 'ship-captain-crew', name: 'Ship, Captain, Crew', emoji: '⚓️' },
  { id: 'pairs', name: 'Pairs', emoji: '🍐' },
  { id: 'monterey', name: 'Monterey', emoji: '🔄' },
  { id: '10-4', name: '10-4', emoji: '🔫' },
  { id: 'razzle', name: 'Razzle', emoji: '✨' },
]

const RollsPage = ({ data }) => {
  const [selectedGames, setSelectedGames] = useState([])
  const [searchRoll, setSearchRoll] = useState('')
  const [debugInfo, setDebugInfo] = useState(null)
  const [viewMode, setViewMode] = useState('unique')
  const [hasRenderedAll, setHasRenderedAll] = useState(false)
  
  // Track when all view is first requested
  const handleViewModeChange = (value) => {
    if (value) {
      setViewMode(value)
      if (value === 'all') {
        setHasRenderedAll(true)
      }
    }
  }

  // Generate all possible dice rolls
  const diceRolls = useMemo(() => {
    const rolls = []
    let count = 0
    for (let i = 0; i < 6; i++) {
      for (let j = 0; j < 6; j++) {
        for (let k = 0; k < 6; k++) {
          for (let l = 0; l < 6; l++) {
            for (let m = 0; m < 6; m++) {
              rolls[count] = [i + 1, j + 1, k + 1, l + 1, m + 1]
              count++
            }
          }
        }
      }
    }
    return rolls
  }, [])

  // Use pre-generated unique rolls data
  const uniqueRollsArray = uniqueRollsData.uniqueRolls
  const rollCounts = uniqueRollsData.uniqueCount

  // Calculate which rolls satisfy the selected games
  const { matchingRolls, successfulRolls } = useMemo(() => {
    if (selectedGames.length === 0) {
      return { matchingRolls: new Set(), successfulRolls: 0 }
    }
    
    const matching = new Set()
    diceRolls.forEach((roll, index) => {
      const satisfiesAny = selectedGames.some(gameId => checkGame(roll, gameId))
      if (satisfiesAny) {
        matching.add(index)
      }
    })
    
    return { matchingRolls: matching, successfulRolls: matching.size }
  }, [selectedGames, diceRolls])
  
  // Pre-calculate which unique rolls have matches
  const uniqueRollsWithMatches = useMemo(() => {
    return uniqueRollsArray.map(data => ({
      ...data,
      isMatching: data.indices.some(idx => matchingRolls.has(idx))
    }))
  }, [uniqueRollsArray, matchingRolls])

  // Memoize the rendered "All" view - only compute when needed
  const allRollsView = useMemo(() => {
    if (!hasRenderedAll) return null
    
    return diceRolls.map((roll, index) => {
      const isMatching = matchingRolls.has(index)
      const badgeVariant = isMatching ? 'default' : 'secondary'
      
      return (
        <Badge
          key={index}
          variant={badgeVariant}
          className="m-0.5 transition-all"
        >
          {roll[0]}
          {roll[1]}
          {roll[2]}
          {roll[3]}
          {roll[4]}
        </Badge>
      )
    })
  }, [diceRolls, matchingRolls, hasRenderedAll])

  // Memoize the rendered "Unique" view
  const uniqueRollsView = useMemo(() => {
    return uniqueRollsWithMatches.map((data, index) => {
      const roll = data.roll
      const badgeVariant = data.isMatching ? 'default' : 'secondary'
      
      return (
        <div key={index} className="relative m-0.5">
          <Badge
            variant={badgeVariant}
            className="transition-all"
          >
            {roll[0]}
            {roll[1]}
            {roll[2]}
            {roll[3]}
            {roll[4]}
          </Badge>
          <Badge
            variant="destructive"
            className="absolute -top-1 -right-1 h-4 min-w-4 px-1 text-xs flex items-center justify-center"
          >
            {data.count}
          </Badge>
        </div>
      )
    })
  }, [uniqueRollsWithMatches])

  const toggleGame = (gameId) => {
    setSelectedGames(prev => 
      prev.includes(gameId) 
        ? prev.filter(id => id !== gameId)
        : [...prev, gameId]
    )
  }

  const percentage = selectedGames.length > 0 
    ? ((successfulRolls / 7776) * 100).toFixed(2)
    : 0

  const checkSpecificRoll = () => {
    if (searchRoll.length !== 5) return
    const roll = searchRoll.split('').map(Number)
    if (roll.some(d => d < 1 || d > 6)) return
    
    const results = GAMES.map(game => {
      const matches = checkGame(roll, game.id)
      let strength = ''
      if (matches && ['10-2', '10-3', '10-4', 'ship-captain-crew', 'monterey', 'vegas', 'pairs'].includes(game.id)) {
        strength = getKickerStrength(roll, game.id)
      }
      return {
        game: game.name,
        matches,
        strength
      }
    })
    
    setDebugInfo({
      roll,
      results
    })
  }

  return (
    <Layout>
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="my-8 text-center">
          <h1 className="flex items-center justify-center gap-2 text-4xl font-bold text-foreground">
            Rolls <Badge variant="warning">incomplete</Badge>
          </h1>
          <p className="text-lg text-muted-foreground mt-2">
            Select games to see which rolls satisfy them
          </p>
        </div>

        {/* Game Toggle Buttons */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Select Games</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {GAMES.map(game => (
                <Button
                  key={game.id}
                  onClick={() => toggleGame(game.id)}
                  variant={selectedGames.includes(game.id) ? 'default' : 'outline'}
                  className="transition-all"
                >
                  <span className="mr-2">{game.emoji}</span>
                  {game.name}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Debug Tool - Test Specific Roll */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Test a Specific Roll</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 items-start">
              <div className="flex-1">
                <input
                  type="text"
                  value={searchRoll}
                  onChange={(e) => setSearchRoll(e.target.value)}
                  placeholder="Enter 5 digits (e.g., 23661)"
                  maxLength={5}
                  className="w-full px-3 py-2 border rounded-md bg-background text-foreground"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Enter any 5-digit combination (1-6) to see which games it satisfies
                </p>
              </div>
              <Button onClick={checkSpecificRoll}>Check</Button>
            </div>
            {debugInfo && (
              <div className="mt-4 p-4 bg-muted rounded-md">
                <h4 className="font-semibold mb-2">
                  Roll: {debugInfo.roll.join('')}
                </h4>
                <div className="space-y-1">
                  {debugInfo.results.map((result, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <Badge variant={result.matches ? 'default' : 'secondary'}>
                        {result.matches ? '✓' : '✗'}
                      </Badge>
                      <span className="text-sm">
                        {result.game}
                        {result.strength && (
                          <span className="ml-2 text-xs text-muted-foreground">
                            ({result.strength})
                          </span>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stats Display */}
        {selectedGames.length > 0 && (
          <div className="mb-6 p-6 bg-muted/50 rounded-lg text-center">
            <h2 className="text-3xl font-bold text-foreground mb-2">
              {successfulRolls} / 7,776
            </h2>
            <p className="text-xl text-muted-foreground">
              {percentage}% of all possible rolls
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Selected: {selectedGames.map(id => GAMES.find(g => g.id === id)?.name).join(', ')}
            </p>
          </div>
        )}
        
        {/* All Rolls Display */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>
                All Possible Rolls
                {selectedGames.length === 0 && (
                  <span className="text-sm font-normal text-muted-foreground ml-2">
                    (Select a game above to highlight matching rolls)
                  </span>
                )}
              </CardTitle>
              <ToggleGroup type="single" value={viewMode} onValueChange={handleViewModeChange}>
                <ToggleGroupItem value="all">All (7,776)</ToggleGroupItem>
                <ToggleGroupItem value="unique">Unique ({rollCounts})</ToggleGroupItem>
              </ToggleGroup>
            </div>
          </CardHeader>
          <CardContent
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              fontFamily: 'monospace',
            }}
          >
            {viewMode === 'all' ? (
              <>{allRollsView}</>
            ) : (
              <>{uniqueRollsView}</>
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
