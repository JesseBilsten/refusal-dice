import React, { useEffect, useMemo, useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { ChoiceGroup, Panel, Stat } from '../Page'
import { Die, Hand } from '../Dice'
import { Disclosure, OddsDecision } from '../Odds'
import Seat from '../Table/Seat'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { useSimulation } from '../Odds/use-simulation'
import { useHouseRules } from '../Settings/house-rules'
import { formatCallLabel, GAMES_MAP } from '../../lib/games-config'
import { cn } from '../../lib/utils'
import { viewFor } from '../../engine'
import { YOU, handText } from '../Play/play-model'
import {
  FOCUSES,
  addToTally,
  describe,
  drawSituation,
  emptyTally,
  grade,
} from './trainer-model'

/**
 * The decision trainer: a real moment from a game against solid bots, the
 * question "what do you do?", then the odds of every option, measured as
 * your chance of the pencil this round (trainer-model.ts). The Hammer's
 * decision (the Hammer's call and a bark included) is played out by solid
 * bots in a worker, starting as soon as the situation appears.
 */

// Rounds played out per decision, as in Play's hints: about ±1.5 points each
const DECISION_SAMPLES = 1000
const REFUSAL_SAMPLES = 600

/** "2 points" (percentage points, rounded; at least 1) */
const points = (p) => {
  const n = Math.max(1, Math.round(p * 100))
  return `${n} ${n === 1 ? 'point' : 'points'}`
}

/** "3 net pencils" per 100 rounds (rounded; at least 1) */
const netPencils = (v) => {
  const n = Math.max(1, Math.round(v * 100))
  return `${n} net ${n === 1 ? 'pencil' : 'pencils'}`
}

const gameName = (call) => GAMES_MAP[call.game]?.name || call.game

/** Names for hint-stats and the situation line, for this game state */
function namesFor(state) {
  const seatName = Object.fromEntries(state.seats.map((s) => [s.id, s.name]))
  const call = 'call' in state.phase ? state.phase.call : null
  return {
    call: formatCallLabel,
    player: (id) => seatName[id] || id,
    hand: (dice) =>
      call ? handText(dice, call, [], gameName) : dice.join('-'),
  }
}

/** The dice to show for a seat: your own whole, others as the table sees them */
function SeatDice({ state, id, view }) {
  const phase = state.phase
  const call = 'call' in phase ? phase.call : null
  const dice = id === YOU ? state.dice[id] : view.dice[id]
  if (!dice) return <p className="text-sm text-muted-foreground">Dice hidden</p>
  const hidden = dice.filter((d) => d == null).length
  if (hidden)
    return (
      <div className="flex flex-wrap items-center gap-1">
        {dice.map((d, i) =>
          d == null ? null : <Die key={i} value={d} size="xs" />
        )}
        <span className="text-sm text-muted-foreground">{hidden} hidden</span>
      </div>
    )
  if (!call || phase.kind === 'refusal') return <Hand dice={dice} size="sm" />
  const putOut = phase.kind === 'tresAway' ? phase.hands[id]?.out : undefined
  const committed = phase.kind === 'play' ? phase.rolling[id]?.kept : undefined
  return (
    <Hand
      dice={dice}
      game={call.game}
      variant={call.variant}
      putOut={putOut}
      committed={committed}
      size="sm"
    />
  )
}

export default function Trainer({ className }) {
  const [rules] = useHouseRules()
  const [focus, setFocus] = useState('all')
  const [seed, setSeed] = useState(null)
  const [picked, setPicked] = useState(null)
  const [tally, setTally] = useState(emptyTally)

  // A random first situation, after mount (the server render stays empty)
  useEffect(() => setSeed(Math.floor(Math.random() * 2 ** 31)), [])

  const situation = useMemo(() => {
    if (seed == null) return null
    return drawSituation(seed, focus, namesFor, rules)
  }, [seed, focus, rules.montereyLoneKeep]) // eslint-disable-line react-hooks/exhaustive-deps

  const names = useMemo(
    () => situation && namesFor(situation.state),
    [situation]
  )
  const view = useMemo(
    () => situation && viewFor(situation.state, YOU),
    [situation]
  )

  // Play the options out as soon as the situation appears, so the answer is ready when you pick
  const request = useMemo(() => {
    if (!situation) return null
    if (situation.kind === 'refusal')
      return {
        kind: 'refusal',
        options: { ...situation.stats.refusal, samples: REFUSAL_SAMPLES },
      }
    return {
      kind: 'decision',
      options: {
        state: situation.state,
        me: YOU,
        choices: situation.options.map((o) => ({
          label: o.label,
          actions: o.actions,
        })),
        samples: DECISION_SAMPLES,
      },
    }
  }, [situation])
  const sim = useSimulation(request)

  // Each option's chance of the pencil (and its error, when played out)
  const odds = useMemo(() => {
    if (!situation) return null
    if (!sim.result || sim.running) return null
    // For one render after a new situation, the hook still holds the last one's result: skip it
    // (it's reset before you can pick, since picking clears with each new situation)
    const fits =
      situation.kind === 'refusal'
        ? Boolean(sim.result.accept)
        : Array.isArray(sim.result) &&
          sim.result.length === situation.options.length
    if (!fits) return null
    if (situation.kind === 'refusal')
      return {
        accept: { p: sim.result.accept.pencil, error: sim.result.accept.error },
        refuse: { p: sim.result.refuse.pencil, error: sim.result.refuse.error },
      }
    return Object.fromEntries(
      situation.options.map((o, i) => [
        o.id,
        {
          p: sim.result[i].pencil,
          error: sim.result[i].error,
          other: sim.result[i].other,
          net: sim.result[i].net,
          netError: sim.result[i].netError,
        },
      ])
    )
  }, [situation, sim.result, sim.running])

  // The Boss's own choices are scored in net pencils (higher is better)
  const net = situation?.measure === 'net'
  const margin = odds
    ? 2 *
      Math.max(...Object.values(odds).map((o) => (net ? o.netError : o.error)))
    : 0
  const graded = useMemo(
    () =>
      picked && odds
        ? grade(
            situation.options,
            Object.fromEntries(
              Object.entries(odds).map(([k, v]) => [k, net ? -v.net : v.p])
            ),
            picked,
            margin
          )
        : null,
    [picked, odds] // eslint-disable-line react-hooks/exhaustive-deps
  )

  // Count each decision once its odds are in
  useEffect(() => {
    if (graded) setTally((t) => addToTally(t, graded))
  }, [graded])

  const next = () => {
    setPicked(null)
    setSeed((s) => (s * 1103515245 + 12345) % 2 ** 31)
  }
  const changeFocus = (f) => {
    setFocus(f)
    setPicked(null)
  }

  const about = FOCUSES.find((f) => f.id === focus).about
  const text = situation && describe(situation, names)
  const state = situation?.state
  const players = state ? state.seats.filter((s) => !s.out) : []
  const others = players.filter((s) => s.id !== YOU)
  const me = state?.seats.find((s) => s.id === YOU)

  return (
    <div className={cn('space-y-6', className)}>
      <div className="space-y-2">
        <ChoiceGroup
          label="Practise"
          value={focus}
          onChange={changeFocus}
          options={FOCUSES.map(({ id, label }) => ({ value: id, label }))}
        />
        <p className="text-sm text-muted-foreground">{about}</p>
      </div>

      {tally.played > 0 && (
        <div className="grid grid-cols-2 gap-4">
          <Stat
            plain
            label="Best or close"
            value={`${tally.good} of ${tally.played}`}
          />
          <Stat
            plain
            label="Pencils given away"
            value={tally.given.toFixed(2)}
            sub="The extra chance of the pencil your other picks cost, added up"
          />
        </div>
      )}

      {!situation ? (
        <Panel title="Dealing a situation…" />
      ) : (
        <Panel title={text.heading} description={text.detail} tone="tool">
          <div className="space-y-4">
            <Seat
              name="You"
              you
              pencils={me.pencils}
              maxPencils={state.rules.pencilsToLose}
              badges={state.hammer === YOU ? ['🔨 Hammer'] : []}
            >
              <SeatDice state={state} id={YOU} view={view} />
            </Seat>
            {situation.kind === 'roll' && others.length > 0 && (
              <div className="grid gap-2 sm:grid-cols-2">
                {others.map((s) => (
                  <Seat
                    key={s.id}
                    name={s.name}
                    compact
                    pencils={s.pencils}
                    maxPencils={state.rules.pencilsToLose}
                    badges={state.hammer === s.id ? ['🔨 Hammer'] : []}
                  >
                    <SeatDice state={state} id={s.id} view={view} />
                  </Seat>
                ))}
              </div>
            )}

            <div>
              <h3 className="text-subheading mb-2">What do you do?</h3>
              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                {situation.options.map((o) => (
                  <Button
                    key={o.id}
                    size="lg"
                    variant={picked === o.id ? 'default' : 'outline'}
                    disabled={Boolean(picked)}
                    aria-pressed={picked === o.id}
                    onClick={() => setPicked(o.id)}
                    className="justify-start sm:justify-center"
                  >
                    {o.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </Panel>
      )}

      <div aria-live="polite">
        {picked && !graded && (
          <Panel title="Playing it out…">
            <p className="text-sm text-muted-foreground">
              {(situation.kind === 'refusal'
                ? REFUSAL_SAMPLES
                : DECISION_SAMPLES
              ).toLocaleString()}{' '}
              rounds with solid bots, from this exact spot.
            </p>
          </Panel>
        )}

        {graded && (
          <Panel
            as="section"
            title={
              graded.verdict === 'best'
                ? '✓ The best move'
                : graded.verdict === 'tossup'
                  ? '≈ A toss-up'
                  : `✗ ${graded.best.label} was better`
            }
            description={
              net
                ? graded.verdict === 'best'
                  ? 'Your pick sends the most pencils to the others, net.'
                  : graded.verdict === 'tossup'
                    ? `Your pick is within ${netPencils(margin)} per 100 rounds of the best: too close to call.`
                    : `Your pick costs ${netPencils(graded.cost)} per 100 rounds.`
                : graded.verdict === 'best'
                  ? 'Your pick takes the pencil least often.'
                  : graded.verdict === 'tossup'
                    ? `Your pick is within ${points(margin)} of the best: too close to call.`
                    : `Your pick takes the pencil ${points(graded.cost)} more often.`
            }
          >
            <div className="space-y-4">
              <OddsDecision
                outcome="take the pencil"
                tieMargin={margin}
                net={net}
                options={graded.ranked.map((o) => ({
                  id: o.id,
                  label: o.label,
                  title: (
                    <span className="inline-flex flex-wrap items-center gap-2">
                      {o.label}
                      {o.id === picked && (
                        <Badge variant="outline">Your pick</Badge>
                      )}
                    </span>
                  ),
                  error:
                    (net ? odds[o.id].netError : odds[o.id].error) || undefined,
                  ...(net
                    ? {
                        value: odds[o.id].net,
                        segments: [
                          {
                            p: odds[o.id].other,
                            label: 'Someone else takes the pencil',
                            kind: 'safe',
                          },
                          {
                            p: odds[o.id].p,
                            label: 'You take the pencil',
                            kind: 'lose',
                          },
                        ],
                      }
                    : {
                        segments: [
                          {
                            p: o.p,
                            label: 'You take the pencil',
                            kind: 'lose',
                          },
                        ],
                      }),
                }))}
              />
              <Disclosure title="How these odds are worked out">
                <div className="space-y-2 p-3 pt-0 text-sm">
                  <p>{situation.stats.why}</p>
                  <p className="text-muted-foreground">
                    {net
                      ? `${DECISION_SAMPLES.toLocaleString()} rounds played out by solid bots from this spot. As the Boss, picking ’em up never costs you a pencil, but coming up hands one to someone else, so each option is scored in net pencils: the pencils that go to someone else, minus yours, per 100 rounds (good to about ${netPencils(margin / 2)}). Picks within ${netPencils(margin)} of the best count as a toss-up.`
                      : `${(situation.kind === 'refusal' ? REFUSAL_SAMPLES : DECISION_SAMPLES).toLocaleString()} rounds played out by solid bots from this spot, so each chance is good to about ${points(margin / 2)}. Picks within ${points(margin)} of the best count as a toss-up.`}
                    {situation.solid !== graded.best.id &&
                      ` The solid bots would have picked: ${situation.options.find((o) => o.id === situation.solid)?.label}.`}
                  </p>
                </div>
              </Disclosure>
              <Button size="lg" onClick={next}>
                Next situation <ArrowRight aria-hidden className="h-4 w-4" />
              </Button>
            </div>
          </Panel>
        )}
      </div>
    </div>
  )
}
