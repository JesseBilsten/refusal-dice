import React from "react"
import DiceDisplay from "../components/DiceDisplay"
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

  // Variant A: Accent Border Style - Clean with subtle left accent
  const VariantA_GameCard = ({ game, isPartial = false, isComplete = true }) => {
    const rarity = getRarityTier(game.strength)
    const borderStyle = isPartial ? "border-dashed" : "border-solid"
    
    return (
      <div className={`relative bg-card border-2 ${borderStyle} border-border rounded-lg overflow-hidden shadow-lg max-w-md`}>
        {/* Subtle rarity accent on left */}
        <div className={`absolute left-0 top-0 bottom-0 w-1 bg-${rarity.tier}-border`} />
        
        <div className="pl-4 pr-4 py-3">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="text-xl font-bold text-foreground">{game.name}</h3>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">{rarity.label}</p>
            </div>
            <span className="text-xs border border-border rounded px-2 py-1">
              {game.probability.toFixed(3)}%
            </span>
          </div>

          {/* Dice Display */}
          <div className="mb-3 bg-muted/30 rounded p-2 flex items-center justify-center">
            {isComplete ? (
              <DiceDisplay 
                roll={game.roll} 
                size="sm"
                groups={[
                  { indices: game.gameIndices, label: game.name, strength: game.strength },
                  ...(game.kickerIndices ? [{ indices: game.kickerIndices, label: game.kickerName, strength: game.strength }] : [])
                ]}
              />
            ) : (
              <div className="flex gap-2">
                {/* Matched dice */}
                <div className="border-2 border-dashed border-muted-foreground/40 rounded p-1">
                  <DiceDisplay roll={game.roll.slice(0, game.requiredCount)} size="sm" />
                </div>
                {/* Unmatched dice */}
                <div className="flex gap-1 items-center opacity-50">
                  <DiceDisplay roll={game.roll.slice(game.requiredCount)} size="sm" />
                </div>
              </div>
            )}
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="bg-muted/50 rounded px-2 py-1">
              <div className="text-muted-foreground uppercase text-[10px]">Strength</div>
              <div className="font-semibold">{game.strength.toFixed(1)}%</div>
            </div>
            <div className="bg-muted/50 rounded px-2 py-1">
              <div className="text-muted-foreground uppercase text-[10px]">Tie</div>
              <div className="font-semibold">{game.tieChance.toFixed(1)}%</div>
            </div>
            <div className="bg-muted/50 rounded px-2 py-1">
              <div className="text-muted-foreground uppercase text-[10px]">Loss</div>
              <div className="font-semibold">{game.lossChance.toFixed(1)}%</div>
            </div>
          </div>

          {/* Improvement indicator */}
          {game.canImprove && (
            <div className="mt-2 bg-primary/10 border border-primary/30 rounded px-2 py-1 text-xs">
              <span className="text-primary font-medium">↑ Can improve:</span> {game.improvementChance.toFixed(2)}% chance
            </div>
          )}
        </div>
      </div>
    )
  }

  // Variant B: Header Badge Style - Information dense with prominent badge
  const VariantB_GameCard = ({ game, isPartial = false, isComplete = true }) => {
    const rarity = getRarityTier(game.strength)
    const borderStyle = isPartial ? "border-dashed" : "border-solid"
    
    return (
      <div className={`bg-card border-2 ${borderStyle} border-border rounded-lg overflow-hidden shadow-lg max-w-md`}>
        {/* Header with rarity badge */}
        <div className={`bg-${rarity.tier}/10 border-b-2 border-${rarity.tier}-border px-4 py-2 flex items-center justify-between`}>
          <div className="flex items-center gap-2">
            <span className={`bg-${rarity.tier}-border text-white text-xs font-bold px-2 py-0.5 rounded`}>
              {rarity.label.toUpperCase()}
            </span>
            <h3 className="text-lg font-bold text-foreground">{game.name}</h3>
          </div>
          <div className="text-xs text-muted-foreground">
            {game.probability.toFixed(3)}%
          </div>
        </div>

        <div className="px-4 py-3">
          {/* Dice Display */}
          <div className="mb-3 flex items-center justify-center">
            {isComplete ? (
              <DiceDisplay 
                roll={game.roll} 
                size="sm"
                groups={[
                  { indices: game.gameIndices, label: game.name, strength: game.strength },
                  ...(game.kickerIndices ? [{ indices: game.kickerIndices, label: game.kickerName, strength: game.strength }] : [])
                ]}
              />
            ) : (
              <div className="flex gap-2">
                <div className="border-2 border-dashed border-primary/40 rounded p-1 bg-primary/5">
                  <DiceDisplay roll={game.roll.slice(0, game.requiredCount)} size="sm" />
                  <div className="text-center text-[10px] text-muted-foreground mt-1">
                    {game.gameIndices.length}/{game.requiredCount}
                  </div>
                </div>
                <div className="flex gap-1 items-center opacity-40">
                  <DiceDisplay roll={game.roll.slice(game.requiredCount)} size="sm" />
                </div>
              </div>
            )}
          </div>

          {/* Two-column stats */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-muted-foreground text-xs">Strength</span>
                <span className={`font-bold text-${rarity.tier}-border`}>{game.strength.toFixed(1)}%</span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div 
                  className={`h-full bg-${rarity.tier}-border`}
                  style={{ width: `${game.strength}%` }}
                />
              </div>
            </div>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tie</span>
                <span className="font-semibold">{game.tieChance.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Loss</span>
                <span className="font-semibold">{game.lossChance.toFixed(1)}%</span>
              </div>
            </div>
          </div>

          {game.canImprove && (
            <div className="mt-3 flex items-center gap-2 text-xs text-primary">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
              <span className="font-medium">Roll kicker: {game.improvementChance.toFixed(2)}% to improve</span>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Variant C: Corner Accent Style - Elegant with corner ribbon
  const VariantC_GameCard = ({ game, isPartial = false, isComplete = true }) => {
    const rarity = getRarityTier(game.strength)
    const borderStyle = isPartial ? "border-dashed" : "border-solid"
    
    return (
      <div className={`relative bg-card border ${borderStyle} border-border rounded-lg overflow-hidden shadow-lg max-w-md`}>
        {/* Corner ribbon */}
        <div className="absolute top-0 right-0 w-0 h-0 border-l-[60px] border-l-transparent border-t-[60px]"
             style={{ borderTopColor: `hsl(var(--color-${rarity.tier}-border))` }}>
        </div>
        <div className="absolute top-2 right-2 text-white text-[10px] font-bold uppercase rotate-45 origin-top-right">
          {rarity.label}
        </div>

        <div className="px-4 py-3">
          {/* Title and probability */}
          <div className="mb-3">
            <h3 className="text-2xl font-bold text-foreground mb-0.5">{game.name}</h3>
            <p className="text-xs text-muted-foreground">
              Appears in {game.probability.toFixed(3)}% of rolls
            </p>
          </div>

          {/* Dice Display */}
          <div className="mb-4 bg-muted/20 rounded-lg p-3 flex items-center justify-center border border-muted">
            {isComplete ? (
              <DiceDisplay 
                roll={game.roll} 
                size="sm"
                groups={[
                  { indices: game.gameIndices, label: game.name, strength: game.strength },
                  ...(game.kickerIndices ? [{ indices: game.kickerIndices, label: game.kickerName, strength: game.strength }] : [])
                ]}
              />
            ) : (
              <div className="w-full">
                <div className="flex gap-2 justify-center items-center">
                  <div className="border-2 border-dashed rounded-lg p-2 bg-card/50"
                       style={{ borderColor: `hsl(var(--color-${rarity.tier}-border) / 0.3)` }}>
                    <DiceDisplay roll={game.roll.slice(0, game.requiredCount)} size="sm" />
                  </div>
                  <div className="text-muted-foreground text-xl">→</div>
                  <div className="flex gap-1 opacity-30">
                    <DiceDisplay roll={game.roll.slice(game.requiredCount)} size="sm" />
                  </div>
                </div>
                <p className="text-center text-xs text-muted-foreground mt-2">
                  Need {game.requiredCount - game.gameIndices.length} more matching dice
                </p>
              </div>
            )}
          </div>

          {/* Stats bar */}
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-xs uppercase tracking-wide">Win Strength</span>
              <span className="font-bold" style={{ color: `hsl(var(--color-${rarity.tier}-border))` }}>
                {game.strength.toFixed(2)}%
              </span>
            </div>
            <div className="flex gap-2 text-xs">
              <div className="flex-1 bg-muted rounded p-2">
                <div className="text-muted-foreground uppercase text-[10px] mb-0.5">Tie Risk</div>
                <div className="font-semibold text-amber-500">{game.tieChance.toFixed(1)}%</div>
              </div>
              <div className="flex-1 bg-muted rounded p-2">
                <div className="text-muted-foreground uppercase text-[10px] mb-0.5">Loss Risk</div>
                <div className="font-semibold text-red-500">{game.lossChance.toFixed(1)}%</div>
              </div>
            </div>
          </div>

          {game.canImprove && (
            <div className="mt-3 bg-gradient-to-r from-primary/20 to-transparent border-l-2 border-primary pl-3 py-2 text-xs">
              <div className="font-semibold text-primary mb-0.5">Kicker Re-roll Available</div>
              <div className="text-muted-foreground">
                {game.improvementChance.toFixed(2)}% chance to improve strength
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Game Card Design Variants</h1>
        <p className="text-muted-foreground text-lg">
          Three composition options inspired by video game item cards. Each emphasizes roll details while using rarity colors as subtle accents.
        </p>
      </div>

      {/* Variant A */}
      <section className="mb-12">
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-2">Variant A: Accent Border</h2>
          <p className="text-muted-foreground">
            Clean layout with subtle left accent bar. Emphasizes dice and stats with rarity as a minimal design element.
            Good for information density and quick scanning.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
          <h2 className="text-2xl font-bold mb-2">Variant B: Header Badge</h2>
          <p className="text-muted-foreground">
            Prominent rarity badge in header with tinted background. Information-dense with progress bars.
            Good for emphasizing rarity and game hierarchy.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
          <h2 className="text-2xl font-bold mb-2">Variant C: Corner Accent</h2>
          <p className="text-muted-foreground">
            Elegant corner ribbon with spacious layout. Focuses on readability and visual polish.
            Good for showcasing individual games with clear hierarchy.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
            <h3 className="font-semibold mb-2 text-accent-foreground">Variant A</h3>
            <ul className="space-y-1 text-muted-foreground">
              <li>✓ Minimal rarity distraction</li>
              <li>✓ Excellent scannability</li>
              <li>✓ Compact and efficient</li>
              <li>✗ Less visual drama</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-2 text-accent-foreground">Variant B</h3>
            <ul className="space-y-1 text-muted-foreground">
              <li>✓ Clear rarity indication</li>
              <li>✓ Progress bars for strength</li>
              <li>✓ Information-dense</li>
              <li>✗ More color usage</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-2 text-accent-foreground">Variant C</h3>
            <ul className="space-y-1 text-muted-foreground">
              <li>✓ Most elegant presentation</li>
              <li>✓ Clear visual hierarchy</li>
              <li>✓ Spacious and readable</li>
              <li>✗ Takes more space</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  )
}

export default CardDesignsPage

export const Head = () => <title>Game Card Designs - Refusal Dice</title>
