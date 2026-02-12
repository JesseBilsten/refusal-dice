import React, { useState, useMemo } from 'react'
import Layout from '../components/layout'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Slider } from '../components/ui/slider'
import { analyzeRoll, getBossHandRank } from '../lib/game-validation'
import rollGameMatrix from '../data/roll-game-matrix.json'
import SecondCallDistribution from '../components/SecondCallDistribution'

// Game metadata and content
const GAME_CONTENT = {
  '10-2': {
    name: '10-2',
    emoji: '✌️',
    subtitle: 'high or low',
    description: '2 dice add up to 10 and the remaining 3 dice are either high or low.',
    partialKeep: 'You can keep dice that sum to 10 and re-roll the rest to improve your kickers. This multi-roll strategy significantly improves your odds.',
    hasVariants: true,
    variantType: 'kicker'
  },
  '10-3': {
    name: '10-3',
    emoji: '👌',
    subtitle: 'high or low',
    description: '3 dice add up to 10 and the remaining 2 dice are either high or low.',
    aka: 'Frankie',
    partialKeep: 'You can keep dice that sum to 10 and re-roll the rest to improve your kickers. This multi-roll strategy significantly improves your odds.',
    hasVariants: true,
    variantType: 'kicker'
  },
  '10-4': {
    name: '10-4',
    emoji: '🔫',
    subtitle: 'high or low',
    description: '4 dice add up to 10 and the remaining die is either high or low.',
    aka: 'Shotgun',
    partialKeep: 'You can keep dice that sum to 10 and re-roll the remaining die to improve your kicker. This multi-roll strategy significantly improves your odds.',
    hasVariants: true,
    variantType: 'kicker'
  },
  'ship-captain-crew': {
    name: 'Ship, Captain, Crew',
    emoji: '⚓️',
    subtitle: 'high or low',
    description: '3 dice make up an outside straight (4-5-6 or 1-2-3) and the remaining 2 dice are either high or low.',
    aka: 'Outside straight, Crew',
    partialKeep: 'You can keep portions of the straight and re-roll for the missing values: (1) Keep [6,5] and roll for [4], (2) Keep [1,2] and roll for [3]. With 2 remaining rolls and 3 dice to re-roll, you have much better odds than re-rolling all 5 dice. Once complete, the remaining 2 dice are your kickers. If you don\'t complete the straight after 3 rolls and you\'re the only player without the game, you get a pencil.',
    hasVariants: true,
    variantType: 'kicker'
  },
  'monterey': {
    name: 'Monterey',
    emoji: '🔄',
    subtitle: 'high or low',
    description: '3 dice make up an inside straight (2-3-4 or 3-4-5) and the remaining 2 dice are either high or low.',
    aka: 'Inside straight',
    partialKeep: 'You can keep portions of the straight: (1) Keep [2,3] and roll for [4], (2) Keep [4,5] and roll for [3], or (3) Keep [3,4] (best option!) and roll for either [2] or [5]. The [3,4] partial is most valuable because you have two ways to complete the game. With 2 remaining rolls, partial keeping significantly improves your odds versus re-rolling all dice.',
    hasVariants: true,
    variantType: 'kicker'
  },
  'vegas': {
    name: "7's",
    emoji: '🎰',
    subtitle: 'high or low',
    description: '2 sets of 2 dice add up to 7 and/or 11 and the remaining die is either high or low.',
    aka: '7-11, 7 and/or 11\'s, Vegas',
    partialKeep: 'If you roll one pair that sums to 7 (or 11), you can keep that pair and re-roll the remaining 3 dice to find another pair. This partial-keep strategy improves your chances of completing the game.',
    hasVariants: true,
    variantType: 'kicker'
  },
  'pairs': {
    name: 'Pairs',
    emoji: '🍐',
    subtitle: 'high or low',
    description: '2 sets of 2 dice are matching pairs and the remaining die is either high or low.',
    partialKeep: 'If you don\'t have 2 pairs yet but have 1 pair, keep that pair and re-roll the remaining 3 dice to find a second pair. With 2 remaining rolls, this partial-keep strategy significantly increases your chances of getting the game compared to re-rolling all 5 dice.',
    hasVariants: true,
    variantType: 'kicker'
  },
  'razzle': {
    name: 'Razzle',
    emoji: '✨',
    description: 'Most amount of any one number with aces being wild.',
    strategy: 'Call with 4 or more 6s (including 1s as wilds), or 5 of any other number. Over 3 rolls, players keeping 1s and 6s will average around 4+ wild 6s, so this threshold helps ensure you won\'t be the worst hand. Rolls with 4+ wild 6s occur approximately 50% of the time.',
    hasVariants: false
  },
  'boss': {
    name: 'Boss',
    emoji: '👑',
    description: 'Poker-style hands without straights or flushes. All players reveal their dice, and the highest hand becomes the "Boss."',
    strategy: 'Call with Three of a Kind or better (rank 4+). This gives you a 21.3% chance on first roll, and you can keep your three matching dice and re-roll the others twice to improve your hand, giving you the best chance of not being the worst hand.',
    partialKeep: 'You can keep any dice that help your poker hand and re-roll the rest. For example, with Three of a Kind, keep those three dice and re-roll the other two to try for Four/Five of a Kind or a Full House.',
    hasVariants: false
  },
  'tres-away': {
    name: 'Tres Away',
    emoji: '⛳',
    description: 'Just like golf, lowest score wins. Each die is worth its face value except for 3\'s which are worth 0 points.',
    strategy: 'Call with a score of 7 or less. Only 6.13% of rolls achieve this, making it a strong position.',
    hasVariants: false
  },
  'barking': {
    name: 'Barking',
    emoji: '🐕',
    description: 'A strategic decision to pass your turn when you have no good calls and don\'t want to risk a bluff.',
    isStrategy: true
  }
}

