import React, { useState, useMemo } from 'react'
import { Link } from 'gatsby'
import Layout from '../components/layout'
import Page, { NextStep, PageHeader, Panel, Stat } from '../components/Page'
import { BarkGuide, ProbabilityBar, STRENGTH_GRADES, StrengthTag, fmtPct, strengthGrade } from '../components/Odds'
import SituationCard from '../components/OddsLab/SituationCard'
import { SITUATIONS, situationPath, situationsFor } from '../components/OddsLab/situations-catalog'
import { bossName, keepOdds } from '../components/OddsLab/keep-model'
import { CALL_ODDS_PLAYERS, callLoss, freshMakeChance } from '../strategy'
import { isKickerGame } from '../engine'
import { useHouseRules } from '../components/Settings/house-rules'
import { Badge } from '../components/ui/badge'
import { Button, buttonVariants } from '../components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table'
import VariantSelector from '../components/VariantSelector'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { analyzeRoll, isCompetitiveSpecialtyHand } from '../lib/game-validation'
import { GAMES_MAP, isSpecialtyGame, SPECIALTY_THRESHOLDS, getGamePath } from '../lib/games-config'
import SecondCallDistribution from '../components/SecondCallDistribution'
import rollGameMatrix from '../data/roll-game-matrix.json'
import { Hand } from '../components/Dice'

/* ────────────────────────────────────────────────────────────── */
/*  Game metadata — enriches shared GAMES_MAP with page content  */
/* ────────────────────────────────────────────────────────────── */
const GAME_CONTENT = {
  '10-2': {
    subtitle: 'high or low',
    description: '2 dice add up to 10 and the remaining 3 dice are either high or low.',
    partialKeep: 'There’s nothing to keep until you have it: 10-2 has to come in one roll, so roll all five each time. Once you have it, keep the two dice that make 10 (they can’t be re-rolled) and re-roll the kicker whole (all three dice at once), or stand. With a three-dice kicker, totals near the top or bottom of the range are very hard to beat.',
  },
  '10-3': {
    subtitle: 'high or low',
    description: '3 dice add up to 10 and the remaining 2 dice are either high or low.',
    aka: 'Frankie',
    partialKeep: 'There’s nothing to keep until you have it: 10-3 has to come in one roll, so roll all five each time. Once you have it, keep the three dice that make 10 (they can’t be re-rolled) and re-roll the kicker whole (both dice at once), or stand.',
  },
  '10-4': {
    subtitle: 'high or low',
    description: '4 dice add up to 10 and the remaining die is either high or low.',
    aka: 'Shotgun',
    partialKeep: 'There’s nothing to keep until you have it: 10-4 has to come in one roll, so roll all five each time, which makes it the hardest game to make. Once you have it, keep the four dice that make 10 (they can’t be re-rolled); the kicker is the one die left.',
  },
  'ship-captain-crew': {
    subtitle: 'high or low',
    description: '3 dice make up an outside straight (4-5-6 or 1-2-3) and the remaining 2 dice are either high or low.',
    aka: 'Outside straight, Crew',
    partialKeep: 'Keep 1-2 or 5-6 and roll the other three for the missing 3 or 4: it has to come from those three, since your kept dice are part of the straight. Pick one: you can’t hold both, and once kept you’re committed to it. You can only keep the connector or the made straight, nothing else. Once you have it, the other two dice are your kicker, re-rolled together.',
  },
  monterey: {
    subtitle: 'high or low',
    description: '3 dice make up an inside straight (2-3-4 or 3-4-5) and the remaining 2 dice are either high or low.',
    aka: 'Inside straight',
    partialKeep: 'Keep a connector: 3-4 if you have it, since a 2 or a 5 finishes a straight; 2-3 or 4-5 need exactly one number. Once kept, you’re committed to it. Some tables also let you keep a lone 3 or 4; turn that on under House rules in Settings and the odds follow.',
  },
  vegas: {
    subtitle: 'high or low',
    description: '2 sets of 2 dice add up to 7 and/or 11 and the remaining die is either high or low.',
    aka: '7-11, 7 and/or 11\'s, Vegas',
    partialKeep: 'Keep one pair that sums to 7 or 11 (1-6, 2-5, 3-4 or 5-6) and roll the other three for a second. The kept pair stays a pair, so the second has to come from those three (a kept 5 can’t pair with a rolled 2), and any pair is as good to keep as another. Only that pair: no third die toward the next pair, and once kept you’re committed to it. Once you have both pairs, the last die is your kicker.',
  },
  pairs: {
    subtitle: 'high or low',
    description: '2 sets of 2 dice are matching pairs and the remaining die is either high or low.',
    partialKeep: 'Keep one pair and roll the other three for a second. Never keep a kicker die: you can only keep the pairs. Once you have two pairs, the last die is your kicker, re-rolled on its own.',
  },
  razzle: {
    description: 'Most amount of any one number with aces being wild. Equal counts go to the higher face: four 6s beat four 4s.',
    strategy: 'Call with three or more wild 6s (1s count as 6s), or five of any number. Equal counts go to the higher number, so 6s are the ones to chase.',
  },
  boss: {
    description: 'Poker-style hands without straights or flushes. All players reveal their dice, and the highest hand becomes the "Boss." A tie for the best hand means no Boss: no loser, and the Hammer passes left.',
    strategy: 'Call with two pair or better; three of a kind is a strong call. If you’re the Boss you get one more roll in secret: pick up any dice, as long as what you keep still beats everyone, then decide whether to call everyone up.',
    // Computed from the Boss question (situations-catalog.js), so the odds follow the rules
    partialKeep: () => {
      const { s } = SITUATIONS.boss
      const odds = keepOdds(s, {})
      const pct = (keep) => fmtPct(odds(keep).win)
      return (
        `On your last roll after “come up”, you only need to beat the worst hand showing. From ` +
        `${s.roll.split('').join('-')} against ${bossName(s.beat.split('').map(Number))}, holding the 6 wins ` +
        `${pct('6')}, holding 5-6 ${pct('56')}, and rolling all five ${pct('')}: see the question below.`
      )
    },
  },
  'tres-away': {
    description: 'Just like golf, lowest score wins. Each die is worth its face value except for 3\'s which are worth 0 points.',
    strategy: 'Call with a score of 10 or less; 7 or less is strong. Every 3 is worth 0, so 3s are gold.',
    partialKeep: 'After each roll put out at least one die. Put out every 3; a 1 joins them only beside three 3s. With no 3s, put out just your lowest die and roll the rest.',
  },
  barking: {
    description: 'Barking is passing instead of calling: the Hammer moves to the player on your left and everyone rolls again.',
    isStrategy: true,
  },
}

