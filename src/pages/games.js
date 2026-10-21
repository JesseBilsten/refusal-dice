import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'gatsby'
import { ArrowRight } from 'lucide-react'
import Layout from '../components/layout'
import Page, { PageHeader, Panel, NextStep } from '../components/Page'
import { Hand, RollInput } from '../components/Dice'
import { motion, useReducedMotion } from 'framer-motion'
import { BarkOdds, STRENGTH_GRADES, StrengthTag, fmtPct } from '../components/Odds'
import { Badge } from '../components/ui/badge'
import { buttonVariants } from '../components/ui/button'
import { analyzeRoll } from '../lib/game-validation'
import { formatCallLabel, GAMES_MAP } from '../lib/games-config'
import { cn } from '../lib/utils'
import rollGameMatrix from '../data/roll-game-matrix.json'
import { tresAwayScore } from '../engine'
import { CALL_ODDS_PLAYERS, callLoss } from '../strategy'
import { SPECIALTY_CALLS, specialtyCalls, worthCalling } from '../components/OddsLab/specialty-calls'
import { useHouseRules } from '../components/Settings/house-rules'

/**
 * Every game in one place: what makes it, what it looks like, how often it
 * comes up, and (with your roll entered) which ones your dice can play.
 * Each section is data below; the dice are drawn by Hand, so the grouping
 * is computed, never drawn by hand.
 */

/** Share of all 7,776 rolls where `test` holds, exact */
const share = (test) => {
  let n = 0
  for (let i = 0; i < 7776; i++) {
    const d = [0, 1, 2, 3, 4].map((k) => (Math.floor(i / 6 ** k) % 6) + 1)
    if (test(d)) n++
  }
  return n / 7776
}

/** "Worth calling with three of a kind or better: 21.3% of rolls.", worked out from the call odds */
const worthLine = (game) => {
  const { good } = specialtyCalls(game)
  const { orBetter, also } = SPECIALTY_CALLS[game]
  return `Worth calling with ${orBetter(good)}${also ? `, ${also}` : ''}: ${fmtPct(
    share((d) => worthCalling(game, d)),
    1
  )} of rolls.`
}

const SECTIONS = [
  {
    id: '10-2',
    made: 'Two dice add up to 10. The other three are the kicker, high or low.',
    note: 'The three-dice kicker is re-rolled as a block, so a total near the top or bottom is very hard to beat.',
    examples: [
      { dice: [4, 6, 1, 1, 1], variant: 'low' },
      { dice: [5, 5, 6, 6, 6], variant: 'high' },
    ],
  },
  {
    id: '10-3',
    made: 'Three dice add up to 10. The other two are the kicker, high or low.',
    note: 'The most common game: almost two rolls in three make it straight away.',
    examples: [
      { dice: [1, 3, 6, 1, 1], variant: 'low' },
      { dice: [2, 3, 5, 6, 6], variant: 'high' },
    ],
  },
  {
    id: '10-4',
    made: 'Four dice add up to 10. The last die is the kicker, high or low.',
    note: 'Four dice summing to 10 means small dice: a 6 only fits as 6-1-1-2.',
    examples: [
      { dice: [1, 2, 6, 1, 1], variant: 'low' },
      { dice: [1, 2, 3, 4, 6], variant: 'high' },
    ],
  },
  {
    id: 'ship-captain-crew',
    made: '1-2-3 or 4-5-6 (an outside straight). The other two are the kicker.',
    note: 'Both straights are worth the same: only the kicker counts.',
    examples: [
      { dice: [4, 5, 6, 1, 1], variant: 'low' },
      { dice: [1, 2, 3, 6, 6], variant: 'high' },
    ],
  },
  {
    id: 'monterey',
    made: '2-3-4 or 3-4-5 (an inside straight). The other two are the kicker.',
    note: 'The 3 and 4 are in both straights, so a lone 3 can be worth more than 2-3.',
    examples: [
      { dice: [2, 3, 4, 1, 1], variant: 'low' },
      { dice: [3, 4, 5, 6, 6], variant: 'high' },
    ],
  },
  {
    id: 'vegas',
    made: 'Two separate pairs that each add up to 7 or 11. The last die is the kicker.',
    note: '7 is 1+6, 2+5 or 3+4; 11 is 5+6.',
    examples: [
      { dice: [5, 6, 1, 6, 1], variant: 'low' },
      { dice: [2, 5, 3, 4, 6], variant: 'high' },
    ],
  },
  {
    id: 'pairs',
    made: 'Two pairs (four of a kind counts). The last die is the kicker.',
    note: 'The pairs themselves never matter: 2-2-3-3 ties 6-6-5-5 before the kicker.',
    examples: [
      { dice: [2, 2, 4, 4, 1], variant: 'low' },
      { dice: [6, 6, 5, 5, 6], variant: 'high' },
    ],
  },
  {
    id: 'razzle',
    made: 'The most of any one number, with 1s wild. Equal counts go to the higher number.',
    callLine: () => worthLine('razzle'),
    examples: [{ dice: [1, 6, 6, 2, 4] }, { dice: [1, 5, 1, 1, 3] }, { dice: [1, 1, 1, 1, 6] }],
  },
  {
    id: 'boss',
    made: 'Poker hands without straights or flushes. The best first roll is the Boss.',
    note: 'The Boss gets one more roll, in secret, then says “come up” (everyone else gets one last roll, and the worst hand loses: it can be the Boss) or “don’t come up” (no loser).',
    callLine: () => worthLine('boss'),
    examples: [{ dice: [5, 5, 5, 5, 2] }, { dice: [4, 4, 4, 3, 3] }, { dice: [6, 6, 4, 4, 1] }],
  },
  {
    id: 'tres-away',
    made: 'Lowest total wins, like golf: each die counts its face, except 3s count 0.',
    note: 'After every roll you put out at least one die, for good. Put out every 3 (a 1 joins them only beside three 3s); with no 3s, put out just your lowest die. That’s exact, not a rule of thumb.',
    callLine: () =>
      `Worth calling with a score of 10 or less: ${fmtPct(share((d) => tresAwayScore(d) <= 10), 1)} of rolls.`,
    examples: [{ dice: [3, 3, 3, 3, 3] }, { dice: [3, 1, 1, 3, 3] }, { dice: [3, 1, 2, 4, 3] }],
  },
]

