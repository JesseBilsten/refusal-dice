import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import { Badge } from '../ui/badge'
import { Panel, Stat } from '../Page'
import { Button } from '../ui/button'
import VariantSelector from '../VariantSelector'
import { Slider } from '../ui/slider'
import { X } from 'lucide-react'
import GameLink from '../GameLink'
import uniqueRollsData from '../../data/unique-rolls.json'
import rollGameMatrix from '../../data/roll-game-matrix.json'
import {
  GAMES, GAMES_MAP, getGameName,
  isSpecialtyGame, SPECIALTY_GAME_IDS,
} from '../../lib/games-config'
import {
  checkGame,
  getKickerStrength,
  classifySpecialtyRoll,
  isCompetitiveSpecialtyHand,
  analyzeRoll,
} from '../../lib/game-validation'
import { ToggleGroup, ToggleGroupItem } from '../ui/toggle-group'
import { Hand } from '../Dice'
import EveryPossibility from './EveryPossibility'
import { OddsLabLink, ProbabilityBar, fmtPct } from '../Odds'
import { callFilters, callThresholds, specialtyCalls } from './specialty-calls'
import { PRESETS } from '../../lib/roll-query'

/* ─────────────────────────── helpers ─────────────────────────── */

const TOTAL = 7776

/* ── When to call a specialty game, computed (specialty-calls.js) ── */