/* ────────────────────────────────────────────────────────────── */
/*  Helpers                                                      */
/* ────────────────────────────────────────────────────────────── */

const TOTAL_ROLLS = 7776

/** Max rolls for probability table per game */

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

/**
 * A roll's call in this game: the variant it plays best (or `variant`),
 * its kicker, and `loss`, the Hammer's chance of the pencil calling it
 * (call-odds.ts, from rounds played by solid bots)
 */
const classifyRoll = (roll, gameId, variant, rules) => {
  const analysis = analyzeRoll(roll)
  const v = analysis.variants?.find(vv => vv.game === gameId)
  if (!v) return null
  const variants = GAMES_MAP[gameId].hasVariants ? (variant && variant !== 'all' ? [variant] : ['high', 'low']) : [null]
  const best = variants
    .map(vr => ({ variant: vr, loss: callLoss(roll, { game: gameId, ...(vr ? { variant: vr } : {}) }, rules) }))
    .sort((a, b) => a.loss - b.loss)[0]
  return { variant: best.variant, loss: best.loss, kicker: v.kicker }
}

/* ────────────────────────────────────────────────────────────── */
/*  Collapsible section — progressive disclosure                 */
/* ────────────────────────────────────────────────────────────── */
const CollapsibleSection = ({ title, description, defaultOpen = false, children, badge }) => {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <Panel
      className="mb-6"
      title={
        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          aria-expanded={open}
          className="flex items-center gap-2 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {open
            ? <ChevronUp aria-hidden className="h-5 w-5 text-muted-foreground" />
            : <ChevronDown aria-hidden className="h-5 w-5 text-muted-foreground" />}
          {title}
          {badge}
        </button>
      }
      description={description}
    >
      {open ? children : null}
    </Panel>
  )
}

