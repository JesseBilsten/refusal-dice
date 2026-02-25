import React, { useState, useMemo, useCallback, useEffect } from 'react'
import Layout from '../components/layout'
import { Badge } from '../components/ui/badge'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../components/ui/card'
import { Button } from '../components/ui/button'
import VariantSelector from '../components/VariantSelector'
import { ToggleGroup, ToggleGroupItem } from '../components/ui/toggle-group'
import { Label } from '../components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../components/ui/tooltip'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '../components/ui/dialog'
import { Info } from 'lucide-react'
import DiceRollInput from '../components/DiceRollInput'
import GameLink from '../components/GameLink'
import { StrengthBar } from '../components/RollAnalysis'
import uniqueRollsData from '../data/unique-rolls.json'
import { 
  checkGame, 
  getKickerStrength,
  generateHammerStrategy,
  evaluateRefuserPosition,
  gameOddsMap
} from '../lib/game-validation'
import { GAMES, GAMES_MAP, SPECIALTY_THRESHOLDS, fmtPct } from '../lib/games-config'

const StrategyAssistantPage = () => {
  const [diceValues, setDiceValues] = useState(['', '', '', '', ''])
  const playerCount = 3 // fixed for now
  const [testPosition, setTestPosition] = useState('hammer')
  const [testGame, setTestGame] = useState(null)
  const [selectedVariant, setSelectedVariant] = useState(null)
  const [debugInfo, setDebugInfo] = useState(null)
  const [validationMsg, setValidationMsg] = useState(null)

  const uniqueRollsArray = uniqueRollsData.uniqueRolls

  // ── Derived: is the roll complete? ──
  const rollIsComplete = diceValues.every(v => v >= '1' && v <= '6')
  const parsedRoll = rollIsComplete ? diceValues.map(Number) : null

  // ── Helpers to check whether we can analyze ──
  const canAnalyze = () => {
    if (!rollIsComplete) return false
    if (testPosition !== 'hammer' && !testGame) return false
    return true
  }

  // ── Run analysis (called automatically and on button click) ──
  const runAnalysis = useCallback(() => {
    if (!parsedRoll) return

    const results = GAMES.map(game => {
      const matches = checkGame(parsedRoll, game.id)
      let strength = ''
      if (matches && game.hasVariants) {
        strength = getKickerStrength(parsedRoll, game.id)
      }
      return { game: game.name, matches, strength }
    })

    let strategy = null
    if (testPosition === 'hammer') {
      const numOpponents = playerCount - 1
      strategy = generateHammerStrategy(parsedRoll, numOpponents, gameOddsMap)
    } else if (testGame) {
      const position = testPosition === 'first-refusal' ? 'first' : 'second'
      const gameHasVariants = GAMES.find(g => g.id === testGame)?.hasVariants
      strategy = evaluateRefuserPosition(
        parsedRoll,
        testGame,
        gameHasVariants ? selectedVariant : null,
        position,
        uniqueRollsArray,
        SPECIALTY_THRESHOLDS
      )
    }

    setDebugInfo({ roll: parsedRoll, results, strategy })
    setValidationMsg(null)
  }, [parsedRoll, testPosition, testGame, selectedVariant, playerCount, uniqueRollsArray])

  // ── Auto-reanalyze when any input changes, if all required fields are set ──
  useEffect(() => {
    if (canAnalyze()) {
      runAnalysis()
    } else {
      // Clear stale results when inputs become incomplete
      setDebugInfo(null)
    }
  }, [diceValues, testPosition, testGame, selectedVariant]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Position change handler ──
  const handlePositionChange = (pos) => {
    if (pos) {
      setTestPosition(pos)
      setValidationMsg(null)
    }
  }

  /** Clear variant when switching to a game without variants */
  const handleGameSelect = useCallback((gameId) => {
    setTestGame(gameId)
    const g = GAMES.find(gg => gg.id === gameId)
    if (!g?.hasVariants) setSelectedVariant(null)
    setValidationMsg(null)
  }, [])

  /** Dice change from DiceRollInput */
  const handleDiceChange = useCallback((newValues) => {
    setDiceValues(newValues)
    setValidationMsg(null)
  }, [])

  /** Clear handler from DiceRollInput */
  const handleClear = useCallback(() => {
    setDebugInfo(null)
    setValidationMsg(null)
  }, [])

  /** Button click — show inline validation if inputs are incomplete */
  const handleAnalyzeClick = () => {
    if (!rollIsComplete) {
      setValidationMsg('Enter all 5 dice (1–6) to analyze your roll.')
      return
    }
    if (testPosition !== 'hammer' && !testGame) {
      setValidationMsg('Select the game the Hammer called.')
      return
    }
    runAnalysis()
  }

  // ── Sidebar tips based on position ──
  const positionTips = {
    hammer: (
      <>
        <p className="font-medium text-sm">You're the Hammer</p>
        <p className="text-xs text-muted-foreground">
          You choose which game to call. We'll rank every playable game by
          Global Strength — the probability you won't have the worst hand.
        </p>
      </>
    ),
    'first-refusal': (
      <>
        <p className="font-medium text-sm">You're First Refusal</p>
        <p className="text-xs text-muted-foreground">
          The Hammer has called a game. Select it below, and we'll tell you
          whether to <strong>accept</strong> or <strong>refuse</strong> based
          on your hand strength and likely second calls.
        </p>
      </>
    ),
    'second-refusal': (
      <>
        <p className="font-medium text-sm">You're Second Refusal</p>
        <p className="text-xs text-muted-foreground">
          If you refuse, the Hammer <em>must</em> pick a second call — no more
          negotiation. We'll weigh your hand at the called game vs. the
          expected second-call outcomes.
        </p>
      </>
    ),
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
              {/* Help Section — position-specific tips */}
              <div className="lg:order-2 lg:w-80 flex-shrink-0">
                <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                  <h3 className="font-semibold text-sm">How to Use</h3>
                  <div className="flex gap-2">
                    <span className="text-lg">1️⃣</span>
                    <div>
                      <p className="font-medium text-sm">Enter Your Roll</p>
                      <p className="text-xs text-muted-foreground">Tap each die or use 🎲 Roll Random</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-lg">2️⃣</span>
                    <div>
                      <p className="font-medium text-sm">Select Your Position</p>
                      <p className="text-xs text-muted-foreground">
                        <strong>Hammer:</strong> You call the game<br/>
                        <strong>First/Second Refusal:</strong> Accept or refuse
                      </p>
                    </div>
                  </div>
                  {testPosition !== 'hammer' && (
                    <div className="flex gap-2">
                      <span className="text-lg">3️⃣</span>
                      <div>
                        <p className="font-medium text-sm">Select the Called Game</p>
                        <p className="text-xs text-muted-foreground">
                          Pick the game the Hammer called
                          {GAMES.find(g => g.id === testGame)?.hasVariants && ' and its variant'}
                        </p>
                      </div>
                    </div>
                  )}
                  {/* Position-specific tip */}
                  <div className="border-t pt-3 mt-1">
                    {positionTips[testPosition]}
                  </div>
                </div>
              </div>

              {/* Form Section */}
              <div className="lg:order-1 flex-1 space-y-4">
                <div>
                  <Label className="text-sm font-medium mb-2 block">Your Dice Roll</Label>
                  <DiceRollInput
                    diceValues={diceValues}
                    onDiceChange={handleDiceChange}
                    onClear={handleClear}
                  />
                </div>
                
                <div>
                  <Label className="text-sm font-medium mb-2 block">Your Position</Label>
                  <ToggleGroup type="single" value={testPosition} onValueChange={handlePositionChange} className="justify-start">
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
                
                {/* Game Called — refusal only */}
                {testPosition !== 'hammer' && (
                  <div>
                    <Label className="text-sm font-medium mb-2 block">Game the Hammer Called</Label>
                    <div className="flex flex-wrap gap-2">
                      {GAMES.map(game => (
                        <Button
                          key={game.id}
                          onClick={() => handleGameSelect(game.id)}
                          variant={testGame === game.id ? 'default' : 'outline'}
                          size="sm"
                        >
                          {game.emoji} {game.name}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Variant selector */}
                {testPosition !== 'hammer' && testGame && GAMES.find(g => g.id === testGame)?.hasVariants && (
                  <div>
                    <Label className="text-sm font-medium mb-2 block">Variant Called</Label>
                    <VariantSelector
                      selectedVariant={selectedVariant || 'all'}
                      onChange={v => setSelectedVariant(v)}
                      className="justify-start"
                    />
                  </div>
                )}

                {/* Inline validation — prompt to select a game */}
                {testPosition !== 'hammer' && !testGame && rollIsComplete && (
                  <p className="text-sm text-destructive font-medium">
                    Select the game the Hammer called to see your analysis.
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ═══════════ Results ═══════════ */}
        {debugInfo && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Analysis: {debugInfo.roll.join('')}</CardTitle>
                <CardDescription>
                  {testPosition === 'hammer' ? 'Recommended calls for your roll' : 
                   testPosition === 'first-refusal' ? 'First refusal analysis' : 
                   'Second refusal analysis'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {debugInfo.strategy && testPosition === 'hammer' && (
                  <HammerResults strategy={debugInfo.strategy} playerCount={playerCount} />
                )}
                {debugInfo.strategy && testPosition !== 'hammer' && (
                  <RefuserResults strategy={debugInfo.strategy} calledGameId={testGame} calledVariant={selectedVariant} />
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </section>
    </Layout>
  )
}

/* ───────────────────── Formula Dialog ────────────────────────── */

/** Returns a human-friendly game label, e.g. "Boss" or "10-2 High" */
const gameLabel = (rec) => {
  const g = GAMES_MAP[rec.game]
  const name = g?.name || rec.game
  return rec.variant ? `${name} ${rec.variant.charAt(0).toUpperCase() + rec.variant.slice(1)}` : name
}

/** Dialog showing the full globalStrength calculation for one recommendation */
const FormulaDialog = ({ rec, playerCount, trigger }) => {
  const numOpp = playerCount - 1
  const pThreat = rec.tieProbability
  const pWorst = Math.pow(pThreat, numOpp)
  const globalStr = (1 - pWorst) * 100
  const label = gameLabel(rec)

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger || (
          <button className="inline-flex items-center justify-center w-5 h-5 rounded-full
            text-muted-foreground hover:text-foreground hover:bg-muted
            transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
            aria-label={`Show formula for ${label}`}>
            <Info className="w-3.5 h-3.5" />
          </button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>How We Ranked {label}</DialogTitle>
          <DialogDescription>
            The globalStrength formula calculates the probability you won't have the worst hand.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          {/* Step 1: Threat probability */}
          <div className="rounded-md border p-3 bg-muted/30">
            <p className="font-semibold text-xs text-muted-foreground mb-1">Step 1 — Threat per opponent</p>
            <p className="font-mono text-sm">
              P(threat) = P(opponent makes game) × P(ties or beats kicker)
            </p>
            <p className="font-mono text-lg mt-1">
              P(threat) = <strong>{(pThreat * 100).toFixed(2)}%</strong>
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              This is the chance a single opponent can produce a hand at least as good as yours in {label}.
              {rec.kicker?.length > 0 && (
                <span> Your kicker [{rec.kicker.join(',')}] determines how hard it is to tie.</span>
              )}
            </p>
          </div>

          {/* Step 2: All opponents */}
          <div className="rounded-md border p-3 bg-muted/30">
            <p className="font-semibold text-xs text-muted-foreground mb-1">Step 2 — Worst-hand probability</p>
            <p className="font-mono text-sm">
              P(worst) = P(threat)<sup>{numOpp}</sup> = {(pThreat * 100).toFixed(2)}%<sup>{numOpp}</sup>
            </p>
            <p className="font-mono text-lg mt-1">
              P(worst) = <strong>{(pWorst * 100).toFixed(4)}%</strong>
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              You'd need <em>all</em> {numOpp} opponent{numOpp > 1 ? 's' : ''} to tie or beat you to have the worst hand.
            </p>
          </div>

          {/* Step 3: Global strength */}
          <div className="rounded-md border p-3 bg-primary/10 border-primary/30">
            <p className="font-semibold text-xs text-muted-foreground mb-1">Step 3 — Global Strength</p>
            <p className="font-mono text-sm">
              globalStrength = (1 − P(worst)) × 100
            </p>
            <p className="font-mono text-lg mt-1">
              globalStrength = (1 − {(pWorst * 100).toFixed(4)}%) × 100 = <strong className="text-primary">{globalStr.toFixed(2)}%</strong>
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              This is the probability that at least one opponent will have a worse hand than yours — meaning you <em>won't</em> lose.
            </p>
          </div>

          {/* Summary comparison */}
          <div className="text-xs text-muted-foreground border-t pt-3">
            <p><strong>Why this matters:</strong> Games with more kicker dice are harder to tie.
            A perfect 3-die kicker (e.g. <GameLink id="10-2">10-2</GameLink> [6,6,6]) has only a {(Math.pow(1/6,3)*100).toFixed(2)}% tie chance per opponent,
            while a perfect 1-die kicker (e.g. <GameLink id="pairs">Pairs</GameLink> [6]) has a {(1/6 * 100).toFixed(2)}% tie chance.
            Global strength captures this cross-game distinction.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

/* ───────────────────── Hammer Results ────────────────────────── */

const HammerResults = ({ strategy, playerCount }) => (
  <div className="space-y-4">
    <h3 className="text-lg font-semibold">🔨 Recommended Strategy</h3>
    
    {/* Best Call */}
    <div className="p-4 bg-primary/10 rounded-lg border-2 border-primary">
      <div className="flex items-center gap-3 mb-3">
        <span className="text-lg font-bold">Best Call:</span>
        <Badge variant="default" className="text-lg px-4 py-1">
          {strategy.bestCall 
            ? <><GameLink id={strategy.bestCall.game} className="text-inherit hover:text-inherit" />{strategy.bestCall.variant ? ` ${strategy.bestCall.variant}` : ''}</>
            : 'None'}
        </Badge>
        {strategy.bestCall && (
          <FormulaDialog rec={strategy.bestCall} playerCount={playerCount} />
        )}
      </div>
      <p className="text-muted-foreground mb-4">
        {strategy.bestCall?.explanation || strategy.summary}
      </p>
      {/* Kicker details */}
      {strategy.bestCall?.kicker?.length > 0 && (
        <div className="flex items-center gap-2 mb-4 text-sm">
          <span className="text-muted-foreground">Kicker:</span>
          <div className="flex gap-1">
            {strategy.bestCall.kicker.map((d, i) => (
              <span key={i} className="inline-flex items-center justify-center w-7 h-7 rounded bg-primary/20 font-bold text-sm border border-primary/30">
                {d}
              </span>
            ))}
          </div>
          <span className="text-xs text-muted-foreground">
            ({strategy.bestCall.kicker.length}-die kicker)
          </span>
        </div>
      )}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-3 bg-background rounded-md">
          <div className="text-xs text-muted-foreground mb-1">Global Strength</div>
          <div className="text-2xl font-bold">
            {strategy.bestCall?.globalStrength?.toFixed(1) || '0'}%
          </div>
        </div>
        <div className="p-3 bg-background rounded-md">
          <div className="text-xs text-muted-foreground mb-1">Flexibility</div>
          <div className="text-2xl font-bold">{strategy.flexibility || 0}/10</div>
        </div>
        <div className="p-3 bg-background rounded-md">
          <div className="text-xs text-muted-foreground mb-1">Difficulty</div>
          <div className="text-2xl font-bold capitalize">
            {strategy.bestCall?.gameInfo?.gameDifficulty || 'N/A'}
          </div>
        </div>
      </div>
    </div>

    {/* Alternatives */}
    {(strategy.secondBestCall || strategy.thirdBestCall) && (
      <div className="space-y-3">
        <h4 className="font-semibold text-sm text-muted-foreground">Alternative Calls</h4>
        {[strategy.secondBestCall, strategy.thirdBestCall].filter(Boolean).map((call, idx) => (
          <div key={idx} className="p-3 bg-muted/30 rounded-lg border">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant={idx === 0 ? 'secondary' : 'outline'} className="text-sm">
                {idx === 0 ? '2nd Best' : '3rd Best'}
              </Badge>
              <span className="font-semibold">
                <GameLink id={call.game} />{call.variant ? ` ${call.variant}` : ''}
              </span>
              <FormulaDialog rec={call} playerCount={playerCount} />
              {call.kicker && (
                <span className="text-xs text-muted-foreground">({call.kicker})</span>
              )}
            </div>
            <p className="text-sm text-muted-foreground mb-2">{call.explanation}</p>
            <div className="flex gap-4 text-xs">
              <span><strong>Global:</strong> {call.globalStrength.toFixed(1)}%</span>
              <span><strong>Tie Risk:</strong> {(call.tieProbability * 100).toFixed(1)}%</span>
              <span><strong>Difficulty:</strong> {call.gameInfo?.gameDifficulty || 'N/A'}</span>
            </div>
          </div>
        ))}
      </div>
    )}

    {/* All Playable Games Table */}
    {strategy.allRecommendations?.length > 0 && (
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
                        Global %
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p>Cross-game ranking metric: probability you won't have the worst hand. Click ℹ on any row to see the full formula.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TableHead>
                  <TableHead className="text-right">
                    <Tooltip>
                      <TooltipTrigger className="cursor-help border-b border-dotted border-muted-foreground">
                        Strength
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p>Your hand's quality for this specific game (0-100%).</p>
                      </TooltipContent>
                    </Tooltip>
                  </TableHead>
                  <TableHead className="text-right">
                    <Tooltip>
                      <TooltipTrigger className="cursor-help border-b border-dotted border-muted-foreground">
                        Tie Risk
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p>Probability one opponent ties or beats you at this game.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TableHead>
                  <TableHead className="text-center">Difficulty</TableHead>
                  <TableHead className="w-8"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {strategy.allRecommendations.map((rec, idx) => (
                  <TableRow key={idx} className={idx === 0 ? 'bg-primary/5 font-semibold' : ''}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {idx === 0 && <Badge variant="default" className="text-xs">★ Best</Badge>}
                        <span><GameLink id={rec.game} />{rec.variant ? ` ${rec.variant}` : ''}</span>
                        {rec.kicker?.length > 0 && <span className="text-xs text-muted-foreground">({rec.kicker.join(',')})</span>}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono font-bold">{rec.globalStrength.toFixed(1)}%</TableCell>
                    <TableCell className="text-right font-mono text-muted-foreground">{rec.rawStrength.toFixed(1)}%</TableCell>
                    <TableCell className="text-right font-mono">{(rec.tieProbability * 100).toFixed(1)}%</TableCell>
                    <TableCell className="text-center">
                      <Badge variant={
                        rec.gameInfo?.gameDifficulty === 'easy' ? 'default' :
                        rec.gameInfo?.gameDifficulty === 'medium' ? 'secondary' :
                        'outline'
                      }>
                        {rec.gameInfo?.gameDifficulty || 'N/A'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <FormulaDialog rec={rec} playerCount={playerCount} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TooltipProvider>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Sorted by Global Strength. Global % = (1 − P(threat)<sup>{playerCount - 1}</sup>) × 100 — probability you won't have the worst hand vs {playerCount - 1} opponent{playerCount > 2 ? 's' : ''}. Click ℹ on any row for the full breakdown.
        </p>
      </div>
    )}
  </div>
)

/* ───────────────────── Refuser Info Dialogs ──────────────────── */

/** Dialog explaining the Accept / Refuse decision logic */
const DecisionInfoDialog = ({ strategy, calledLabel }) => {
  const cga = strategy.calledGameAnalysis || {}
  const expSC = strategy.expectedSecondCallStrength ?? 0
  const best = strategy.bestSecondCallForPlayer

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="inline-flex items-center justify-center w-5 h-5 rounded-full
          text-muted-foreground hover:text-foreground hover:bg-muted
          transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
          aria-label="Show decision formula">
          <Info className="w-3.5 h-3.5" />
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>How We Decided: {strategy.decision}</DialogTitle>
          <DialogDescription>
            Here's how the accept/refuse recommendation was calculated.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          {/* Called-game strength */}
          <div className="rounded-md border p-3 bg-muted/30">
            <p className="font-semibold text-xs text-muted-foreground mb-1">Your hand at the called game</p>
            <p className="font-mono text-sm">
              Can make game: <strong>{cga.canMake ? 'Yes' : 'No'}</strong>
            </p>
            {cga.canMake && (
              <p className="font-mono text-sm">
                Raw strength: <strong>{(cga.rawStrength ?? 0).toFixed(1)}%</strong>
                {cga.rawStrength >= 65 ? ' (Strong — accept)'
                  : cga.rawStrength >= 40 ? ' (Decent — compare to 2nd calls)'
                  : ' (Weak — likely refuse)'}
              </p>
            )}
          </div>

          {/* Expected second-call value */}
          <div className="rounded-md border p-3 bg-muted/30">
            <p className="font-semibold text-xs text-muted-foreground mb-1">Expected second-call strength</p>
            <p className="font-mono text-sm">
              E(2nd call) = Σ(overlap% × your strength) / Σ(overlap%)
            </p>
            <p className="font-mono text-lg mt-1">
              E(2nd call) = <strong>{expSC.toFixed(1)}%</strong>
            </p>
            {best && (
              <p className="text-xs text-muted-foreground mt-1">
                Best alternative: <GameLink id={best.game}>{best.name}</GameLink> ({(best.overlapPct * 100).toFixed(0)}% likely) → your strength {(best.playerRawStrength ?? 0).toFixed(0)}%
              </p>
            )}
          </div>

          {/* Decision rule */}
          <div className={`rounded-md border p-3 ${
            strategy.decision === 'ACCEPT'
              ? 'bg-green-50 dark:bg-green-950/20 border-green-500/30'
              : 'bg-red-50 dark:bg-red-950/20 border-red-500/30'
          }`}>
            <p className="font-semibold text-xs text-muted-foreground mb-1">Decision rule</p>
            {!cga.canMake ? (
              <p className="text-sm">
                You can't make the called game. {best && best.playerCanMake && (best.playerRawStrength ?? 0) > 20
                  ? `Refusing gives a ${(best.overlapPct * 100).toFixed(0)}% chance the 2nd call is ${best.name} where you're stronger.`
                  : 'Second-call alternatives aren\'t much better either — accept and hope others are weaker.'}
              </p>
            ) : cga.rawStrength >= 65 ? (
              <p className="text-sm">
                <strong>Strong hand rule:</strong> strength ≥ 65% → ACCEPT.
                Your {(cga.rawStrength ?? 0).toFixed(0)}% is well above the threshold.
              </p>
            ) : cga.rawStrength >= 40 ? (
              <p className="text-sm">
                <strong>Decent hand rule:</strong> compare to expected 2nd-call strength.
                Called game: {(cga.rawStrength ?? 0).toFixed(0)}% vs E(2nd call): {expSC.toFixed(0)}%.
                {expSC > (cga.rawStrength ?? 0) + 10
                  ? ` 2nd call is ${(expSC - (cga.rawStrength ?? 0)).toFixed(0)}pp better → REFUSE.`
                  : ' Not significantly better → ACCEPT.'}
              </p>
            ) : (
              <p className="text-sm">
                <strong>Weak hand rule:</strong> strength &lt; 40% → compare to 2nd calls.
                Called game: {(cga.rawStrength ?? 0).toFixed(0)}% vs E(2nd call): {expSC.toFixed(0)}%.
                {expSC > (cga.rawStrength ?? 0)
                  ? ' 2nd call is better → REFUSE.'
                  : ' 2nd call is no better → ACCEPT reluctantly.'}
              </p>
            )}
          </div>

          {/* Confidence */}
          <div className="rounded-md border p-3 bg-muted/30">
            <p className="font-semibold text-xs text-muted-foreground mb-1">Confidence: {strategy.confidence}%</p>
            <p className="text-xs text-muted-foreground">
              Confidence scales with how clearly your hand strength and expected second-call value separate.
              Stronger signals (large gaps, can't make game, etc.) push confidence higher. Capped at 95%.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

/** Dialog explaining rawStrength for the called game */
const CalledGameInfoDialog = ({ calledLabel, calledGameAnalysis }) => {
  const cga = calledGameAnalysis || {}
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="inline-flex items-center justify-center w-5 h-5 rounded-full
          text-muted-foreground hover:text-foreground hover:bg-muted
          transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
          aria-label="Show hand strength calculation">
          <Info className="w-3.5 h-3.5" />
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Your Hand at {calledLabel}</DialogTitle>
          <DialogDescription>
            How your hand's raw strength was calculated for this game.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 text-sm">
          <div className="rounded-md border p-3 bg-muted/30">
            <p className="font-semibold text-xs text-muted-foreground mb-1">Raw Strength</p>
            <p className="font-mono text-lg">
              <strong>{(cga.rawStrength ?? 0).toFixed(1)}%</strong>
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Raw strength is the percentile ranking of your hand among all possible 5-dice rolls
              for this game. 100% = best possible hand, 0% = worst.
            </p>
          </div>

          <div className="rounded-md border p-3 bg-muted/30">
            <p className="font-semibold text-xs text-muted-foreground mb-1">Assessment</p>
            <p className="text-sm">{cga.label || 'N/A'}</p>
            {cga.detail && <p className="text-xs text-muted-foreground mt-1">{cga.detail}</p>}
          </div>

          <div className="text-xs text-muted-foreground border-t pt-3">
            <p><strong>Thresholds:</strong> ≥ 65% = strong (usually accept), 40–64% = decent (compare to 2nd calls), &lt; 40% = weak (likely refuse).</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

/** Dialog explaining the second-call prediction methodology */
const SecondCallInfoDialog = ({ calledGameName, strategy }) => {
  const expSC = strategy.expectedSecondCallStrength ?? 0
  const scCount = (strategy.secondCallAnalysis || []).length

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="inline-flex items-center justify-center w-5 h-5 rounded-full
          text-muted-foreground hover:text-foreground hover:bg-muted
          transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
          aria-label="Show second-call methodology">
          <Info className="w-3.5 h-3.5" />
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Second-Call Predictions</DialogTitle>
          <DialogDescription>
            How we predict what the Hammer will call next if you refuse.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 text-sm">
          <div className="rounded-md border p-3 bg-muted/30">
            <p className="font-semibold text-xs text-muted-foreground mb-1">Overlap Analysis</p>
            <p className="text-sm">
              We look at all 252 unique 5-dice rolls and check: of the rolls where
              the Hammer could call {calledGameName}, what percentage also qualify for each other game?
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Higher "% likely" = more overlap between the called game and that alternative.
              The Hammer probably has a hand that qualifies for high-overlap games.
            </p>
          </div>

          <div className="rounded-md border p-3 bg-muted/30">
            <p className="font-semibold text-xs text-muted-foreground mb-1">Your Expected Value</p>
            <p className="font-mono text-sm">
              E(2nd call) = Σ(overlap% × your strength at that game) / Σ(overlap%)
            </p>
            <p className="font-mono text-lg mt-1">
              E(2nd call) = <strong>{expSC.toFixed(1)}%</strong>
              <span className="text-xs text-muted-foreground ml-2">across {scCount} possible games</span>
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              This weighted average tells you how well you'd do on average if the Hammer switches.
              If this exceeds your called-game strength, refusing is favorable.
            </p>
          </div>

          <div className="text-xs text-muted-foreground border-t pt-3">
            <p><strong>Your hand strength</strong> at each second-call game is shown below.
            Green (≥50%) is strong, yellow (30–49%) is decent, red (&lt;30%) is weak.
            The decision weighs all of these by their likelihood.</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

/* ───────────────────── Refuser Results ───────────────────────── */

const RefuserResults = ({ strategy, calledGameId, calledVariant }) => {
  const calledGameObj = GAMES_MAP[calledGameId]
  const calledLabel = calledGameObj
    ? <>{calledGameObj.emoji} <GameLink id={calledGameId}>{calledGameObj.name}</GameLink>{calledVariant ? ` ${calledVariant.charAt(0).toUpperCase() + calledVariant.slice(1)}` : ''}</>
    : calledGameId

  return (
    <div className="space-y-4">
      {/* Decision banner */}
      <div className={`p-5 rounded-lg border-2 text-center relative ${
        strategy.decision === 'ACCEPT'
          ? 'bg-green-50 dark:bg-green-950/30 border-green-500/60'
          : 'bg-red-50 dark:bg-red-950/30 border-red-500/60'
      }`}>
        <div className="absolute top-3 right-3">
          <DecisionInfoDialog strategy={strategy} calledLabel={calledLabel} />
        </div>
        <p className="text-3xl font-black mb-1">
          {strategy.decision === 'ACCEPT' ? '✅ ACCEPT' : '❌ REFUSE'}
        </p>
        <p className="text-sm text-muted-foreground">
          {strategy.confidence}% confidence
        </p>
      </div>

      {/* Reasoning */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Reasoning</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {(strategy.reasoning || []).map((r, i) => (
            <p key={i} className="text-sm text-muted-foreground leading-relaxed">{r}</p>
          ))}
        </CardContent>
      </Card>

      {/* Key Factors */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Key Factors</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {(strategy.factors || []).map((f, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{f.label}</span>
                <Badge variant={f.positive ? 'default' : 'secondary'}>
                  {f.value}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Your hand at the called game */}
      {strategy.calledGameAnalysis && (
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base">Your Hand at {calledLabel}</CardTitle>
            <CalledGameInfoDialog calledLabel={calledLabel} calledGameAnalysis={strategy.calledGameAnalysis} />
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <StrengthBar value={strategy.calledGameAnalysis.rawStrength} />
            </div>
            <span className="font-bold tabular-nums text-lg">
              {strategy.calledGameAnalysis.rawStrength.toFixed(0)}%
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            {strategy.calledGameAnalysis.label}
            {strategy.calledGameAnalysis.detail && (
              <span className="ml-1">— {strategy.calledGameAnalysis.detail}</span>
            )}
          </p>
        </CardContent>
      </Card>
      )}

      {/* Likely second calls & player's hand at each */}
      {strategy.secondCallAnalysis?.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base">Likely Second Calls (if refused)</CardTitle>
              <SecondCallInfoDialog calledGameName={calledGameObj?.name || calledGameId} strategy={strategy} />
            </div>
            <CardDescription className="text-xs">
              Based on what other games a typical <GameLink id={calledGameId}>{calledGameObj?.name}</GameLink>-calling hand also qualifies for. Your hand strength at each is shown.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(strategy.secondCallAnalysis || []).map((sc, i) => (
                <div key={i} className="rounded-lg border p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span>{sc.emoji}</span>
                      <span className="font-semibold text-sm"><GameLink id={sc.game}>{sc.name}</GameLink></span>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {(sc.overlapPct * 100).toFixed(0)}% likely
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground w-20 shrink-0">
                      Your hand:
                    </span>
                    <div className="flex-1">
                      <StrengthBar value={sc.playerRawStrength} />
                    </div>
                    <span className={`font-bold tabular-nums text-sm ${
                      sc.playerRawStrength >= 50 ? 'text-green-600 dark:text-green-400'
                      : sc.playerRawStrength >= 30 ? 'text-yellow-600 dark:text-yellow-400'
                      : 'text-red-600 dark:text-red-400'
                    }`}>
                      {sc.playerRawStrength.toFixed(0)}%
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {sc.playerLabel}
                    {sc.playerDetail && <span className="ml-1">— {sc.playerDetail}</span>}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default StrategyAssistantPage
