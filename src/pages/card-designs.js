import React from "react"
import Die from "../components/Die"
import { getRarityTier } from "../lib/component-helpers"

const CardDesignsPage = () => {
  // Prevent SSR issues - only render on client
  const [mounted, setMounted] = React.useState(false)
  
  React.useEffect(() => {
    setMounted(true)
  }, [])
  
  if (!mounted) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Game Card Design Variants</h1>
          <p className="text-muted-foreground text-lg">Loading...</p>
        </div>
      </div>
    )
  }
  
  // Helper component for dice group with label
  const DiceGroup = ({ dice, label, rarity, isEmpty = false }) => {
    return (
      <div className="flex flex-col gap-1.5">
        <div className="flex gap-1.5">
          {dice.map((dieValue, idx) => (
            <div 
              key={idx}
              className={`
                p-1 rounded
                ${isEmpty 
                  ? 'border-2 border-dashed border-muted-foreground/30 bg-muted/20' 
                  : `border-2 border-${rarity}-border/50 bg-card`
                }
              `}
            >
              {isEmpty ? (
                <div className="w-12 h-12 flex items-center justify-center text-muted-foreground/40">
                  ?
                </div>
              ) : (
                <Die number={dieValue} size="lg" />
              )}
            </div>
          ))}
        </div>
        <div className={`text-center px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wide bg-${rarity}-bg/20 text-${rarity}-text border border-${rarity}-border/30`}>
          {label}
        </div>
      </div>
    )
  }
  
  // Example data for demonstrations
  const completeGame = {
    name: "10-3",
    strength: 63.70,
    probability: 9.770,
    roll: [6, 5, 4, 3, 1],
    gameIndices: [0, 1, 2],
    kickerIndices: [3, 4],
    kickerName: "High",
    tieChance: 7.0,
    lossChance: 29.3,
    canImprove: true,
    improvementChance: 2.78,
  }

  const partialGame = {
    name: "Vegas",
    strength: 45.20,
    probability: 3.858,
    roll: [6, 6, 5, 3, 2],
    gameIndices: [0, 1], // Only two 6s matched
    unmatchedIndices: [2, 3, 4], // Need to roll these
    requiredCount: 3, // Need 3 matching dice total
    tieChance: 12.5,
    lossChance: 42.3,
  }

  const weakerGame = {
    name: "Straight",
    strength: 32.15,
    probability: 3.086,
    roll: [6, 5, 4, 3, 2],
    gameIndices: [0, 1, 2, 3, 4],
    tieChance: 0.0,
    lossChance: 67.85,
  }

  // Variant A: Grouped Dice - Clean whiteboard-inspired layout
  const VariantA_GameCard = ({ game, isPartial = false, isComplete = true }) => {
    const rarity = getRarityTier(game.strength)
    
    // Get dice for each group
    const gameDice = game.gameIndices?.map(idx => game.roll[idx]) || []
    const kickerDice = game.kickerIndices?.map(idx => game.roll[idx]) || []
    
    return (
      <div className={`bg-card border-2 border-${rarity.tier}-border/30 rounded-lg shadow-lg p-4`} style={{ width: 'fit-content' }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-border">
          <div>
            <h3 className="text-xl font-bold text-foreground">{game.name}</h3>
            <p className="text-xs text-muted-foreground">{rarity.label} • {game.probability.toFixed(2)}%</p>
          </div>
        </div>

        {/* Dice Groups - side by side like whiteboard */}
        <div className="flex gap-4 mb-4">
          {gameDice.length > 0 && (
            <DiceGroup 
              dice={gameDice} 
              label={game.name}
              rarity={rarity.tier}
              isEmpty={isPartial}
            />
          )}
          {kickerDice.length > 0 && (
            <DiceGroup 
              dice={kickerDice} 
              label={game.kickerName || "KICKER"}
              rarity={rarity.tier}
              isEmpty={false}
            />
          )}
        </div>

        {/* Stats - below dice like whiteboard */}
        <div className="space-y-1 text-xs">
          <div className="flex justify-between">
            <span className="text-muted-foreground uppercase">GAME:</span>
            <span className="font-bold" style={{ color: `hsl(var(--color-${rarity.tier}-border))` }}>
              {game.name} ({game.strength.toFixed(1)}% • {(game.probability * 100).toFixed(0)}/1,000)
            </span>
          </div>
          {kickerDice.length > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground uppercase">KICKER:</span>
              <span className="font-semibold">
                {game.kickerName} ({game.improvementChance?.toFixed(2)}% • 1/36)
              </span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-muted-foreground uppercase">TIE or LOSS:</span>
            <span className="font-semibold text-red-500">
              {(game.tieChance + game.lossChance).toFixed(1)}% ({game.tieChance.toFixed(1)}% tie + {game.lossChance.toFixed(1)}% loss)
            </span>
          </div>
        </div>
      </div>
    )
  }

  // Variant B: Compact Cards - Smaller vertical format
  const VariantB_GameCard = ({ game, isPartial = false, isComplete = true }) => {
    const rarity = getRarityTier(game.strength)
    
    const gameDice = game.gameIndices?.map(idx => game.roll[idx]) || []
    const kickerDice = game.kickerIndices?.map(idx => game.roll[idx]) || []
    
    return (
      <div className={`bg-card border-2 border-${rarity.tier}-border rounded-lg shadow-lg overflow-hidden`} style={{ width: 'fit-content' }}>
        {/* Rarity header */}
        <div className={`bg-${rarity.tier}-bg/30 border-b-2 border-${rarity.tier}-border/30 px-4 py-2`}>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold">{game.name}</h3>
            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-${rarity.tier}-border text-white`}>
              {rarity.label}
            </span>
          </div>
        </div>

        <div className="p-3">
          {/* Dice groups stacked */}
          <div className="space-y-2 mb-3">
            {gameDice.length > 0 && (
              <DiceGroup 
                dice={gameDice} 
                label={game.name}
                rarity={rarity.tier}
                isEmpty={isPartial}
              />
            )}
            {kickerDice.length > 0 && (
              <DiceGroup 
                dice={kickerDice} 
                label={game.kickerName || "KICKER"}
                rarity={rarity.tier}
                isEmpty={false}
              />
            )}
          </div>

          {/* Compact stats */}
          <div className="grid grid-cols-3 gap-1 text-xs text-center">
            <div className="bg-muted/30 rounded py-1">
              <div className="font-bold text-sm" style={{ color: `hsl(var(--color-${rarity.tier}-border))` }}>
                {game.strength.toFixed(0)}%
              </div>
              <div className="text-[9px] text-muted-foreground uppercase">Win</div>
            </div>
            <div className="bg-muted/30 rounded py-1">
              <div className="font-semibold text-sm">{game.tieChance.toFixed(0)}%</div>
              <div className="text-[9px] text-muted-foreground uppercase">Tie</div>
            </div>
            <div className="bg-muted/30 rounded py-1">
              <div className="font-semibold text-sm text-red-500">{game.lossChance.toFixed(0)}%</div>
              <div className="text-[9px] text-muted-foreground uppercase">Loss</div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Variant C: Detailed Cards - Maximum information density
  const VariantC_GameCard = ({ game, isPartial = false, isComplete = true }) => {
    const rarity = getRarityTier(game.strength)
    
    const gameDice = game.gameIndices?.map(idx => game.roll[idx]) || []
    const kickerDice = game.kickerIndices?.map(idx => game.roll[idx]) || []
    
    return (
      <div className={`bg-card border-2 border-${rarity.tier}-border rounded-lg shadow-lg`} style={{ width: 'fit-content' }}>
        {/* Title bar */}
        <div className={`bg-${rarity.tier}-bg/20 border-b border-${rarity.tier}-border/30 px-4 py-2 flex items-center justify-between`}>
          <h3 className="text-xl font-bold">{game.name}</h3>
          <div className="text-xs text-muted-foreground">
            <span className="font-semibold">{rarity.label}</span> • {game.probability.toFixed(2)}%
          </div>
        </div>

        <div className="p-4">
          {/* Dice groups side by side */}
          <div className="flex gap-3 mb-4">
            {gameDice.length > 0 && (
              <DiceGroup 
                dice={gameDice} 
                label={game.name}
                rarity={rarity.tier}
                isEmpty={isPartial}
              />
            )}
            {kickerDice.length > 0 && (
              <DiceGroup 
                dice={kickerDice} 
                label={game.kickerName || "KICKER"}
                rarity={rarity.tier}
                isEmpty={false}
              />
            )}
          </div>

          {/* Detailed stats table */}
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between p-2 bg-muted/20 rounded">
              <span className="text-muted-foreground font-semibold uppercase">Strength</span>
              <span className="font-bold text-lg" style={{ color: `hsl(var(--color-${rarity.tier}-border))` }}>
                {game.strength.toFixed(1)}%
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center justify-between p-2 bg-muted/20 rounded">
                <span className="text-muted-foreground font-semibold uppercase">Tie</span>
                <span className="font-semibold">{game.tieChance.toFixed(1)}%</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-muted/20 rounded">
                <span className="text-muted-foreground font-semibold uppercase">Loss</span>
                <span className="font-semibold text-red-500">{game.lossChance.toFixed(1)}%</span>
              </div>
            </div>
            {game.canImprove && (
              <div className={`p-2 bg-${rarity.tier}-bg/10 border-l-2 border-${rarity.tier}-border rounded`}>
                <div className="font-semibold">Re-roll Available</div>
                <div className="text-muted-foreground">
                  {game.improvementChance?.toFixed(2)}% chance to improve kicker
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Game Card Design Variants</h1>
        <p className="text-muted-foreground text-lg">
          Three card layouts inspired by your whiteboard sketches. Dice are grouped by game/kicker with labels, and relevant stats appear below like video game item properties.
        </p>
      </div>

      {/* Variant A */}
      <section className="mb-12">
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-2">Variant A: Horizontal Groups</h2>
          <p className="text-muted-foreground">
            Clean side-by-side layout matching your whiteboard sketch. Game dice and kicker dice in separate labeled groups. Stats displayed below in a format similar to "GAME: 10-3 (63% win)" from your notes.
          </p>
        </div>
        <div className="flex flex-wrap gap-6">
          <div>
            <p className="text-sm font-semibold mb-2 text-muted-foreground">Complete Game with Kicker</p>
            <VariantA_GameCard game={completeGame} isComplete={true} />
          </div>
          <div>
            <p className="text-sm font-semibold mb-2 text-muted-foreground">Partial Match (In Progress)</p>
            <VariantA_GameCard game={partialGame} isPartial={true} isComplete={false} />
          </div>
          <div>
            <p className="text-sm font-semibold mb-2 text-muted-foreground">Weaker Game (Common)</p>
            <VariantA_GameCard game={weakerGame} isComplete={true} />
          </div>
        </div>
      </section>

      {/* Variant B */}
      <section className="mb-12">
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-2">Variant B: Vertical Compact</h2>
          <p className="text-muted-foreground">
            Stacked dice groups with rarity-colored header. More vertical, less wide. Groups clearly separated with labels. Compact stat grid at bottom.
          </p>
        </div>
        <div className="flex flex-wrap gap-6">
          <div>
            <p className="text-sm font-semibold mb-2 text-muted-foreground">Complete Game with Kicker</p>
            <VariantB_GameCard game={completeGame} isComplete={true} />
          </div>
          <div>
            <p className="text-sm font-semibold mb-2 text-muted-foreground">Partial Match (In Progress)</p>
            <VariantB_GameCard game={partialGame} isPartial={true} isComplete={false} />
          </div>
          <div>
            <p className="text-sm font-semibold mb-2 text-muted-foreground">Weaker Game (Common)</p>
            <VariantB_GameCard game={weakerGame} isComplete={true} />
          </div>
        </div>
      </section>

      {/* Variant C */}
      <section className="mb-12">
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-2">Variant C: Detailed Stats</h2>
          <p className="text-muted-foreground">
            Maximum information density with table-style stats layout. Dice groups side-by-side at top, detailed breakdown below. Best for when you need all the numbers at a glance.
          </p>
        </div>
        <div className="flex flex-wrap gap-6">
          <div>
            <p className="text-sm font-semibold mb-2 text-muted-foreground">Complete Game with Kicker</p>
            <VariantC_GameCard game={completeGame} isComplete={true} />
          </div>
          <div>
            <p className="text-sm font-semibold mb-2 text-muted-foreground">Partial Match (In Progress)</p>
            <VariantC_GameCard game={partialGame} isPartial={true} isComplete={false} />
          </div>
          <div>
            <p className="text-sm font-semibold mb-2 text-muted-foreground">Weaker Game (Common)</p>
            <VariantC_GameCard game={weakerGame} isComplete={true} />
          </div>
        </div>
      </section>

      {/* Comparison Notes */}
      <section className="bg-muted/30 rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4">Design Considerations</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
          <div>
            <h3 className="font-semibold mb-2 text-accent-foreground">Variant A: Horizontal Groups</h3>
            <ul className="space-y-1 text-muted-foreground">
              <li>✓ Matches whiteboard layout exactly</li>
              <li>✓ Game/kicker clearly separated</li>
              <li>✓ Stats formatted like your notes</li>
              <li>✓ Most horizontal space needed</li>
              <li>✗ Wider cards may not fit narrow screens</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-2 text-accent-foreground">Variant B: Vertical Compact</h3>
            <ul className="space-y-1 text-muted-foreground">
              <li>✓ Narrower width for tighter spaces</li>
              <li>✓ Clear grouping with stacked layout</li>
              <li>✓ Prominent rarity header</li>
              <li>✓ Good for grid arrangements</li>
              <li>✗ More vertical scroll needed</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-2 text-accent-foreground">Variant C: Detailed Stats</h3>
            <ul className="space-y-1 text-muted-foreground">
              <li>✓ Maximum information visible</li>
              <li>✓ Table-style stats readability</li>
              <li>✓ Good for detailed analysis</li>
              <li>✓ Re-roll info prominently shown</li>
              <li>✗ Larger overall card size</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  )
}

export default CardDesignsPage

export const Head = () => <title>Game Card Designs - Refusal Dice</title>