/* ────────────────────────────────────────────────────────────── */
/*  Strength: every roll that makes it, by grade (call-odds.ts)   */
/* ────────────────────────────────────────────────────────────── */
const StrengthDistributionChart = ({ rolls, gameId, variant, rules }) => {
  const data = useMemo(() => {
    const counts = STRENGTH_GRADES.map(() => 0)
    let total = 0
    rolls.forEach(r => {
      const info = classifyRoll(r.roll, gameId, variant, rules)
      if (!info) return
      counts[STRENGTH_GRADES.indexOf(strengthGrade(info.loss))] += r.count
      total += r.count
    })
    return STRENGTH_GRADES.map((g, i) => ({ grade: g, prev: STRENGTH_GRADES[i - 1], p: total ? counts[i] / total : 0 }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rolls, gameId, variant, rules.montereyLoneKeep])

  return (
    <div className="space-y-2">
      {data.map(({ grade, prev, p }) => (
        <ProbabilityBar
          key={grade.label}
          label={grade.label}
          sublabel={
            <span className="text-muted-foreground">
              {grade.max === Infinity ? `over ${fmtPct(prev.max)}` : `${fmtPct(grade.max)} or less`}
            </span>
          }
          p={p}
          digits={1}
          className="grid-cols-[minmax(0,9rem)_1fr_auto]"
        />
      ))}
    </div>
  )
}

/* ────────────────────────────────────────────────────────────── */
/*  Sample Rolls Table                                           */
/* ────────────────────────────────────────────────────────────── */
const SampleRollsTable = ({ rolls, gameId, variant, hasVariants, rules }) => {
  const [showAll, setShowAll] = useState(false)

  const filtered = useMemo(() => {
    const result = rolls
      .map(r => ({ ...r, info: classifyRoll(r.roll, gameId, hasVariants ? variant : null, rules) }))
      .filter(r => r.info)
    result.sort((a, b) => a.info.loss - b.info.loss)
    return result
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rolls, gameId, variant, hasVariants, rules.montereyLoneKeep])

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
              <TableCell><Hand dice={r.roll} game={gameId} variant={r.info.variant} size="xs" /></TableCell>
              {hasVariants && (
                <TableCell>
                  <Badge variant={r.info.variant === 'high' ? 'default' : 'secondary'} className="text-xs">
                    {r.info.variant || '—'}
                  </Badge>
                </TableCell>
              )}
              <TableCell>
                <StrengthTag loss={r.info.loss} />
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

  const [variant, setVariant] = useState('all')
  const [houseRules] = useHouseRules()

  const singleRollProb = useMemo(() => calcSingleRollProb(gameId), [gameId])
  const gameRolls = useMemo(() => getRollsForGame(gameId), [gameId])
  const totalMatching = useMemo(() => gameRolls.reduce((s, r) => s + r.count, 0), [gameRolls])


  if (!content) {
    return (
      <Layout>
        <Page>
          <PageHeader title="Game not found" breadcrumbs={[{ to: '/games', label: 'Games' }, { label: 'Not found' }]} />
        </Page>
      </Layout>
    )
  }


  return (
    <Layout>
      <Page>
        <PageHeader
          breadcrumbs={[{ to: '/games', label: 'Games' }, { label: gameMeta.name }]}
          title={
            <>
              <span aria-hidden>{gameMeta.emoji}</span> {gameMeta.name}
              {content.subtitle && (
                <span className="ml-2 text-xl font-normal text-muted-foreground">{content.subtitle}</span>
              )}
            </>
          }
          badge={content.isStrategy && <Badge variant="secondary">Strategy</Badge>}
          description={content.description}
        >
          {content.aka && (
            <p className="text-muted-foreground">Also known as: {content.aka}</p>
          )}
        </PageHeader>

        {/* ────────────────────────────── */}
        {/*  Layer 1: At-a-Glance Stats   */}
        {/* ────────────────────────────── */}
        {gameId !== 'barking' && (
          <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
            <Stat value={`${singleRollProb.toFixed(1)}%`} label="Made on one roll" />
            <Stat value={totalMatching.toLocaleString()} label="Rolls that make it" sub={`of ${TOTAL_ROLLS.toLocaleString()}`} />
            <Stat value={gameRolls.length} label="Unique patterns" sub="order ignored" className="col-span-2 sm:col-span-1" />
          </div>
        )}

        {(content.strategy || content.partialKeep) && (
          <div className={`mb-8 grid gap-3 sm:gap-4 ${content.strategy && content.partialKeep ? 'sm:grid-cols-2' : ''}`}>
            {content.strategy && (
              <Panel tone="note" title="When to call it">
                <p className="text-sm">{content.strategy}</p>
              </Panel>
            )}
            {content.partialKeep && (
              <Panel tone="note" title="What to keep">
                <p className="text-sm">
                  {typeof content.partialKeep === 'function' ? content.partialKeep() : content.partialKeep}
                </p>
              </Panel>
            )}
          </div>
        )}

        {/* ──────────────────────────────── */}
        {/*  Barking-specific content        */}
        {/* ──────────────────────────────── */}
        {gameId === 'barking' && (
          <Panel className="mb-8" title="Should you bark?">
            <BarkGuide />
          </Panel>
        )}

        {/* ──────────────────────────────── */}
        {/*  Regular game content            */}
        {/* ──────────────────────────────── */}
        {gameId !== 'barking' && (
          <>
            {/* ─────────────────────────────────────── */}
            {/*  Layer 2: Probability Table (always open) */}
            {/* ─────────────────────────────────────── */}
            {situationsFor(gameId).map((q) => (
              <SituationCard key={q.label} situation={q} className="mb-6" />
            ))}

            {isKickerGame(gameId) ? (
              <Panel
                className="mb-6"
                title={`Chance of making ${gameMeta.name}`}
                description={
                  gameId.startsWith('10-')
                    ? 'It has to come in one roll, so each roll is a fresh try at all five dice. Exact over every roll.'
                    : 'Keeping only dice toward the game, as the rules allow. Exact over every roll.'
                }
              >
                <div className="max-w-xl space-y-3">
                  {[1, 2, 3].map((n) => (
                    <ProbabilityBar
                      key={n}
                      label={`${n} roll${n > 1 ? 's' : ''}`}
                      p={freshMakeChance(gameId, n, houseRules)}
                    />
                  ))}
                </div>
                <p className="mt-4 text-sm text-muted-foreground">
                  {gameId.startsWith('10-') ? 'Made it, and wondering whether to re-roll the kicker?' : 'Not sure what to keep from a roll?'}{' '}
                  <Link to={`/odds-lab/?tab=keep&game=${gameId}`} className="font-medium text-primary hover:underline">
                    Ask the Odds Lab
                  </Link>
                  .
                </p>
              </Panel>
            ) : (
              <Panel
                className="mb-6"
                title={`A competitive ${gameMeta.name} hand`}
                description="How often one roll of five gives a hand worth calling on."
              >
                <div className="max-w-xl">
                  <ProbabilityBar label="1 roll" p={singleRollProb / 100} />
                </div>
                <p className="mt-4 text-sm text-muted-foreground">
                  After that it depends on what you keep and what you're up against.{' '}
                  <Link to={`/odds-lab/?tab=keep&game=${gameId}`} className="font-medium text-primary hover:underline">
                    Work out a situation in the Odds Lab
                  </Link>
                  .
                </p>
              </Panel>
            )}

            {/* ── Co-playable games (quick summary) ── */}
            <Panel
              className="mb-6"
              title="Often paired with"
              description={`The games most often made by the same rolls as ${gameMeta.name}.`}
            >
              <CoPlayableGamesSummary rolls={gameRolls} gameId={gameId} />
            </Panel>

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
              title="Strength distribution"
              description={`How strong are ${gameMeta.name} hands? Every roll that makes it, graded by the Hammer’s chance of the pencil calling it at a ${CALL_ODDS_PLAYERS}-player table (from rounds played by solid bots).`}
            >
              <StrengthDistributionChart
                rolls={gameRolls}
                gameId={gameId}
                variant={gameMeta.hasVariants ? variant : null}
                rules={houseRules}
              />
            </CollapsibleSection>

            {/* The comeback: second calls, exact (shared with the Strategy Assistant) */}
            <div className="mb-6">
              <SecondCallDistribution
                gameId={gameId}
                showTabs={gameMeta.hasVariants}
                title="The comeback"
                description={`If both refusals turn down ${gameMeta.name}, what does the Hammer call instead?`}
              />
            </div>

            {/* Sample Rolls */}
            <CollapsibleSection
              title="Sample rolls"
              description={`${gameRolls.length} unique roll patterns for ${gameMeta.name}, strongest first: the Hammer’s chance of the pencil calling it.`}
              badge={<Badge variant="outline" className="text-xs">{gameRolls.length}</Badge>}
            >
              <SampleRollsTable
                rolls={gameRolls}
                gameId={gameId}
                variant={variant}
                hasVariants={gameMeta.hasVariants}
                rules={houseRules}
              />
            </CollapsibleSection>

            {/* Deep-link to Rolls page */}
            <div className="text-center mt-8 mb-4">
              <Link
                to={`/odds-lab/?tab=games&game=${gameId}`}
                className={buttonVariants({ variant: 'outline', size: 'lg' })}
              >
                See every {gameMeta.name} roll in the Odds Lab →
              </Link>
            </div>
          </>
        )}
        {gameId !== 'barking' && (
          <NextStep
            to={situationsFor(gameId).length ? situationPath(situationsFor(gameId)[0].s) : `/odds-lab/?tab=keep&game=${gameId}`}
            title="Work out your own situations"
            text={`Enter any ${gameMeta.name} roll in the Odds Lab and see exactly what to keep.`}
          />
        )}
      </Page>
    </Layout>
  )
}

export default GameDetailTemplate