/** Share of rolls that make each game on one roll (from the generated roll matrix) */
const madeOnOneRoll = () => {
  const out = {}
  SECTIONS.forEach(({ id }) => {
    let n = 0
    Object.values(rollGameMatrix).forEach((r) => {
      if (r.games && r.games.includes(id)) n += r.count || 0
    })
    out[id] = n / 7776
  })
  return out
}

function GameSection({ section, oneRoll, playable, loss, dimmed }) {
  const meta = GAMES_MAP[section.id]
  const callLine = useMemo(() => section.callLine?.(), [section])
  return (
    <Panel
      id={section.id}
      className={cn(
        'scroll-mt-24 transition-opacity',
        playable && 'border-primary ring-1 ring-primary',
        dimmed && 'opacity-50'
      )}
    >
      <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_auto]">
        <div>
          <div className="mb-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h2 className="text-2xl font-bold tracking-tight">
              <span aria-hidden>{meta.emoji}</span> {meta.fullName || meta.name}
            </h2>
            {meta.hasVariants && <span className="text-sm text-muted-foreground">high or low</span>}
            {playable && (
              <Badge>
                Your roll plays it{playable.variant ? `: ${formatCallLabel(playable)}` : ''}
              </Badge>
            )}
            {playable && <StrengthTag loss={loss} />}
          </div>
          <p className="mb-2">{section.made}</p>
          {section.note && <p className="mb-2 text-sm text-muted-foreground">{section.note}</p>}
          <p className="mb-4 text-sm text-muted-foreground">
            {callLine || `Made on one roll ${fmtPct(oneRoll, 1)} of the time.`}
          </p>
          <div className="flex flex-wrap gap-2">
            <Link to={`/games/${section.id}`} className={buttonVariants({ size: 'sm' })}>
              How to play it
            </Link>
            <Link to={`/odds-lab/?tab=games&game=${section.id}`} className={buttonVariants({ variant: 'outline', size: 'sm' })}>
              Every roll that makes it
            </Link>
          </div>
        </div>
        <div className="flex flex-col gap-3 md:items-end">
          {section.examples.map((e, i) => (
            <Hand
              key={i}
              dice={e.dice}
              game={section.id}
              variant={e.variant}
              // Tres Away examples are finished hands, labeled with their score
              putOut={section.id === 'tres-away' ? [0, 1, 2, 3, 4] : undefined}
              size="sm"
              labels
            />
          ))}
        </div>
      </div>
    </Panel>
  )
}