// Calculate cumulative probability over multiple rolls
const calculateMultiRollProbability = (singleRollPercent, numRolls) => {
  return (1 - Math.pow((100 - singleRollPercent) / 100, numRolls)) * 100
}

// Calculate single-roll probability
const calculateSingleRollProbability = (gameId) => {
  let totalCount = 0
  
  // Special handling for Razzle with threshold: 4+ wild 6s or 5+ of any other number
  if (gameId === 'razzle') {
    Object.values(rollGameMatrix).forEach(rollData => {
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
        totalCount += rollData.count || 0
      }
    })
  }
  // Special handling for Boss with threshold: 3-of-a-kind or better (rank 4+)
  else if (gameId === 'boss') {
    Object.values(rollGameMatrix).forEach(rollData => {
      const handRank = getBossHandRank(rollData.roll)
      if (handRank.rank >= 4) {
        totalCount += rollData.count || 0
      }
    })
  }
  else {
    Object.values(rollGameMatrix).forEach(rollData => {
      if (rollData.games && rollData.games.includes(gameId)) {
        totalCount += rollData.count || 0
      }
    })
  }
  
  return (totalCount / 7776) * 100
}

// Get all rolls that can play this game
const getRollsForGame = (gameId) => {
  const rolls = []
  
  // Special handling for Razzle with threshold
  if (gameId === 'razzle') {
    Object.entries(rollGameMatrix).forEach(([rollKey, rollData]) => {
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
        const analysis = analyzeRoll(rollData.roll)
        rolls.push({
          roll: rollData.roll,
          count: rollData.count,
          analysis: analysis
        })
      }
    })
  }
  // Special handling for Boss with threshold
  else if (gameId === 'boss') {
    Object.entries(rollGameMatrix).forEach(([rollKey, rollData]) => {
      const handRank = getBossHandRank(rollData.roll)
      if (handRank.rank >= 4) {
        const analysis = analyzeRoll(rollData.roll)
        rolls.push({
          roll: rollData.roll,
          count: rollData.count,
          analysis: analysis
        })
      }
    })
  }
  else {
    Object.entries(rollGameMatrix).forEach(([rollKey, rollData]) => {
      if (rollData.games && rollData.games.includes(gameId)) {
        // Analyze the roll to get variants info needed by analyzeSecondCallDistribution
        const analysis = analyzeRoll(rollData.roll)
        rolls.push({
          roll: rollData.roll,
          count: rollData.count,
          analysis: analysis
        })
      }
    })
  }
  
  return rolls
}

