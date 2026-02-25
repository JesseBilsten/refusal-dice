import React, { useState, useMemo } from 'react'
import { Link } from 'gatsby'
import Layout from '../components/layout'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Slider } from '../components/ui/slider'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table'
import VariantSelector from '../components/VariantSelector'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { analyzeRoll, isCompetitiveSpecialtyHand } from '../lib/game-validation'
import { GAMES_MAP, isSpecialtyGame, SPECIALTY_THRESHOLDS, getGamePath } from '../lib/games-config'
import GameLink from '../components/GameLink'
import { StrengthBar } from '../components/RollAnalysis'
import SecondCallDistribution from '../components/SecondCallDistribution'
import rollGameMatrix from '../data/roll-game-matrix.json'

/* ────────────────────────────────────────────────────────────── */
/*  Game metadata — enriches shared GAMES_MAP with page content  */
/* ────────────────────────────────────────────────────────────── */
const GAME_CONTENT = {
  '10-2': {
    subtitle: 'high or low',
    description: '2 dice add up to 10 and the remaining 3 dice are either high or low.',
    partialKeep: 'You can keep dice that sum to 10 and re-roll the rest to improve your kickers. This multi-roll strategy significantly improves your odds.',
  },
  '10-3': {
    subtitle: 'high or low',
    description: '3 dice add up to 10 and the remaining 2 dice are either high or low.',
    aka: 'Frankie',
    partialKeep: 'You can keep dice that sum to 10 and re-roll the rest to improve your kickers. This multi-roll strategy significantly improves your odds.',
  },
  '10-4': {
    subtitle: 'high or low',
    description: '4 dice add up to 10 and the remaining die is either high or low.',
    aka: 'Shotgun',
    partialKeep: 'You can keep dice that sum to 10 and re-roll the remaining die to improve your kicker. This multi-roll strategy significantly improves your odds.',
  },
  'ship-captain-crew': {
    subtitle: 'high or low',
    description: '3 dice make up an outside straight (4-5-6 or 1-2-3) and the remaining 2 dice are either high or low.',
    aka: 'Outside straight, Crew',
    partialKeep: 'You can keep portions of the straight and re-roll for the missing values: (1) Keep [6,5] and roll for [4], (2) Keep [1,2] and roll for [3]. With 2 remaining rolls and 3 dice to re-roll, you have much better odds than re-rolling all 5 dice. Once complete, the remaining 2 dice are your kickers. If you don\'t complete the straight after 3 rolls and you\'re the only player without the game, you get a pencil.',
  },
  monterey: {
    subtitle: 'high or low',
    description: '3 dice make up an inside straight (2-3-4 or 3-4-5) and the remaining 2 dice are either high or low.',
    aka: 'Inside straight',
    partialKeep: 'You can keep portions of the straight: (1) Keep [2,3] and roll for [4], (2) Keep [4,5] and roll for [3], or (3) Keep [3,4] (best option!) and roll for either [2] or [5]. The [3,4] partial is most valuable because you have two ways to complete the game. With 2 remaining rolls, partial keeping significantly improves your odds versus re-rolling all dice.',
  },
  vegas: {
    subtitle: 'high or low',
    description: '2 sets of 2 dice add up to 7 and/or 11 and the remaining die is either high or low.',
    aka: '7-11, 7 and/or 11\'s, Vegas',
    partialKeep: 'If you roll one pair that sums to 7 (or 11), you can keep that pair and re-roll the remaining 3 dice to find another pair. This partial-keep strategy improves your chances of completing the game.',
  },
  pairs: {
    subtitle: 'high or low',
    description: '2 sets of 2 dice are matching pairs and the remaining die is either high or low.',
    partialKeep: 'If you don\'t have 2 pairs yet but have 1 pair, keep that pair and re-roll the remaining 3 dice to find a second pair. With 2 remaining rolls, this partial-keep strategy significantly increases your chances of getting the game compared to re-rolling all 5 dice.',
  },
  razzle: {
    description: 'Most amount of any one number with aces being wild.',
    strategy: 'Call with 3 or more 1s/6s (wild sixes), or 5 of any other number. About 21% of rolls meet this competitive threshold. Over 3 rolls keeping 1s and 6s, players average 3.5 wild sixes.',
  },
  boss: {
    description: 'Poker-style hands without straights or flushes. All players reveal their dice, and the highest hand becomes the "Boss."',
    strategy: 'Call with Two Pair or better (competitive threshold, ~44% of rolls). Trips or better (~21%) is a strong call. You can keep matching dice and re-roll the others twice to improve your hand.',
    partialKeep: 'You can keep any dice that help your poker hand and re-roll the rest. For example, with Three of a Kind, keep those three dice and re-roll the other two to try for Four/Five of a Kind or a Full House.',
  },
  'tres-away': {
    description: 'Just like golf, lowest score wins. Each die is worth its face value except for 3\'s which are worth 0 points.',
    strategy: 'Call with a score of 10 or less (~18% of rolls). Score ≤ 7 is a strong call (~6%). Lower is better — 3s are worth 0, so multiple 3s are premium.',
  },
  barking: {
    description: 'A strategic decision to pass your turn when you have no good calls and don\'t want to risk a bluff.',
    isStrategy: true,
  },
}

