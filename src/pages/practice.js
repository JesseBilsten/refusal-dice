import React, { useState, useMemo, useCallback } from 'react'
import { Link } from 'gatsby'
import Layout from '../components/layout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Alert, AlertDescription } from '../components/ui/alert'
import Die from '../components/Die'
import GameLink from '../components/GameLink'
import uniqueRollsData from '../data/unique-rolls.json'
import { GAMES, GAMES_MAP, SPECIALTY_THRESHOLDS, isSpecialtyGame } from '../lib/games-config'
import { checkGame, generateHammerStrategy, gameOddsMap, isCompetitiveSpecialtyHand, getKickerStrength } from '../lib/game-validation'
import { Check, X, Trophy, Target, RefreshCw, Lightbulb } from 'lucide-react'

/**
 * GAME RECOGNITION TRAINER
 * 
 * Tests the player's ability to identify valid games in a roll
 * and compare their choices to optimal strategy.
 */

const PracticePage = () => {
  // Game state
  const [currentRoll, setCurrentRoll] = useState(null)
  // selectedGames is now a Map: gameId -> variant ('high'|'low'|null for no variant selected yet)
  const [selectedGames, setSelectedGames] = useState(new Map())
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const [score, setScore] = useState({ correct: 0, total: 0, streak: 0 })
  
  // Generate initial roll on mount
  React.useEffect(() => {
    generateNewRoll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  
  // Generate a random roll from the unique rolls dataset
  const generateNewRoll = useCallback(() => {
    const randomIndex = Math.floor(Math.random() * uniqueRollsData.uniqueRolls.length)
    const rollData = uniqueRollsData.uniqueRolls[randomIndex]
    const roll = rollData.roll // Already an array of numbers
    setCurrentRoll(roll)
    setSelectedGames(new Map())
    setHasSubmitted(false)
  }, [])
  
  // Calculate which games are actually valid for this roll
  // For specialty games (Boss, Razzle, Tres Away), apply competitive thresholds
  // Returns a Map: gameId -> variant ('high'|'low' for games with variants, true for games without)
  const validGames = useMemo(() => {
    if (!currentRoll) return new Map()
    
    const valid = new Map()
    GAMES.forEach(game => {
      if (checkGame(currentRoll, game.id)) {
        // For specialty games, check if they meet the competitive threshold
        if (isSpecialtyGame(game.id)) {
          if (isCompetitiveSpecialtyHand(currentRoll, game.id, SPECIALTY_THRESHOLDS)) {
            valid.set(game.id, true) // No variants for specialty games
          }
        } else {
          // Regular games: if it's valid, check variant
          if (game.hasVariants) {
            const variant = getKickerStrength(currentRoll, game.id)
            valid.set(game.id, variant) // Store the correct variant
          } else {
            valid.set(game.id, true) // No variants
          }
        }
      }
    })
    return valid
  }, [currentRoll])
  
  // Get optimal strategy recommendation
  const optimalStrategy = useMemo(() => {
    if (!currentRoll) return null
    try {
      return generateHammerStrategy(currentRoll, 2, gameOddsMap, {})
    } catch (e) {
      console.error('Error generating strategy:', e)
      return null
    }
  }, [currentRoll])
  
  // Helper to explain why a specialty game isn't competitive
  const getThresholdExplanation = useCallback((gameId) => {
    if (!currentRoll || !isSpecialtyGame(gameId)) return null
    
    // Check if the game is technically valid but not competitive
    if (!checkGame(currentRoll, gameId)) return null
    
    if (gameId === 'boss') {
      // Get the actual hand rank
      // Boss rank: 1=high card, 2=pair, 3=two pair, 4=trips, 5=full house, 6=four of a kind, 7=five of a kind
      const counts = currentRoll.reduce((acc, num) => {
        acc[num] = (acc[num] || 0) + 1
        return acc
      }, {})
      const sortedCounts = Object.values(counts).sort((a, b) => b - a)
      
      let handName = 'High Card'
      if (sortedCounts[0] === 5) handName = 'Five of a Kind'
      else if (sortedCounts[0] === 4) handName = 'Four of a Kind'
      else if (sortedCounts[0] === 3 && sortedCounts[1] === 2) handName = 'Full House'
      else if (sortedCounts[0] === 3) handName = 'Three of a Kind'
      else if (sortedCounts[0] === 2 && sortedCounts[1] === 2) handName = 'Two Pair'
      else if (sortedCounts[0] === 2) handName = 'Pair'
      
      return `${handName}. Boss requires at least Two Pair to be competitive.`
    }
    
    if (gameId === 'razzle') {
      const wildSixes = currentRoll.filter(d => d === 1 || d === 6).length
      return `Only ${wildSixes} wild six${wildSixes === 1 ? '' : 'es'} (1s and 6s). Razzle requires at least 3 to be competitive.`
    }
    
    if (gameId === 'tres-away') {
      const score = currentRoll.filter(d => d !== 3).reduce((sum, d) => sum + d, 0)
      return `Score of ${score}. Tres Away requires a score of 10 or less to be competitive.`
    }
    
    return null
  }, [currentRoll])
  
  // Toggle game selection
  const toggleGame = useCallback((gameId) => {
    if (hasSubmitted) return // Don't allow changes after submit
    
    const game = GAMES.find(g => g.id === gameId)
    
    setSelectedGames(prev => {
      const next = new Map(prev)
      if (next.has(gameId)) {
        next.delete(gameId)
      } else {
        // Add game, default to null variant (player must select high/low if applicable)
        next.set(gameId, null)
      }
      return next
    })
  }, [hasSubmitted])
  
  // Set variant for a selected game
  const setGameVariant = useCallback((gameId, variant) => {
    if (hasSubmitted) return
    
    setSelectedGames(prev => {
      const next = new Map(prev)
      if (next.has(gameId)) {
        next.set(gameId, variant)
      }
      return next
    })
  }, [hasSubmitted])
  
  // Calculate score when submitted
  const results = useMemo(() => {
    if (!hasSubmitted || !currentRoll) return null
    
    // Check each selected game
    const correctlyIdentified = []
    const incorrect = []
    const wrongVariant = []
    
    for (const [gameId, selectedVariant] of selectedGames) {
      if (!validGames.has(gameId)) {
        // Game doesn't exist for this roll at all
        incorrect.push({ gameId, selectedVariant })
      } else {
        const correctVariant = validGames.get(gameId)
        const game = GAMES.find(g => g.id === gameId)
        
        if (game.hasVariants) {
          // Games with variants need exact variant match
          if (selectedVariant === correctVariant) {
            correctlyIdentified.push({ gameId, selectedVariant })
          } else if (selectedVariant === null) {
            // They selected the game but didn't pick a variant
            wrongVariant.push({ gameId, selectedVariant, correctVariant })
          } else {
            // Wrong variant
            wrongVariant.push({ gameId, selectedVariant, correctVariant })
          }
        } else {
          // Games without variants just need to be selected
          correctlyIdentified.push({ gameId, selectedVariant: null })
        }
      }
    }
    
    // Find missed games
    const missed = []
    for (const [gameId, correctVariant] of validGames) {
      if (!selectedGames.has(gameId)) {
        missed.push({ gameId, correctVariant })
      }
    }
    
    const accuracy = validGames.size === 0 && selectedGames.size === 0 ? 100 :
                     validGames.size === 0 ? 0 :
                     (correctlyIdentified.length / validGames.size) * 100
    
    const perfect = missed.length === 0 && incorrect.length === 0 && wrongVariant.length === 0
    
    return {
      correctlyIdentified,
      missed,
      incorrect,
      wrongVariant,
      accuracy: Math.round(accuracy),
      perfect,
      totalValid: validGames.size
    }
  }, [hasSubmitted, currentRoll, selectedGames, validGames])
  
  // Submit answers
  const handleSubmit = useCallback(() => {
    setHasSubmitted(true)
    
    // Update score
    setScore(prev => {
      const perfect = results?.perfect || false
      return {
        correct: prev.correct + (perfect ? 1 : 0),
        total: prev.total + 1,
        streak: perfect ? prev.streak + 1 : 0
      }
    })
  }, [results])
  
  // Next roll
  const handleNext = useCallback(() => {
    generateNewRoll()
  }, [generateNewRoll])
  
  if (!currentRoll) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-4 py-12 text-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </Layout>
    )
  }
  
  return (
    <Layout>
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-block px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-semibold mb-4">
            Practice Mode
          </div>
          <h1 className="text-4xl font-bold mb-3 text-foreground">Game Recognition Trainer</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Test your ability to identify competitive games and learn optimal strategy
          </p>
        </div>
        
        {/* Score Card */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-wrap items-center justify-center gap-6 text-center">
              <div>
                <div className="text-2xl font-bold text-foreground">
                  {score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0}%
                </div>
                <div className="text-xs text-muted-foreground">Accuracy</div>
              </div>
              <div className="h-8 w-px bg-border" />
              <div>
                <div className="text-2xl font-bold text-foreground">{score.correct}/{score.total}</div>
                <div className="text-xs text-muted-foreground">Perfect Rounds</div>
              </div>
              <div className="h-8 w-px bg-border" />
              <div>
                <div className="text-2xl font-bold text-legendary-foreground">{score.streak}</div>
                <div className="text-xs text-muted-foreground">Current Streak</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Dice Display */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Current Roll</span>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={hasSubmitted ? handleNext : generateNewRoll}
                className="gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                {hasSubmitted ? 'Next Roll' : 'New Roll'}
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center gap-3 sm:gap-4">
              {currentRoll.map((die, idx) => (
                <Die key={idx} number={die} />
              ))}
            </div>
          </CardContent>
        </Card>
        
        {/* Game Selection */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Which games can you call?</CardTitle>
            <CardDescription>
              Select all competitive games and their variants (high/low). Boss needs 2+ pair, Razzle needs 3+ wild sixes, Tres Away needs score ≤10.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {GAMES.map(game => {
                const isSelected = selectedGames.has(game.id)
                const selectedVariant = selectedGames.get(game.id)
                const isValid = validGames.has(game.id)
                const correctVariant = validGames.get(game.id)
                const showResult = hasSubmitted
                
                let bgClass = 'bg-muted/30 hover:bg-muted/50'
                let borderClass = 'border-2 border-transparent'
                let resultIcon = null
                
                if (showResult) {
                  // Check if correct
                  const isCorrect = isSelected && isValid && 
                    (!game.hasVariants || selectedVariant === correctVariant)
                  const isWrongVariant = isSelected && isValid && game.hasVariants && 
                    selectedVariant !== null && selectedVariant !== correctVariant
                  const isMissingVariant = isSelected && isValid && game.hasVariants && 
                    selectedVariant === null
                  
                  if (isCorrect) {
                    bgClass = 'bg-uncommon/20'
                    borderClass = 'border-2 border-uncommon-border'
                    resultIcon = <Check className="w-5 h-5 text-uncommon-foreground" />
                  } else if (isSelected && !isValid) {
                    bgClass = 'bg-destructive/10'
                    borderClass = 'border-2 border-destructive'
                    resultIcon = <X className="w-5 h-5 text-destructive" />
                  } else if (isWrongVariant || isMissingVariant) {
                    bgClass = 'bg-amber-500/10'
                    borderClass = 'border-2 border-amber-500/50'
                    resultIcon = <X className="w-5 h-5 text-amber-600" />
                  } else if (!isSelected && isValid) {
                    bgClass = 'bg-amber-500/10'
                    borderClass = 'border-2 border-amber-500/50'
                    resultIcon = <Target className="w-5 h-5 text-amber-600" />
                  }
                } else if (isSelected) {
                  bgClass = 'bg-primary/20'
                  borderClass = 'border-2 border-primary'
                }
                
                return (
                  <div key={game.id} className="flex flex-col gap-2">
                    <button
                      onClick={() => toggleGame(game.id)}
                      disabled={hasSubmitted}
                      className={`
                        ${bgClass} ${borderClass}
                        rounded-lg p-4 text-center transition-all
                        ${hasSubmitted ? 'cursor-default' : 'cursor-pointer hover:scale-105'}
                        relative
                      `}
                    >
                      <div className="text-3xl mb-2">{game.emoji}</div>
                      <div className="text-sm font-semibold">{game.name}</div>
                      {showResult && resultIcon && (
                        <div className="absolute top-1 right-1">
                          {resultIcon}
                        </div>
                      )}
                    </button>
                    
                    {/* Variant selector for selected games with variants */}
                    {isSelected && game.hasVariants && !hasSubmitted && (
                      <div className="flex gap-1 justify-center">
                        <button
                          onClick={() => setGameVariant(game.id, 'high')}
                          className={`
                            px-2 py-1 text-xs rounded transition-colors
                            ${selectedVariant === 'high' 
                              ? 'bg-primary text-primary-foreground' 
                              : 'bg-muted hover:bg-muted/80'}
                          `}
                        >
                          High
                        </button>
                        <button
                          onClick={() => setGameVariant(game.id, 'low')}
                          className={`
                            px-2 py-1 text-xs rounded transition-colors
                            ${selectedVariant === 'low' 
                              ? 'bg-primary text-primary-foreground' 
                              : 'bg-muted hover:bg-muted/80'}
                          `}
                        >
                          Low
                        </button>
                      </div>
                    )}
                    
                    {/* Show correct variant after submission */}
                    {isSelected && game.hasVariants && hasSubmitted && (
                      <div className="text-center text-xs">
                        {selectedVariant && (
                          <span className={
                            selectedVariant === correctVariant 
                              ? 'text-uncommon-foreground' 
                              : 'text-destructive'
                          }>
                            You: {selectedVariant}
                          </span>
                        )}
                        {selectedVariant !== correctVariant && correctVariant && (
                          <span className="text-amber-600 block">
                            ✓ {correctVariant}
                          </span>
                        )}
                      </div>
                    )}
                    
                    {/* Show correct variant for missed games */}
                    {!isSelected && isValid && game.hasVariants && hasSubmitted && correctVariant && (
                      <div className="text-center text-xs text-amber-600">
                        ✓ {correctVariant}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
            
            {!hasSubmitted && (
              <div className="mt-6 flex flex-col items-center gap-2">
                <Button 
                  onClick={handleSubmit} 
                  size="lg"
                  disabled={
                    selectedGames.size === 0 || 
                    // Check if any selected games with variants don't have a variant selected
                    Array.from(selectedGames.entries()).some(([gameId, variant]) => {
                      const game = GAMES.find(g => g.id === gameId)
                      return game.hasVariants && variant === null
                    })
                  }
                  className="gap-2"
                >
                  <Check className="w-5 h-5" />
                  Submit Answer
                </Button>
                {Array.from(selectedGames.entries()).some(([gameId, variant]) => {
                  const game = GAMES.find(g => g.id === gameId)
                  return game.hasVariants && variant === null
                }) && (
                  <p className="text-xs text-amber-600">
                    Select high/low for games with variants before submitting
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Results & Feedback */}
        {hasSubmitted && results && (
          <>
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {results.perfect ? (
                    <>
                      <Trophy className="w-6 h-6 text-legendary-foreground" />
                      <span>Perfect! 🎉</span>
                    </>
                  ) : (
                    <>
                      <Target className="w-6 h-6" />
                      <span>Results</span>
                    </>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-foreground mb-2">
                    {results.accuracy}%
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Identified {results.correctlyIdentified.length} of {results.totalValid} competitive games
                  </div>
                </div>
                
                {results.missed.length > 0 && (
                  <Alert className="bg-amber-500/10 border-amber-500/50">
                    <Target className="w-4 h-4 text-amber-600" />
                    <AlertDescription>
                      <div className="font-semibold mb-2">Missed Games:</div>
                      <div className="space-y-1">
                        {results.missed.map(({ gameId, correctVariant }) => (
                          <div key={gameId} className="flex items-center gap-2">
                            <Badge variant="outline" className="border-amber-500/50">
                              {GAMES_MAP[gameId].emoji} {GAMES_MAP[gameId].name}
                              {correctVariant !== true && ` (${correctVariant})`}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </AlertDescription>
                  </Alert>
                )}
                
                {results.wrongVariant.length > 0 && (
                  <Alert className="bg-amber-500/10 border-amber-500/50">
                    <X className="w-4 h-4 text-amber-600" />
                    <AlertDescription>
                      <div className="font-semibold mb-2">Wrong Variant:</div>
                      <div className="space-y-1">
                        {results.wrongVariant.map(({ gameId, selectedVariant, correctVariant }) => (
                          <div key={gameId} className="text-sm">
                            <Badge variant="outline" className="border-amber-500/50">
                              {GAMES_MAP[gameId].emoji} {GAMES_MAP[gameId].name}
                            </Badge>
                            <span className="text-muted-foreground ml-2">
                              You chose <span className="font-semibold">{selectedVariant || 'none'}</span>, 
                              correct is <span className="font-semibold text-amber-600">{correctVariant}</span>
                            </span>
                          </div>
                        ))}
                      </div>
                    </AlertDescription>
                  </Alert>
                )}
                
                {results.incorrect.length > 0 && (
                  <Alert className="bg-destructive/10 border-destructive">
                    <X className="w-4 h-4 text-destructive" />
                    <AlertDescription>
                      <div className="font-semibold mb-2">Incorrect Selections:</div>
                      <div className="space-y-2">
                        {results.incorrect.map(({ gameId, selectedVariant }) => {
                          const explanation = getThresholdExplanation(gameId)
                          return (
                            <div key={gameId} className="flex items-start gap-2">
                              <Badge variant="outline" className="border-destructive shrink-0">
                                {GAMES_MAP[gameId].emoji} {GAMES_MAP[gameId].name}
                                {selectedVariant && ` (${selectedVariant})`}
                              </Badge>
                              {explanation && (
                                <span className="text-xs text-muted-foreground">
                                  {explanation}
                                </span>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </AlertDescription>
                  </Alert>
                )}
                
                {results.perfect && (
                  <Alert className="bg-uncommon/20 border-uncommon-border">
                    <Trophy className="w-4 h-4 text-uncommon-foreground" />
                    <AlertDescription>
                      You correctly identified all competitive games! Keep up the streak.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
            
            {/* Optimal Strategy */}
            {optimalStrategy && optimalStrategy.bestCall && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="w-5 h-5 text-rare-foreground" />
                    Optimal Strategy
                  </CardTitle>
                  <CardDescription>
                    What an expert player would call with this roll
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-primary/5 rounded-lg p-4 border-2 border-primary/20">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{GAMES_MAP[optimalStrategy.bestCall.game].emoji}</span>
                        <div>
                          <div className="font-semibold text-lg">
                            <GameLink id={optimalStrategy.bestCall.game}>
                              {GAMES_MAP[optimalStrategy.bestCall.game].name}
                            </GameLink>
                            {optimalStrategy.bestCall.variant && (
                              <span className="text-muted-foreground ml-1">
                                ({optimalStrategy.bestCall.variant})
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Best call for this roll
                          </div>
                        </div>
                      </div>
                      <Badge className="bg-legendary text-legendary-foreground border-legendary-border">
                        #{1}
                      </Badge>
                    </div>
                    {optimalStrategy.bestCall.explanation && (
                      <p className="text-sm text-muted-foreground mt-2">
                        {optimalStrategy.bestCall.explanation}
                      </p>
                    )}
                  </div>
                  
                  {optimalStrategy.allRecommendations.length > 1 && (
                    <div>
                      <div className="text-sm font-semibold mb-2 text-muted-foreground">
                        Other Options:
                      </div>
                      <div className="space-y-2">
                        {optimalStrategy.allRecommendations.slice(1, 4).map((rec, idx) => (
                          <div key={rec.game + rec.variant} className="bg-muted/30 rounded-lg p-3 text-sm">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span>{GAMES_MAP[rec.game].emoji}</span>
                                <div>
                                  <GameLink id={rec.game}>
                                    {GAMES_MAP[rec.game].name}
                                  </GameLink>
                                  {rec.variant && (
                                    <span className="text-muted-foreground ml-1">
                                      ({rec.variant})
                                    </span>
                                  )}
                                </div>
                              </div>
                              <Badge variant="outline">#{idx + 2}</Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
            
            <div className="flex justify-center">
              <Button onClick={handleNext} size="lg" className="gap-2">
                <RefreshCw className="w-5 h-5" />
                Next Roll
              </Button>
            </div>
          </>
        )}
        
        {/* Resources */}
        <div className="mt-12 bg-muted/30 rounded-lg p-6 sm:p-8">
          <h2 className="text-xl font-semibold mb-4">Learn More</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            <Link to="/games">
              <Button variant="outline" className="w-full h-auto py-4 px-4 text-left flex flex-col items-start">
                <span className="text-base font-semibold mb-1">🎲 Game Reference</span>
                <span className="text-xs text-muted-foreground">Study all 10 games</span>
              </Button>
            </Link>
            
            <Link to="/strategy-assistant">
              <Button variant="outline" className="w-full h-auto py-4 px-4 text-left flex flex-col items-start">
                <span className="text-base font-semibold mb-1">🎯 Strategy Assistant</span>
                <span className="text-xs text-muted-foreground">Real-time recommendations</span>
              </Button>
            </Link>
            
            <Link to="/rules">
              <Button variant="outline" className="w-full h-auto py-4 px-4 text-left flex flex-col items-start">
                <span className="text-base font-semibold mb-1">📚 Rules</span>
                <span className="text-xs text-muted-foreground">Full game rules</span>
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </Layout>
  )
}

export default PracticePage
