import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { withPrefix } from 'gatsby'
import { FlaskConical, Lightbulb } from 'lucide-react'
import {
  applyAction,
  evaluateKickerHand,
  isKickerGame,
  keepsKickers,
  refusalSeats,
  viewFor,
} from '../../engine'
import { ALL_CALLS, botAction, callScore } from '../../strategy'
import { formatCallLabel, GAMES_MAP } from '../../lib/games-config'
import { cn } from '../../lib/utils'
import { Button } from '../ui/button'
import { Switch } from '../ui/switch'
import { Label } from '../ui/label'
import {
  DiceSettings,
  Hand,
  RollButton,
  playRollSound,
  useDicePrefs,
} from '../Dice'
import { Panel } from '../Page'
import Seat from '../Table/Seat'
import {
  BOT_NAMES,
  YOU,
  actor,
  callAllowed,
  describeEvent,
  newTable,
  rolledPositions,
} from './play-model'

/**
 * Play full games of Refusal against solid bots (src/strategy/bots.ts), on
 * the real engine. You pick the table size; the bots take their turns with
 * a short pause so you can follow along. Hints show what a solid player
 * would do, and the Odds Lab link opens your exact situation.
 */

const BOT_DELAY = 750
const ZERO = [0, 0, 0, 0, 0]
const label = (call) => formatCallLabel(call)

/** What a suggested action means, in words */
function hintText(action, dice) {
  switch (action.type) {
    case 'call':
      return `Call ${label(action.call)}.`
    case 'bark':
      return 'Bark: pass the Hammer.'
    case 'accept':
      return 'Accept the call.'
    case 'refuse':
      return 'Refuse the call.'
    case 'reroll':
      return action.keep.length
        ? `Keep ${action.keep.map((i) => dice[i]).join('-')} and roll ${5 - action.keep.length}.`
        : 'Roll all five.'
    case 'stand':
      return 'Stand: stop rolling.'
    case 'putOut':
      return `Put out ${action.dice.map((i) => dice[i]).join(' ')}.`
    case 'roll':
      return 'Roll the dice still in your hand.'
    case 'comeUp':
      return 'Say “come up”.'
    case 'dontComeUp':
      return 'Say “don’t come up”.'
    default:
      return null
  }
}

function Setup({ onStart }) {
  const [bots, setBots] = useState(3)
  return (
    <Panel tone="tool" title="Set the table" description="You against solid bots. First to three pencils is out; the last player standing wins.">
      <div className="space-y-5">
        <div className="space-y-2">
          <div className="text-sm font-semibold">Opponents</div>
          <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Number of opponents">
            {[1, 2, 3, 4, 5, 6, 7].map((n) => (
              <button
                key={n}
                type="button"
                role="radio"
                aria-checked={bots === n}
                onClick={() => setBots(n)}
                className={cn(
                  'h-11 w-11 rounded-full border text-base font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  bots === n ? 'border-primary bg-primary text-primary-foreground' : 'bg-background hover:border-primary/50'
                )}
              >
                {n}
              </button>
            ))}
          </div>
          <p className="text-sm text-muted-foreground">
            {BOT_NAMES.slice(0, bots).join(', ')} {bots === 1 ? 'joins' : 'join'} you.
            {bots === 1 && ' With two players there’s only one refusal.'}
          </p>
        </div>
        <RollButton size="lg" onClick={() => onStart(bots)}>
          Piddle for the Hammer
        </RollButton>
      </div>
    </Panel>
  )
}

