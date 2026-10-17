import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { withPrefix } from 'gatsby'
import { ChevronDown, FlaskConical, Lightbulb } from 'lucide-react'
import {
  applyAction,
  bossHand,
  bottomHands,
  bottomTarget,
  evaluateKickerHand,
  isKickerGame,
  keepsKickers,
  rankBest,
  razzleScore,
  refusalSeats,
  standings,
  tresAwayMaxPutOut,
  tresAwayScore,
  viewFor,
  wouldLoseIfStopped,
} from '../../engine'
import { ALL_CALLS, botAction, callScore } from '../../strategy'
import { formatCallLabel, GAMES_MAP } from '../../lib/games-config'
import { cn } from '../../lib/utils'
import { Button } from '../ui/button'
import { Switch } from '../ui/switch'
import { Label } from '../ui/label'
import {
  BOSS_NAMES,
  DiceSettings,
  Die,
  Hand,
  RollButton,
  playRollSound,
  razzleName,
  useDicePrefs,
} from '../Dice'
import { Panel } from '../Page'
import Seat from '../Table/Seat'
import TableFelt from '../Table/TableFelt'
import Standings from '../Table/Standings'
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

/** A hand in words: "three 2s", "a kicker of 9", "no 10-3", "a score of 7", "a full house" */
function handText(dice, call) {
  if (call.game === 'tres-away') return `a score of ${tresAwayScore(dice)}`
  if (call.game === 'boss') {
    const name = BOSS_NAMES[bossHand(dice).category]
    return /^(two|three|four|five)/.test(name) ? name : `a ${name}`
  }
  if (call.game === 'razzle') {
    const { count, face } = razzleScore(dice)
    return razzleName(count, face)
  }
  const hand = evaluateKickerHand(dice, call.game, call.variant)
  return hand.made ? `a kicker of ${hand.kickerTotal}` : `no ${GAMES_MAP[call.game]?.name || call.game}`
}

