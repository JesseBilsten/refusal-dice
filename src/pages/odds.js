import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import { graphql } from 'gatsby'
import Layout from '../components/layout'
import { Badge } from '../components/ui/badge'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../components/ui/card'
import { Button } from '../components/ui/button'
import VariantSelector from '../components/VariantSelector'
import { Slider } from '../components/ui/slider'
import { Info, X, Check } from 'lucide-react'
import GameLink from '../components/GameLink'
import uniqueRollsData from '../data/unique-rolls.json'
import rollGameMatrix from '../data/roll-game-matrix.json'
import {
  GAMES, GAMES_MAP,
  isSpecialtyGame, SPECIALTY_GAME_IDS,
  SPECIALTY_THRESHOLDS, SPECIALTY_FILTERS,
} from '../lib/games-config'
import {
  checkGame,
  getKickerStrength,
  classifySpecialtyRoll,
  isCompetitiveSpecialtyHand,
  analyzeRoll,
} from '../lib/game-validation'
import { ToggleGroup, ToggleGroupItem } from '../components/ui/toggle-group'

/* ─────────────────────────── helpers ─────────────────────────── */

const TOTAL = 7776

/* ── Strategy insight text for specialty games ──
 * Based on Monte Carlo simulation of full multi-roll gameplay.
 * P(not last) = probability of NOT finishing last in a 3-player game.
 */

const STRATEGY_INSIGHTS = {
  razzle: {
    title: <><GameLink id="razzle">Razzle</GameLink>: When to Call</>,
    lines: [
      `After all 3 rolls (keeping 1s and 6s), the average opponent finishes with 3.5 wild sixes. Razzle is always a safe call \u2014 even with zero initial wilds you have a 59% chance of not being last.`,
      `With 2+ initial wild sixes your expected finish (3.7) beats the opponent average, giving you 83%+ survival. At 3+ wilds it jumps to 93%.`,
      `Bottom line: always callable, but 2+ initial 1s/6s is where you gain a real edge over the table.`,
    ],
  },
  boss: {
    title: <><GameLink id="boss">Boss</GameLink>: When to Call</>,
    lines: [
      `After 2 rolls with optimal play, the average opponent finishes between two-pair and three-of-a-kind (rank 3.7). Starting with just high card gives you only a 52% survival rate \u2014 barely a coin flip.`,
      `A pair bumps you to 72%. Two-pair reaches 82%. Three-of-a-kind or better is the premium threshold at 95%+ survival.`,
      `Bottom line: pair is the minimum for comfort. Trips or better makes Boss a strong call.`,
    ],
  },
  'tres-away': {
    title: <><GameLink id="tres-away">Tres Away</GameLink>: When to Call</>,
    lines: [
      `After optimal play (keeping 1s, 2s, and 3s each round), the average opponent finishes with a score of 7.3. If your initial roll has zero dice \u2264 3, your survival drops to 43% \u2014 the only specialty scenario below 50%.`,
      `With at least one low die (1, 2, or 3) you jump to 71%+ survival. Multiple 3s are a huge advantage: 3+ threes gives you 93% survival.`,
      `Bottom line: don\u2019t call Tres Away with all high dice. One low die is the minimum; 3s are premium.`,
    ],
  },
}

