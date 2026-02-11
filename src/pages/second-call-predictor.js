import React, { useState, useMemo } from 'react'
import { graphql } from 'gatsby'
import Layout from '../components/layout'
import { Badge } from '../components/ui/badge'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Label } from '../components/ui/label'
import uniqueRollsData from '../data/unique-rolls.json'
import { analyzeSecondCallDistribution } from '../lib/game-validation'

const GAMES = [
  { id: '10-2', name: '10-2', emoji: '✌️', hasVariants: true },
  { id: '10-3', name: '10-3', emoji: '👌', hasVariants: true },
  { id: '10-4', name: '10-4', emoji: '🔫', hasVariants: true },
  { id: 'ship-captain-crew', name: 'Ship, Captain, Crew', emoji: '⚓️', hasVariants: true },
  { id: 'monterey', name: 'Monterey', emoji: '🔄', hasVariants: true },
  { id: 'vegas', name: "7's", emoji: '🎰', hasVariants: true },
  { id: 'pairs', name: 'Pairs', emoji: '🍐', hasVariants: true },
  { id: 'razzle', name: 'Razzle', emoji: '✨', hasVariants: false },
  { id: 'boss', name: 'Boss', emoji: '👑', hasVariants: false },
  { id: 'tres-away', name: 'Tres Away', emoji: '⛳', hasVariants: false },
]

const SecondCallPredictorPage = ({ data }) => {
  const [selectedGame, setSelectedGame] = useState('monterey')
  const [selectedVariant, setSelectedVariant] = useState('low')
  const [playerCount, setPlayerCount] = useState(3)

  const selectedGameObj = GAMES.find(g => g.id === selectedGame)
  const hasVariants = selectedGameObj?.hasVariants || false

  // Calculate second call distribution
  const analysis = useMemo(() => {
    const variant = hasVariants ? selectedVariant : null
    const numOpponents = playerCount - 1
    
    return analyzeSecondCallDistribution(
      selectedGame,
      variant,
      uniqueRollsData.uniqueRolls,
      numOpponents
    )
  }, [selectedGame, selectedVariant, hasVariants, playerCount])

  const distribution = analysis.secondCallDistribution || []
  const insights = analysis.insights || []

  return (
    <Layout>
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="my-8 text-center">
          <h1 className="flex items-center justify-center gap-2 text-4xl font-bold text-foreground">
            Second Call Predictor <Badge variant="warning">beta</Badge>
          </h1>
          <p className="text-lg text-muted-foreground mt-2">
            Predict the most likely second calls after a given first call
          </p>
        </div>

        {/* Selection Controls */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Select First Call</CardTitle>
            <CardDescription>
              Choose the game and variant that was called first
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="game-select">Game</Label>
                <Select value={selectedGame} onValueChange={setSelectedGame}>
                  <SelectTrigger id="game-select">
                    <SelectValue placeholder="Select game" />
                  </SelectTrigger>
                  <SelectContent>
                    {GAMES.map(game => (
                      <SelectItem key={game.id} value={game.id}>
                        {game.emoji} {game.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {hasVariants && (
                <div className="space-y-2">
                  <Label htmlFor="variant-select">Variant</Label>
                  <Select value={selectedVariant} onValueChange={setSelectedVariant}>
                    <SelectTrigger id="variant-select">
                      <SelectValue placeholder="Select variant" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="player-count">Player Count</Label>
                <Select value={playerCount.toString()} onValueChange={(v) => setPlayerCount(parseInt(v))}>
                  <SelectTrigger id="player-count">
                    <SelectValue placeholder="Players" />
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
            </div>
          </CardContent>
        </Card>

        {/* Analysis Results */}
        {analysis.error ? (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <p className="text-destructive text-center">{analysis.error}</p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Strategic Insights */}
            {insights.length > 0 && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Strategic Insights</CardTitle>
                  <CardDescription>
                    What the data tells us about calling patterns
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {insights.map((insight, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <Badge variant="outline" className="mt-0.5 shrink-0">
                          {idx + 1}
                        </Badge>
                        <span className="text-sm text-muted-foreground">{insight}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Distribution Table */}
            <Card>
              <CardHeader>
                <CardTitle>
                  Second Call Distribution for {analysis.firstCall}
                </CardTitle>
                <CardDescription>
                  Based on {analysis.totalRolls} unique rolls ({analysis.totalInstances} total instances) that can make this game
                </CardDescription>
              </CardHeader>
              <CardContent>
                {distribution.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No alternative calls found for rolls that can make {analysis.firstCall}
                  </p>
                ) : (
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
                )}
              </CardContent>
            </Card>
          </>
        )}

        {/* Explanation */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>How This Works</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Methodology</h4>
              <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                <li>Filter to all rolls that CAN make the selected first call</li>
                <li>For each roll, determine what their best alternative call would be (using hammer strategy)</li>
                <li>Aggregate the data to show which second calls are most common</li>
                <li>Calculate average offensive strength for each second call option</li>
              </ol>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">Refuser Strategy Use</h4>
              <p className="text-sm text-muted-foreground">
                Use this tool to inform your accept/refuse decision:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-4 mt-2">
                <li>If you're <strong>weak</strong> on the first call but <strong>flexible</strong> for common second calls → consider accepting</li>
                <li>If the likely second call is <strong>easier</strong> than the first → consider refusing</li>
                <li>If the likely second call is <strong>harder</strong> → consider accepting mediocre first call hands</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </section>
    </Layout>
  )
}

export default SecondCallPredictorPage

export const query = graphql`
  query {
    allFile {
      edges {
        node {
          relativePath
        }
      }
    }
  }
`