const GamesPage = () => {
  const [diceValues, setDiceValues] = useState(['', '', '', '', ''])
  const [houseRules] = useHouseRules()
  const oneRoll = useMemo(madeOnOneRoll, [])

  useEffect(() => {
    const roll = new URLSearchParams(window.location.search).get('roll')
    if (roll && /^[1-6]{5}$/.test(roll)) setDiceValues(roll.split(''))
  }, [])

  const roll = diceValues.every(Boolean) ? diceValues.map(Number) : null
  const analysis = useMemo(() => (roll ? analyzeRoll(roll) : null), [roll && roll.join('')]) // eslint-disable-line react-hooks/exhaustive-deps
  const playableCall = (id) => analysis?.variants?.find((v) => v.game === id) || null

  const onDiceChange = useCallback((values) => {
    setDiceValues(values)
    const digits = values.join('')
    window.history.replaceState({}, '', digits.length === 5 ? `/games?roll=${digits}` : '/games')
  }, [])

  const playableIds = SECTIONS.filter((s) => playableCall(s.id)).map((s) => s.id)
  // Your roll's chance of the pencil calling each game it plays (call-odds.ts)
  const lossOf = (id) => callLoss(roll, playableCall(id), houseRules)
  // Games your roll plays rise to the top, strongest first; the rest keep their order
  const ordered = roll
    ? [
        ...SECTIONS.filter((s) => playableCall(s.id)).sort((a, b) => lossOf(a.id) - lossOf(b.id)),
        ...SECTIONS.filter((s) => !playableCall(s.id)),
      ]
    : SECTIONS
  const reduced = useReducedMotion()

  return (
    <Layout>
      <Page width="wide">
        <PageHeader
          title="Games"
          description="Ten games the Hammer can call. Each one is made a different way, and only the kicker (or the hand) decides who loses."
        />

        <Panel tone="tool" title="Which games does my roll play?" className="mb-8">
          <div className="grid gap-6 lg:grid-cols-[auto_minmax(0,1fr)] lg:items-center">
            <RollInput
              diceValues={diceValues}
              onDiceChange={onDiceChange}
              onClear={() => window.history.replaceState({}, '', '/games')}
            />
            <div aria-live="polite">
              {!roll && <p className="text-muted-foreground">Enter your five dice, or tap Roll. Games your roll plays light up below.</p>}
              {roll && playableIds.length === 0 && (
                <p>
                  <strong>No game fits well.</strong> Calling is still usually better than <a href="#barking" className="text-primary hover:underline">barking</a>: see below, or check your hand in the <Link to="/strategy-assistant" className="text-primary hover:underline">Strategy Assistant</Link>.
                </p>
              )}
              {roll && playableIds.length > 0 && (
                <div className="space-y-2">
                  <p>
                    <strong>
                      Your roll plays {playableIds.length} {playableIds.length === 1 ? 'game' : 'games'}
                    </strong>
                    . Strongest: <strong>{formatCallLabel(playableCall(ordered[0].id))}</strong>
                    .
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {ordered.filter((s) => playableCall(s.id)).map(({ id }) => (
                      <a key={id} href={`#${id}`} className="rounded-full border bg-background px-3 py-1 text-sm hover:border-primary">
                        <span aria-hidden>{GAMES_MAP[id].emoji}</span> {GAMES_MAP[id].name}
                      </a>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Strength is your chance of taking the pencil if you call it with this roll, from rounds played out
                    by solid bots at a {CALL_ODDS_PLAYERS}-player table: {STRENGTH_GRADES[0].label} is{' '}
                    {fmtPct(STRENGTH_GRADES[0].max)} or less, {STRENGTH_GRADES[2].label} is still no more than an even
                    share ({fmtPct(1 / CALL_ODDS_PLAYERS)}).
                  </p>
                  <Link
                    to="/strategy-assistant"
                    className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                  >
                    See the odds of each call in the Strategy Assistant <ArrowRight aria-hidden className="h-4 w-4" />
                  </Link>
                </div>
              )}
            </div>
          </div>
        </Panel>

        <div className="space-y-4">
          {ordered.map((s) => (
            <motion.div key={s.id} layout={!reduced} transition={{ type: 'spring', stiffness: 260, damping: 30 }}>
              <GameSection
                section={s}
                oneRoll={oneRoll[s.id]}
                playable={playableCall(s.id)}
                loss={playableCall(s.id) ? lossOf(s.id) : null}
                dimmed={roll && !playableCall(s.id)}
              />
            </motion.div>
          ))}

          <Panel tone="note" title="🐕 None of these? Think twice before barking." as="section" id="barking">
            <p className="mb-4 text-sm">
              The Hammer can say “bark” instead of calling: the Hammer passes left, everyone picks up their dice, and a
              new round starts. It feels safe, but it gives away the best seat at the table.
            </p>
            <BarkOdds />
            <Link to="/games/barking" className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'mt-4')}>
              More on barking
            </Link>
          </Panel>
        </div>
        <NextStep to="/odds-lab/" title="Settle the arguments in the Odds Lab" text="Hold the 6 or roll all five? Keep the 1-6 or the 5-6? Exact answers for any roll." />
      </Page>
    </Layout>
  )
}

export default GamesPage