/* ────────────────────────────────────────────────────────────── */
/*  Helpers                                                      */
/* ────────────────────────────────────────────────────────────── */

const TOTAL_ROLLS = 7776

/** Max rolls for probability table per game */
const MAX_ROLLS = { boss: 2, 'tres-away': 5 }

const multiRollProb = (singlePct, n) =>
  (1 - Math.pow((100 - singlePct) / 100, n)) * 100

const calcSingleRollProb = (gameId) => {
  let count = 0
  if (isSpecialtyGame(gameId)) {
    Object.values(rollGameMatrix).forEach(rd => {
      if (isCompetitiveSpecialtyHand(rd.roll, gameId, SPECIALTY_THRESHOLDS)) count += rd.count || 0
    })
  } else {
    Object.values(rollGameMatrix).forEach(rd => {
      if (rd.games?.includes(gameId)) count += rd.count || 0
    })
  }
  return (count / TOTAL_ROLLS) * 100
}

const getRollsForGame = (gameId) => {
  const rolls = []
  const add = (rd) => rolls.push({ roll: rd.roll, count: rd.count, analysis: analyzeRoll(rd.roll) })
  if (isSpecialtyGame(gameId)) {
    Object.values(rollGameMatrix).forEach(rd => {
      if (isCompetitiveSpecialtyHand(rd.roll, gameId, SPECIALTY_THRESHOLDS)) add(rd)
    })
  } else {
    Object.values(rollGameMatrix).forEach(rd => {
      if (rd.games?.includes(gameId)) add(rd)
    })
  }
  return rolls
}

/** Classify a roll for variant / strength display */
const classifyRoll = (roll, gameId) => {
  const analysis = analyzeRoll(roll)
  const v = analysis.variants?.find(vv => vv.game === gameId)
  if (!v) return null
  return { variant: v.variant, strength: v.rawStrength, kicker: v.kicker, details: v.details }
}

/* ────────────────────────────────────────────────────────────── */
/*  Collapsible section — progressive disclosure                 */
/* ────────────────────────────────────────────────────────────── */
const CollapsibleSection = ({ title, description, defaultOpen = false, children, badge }) => {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <Card className="mb-6">
      <button type="button" onClick={() => setOpen(o => !o)} className="w-full text-left">
        <CardHeader className="cursor-pointer select-none">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg">{title}</CardTitle>
              {badge}
            </div>
            {open
              ? <ChevronUp className="w-5 h-5 text-muted-foreground" />
              : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
          </div>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
      </button>
      {open && <CardContent>{children}</CardContent>}
    </Card>
  )
}

