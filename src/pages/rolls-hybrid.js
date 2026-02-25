import React, { useState, useMemo, useCallback, useRef } from 'react'
import { graphql } from 'gatsby'
import Layout from '../components/layout'
import { Badge } from '../components/ui/badge'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table'
import { Label } from '../components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { ToggleGroup, ToggleGroupItem } from '../components/ui/toggle-group'
import { Switch } from '../components/ui/switch'
import uniqueRollsData from '../data/unique-rolls.json'
import { GAMES, GAMES_MAP, fmtPct, isSpecialtyGame, SPECIALTY_THRESHOLDS } from '../lib/games-config'
import {
  checkGame,
  getKickerStrength,
  calculateOffensiveStrength,
  isCompetitiveSpecialtyHand,
} from '../lib/game-validation'
import { StrengthBar } from '../components/RollAnalysis'
import SecondCallDistribution from '../components/SecondCallDistribution'

/* ────────────────────────── precompute ───────────────────────── */

const TOTAL = 7776
const DICE_FACES = [1, 2, 3, 4, 5, 6]

const GAME_ODDS = (() => {
  const allRolls = []
  for (let a = 1; a <= 6; a++)
    for (let b = 1; b <= 6; b++)
      for (let c = 1; c <= 6; c++)
        for (let d = 1; d <= 6; d++)
          for (let e = 1; e <= 6; e++)
            allRolls.push([a, b, c, d, e])

  return GAMES.map(g => {
    if (isSpecialtyGame(g.id)) {
      let competitiveCount = 0
      allRolls.forEach(r => {
        if (isCompetitiveSpecialtyHand(r, g.id, SPECIALTY_THRESHOLDS)) competitiveCount++
      })
      return { ...g, total: competitiveCount, pct: parseFloat(((competitiveCount / TOTAL) * 100).toFixed(1)) }
    }
    let total = 0
    allRolls.forEach(r => { if (checkGame(r, g.id)) total++ })
    return { ...g, total, pct: parseFloat(((total / TOTAL) * 100).toFixed(1)) }
  })
})()

const pctBarBg = pct => {
  if (pct >= 45) return 'bg-green-500'
  if (pct >= 30) return 'bg-blue-500'
  if (pct >= 20) return 'bg-yellow-500'
  return 'bg-orange-500'
}

/* ─────────────────────── sub-components ──────────────────────── */

/** Horizontal odds chip (for the ribbon) */
const OddsChip = ({ game, isActive, onClick }) => {
  const isAlways = isSpecialtyGame(game.id)
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-lg border-2 transition-all min-w-[72px]
        focus:outline-none focus:ring-2 focus:ring-primary
        ${isActive
          ? 'border-primary bg-primary/5 shadow-sm'
          : 'border-transparent hover:border-primary/30 hover:bg-muted/50'}`}
    >
      <span className="text-lg leading-none">{game.emoji}</span>
      <span className="text-[10px] font-medium text-foreground leading-tight">{game.name}</span>
      <span className="text-xs font-bold tabular-nums leading-tight">
        {`${game.pct}%`}
      </span>
    </button>
  )
}

/** Clickable die face */
const DieFace = ({ value, state, onClick }) => {
  const cls =
    state === 'must'
      ? 'bg-green-600 text-white border-green-700'
      : state === 'not'
      ? 'bg-red-500/20 text-red-500 border-red-400 line-through'
      : 'bg-muted text-muted-foreground border-border hover:border-primary/40'

  return (
    <button
      onClick={onClick}
      className={`w-9 h-9 rounded-md border-2 font-bold text-base transition-all
        focus:outline-none focus:ring-2 focus:ring-primary ${cls}`}
    >
      {value}
    </button>
  )
}

/** Game pill toggle */
const GameToggle = ({ game, state, onClick }) => {
  const isAlways = isSpecialtyGame(game.id)
  const cls =
    state === 'must'
      ? 'border-green-600 bg-green-600/10 text-green-700 dark:text-green-400'
      : state === 'not'
      ? 'border-red-500 bg-red-500/10 text-red-600 dark:text-red-400 line-through'
      : 'border-border text-muted-foreground hover:border-primary/40'

  return (
    <button
      onClick={onClick}
      disabled={isAlways && state === 'off'} // can't require/exclude always-valid meaningfully
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-[11px] font-medium transition-all
        focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-40 ${cls}`}
    >
      <span>{game.emoji}</span>
      <span>{game.name}</span>
    </button>
  )
}

