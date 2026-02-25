import React, { useState, useMemo, useCallback } from 'react'
import { graphql } from 'gatsby'
import Layout from '../components/layout'
import { Badge } from '../components/ui/badge'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table'
import { Label } from '../components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { ToggleGroup, ToggleGroupItem } from '../components/ui/toggle-group'
import uniqueRollsData from '../data/unique-rolls.json'
import { GAMES, GAMES_MAP, formatCallLabel, fmtPct } from '../lib/games-config'
import {
  checkGame,
  getKickerStrength,
  calculateOffensiveStrength,
} from '../lib/game-validation'
import { StrengthBar } from '../components/RollAnalysis'

/* ────────────────────────── constants ────────────────────────── */

const DICE_FACES = [1, 2, 3, 4, 5, 6]
const SORT_OPTIONS = [
  { value: 'off-desc', label: 'Offensive Str ↓' },
  { value: 'off-asc', label: 'Offensive Str ↑' },
  { value: 'flex-desc', label: 'Flexibility ↓' },
  { value: 'flex-asc', label: 'Flexibility ↑' },
  { value: 'count-desc', label: 'Frequency ↓' },
  { value: 'count-asc', label: 'Frequency ↑' },
]

/* ────────────────────── die-face toggle ─────────────────────── */

/** Clickable die face for the "must contain" / "must not contain" filter */
const DiceFaceBtn = ({ value, state, onClick }) => {
  // state: 'off' | 'must' | 'not'
  const cls =
    state === 'must'
      ? 'bg-green-600 text-white border-green-700 shadow-sm'
      : state === 'not'
      ? 'bg-red-500/20 text-red-600 dark:text-red-400 border-red-400 line-through'
      : 'bg-muted text-muted-foreground border-border hover:border-primary/40'

  return (
    <button
      onClick={onClick}
      className={`w-10 h-10 rounded-lg border-2 font-bold text-lg transition-all
        focus:outline-none focus:ring-2 focus:ring-primary ${cls}`}
    >
      {value}
    </button>
  )
}