/** Precompute game odds + specialty breakdowns (runs once at module load) */
const GAME_ODDS = (() => {
  const allRolls = []
  for (let a = 1; a <= 6; a++)
    for (let b = 1; b <= 6; b++)
      for (let c = 1; c <= 6; c++)
        for (let d = 1; d <= 6; d++)
          for (let e = 1; e <= 6; e++)
            allRolls.push([a, b, c, d, e])

  return GAMES.map(g => {
    if (g.id === 'barking') {
      // Barking: count rolls where flexibility ≤ 4 and strength ≤ 65 (default thresholds)
      let barkCount = 0
      allRolls.forEach(roll => {
        const analysis = analyzeRoll(roll)
        if (analysis.flexibility <= 4 &&
            (!analysis.bestCall || analysis.bestCall.rawStrength <= 65)) {
          barkCount++
        }
      })
      return {
        ...g,
        count: barkCount,
        pct: parseFloat(((barkCount / TOTAL) * 100).toFixed(1)),
        variants: null,
        specialty: null,
      }
    }
    if (isSpecialtyGame(g.id)) {
      // Compute specialty distribution counts using shared thresholds
      const filters = SPECIALTY_FILTERS[g.id] || []
      const specialty = {}
      filters.forEach(f => { specialty[f.id] = 0 })

      let competitiveCount = 0
      allRolls.forEach(roll => {
        const cls = classifySpecialtyRoll(roll, g.id, SPECIALTY_THRESHOLDS)
        Object.keys(cls).forEach(k => { if (cls[k]) specialty[k]++ })
        if (cls.competitive) competitiveCount++
      })

      return {
        ...g,
        count: competitiveCount,
        pct: parseFloat(((competitiveCount / TOTAL) * 100).toFixed(1)),
        variants: null,
        specialty,
      }
    }
    let total = 0, high = 0, low = 0
    allRolls.forEach(roll => {
      if (!checkGame(roll, g.id)) return
      total++
      if (g.hasVariants) {
        const s = getKickerStrength(roll, g.id)
        if (s === 'high') high++
        else low++
      }
    })
    return {
      ...g,
      count: total,
      pct: parseFloat(((total / TOTAL) * 100).toFixed(1)),
      variants: g.hasVariants ? { high, low } : null,
      specialty: null,
    }
  })
})()

/* ─────────────────────── colour helpers ──────────────────────── */

const pctColor = pct => {
  if (pct >= 45) return 'text-green-600 dark:text-green-400'
  if (pct >= 30) return 'text-blue-600 dark:text-blue-400'
  if (pct >= 20) return 'text-yellow-600 dark:text-yellow-400'
  return 'text-orange-600 dark:text-orange-400'
}

const pctBarBg = pct => {
  if (pct >= 45) return 'bg-green-500'
  if (pct >= 30) return 'bg-blue-500'
  if (pct >= 20) return 'bg-yellow-500'
  return 'bg-orange-500'
}

/* ───────────────────── sub-components ────────────────────────── */

/** Clickable info callout for specialty game strategy */
const StrategyCallout = ({ gameId, compact = false }) => {
  const [open, setOpen] = useState(false)
  const insight = STRATEGY_INSIGHTS[gameId]
  if (!insight) return null

  if (compact) {
    // Card-level: just an icon that opens inline
    return (
      <span className="relative inline-flex">
        <button
          onClick={e => { e.stopPropagation(); setOpen(o => !o) }}
          className="inline-flex items-center justify-center w-5 h-5 rounded-full
            text-muted-foreground hover:text-foreground hover:bg-muted
            transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
          aria-label={insight.title}
        >
          <Info className="w-3.5 h-3.5" />
        </button>
        {open && (
          <div
            className="absolute z-50 top-7 right-0 w-64 rounded-lg border bg-popover
              text-popover-foreground shadow-lg p-3 text-xs space-y-1.5 animate-in fade-in-0 zoom-in-95"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-semibold text-[11px]">{insight.title}</span>
              <button
                onClick={e => { e.stopPropagation(); setOpen(false) }}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
            {insight.lines.map((line, i) => (
              <p key={i} className="text-muted-foreground leading-snug">{line}</p>
            ))}
          </div>
        )}
      </span>
    )
  }

  // Detail-panel level: full-width info banner
  return (
    <div className="rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/30 p-4">
      <div className="flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-500 dark:text-blue-400 shrink-0 mt-0.5" />
        <div className="space-y-2">
          <p className="font-semibold text-sm text-blue-900 dark:text-blue-200">{insight.title}</p>
          {insight.lines.map((line, i) => (
            <p key={i} className="text-sm text-blue-800 dark:text-blue-300 leading-relaxed">{line}</p>
          ))}
        </div>
      </div>
    </div>
  )
}