const CALLOUT_TITLES = {
  razzle: <><GameLink id="razzle">Razzle</GameLink>: when to call</>,
  boss: <><GameLink id="boss">Boss</GameLink>: when to call</>,
  'tres-away': <><GameLink id="tres-away">Tres Away</GameLink>: when to call</>,
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
      const filters = callFilters()[g.id] || []
      const specialty = {}
      filters.forEach(f => { specialty[f.id] = 0 })

      let competitiveCount = 0
      allRolls.forEach(roll => {
        const cls = classifySpecialtyRoll(roll, g.id, callThresholds())
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

// How common a game is isn't good or bad, so every game gets the same neutral color
const pctColor = () => 'text-foreground'
const pctBarBg = () => 'bg-primary'

/* ───────────────────── sub-components ────────────────────────── */

/** When to call a specialty game: the Hammer's chance of staying off the pencil, by starting hand */
const StrategyCallout = ({ gameId }) => {
  const calls = useMemo(() => specialtyCalls(gameId), [gameId])
  if (!calls) return null
  return (
    <Panel tone="note" title={CALLOUT_TITLES[gameId]} className="space-y-3">
      <p className="text-sm leading-relaxed">
        How often the Hammer stays off the pencil calling {getGameName(gameId)} with each kind of roll, everyone
        playing, at a {calls.players}-player table. An even share is {fmtPct(calls.even)}.
      </p>
      <div className="space-y-2">
        {calls.rows.map((r) => (
          <ProbabilityBar
            key={r.key}
            label={r.label}
            p={r.safe}
            digits={0}
            tone={r.safe > calls.even ? 'safe' : 'lose'}
            mark={calls.even}
            markLabel={`an even share, ${fmtPct(calls.even)}`}
            className="grid-cols-[minmax(0,10rem)_1fr_auto]"
          />
        ))}
      </div>
      {calls.firstAbove && (
        <p className="text-sm leading-relaxed">
          With {calls.firstAbove}, you do better than an even share.
        </p>
      )}
      <p className="text-xs text-muted-foreground">
        From rounds played out by solid bots, good to about ±2 points. Each kind of roll counts as often as it comes up.
      </p>
    </Panel>
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
      <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1 mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xl">{game.emoji}</span>
          <span className="font-semibold text-sm">{game.name}</span>
        </div>
        {isAlways && (
          <div className="flex items-center gap-1 shrink-0">
            <Badge variant="outline" className="px-1.5 py-0 text-xs font-medium">Every roll plays</Badge>
          </div>
        )}
      </div>

      <div className={`text-2xl font-bold tabular-nums ${pctColor(game.pct)}`}>
        {fmtPct(game.count / TOTAL, 1)}
      </div>

      <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden mt-1.5 mb-1">
        <div
          className={`h-full rounded-full transition-all duration-500 ${pctBarBg(game.pct)}`}
          style={{ width: `${game.pct}%` }}
        />
      </div>

      <p className="text-xs text-muted-foreground tabular-nums">
        {game.count.toLocaleString()} / {TOTAL.toLocaleString()} rolls
      </p>

      {game.variants && (
        <div className="flex gap-3 mt-2 text-xs text-muted-foreground">
          <span>High {game.variants.high.toLocaleString()}</span>
          <span className="text-border">|</span>
          <span>Low {game.variants.low.toLocaleString()}</span>
        </div>
      )}

      {game.specialty && (
        <div className="flex flex-col gap-0.5 mt-2 text-xs text-muted-foreground">
          {callFilters()[game.id]?.map(f => (
            <div key={f.id} className="flex justify-between">
              <span>{f.label}</span>
              <span className="tabular-nums font-medium">
                {game.specialty[f.id]?.toLocaleString()} ({fmtPct(game.specialty[f.id] / TOTAL, 1)})
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
          const cls = classifySpecialtyRoll(r.roll, v.game, callThresholds())
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
    <Panel title="Other games on the same rolls" description="How many of these rolls also make each game.">
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
                    className="h-full bg-primary/60 rounded-sm transition-all duration-300"
                    style={{ width: `${c.pct * 100}%` }}
                  />
                </div>
                <span className="w-12 text-right tabular-nums text-muted-foreground">
                  {fmtPct(c.pct, 1)}
                </span>
              </div>
            )
          })}
        </div>
    </Panel>
  )
}

/* ═══════════════════════════ MAIN PAGE ═══════════════════════════ */

const OddsDashboard = () => {
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
        const cls = classifySpecialtyRoll(r.roll, selectedId, callThresholds())
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
  const barkCount = barkingWeakHands.reduce((s, h) => s + h.count, 0)
  const proofRolls = useMemo(() => {
    const matches = new Set(matchingRolls.map(r => [...r.roll].sort((a, b) => a - b).join('')))
    return uniqueRollsData.uniqueRolls.map(r => {
      const key = [...r.roll].sort((a, b) => a - b).join('')
      return { key, roll: r.roll, count: r.count, match: matches.has(key) }
    })
  }, [matchingRolls])
  const labPreset = PRESETS.find(p => p.gameId === selectedId && !variant)

  return (
    <>
      <p className="mb-6 text-muted-foreground">
        How often one throw of five dice makes each game, exact over all 7,776 rolls. Tap a game to see every roll
        that makes it.
      </p>

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
            <Panel
              title={
                <>
                  <span aria-hidden className="mr-2">{selectedGame.emoji}</span>
                  <GameLink id={selectedId} className="text-inherit" />
                </>
              }
              description={`${matchingRolls.length} unique rolls · ${totalInstances.toLocaleString()} of ${TOTAL.toLocaleString()} outcomes (${fmtPct(totalInstances / TOTAL, 1)})`}
              actions={
                <div className="flex flex-wrap items-center gap-3">
                  {selectedGame.hasVariants && (
                    <VariantSelector
                      selectedVariant={variant || 'all'}
                      onChange={v => setVariant(v)}
                    />
                  )}
                  {callFilters()[selectedId] && (
                    <ToggleGroup
                      type="single"
                      value={specialtyFilter || 'competitive'}
                      onValueChange={v => setSpecialtyFilter(v === 'competitive' ? null : v)}
                    >
                      {callFilters()[selectedId].map(f => (
                        <ToggleGroupItem key={f.id} value={f.id}>
                          {f.label}
                          {selectedGame.specialty?.[f.id] != null && (
                            <Badge variant="secondary" className="ml-1.5 text-2xs px-1 py-0">
                              {fmtPct(selectedGame.specialty[f.id] / TOTAL, 1)}
                            </Badge>
                          )}
                        </ToggleGroupItem>
                      ))}
                    </ToggleGroup>
                  )}
                </div>
              }
            />

            {/* Barking-specific: weak hands to bark on */}
            {selectedId === 'barking' && (
              <Panel
                title="When should you bark?"
                description="A hand that makes few games, none of them well, is worth barking: pass the Hammer rather than call a weak game. A rule of thumb."
              >
                  <div className="space-y-6">
                    <Stat
                      value={`${((barkCount / 7776) * 100).toFixed(1)}%`}
                      label={`of rolls are bark-worthy at flexibility ≤ ${barkingFlexThreshold[0]}, strength ≤ ${barkingStrengthThreshold[0]}`}
                      sub={`${barkCount.toLocaleString()} of 7,776 outcomes · ${barkingWeakHands.length} unique rolls`}
                    />

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

                    <div>
                      <div className="flex items-baseline gap-2 mb-3">
                        <h3 className="text-subheading">Example bark-worthy hands</h3>
                        <span className="text-xs text-muted-foreground">
                          Showing top {Math.min(50, barkingWeakHands.length)}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-80 overflow-y-auto">
                        {barkingWeakHands.slice(0, 50).map((hand, idx) => (
                          <div key={idx} className="p-2 border rounded bg-muted/30 text-xs">
                            <Hand dice={hand.roll} size="xs" className="mb-1" />
                            <div className="text-xs text-muted-foreground">
                              {hand.count} rolls
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
              </Panel>
            )}

            {/* Strategy Insight for specialty games */}
            {CALLOUT_TITLES[selectedId] && (
              <StrategyCallout gameId={selectedId} />
            )}

            {/* Co-playable games */}
            <CoPlayableGames
              matchingRolls={matchingRolls}
              currentGameId={selectedId}
              variant={variant}
            />

            {/* Verification: every roll, the same view as the Odds Lab */}
            <EveryPossibility
              title="Every roll"
              rolls={proofRolls}
              total={7776}
              matchLabel={selectedId === 'barking' ? 'Bark-worthy hand' : `Makes ${getGameName(selectedId)}`}
              missLabel={selectedId === 'barking' ? 'Other hands' : "Doesn't make it"}
              actions={
                labPreset && (
                  <OddsLabLink query={labPreset.query} compare={selectedId}>
                    Open it in the roll builder
                  </OddsLabLink>
                )
              }
            />
          </div>
        )}
    </>
  )
}

export default OddsDashboard
