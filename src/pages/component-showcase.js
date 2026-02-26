import React from 'react'
import Layout from '../components/layout'
import DiceDisplay from '../components/DiceDisplay'
import GameDisplay from '../components/GameDisplay'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../components/ui/card'

/**
 * COMPONENT SHOWCASE
 * 
 * Demo page to review all variants of the unified DiceDisplay and GameDisplay components
 */

const ComponentShowcasePage = () => {
  // Sample rolls for demonstration
  const sampleRolls = {
    highRoll: [6, 6, 6, 5, 4],
    mediumRoll: [4, 4, 3, 2, 1],
    lowRoll: [1, 2, 2, 3, 3],
    mixedRoll: [6, 5, 4, 3, 2],
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-block px-3 py-1 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-full text-sm font-semibold mb-4">
            Development Only
          </div>
          <h1 className="text-4xl font-bold mb-3 text-foreground">Component Showcase</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Review all variants of the unified DiceDisplay and GameDisplay components
          </p>
        </div>

        {/* DiceDisplay Sizes */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-6 text-foreground">DiceDisplay - Size Variants</h2>
          
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Extra Small (xs) - 16px</CardTitle>
              <CardDescription>For dense grids like the Odds page where space is critical</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-8 flex-wrap">
                <DiceDisplay roll={sampleRolls.highRoll} size="xs" />
                <DiceDisplay roll={sampleRolls.mediumRoll} size="xs" />
                <DiceDisplay roll={sampleRolls.lowRoll} size="xs" />
              </div>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Small (sm) - 24px</CardTitle>
              <CardDescription>For inline use with text or compact references</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-8 flex-wrap">
                <DiceDisplay roll={sampleRolls.highRoll} size="sm" />
                <DiceDisplay roll={sampleRolls.mediumRoll} size="sm" />
                <DiceDisplay roll={sampleRolls.lowRoll} size="sm" />
              </div>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Medium (md) - 32px (Default)</CardTitle>
              <CardDescription>Standard size for most page content (Practice, Games)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-8 flex-wrap">
                <DiceDisplay roll={sampleRolls.highRoll} size="md" />
                <DiceDisplay roll={sampleRolls.mediumRoll} size="md" />
                <DiceDisplay roll={sampleRolls.lowRoll} size="md" />
              </div>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Large (lg) - 48px</CardTitle>
              <CardDescription>For hero sections and prominent displays (Homepage)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-8 flex-wrap">
                <DiceDisplay roll={sampleRolls.highRoll} size="lg" />
                <DiceDisplay roll={sampleRolls.mediumRoll} size="lg" />
                <DiceDisplay roll={sampleRolls.lowRoll} size="lg" />
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Locked Dice Feature */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-6 text-foreground">DiceDisplay - Locked Dice</h2>
          <p className="text-muted-foreground mb-6">
            Visual indication of locked vs. rerollable dice. Locked dice have background tint, unlocked are dimmed.
          </p>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Locked First Three (Game Portion)</CardTitle>
              <CardDescription>Showing a completed game with locked dice and rerollable kicker</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-6">
                <div className="flex items-center gap-4">
                  <span className="text-sm text-muted-foreground w-20">Size lg:</span>
                  <DiceDisplay roll={[4, 6, 5, 3, 1]} size="lg" lockedIndices={[0, 1, 2]} />
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-muted-foreground w-20">Size md:</span>
                  <DiceDisplay roll={[4, 6, 5, 3, 1]} size="md" lockedIndices={[0, 1, 2]} />
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-muted-foreground w-20">Size sm:</span>
                  <DiceDisplay roll={[4, 6, 5, 3, 1]} size="sm" lockedIndices={[0, 1, 2]} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Multiple Locked Groups</CardTitle>
              <CardDescription>Non-contiguous locked portions are grouped separately</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-6">
                <div className="flex items-center gap-4">
                  <span className="text-sm text-muted-foreground w-32">Indices 0, 1, 4:</span>
                  <DiceDisplay roll={[6, 6, 3, 2, 5]} size="md" lockedIndices={[0, 1, 4]} />
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-muted-foreground w-32">Indices 1, 3:</span>
                  <DiceDisplay roll={[2, 5, 3, 5, 1]} size="md" lockedIndices={[1, 3]} />
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Odds Display Feature */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-6 text-foreground">DiceDisplay - With Odds</h2>
          <p className="text-muted-foreground mb-6">
            Optional odds information displayed below the dice roll
          </p>

          <Card>
            <CardHeader>
              <CardTitle>Odds of Improvement</CardTitle>
              <CardDescription>Shows probability information for strategic decision-making</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-6">
                <DiceDisplay 
                  roll={[4, 4, 3, 2, 1]} 
                  size="md" 
                  showOdds 
                  oddsData={{
                    description: "Odds of getting 10-2",
                    probability: 0.234
                  }}
                />
                <DiceDisplay 
                  roll={[6, 6, 5, 3, 1]} 
                  size="md" 
                  lockedIndices={[0, 1, 2]}
                  showOdds 
                  oddsData={{
                    description: "Odds of improving kicker",
                    probability: 0.417
                  }}
                />
              </div>
            </CardContent>
          </Card>
        </section>

        {/* GameDisplay - Card Style */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-6 text-foreground">GameDisplay - Card Style</h2>
          <p className="text-muted-foreground mb-6">
            Compact card format for game selection grids (Practice, Odds pages)
          </p>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Basic Cards</CardTitle>
              <CardDescription>Default card style with emoji and name</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <GameDisplay gameId="10-2" displayStyle="card" />
                <GameDisplay gameId="ship-captain-crew" displayStyle="card" />
                <GameDisplay gameId="razzle" displayStyle="card" />
                <GameDisplay gameId="boss" displayStyle="card" />
              </div>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Selected State</CardTitle>
              <CardDescription>Visual indication of selected games</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <GameDisplay gameId="10-2" variant="high" displayStyle="card" selected />
                <GameDisplay gameId="ship-captain-crew" displayStyle="card" />
                <GameDisplay gameId="razzle" displayStyle="card" selected />
                <GameDisplay gameId="boss" displayStyle="card" />
              </div>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>With Strength Indicators</CardTitle>
              <CardDescription>Rarity-based strength tiers using gaming colors</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                <div>
                  <GameDisplay 
                    gameId="10-2" 
                    displayStyle="card" 
                    showStrength 
                    strengthValue={95}
                  />
                  <p className="text-xs text-center mt-2 text-legendary-foreground">Legendary (90-100)</p>
                </div>
                <div>
                  <GameDisplay 
                    gameId="10-3" 
                    displayStyle="card" 
                    showStrength 
                    strengthValue={82}
                  />
                  <p className="text-xs text-center mt-2 text-epic-foreground">Epic (75-89)</p>
                </div>
                <div>
                  <GameDisplay 
                    gameId="vegas" 
                    displayStyle="card" 
                    showStrength 
                    strengthValue={65}
                  />
                  <p className="text-xs text-center mt-2 text-rare-foreground">Rare (50-74)</p>
                </div>
                <div>
                  <GameDisplay 
                    gameId="pairs" 
                    displayStyle="card" 
                    showStrength 
                    strengthValue={42}
                  />
                  <p className="text-xs text-center mt-2 text-uncommon-foreground">Uncommon (25-49)</p>
                </div>
                <div>
                  <GameDisplay 
                    gameId="monterey" 
                    displayStyle="card" 
                    showStrength 
                    strengthValue={18}
                  />
                  <p className="text-xs text-center mt-2 text-common-foreground">Common (0-24)</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Compact Variant</CardTitle>
              <CardDescription>Smaller padding for dense layouts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                <GameDisplay gameId="10-2" displayStyle="card" compact />
                <GameDisplay gameId="10-3" displayStyle="card" compact />
                <GameDisplay gameId="10-4" displayStyle="card" compact />
                <GameDisplay gameId="vegas" displayStyle="card" compact />
                <GameDisplay gameId="pairs" displayStyle="card" compact />
                <GameDisplay gameId="razzle" displayStyle="card" compact />
              </div>
            </CardContent>
          </Card>
        </section>

        {/* GameDisplay - Slat Style */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-6 text-foreground">GameDisplay - Slat Style</h2>
          <p className="text-muted-foreground mb-6">
            Horizontal card format for detailed game information (Games page)
          </p>

          <div className="space-y-6">
            <GameDisplay 
              gameId="10-2" 
              variant="high"
              displayStyle="slat"
              showStrength
              strengthValue={85}
              showNavigation
              metadata={{
                description: "Two dice sum to 10, remaining three are your kicker",
                probability: 0.21,
                playable: true
              }}
            >
              <div className="flex flex-col gap-2">
                <p className="text-sm text-muted-foreground">Example rolls:</p>
                <div className="flex gap-2">
                  <DiceDisplay roll={[4, 6, 6, 6, 5]} size="sm" />
                </div>
                <div className="flex gap-2">
                  <DiceDisplay roll={[5, 5, 6, 5, 4]} size="sm" />
                </div>
              </div>
            </GameDisplay>

            <GameDisplay 
              gameId="razzle" 
              displayStyle="slat"
              showStrength
              strengthValue={72}
              showNavigation
              metadata={{
                description: "1s are wild and count toward any number",
                probability: 0.21,
                playable: true
              }}
            >
              <div className="flex flex-col gap-2">
                <p className="text-sm text-muted-foreground">Best hands:</p>
                <div className="flex gap-2">
                  <DiceDisplay roll={[1, 1, 6, 6, 6]} size="sm" />
                </div>
                <div className="flex gap-2">
                  <DiceDisplay roll={[1, 6, 6, 6, 6]} size="sm" />
                </div>
              </div>
            </GameDisplay>

            <GameDisplay 
              gameId="boss" 
              displayStyle="slat"
              showStrength
              strengthValue={58}
              metadata={{
                description: "Poker-style hands: pairs, trips, full house, etc.",
                probability: 0.444
              }}
            />
          </div>
        </section>

        {/* Interactive Example */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-6 text-foreground">Interactive States</h2>
          <p className="text-muted-foreground mb-6">
            Hover and click these cards to see interactive states
          </p>

          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <GameDisplay 
                  gameId="10-2" 
                  displayStyle="card" 
                  onClick={() => alert('Clicked 10-2!')}
                />
                <GameDisplay 
                  gameId="vegas" 
                  displayStyle="card" 
                  showStrength
                  strengthValue={88}
                  onClick={() => alert('Clicked Vegas!')}
                />
                <GameDisplay 
                  gameId="razzle" 
                  displayStyle="card" 
                  selected
                  onClick={() => alert('Clicked Razzle!')}
                />
                <GameDisplay 
                  gameId="boss" 
                  displayStyle="card" 
                  compact
                  onClick={() => alert('Clicked Boss!')}
                />
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Size Comparison */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-6 text-foreground">All Sizes Side-by-Side</h2>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-end gap-8 flex-wrap justify-center">
                <div className="flex flex-col items-center gap-2">
                  <DiceDisplay roll={[6, 5, 4, 3, 2]} size="xs" />
                  <span className="text-xs text-muted-foreground">xs (16px)</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <DiceDisplay roll={[6, 5, 4, 3, 2]} size="sm" />
                  <span className="text-xs text-muted-foreground">sm (24px)</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <DiceDisplay roll={[6, 5, 4, 3, 2]} size="md" />
                  <span className="text-xs text-muted-foreground">md (32px)</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <DiceDisplay roll={[6, 5, 4, 3, 2]} size="lg" />
                  <span className="text-xs text-muted-foreground">lg (48px)</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Footer */}
        <div className="text-center text-muted-foreground text-sm py-8 border-t">
          <p>Component showcase for development and review purposes</p>
          <p className="mt-2">Navigate to <code className="bg-muted px-1 py-0.5 rounded">/</code> (home), <code className="bg-muted px-1 py-0.5 rounded">/practice</code>, or other pages to see components in context</p>
        </div>
      </div>
    </Layout>
  )
}

export default ComponentShowcasePage