/** Game pill for include/exclude */
const GamePill = ({ game, state, onClick }) => {
  const cls =
    state === 'must'
      ? 'border-green-600 bg-green-600/10 text-green-700 dark:text-green-400'
      : state === 'not'
      ? 'border-red-500 bg-red-500/10 text-red-600 dark:text-red-400 line-through'
      : 'border-border text-muted-foreground hover:border-primary/40'

  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border-2 text-xs font-medium transition-all
        focus:outline-none focus:ring-2 focus:ring-primary ${cls}`}
    >
      <span>{game.emoji}</span>
      <span>{game.name}</span>
    </button>
  )
}

/** Expandable row detail */
const RollDetail = ({ roll, numOpponents }) => {
  const variants = roll.analysis?.variants || []
  if (variants.length === 0) return <p className="text-xs text-muted-foreground py-2">No game data</p>

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
      {roll.analysis?.flexibility != null && (
        <div className="sm:col-span-2 text-[10px] text-muted-foreground mt-1 pt-1 border-t border-border">
          Flexibility: {roll.analysis.flexibility} &bull; Best:{' '}
          {roll.analysis.bestCall
            ? `${GAMES_MAP[roll.analysis.bestCall.game]?.name || roll.analysis.bestCall.game}${
                roll.analysis.bestCall.variant ? ` ${roll.analysis.bestCall.variant}` : ''
              }`
            : '—'}
          {roll.analysis.bestCall?.details && ` (${roll.analysis.bestCall.details})`}
        </div>
      )}
    </div>
  )
}

/* ═══════════════════════════ MAIN PAGE ═══════════════════════════ */

const RollExplorer = ({ data }) => {
  // Dice-value filter: 'off' | 'must' | 'not'
  const [diceFilter, setDiceFilter] = useState(
    Object.fromEntries(DICE_FACES.map(f => [f, 'off']))
  )
  // Game filter: 'off' | 'must' | 'not'
  const [gameFilter, setGameFilter] = useState(
    Object.fromEntries(GAMES.map(g => [g.id, 'off']))
  )

  const [sortBy, setSortBy] = useState('off-desc')
  const [expandedRoll, setExpandedRoll] = useState(null)

  const numOpponents = 0 // single-player probability view

  // Cycle die face state: off → must → not → off
  const cycleDice = useCallback(face => {
    setDiceFilter(prev => {
      const cur = prev[face]
      const next = cur === 'off' ? 'must' : cur === 'must' ? 'not' : 'off'
      return { ...prev, [face]: next }
    })
  }, [])

  // Cycle game state
  const cycleGame = useCallback(id => {
    setGameFilter(prev => {
      const cur = prev[id]
      const next = cur === 'off' ? 'must' : cur === 'must' ? 'not' : 'off'
      return { ...prev, [id]: next }
    })
  }, [])

  const clearAll = useCallback(() => {
    setDiceFilter(Object.fromEntries(DICE_FACES.map(f => [f, 'off'])))
    setGameFilter(Object.fromEntries(GAMES.map(g => [g.id, 'off'])))
  }, [])

  const hasAnyFilter = useMemo(() => {
    return (
      Object.values(diceFilter).some(v => v !== 'off') ||
      Object.values(gameFilter).some(v => v !== 'off')
    )
  }, [diceFilter, gameFilter])

  // Active filter summary text
  const filterSummary = useMemo(() => {
    const parts = []
    const mustDice = DICE_FACES.filter(f => diceFilter[f] === 'must')
    const notDice = DICE_FACES.filter(f => diceFilter[f] === 'not')
    const mustGames = GAMES.filter(g => gameFilter[g.id] === 'must')
    const notGames = GAMES.filter(g => gameFilter[g.id] === 'not')

    if (mustDice.length) parts.push(`contains ${mustDice.join(', ')}`)
    if (notDice.length) parts.push(`no ${notDice.join(', ')}`)
    if (mustGames.length) parts.push(`plays ${mustGames.map(g => g.name).join(', ')}`)
    if (notGames.length) parts.push(`not ${notGames.map(g => g.name).join(', ')}`)

    return parts.length ? parts.join(' · ') : 'No filters applied — showing all 252 unique rolls'
  }, [diceFilter, gameFilter])

  // Filter + sort the unique rolls
  const filteredRolls = useMemo(() => {
    const mustDice = DICE_FACES.filter(f => diceFilter[f] === 'must')
    const notDice = DICE_FACES.filter(f => diceFilter[f] === 'not')
    const mustGames = GAMES.filter(g => gameFilter[g.id] === 'must').map(g => g.id)
    const notGames = GAMES.filter(g => gameFilter[g.id] === 'not').map(g => g.id)

    let results = uniqueRollsData.uniqueRolls.filter(r => {
      const roll = r.roll

      // Dice-must: roll must contain at least one of this value
      for (const d of mustDice) {
        if (!roll.includes(d)) return false
      }
      // Dice-not: roll must NOT contain this value
      for (const d of notDice) {
        if (roll.includes(d)) return false
      }
      // Game-must: roll must be able to play this game
      for (const gid of mustGames) {
        if (!checkGame(roll, gid)) return false
      }
      // Game-not: roll must NOT be able to play this game
      for (const gid of notGames) {
        if (checkGame(roll, gid)) return false
      }

      return true
    })

    // Enrich with computed offensive strength
    results = results.map(r => {
      const best = r.analysis?.bestCall
      const off = best
        ? calculateOffensiveStrength(best.rawStrength, numOpponents, best.game)
        : 0
      return { ...r, computedOff: off }
    })

    // Sort
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

  const totalInstances = useMemo(
    () => filteredRolls.reduce((s, r) => s + r.count, 0),
    [filteredRolls]
  )

  return (
    <Layout>
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold">Roll Explorer</h1>
          <p className="text-base text-muted-foreground mt-2 max-w-lg mx-auto">
            Build queries to find specific rolls. Filter by dice values, game
            eligibility, and more.
          </p>
        </div>

        {/* ── Query Builder ── */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Query Builder</CardTitle>
                <CardDescription className="text-xs">
                  Click to cycle: <span className="text-green-600 font-semibold">must have</span>{' '}
                  → <span className="text-red-500 font-semibold">must NOT</span> → off
                </CardDescription>
              </div>
              {hasAnyFilter && (
                <Button variant="ghost" size="sm" onClick={clearAll} className="text-xs">
                  Clear All
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Dice values */}
            <div>
              <Label className="text-xs font-medium text-muted-foreground mb-2 block">
                Dice Values
              </Label>
              <div className="flex gap-2 flex-wrap">
                {DICE_FACES.map(f => (
                  <DiceFaceBtn
                    key={f}
                    value={f}
                    state={diceFilter[f]}
                    onClick={() => cycleDice(f)}
                  />
                ))}
              </div>
            </div>

            {/* Game eligibility */}
            <div>
              <Label className="text-xs font-medium text-muted-foreground mb-2 block">
                Game Eligibility
              </Label>
              <div className="flex flex-wrap gap-2">
                {GAMES.map(g => (
                  <GamePill
                    key={g.id}
                    game={g}
                    state={gameFilter[g.id]}
                    onClick={() => cycleGame(g.id)}
                  />
                ))}
              </div>
            </div>

            {/* Controls row */}
            <div className="flex items-center justify-between flex-wrap gap-3 pt-3 border-t border-border">
              <div className="flex items-center gap-3">
                <Label className="text-xs text-muted-foreground">Sort:</Label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-44 h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SORT_OPTIONS.map(o => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Results Summary ── */}
        <div className="mb-4 flex items-baseline justify-between flex-wrap gap-2">
          <div>
            <span className="text-lg font-bold tabular-nums">{filteredRolls.length}</span>
            <span className="text-sm text-muted-foreground ml-1">
              unique rolls ({totalInstances.toLocaleString()} instances, {((totalInstances / 7776) * 100).toFixed(1)}%)
            </span>
          </div>
          <p className="text-xs text-muted-foreground max-w-md">{filterSummary}</p>
        </div>

        {/* ── Results Table ── */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-20">Roll</TableHead>
                  <TableHead className="text-right w-10">×</TableHead>
                  <TableHead className="w-36 hidden sm:table-cell">Games</TableHead>
                  <TableHead className="w-28">Best Call</TableHead>
                  <TableHead>Strength</TableHead>
                  <TableHead className="text-right w-14">Off%</TableHead>
                  <TableHead className="text-right w-10 hidden sm:table-cell">Flex</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRolls.map((r, i) => {
                  const isExpanded = expandedRoll === i
                  const best = r.analysis?.bestCall
                  const bestGame = best ? GAMES_MAP[best.game] : null

                  return (
                    <React.Fragment key={i}>
                      <TableRow
                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => setExpandedRoll(isExpanded ? null : i)}
                      >
                        <TableCell className="font-mono text-sm font-semibold">
                          {r.roll.join('')}
                        </TableCell>
                        <TableCell className="text-right text-xs text-muted-foreground tabular-nums">
                          {r.count}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <div className="flex gap-0.5 flex-wrap">
                            {(r.analysis?.variants || [])
                              .reduce((acc, v) => {
                                if (!acc.find(a => a.game === v.game)) acc.push(v)
                                return acc
                              }, [])
                              .map((v, j) => (
                                <span key={j} className="text-xs" title={GAMES_MAP[v.game]?.name}>
                                  {GAMES_MAP[v.game]?.emoji || '🎲'}
                                </span>
                              ))}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs font-medium">
                          {bestGame && (
                            <span className="flex items-center gap-1">
                              <span>{bestGame.emoji}</span>
                              <span className="truncate">
                                {bestGame.name}
                                {best.variant ? ` ${best.variant === 'high' ? 'H' : 'L'}` : ''}
                              </span>
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <StrengthBar value={r.computedOff} />
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm font-bold text-orange-600 dark:text-orange-400 tabular-nums">
                          {fmtPct(r.computedOff)}
                        </TableCell>
                        <TableCell className="text-right text-xs text-muted-foreground tabular-nums hidden sm:table-cell">
                          {r.analysis?.flexibility || 0}
                        </TableCell>
                      </TableRow>
                      {isExpanded && (
                        <TableRow>
                          <TableCell colSpan={7} className="bg-muted/30 p-4">
                            <RollDetail roll={r} numOpponents={numOpponents} />
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  )
                })}
                {filteredRolls.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                      No rolls match your query. Try removing some filters.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </section>
    </Layout>
  )
}

export default RollExplorer

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
