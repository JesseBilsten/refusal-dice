import React, { useState } from 'react'
import { graphql } from 'gatsby'
import Layout from '../components/layout'
import { Badge } from '../components/ui/badge'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../components/ui/card'
import { Label } from '../components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import SecondCallDistribution from '../components/SecondCallDistribution'

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
        <SecondCallDistribution
          gameId={selectedGame}
          hasVariants={hasVariants}
          variant={hasVariants ? selectedVariant : null}
          numOpponents={playerCount - 1}
          showTabs={false}
          title={`Second Call Distribution for ${selectedGame}${hasVariants && selectedVariant ? ` (${selectedVariant})` : ''}`}
        />

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
