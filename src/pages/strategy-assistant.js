import React, { useState, useCallback, useEffect } from 'react'
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
import { 
  checkGame, 
  getKickerStrength,
  generateHammerStrategy,
  gameOddsMap
} from '../lib/game-validation'
import { simulateHammer, simulateRefusal } from '../strategy'
import { GAMES, GAMES_MAP } from '../lib/games-config'

const StrategyAssistantPage = () => {
  const [diceValues, setDiceValues] = useState(['', '', '', '', ''])
  const playerCount = 3 // fixed for now
  const [testPosition, setTestPosition] = useState('hammer')
  const [testGame, setTestGame] = useState(null)
  const [selectedVariant, setSelectedVariant] = useState(null)
  const [debugInfo, setDebugInfo] = useState(null)
  const [validationMsg, setValidationMsg] = useState(null)


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
    let pencilOdds = null
    if (testPosition === 'hammer') {
      const numOpponents = playerCount - 1
      strategy = generateHammerStrategy(parsedRoll, numOpponents, gameOddsMap)
      pencilOdds = simulateHammer({ dice: parsedRoll, players: playerCount, samples: 500 })
    } else if (testGame) {
      const gameHasVariants = GAMES.find(g => g.id === testGame)?.hasVariants
      // A refuser needs the exact call, including High or Low
      if (gameHasVariants && selectedVariant !== 'high' && selectedVariant !== 'low') {
        setDebugInfo(null)
        return
      }
      strategy = simulateRefusal({
        dice: parsedRoll,
        call: gameHasVariants ? { game: testGame, variant: selectedVariant } : { game: testGame },
        position: testPosition === 'first-refusal' ? 1 : 2,
        players: playerCount,
        samples: 800,
      })
    }

    setDebugInfo({ roll: parsedRoll, results, strategy, pencilOdds, position: testPosition })
    setValidationMsg(null)
  }, [parsedRoll, testPosition, testGame, selectedVariant, playerCount])

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
          You choose which game to call. We'll simulate your chance of the
          pencil for every call, including refusals and second calls.
        </p>
      </>
    ),
    'first-refusal': (
      <>
        <p className="font-medium text-sm">You're First Refusal</p>
        <p className="text-xs text-muted-foreground">
          The Hammer has called a game. Select it below, and we'll simulate
          your chance of the pencil if you <strong>accept</strong> or
          <strong> refuse</strong>. You keep your dice either way.
        </p>
      </>
    ),
    'second-refusal': (
      <>
        <p className="font-medium text-sm">You're Second Refusal</p>
        <p className="text-xs text-muted-foreground">
          First refusal already said no. If you refuse too, the Hammer
          <em> must</em> make a second call, a different game, and everyone
          plays it. We'll simulate both choices.
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
                      {GAMES.filter(game => game.id !== 'barking').map(game => (
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

                {testPosition !== 'hammer' && testGame && GAMES.find(g => g.id === testGame)?.hasVariants &&
                  selectedVariant !== 'high' && selectedVariant !== 'low' && rollIsComplete && (
                  <p className="text-sm text-destructive font-medium">
                    Select High or Low: the call decides which kickers win.
                  </p>
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
                  {debugInfo.position === 'hammer' ? 'Recommended calls for your roll' : 
                   debugInfo.position === 'first-refusal' ? 'First refusal analysis' : 
                   'Second refusal analysis'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {debugInfo.pencilOdds && debugInfo.position === 'hammer' && (
                  <HammerPencilOdds options={debugInfo.pencilOdds} playerCount={playerCount} />
                )}
                {debugInfo.strategy && debugInfo.position === 'hammer' && (
                  <HammerResults strategy={debugInfo.strategy} playerCount={playerCount} />
                )}
                {debugInfo.strategy && debugInfo.position !== 'hammer' && (
                  <RefuserResults strategy={debugInfo.strategy} calledGameId={testGame} calledVariant={selectedVariant} playerCount={playerCount} />
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
    <h3 className="text-lg font-semibold">🔨 Hand strength (heuristic)</h3>
    <p className="text-xs text-muted-foreground -mt-2">
      A quick score of your dice for each game. The simulated pencil chances above account for the refusals,
      the other players and the play itself, so trust those when the two disagree.
    </p>
    
    {/* Best Call */}
    <div className="p-4 bg-primary/10 rounded-lg border-2 border-primary">
      <div className="flex items-center gap-3 mb-3">
        <span className="text-lg font-bold">Strongest hand:</span>
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

/* ───────────────────── Refuser Results ───────────────────────── */

const pct = (p) => `${(p * 100).toFixed(1)}%`

const callLabel = (call) => gameLabel({ game: call.game, variant: call.variant })

/** How the simulated odds were made, shown under both result views */
const SimulationNote = ({ samples, players }) => (
  <p className="text-xs text-muted-foreground">
    Simulated: {samples.toLocaleString()} rounds at a {players}-player table, played out by the game engine with
    solid bot players (including you, after this decision). Other players' dice are random. Bots are heuristic, so
    these are odds against good, not perfect, play.
  </p>
)

const RefuserResults = ({ strategy, calledGameId, calledVariant, playerCount }) => {
  const { accept, refuse, secondCalls } = strategy
  const calledGameObj = GAMES_MAP[calledGameId]
  const calledLabel = calledGameObj
    ? <>{calledGameObj.emoji} <GameLink id={calledGameId}>{calledGameObj.name}</GameLink>{calledVariant ? ` ${calledVariant.charAt(0).toUpperCase() + calledVariant.slice(1)}` : ''}</>
    : calledGameId
  const decision = accept.pencil <= refuse.pencil ? 'ACCEPT' : 'REFUSE'
  const gap = Math.abs(accept.pencil - refuse.pencil)
  // Both options use the same deals, so the noise in the gap is smaller than either error; 2× the larger error is conservative
  const close = gap < 2 * Math.max(accept.error, refuse.error)

  return (
    <div className="space-y-4">
      <div className={`p-5 rounded-lg border-2 text-center ${
        decision === 'ACCEPT'
          ? 'bg-green-50 dark:bg-green-950/30 border-green-500/60'
          : 'bg-red-50 dark:bg-red-950/30 border-red-500/60'
      }`}>
        <p className="text-3xl font-black mb-1">{decision === 'ACCEPT' ? '✅ ACCEPT' : '❌ REFUSE'}</p>
        <p className="text-sm text-muted-foreground">
          {close ? 'Close call: the difference is within the simulation’s margin.' : `Lowers your chance of the pencil by ${(gap * 100).toFixed(1)} points.`}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {[
          { label: <>Accept {calledLabel}</>, est: accept, best: decision === 'ACCEPT' },
          { label: 'Refuse', est: refuse, best: decision === 'REFUSE' },
        ].map((o, i) => (
          <div key={i} className={`rounded-lg border p-3 ${o.best ? 'border-primary' : ''}`}>
            <p className="text-xs text-muted-foreground mb-1">{o.label}</p>
            <p className="text-2xl font-bold tabular-nums">{pct(o.est.pencil)}</p>
            <p className="text-xs text-muted-foreground">chance you take the pencil (±{(o.est.error * 100).toFixed(1)})</p>
          </div>
        ))}
      </div>

      <p className="text-sm text-muted-foreground">
        Refusing doesn't give you new dice: you keep this roll whatever is played. It only wins you a
        second call that may suit your dice better, or a refusal by the next player.
        {' '}A random player at a {playerCount}-player table takes the pencil {pct(1 / playerCount)} of the time.
      </p>

      {secondCalls.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">If you refuse: the Hammer's second call</CardTitle>
            <CardDescription className="text-xs">
              What a Hammer who called {calledGameObj?.name || calledGameId} went on to call when the refusal stood,
              and your chance of the pencil when they did. Rounds where the next refuser accepted aren't included here.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Second call</TableHead>
                  <TableHead className="text-right">How often</TableHead>
                  <TableHead className="text-right">Your pencil chance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {secondCalls.slice(0, 8).map((sc, i) => (
                  <TableRow key={i}>
                    <TableCell><GameLink id={sc.call.game}>{callLabel(sc.call)}</GameLink></TableCell>
                    <TableCell className="text-right tabular-nums">{pct(sc.share)}</TableCell>
                    <TableCell className="text-right tabular-nums">{pct(sc.pencil)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <SimulationNote samples={accept.samples} players={playerCount} />
    </div>
  )
}

/* ───────────────────── Hammer: simulated pencil odds ──────────── */

const HammerPencilOdds = ({ options, playerCount }) => (
  <Card>
    <CardHeader className="pb-2">
      <CardTitle className="text-base">Chance you take the pencil, by call</CardTitle>
      <CardDescription className="text-xs">
        Lower is better. A random player at a {playerCount}-player table takes the pencil {pct(1 / playerCount)} of the time.
      </CardDescription>
    </CardHeader>
    <CardContent className="space-y-3">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Call</TableHead>
            <TableHead className="text-right">Your pencil chance</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {options.slice(0, 6).map((o, i) => (
            <TableRow key={i}>
              <TableCell>
                <GameLink id={o.call.game}>{callLabel(o.call)}</GameLink>
                {i === 0 && <Badge className="ml-2">Best</Badge>}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {pct(o.pencil)} <span className="text-xs text-muted-foreground">±{(o.error * 100).toFixed(1)}</span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <SimulationNote samples={options[0].samples} players={playerCount} />
    </CardContent>
  </Card>
)

export default StrategyAssistantPage