// Simulate rolls
const simulateRolls = (gameId, numSimulations = 1000) => {
  const results = []
  
  for (let i = 0; i < numSimulations; i++) {
    const roll = Array.from({ length: 5 }, () => Math.floor(Math.random() * 6) + 1)
    const analysis = analyzeRoll(roll)
    const gameVariant = analysis.variants?.find(v => v.game === gameId)
    
    if (gameVariant) {
      results.push({
        roll,
        strength: gameVariant.rawStrength,
        variant: gameVariant.variant,
        details: gameVariant.details
      })
    }
  }
  
  return results
}

const GameDetailTemplate = ({ pageContext }) => {
  const { gameId } = pageContext
  const gameContent = GAME_CONTENT[gameId]
  
  const [simResults, setSimResults] = useState(null)
  const [flexThreshold, setFlexThreshold] = useState([3])
  const [strengthThreshold, setStrengthThreshold] = useState([30])
  
  // Calculate probabilities
  const singleRollProb = useMemo(() => calculateSingleRollProbability(gameId), [gameId])
  const multiRollProbs = useMemo(() => ({
    rolls2: calculateMultiRollProbability(singleRollProb, 2),
    rolls3: calculateMultiRollProbability(singleRollProb, 3),
    rolls4: calculateMultiRollProbability(singleRollProb, 4),
    rolls5: calculateMultiRollProbability(singleRollProb, 5)
  }), [singleRollProb])
  
  // Get rolls for this game
  const gameRolls = useMemo(() => getRollsForGame(gameId), [gameId])
  
  // For barking page, filter weak hands
  const weakHands = useMemo(() => {
    if (gameId !== 'barking') return []
    
    const hands = []
    Object.values(rollGameMatrix).forEach(rollData => {
      const analysis = analyzeRoll(rollData.roll)
      if (analysis.flexibility <= flexThreshold[0] && 
          (!analysis.bestCall || analysis.bestCall.rawStrength <= strengthThreshold[0])) {
        hands.push({
          roll: rollData.roll,
          flexibility: analysis.flexibility,
          bestCall: analysis.bestCall,
          count: rollData.count
        })
      }
    })
    return hands.sort((a, b) => b.count - a.count)
  }, [gameId, flexThreshold, strengthThreshold])
  
  const handleSimulate = () => {
    const results = simulateRolls(gameId, 1000)
    setSimResults(results)
  }
  
  // Calculate strength distribution from simulation
  const strengthDistribution = useMemo(() => {
    if (!simResults || simResults.length === 0) return null
    
    const buckets = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0] // 0-10, 10-20, ..., 90-100
    simResults.forEach(result => {
      const bucket = Math.min(Math.floor(result.strength / 10), 9)
      buckets[bucket]++
    })
    
    return buckets.map((count, idx) => ({
      range: `${idx * 10}-${idx * 10 + 10}`,
      count,
      percent: (count / simResults.length * 100).toFixed(1)
    }))
  }, [simResults])
  
  if (!gameContent) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="text-4xl font-bold">Game Not Found</h1>
        </div>
      </Layout>
    )
  }
  
  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => typeof window !== 'undefined' && (window.location.href = '/games')}
            className="mb-4"
          >
            ← Back to Games
          </Button>
          <h1 className="text-5xl font-bold mb-3">
            {gameContent.emoji} {gameContent.name}
            {gameContent.subtitle && <small className="text-2xl text-muted-foreground ml-3">{gameContent.subtitle}</small>}
          </h1>
          {gameContent.isStrategy && <Badge variant="warning" className="mb-3">Strategy</Badge>}
          {gameContent.aka && <p className="text-muted-foreground">AKA "{gameContent.aka}"</p>}
          <p className="text-lg mt-4">{gameContent.description}</p>
          
          {/* Strategy guidance */}
          {gameContent.strategy && (
            <div className="mt-4 p-4 bg-primary/10 dark:bg-primary/20 border border-primary/20 dark:border-primary/40 rounded-lg">
              <h3 className="font-semibold text-primary dark:text-primary mb-1">When to Call</h3>
              <p className="text-base text-foreground">{gameContent.strategy}</p>
            </div>
          )}
          
          {/* Partial-keep mechanics */}
          {gameContent.partialKeep && (
            <div className="mt-4 p-4 bg-accent/50 border border-accent rounded-lg">
              <h3 className="font-semibold text-accent-foreground mb-1">Multi-Roll Strategy</h3>
              <p className="text-base text-accent-foreground/90">{gameContent.partialKeep}</p>
            </div>
          )}
        </div>
        
        {/* Barking-specific content */}
        {gameId === 'barking' && (
          <>
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>When Should You Bark?</CardTitle>
                <CardDescription>
                  Adjust the thresholds to see which hands warrant barking
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Flexibility Threshold: {flexThreshold[0]} or fewer playable games
                    </label>
                    <Slider
                      value={flexThreshold}
                      onValueChange={setFlexThreshold}
                      min={0}
                      max={10}
                      step={1}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Strength Threshold: {strengthThreshold[0]} or lower raw strength
                    </label>
                    <Slider
                      value={strengthThreshold}
                      onValueChange={setStrengthThreshold}
                      min={0}
                      max={100}
                      step={5}
                      className="w-full"
                    />
                  </div>
                  
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold mb-3">
                      Weak Hands ({weakHands.length} matching rolls, {weakHands.reduce((sum, h) => sum + h.count, 0)} total occurrences)
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
                      {weakHands.map((hand, idx) => (
                        <div key={idx} className="p-3 border rounded-lg bg-muted/20">
                          <div className="font-mono text-lg mb-1">[{hand.roll.join(', ')}]</div>
                          <div className="text-sm text-muted-foreground">
                            Flexibility: {hand.flexibility} · 
                            {hand.bestCall ? (
                              <> Best: {hand.bestCall.game}{hand.bestCall.variant ? ` (${hand.bestCall.variant})` : ''} · {Math.round(hand.bestCall.rawStrength)}</>
                            ) : (
                              <> No valid games</>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">Occurs {hand.count}× in 7,776 rolls</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
        
        {/* Regular game content */}
        {gameId !== 'barking' && (
          <>
            {/* Probability Tables */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <Card>
                <CardHeader>
                  <CardTitle>Roll Probabilities</CardTitle>
                  <CardDescription>
                    {gameId === 'razzle' 
                      ? 'Chance of getting 4+ wild 6s (1s + 6s) or 5+ of any other number'
                      : gameId === 'boss'
                      ? 'Chance of getting Three of a Kind or better (rank 4+)'
                      : 'Chance of getting this game'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">Rolls</th>
                        <th className="text-right py-2">Probability</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b">
                        <td className="py-2">1 roll</td>
                        <td className="text-right font-semibold">{singleRollProb.toFixed(1)}%</td>
                      </tr>
                      {/* Boss only has 2 rolls max */}
                      {(gameId === 'boss' || gameId === 'tres-away' || (gameId !== 'boss' && gameId !== 'tres-away')) && (
                        <tr className={gameId === 'boss' ? '' : 'border-b'}>
                          <td className="py-2">2 rolls</td>
                          <td className="text-right font-semibold">{multiRollProbs.rolls2.toFixed(1)}%</td>
                        </tr>
                      )}
                      {/* Most games show up to 3 rolls */}
                      {gameId !== 'boss' && (
                        <tr className={gameId === 'tres-away' ? 'border-b' : ''}>
                          <td className="py-2">3 rolls</td>
                          <td className="text-right font-semibold">{multiRollProbs.rolls3.toFixed(1)}%</td>
                        </tr>
                      )}
                      {/* Tres Away shows 4 and 5 rolls */}
                      {gameId === 'tres-away' && (
                        <>
                          <tr className="border-b">
                            <td className="py-2">4 rolls</td>
                            <td className="text-right font-semibold">{multiRollProbs.rolls4.toFixed(1)}%</td>
                          </tr>
                          <tr>
                            <td className="py-2">5 rolls</td>
                            <td className="text-right font-semibold">{multiRollProbs.rolls5.toFixed(1)}%</td>
                          </tr>
                        </>
                      )}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Total Matching Rolls</CardTitle>
                  <CardDescription>Out of 7,776 possible rolls</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className="text-5xl font-bold text-primary mb-2">
                      {gameRolls.reduce((sum, r) => sum + r.count, 0).toLocaleString()}
                    </div>
                    <div className="text-muted-foreground">
                      {gameRolls.length} unique roll pattern{gameRolls.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Second Call Distribution */}
            <div className="mb-8">
              <SecondCallDistribution
                gameId={gameId}
                hasVariants={gameContent.hasVariants}
                numOpponents={2}
                showTabs={true}
                title="Other Games Playable on Same Rolls"
                description={`When you can play ${gameContent.name}, what other games are available as your second call?`}
              />
            </div>
            
            {/* Simulation */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Simulate 1000 Rolls</CardTitle>
                <CardDescription>
                  See the distribution of hand strengths when rolling for {gameContent.name}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={handleSimulate} className="mb-4">
                  🎲 Run Simulation
                </Button>
                
                {simResults && (
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">
                        Got {gameContent.name} in <strong>{simResults.length}</strong> out of 1000 rolls 
                        ({(simResults.length / 10).toFixed(1)}%)
                      </p>
                    </div>
                    
                    {strengthDistribution && (
                      <>
                        <h4 className="font-semibold mt-4 mb-2">Strength Distribution</h4>
                        <div className="space-y-2">
                          {strengthDistribution.map((bucket, idx) => (
                            <div key={idx} className="flex items-center gap-3">
                              <span className="text-sm w-16">{bucket.range}</span>
                              <div className="flex-1 bg-muted rounded-full h-6 relative">
                                <div 
                                  className="bg-primary h-6 rounded-full flex items-center justify-end pr-2" 
                                  style={{ width: `${bucket.percent}%` }}
                                >
                                  {bucket.count > 0 && (
                                    <span className="text-xs text-primary-foreground font-semibold">
                                      {bucket.count}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <span className="text-sm w-12 text-right text-muted-foreground">
                                {bucket.percent}%
                              </span>
                            </div>
                          ))}
                        </div>
                        
                        <div className="mt-4">
                          <h4 className="font-semibold mb-2">Sample Results (first 10)</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {simResults.slice(0, 10).map((result, idx) => (
                              <div key={idx} className="p-2 border rounded bg-muted/20">
                                <div className="font-mono text-sm">[{result.roll.join(', ')}]</div>
                                <div className="text-xs text-muted-foreground">
                                  {result.variant && `${result.variant} · `}
                                  Strength: {Math.round(result.strength)}
                                  {result.details && ` · ${result.details}`}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Link to Rolls page */}
            <Card>
              <CardHeader>
                <CardTitle>Explore All {gameContent.name} Rolls</CardTitle>
                <CardDescription>
                  See detailed analysis of every possible roll for this game
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  variant="default" 
                  onClick={() => typeof window !== 'undefined' && (window.location.href = `/rolls?game=${gameId}&view=table`)}
                >
                  View in Rolls Table →
                </Button>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </Layout>
  )
}

export default GameDetailTemplate