/** What a suggested action means, in words */
function hintText(action, dice, phase) {
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
      return phase.kind === 'play' ? 'Take the tie: stand and replay.' : 'Stand: stop rolling.'
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

/** "Roll to beat Ava’s three 6s", or "Roll to make 10-3" when the hand to beat missed the game */
function beatText(dice, whose, call, lead) {
  const text = handText(dice, call)
  return text.startsWith('no ') ? `${lead} make ${text.slice(3)}` : `${lead} beat ${whose} ${text}`
}

const list = (xs) => (xs.length < 2 ? xs.join('') : `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`)

/** This round in words, the latest last */
function RoundLog({ events }) {
  return (
    <ol className="space-y-1 text-sm">
      {events.slice(-12).map((t, i) => (
        <li key={i} className="text-muted-foreground last:font-medium last:text-foreground">
          {t}
        </li>
      ))}
    </ol>
  )
}

/** The piddle, ranked: everyone's die, then any roll-off for the highest, then who holds the Hammer */
function Piddle({ rounds, names, hammer, onComeOut }) {
  return (
    <Panel tone="tool" title="The piddle" description="Everyone rolls one die. Highest holds the Hammer; a tie for the highest rolls again.">
      <div className="space-y-4">
        {rounds.map((round, i) => {
          const last = i === rounds.length - 1
          const high = Math.max(...round.map((r) => r.die))
          const prev = i > 0 ? rounds[i - 1] : null
          const prevHigh = prev && Math.max(...prev.map((r) => r.die))
          return (
            <div key={i}>
              {prev && (
                <p className="mb-2 text-sm font-semibold">
                  Roll-off: {list(round.map((r) => names[r.player]))} tied on {prevHigh}
                </p>
              )}
              <Standings
                label={i === 0 ? 'Piddle rolls' : `Roll-off ${i}`}
                rows={rankBest(round, (a, b) => a.die - b.die).map(({ id: r, rank }) => ({
                  id: r.player,
                  name: names[r.player],
                  you: r.player === YOU,
                  rank,
                  aside: <Die value={r.die} size="md" rollId={1} label={`rolled ${r.die}`} />,
                  status: last && r.player === hammer ? 'hammer' : !last && r.die === high ? 'again' : undefined,
                }))}
              />
            </div>
          )
        })}
        <p className="font-medium">
          {hammer === YOU ? 'You rolled highest and hold the Hammer.' : `${names[hammer]} rolled highest and holds the Hammer.`}
        </p>
        <p className="text-sm text-muted-foreground">
          {hammer === YOU ? 'Say “coming out” and everyone rolls.' : `${names[hammer]} says “coming out” and everyone rolls.`}
        </p>
        <RollButton onClick={onComeOut}>{hammer === YOU ? 'Come out' : 'Roll your dice'}</RollButton>
      </div>
    </Panel>
  )
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
  // The piddle's ranking shows before the first deal
  const [dealt, setDealt] = useState(false)
  const [prefs] = useDicePrefs()
  const prev = useRef(null)

  const start = (bots) => {
    const g = newTable(bots, Math.floor(Math.random() * 2 ** 31))
    setRollIds(Object.fromEntries(g.seats.map((s) => [s.id, ZERO.map(() => 1)])))
    setGame(g)
    setDealt(!g.log.some((e) => e.type === 'piddle'))
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
      // Your selection is spent once you act (Tres Away keeps it your turn across put-out and roll)
      if (action.player === YOU) setKeep([])
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
    if (!game || !dealt || !who || who === YOU) return undefined
    const t = setTimeout(() => act(botAction(game)), BOT_DELAY)
    return () => clearTimeout(t)
  }, [game, dealt, who, act])

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
  if (!dealt) {
    const piddle = game.log.find((e) => e.type === 'piddle')
    return (
      <Piddle
        rounds={piddle.rounds}
        names={names}
        hammer={game.hammer}
        onComeOut={() => {
          setDealt(true)
          setRollIds((ids) => Object.fromEntries(Object.entries(ids).map(([id, r]) => [id, r.map((n) => n + 1)])))
          if (prefs.sound) playRollSound(5)
        }}
      />
    )
  }
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
    if (e.type === 'stood') decisions[e.player] = phase.kind === 'play' ? 'Took the tie' : 'Done'
    if (e.type === 'cycle') e.players.forEach((id) => (decisions[id] = 'Replaying'))
  })
  // Played from the bottom: the worst hand rolls until it climbs off or runs out of rolls
  const bottom = bottomHands(game)
  if (phase.kind === 'play')
    Object.entries(phase.rolling).forEach(([id, r]) => {
      if (r.done && decisions[id] !== 'Took the tie') decisions[id] = 'All day'
    })

  // The table ranked, best first: who's at the bottom, who's all day, who's in the cup
  const table = standings(game)
  const safe = table.filter((st) => st.status === 'safe').map((st) => st.player)
  const standingDetail = (st) => {
    const dice = game.dice[st.player]
    if (st.rank == null) return 'Safe from the first cycle'
    if (phase.kind === 'roundOver') return handText(dice, call)
    if (phase.kind === 'tresAway') {
      const h = phase.hands[st.player]
      const score = tresAwayScore(h.out.map((i) => dice[i]))
      return st.allDay ? `A score of ${score}: all out` : `${score} so far, ${h.out.length} of 5 out`
    }
    if (phase.kind === 'boss') {
      if (st.boss) return st.player === YOU ? `${handText(dice, call)}, hidden from the others` : 'Hand hidden until the end'
      return `${handText(dice, call)} · ${st.allDay ? 'final' : 'one last roll to come'}`
    }
    const rolls = decisions[st.player] === 'Took the tie'
      ? 'took the tie'
      : st.allDay
        ? 'all day'
        : `${st.rollsLeft} ${st.rollsLeft === 1 ? 'roll' : 'rolls'} left`
    return `${handText(dice, call)} · ${rolls}`
  }
  const capital = (t) => t.charAt(0).toUpperCase() + t.slice(1)
  const standingRows = table.map((st) => ({
    id: st.player,
    name: names[st.player],
    you: st.player === YOU,
    rank: st.rank,
    detail: capital(standingDetail(st)),
    status: st.boss ? 'boss' : phase.kind === 'roundOver' && st.status === 'bottom' ? 'pencil' : st.status === 'live' ? undefined : st.status,
  }))

  const toggleKeep = (i) => {
    if (phase.kind === 'boss' && phase.stage === 'bossRoll' && phase.mustKeep.includes(i)) return
    // Dice already put out in Tres Away are final
    if (phase.kind === 'tresAway' && phase.hands[YOU].out.includes(i)) return
    setKeep((k) => {
      if (k.includes(i)) return k.filter((x) => x !== i)
      // Tres Away: only the caller may put out past the caller's count; a new pick replaces the oldest
      if (phase.kind === 'tresAway') {
        const most = tresAwayMaxPutOut(phase, YOU)
        if (k.length >= most) return [...k.slice(k.length - most + 1), i]
      }
      return [...k, i]
    })
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
    body = (
      <p>
        {loser ? `${loser === YOU ? 'You hold' : `${names[loser]} holds`} the Hammer next.` : 'The Hammer passes left.'}{' '}
        {game.hammer === YOU
          ? 'When everyone’s ready, say “coming out” and everyone rolls.'
          : `When everyone’s ready, ${names[game.hammer]} says “coming out” and everyone rolls.`}
      </p>
    )
    // Only the Hammer comes out; everyone else just rolls
    controls = (
      <RollButton onClick={() => act({ type: 'nextRound' })}>
        {game.hammer === YOU ? 'Come out' : 'Roll your dice'}
      </RollButton>
    )
  } else if (!mine) {
    title = meOut ? 'You’re out: watching the bots' : `${names[who]} is thinking…`
    if (phase.kind === 'play') {
      const target = bottomTarget(game, who)
      title = `${names[who]} has the worst hand and rolls`
      body = (
        <p className="text-muted-foreground">
          {beatText(game.dice[target], target === YOU ? 'your' : `${names[target]}’s`, call, 'They need to')}.
          If they run out of rolls at the bottom, they take the pencil{phase.rolling[YOU] && !bottom.includes(YOU) ? ' and you never have to roll' : ''}.
        </p>
      )
    } else {
      body = <p className="text-muted-foreground">{phase.kind === 'call' ? 'The Hammer looks at their dice.' : 'Watch the table.'}</p>
    }
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
    const must = wouldLoseIfStopped(game, YOU)
    const target = bottomTarget(game, YOU)
    const targetDice = game.dice[target]
    const tied = bottom.filter((id) => id !== YOU)
    title = `You have the worst hand: ${left} ${left === 1 ? 'roll' : 'rolls'} left`
    body = (
      <>
        <p>
          {must ? (
            <>
              {beatText(targetDice, `${names[target]}’s`, call, 'Roll to')}. Climb off the bottom
              and your turn ends; still there when your rolls run out, and you take the pencil.
            </>
          ) : (
            <>
              You’re tied with {tied.map((id) => names[id]).join(' and ')}, who {tied.length === 1 ? 'is' : 'are'} out of
              rolls. Take the tie and you replay, or roll to beat it.
            </>
          )}
        </p>
        <p className="text-muted-foreground">
          Tap dice to keep them, then roll the rest.
          {kicker && hand?.made && ' You’ve made the game: the kicker is rolled whole, so keep just the game dice.'}
        </p>
      </>
    )
    controls = (
      <div className="flex flex-wrap items-center gap-2">
        <RollButton disabled={keep.length === 5 || badKeep} onClick={() => act({ type: 'reroll', player: YOU, keep })}>
          Roll {5 - keep.length}
        </RollButton>
        {!must && <Button variant="outline" onClick={() => act({ type: 'stand', player: YOU })}>Take the tie</Button>}
        {badKeep && <span className="text-sm text-destructive">Keep only the game dice: the kicker is rolled whole.</span>}
      </div>
    )
    // The Odds Lab: your exact keep options for beating that hand
    let goal = ''
    if (call.game === 'razzle') {
      const { count, face } = razzleScore(targetDice)
      goal = `&count=${count}&face=${face}`
    } else {
      const theirs = evaluateKickerHand(targetDice, call.game, call.variant)
      goal = theirs.made ? `&goal=kicker&variant=${call.variant}&total=${theirs.kickerTotal}` : '&goal=make'
    }
    labLink = `/odds-lab/?tab=keep&game=${call.game}&roll=${myDice.join('')}&rolls=${left}${goal}`
  } else if (phase.kind === 'tresAway') {
    const h = phase.hands[YOU]
    const most = tresAwayMaxPutOut(phase, YOU)
    const caller = phase.pacer === YOU
    const callerOut = phase.hands[phase.pacer].out.length
    title = h.fresh ? 'Put out at least one die' : 'Put out from your hand, or roll it'
    body = (
      <p>
        Lowest total wins; 3s count 0. Put-out dice are final and everyone sees them.{' '}
        {caller
          ? 'You called it, so you set the pace: put out as many as you like, and everyone else catches up to your count.'
          : `${names[phase.pacer]} has ${callerOut} ${callerOut === 1 ? 'die' : 'dice'} out, so you can put out ${most === 1 ? '1 more' : `up to ${most} more`}.`}
        {!h.fresh && ' The dice in your hand can go out as they are, or you can roll them all.'}
      </p>
    )
    controls = (
      <div className="flex flex-wrap gap-2">
        <Button disabled={!keep.length} onClick={() => act({ type: 'putOut', player: YOU, dice: keep })}>
          Put out {keep.length || ''} {keep.length === 1 ? 'die' : 'dice'}
        </Button>
        {!h.fresh && (
          <RollButton onClick={() => act({ type: 'roll', player: YOU })}>Roll {5 - h.out.length}</RollButton>
        )}
      </div>
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
      (phase.kind === 'tresAway') ||
      (phase.kind === 'boss' && phase.stage !== 'decide'))
  const hint = hints && suggestion ? hintText(suggestion, myDice, phase) : null

  // Seats top to bottom from this round's Hammer, going left: the Hammer, 1st refusal, 2nd refusal, ...
  // (once the round is over, game.hammer already holds the next Hammer, so keep this round's order)
  const lastCall = phase.kind === 'roundOver' ? game.log.slice(roundStart).findLast((e) => e.type === 'called') : null
  const topSeat = lastCall ? lastCall.player : game.hammer
  const from = Math.max(0, game.seats.findIndex((s) => s.id === topSeat))
  const seatOrder = [...game.seats.slice(from), ...game.seats.slice(0, from)]

  // Your move sits in your seat; anyone else's shows as the acting seat's status
  const moveInSeat = Boolean(controls) && !meOut
  // A finished Tres Away round: every die is out
  const roundOverTres = phase.kind === 'roundOver' && call?.game === 'tres-away'
  const move = (
    <div className="mt-3 border-t pt-3" aria-live="polite">
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="mt-1 space-y-2 text-sm leading-relaxed text-muted-foreground">{body}</div>
      {error && (
        <p className="mt-3 rounded-md border border-destructive/40 bg-destructive/10 p-2 text-sm">{error}</p>
      )}
      {controls && <div className="mt-3">{controls}</div>}
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
    </div>
  )
  const status = (
    <div aria-live="polite">
      <h2 className="text-sm font-semibold text-foreground">{title}</h2>
      {body && <div className="mt-0.5 space-y-1">{body}</div>}
    </div>
  )

  // Collapsed standings (phones): just the worst hand
  const worstRows = standingRows.filter((r) => ['bottom', 'tied', 'pencil'].includes(r.status))
  const worstLine = worstRows.length
    ? `${worstRows[0].status === 'pencil' ? 'Pencil' : worstRows.length > 1 ? 'Tied worst' : 'Worst hand'}: ${worstRows
        .map((r) => `${r.name}, ${r.detail.charAt(0).toLowerCase()}${r.detail.slice(1)}`)
        .join('; ')}`
    : 'Standings'
  const standingsNote =
    phase.kind === 'roundOver'
      ? 'How the round finished.'
      : 'Best hand first. Anyone above a hand that’s all day is in the cup: they can’t lose this round.'

  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_19rem] lg:gap-6">
        {/* Standings and advice: beside the players on wide screens, above them (collapsed) on phones */}
        <aside className="space-y-4 lg:col-start-2 lg:row-start-1">
          {standingRows.length > 0 && (
            <>
              <details className="group rounded-xl border bg-card shadow-sm lg:hidden">
                <summary className="flex cursor-pointer list-none items-center gap-2 p-3 text-sm [&::-webkit-details-marker]:hidden">
                  <span className="min-w-0 flex-1 font-medium">{worstLine}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">All standings</span>
                  <ChevronDown aria-hidden className="h-4 w-4 shrink-0 transition-transform group-open:rotate-180" />
                </summary>
                <div className="px-3 pb-3">
                  <p className="mb-2 text-xs text-muted-foreground">{standingsNote}</p>
                  <Standings rows={standingRows} label="Standings this round" />
                </div>
              </details>
              <Panel title="Standings" description={standingsNote} className="hidden lg:block">
                <Standings rows={standingRows} label="Standings this round" />
              </Panel>
            </>
          )}
          {hint && (
            <p className="flex items-start gap-2 rounded-xl border bg-card p-3 text-sm shadow-sm">
              <Lightbulb aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-odds-coin" />
              <span>
                <strong>A solid player would:</strong> {hint}
              </span>
            </p>
          )}
          {/* This round, in words */}
          <Panel title="This round" tone="note" as="section" className="hidden lg:block">
            <RoundLog events={roundEvents} />
          </Panel>
        </aside>

        {/* The table: the round and the players, Hammer first, on the felt */}
        <TableFelt className="space-y-3 lg:col-start-1 lg:row-start-1">
          <div className="flex flex-wrap items-center justify-between gap-3 text-felt-foreground">
            <div className="font-display text-lg font-bold">
              Round {game.round}
              {call && <span className="font-normal"> · {label(call)}</span>}
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Switch id="hints" checked={hints} onCheckedChange={setHints} />
              <Label htmlFor="hints" className="text-felt-foreground">Hints</Label>
            </div>
          </div>

          <div className="space-y-3">
            {seatOrder.map((s) => {
              const badges = []
              if (phase.kind !== 'gameOver') {
                if (s.id === game.hammer) badges.push(phase.kind === 'roundOver' ? '🔨 Next Hammer' : '🔨 Hammer')
                // Refusal seats matter until play starts; then the decision badge says what they did
                if (['call', 'refusal', 'secondCall'].includes(phase.kind)) {
                  if (s.id === seats.first) badges.push('1st refusal')
                  if (s.id === seats.second) badges.push('2nd refusal')
                }
              }
              if (phase.kind === 'boss' && phase.boss === s.id) badges.push('👑 Boss')
              if (bottom.includes(s.id)) badges.push(bottom.length > 1 ? 'Tied worst' : 'Worst hand')
              if (safe.includes(s.id) && phase.kind !== 'roundOver') badges.push('In the cup')
              const dice = view.dice[s.id] || [null, null, null, null, null]
              const isYou = s.id === YOU
              const tres = phase.kind === 'tresAway' && phase.hands[s.id]
              const showsStatus = !moveInSeat && title && (who ? who === s.id : isYou)
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
                  status={showsStatus ? status : undefined}
                >
                  {!s.out && (
                    <Hand
                      dice={dice}
                      game={call ? call.game : null}
                      variant={call?.variant}
                      rollIds={rollIds[s.id]}
                      putOut={tres ? tres.out : roundOverTres ? [0, 1, 2, 3, 4] : undefined}
                      kept={isYou && canKeep ? keep : undefined}
                      locked={
                        isYou && tres
                          ? tres.out
                          : isYou && phase.kind === 'boss' && phase.stage === 'bossRoll' && phase.boss === YOU
                            ? phase.mustKeep
                            : undefined
                      }
                      onToggleKeep={isYou && canKeep ? toggleKeep : undefined}
                    />
                  )}
                  {isYou && moveInSeat && move}
                </Seat>
              )
            })}
          </div>
          {/* Out of the game: the table's actions sit under the players */}
          {controls && meOut && <div className="rounded-xl border bg-card p-3 shadow-sm">{move}</div>}
        </TableFelt>
      </div>

      {/* This round, in words (phones: under the table) */}
      <Panel title="This round" tone="note" as="section" className="lg:hidden">
        <RoundLog events={roundEvents} />
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