export default function Play() {
  const [game, setGame] = useState(null)
  const [rollIds, setRollIds] = useState({})
  const [keep, setKeep] = useState([])
  const [error, setError] = useState(null)
  const [hints, setHints] = useState(true)
  const [roundStart, setRoundStart] = useState(0)
  const [prefs] = useDicePrefs()
  const prev = useRef(null)

  const start = (bots) => {
    const g = newTable(bots, Math.floor(Math.random() * 2 ** 31))
    setRollIds(Object.fromEntries(g.seats.map((s) => [s.id, ZERO.map(() => 1)])))
    setGame(g)
    setRoundStart(0)
    setKeep([])
    setError(null)
    if (prefs.sound) playRollSound(5)
  }

  const gameRef = useRef(game)
  gameRef.current = game

  const act = useCallback(
    (action) => {
      const g = gameRef.current
      let next
      try {
        next = applyAction(g, action)
      } catch (e) {
        setError(e.message)
        return
      }
      setError(null)
      const rolled = rolledPositions(next.log.slice(g.log.length))
      // A new deal (next round, or a bark) re-rolls everyone
      if (next.round !== g.round) {
        next.seats.filter((s) => !s.out).forEach((s) => (rolled[s.id] = [0, 1, 2, 3, 4]))
        setRoundStart(next.log.length)
      }
      const count = Object.values(rolled).flat().length
      if (count) {
        setRollIds((ids) => {
          const out = { ...ids }
          Object.entries(rolled).forEach(([id, idx]) => {
            out[id] = (ids[id] || ZERO).map((n, i) => (idx.includes(i) ? n + 1 : n))
          })
          return out
        })
        if (prefs.sound) playRollSound(Math.min(count, 10))
      }
      gameRef.current = next
      setGame(next)
    },
    [prefs.sound]
  )

  const who = game ? actor(game) : null

  // Bots move on their own, a beat apart
  useEffect(() => {
    if (!game || !who || who === YOU) return undefined
    const t = setTimeout(() => act(botAction(game)), BOT_DELAY)
    return () => clearTimeout(t)
  }, [game, who, act])

  // A fresh keep selection whenever it becomes your move
  useEffect(() => {
    if (!game) return
    const key = `${game.round}:${game.phase.kind}:${who}`
    if (prev.current === key) return
    prev.current = key
    const ph = game.phase
    setKeep(ph.kind === 'boss' && ph.stage === 'bossRoll' && ph.boss === YOU ? [...ph.mustKeep] : [])
  }, [game, who])

  const view = useMemo(() => (game ? viewFor(game, YOU) : null), [game])
  const suggestion = useMemo(() => (game && who === YOU ? botAction(game) : null), [game, who])

  if (!game) return <Setup onStart={start} />

  const names = Object.fromEntries(game.seats.map((s) => [s.id, s.name]))
  const phase = game.phase
  const call = 'call' in phase ? phase.call : null
  const myDice = game.dice[YOU]
  const meOut = game.seats.find((s) => s.id === YOU).out
  const roundEvents = game.log
    .slice(roundStart)
    .map((e) => describeEvent(e, names, label))
    .filter(Boolean)

  // Roles and decisions this round
  const seats = phase.kind === 'gameOver' ? { first: null } : refusalSeats(game)
  const decisions = {}
  game.log.slice(roundStart).forEach((e) => {
    if (e.type === 'refused') decisions[e.player] = 'Refused'
    if (e.type === 'accepted') decisions[e.player] = 'Accepted'
    if (e.type === 'stood') decisions[e.player] = 'Done'
    if (e.type === 'cycle') e.players.forEach((id) => (decisions[id] = 'Replaying'))
  })
  if (phase.kind === 'play')
    Object.entries(phase.rolling).forEach(([id, r]) => {
      if (r.done) decisions[id] = 'Done'
    })

  const toggleKeep = (i) => {
    if (phase.kind === 'boss' && phase.stage === 'bossRoll' && phase.mustKeep.includes(i)) return
    setKeep((k) => (k.includes(i) ? k.filter((x) => x !== i) : [...k, i]))
  }

  // Your controls for this moment
  let title = ''
  let body = null
  let controls = null
  let labLink = null
  const mine = who === YOU

  if (phase.kind === 'gameOver') {
    title = phase.winner === YOU ? 'You win the pot! 🎉' : `${names[phase.winner]} wins the pot`
    body = <p>Last player standing. Rack ’em up again?</p>
    controls = (
      <div className="flex flex-wrap gap-2">
        <RollButton onClick={() => setGame(null)}>New game</RollButton>
      </div>
    )
  } else if (phase.kind === 'roundOver') {
    const loser = phase.loser
    title = loser ? (loser === YOU ? 'You take the pencil' : `${names[loser]} takes the pencil`) : 'No pencil this round'
    body = <p>{loser ? `${loser === YOU ? 'You hold' : `${names[loser]} holds`} the Hammer next.` : 'The Hammer passes left.'}</p>
    controls = <RollButton onClick={() => act({ type: 'nextRound' })}>Next round</RollButton>
  } else if (!mine) {
    title = meOut ? 'You’re out: watching the bots' : `${names[who]} is thinking…`
    body = <p className="text-muted-foreground">{phase.kind === 'call' ? 'The Hammer looks at their dice.' : 'Watch the table.'}</p>
  } else if (phase.kind === 'call' || phase.kind === 'secondCall') {
    const second = phase.kind === 'secondCall'
    title = second ? 'Both refused: make a second call' : 'You hold the Hammer: call a game'
    body = (
      <p>
        {second
          ? `It must be a different game from ${label(phase.refused)}, and nobody can refuse it.`
          : 'Pick the game your dice play best. Your dice are hidden from everyone else until play starts.'}
      </p>
    )
    // Lead with the calls these dice suit best; the rest are a tap away (fewer choices, faster decisions)
    const ranked = ALL_CALLS.filter((c) => callAllowed(game, c)).sort((a, b) => callScore(myDice, b) - callScore(myDice, a))
    const callButton = (c) => {
      const suggested = hints && suggestion?.type === 'call' && suggestion.call.game === c.game && suggestion.call.variant === c.variant
      return (
        <li key={`${c.game}-${c.variant || ''}`}>
          <button
            type="button"
            onClick={() => act({ type: 'call', player: YOU, call: c })}
            className={cn(
              'flex min-h-11 w-full items-center justify-between gap-2 rounded-lg border bg-background p-2 text-left text-sm transition-colors hover:border-primary hover:bg-primary/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              suggested && 'border-primary ring-1 ring-primary'
            )}
          >
            <span className="font-medium">
              <span aria-hidden>{GAMES_MAP[c.game]?.emoji}</span> {label(c)}
              {suggested && <span className="ml-1 text-xs text-primary">Suggested</span>}
            </span>
            <Hand dice={myDice} game={c.game} variant={c.variant} size="xs" />
          </button>
        </li>
      )
    }
    controls = (
      <div className="space-y-3">
        <p className="text-sm font-semibold">Best fits for your dice</p>
        <ul className="grid gap-2 sm:grid-cols-2">{ranked.slice(0, 4).map(callButton)}</ul>
        <details className="group rounded-lg border bg-background/60">
          <summary className="cursor-pointer select-none rounded-lg p-2 text-sm font-medium hover:bg-accent">
            Other calls ({ranked.length - 4})
          </summary>
          <ul className="grid gap-2 p-2 sm:grid-cols-2">{ranked.slice(4).map(callButton)}</ul>
        </details>
        {!second && game.rules.barking && (
          <Button variant="outline" onClick={() => act({ type: 'bark', player: YOU })}>
            Bark: pass the Hammer
          </Button>
        )}
      </div>
    )
  } else if (phase.kind === 'refusal') {
    title = `${names[game.hammer]} called ${label(phase.call)}`
    body = <p>You’re the {phase.seat === 1 ? '1st' : '2nd'} refusal. Accept and everyone plays it, or refuse and {phase.seat === 1 && seats.second ? 'the 2nd refusal decides' : 'the Hammer must call a different game'}. You keep these dice either way.</p>
    controls = (
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => act({ type: 'accept', player: YOU })}>Accept</Button>
        <Button variant="outline" onClick={() => act({ type: 'refuse', player: YOU })}>Refuse</Button>
      </div>
    )
  } else if (phase.kind === 'play') {
    const r = phase.rolling[YOU]
    const left = 3 - r.rollsUsed
    const kicker = isKickerGame(call.game)
    const hand = kicker ? evaluateKickerHand(myDice, call.game, call.variant) : null
    const badKeep = Boolean(kicker && keep.length && keepsKickers(keep.map((i) => myDice[i]), call.game))
    title = `Your roll: ${left} ${left === 1 ? 'roll' : 'rolls'} left`
    body = (
      <p>
        Tap dice to keep them, then roll the rest, or stand.
        {kicker && hand?.made && ' You’ve made the game: the kicker is rolled whole, so keep just the game dice to re-roll it.'}
      </p>
    )
    controls = (
      <div className="flex flex-wrap items-center gap-2">
        <RollButton disabled={keep.length === 5 || badKeep} onClick={() => act({ type: 'reroll', player: YOU, keep })}>
          Roll {5 - keep.length}
        </RollButton>
        <Button variant="outline" onClick={() => act({ type: 'stand', player: YOU })}>Stand</Button>
        {badKeep && <span className="text-sm text-destructive">Keep only the game dice: the kicker is rolled whole.</span>}
      </div>
    )
    labLink = `/odds-lab/?tab=keep&game=${call.game}&roll=${myDice.join('')}&rolls=${Math.max(1, left - 1)}${kicker && hand?.made ? `&goal=kicker&variant=${call.variant}&total=${hand.kickerTotal}` : ''}`
  } else if (phase.kind === 'tresAway') {
    const h = phase.hands[YOU]
    title = h.fresh ? 'Put out at least one die' : 'Roll the dice in your hand'
    body = <p>Lowest total wins; 3s count 0. Put-out dice are final and everyone sees them.</p>
    controls = h.fresh ? (
      <div className="flex flex-wrap gap-2">
        <Button disabled={!keep.length} onClick={() => act({ type: 'putOut', player: YOU, dice: keep })}>
          Put out {keep.length || ''} {keep.length === 1 ? 'die' : 'dice'}
        </Button>
      </div>
    ) : (
      <RollButton onClick={() => act({ type: 'roll', player: YOU })}>Roll {5 - h.out.length}</RollButton>
    )
    if (h.fresh) labLink = `/odds-lab/?tab=keep&game=tres-away&roll=${myDice.join('')}`
  } else if (phase.kind === 'boss') {
    if (phase.stage === 'bossRoll') {
      title = 'You’re the Boss: one more roll, in secret'
      body = <p>You must keep the dice that made you Boss (locked). Roll the others for a better hand, or stand.</p>
      controls = (
        <div className="flex flex-wrap gap-2">
          <RollButton disabled={keep.length === 5} onClick={() => act({ type: 'reroll', player: YOU, keep })}>Roll {5 - keep.length}</RollButton>
          <Button variant="outline" onClick={() => act({ type: 'stand', player: YOU })}>Stand</Button>
        </div>
      )
    } else if (phase.stage === 'decide') {
      title = 'Come up, or don’t?'
      body = <p>“Come up” gives everyone one last roll, and the worst hand loses: it can be you. “Don’t come up” ends the round with no loser.</p>
      controls = (
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => act({ type: 'comeUp', player: YOU })}>Come up</Button>
          <Button variant="outline" onClick={() => act({ type: 'dontComeUp', player: YOU })}>Don’t come up</Button>
        </div>
      )
    } else {
      title = 'Your last roll'
      body = <p>Keep any dice and roll the rest, or stand. The worst hand at the table loses.</p>
      controls = (
        <div className="flex flex-wrap gap-2">
          <RollButton disabled={keep.length === 5} onClick={() => act({ type: 'reroll', player: YOU, keep })}>Roll {5 - keep.length}</RollButton>
          <Button variant="outline" onClick={() => act({ type: 'stand', player: YOU })}>Stand</Button>
        </div>
      )
      labLink = `/odds-lab/?tab=keep&game=boss&roll=${myDice.join('')}`
    }
  }

  const canKeep =
    mine &&
    ((phase.kind === 'play') ||
      (phase.kind === 'tresAway' && phase.hands[YOU].fresh) ||
      (phase.kind === 'boss' && phase.stage !== 'decide'))
  const hint = hints && suggestion ? hintText(suggestion, myDice) : null

  return (
    <div className="space-y-6">
      {/* Status bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-felt px-4 py-3 text-felt-foreground shadow-sm">
        <div className="font-display text-lg font-bold">
          Round {game.round}
          {call && <span className="font-normal"> · {label(call)}</span>}
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Switch id="hints" checked={hints} onCheckedChange={setHints} />
          <Label htmlFor="hints" className="text-felt-foreground">Hints</Label>
        </div>
      </div>

      {/* The table */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {game.seats.map((s) => {
          const badges = []
          if (phase.kind !== 'gameOver') {
            if (s.id === game.hammer) badges.push(phase.kind === 'roundOver' ? '🔨 Next Hammer' : '🔨 Hammer')
            if (phase.kind !== 'roundOver') {
              if (s.id === seats.first) badges.push('1st refusal')
              if (s.id === seats.second) badges.push('2nd refusal')
            }
          }
          if (phase.kind === 'boss' && phase.boss === s.id) badges.push('👑 Boss')
          const dice = view.dice[s.id] || [null, null, null, null, null]
          const isYou = s.id === YOU
          const tres = phase.kind === 'tresAway' && phase.hands[s.id]
          return (
            <Seat
              key={s.id}
              name={s.name}
              you={isYou}
              out={s.out}
              active={who === s.id}
              loser={phase.kind === 'roundOver' && phase.loser === s.id}
              badges={badges}
              decision={decisions[s.id]}
              pencils={s.pencils}
              maxPencils={game.rules.pencilsToLose}
            >
              {!s.out && (
                <Hand
                  dice={dice}
                  game={call ? call.game : null}
                  variant={call?.variant}
                  rollIds={rollIds[s.id]}
                  putOut={tres ? tres.out : undefined}
                  kept={isYou && canKeep ? keep : undefined}
                  onToggleKeep={isYou && canKeep ? toggleKeep : undefined}
                />
              )}
            </Seat>
          )
        })}
      </div>

      {/* Your move */}
      <Panel tone={mine ? 'tool' : 'default'} as="div" aria-live="polite">
        <h2 className="mb-2 text-xl font-semibold">{title}</h2>
        <div className="space-y-2 text-sm leading-relaxed">{body}</div>
        {hint && (
          <p className="mt-3 flex items-start gap-2 rounded-md bg-muted/70 p-2 text-sm">
            <Lightbulb aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-odds-coin" />
            <span>
              <strong>A solid player would:</strong> {hint}
            </span>
          </p>
        )}
        {error && (
          <p className="mt-3 rounded-md border border-destructive/40 bg-destructive/10 p-2 text-sm">{error}</p>
        )}
        {controls && <div className="mt-4">{controls}</div>}
        {labLink && (
          <a
            href={withPrefix(labLink)}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
          >
            <FlaskConical aria-hidden className="h-4 w-4" /> Not sure? See the exact odds in the Odds Lab
            <span className="sr-only">(opens in a new tab)</span>
          </a>
        )}
      </Panel>

      {/* This round, in words */}
      <Panel title="This round" tone="note" as="section">
        <ol className="space-y-1 text-sm">
          {roundEvents.slice(-12).map((t, i) => (
            <li key={i} className="text-muted-foreground last:font-medium last:text-foreground">
              {t}
            </li>
          ))}
        </ol>
      </Panel>

      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
        <DiceSettings />
        <button type="button" onClick={() => setGame(null)} className="underline-offset-2 hover:underline">
          Leave the table
        </button>
      </div>
    </div>
  )
}