/** Compact game odds card */
const GameOddsCard = ({ game, isSelected, onClick }) => {
  const isAlways = isSpecialtyGame(game.id)

  return (
    <button
      onClick={onClick}
      className={`group text-left w-full rounded-xl border-2 p-4 transition-all duration-200
        focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
        ${isSelected
          ? 'border-primary bg-primary/5 shadow-md ring-1 ring-primary/20'
          : 'border-border hover:border-primary/40 hover:shadow-sm'}`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xl">{game.emoji}</span>
          <span className="font-semibold text-sm">{game.name}</span>
        </div>
        {isAlways && (
          <div className="flex items-center gap-1 shrink-0">
            <Badge variant="outline" className="text-[10px] px-1.5 py-0">Competitive</Badge>
            <StrategyCallout gameId={game.id} compact />
          </div>
        )}
      </div>

      <div className={`text-2xl font-bold tabular-nums ${pctColor(game.pct)}`}>
        {game.pct}%
      </div>

      <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden mt-1.5 mb-1">
        <div
          className={`h-full rounded-full transition-all duration-500 ${pctBarBg(game.pct)}`}
          style={{ width: `${game.pct}%` }}
        />
      </div>

      <p className="text-[11px] text-muted-foreground tabular-nums">
        {game.count.toLocaleString()} / {TOTAL.toLocaleString()} rolls
      </p>

      {game.variants && (
        <div className="flex gap-3 mt-2 text-[10px] text-muted-foreground">
          <span>High {game.variants.high.toLocaleString()}</span>
          <span className="text-border">|</span>
          <span>Low {game.variants.low.toLocaleString()}</span>
        </div>
      )}

      {game.specialty && (
        <div className="flex flex-col gap-0.5 mt-2 text-[10px] text-muted-foreground">
          {SPECIALTY_FILTERS[game.id]?.map(f => (
            <div key={f.id} className="flex justify-between">
              <span>{f.label}</span>
              <span className="tabular-nums font-medium">
                {game.specialty[f.id]?.toLocaleString()} ({((game.specialty[f.id] / TOTAL) * 100).toFixed(1)}%)
              </span>
            </div>
          ))}
        </div>
      )}
    </button>
  )
}

/** Co-playable games: other games you could also call on these rolls */
const CoPlayableGames = ({ matchingRolls, currentGameId, variant }) => {
  const coPlayable = useMemo(() => {
    const counts = {}
    matchingRolls.forEach(r => {
      const seen = new Set()
      ;(r.analysis?.variants || []).forEach(v => {
        const key = v.variant ? `${v.game}__${v.variant}` : v.game
        if (v.game === currentGameId && (!variant || v.variant === variant)) return
        if (seen.has(key)) return
        // For specialty games, only count if the roll meets competitive threshold
        if (isSpecialtyGame(v.game)) {
          const cls = classifySpecialtyRoll(r.roll, v.game, SPECIALTY_THRESHOLDS)
          if (!cls.competitive) return
        }
        seen.add(key)
        if (!counts[key]) counts[key] = { game: v.game, variant: v.variant, count: 0 }
        counts[key].count += 1
      })
    })
    const total = matchingRolls.length || 1
    return Object.values(counts)
      .map(c => ({ ...c, pct: c.count / total }))
      .sort((a, b) => b.pct - a.pct)
  }, [matchingRolls, currentGameId, variant])

  if (!coPlayable.length) return null

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Other Games Playable on Same Rolls</CardTitle>
        <CardDescription className="text-xs">
          Percentage of matching rolls that also qualify for each game
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-1.5">
          {coPlayable.map(c => {
            const g = GAMES_MAP[c.game]
            const label = g
              ? `${g.emoji} ${g.name}${c.variant ? ` (${c.variant})` : ''}`
              : `${c.game}${c.variant ? ` (${c.variant})` : ''}`
            return (
              <div key={`${c.game}__${c.variant || ''}`} className="flex items-center gap-2 text-xs">
                <span className="w-36 truncate font-medium">{label}</span>
                <div className="flex-1 h-3 bg-muted rounded-sm overflow-hidden">
                  <div
                    className="h-full bg-blue-500/60 rounded-sm transition-all duration-300"
                    style={{ width: `${c.pct * 100}%` }}
                  />
                </div>
                <span className="w-12 text-right tabular-nums text-muted-foreground">
                  {(c.pct * 100).toFixed(1)}%
                </span>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

/** All matching rolls badge grid (verification) */
/** All rolls grid — matching rolls highlighted, non-matching muted */
const ProofGrid = ({ allRolls, matchSet, matchCount, totalInstances }) => {
  const [expanded, setExpanded] = useState(false)
  const [showAll, setShowAll] = useState(false)
  const [showInfo, setShowInfo] = useState(false)

  const displayRolls = useMemo(() => {
    if (!showAll) return allRolls
    const all = []
    allRolls.forEach(r => {
      const perms = new Set()
      const permute = (arr, l = 0) => {
        if (l === arr.length - 1) { perms.add(arr.join(',')); return }
        for (let i = l; i < arr.length; i++) {
          [arr[l], arr[i]] = [arr[i], arr[l]]
          permute([...arr], l + 1)
          ;[arr[l], arr[i]] = [arr[i], arr[l]]
        }
      }
      permute([...r.roll])
      perms.forEach(p => all.push({ roll: p.split(',').map(Number), count: 1 }))
    })
    return all
  }, [allRolls, showAll])

  const show = expanded ? displayRolls : displayRolls.slice(0, 252)
  const more = displayRolls.length > 252 && !expanded
  const totalPerms = allRolls.reduce((s, r) => s + r.count, 0)

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 mb-3">
        <div className="flex items-center gap-2">
          <ToggleGroup
            type="single"
            value={showAll ? 'all' : 'unique'}
            onValueChange={v => { if (v) { setShowAll(v === 'all'); setExpanded(false) } }}
          >
            <ToggleGroupItem value="unique" className="text-xs h-7 px-2.5">
              Unique ({allRolls.length})
            </ToggleGroupItem>
            <ToggleGroupItem value="all" className="text-xs h-7 px-2.5">
              All Permutations ({totalPerms.toLocaleString()})
            </ToggleGroupItem>
          </ToggleGroup>
          <span className="relative inline-flex">
            <button
              onClick={() => setShowInfo(o => !o)}
              className="inline-flex items-center justify-center w-5 h-5 rounded-full
                text-muted-foreground hover:text-foreground hover:bg-muted
                transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
              aria-label="View mode explanation"
            >
              <Info className="w-3.5 h-3.5" />
            </button>
            {showInfo && (
              <div
                className="absolute z-50 top-7 left-0 w-72 rounded-lg border bg-popover
                  text-popover-foreground shadow-lg p-3 text-xs space-y-2 animate-in fade-in-0 zoom-in-95"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-[11px]">View Modes</span>
                  <button
                    onClick={() => setShowInfo(false)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
                <p className="text-muted-foreground leading-snug">
                  <strong>Unique (252):</strong> Distinct combinations where order doesn't matter. 
                  "11234 ×30" means this combination occurs in 30 different arrangements.
                </p>
                <p className="text-muted-foreground leading-snug">
                  <strong>All Permutations (7,776):</strong> Every possible arrangement where order matters. 
                  "11234" and "43211" are counted separately—the complete sample space.
                </p>
              </div>
            )}
          </span>
        </div>
        <span className="text-xs text-muted-foreground">
          <span className="text-green-600 dark:text-green-400 font-semibold">
            {showAll ? totalInstances.toLocaleString() : matchCount} match
          </span>
          {' / '}
          <span>{showAll ? totalPerms.toLocaleString() : allRolls.length} total</span>
        </span>
      </div>
      <div className="flex flex-wrap gap-1 font-mono text-xs">
        {show.map((r, i) => {
          const key = [...r.roll].sort((a, b) => a - b).join(',')
          const isMatch = matchSet.has(key)
          return (
            <Badge
              key={i}
              variant="secondary"
              className={`px-1.5 py-0.5 tabular-nums transition-colors ${
                isMatch
                  ? 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-200 border border-green-300 dark:border-green-700'
                  : 'bg-muted/40 text-muted-foreground/50 border border-transparent'
              }`}
            >
              {isMatch && <Check className="w-3 h-3 mr-0.5 text-green-600 dark:text-green-400" />}
              {r.roll.join('')}
              {!showAll && (
                <span className={`ml-1 ${isMatch ? 'text-green-600/70 dark:text-green-400/70' : 'text-muted-foreground/30'}`}>
                  ×{r.count}
                </span>
              )}
            </Badge>
          )
        })}
      </div>
      {more && (
        <Button variant="ghost" size="sm" className="mt-2 text-xs" onClick={() => setExpanded(true)}>
          Show all {displayRolls.length.toLocaleString()} rolls…
        </Button>
      )}
    </div>
  )
}

/* ═══════════════════════════ MAIN PAGE ═══════════════════════════ */

const OddsDashboard = ({ data }) => {
  const [selectedId, setSelectedId] = useState(null)
  const [variant, setVariant] = useState(null) // 'high' | 'low' | null
  const [specialtyFilter, setSpecialtyFilter] = useState(null) // e.g. '3-sixes', 'trips-plus'
  const [barkingFlexThreshold, setBarkingFlexThreshold] = useState([4])
  const [barkingStrengthThreshold, setBarkingStrengthThreshold] = useState([65])
  const detailRef = useRef(null)

  // Read URL parameters on mount to initialize from Games page links
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const gameParam = params.get('game')
      const viewParam = params.get('view')
      
      if (gameParam) {
        setSelectedId(gameParam)
        // Scroll to details section after state updates
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            detailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
          })
        })
      }
    }
  }, [])

  const numOpponents = 0 // single-player probability view
  const selectedGame = GAME_ODDS.find(g => g.id === selectedId) || null

  const handleGameClick = useCallback(id => {
    if (selectedId === id) {
      setSelectedId(null)
      setVariant(null)
      setSpecialtyFilter(null)
    } else {
      setSelectedId(id)
      setVariant(null)
      setSpecialtyFilter(null)
      requestAnimationFrame(() =>
        detailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      )
    }
  }, [selectedId])

  // Matching unique rolls
  const matchingRolls = useMemo(() => {
    if (!selectedId) return []
    
    // Special handling for Barking — show hands matching the thresholds
    if (selectedId === 'barking') {
      const hands = []
      Object.values(rollGameMatrix).forEach(rd => {
        const analysis = analyzeRoll(rd.roll)
        if (analysis.flexibility <= barkingFlexThreshold[0] &&
            (!analysis.bestCall || analysis.bestCall.rawStrength <= barkingStrengthThreshold[0])) {
          // Find matching roll in uniqueRolls to get count
          const rollKey = JSON.stringify([...rd.roll].sort((a, b) => a - b))
          const matchingUnique = uniqueRollsData.uniqueRolls.find(ur => 
            JSON.stringify([...ur.roll].sort((a, b) => a - b)) === rollKey
          )
          if (matchingUnique) {
            hands.push(matchingUnique)
          }
        }
      })
      return hands
    }
    
    return uniqueRollsData.uniqueRolls.filter(r => {
      if (!checkGame(r.roll, selectedId)) return false
      if (variant) return getKickerStrength(r.roll, selectedId) === variant
      if (isSpecialtyGame(selectedId)) {
        // Always apply at least the competitive threshold for specialty games
        const cls = classifySpecialtyRoll(r.roll, selectedId, SPECIALTY_THRESHOLDS)
        const tier = specialtyFilter || 'competitive'
        return cls[tier] === true
      }
      return true
    })
  }, [selectedId, variant, specialtyFilter, barkingFlexThreshold, barkingStrengthThreshold])

  const totalInstances = useMemo(
    () => matchingRolls.reduce((s, r) => s + r.count, 0),
    [matchingRolls]
  )

  // Barking weak hands — hands that warrant barking
  const barkingWeakHands = useMemo(() => {
    if (selectedId !== 'barking') return []
    const hands = []
    Object.values(rollGameMatrix).forEach(rd => {
      const analysis = analyzeRoll(rd.roll)
      if (analysis.flexibility <= barkingFlexThreshold[0] &&
          (!analysis.bestCall || analysis.bestCall.rawStrength <= barkingStrengthThreshold[0])) {
        hands.push({ 
          roll: rd.roll, 
          flexibility: analysis.flexibility, 
          bestCall: analysis.bestCall, 
          count: rd.count 
        })
      }
    })
    return hands.sort((a, b) => b.count - a.count)
  }, [selectedId, barkingFlexThreshold, barkingStrengthThreshold])
  const matchSet = useMemo(() => {
    const s = new Set()
    matchingRolls.forEach(r => s.add([...r.roll].sort((a, b) => a - b).join(',')))
    return s
  }, [matchingRolls])

  return (
    <Layout>
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ── Header ── */}
        <div className="mb-6 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold">Game Odds</h1>
          <p className="text-base text-muted-foreground mt-2 max-w-lg mx-auto">
            Probability of rolling each game on a single throw of 5 dice.
            Tap a game to drill into its data.
          </p>
        </div>

        {/* ── Odds Grid ── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 mb-8">
          {GAME_ODDS.map(g => (
            <GameOddsCard
              key={g.id}
              game={g}
              isSelected={selectedId === g.id}
              onClick={() => handleGameClick(g.id)}
            />
          ))}
        </div>

        {/* ── Detail Panel ── */}
        {selectedGame && (
          <div ref={detailRef} className="space-y-6">
            {/* Summary */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{selectedGame.emoji}</span>
                    <div>
                      <CardTitle className="text-xl">{selectedGame.name}</CardTitle>
                      <CardDescription>
                        {matchingRolls.length} unique rolls &bull;{' '}
                        {totalInstances.toLocaleString()} instances (
                        {((totalInstances / TOTAL) * 100).toFixed(1)}%)
                      </CardDescription>
                    </div>
                  </div>
                  {selectedGame.hasVariants && (
                    <VariantSelector
                      selectedVariant={variant || 'all'}
                      onChange={v => setVariant(v)}
                    />
                  )}
                  {SPECIALTY_FILTERS[selectedId] && (
                    <ToggleGroup
                      type="single"
                      value={specialtyFilter || 'competitive'}
                      onValueChange={v => setSpecialtyFilter(v === 'competitive' ? null : v)}
                    >
                      {SPECIALTY_FILTERS[selectedId].map(f => (
                        <ToggleGroupItem key={f.id} value={f.id}>
                          {f.label}
                          {selectedGame.specialty?.[f.id] != null && (
                            <Badge variant="secondary" className="ml-1.5 text-[10px] px-1 py-0">
                              {((selectedGame.specialty[f.id] / TOTAL) * 100).toFixed(1)}%
                            </Badge>
                          )}
                        </ToggleGroupItem>
                      ))}
                    </ToggleGroup>
                  )}
                </div>
              </CardHeader>
            </Card>

            {/* Barking-specific: weak hands to bark on */}
            {selectedId === 'barking' && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">When Should You Bark?</CardTitle>
                  <CardDescription>
                    Roll a hand with limited flexibility and weak alternatives → recommend barking to avoid being spread too thin
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Default odds summary */}
                    <div className="p-4 rounded-lg bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800">
                      <div className="text-xs text-muted-foreground mb-1">
                        Default thresholds (Flexibility ≤ 4, Strength ≤ 65)
                      </div>
                      <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                        {barkingWeakHands.reduce((s, h) => s + h.count, 0).toLocaleString()} / 7,776
                      </div>
                      <div className="text-lg font-semibold text-orange-600 dark:text-orange-400">
                        {((barkingWeakHands.reduce((s, h) => s + h.count, 0) / 7776) * 100).toFixed(1)}% of rolls
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        {barkingWeakHands.length} unique hand patterns
                      </p>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Flexibility Threshold: {barkingFlexThreshold[0]} or fewer playable games
                      </label>
                      <Slider value={barkingFlexThreshold} onValueChange={setBarkingFlexThreshold} min={0} max={10} step={1} className="w-full" />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Strength Threshold: {barkingStrengthThreshold[0]} or lower raw strength
                      </label>
                      <Slider value={barkingStrengthThreshold} onValueChange={setBarkingStrengthThreshold} min={0} max={100} step={5} className="w-full" />
                    </div>

                    {/* Adjusted odds if different from defaults */}
                    {(barkingFlexThreshold[0] !== 4 || barkingStrengthThreshold[0] !== 65) && (
                      <div className="p-3 rounded-lg bg-muted/50 border border-muted-foreground/20">
                        <div className="text-xs text-muted-foreground mb-1">
                          Current thresholds (Flexibility ≤ {barkingFlexThreshold[0]}, Strength ≤ {barkingStrengthThreshold[0]})
                        </div>
                        <div className="text-xl font-bold text-foreground">
                          {barkingWeakHands.reduce((s, h) => s + h.count, 0).toLocaleString()} / 7,776
                        </div>
                        <div className="text-base font-semibold text-foreground">
                          {((barkingWeakHands.reduce((s, h) => s + h.count, 0) / 7776) * 100).toFixed(1)}% of rolls
                        </div>
                      </div>
                    )}

                    <div>
                      <div className="flex items-baseline gap-2 mb-3">
                        <h3 className="text-sm font-semibold">Example Bark-worthy Hands</h3>
                        <span className="text-xs text-muted-foreground">
                          Showing top {Math.min(50, barkingWeakHands.length)}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-80 overflow-y-auto">
                        {barkingWeakHands.slice(0, 50).map((hand, idx) => (
                          <div key={idx} className="p-2 border rounded bg-muted/30 text-xs">
                            <div className="font-mono mb-1">[{hand.roll.join(',')}]</div>
                            <div className="text-xs text-muted-foreground">
                              {hand.count} rolls
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Strategy Insight for specialty games */}
            {STRATEGY_INSIGHTS[selectedId] && (
              <StrategyCallout gameId={selectedId} />
            )}

            {/* Co-playable games */}
            <CoPlayableGames
              matchingRolls={matchingRolls}
              currentGameId={selectedId}
              variant={variant}
            />

            {/* Verification */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Verify: All Rolls</CardTitle>
                <CardDescription className="text-xs">
                  <Badge variant="secondary" className="bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-200 border border-green-300 dark:border-green-700 mr-1">
                    Green
                  </Badge>
                  {selectedId === 'barking' 
                    ? ' = bark-worthy hands. '
                    : ' = matches this game. '}
                  <Badge variant="secondary" className="bg-muted/40 text-muted-foreground/50 border border-transparent mr-1">
                    Grey
                  </Badge>
                  {selectedId === 'barking'
                    ? ' = other hands.'
                    : ' = doesn\'t match.'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ProofGrid
                  allRolls={uniqueRollsData.uniqueRolls}
                  matchSet={matchSet}
                  matchCount={matchingRolls.length}
                  totalInstances={totalInstances}
                />
              </CardContent>
            </Card>
          </div>
        )}
      </section>
    </Layout>
  )
}

export default OddsDashboard

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