/** Expanded roll detail */
const ExpandedDetail = ({ roll, numOpponents }) => {
  const variants = roll.analysis?.variants || []
  return (
    <div className="grid sm:grid-cols-2 gap-x-6 gap-y-1 py-2">
      {variants
        .map(v => ({
          ...v,
          off: calculateOffensiveStrength(v.rawStrength, numOpponents, v.game),
        }))
        .sort((a, b) => b.off - a.off)
        .map((v, i) => {
          const g = GAMES_MAP[v.game] || { name: v.game, emoji: '🎲' }
          const label = v.variant ? `${g.name} ${v.variant === 'high' ? 'High' : 'Low'}` : g.name
          return (
            <div key={i} className="flex items-center gap-2 py-0.5">
              <span className="text-sm w-5 text-center shrink-0">{g.emoji}</span>
              <span className="text-xs font-medium flex-1 truncate">{label}</span>
              <StrengthBar value={v.off} className="w-14 shrink-0" />
              <span className="text-[11px] font-mono text-muted-foreground w-10 text-right tabular-nums shrink-0">
                {fmtPct(v.off)}
              </span>
            </div>
          )
        })}
      {roll.analysis && (
        <div className="sm:col-span-2 text-[10px] text-muted-foreground mt-1 pt-1 border-t">
          Flexibility: {roll.analysis.flexibility} &bull; Details: {roll.analysis.bestCall?.details || '—'}
        </div>
      )}
    </div>
  )
}

/** Verification grid */
const ProofGrid = ({ rolls }) => {
  const [showAll, setShowAll] = useState(false)
  const MAX = 100
  const show = showAll ? rolls : rolls.slice(0, MAX)

  return (
    <div>
      <div className="flex flex-wrap gap-1 font-mono text-xs">
        {show.map((r, i) => (
          <Badge key={i} variant="secondary" className="px-1.5 py-0.5 tabular-nums">
            {r.roll.join('')}<span className="ml-1 text-muted-foreground">×{r.count}</span>
          </Badge>
        ))}
      </div>
      {rolls.length > MAX && !showAll && (
        <Button variant="ghost" size="sm" className="mt-2 text-xs" onClick={() => setShowAll(true)}>
          Show all {rolls.length}…
        </Button>
      )}
    </div>
  )
}

/* ═══════════════════════════ MAIN PAGE ═══════════════════════════ */

