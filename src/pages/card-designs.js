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
  
  // Helper to render die socket
  const DieSocket = ({ value, isEmpty = false, isKicker = false, label = null }) => {
    return (
      <div className="flex flex-col items-center">
        <div className={`
          relative rounded
          ${isEmpty 
            ? 'border-2 border-dashed border-muted-foreground/30 bg-muted/20' 
            : 'bg-card'
          }
          ${isKicker ? 'ring-2 ring-primary/30' : ''}
        `}>
          {isEmpty ? (
            <div className="w-12 h-12 flex items-center justify-center text-muted-foreground/40 text-xs">
              ?
            </div>
          ) : (
            <Die value={value} size="lg" />
          )}
        </div>
        {label && (
          <span className="text-[10px] mt-1 font-semibold text-muted-foreground uppercase tracking-wide">
            {label}
          </span>
        )}
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

  // Variant A: Socket Grid - Dice in sockets with subtle accent
  const VariantA_GameCard = ({ game, isPartial = false, isComplete = true }) => {
    const rarity = getRarityTier(game.strength)
    const borderStyle = isPartial ? "border-dashed" : "border-solid"
    
    // Render all 5 dice with socket styling
    const renderDiceRow = () => {
      return (
        <div className="flex gap-1 justify-center">
          {game.roll.map((value, idx) => {
            const isInGame = game.gameIndices?.includes(idx)
            const isKicker = game.kickerIndices?.includes(idx)
            const isEmpty = isPartial && !game.gameIndices?.includes(idx)
            
            return (
              <DieSocket 
                key={idx}
                value={value}
                isEmpty={isEmpty}
                isKicker={isKicker}
              />
            )
          })}
        </div>
      )
    }
    
    return (
      <div className={`relative bg-card border-2 ${borderStyle} border-border rounded-lg shadow-lg`} style={{ width: 'fit-content' }}>
        {/* Subtle rarity accent on left */}
        <div className={`absolute left-0 top-0 bottom-0 w-1 bg-${rarity.tier}-border`} />
        
        <div className="px-4 py-4">
          {/* Header */}
          <div className="flex items-baseline justify-between mb-3 gap-4">
            <div>
              <h3 className="text-xl font-bold text-foreground">{game.name}</h3>
              <p className="text-xs text-muted-foreground">{rarity.label}</p>
            </div>
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {game.probability.toFixed(2)}%
            </span>
          </div>

          {/* Dice Sockets */}
          <div className="mb-3 bg-muted/20 rounded-lg p-3 border border-muted">
            {renderDiceRow()}
            {/* Labels under dice */}
            <div className="flex gap-1 justify-center mt-2">
              {game.roll.map((_, idx) => {
                const isInGame = game.gameIndices?.includes(idx)
                const isKicker = game.kickerIndices?.includes(idx)
                let label = ""
                if (isInGame && !isKicker) label = game.name
                else if (isKicker) label = game.kickerName || "Kicker"
                
                return (
                  <div key={idx} className="w-12 text-center">
                    {label && (
                      <span className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wide">
                        {label}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-2 text-xs mb-2">
            <div className="text-center">
              <div className="text-muted-foreground text-[10px] uppercase">Win</div>
              <div className="font-bold" style={{ color: `hsl(var(--color-${rarity.tier}-border))` }}>
                {game.strength.toFixed(1)}%
              </div>
            </div>
            <div className="text-center">
              <div className="text-muted-foreground text-[10px] uppercase">Tie</div>
              <div className="font-semibold">{game.tieChance.toFixed(1)}%</div>
            </div>
            <div className="text-center">
              <div className="text-muted-foreground text-[10px] uppercase">Loss</div>
              <div className="font-semibold">{game.lossChance.toFixed(1)}%</div>
            </div>
          </div>

          {/* Improvement indicator */}
          {game.canImprove && (
            <div className="mt-2 bg-primary/10 border border-primary/30 rounded px-2 py-1 text-xs text-center">
              <span className="text-primary font-medium">Can re-roll kicker: {game.improvementChance.toFixed(2)}%</span>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Variant B: Bordered Sockets - Dice in outlined grid
  const VariantB_GameCard = ({ game, isPartial = false, isComplete = true }) => {
    const rarity = getRarityTier(game.strength)
    const borderStyle = isPartial ? "border-dashed" : "border-solid"
    
    const renderDiceRow = () => {
      return (
        <div className="flex gap-0">
          {game.roll.map((value, idx) => {
            const isInGame = game.gameIndices?.includes(idx)
            const isKicker = game.kickerIndices?.includes(idx)
            const isEmpty = isPartial && !game.gameIndices?.includes(idx)
            const isLast = idx === game.roll.length - 1
            
            return (
              <div 
                key={idx}
                className={`relative flex flex-col items-center p-2 border-t-2 border-b-2 border-l-2 ${isLast ? 'border-r-2' : ''}`}
                style={{ 
                  borderColor: isKicker 
                    ? 'hsl(var(--color-primary))' 
                    : isInGame 
                      ? `hsl(var(--color-${rarity.tier}-border))` 
                      : 'hsl(var(--color-border))'
                }}
              >
                {isEmpty ? (
                  <div className="w-12 h-12 flex items-center justify-center border-2 border-dashed border-muted-foreground/30 rounded bg-muted/10 text-muted-foreground/40 text-xs">
                    ?
                  </div>
                ) : (
                  <Die value={value} size="lg" />
                )}
                {(isInGame || isKicker) && (
                  <span className="text-[8px] mt-1 font-bold uppercase tracking-wide"
                        style={{ color: isKicker ? 'hsl(var(--color-primary))' : `hsl(var(--color-${rarity.tier}-border))` }}>
                    {isKicker ? (game.kickerName || "Kicker") : game.name}
                  </span>
                )}
              </div>
            )
          })}
        </div>
      )
    }
    
    return (
      <div className={`relative bg-card border-2 ${borderStyle} rounded-lg shadow-lg overflow-hidden`} 
           style={{ 
             width: 'fit-content',
             borderColor: `hsl(var(--color-${rarity.tier}-border))`
           }}>
        {/* Header with rarity badge */}
        <div className={`px-4 py-2 border-b-2 flex items-center justify-between`}
             style={{ 
               backgroundColor: `hsl(var(--color-${rarity.tier}) / 0.1)`,
               borderColor: `hsl(var(--color-${rarity.tier}-border))`
             }}>
          <div className="flex items-center gap-2">
            <span className={`text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase`}
                  style={{ backgroundColor: `hsl(var(--color-${rarity.tier}-border))` }}>
              {rarity.label}
            </span>
            <h3 className="text-lg font-bold text-foreground">{game.name}</h3>
          </div>
          <div className="text-xs text-muted-foreground">
            {game.probability.toFixed(2)}%
          </div>
        </div>

        <div className="p-4">
          {/* Dice Grid with borders */}
          <div className="mb-3 rounded-lg overflow-hidden">
            {renderDiceRow()}
          </div>

          {/* Stats */}
          <div className="flex justify-around text-xs">
            <div className="text-center">
              <div className="font-bold text-lg" style={{ color: `hsl(var(--color-${rarity.tier}-border))` }}>
                {game.strength.toFixed(1)}%
              </div>
              <div className="text-muted-foreground text-[10px] uppercase">Strength</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-lg text-amber-500">{game.tieChance.toFixed(1)}%</div>
              <div className="text-muted-foreground text-[10px] uppercase">Tie</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-lg text-red-500">{game.lossChance.toFixed(1)}%</div>
              <div className="text-muted-foreground text-[10px] uppercase">Loss</div>
            </div>
          </div>

          {game.canImprove && (
            <div className="mt-3 bg-primary/10 rounded px-2 py-1.5 text-xs text-center border-l-2 border-primary">
              <span className="text-primary font-semibold">Re-roll available: {game.improvementChance.toFixed(2)}% to improve</span>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Variant C: Stacked Layout - Vertical with socket rows
  const VariantC_GameCard = ({ game, isPartial = false, isComplete = true }) => {
    const rarity = getRarityTier(game.strength)
    const borderStyle = isPartial ? "border-dashed" : "border-solid"
    
    // Group dice by game and kicker
    const gameSection = game.gameIndices?.map(idx => game.roll[idx]) || []
    const kickerSection = game.kickerIndices?.map(idx => game.roll[idx]) || []
    const unassignedDice = game.roll.filter((_, idx) => 
      !game.gameIndices?.includes(idx) && !game.kickerIndices?.includes(idx)
    )
    
    const DiceSection = ({ dice, label, color, isEmpty = false }) => (
      <div className="flex items-center gap-2">
        <div className="flex-1 flex gap-1">
          {dice.map((value, idx) => (
            <DieSocket key={idx} value={value} isEmpty={isEmpty} />
          ))}
        </div>
        {label && (
          <div className="text-xs font-bold uppercase tracking-wide whitespace-nowrap" 
               style={{ color }}>
            {label}
          </div>
        )}
      </div>
    )
    
    return (
      <div className={`relative bg-card border ${borderStyle} border-border rounded-lg shadow-lg`} 
           style={{ width: 'fit-content' }}>
        {/* Corner ribbon */}
        <div className="absolute top-0 right-0 w-0 h-0" 
             style={{ 
               borderLeft: '50px solid transparent',
               borderTop: `50px solid hsl(var(--color-${rarity.tier}-border))`
             }}>
        </div>
        <div className="absolute top-1.5 right-1.5 text-white text-[9px] font-bold uppercase rotate-45">
          {rarity.label}
        </div>

        <div className="px-4 py-4 pr-14">
          {/* Title */}
          <div className="mb-3">
            <h3 className="text-xl font-bold text-foreground">{game.name}</h3>
            <p className="text-xs text-muted-foreground">
              {game.probability.toFixed(2)}% probability
            </p>
          </div>

          {/* Dice Sections */}
          <div className="space-y-2 mb-3">
            {gameSection.length > 0 && (
              <DiceSection 
                dice={gameSection} 
                label={game.name}
                color={`hsl(var(--color-${rarity.tier}-border))`}
                isEmpty={isPartial && gameSection.length < 3}
              />
            )}
            {kickerSection.length > 0 && (
              <DiceSection 
                dice={kickerSection} 
                label={game.kickerName || "Kicker"}
                color="hsl(var(--color-primary))"
              />
            )}
            {unassignedDice.length > 0 && (
              <DiceSection 
                dice={unassignedDice} 
                label={null}
                color="hsl(var(--color-muted-foreground))"
                isEmpty={isPartial}
              />
            )}
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="bg-muted/50 rounded p-2 text-center">
              <div className="font-bold" style={{ color: `hsl(var(--color-${rarity.tier}-border))` }}>
                {game.strength.toFixed(1)}%
              </div>
              <div className="text-muted-foreground text-[9px] uppercase mt-0.5">Win</div>
            </div>
            <div className="bg-muted/50 rounded p-2 text-center">
              <div className="font-semibold text-amber-500">{game.tieChance.toFixed(1)}%</div>
              <div className="text-muted-foreground text-[9px] uppercase mt-0.5">Tie</div>
            </div>
            <div className="bg-muted/50 rounded p-2 text-center">
              <div className="font-semibold text-red-500">{game.lossChance.toFixed(1)}%</div>
              <div className="text-muted-foreground text-[9px] uppercase mt-0.5">Loss</div>
            </div>
          </div>

          {game.canImprove && (
            <div className="mt-2 bg-gradient-to-r from-primary/20 to-transparent border-l-2 border-primary pl-2 py-1.5 text-xs">
              <div className="font-semibold text-primary">Kicker Re-roll</div>
              <div className="text-muted-foreground">{game.improvementChance.toFixed(2)}% improvement chance</div>
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
          Three socket-based compositions inspired by video game item design. Dice lock into sockets with the card width determined by the 5-dice row. Each variant balances roll details with subtle rarity styling.
        </p>
      </div>

      {/* Variant A */}
      <section className="mb-12">
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-2">Variant A: Socket Grid</h2>
          <p className="text-muted-foreground">
            Clean horizontal socket row with all 5 dice visible. Subtle left accent bar and labels below dice. Minimal and scannable layout focused on the dice themselves. Empty sockets shown with dashed borders for partial matches.
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
          <h2 className="text-2xl font-bold mb-2">Variant B: Bordered Sockets</h2>
          <p className="text-muted-foreground">
            Connected socket cells with colored borders indicating game/kicker association. Each die in its own bordered compartment. Prominent rarity badge in header. Labels integrated within each socket cell.
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
          <h2 className="text-2xl font-bold mb-2">Variant C: Stacked Layout</h2>
          <p className="text-muted-foreground">
            Vertical layout with dice grouped by purpose (game/kicker). Each row has its own label. Corner ribbon for rarity. Allows for clearer separation of game components and better readability of complex hands.
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
            <h3 className="font-semibold mb-2 text-accent-foreground">Variant A: Socket Grid</h3>
            <ul className="space-y-1 text-muted-foreground">
              <li>✓ All 5 dice prominently displayed</li>
              <li>✓ Clean horizontal layout</li>
              <li>✓ Minimal vertical space</li>
              <li>✓ Easy to scan game/kicker labels</li>
              <li>✗ Labels below dice may be missed</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-2 text-accent-foreground">Variant B: Bordered Sockets</h3>
            <ul className="space-y-1 text-muted-foreground">
              <li>✓ Clear visual grouping via borders</li>
              <li>✓ Game/kicker color-coded</li>
              <li>✓ Integrated labels in cells</li>
              <li>✓ Strong visual impact</li>
              <li>✗ More complex visual structure</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-2 text-accent-foreground">Variant C: Stacked Layout</h3>
            <ul className="space-y-1 text-muted-foreground">
              <li>✓ Logical dice grouping by rows</li>
              <li>✓ Labels adjacent to dice groups</li>
              <li>✓ Best for complex situations</li>
              <li>✓ Elegant corner ribbon</li>
              <li>✗ More vertical space needed</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  )
}

export default CardDesignsPage

export const Head = () => <title>Game Card Designs - Refusal Dice</title>