/* ────────────────────────────────────────────────────────────── */
/*  Strength Distribution (from real data, not simulation)       */
/* ────────────────────────────────────────────────────────────── */
const StrengthDistributionChart = ({ rolls, gameId, variant }) => {
  const data = useMemo(() => {
    const buckets = new Array(10).fill(0)
    let total = 0
    rolls.forEach(r => {
      const info = classifyRoll(r.roll, gameId)
      if (!info) return
      if (variant && variant !== 'all' && info.variant !== variant) return
      const idx = Math.min(Math.floor(info.strength / 10), 9)
      buckets[idx] += r.count
      total += r.count
    })
    return buckets.map((count, i) => ({
      range: `${i * 10}–${(i + 1) * 10}`,
      count,
      pct: total > 0 ? (count / total * 100) : 0,
    }))
  }, [rolls, gameId, variant])

  const maxPct = Math.max(...data.map(d => d.pct), 1)

  return (
    <div className="space-y-1.5">
      {data.map((d, i) => (
        <div key={i} className="flex items-center gap-3 text-sm">
          <span className="w-14 text-right text-muted-foreground tabular-nums">{d.range}%</span>
          <div className="flex-1 bg-muted rounded-full h-5 relative overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                i >= 7 ? 'bg-green-500' : i >= 4 ? 'bg-yellow-500' : 'bg-red-400'
              }`}
              style={{ width: `${(d.pct / maxPct) * 100}%` }}
            />
          </div>
          <span className="w-16 text-right tabular-nums text-muted-foreground">
            {d.count > 0 ? `${d.pct.toFixed(1)}%` : '—'}
          </span>
        </div>
      ))}
    </div>
  )
}

/* ────────────────────────────────────────────────────────────── */
/*  Sample Rolls Table                                           */
/* ────────────────────────────────────────────────────────────── */
const SampleRollsTable = ({ rolls, gameId, variant, hasVariants }) => {
  const [showAll, setShowAll] = useState(false)

  const filtered = useMemo(() => {
    let result = rolls.map(r => ({ ...r, info: classifyRoll(r.roll, gameId) })).filter(r => r.info)
    if (variant && variant !== 'all' && hasVariants) {
      result = result.filter(r => r.info.variant === variant)
    }
    result.sort((a, b) => b.info.strength - a.info.strength)
    return result
  }, [rolls, gameId, variant, hasVariants])

  const display = showAll ? filtered : filtered.slice(0, 20)

  if (filtered.length === 0) {
    return <p className="text-center text-muted-foreground py-4">No matching rolls</p>
  }

  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Roll</TableHead>
            {hasVariants && <TableHead>Variant</TableHead>}
            <TableHead>Strength</TableHead>
            <TableHead className="hidden sm:table-cell">Kicker</TableHead>
            <TableHead className="text-right hidden sm:table-cell">Occurrences</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {display.map((r, i) => (
            <TableRow key={i}>
              <TableCell className="font-mono text-sm">[{r.roll.join(', ')}]</TableCell>
              {hasVariants && (
                <TableCell>
                  <Badge variant={r.info.variant === 'high' ? 'default' : 'secondary'} className="text-xs">
                    {r.info.variant || '—'}
                  </Badge>
                </TableCell>
              )}
              <TableCell>
                <div className="flex items-center gap-2">
                  <StrengthBar value={r.info.strength} className="w-16" />
                  <span className="text-xs tabular-nums">{r.info.strength.toFixed(0)}%</span>
                </div>
              </TableCell>
              <TableCell className="font-mono text-xs text-muted-foreground hidden sm:table-cell">
                {r.info.kicker?.length > 0 ? `[${r.info.kicker.join(', ')}]` : '—'}
              </TableCell>
              <TableCell className="text-right tabular-nums text-muted-foreground text-sm hidden sm:table-cell">
                {r.count}×
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {filtered.length > 20 && (
        <div className="text-center mt-3">
          <Button variant="ghost" size="sm" onClick={() => setShowAll(s => !s)}>
            {showAll ? 'Show fewer' : `Show all ${filtered.length} rolls`}
          </Button>
        </div>
      )}
    </div>
  )
}

/* ────────────────────────────────────────────────────────────── */
/*  Co-playable Games summary chips                              */
/* ────────────────────────────────────────────────────────────── */
const CoPlayableGamesSummary = ({ rolls, gameId }) => {
  const coPlayable = useMemo(() => {
    const counts = {}
    let total = 0
    rolls.forEach(r => {
      total += r.count
      const seen = new Set()
      ;(r.analysis?.variants || []).forEach(v => {
        if (v.game !== gameId && !seen.has(v.game)) {
          seen.add(v.game)
          counts[v.game] = (counts[v.game] || 0) + r.count
        }
      })
    })
    return Object.entries(counts)
      .map(([id, count]) => ({ id, count, pct: (count / total * 100) }))
      .sort((a, b) => b.pct - a.pct)
  }, [rolls, gameId])

  if (coPlayable.length === 0) return null

  return (
    <div className="flex flex-wrap gap-2">
      {coPlayable.slice(0, 8).map(g => {
        const meta = GAMES_MAP[g.id]
        return (
          <Link key={g.id} to={getGamePath(g.id)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border
              bg-muted/40 hover:bg-primary/10 hover:border-primary/30 transition-colors text-sm"
          >
            <span>{meta?.emoji || '🎲'}</span>
            <span className="font-medium">{meta?.name || g.id}</span>
            <span className="text-xs text-muted-foreground">{g.pct.toFixed(0)}%</span>
          </Link>
        )
      })}
    </div>
  )
}

/* ────────────────────────────────────────────────────────────── */
/*  Main Template                                                */
/* ────────────────────────────────────────────────────────────── */
const GameDetailTemplate = ({ pageContext }) => {
  const { gameId } = pageContext
  const content = GAME_CONTENT[gameId]
  const gameMeta = GAMES_MAP[gameId] || { name: gameId, emoji: '🎲' }

  const [flexThreshold, setFlexThreshold] = useState([4])
  const [strengthThreshold, setStrengthThreshold] = useState([65])
  const [variant, setVariant] = useState('all')

  const singleRollProb = useMemo(() => calcSingleRollProb(gameId), [gameId])
  const gameRolls = useMemo(() => getRollsForGame(gameId), [gameId])
  const totalMatching = useMemo(() => gameRolls.reduce((s, r) => s + r.count, 0), [gameRolls])

  // Barking — weak hands
  const weakHands = useMemo(() => {
    if (gameId !== 'barking') return []
    const hands = []
    Object.values(rollGameMatrix).forEach(rd => {
      const analysis = analyzeRoll(rd.roll)
      if (analysis.flexibility <= flexThreshold[0] &&
          (!analysis.bestCall || analysis.bestCall.rawStrength <= strengthThreshold[0])) {
        hands.push({ roll: rd.roll, flexibility: analysis.flexibility, bestCall: analysis.bestCall, count: rd.count })
      }
    })
    return hands.sort((a, b) => b.count - a.count)
  }, [gameId, flexThreshold, strengthThreshold])

  if (!content) {
    return (
      <Layout>
        <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="text-3xl font-bold">Game Not Found</h1>
        </section>
      </Layout>
    )
  }

  const maxRolls = MAX_ROLLS[gameId] || 3

  return (
    <Layout>
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        {/* ── Breadcrumb ── */}
        <nav className="mb-6 text-sm text-muted-foreground">
          <Link to="/games" className="hover:text-primary transition-colors">Games</Link>
          <span className="mx-2">›</span>
          <span className="text-foreground font-medium">{gameMeta.name}</span>
        </nav>

        {/* ── Header — matches site-wide pattern ── */}
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground">
            {gameMeta.emoji} {gameMeta.name}
            {content.subtitle && (
              <span className="text-xl text-muted-foreground ml-2 font-normal">{content.subtitle}</span>
            )}
          </h1>
          {content.isStrategy && <Badge variant="secondary" className="mt-2">Strategy</Badge>}
          {content.aka && (
            <p className="text-sm text-muted-foreground mt-2">Also known as: {content.aka}</p>
          )}
          <p className="text-base text-muted-foreground mt-3 max-w-xl mx-auto">
            {content.description}
          </p>
        </div>

        {/* ────────────────────────────── */}
        {/*  Layer 1: At-a-Glance Stats   */}
        {/* ────────────────────────────── */}
        {gameId !== 'barking' && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
            <Card className="text-center">
              <CardContent className="pt-6 pb-4">
                <div className="text-3xl font-bold text-primary">{singleRollProb.toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground mt-1">Single-roll chance</p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="pt-6 pb-4">
                <div className="text-3xl font-bold text-primary">{totalMatching.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground mt-1">of {TOTAL_ROLLS.toLocaleString()} rolls</p>
              </CardContent>
            </Card>
            <Card className="text-center col-span-2 sm:col-span-1">
              <CardContent className="pt-6 pb-4">
                <div className="text-3xl font-bold text-primary">{gameRolls.length}</div>
                <p className="text-xs text-muted-foreground mt-1">Unique patterns</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ── Strategy guidance ── */}
        {content.strategy && (
          <div className="mb-6 p-4 bg-primary/10 dark:bg-primary/20 border border-primary/20 dark:border-primary/40 rounded-lg">
            <h3 className="font-semibold text-primary dark:text-primary mb-1">When to Call</h3>
            <p className="text-sm text-foreground">{content.strategy}</p>
          </div>
        )}

        {/* ── Multi-roll strategy ── */}
        {content.partialKeep && (
          <div className="mb-6 p-4 bg-accent/50 border border-accent rounded-lg">
            <h3 className="font-semibold text-accent-foreground mb-1">Multi-Roll Strategy</h3>
            <p className="text-sm text-accent-foreground/90">{content.partialKeep}</p>
          </div>
        )}

        {/* ──────────────────────────────── */}
        {/*  Barking-specific content        */}
        {/* ──────────────────────────────── */}
        {gameId === 'barking' && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>When Should You Bark?</CardTitle>
              <CardDescription>
                Adjust the thresholds to see which hands warrant barking
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Flexibility Threshold: {flexThreshold[0]} or fewer playable games
                  </label>
                  <Slider value={flexThreshold} onValueChange={setFlexThreshold} min={0} max={10} step={1} className="w-full" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Strength Threshold: {strengthThreshold[0]} or lower raw strength
                  </label>
                  <Slider value={strengthThreshold} onValueChange={setStrengthThreshold} min={0} max={100} step={5} className="w-full" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-3">
                    Weak Hands ({weakHands.length} matching rolls, {weakHands.reduce((s, h) => s + h.count, 0)} total occurrences)
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
                    {weakHands.map((hand, idx) => (
                      <div key={idx} className="p-3 border rounded-lg bg-muted/20">
                        <div className="font-mono text-lg mb-1">[{hand.roll.join(', ')}]</div>
                        <div className="text-sm text-muted-foreground">
                          Flexibility: {hand.flexibility} ·{' '}
                          {hand.bestCall ? (
                            <>Best: <GameLink id={hand.bestCall.game}>{GAMES_MAP[hand.bestCall.game]?.name || hand.bestCall.game}</GameLink>
                            {hand.bestCall.variant ? ` (${hand.bestCall.variant})` : ''} · {Math.round(hand.bestCall.rawStrength)}</>
                          ) : (
                            <>No valid games</>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">Occurs {hand.count}× in {TOTAL_ROLLS.toLocaleString()} rolls</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ──────────────────────────────── */}
        {/*  Regular game content            */}
        {/* ──────────────────────────────── */}
        {gameId !== 'barking' && (
          <>
            {/* ─────────────────────────────────────── */}
            {/*  Layer 2: Probability Table (always open) */}
            {/* ─────────────────────────────────────── */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Roll Probabilities</CardTitle>
                <CardDescription>
                  {isSpecialtyGame(gameId)
                    ? `Chance of a competitive ${gameMeta.name} hand across multiple roll attempts`
                    : `Chance of rolling ${gameMeta.name} across multiple attempts`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-24">Rolls</TableHead>
                      <TableHead>Probability</TableHead>
                      <TableHead className="text-right w-20">%</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Array.from({ length: maxRolls }, (_, i) => {
                      const n = i + 1
                      const pct = n === 1 ? singleRollProb : multiRollProb(singleRollProb, n)
                      return (
                        <TableRow key={n}>
                          <TableCell className="font-medium">{n} roll{n > 1 ? 's' : ''}</TableCell>
                          <TableCell>
                            <div className="h-2 bg-muted rounded-full overflow-hidden max-w-xs">
                              <div className="h-full bg-primary rounded-full" style={{ width: `${Math.min(pct, 100)}%` }} />
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-semibold tabular-nums">{pct.toFixed(1)}%</TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* ── Co-playable games (quick summary) ── */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Often Paired With</CardTitle>
                <CardDescription>
                  Games most commonly playable on the same rolls as {gameMeta.name}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CoPlayableGamesSummary rolls={gameRolls} gameId={gameId} />
              </CardContent>
            </Card>

            {/* ─────────────────────────────────── */}
            {/*  Layer 3: Detailed Analysis          */}
            {/* ─────────────────────────────────── */}

            {/* Variant toggle — shared across sections below */}
            {gameMeta.hasVariants && (
              <div className="flex items-center gap-3 mb-4">
                <span className="text-sm font-medium text-muted-foreground">Variant:</span>
                <VariantSelector
                  selectedVariant={variant}
                  onChange={v => v && setVariant(v)}
                />
              </div>
            )}

            {/* Strength Distribution */}
            <CollapsibleSection
              title="Strength Distribution"
              description={`How strong are ${gameMeta.name} hands? Distribution of raw strength across all qualifying rolls.`}
            >
              <StrengthDistributionChart
                rolls={gameRolls}
                gameId={gameId}
                variant={gameMeta.hasVariants ? variant : null}
              />
            </CollapsibleSection>

            {/* Second Call Distribution (shared component) */}
            <div className="mb-6">
              <SecondCallDistribution
                gameId={gameId}
                hasVariants={gameMeta.hasVariants}
                numOpponents={0}
                showTabs={gameMeta.hasVariants}
                title="Second Call Distribution"
                description={`When the hammer calls ${gameMeta.name}, what other games are most likely as a second call?`}
              />
            </div>

            {/* Sample Rolls */}
            <CollapsibleSection
              title="Sample Rolls"
              description={`${gameRolls.length} unique roll patterns for ${gameMeta.name}, sorted by strength.`}
              badge={<Badge variant="outline" className="text-xs">{gameRolls.length}</Badge>}
            >
              <SampleRollsTable
                rolls={gameRolls}
                gameId={gameId}
                variant={variant}
                hasVariants={gameMeta.hasVariants}
              />
            </CollapsibleSection>

            {/* Deep-link to Rolls page */}
            <div className="text-center mt-8 mb-4">
              <Link to={`/odds?game=${gameId}&view=table`}>
                <Button variant="outline" size="lg">
                  Explore All {gameMeta.name} Rolls on the Odds Page →
                </Button>
              </Link>
            </div>
          </>
        )}
      </section>
    </Layout>
  )
}

export default GameDetailTemplate