const RollHybrid = ({ data }) => {
  // Ribbon game focus (selects game for detail panel, also presets game filter)
  const [focusedGameId, setFocusedGameId] = useState(null)

  // Explorer filters
  const [diceFilter, setDiceFilter] = useState(
    Object.fromEntries(DICE_FACES.map(f => [f, 'off']))
  )
  const [gameFilter, setGameFilter] = useState(
    Object.fromEntries(GAMES.map(g => [g.id, 'off']))
  )

  const [sortBy, setSortBy] = useState('off-desc')
  const [expandedIdx, setExpandedIdx] = useState(null)
  const [showProof, setShowProof] = useState(false)
  const [showExplorer, setShowExplorer] = useState(false)

  const numOpponents = 0 // single-player probability view
  const detailRef = useRef(null)
  const explorerRef = useRef(null)

  // When clicking a game in the ribbon
  const handleRibbonClick = useCallback(id => {
    if (focusedGameId === id) {
      setFocusedGameId(null)
    } else {
      setFocusedGameId(id)
      setShowProof(false)
      requestAnimationFrame(() =>
        detailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      )
    }
  }, [focusedGameId])

  const cycleDice = useCallback(f => {
    setDiceFilter(prev => ({
      ...prev,
      [f]: prev[f] === 'off' ? 'must' : prev[f] === 'must' ? 'not' : 'off',
    }))
  }, [])

  const cycleGame = useCallback(id => {
    setGameFilter(prev => ({
      ...prev,
      [id]: prev[id] === 'off' ? 'must' : prev[id] === 'must' ? 'not' : 'off',
    }))
  }, [])

  const clearAll = useCallback(() => {
    setDiceFilter(Object.fromEntries(DICE_FACES.map(f => [f, 'off'])))
    setGameFilter(Object.fromEntries(GAMES.map(g => [g.id, 'off'])))
  }, [])

  const hasFilters = useMemo(() => (
    Object.values(diceFilter).some(v => v !== 'off') ||
    Object.values(gameFilter).some(v => v !== 'off')
  ), [diceFilter, gameFilter])

  const focusedGame = GAME_ODDS.find(g => g.id === focusedGameId) || null

  // Matching rolls for focused game (detail panel)
  const detailRolls = useMemo(() => {
    if (!focusedGameId) return []
    return uniqueRollsData.uniqueRolls.filter(r => checkGame(r.roll, focusedGameId))
  }, [focusedGameId])

  const detailTotalInstances = useMemo(
    () => detailRolls.reduce((s, r) => s + r.count, 0),
    [detailRolls]
  )

  // Explorer filtered rolls
  const explorerRolls = useMemo(() => {
    const mustDice = DICE_FACES.filter(f => diceFilter[f] === 'must')
    const notDice = DICE_FACES.filter(f => diceFilter[f] === 'not')
    const mustGames = GAMES.filter(g => gameFilter[g.id] === 'must').map(g => g.id)
    const notGames = GAMES.filter(g => gameFilter[g.id] === 'not').map(g => g.id)

    let results = uniqueRollsData.uniqueRolls.filter(r => {
      const roll = r.roll
      for (const d of mustDice) if (!roll.includes(d)) return false
      for (const d of notDice) if (roll.includes(d)) return false
      for (const gid of mustGames) if (!checkGame(roll, gid)) return false
      for (const gid of notGames) if (checkGame(roll, gid)) return false
      return true
    })

    results = results.map(r => {
      const best = r.analysis?.bestCall
      const off = best ? calculateOffensiveStrength(best.rawStrength, numOpponents, best.game) : 0
      return { ...r, computedOff: off }
    })

    const [field, dir] = sortBy.split('-')
    results.sort((a, b) => {
      let va, vb
      if (field === 'off') { va = a.computedOff; vb = b.computedOff }
      else if (field === 'flex') { va = a.analysis?.flexibility || 0; vb = b.analysis?.flexibility || 0 }
      else { va = a.count; vb = b.count }
      return dir === 'desc' ? vb - va : va - vb
    })

    return results
  }, [diceFilter, gameFilter, sortBy, numOpponents])

  const explorerInstances = useMemo(
    () => explorerRolls.reduce((s, r) => s + r.count, 0),
    [explorerRolls]
  )

  // Top 15 strongest detail rolls
  const topDetailRolls = useMemo(() => {
    if (!detailRolls.length) return []
    return [...detailRolls]
      .map(r => {
        const v = r.analysis?.variants?.find(v => v.game === focusedGameId)
        const off = v ? calculateOffensiveStrength(v.rawStrength, numOpponents, focusedGameId) : 0
        return { ...r, off }
      })
      .sort((a, b) => b.off - a.off)
      .slice(0, 15)
  }, [detailRolls, focusedGameId, numOpponents])

  return (
    <Layout>
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold">Odds & Explorer</h1>
          <p className="text-base text-muted-foreground mt-2 max-w-lg mx-auto">
            Game probabilities at a glance. Tap a game to drill in,
            or open the Explorer to build custom queries.
          </p>
        </div>

        {/* ── Odds Ribbon ── */}
        <div className="overflow-x-auto pb-2 mb-6 -mx-4 px-4">
          <div className="flex gap-1 min-w-max">
            {GAME_ODDS.map(g => (
              <OddsChip
                key={g.id}
                game={g}
                isActive={focusedGameId === g.id}
                onClick={() => handleRibbonClick(g.id)}
              />
            ))}
          </div>
        </div>

        {/* ── Game Detail Panel (from ribbon) ── */}
        {focusedGame && (
          <div ref={detailRef} className="space-y-6 mb-8">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{focusedGame.emoji}</span>
                  <div>
                    <CardTitle>{focusedGame.name}</CardTitle>
                    <CardDescription>
                      {detailRolls.length} unique rolls &bull;{' '}
                      {detailTotalInstances.toLocaleString()} instances (
                      {((detailTotalInstances / TOTAL) * 100).toFixed(1)}%)
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Top rolls */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Strongest Rolls</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-20">Roll</TableHead>
                      <TableHead className="text-right w-10">×</TableHead>
                      <TableHead>Strength</TableHead>
                      <TableHead className="text-right w-14">Off%</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topDetailRolls.map((r, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-mono text-sm font-semibold">{r.roll.join('')}</TableCell>
                        <TableCell className="text-right text-xs text-muted-foreground tabular-nums">{r.count}</TableCell>
                        <TableCell><StrengthBar value={r.off} /></TableCell>
                        <TableCell className="text-right font-mono text-sm font-bold text-orange-600 dark:text-orange-400 tabular-nums">
                          {fmtPct(r.off)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Second call */}
            <SecondCallDistribution
              gameId={focusedGameId}
              hasVariants={focusedGame.hasVariants}
              numOpponents={numOpponents}
              showTabs={false}
            />

            {/* Verification */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">Verify: All Matching Rolls</CardTitle>
                    <CardDescription className="text-xs">
                      Count them yourself — {detailRolls.length} unique rolls
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="proof" className="text-xs text-muted-foreground">Show</Label>
                    <Switch id="proof" checked={showProof} onCheckedChange={setShowProof} />
                  </div>
                </div>
              </CardHeader>
              {showProof && (
                <CardContent>
                  <ProofGrid rolls={detailRolls} />
                </CardContent>
              )}
            </Card>
          </div>
        )}

        {/* ── Explorer Toggle ── */}
        <div className="flex items-center justify-center mb-4">
          <Button
            variant={showExplorer ? 'default' : 'outline'}
            onClick={() => {
              setShowExplorer(v => !v)
              if (!showExplorer) {
                requestAnimationFrame(() =>
                  explorerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                )
              }
            }}
          >
            {showExplorer ? 'Hide' : 'Open'} Roll Explorer
          </Button>
        </div>

        {/* ── Explorer ── */}
        {showExplorer && (
          <div ref={explorerRef} className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">Query Builder</CardTitle>
                    <CardDescription className="text-xs">
                      Cycle: <span className="text-green-600 font-semibold">must</span>{' '}
                      → <span className="text-red-500 font-semibold">not</span> → off
                    </CardDescription>
                  </div>
                  {hasFilters && (
                    <Button variant="ghost" size="sm" onClick={clearAll} className="text-xs">
                      Clear
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Dice */}
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5 block">Dice Values</Label>
                  <div className="flex gap-2 flex-wrap">
                    {DICE_FACES.map(f => (
                      <DieFace key={f} value={f} state={diceFilter[f]} onClick={() => cycleDice(f)} />
                    ))}
                  </div>
                </div>
                {/* Games */}
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5 block">Game Eligibility</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {GAMES.filter(g => !isSpecialtyGame(g.id)).map(g => (
                      <GameToggle key={g.id} game={g} state={gameFilter[g.id]} onClick={() => cycleGame(g.id)} />
                    ))}
                  </div>
                </div>
                {/* Sort */}
                <div className="flex items-center gap-3 pt-2 border-t">
                  <Label className="text-xs text-muted-foreground">Sort:</Label>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-40 h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="off-desc">Off. Strength ↓</SelectItem>
                      <SelectItem value="off-asc">Off. Strength ↑</SelectItem>
                      <SelectItem value="flex-desc">Flexibility ↓</SelectItem>
                      <SelectItem value="count-desc">Frequency ↓</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Results summary */}
            <div className="flex items-baseline justify-between flex-wrap gap-2">
              <div>
                <span className="text-lg font-bold tabular-nums">{explorerRolls.length}</span>
                <span className="text-sm text-muted-foreground ml-1">
                  unique rolls ({explorerInstances.toLocaleString()} instances)
                </span>
              </div>
            </div>

            {/* Results table */}
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-20">Roll</TableHead>
                      <TableHead className="text-right w-10">×</TableHead>
                      <TableHead className="hidden sm:table-cell">Games</TableHead>
                      <TableHead>Best</TableHead>
                      <TableHead>Str</TableHead>
                      <TableHead className="text-right w-14">Off%</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {explorerRolls.map((r, i) => {
                      const isExp = expandedIdx === i
                      const best = r.analysis?.bestCall
                      const bg = best ? GAMES_MAP[best.game] : null
                      return (
                        <React.Fragment key={i}>
                          <TableRow
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() => setExpandedIdx(isExp ? null : i)}
                          >
                            <TableCell className="font-mono text-sm font-semibold">{r.roll.join('')}</TableCell>
                            <TableCell className="text-right text-xs text-muted-foreground tabular-nums">{r.count}</TableCell>
                            <TableCell className="hidden sm:table-cell">
                              <div className="flex gap-0.5">
                                {(r.analysis?.variants || [])
                                  .reduce((acc, v) => {
                                    if (!acc.find(a => a.game === v.game)) acc.push(v)
                                    return acc
                                  }, [])
                                  .slice(0, 6)
                                  .map((v, j) => (
                                    <span key={j} className="text-xs" title={GAMES_MAP[v.game]?.name}>
                                      {GAMES_MAP[v.game]?.emoji || '🎲'}
                                    </span>
                                  ))}
                              </div>
                            </TableCell>
                            <TableCell className="text-xs font-medium">
                              {bg && (
                                <span className="flex items-center gap-1">
                                  <span>{bg.emoji}</span>
                                  <span className="truncate">{bg.name}{best.variant ? ` ${best.variant === 'high' ? 'H' : 'L'}` : ''}</span>
                                </span>
                              )}
                            </TableCell>
                            <TableCell>
                              <StrengthBar value={r.computedOff} />
                            </TableCell>
                            <TableCell className="text-right font-mono text-sm font-bold text-orange-600 dark:text-orange-400 tabular-nums">
                              {fmtPct(r.computedOff)}
                            </TableCell>
                          </TableRow>
                          {isExp && (
                            <TableRow>
                              <TableCell colSpan={6} className="bg-muted/30 p-4">
                                <ExpandedDetail roll={r} numOpponents={numOpponents} />
                              </TableCell>
                            </TableRow>
                          )}
                        </React.Fragment>
                      )
                    })}
                    {explorerRolls.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                          No rolls match. Try removing filters.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        )}
      </section>
    </Layout>
  )
}

export default RollHybrid

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
