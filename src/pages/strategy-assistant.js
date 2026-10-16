import React, { useState, useCallback, useEffect } from 'react'
import Layout from '../components/layout'
import Page, { Chip, NextStep, PageHeader, PageTabs, Panel, Stat, tabFromUrl } from '../components/Page'
import { MathSteps } from '../components/Odds'
import SecondCallPredictor from '../components/SecondCallPredictor'
import { Badge } from '../components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../components/ui/tooltip'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '../components/ui/dialog'
import { Info } from 'lucide-react'
import { Hand, RollInput } from '../components/Dice'
import RefusalDecision from '../components/RefusalDecision'
import GameLink from '../components/GameLink'
import { 
  checkGame, 
  getKickerStrength,
  generateHammerStrategy,
  gameOddsMap
} from '../lib/game-validation'
import { simulateBark, simulateHammer, simulateRefusal } from '../strategy'
import { GAMES, GAMES_MAP } from '../lib/games-config'

const TABS = [
  { id: 'roll', label: 'Your roll' },
  { id: 'second', label: 'Predict the second call' },
]

const StrategyAssistantPage = () => {
  const [tab, setTab] = useState(null)
  useEffect(() => setTab(tabFromUrl(TABS)), [])
  const chooseTab = (id) => {
    window.history.replaceState(null, '', `${window.location.pathname}?tab=${id}`)
    setTab(id)
  }

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

  // Barking doesn't depend on your dice, only the table: simulate it once
  const [barkOdds, setBarkOdds] = useState(null)
  useEffect(() => {
    if (testPosition === 'hammer' && rollIsComplete && !barkOdds) {
      setBarkOdds(simulateBark({ players: playerCount, samples: 2000 }))
    }
  }, [testPosition, rollIsComplete, barkOdds])

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
    let call = null
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
      call = gameHasVariants ? { game: testGame, variant: selectedVariant } : { game: testGame }
      strategy = simulateRefusal({
        dice: parsedRoll,
        call,
        position: testPosition === 'first-refusal' ? 1 : 2,
        players: playerCount,
        samples: 800,
      })
    }

    setDebugInfo({ roll: parsedRoll, results, strategy, pencilOdds, call, position: testPosition })
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

  /** Dice change from RollInput */
  const handleDiceChange = useCallback((newValues) => {
    setDiceValues(newValues)
    setValidationMsg(null)
  }, [])

  /** Clear handler from RollInput */
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
      <Page width="tool">
        <PageHeader
          title="Strategy Assistant"
          description="Enter your roll and your seat to see what to call, or whether to accept or refuse."
        />
        {tab && <PageTabs tabs={TABS} value={tab} onChange={chooseTab} label="Strategy tools" />}
        {tab === 'second' && <SecondCallPredictor />}
        {tab === 'roll' && (<>

        <Panel tone="tool" title="Your roll and seat" as="div" className="mb-6">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
            <div className="space-y-5">
              <div className="space-y-2">
                <div className="text-sm font-semibold">Your dice</div>
                <RollInput diceValues={diceValues} onDiceChange={handleDiceChange} onClear={handleClear} />
              </div>

              <div className="space-y-2">
                <div className="text-sm font-semibold">Your seat</div>
                <div className="flex flex-wrap gap-1.5" role="group" aria-label="Your seat">
                  {[
                    ['hammer', '🔨 Hammer'],
                    ['first-refusal', '1st refusal'],
                    ['second-refusal', '2nd refusal'],
                  ].map(([id, text]) => (
                    <Chip key={id} active={testPosition === id} onClick={() => handlePositionChange(id)}>
                      {text}
                    </Chip>
                  ))}
                </div>
              </div>

              {testPosition !== 'hammer' && (
                <div className="space-y-2">
                  <div className="text-sm font-semibold">The Hammer called</div>
                  <div className="flex flex-wrap gap-1.5" role="group" aria-label="Game called">
                    {GAMES.filter((game) => game.id !== 'barking').map((game) => (
                      <Chip key={game.id} active={testGame === game.id} onClick={() => handleGameSelect(game.id)}>
                        <span aria-hidden>{game.emoji}</span> {game.name}
                      </Chip>
                    ))}
                  </div>
                  {testGame && GAMES.find((g) => g.id === testGame)?.hasVariants && (
                    <div className="flex gap-1.5" role="group" aria-label="Variant called">
                      {['high', 'low'].map((v) => (
                        <Chip key={v} active={selectedVariant === v} onClick={() => setSelectedVariant(v)}>
                          {v === 'high' ? 'High' : 'Low'}
                        </Chip>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {testPosition !== 'hammer' && testGame && GAMES.find(g => g.id === testGame)?.hasVariants &&
                selectedVariant !== 'high' && selectedVariant !== 'low' && rollIsComplete && (
                <p className="text-sm font-medium text-primary">Pick High or Low: the call decides which kicker wins.</p>
              )}
              {testPosition !== 'hammer' && !testGame && rollIsComplete && (
                <p className="text-sm font-medium text-primary">Pick the game the Hammer called to see your odds.</p>
              )}
            </div>

            <div className="space-y-1 rounded-lg bg-background/70 p-4 text-sm">{positionTips[testPosition]}</div>
          </div>
        </Panel>

        {/* ═══════════ Results ═══════════ */}
        {debugInfo && (
          <section className="space-y-6" aria-live="polite">
            {debugInfo.position === 'hammer' ? (
              <>
                {debugInfo.pencilOdds && (
                  <HammerPencilOdds
                    options={debugInfo.pencilOdds}
                    bark={barkOdds}
                    dice={debugInfo.roll}
                    playerCount={playerCount}
                  />
                )}
                {debugInfo.strategy && (
                  <Panel tone="note" title="Hand strength by rule of thumb">
                    <details className="group">
                      <summary className="cursor-pointer font-medium text-primary hover:underline">
                        Show every game’s score
                      </summary>
                      <div className="mt-4">
                        <HammerResults strategy={debugInfo.strategy} dice={debugInfo.roll} playerCount={playerCount} />
                      </div>
                    </details>
                  </Panel>
                )}
              </>
            ) : (
              debugInfo.strategy && (
                <Panel title={debugInfo.position === 'first-refusal' ? 'You’re the 1st refusal' : 'You’re the 2nd refusal'}>
                  <RefusalDecision
                    estimate={debugInfo.strategy}
                    dice={debugInfo.roll}
                    call={debugInfo.call}
                    position={debugInfo.position === 'first-refusal' ? 1 : 2}
                    players={playerCount}
                  />
                </Panel>
              )
            )}
          </section>
        )}
        </>)}
        <NextStep to="/play" title="Play the bots" text="Try your calls and refusals in full games." />
      </Page>
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
          <DialogTitle>How {label} is ranked</DialogTitle>
          <DialogDescription>
            Global strength is the chance you won’t have the worst hand, by rule of thumb.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          <MathSteps
            steps={[
              {
                label: 'One opponent ties or beats you (makes the game, then ties or beats your kicker)',
                result: `${(pThreat * 100).toFixed(2)}%`,
              },
              {
                label: `All ${numOpp} opponent${numOpp > 1 ? 's' : ''} tie or beat you (you have the worst hand)`,
                expr: `${(pThreat * 100).toFixed(2)}%^${numOpp}`,
                result: `${(pWorst * 100).toFixed(4)}%`,
              },
              {
                label: 'Global strength',
                expr: `1 − ${(pWorst * 100).toFixed(4)}%`,
                result: `${globalStr.toFixed(2)}%`,
                total: true,
              },
            ]}
          />
          <p className="text-xs text-muted-foreground">
            Games with more kicker dice are harder to tie. A perfect 3-die kicker (<GameLink id="10-2">10-2</GameLink> with
            6+6+6) is tied {(Math.pow(1 / 6, 3) * 100).toFixed(2)}% of the time by one opponent; a perfect 1-die kicker
            (<GameLink id="pairs">Pairs</GameLink> with a 6) {(100 / 6).toFixed(2)}%.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}

/* ───────────────────── Hammer Results ────────────────────────── */

const HammerResults = ({ strategy, dice, playerCount }) => (
  <div className="space-y-6">
    <p className="text-muted-foreground">
      A quick score of your dice for each game. The simulated pencil chances above account for the refusals,
      the other players and the play itself, so trust those when the two disagree.
    </p>

    {/* Best Call */}
    <div className="space-y-3">
      <h3 className="flex flex-wrap items-center gap-2 text-lg font-semibold">
        Strongest hand:
        {strategy.bestCall ? (
          <span className="flex items-center gap-1">
            <GameLink id={strategy.bestCall.game} />
            {strategy.bestCall.variant && <span>{strategy.bestCall.variant}</span>}
            <FormulaDialog rec={strategy.bestCall} playerCount={playerCount} />
          </span>
        ) : (
          'none'
        )}
      </h3>
      <p className="text-muted-foreground">{strategy.bestCall?.explanation || strategy.summary}</p>
      {strategy.bestCall && (
        <Hand dice={dice} game={strategy.bestCall.game} variant={strategy.bestCall.variant} />
      )}
      <div className="grid gap-3 sm:grid-cols-3">
        <Stat value={`${strategy.bestCall?.globalStrength?.toFixed(1) || '0'}%`} label="Global strength" />
        <Stat value={`${strategy.flexibility || 0}/10`} label="Flexibility" />
        <Stat
          value={<span className="capitalize">{strategy.bestCall?.gameInfo?.gameDifficulty || 'N/A'}</span>}
          label="Difficulty"
        />
      </div>
    </div>

    {/* Alternatives */}
    {(strategy.secondBestCall || strategy.thirdBestCall) && (
      <div>
        <h3 className="mb-2 text-lg font-semibold">Alternative calls</h3>
        <ol className="divide-y border-y">
          {[strategy.secondBestCall, strategy.thirdBestCall].filter(Boolean).map((call, idx) => (
            <li key={idx} className="py-3">
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <Badge variant="secondary">{idx === 0 ? '2nd best' : '3rd best'}</Badge>
                <span className="font-semibold">
                  <GameLink id={call.game} />{call.variant ? ` ${call.variant}` : ''}
                </span>
                <FormulaDialog rec={call} playerCount={playerCount} />
              </div>
              <p className="mb-1 text-muted-foreground">{call.explanation}</p>
              <div className="flex flex-wrap gap-x-4 text-xs">
                <span><strong>Global:</strong> {call.globalStrength.toFixed(1)}%</span>
                <span><strong>Tie risk:</strong> {(call.tieProbability * 100).toFixed(1)}%</span>
                <span><strong>Difficulty:</strong> {call.gameInfo?.gameDifficulty || 'N/A'}</span>
              </div>
            </li>
          ))}
        </ol>
      </div>
    )}

    {/* All Playable Games Table */}
    {strategy.allRecommendations?.length > 0 && (
      <div>
        <h3 className="mb-2 text-lg font-semibold">All playable games</h3>
        <div className="overflow-x-auto">
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
                      </div>
                      <Hand dice={dice} game={rec.game} variant={rec.variant} size="xs" className="mt-1" />
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

/* ───────────────────── Hammer: simulated pencil odds ──────────── */

const pctRound = (p) => `${Math.round(p * 100)}%`

/**
 * A decoy call: refused often enough, and you lose less after the second
 * call than when it's accepted. Returns the second-call path, or null.
 */
const decoy = (option) => {
  const accepted = option.paths.find((p) => p.path === 'accepted')
  const second = option.paths.find((p) => p.path === 'secondCall')
  return second && second.share >= 0.3 && (!accepted || second.pencil < accepted.pencil) ? second : null
}

/** What happened after a call: accepted, or both refused and your second call */
const CallPaths = ({ paths }) => (
  <span className="mt-1.5 block space-y-0.5 text-xs text-muted-foreground">
    {paths.map((p) => (
      <span key={p.path} className="block">
        {p.path === 'accepted' ? (
          <>Accepted {pctRound(p.share)} of the time: you lose {pctRound(p.pencil)}</>
        ) : (
          <>
            Both refuse {pctRound(p.share)}: you call {callLabel(p.call)}, lose {pctRound(p.pencil)}
          </>
        )}
      </span>
    ))}
  </span>
)

const HammerPencilOdds = ({ options, bark, dice, playerCount }) => {
  // Bark ranks with the calls; its odds don't depend on your dice
  const rows = options.slice(0, 6).map((o) => ({ ...o, bark: false }))
  if (bark) rows.push({ ...bark, bark: true })
  rows.sort((a, b) => a.pencil - b.pencil)
  const best = options[0]
  const barkBest = bark && bark.pencil < best.pencil
  return (
    <Panel
      title="Chance you take the pencil, by call"
      description={`Lower is better. A random player at a ${playerCount}-player table takes the pencil ${pct(1 / playerCount)} of the time.`}
    >
      <div className="space-y-3">
        {bark && (
          <p className="text-sm">
            {barkBest ? (
              <>
                <strong>Bark.</strong> Your best call, {callLabel(best.call)}, gives you a {pct(best.pencil)} chance of
                the pencil; barking gives you {pct(bark.pencil)}.
              </>
            ) : (
              <>
                <strong>Call {callLabel(best.call)}, don’t bark.</strong> Barking gives you a {pct(bark.pencil)} chance
                of the pencil, {((bark.pencil - best.pencil) * 100).toFixed(1)} points higher than this call.
              </>
            )}{' '}
            {decoy(best) && (
              <>
                Its value is mostly the second call: when both refuse ({pctRound(decoy(best).share)} of the time), you
                call {callLabel(decoy(best).call)}, and nobody can refuse that.{' '}
              </>
            )}
            <span className="text-muted-foreground">
              A bark passes the Hammer left and deals everyone new dice, which puts you in the worst seat: last to
              act, with no say in the game.
            </span>
          </p>
        )}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Call</TableHead>
              <TableHead className="text-right">Your pencil chance</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((o, i) => (
              <TableRow key={o.bark ? 'bark' : `${o.call.game}-${o.call.variant}`}>
                <TableCell>
                  {o.bark ? (
                    <>
                      <GameLink id="barking">🐶 Bark</GameLink>
                      {i === 0 && <Badge className="ml-2">Best</Badge>}
                      <span className="mt-1 block text-xs text-muted-foreground">New dice for everyone, any hand</span>
                    </>
                  ) : (
                    <>
                      <GameLink id={o.call.game}>{callLabel(o.call)}</GameLink>
                      {i === 0 && <Badge className="ml-2">Best</Badge>}
                      <Hand dice={dice} game={o.call.game} variant={o.call.variant} size="sm" className="mt-1 block" />
                      <CallPaths paths={o.paths} />
                    </>
                  )}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {pct(o.pencil)} <span className="text-xs text-muted-foreground">±{(o.error * 100).toFixed(1)}</span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <SimulationNote samples={options[0].samples} players={playerCount} />
        {bark && (
          <p className="text-xs text-muted-foreground">
            Bark: {bark.samples.toLocaleString()} simulated rounds after a bark. The bots never bark back, so the new
            Hammer always calls.
          </p>
        )}
      </div>
    </Panel>
  )
}

export default StrategyAssistantPage
