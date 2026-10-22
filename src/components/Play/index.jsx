import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { withPrefix } from 'gatsby'
import { ChevronDown, FlaskConical, Pause, Play as Resume, SkipForward } from 'lucide-react'
import {
  applyAction,
  bossHand,
  bottomHands,
  bottomTarget,
  bossKeepProblem,
  evaluateKickerHand,
  keptAt,
  isKickerGame,
  keepProblem,
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
import HintCard from './HintCard'
import { hintStats } from './hint-stats'
import { useHouseRules } from '../Settings/house-rules'
import Standings from '../Table/Standings'
import {
  BOT_NAMES,
  PACES,
  YOU,
  actor,
  callAllowed,
  describeEvent,
  latestMoves,
  newTable,
  opponentOrder,
  paceAfter,
  rolledPositions,
} from './play-model'

/**
 * Play full games of Refusal against solid bots (src/strategy/bots.ts), on
 * the real engine. You pick the table size; the bots take their turns at a
 * pace you choose, each move held long enough to read (paceAfter), and you
 * can pause and step through them. Every seat shows its latest move, and
 * the newest is announced above the table. Your seat stays at the bottom
 * with your controls, docked within thumb reach on phones. Hints show what
 * a solid player would do, and the Odds Lab link opens your exact situation.
 */
const ZERO = [0, 0, 0, 0, 0]
const label = (call) => formatCallLabel(call)

/** What you may keep before the game is made (docs/RULES.md §3.1) */
const KEEP_TIPS = {
  '10-2': 'Make 10-2 in one roll: roll all five until you have it.',
  '10-3': 'Make 10-3 in one roll: roll all five until you have it.',
  '10-4': 'Make 10-4 in one roll: roll all five until you have it.',
  'ship-captain-crew': 'Keep 1-2 or 5-6 (pick one), or roll all five.',
  monterey: 'Keep 2-3, 3-4 or 4-5, or roll all five.',
  vegas: 'Keep a pair that sums to 7 or 11, or roll all five.',
  pairs: 'Keep a pair, or roll all five.',
}

/** A hand in words: "three 2s", "a kicker of 9", "no 10-3", "a score of 7", "a full house". `kept`: positions committed in a kicker game */
function handText(dice, call, kept = []) {
  if (call.game === 'tres-away') return `a score of ${tresAwayScore(dice)}`
  if (call.game === 'boss') {
    const name = BOSS_NAMES[bossHand(dice).category]
    return /^(two|three|four|five)/.test(name) ? name : `a ${name}`
  }
  if (call.game === 'razzle') {
    const { count, face } = razzleScore(dice)
    return razzleName(count, face)
  }
  const hand = evaluateKickerHand(dice, call.game, call.variant, kept)
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
        ? `Keep ${action.keep.map((i) => dice[i]).sort((a, b) => a - b).join('-')} and roll ${5 - action.keep.length}.`
        : 'Roll all five.'
    case 'stand':
      return phase.kind === 'play' ? 'Take the tie: stand and replay.' : 'Stand: stop rolling.'
    case 'putOut':
      // Lowest-scoring first (3s count 0), matching the hint's options
      return `Put out ${action.dice
        .map((i) => dice[i])
        .sort((a, b) => tresAwayScore([a]) - tresAwayScore([b]))
        .join(' ')}.`
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
function beatText(dice, whose, call, lead, kept) {
  const text = handText(dice, call, kept)
  return text.startsWith('no ') ? `${lead} make ${text.slice(3)}` : `${lead} beat ${whose} ${text}`
}

const list = (xs) => (xs.length < 2 ? xs.join('') : `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`)

/**
 * The button that starts a round, named for your place in it: the Hammer
 * rolls a new hand; the refusals roll knowing their seat; anyone else rolls
 * for the call still to come.
 */
function comeOutLabel(game) {
  if (game.seats.find((s) => s.id === YOU).out) return 'Next round'
  if (game.hammer === YOU) return 'Roll new hand'
  const { first, second } = refusalSeats(game)
  if (first === YOU) return 'Roll 1st refusal'
  if (second === YOU) return 'Roll 2nd refusal'
  return 'Roll for …'
}

/** This round in words, the latest last; the round before a tap away */
function RoundLog({ events, previous }) {
  return (
    <div className="space-y-3">
      {events.length ? (
        <ol className="max-h-72 space-y-1 overflow-y-auto text-sm">
          {events.map((t, i) => (
            <li key={i} className="text-muted-foreground last:font-medium last:text-foreground">
              {t}
            </li>
          ))}
        </ol>
      ) : (
        <p className="text-sm text-muted-foreground">Fresh dice. Nothing called yet.</p>
      )}
      {previous?.length > 0 && (
        <details className="group text-sm">
          <summary className="flex cursor-pointer list-none items-center gap-1 font-medium text-foreground [&::-webkit-details-marker]:hidden">
            <ChevronDown aria-hidden className="h-4 w-4 -rotate-90 transition-transform group-open:rotate-0" />
            Last round
          </summary>
          <ol className="mt-1.5 max-h-72 space-y-1 overflow-y-auto text-muted-foreground">
            {previous.map((t, i) => (
              <li key={i}>{t}</li>
            ))}
          </ol>
        </details>
      )}
    </div>
  )
}

/** The piddle, ranked: everyone's die, then any roll-off for the highest, then who holds the Hammer */
function Piddle({ rounds, names, hammer, cta, onComeOut }) {
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
        <RollButton onClick={onComeOut}>{cta}</RollButton>
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

/** Your dice already kept at the start of your move: the Boss's hand, or a kicker game's committed keep */
function startingKeep(g) {
  const ph = g.phase
  if (ph.kind === 'boss' && ph.stage === 'bossRoll' && ph.boss === YOU) return [...ph.bossDice]
  if (ph.kind === 'play' && isKickerGame(ph.call.game) && ph.rolling[YOU]) {
    // Once you've made the game, its dice can't be re-rolled
    const hand = evaluateKickerHand(g.dice[YOU], ph.call.game, ph.call.variant, ph.rolling[YOU].kept)
    return hand.made ? [...hand.gameDice] : [...ph.rolling[YOU].kept]
  }
  return []
}

/** How fast the bots play, remembered with the dice settings */
function PacePicker({ pace, onChange }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="font-medium" id="bot-pace">
        Bot speed
      </span>
      <div role="radiogroup" aria-labelledby="bot-pace" className="inline-flex rounded-full border bg-background p-0.5">
        {PACES.map((p) => (
          <button
            key={p.id}
            type="button"
            role="radio"
            aria-checked={pace === p.id}
            onClick={() => onChange(p.id)}
            className={cn(
              'min-h-9 rounded-full px-3 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              pace === p.id ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  )
}

export default function Play({ intro }) {
  const [game, setGame] = useState(null)
  const [rollIds, setRollIds] = useState({})
  const [keep, setKeep] = useState([])
  const [error, setError] = useState(null)
  const [hints, setHints] = useState(true)
  const [roundStart, setRoundStart] = useState(0)
  // The round before this one, [from, to) in the log, to look back at
  const [lastRound, setLastRound] = useState(null)
  const [paused, setPaused] = useState(false)
  const roundStartRef = useRef(0)
  roundStartRef.current = roundStart
  // The piddle's ranking shows before the first deal
  const [dealt, setDealt] = useState(false)
  const [prefs, updatePrefs] = useDicePrefs()
  const [tableRules] = useHouseRules()
  const prev = useRef(null)

  const start = (bots) => {
    const g = newTable(bots, Math.floor(Math.random() * 2 ** 31), tableRules)
    setRollIds(Object.fromEntries(g.seats.map((s) => [s.id, ZERO.map(() => 1)])))
    setGame(g)
    setDealt(!g.log.some((e) => e.type === 'piddle'))
    setRoundStart(0)
    setLastRound(null)
    setPaused(false)
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
      if (action.player === YOU) setKeep(next.phase.kind === 'tresAway' ? [] : startingKeep(next))
      const rolled = rolledPositions(next.log.slice(g.log.length))
      // A new deal (next round, or a bark) re-rolls everyone
      if (next.round !== g.round) {
        next.seats.filter((s) => !s.out).forEach((s) => (rolled[s.id] = [0, 1, 2, 3, 4]))
        setLastRound([roundStartRef.current, next.log.length])
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

  // Bots move on their own, each move held long enough to read (unless paused)
  const lastEvent = game && game.log.length > roundStart ? game.log[game.log.length - 1] : null
  useEffect(() => {
    if (!game || !dealt || !who || who === YOU || paused) return undefined
    const t = setTimeout(() => act(botAction(game)), paceAfter(lastEvent, prefs.pace))
    return () => clearTimeout(t)
  }, [game, dealt, who, act, paused, lastEvent, prefs.pace])

  // A fresh keep selection whenever it becomes your move
  useEffect(() => {
    if (!game) return
    const key = `${game.round}:${game.phase.kind}:${who}`
    if (prev.current === key) return
    prev.current = key
    setKeep(startingKeep(game))
  }, [game, who])

  const view = useMemo(() => (game ? viewFor(game, YOU) : null), [game])
  const suggestion = useMemo(() => (game && who === YOU ? botAction(game) : null), [game, who])

  if (!game)
    return (
      <>
        {intro}
        <Setup onStart={start} />
      </>
    )

  const names = Object.fromEntries(game.seats.map((s) => [s.id, s.name]))
  if (!dealt) {
    const piddle = game.log.find((e) => e.type === 'piddle')
    return (
      <>
        {intro}
        <Piddle
        rounds={piddle.rounds}
        names={names}
        hammer={game.hammer}
        cta={comeOutLabel(game)}
        onComeOut={() => {
          setDealt(true)
          setRollIds((ids) => Object.fromEntries(Object.entries(ids).map(([id, r]) => [id, r.map((n) => n + 1)])))
          if (prefs.sound) playRollSound(5)
        }}
      />
      </>
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
    if (phase.kind === 'roundOver') return handText(dice, call, keptAt(game, st.player))
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
    return `${handText(dice, call, keptAt(game, st.player))} · ${rolls}`
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
    // Kicker games: dice kept last roll stay kept
    if (phase.kind === 'play' && isKickerGame(phase.call.game) && phase.rolling[YOU]?.kept.includes(i)) return
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
        {comeOutLabel(game)}
      </RollButton>
    )
  } else if (!mine) {
    title = meOut ? 'You’re out: watching the bots' : `${names[who]} is thinking…`
    if (phase.kind === 'play') {
      const target = bottomTarget(game, who)
      title = `${names[who]} has the worst hand and rolls`
      body = (
        <p className="text-muted-foreground">
          {beatText(game.dice[target], target === YOU ? 'your' : `${names[target]}’s`, call, 'They need to', keptAt(game, target))}.
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
      // Phones: the title says enough for a first call, leaving room for the choices
      <p className={second ? undefined : 'hidden sm:block'}>
        {second
          ? `It must be a different game from ${label(phase.refused)}, and nobody can refuse it.`
          : 'Pick the game your dice play best. Your dice are hidden from everyone else until play starts.'}
      </p>
    )
    // Lead with the calls these dice suit best; the rest are a tap away (fewer choices, faster decisions)
    const ranked = ALL_CALLS.filter((c) => callAllowed(game, c)).sort((a, b) => callScore(myDice, b, game.rules) - callScore(myDice, a, game.rules))
    const callButton = (c) => {
      const suggested = hints && suggestion?.type === 'call' && suggestion.call.game === c.game && suggestion.call.variant === c.variant
      return (
        <li key={`${c.game}-${c.variant || ''}`}>
          <button
            type="button"
            onClick={() => act({ type: 'call', player: YOU, call: c })}
            className={cn(
              'flex min-h-11 w-full flex-col items-start gap-1 rounded-lg border bg-background p-2 text-left text-sm transition-colors sm:flex-row sm:items-center sm:justify-between sm:gap-2 hover:border-primary hover:bg-primary/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
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
        <ul className="grid grid-cols-2 gap-2">{ranked.slice(0, 4).map(callButton)}</ul>
        <details className="group rounded-lg border bg-background/60">
          <summary className="cursor-pointer select-none rounded-lg p-2 text-sm font-medium hover:bg-accent">
            Other calls ({ranked.length - 4})
          </summary>
          <ul className="grid grid-cols-2 gap-2 p-2">{ranked.slice(4).map(callButton)}</ul>
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
    const hand = kicker ? evaluateKickerHand(myDice, call.game, call.variant, r.kept) : null
    const badKeep = kicker
      ? keepProblem(keep.map((i) => myDice[i]), call.game, {
          locked: r.kept.map((i) => myDice[i]),
          hand: myDice,
          rules: game.rules,
        })
      : null
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
              {beatText(targetDice, `${names[target]}’s`, call, 'Roll to', keptAt(game, target))}. Climb off the bottom
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
          {kicker
            ? hand?.made
              ? 'You’ve made the game: keep just the game dice and roll the kicker whole, or stand.'
              : call.game === 'monterey' && game.rules.montereyLoneKeep
                ? 'Keep 2-3, 3-4, 4-5, or a lone 3 or 4, or roll all five.'
                : KEEP_TIPS[call.game]
            : 'Tap dice to keep them, then roll the rest.'}
          {kicker && r.kept.length > 0 && ' Dice you kept stay kept.'}
        </p>
      </>
    )
    controls = (
      <div className="flex flex-wrap items-center gap-2">
        <RollButton disabled={keep.length === 5 || Boolean(badKeep)} onClick={() => act({ type: 'reroll', player: YOU, keep })}>
          Roll {5 - keep.length}
        </RollButton>
        {!must && <Button variant="outline" onClick={() => act({ type: 'stand', player: YOU })}>Take the tie</Button>}
        {badKeep && <span className="text-sm text-destructive">{badKeep}.</span>}
      </div>
    )
    // The Odds Lab: your exact keep options for beating that hand
    let goal = ''
    if (call.game === 'razzle') {
      const { count, face } = razzleScore(targetDice)
      goal = `&count=${count}&face=${face}`
    } else {
      const theirs = evaluateKickerHand(targetDice, call.game, call.variant, keptAt(game, target))
      goal = theirs.made ? `&goal=kicker&variant=${call.variant}&total=${theirs.kickerTotal}` : '&goal=make'
    }
    const keptDigits = kicker ? r.kept.map((i) => myDice[i]).sort((a, b) => a - b).join('') : ''
    labLink = `/odds-lab/?tab=keep&game=${call.game}&roll=${myDice.join('')}&rolls=${left}${goal}${keptDigits ? `&kept=${keptDigits}` : ''}`
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
      body = (
        <p>
          Pick up any dice and roll them for a better hand, or stand. What you keep has to still beat everyone else’s
          hand: you can’t pick up dice that would make someone else the Boss.
        </p>
      )
      const others = phase.players.filter((id) => id !== YOU).map((id) => game.dice[id])
      const badBossKeep = bossKeepProblem(keep.map((i) => myDice[i]), others)
      controls = (
        <div className="flex flex-wrap items-center gap-2">
          <RollButton disabled={keep.length === 5 || Boolean(badBossKeep)} onClick={() => act({ type: 'reroll', player: YOU, keep })}>Roll {5 - keep.length}</RollButton>
          <Button variant="outline" onClick={() => act({ type: 'stand', player: YOU })}>Stand</Button>
          {badBossKeep && keep.length < 5 && <span className="text-sm text-destructive">{badBossKeep}.</span>}
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
  const hintDetail = hint
    ? hintStats(game, YOU, suggestion, {
        call: label,
        player: (id) => names[id],
        hand: (dice) => handText(dice, call),
      })
    : null

  // Seats stay put: the others in table order from your left, your seat at the bottom with your controls
  const others = opponentOrder(game.seats)
  const you = game.seats.find((s) => s.id === YOU)

  // Each seat's latest move this round; the newest stands out
  const roundLog = game.log.slice(roundStart)
  const moves = latestMoves(roundLog, label)
  const newest = Math.max(-1, ...Object.values(moves).map((m) => m.at))
  // The newest event in words, announced above the table
  const latestAt = roundLog.map((e, i) => (describeEvent(e, names, label) ? i : -1)).reduce((a, b) => Math.max(a, b), -1)
  const latest = latestAt >= 0 ? describeEvent(roundLog[latestAt], names, label) : null
  const previousEvents = lastRound
    ? game.log
        .slice(lastRound[0], lastRound[1])
        .map((e) => describeEvent(e, names, label))
        .filter(Boolean)
    : null

  // Your move sits in your seat; anyone else's is announced above the table
  const moveInSeat = Boolean(controls) && !meOut
  // A finished Tres Away round: every die is out
  const roundOverTres = phase.kind === 'roundOver' && call?.game === 'tres-away'
  const botTurn = Boolean(who) && who !== YOU
  const step = () => act(botAction(gameRef.current))

  const move = (
    <div aria-live="polite">
      <h2 className="text-lg font-semibold leading-snug">{title}</h2>
      <div className="mt-1 space-y-2 text-sm leading-relaxed text-muted-foreground">{body}</div>
      {error && (
        <p className="mt-3 rounded-md border border-destructive/40 bg-destructive/10 p-2 text-sm">{error}</p>
      )}
      {/* Phones and tablets: the hint folds into one line above your buttons */}
      {hint && (
        <details className="group mt-3 rounded-lg border bg-background/60 lg:hidden">
          <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 px-2 text-sm [&::-webkit-details-marker]:hidden">
            <span className="min-w-0 flex-1">
              <strong>Hint:</strong> {hint}
            </span>
            <span className="shrink-0 text-xs text-muted-foreground">Why</span>
            <ChevronDown aria-hidden className="h-4 w-4 shrink-0 transition-transform group-open:rotate-180" />
          </summary>
          <HintCard hint={hint} stats={hintDetail} className="m-2 mt-0 border-0 p-0 shadow-none" />
        </details>
      )}
      {labLink && (
        <a
          href={withPrefix(labLink)}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-primary hover:underline"
        >
          <FlaskConical aria-hidden className="h-4 w-4" /> Not sure? See the exact odds in the Odds Lab
          <span className="sr-only">(opens in a new tab)</span>
        </a>
      )}
      {controls && <div className="mt-3">{controls}</div>}
    </div>
  )

  const standingFor = Object.fromEntries(standingRows.map((r) => [r.id, r]))
  const renderSeat = (s, { compact } = {}) => {
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
    const m = moves[s.id]
    return (
      <Seat
        key={s.id}
        name={s.name}
        you={isYou}
        out={s.out}
        compact={compact}
        active={who === s.id}
        loser={phase.kind === 'roundOver' && phase.loser === s.id}
        badges={badges}
        // The seat's latest move already says "Refuses" or "Accepts"
        decision={['Refuses', 'Accepts'].includes(m?.text) ? undefined : decisions[s.id]}
        pencils={s.pencils}
        maxPencils={game.rules.pencilsToLose}
        said={m && !s.out ? { text: m.text, at: m.at, fresh: m.at === newest } : undefined}
        detail={compact && !s.out ? standingFor[s.id]?.detail : undefined}
        className={isYou ? 'max-h-[75vh] overflow-y-auto shadow-lg' : undefined}
      >
        {!s.out && (
          <Hand
            dice={dice}
            game={call ? call.game : null}
            variant={call?.variant}
            size={compact ? 'sm' : 'md'}
            rollIds={rollIds[s.id]}
            committed={call && isKickerGame(call.game) ? keptAt(game, s.id) : undefined}
            putOut={tres ? tres.out : roundOverTres ? [0, 1, 2, 3, 4] : undefined}
            kept={isYou && canKeep ? keep : undefined}
            locked={
              isYou && tres
                ? tres.out
                : isYou && phase.kind === 'play' && isKickerGame(phase.call.game) && phase.rolling[YOU]?.kept.length
                  ? phase.rolling[YOU].kept
                  : undefined
            }
            onToggleKeep={isYou && canKeep ? toggleKeep : undefined}
          />
        )}
        {isYou && moveInSeat && <div className="mt-3 border-t pt-3">{move}</div>}
      </Seat>
    )
  }

  const standingsNote =
    phase.kind === 'roundOver'
      ? 'How the round finished.'
      : 'Best hand first. Anyone above a hand that’s all day is in the cup: they can’t lose this round.'
  const roundLogPanel = (className) => (
    <Panel title="This round" tone="note" as="section" className={className}>
      <RoundLog events={roundEvents} previous={previousEvents} />
    </Panel>
  )

  return (
    <div className="space-y-6">
      <h1 className="sr-only">Play</h1>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_19rem] lg:gap-6">
        {/* Wide screens: standings, the hint and the round's story beside the table */}
        <aside className="hidden space-y-4 lg:col-start-2 lg:row-start-1 lg:block">
          {standingRows.length > 0 && (
            <Panel title="Standings" description={standingsNote}>
              <Standings rows={standingRows} label="Standings this round" />
            </Panel>
          )}
          {hint && <HintCard hint={hint} stats={hintDetail} />}
          {roundLogPanel()}
        </aside>

        {/* The table: what just happened, the others in fixed seats, then you */}
        <TableFelt className="space-y-3 self-start overflow-visible lg:col-start-1 lg:row-start-1">
          <div className="flex items-center justify-between gap-3 text-felt-foreground">
            <div className="font-display text-lg font-bold">
              Round {game.round}
              {call && <span className="font-normal"> · {label(call)}</span>}
            </div>
            {phase.kind !== 'gameOver' && (
              <button
                type="button"
                onClick={() => setPaused((p) => !p)}
                aria-pressed={paused}
                className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-felt-foreground/40 px-3 text-sm font-medium text-felt-foreground transition-colors hover:bg-felt-foreground/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {paused ? <Resume aria-hidden className="h-4 w-4" /> : <Pause aria-hidden className="h-4 w-4" />}
                {paused ? 'Resume' : 'Pause'}
              </button>
            )}
          </div>

          {/* The announcer: the newest move, held until the next one, and whose turn it is */}
          <div className="rounded-xl bg-card/95 p-3 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {latest ? 'Just now' : 'New deal'}
            </p>
            <p key={`${roundStart}:${latestAt}`} className="story-pop mt-0.5 font-medium" aria-live="polite">
              {latest || (game.hammer === YOU ? 'Everyone rolled. You hold the Hammer.' : `Everyone rolled. ${names[game.hammer]} holds the Hammer.`)}
            </p>
            {!moveInSeat && title && (
              <div className="mt-2 border-t pt-2 text-sm">
                <p className="font-semibold">{title}</p>
                {body && <div className="mt-0.5 space-y-1 text-muted-foreground">{body}</div>}
              </div>
            )}
            {paused && botTurn && (
              <div className="mt-2 flex flex-wrap items-center gap-2 border-t pt-2">
                <Button size="sm" onClick={step} className="min-h-11">
                  <SkipForward aria-hidden className="h-4 w-4" /> Next move
                </Button>
                <span className="text-xs text-muted-foreground">Paused: the bots wait for you.</span>
              </div>
            )}
          </div>

          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">{others.map((s) => renderSeat(s, { compact: true }))}</div>

          {/* Your seat, docked to the bottom of the screen while the table scrolls: your dice and buttons in thumb reach */}
          <div className="sticky bottom-2 z-10">
            {renderSeat(you)}
            {/* Out of the game: the table's actions sit in your place */}
            {controls && meOut && <div className="mt-2 rounded-xl border bg-card p-3 shadow-lg">{move}</div>}
          </div>
        </TableFelt>
      </div>

      {/* Phones and tablets: standings and the round's story under the table */}
      <div className="grid gap-4 sm:grid-cols-2 lg:hidden">
        {standingRows.length > 0 && (
          <details className="group rounded-xl border bg-card shadow-sm">
            <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 p-3 text-sm font-semibold [&::-webkit-details-marker]:hidden">
              <span className="flex-1">Standings</span>
              <ChevronDown aria-hidden className="h-4 w-4 shrink-0 transition-transform group-open:rotate-180" />
            </summary>
            <div className="px-3 pb-3">
              <p className="mb-2 text-xs text-muted-foreground">{standingsNote}</p>
              <Standings rows={standingRows} label="Standings this round" />
            </div>
          </details>
        )}
        {roundLogPanel()}
      </div>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-muted-foreground">
        <PacePicker pace={prefs.pace} onChange={(pace) => updatePrefs({ pace })} />
        <div className="flex items-center gap-2">
          <Switch id="hints" checked={hints} onCheckedChange={setHints} />
          <Label htmlFor="hints">Hints</Label>
        </div>
        <DiceSettings />
        <button type="button" onClick={() => setGame(null)} className="ml-auto min-h-11 underline-offset-2 hover:underline">
          Leave the table
        </button>
      </div>
    </div>
  )
}
