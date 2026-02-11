import React, { useState } from 'react'
import Layout from '../components/layout'
import { Badge } from '../components/ui/badge'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { ToggleGroup, ToggleGroupItem } from '../components/ui/toggle-group'
import { Label } from '../components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../components/ui/tooltip'
import uniqueRollsData from '../data/unique-rolls.json'
import { 
  checkGame, 
  getKickerStrength,
  generateRefuserStrategy,
  generateHammerStrategy,
  gameOddsMap
} from '../lib/game-validation'

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

const StrategyAssistantPage = () => {
  const [searchRoll, setSearchRoll] = useState('')
  const [playerCount, setPlayerCount] = useState(3)
  const [testPosition, setTestPosition] = useState('hammer')
  const [testGame, setTestGame] = useState(null)
  const [selectedVariant, setSelectedVariant] = useState(null)
  const [debugInfo, setDebugInfo] = useState(null)

  const uniqueRollsArray = uniqueRollsData.uniqueRolls

  const checkSpecificRoll = () => {
    if (searchRoll.length !== 5) return
    const roll = searchRoll.split('').map(Number)
    if (roll.some(d => d < 1 || d > 6)) return
    
    const results = GAMES.map(game => {
      const matches = checkGame(roll, game.id)
      let strength = ''
      if (matches && game.hasVariants) {
        strength = getKickerStrength(roll, game.id)
      }
      return {
        game: game.name,
        matches,
        strength
      }
    })
    
    // Calculate strategy based on position
    let strategy = null
    if (testPosition === 'hammer') {
      // Generate hammer strategy
      const numOpponents = playerCount - 1
      console.log('Generating hammer strategy for roll:', roll)
      strategy = generateHammerStrategy(roll, numOpponents, gameOddsMap)
      console.log('Hammer strategy result:', strategy)
    } else if (testGame) {
      // Generate refuser strategy
      const position = testPosition === 'first-refusal' ? 'first' : 'second'
      const numOpponents = playerCount - 1
      console.log('Generating refuser strategy for roll:', roll, 'game:', testGame, 'variant:', selectedVariant, 'position:', position)
      strategy = generateRefuserStrategy(
        roll,
        testGame,
        selectedVariant,
        position,
        playerCount,
        uniqueRollsArray,
        gameOddsMap
      )
      console.log('Refuser strategy result:', strategy)
    }
    
    console.log('Setting debugInfo with strategy:', strategy)
    setDebugInfo({ roll, results, strategy })
  }

  return (
    <Layout>
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="my-8 text-center">
          <h1 className="text-4xl font-bold text-foreground">
            🎯 Strategy Assistant
          </h1>
          <p className="text-lg text-muted-foreground mt-2">
            Get personalized hammer and refusal recommendations for your roll
          </p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Strategy Assistant</CardTitle>
            <CardDescription>
              Enter your roll and position to get personalized recommendations
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Help Section - appears first on mobile, floats right on desktop */}
              <div className="lg:order-2 lg:w-80 flex-shrink-0">
                <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                  <h3 className="font-semibold text-sm">How to Use</h3>
                  <div className="flex gap-2">
                    <span className="text-lg">1️⃣</span>
                    <div>
                      <p className="font-medium text-sm">Enter Your Roll</p>
                      <p className="text-xs text-muted-foreground">Type the 5 dice you rolled</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-lg">2️⃣</span>
                    <div>
                      <p className="font-medium text-sm">Select Your Position</p>
                      <p className="text-xs text-muted-foreground">
                        <strong>Hammer:</strong> You call the game<br/>
                        <strong>First/Second Refusal:</strong> Accept or refuse the call
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-lg">3️⃣</span>
                    <div>
                      <p className="font-medium text-sm">Get Your Strategy</p>
                      <p className="text-xs text-muted-foreground">
                        Click "Analyze Roll" for recommendations
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Form Section - appears second on mobile, left on desktop */}
              <div className="lg:order-1 flex-1 space-y-4">
                {/* Roll Input */}
                <div>
                  <Label className="text-sm font-medium mb-2 block">Your Dice Roll</Label>
                  <input
                    type="text"
                    value={searchRoll}
                    onChange={(e) => setSearchRoll(e.target.value)}
                    placeholder="Enter 5 digits (e.g., 23661)"
                    maxLength={5}
                    className="w-full px-4 py-3 border-2 rounded-md bg-background text-foreground text-lg font-mono"
                  />
                </div>
                
                {/* Position Selector */}
                <div>
                  <Label className="text-sm font-medium mb-2 block">Your Position</Label>
                  <ToggleGroup type="single" value={testPosition} onValueChange={setTestPosition} className="justify-start">
                    <ToggleGroupItem value="hammer" className="px-6">
                      🔨 Hammer
                    </ToggleGroupItem>
                    <ToggleGroupItem value="first-refusal" className="px-6">
                      🥇 First Refusal
                    </ToggleGroupItem>
                    <ToggleGroupItem value="second-refusal" className="px-6">
                      🥈 Second Refusal
                    </ToggleGroupItem>
                  </ToggleGroup>
                </div>
                
                {/* Player Count */}
                <div className="flex items-center gap-4">
                  <Label className="text-sm font-medium">Players:</Label>
                  <Select value={playerCount.toString()} onValueChange={(v) => setPlayerCount(parseInt(v))}>
                    <SelectTrigger className="w-[120px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2">2</SelectItem>
                      <SelectItem value="3">3</SelectItem>
                      <SelectItem value="4">4</SelectItem>
                      <SelectItem value="5">5</SelectItem>
                      <SelectItem value="6">6</SelectItem>
                      <SelectItem value="7">7</SelectItem>
                      <SelectItem value="8">8</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Game selector for refusal positions */}
                {testPosition !== 'hammer' && (
                  <div>
                    <Label className="text-sm font-medium mb-2 block">Game Called</Label>
                    <div className="flex flex-wrap gap-2">
                      {GAMES.map(game => (
                        <Button
                          key={game.id}
                          onClick={() => setTestGame(game.id)}
                          variant={testGame === game.id ? 'default' : 'outline'}
                          size="sm"
                        >
                          {game.emoji} {game.name}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Variant selector for refusal games with variants */}
                {testPosition !== 'hammer' && testGame && GAMES.find(g => g.id === testGame)?.hasVariants && (
                  <div>
                    <Label className="text-sm font-medium mb-2 block">Variant</Label>
                    <ToggleGroup type="single" value={selectedVariant || ''} onValueChange={setSelectedVariant} className="justify-start">
                      <ToggleGroupItem value="low">Low</ToggleGroupItem>
                      <ToggleGroupItem value="high">High</ToggleGroupItem>
                    </ToggleGroup>
                  </div>
                )}

                {/* Analyze Button */}
                <div className="pt-2">
                  <Button onClick={checkSpecificRoll} size="lg" className="w-full">
                    Analyze Roll
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results Section */}
        {debugInfo && (
          <Card>
            <CardHeader>
              <CardTitle>Analysis Results: {debugInfo.roll.join('')}</CardTitle>
              <CardDescription>
                {testPosition === 'hammer' ? 'Recommended calls for your roll' : 
                 testPosition === 'first-refusal' ? 'First refusal analysis' : 
                 'Second refusal analysis'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Strategy Recommendation */}
              {debugInfo.strategy && (
                <div>
                  {testPosition === 'hammer' ? (
                    /* Hammer Strategy */
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">🔨 Recommended Strategy</h3>
                      
                      {/* Best Call */}
                      <div className="p-4 bg-primary/10 rounded-lg border-2 border-primary">
                        <div className="flex items-center gap-3 mb-3">
                          <span className="text-lg font-bold">Best Call:</span>
                          <Badge variant="default" className="text-lg px-4 py-1">
                            {debugInfo.strategy.bestCall 
                              ? `${debugInfo.strategy.bestCall.game}${debugInfo.strategy.bestCall.variant ? ` ${debugInfo.strategy.bestCall.variant}` : ''}`
                              : 'None'}
                          </Badge>
                        </div>
                        <p className="text-muted-foreground mb-4">
                          {debugInfo.strategy.bestCall?.explanation || debugInfo.strategy.summary}
                        </p>
                        <div className="grid grid-cols-3 gap-4">
                          <div className="p-3 bg-background rounded-md">
                            <div className="text-xs text-muted-foreground mb-1">Offensive Strength</div>
                            <div className="text-2xl font-bold">
                              {debugInfo.strategy.bestCall?.offensiveStrength?.toFixed(1) || '0'}%
                            </div>
                          </div>
                          <div className="p-3 bg-background rounded-md">
                            <div className="text-xs text-muted-foreground mb-1">Flexibility</div>
                            <div className="text-2xl font-bold">{debugInfo.strategy.flexibility || 0}/10</div>
                          </div>
                          <div className="p-3 bg-background rounded-md">
                            <div className="text-xs text-muted-foreground mb-1">Difficulty</div>
                            <div className="text-2xl font-bold capitalize">
                              {debugInfo.strategy.bestCall?.gameInfo?.gameDifficulty || 'N/A'}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Second & Third Best Calls */}
                      {(debugInfo.strategy.secondBestCall || debugInfo.strategy.thirdBestCall) && (
                        <div className="space-y-3">
                          <h4 className="font-semibold text-sm text-muted-foreground">Alternative Calls</h4>
                          
                          {debugInfo.strategy.secondBestCall && (
                            <div className="p-3 bg-muted/30 rounded-lg border">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge variant="secondary" className="text-sm">2nd Best</Badge>
                                <span className="font-semibold">
                                  {debugInfo.strategy.secondBestCall.game}
                                  {debugInfo.strategy.secondBestCall.variant ? ` ${debugInfo.strategy.secondBestCall.variant}` : ''}
                                </span>
                                {debugInfo.strategy.secondBestCall.kicker && (
                                  <span className="text-xs text-muted-foreground">({debugInfo.strategy.secondBestCall.kicker})</span>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground mb-2">
                                {debugInfo.strategy.secondBestCall.explanation}
                              </p>
                              <div className="flex gap-4 text-xs">
                                <span>
                                  <strong>Offensive:</strong> {debugInfo.strategy.secondBestCall.offensiveStrength.toFixed(1)}%
                                </span>
                                <span>
                                  <strong>Tie Risk:</strong> {(debugInfo.strategy.secondBestCall.tieProbability * 100).toFixed(1)}%
                                </span>
                                <span>
                                  <strong>Difficulty:</strong> {debugInfo.strategy.secondBestCall.gameInfo?.gameDifficulty || 'N/A'}
                                </span>
                              </div>
                            </div>
                          )}

                          {debugInfo.strategy.thirdBestCall && (
                            <div className="p-3 bg-muted/20 rounded-lg border">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge variant="outline" className="text-sm">3rd Best</Badge>
                                <span className="font-semibold">
                                  {debugInfo.strategy.thirdBestCall.game}
                                  {debugInfo.strategy.thirdBestCall.variant ? ` ${debugInfo.strategy.thirdBestCall.variant}` : ''}
                                </span>
                                {debugInfo.strategy.thirdBestCall.kicker && (
                                  <span className="text-xs text-muted-foreground">({debugInfo.strategy.thirdBestCall.kicker})</span>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground mb-2">
                                {debugInfo.strategy.thirdBestCall.explanation}
                              </p>
                              <div className="flex gap-4 text-xs">
                                <span>
                                  <strong>Offensive:</strong> {debugInfo.strategy.thirdBestCall.offensiveStrength.toFixed(1)}%
                                </span>
                                <span>
                                  <strong>Tie Risk:</strong> {(debugInfo.strategy.thirdBestCall.tieProbability * 100).toFixed(1)}%
                                </span>
                                <span>
                                  <strong>Difficulty:</strong> {debugInfo.strategy.thirdBestCall.gameInfo?.gameDifficulty || 'N/A'}
                                </span>
                              </div>
                            </div>
                          )}

                          {/* Rationale */}
                          <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                            <p className="text-sm font-semibold mb-2">📊 Call Order Rationale</p>
                            <p className="text-sm text-muted-foreground">
                              {debugInfo.strategy.summary || `Calls are ranked by Offensive Strength, which measures your probability of having the best hand against ${playerCount - 1} opponent${playerCount > 2 ? 's' : ''}. `}
                              {playerCount > 3 && (
                                <span className="block mt-2">
                                  <strong>Player Count Impact:</strong> With {playerCount} players ({playerCount - 1} opponents), the likelihood that someone beats you increases dramatically. 
                                  Games with high raw strength become even more valuable, as they're less likely to be matched or beaten by multiple opponents.
                                </span>
                              )}
                              {playerCount === 2 && (
                                <span className="block mt-2">
                                  <strong>Head-to-Head:</strong> With only 1 opponent, you can afford to take more risks. Focus on games where you have a strong kicker, 
                                  even if the game itself is easier to make.
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Refuser Strategy */
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">
                        {testPosition === 'first-refusal' ? '🥇 First Refusal Strategy' : '🥈 Second Refusal Strategy'}
                      </h3>
                      <div className={`p-4 rounded-lg border-2 ${
                        debugInfo.strategy.decision === 'ACCEPT' 
                          ? 'bg-green-50 dark:bg-green-950 border-green-600'
                          : debugInfo.strategy.decision === 'REFUSE'
                          ? 'bg-red-50 dark:bg-red-950 border-red-600'
                          : 'bg-yellow-50 dark:bg-yellow-950 border-yellow-600'
                      }`}>
                        <div className="flex items-center gap-3 mb-3">
                          <span className="text-lg font-bold">Recommendation:</span>
                          <Badge 
                            variant={debugInfo.strategy.decision === 'ACCEPT' ? 'default' : 'destructive'}
                            className="text-lg px-4 py-1"
                          >
                            {debugInfo.strategy.decision}
                          </Badge>
                          <span className="text-sm font-semibold">{debugInfo.strategy.confidence}% confident</span>
                        </div>
                        <div className="mb-3">
                          <p className="text-sm font-semibold mb-1">{debugInfo.strategy.reason}</p>
                          <p className="text-sm text-muted-foreground">
                            {debugInfo.strategy.details?.explanation}
                          </p>
                        </div>
                        
                        {/* Partial Match Info */}
                        {debugInfo.strategy.partialMatch && (
                          <div className="p-3 mb-3 bg-blue-100 dark:bg-blue-900 rounded-md">
                            <div className="font-semibold text-sm mb-1">Partial Match Detected:</div>
                            <p className="text-sm">{debugInfo.strategy.partialMatch.description}</p>
                            {debugInfo.strategy.details?.completeGameOdds && (
                              <p className="text-xs mt-1 text-muted-foreground">
                                Probability to complete: {debugInfo.strategy.details.completeGameOdds}
                              </p>
                            )}
                          </div>
                        )}
                        
                        <div className="grid grid-cols-3 gap-4 mb-3">
                          <div className="p-3 bg-background rounded-md">
                            <div className="text-xs text-muted-foreground mb-1">Hand Strength</div>
                            <div className="text-2xl font-bold">{debugInfo.strategy.currentStrength?.toFixed(0)}%</div>
                          </div>
                          <div className="p-3 bg-background rounded-md">
                            <div className="text-xs text-muted-foreground mb-1">Flexibility</div>
                            <div className="text-2xl font-bold">{debugInfo.strategy.flexibility}/10</div>
                          </div>
                          <div className="p-3 bg-background rounded-md">
                            <div className="text-xs text-muted-foreground mb-1">Game Difficulty</div>
                            <div className="text-2xl font-bold capitalize">{debugInfo.strategy.gameDifficulty}</div>
                          </div>
                        </div>
                        
                        {/* Second Call Predictions */}
                        {debugInfo.strategy.secondCallPredictions && (
                          <div className="pt-3 border-t border-border">
                            <div className="text-sm">
                              <span className="text-muted-foreground">Most Likely 2nd Call:</span>
                              <span className="ml-2 font-bold">{debugInfo.strategy.secondCallPredictions.topGame}</span>
                              <Badge variant="secondary" className="ml-2">
                                {debugInfo.strategy.secondCallPredictions.difficulty}
                              </Badge>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Playable Games Table - only for hammer position */}
              {testPosition === 'hammer' && debugInfo.strategy?.allRecommendations && debugInfo.strategy.allRecommendations.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">All Playable Games</h3>
                  <div className="rounded-md border">
                    <TooltipProvider>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Game</TableHead>
                            <TableHead className="text-right">
                              <Tooltip>
                                <TooltipTrigger className="cursor-help border-b border-dotted border-muted-foreground">
                                  Strength Index
                                </TooltipTrigger>
                                <TooltipContent className="max-w-xs">
                                  <p>Your hand's quality for this specific game (0-100%). Higher = better kicker or score. Does not account for game difficulty.</p>
                                </TooltipContent>
                              </Tooltip>
                            </TableHead>
                            <TableHead className="text-right">
                              <Tooltip>
                                <TooltipTrigger className="cursor-help border-b border-dotted border-muted-foreground">
                                  Offensive %
                                </TooltipTrigger>
                                <TooltipContent className="max-w-xs">
                                  <p>Probability that at least one opponent has a worse hand than you currently (accounting for {playerCount - 1} opponent{playerCount > 2 ? 's' : ''}). Higher = safer call.</p>
                                </TooltipContent>
                              </Tooltip>
                            </TableHead>
                            <TableHead className="text-right">
                              <Tooltip>
                                <TooltipTrigger className="cursor-help border-b border-dotted border-muted-foreground">
                                  Tie Risk %
                                </TooltipTrigger>
                                <TooltipContent className="max-w-xs">
                                  <p>Probability that an opponent matches your exact hand, leading to a roll-off. Based on game type and your kicker strength.</p>
                                </TooltipContent>
                              </Tooltip>
                            </TableHead>
                            <TableHead className="text-center">
                              <Tooltip>
                                <TooltipTrigger className="cursor-help border-b border-dotted border-muted-foreground">
                                  Difficulty
                                </TooltipTrigger>
                                <TooltipContent className="max-w-xs">
                                  <p>How hard it is to make this game in a single roll. Easy = high probability, Hard = low probability. Harder games are more valuable when you make them.</p>
                                </TooltipContent>
                              </Tooltip>
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                      <TableBody>
                        {debugInfo.strategy.allRecommendations.map((rec, idx) => {
                          const losePercent = 100 - rec.offensiveStrength
                          const isRecommended = idx === 0
                          return (
                            <TableRow key={idx} className={isRecommended ? 'bg-primary/5 font-semibold' : ''}>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  {isRecommended && <Badge variant="default" className="text-xs">★ Best</Badge>}
                                  <span>{rec.game}{rec.variant ? ` ${rec.variant}` : ''}</span>
                                  {rec.kicker && (
                                    <span className="text-xs text-muted-foreground">({rec.kicker})</span>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="text-right">{rec.rawStrength.toFixed(1)}%</TableCell>
                              <TableCell className="text-right font-mono">
                                {rec.offensiveStrength.toFixed(1)}%
                              </TableCell>
                              <TableCell className="text-right font-mono">
                                {(rec.tieProbability * 100).toFixed(1)}%
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge variant={
                                  rec.gameInfo?.gameDifficulty === 'easy' ? 'default' :
                                  rec.gameInfo?.gameDifficulty === 'medium' ? 'secondary' :
                                  'outline'
                                }>
                                  {rec.gameInfo?.gameDifficulty || 'N/A'}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                    </TooltipProvider>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    * Table sorted by Offensive Strength (highest first). Offensive % = probability of having the best hand vs {playerCount - 1} opponent{playerCount > 2 ? 's' : ''}.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </section>
    </Layout>
  )
}

export default StrategyAssistantPage
