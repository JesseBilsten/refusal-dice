import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { withPrefix } from 'gatsby'
import { ChevronDown, FlaskConical } from 'lucide-react'
import {
  applyAction,
  bossHand,
  bottomHands,
  bottomTarget,
  bossKeepProblem,
  compareBoss,
  evaluateKickerHand,
  gameSize,
  isGameSet,
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
import { ALL_CALLS, actors, botActionFor, callScore } from '../../strategy'
import { formatCallLabel, GAMES_MAP } from '../../lib/games-config'
import { cn } from '../../lib/utils'
import { Button } from '../ui/button'
import { Switch } from '../ui/switch'
import { Label } from '../ui/label'
import { BOSS_NAMES, DiceSettings, Die, Hand, RollButton, playRollSound, razzleName, useDicePrefs } from '../Dice'
import { Panel } from '../Page'
import Seat from '../Table/Seat'
import TableFelt from '../Table/TableFelt'
import TableOrder from '../Table/TableOrder'
import DiceCup from '../Table/DiceCup'
import Standings from '../Table/Standings'
import HintCard from './HintCard'
import CallPlacard from './CallPlacard'
import Setup from './Setup'
import { SpeedPicker, Transport } from './TableControls'
import { hintStats } from './hint-stats'
import { useHouseRules } from '../Settings/house-rules'
import { useSimulation } from '../Odds/use-simulation'
import {
  DEFAULT_PACE,
  PACES,
  YOU,
  callAllowed,
  describeEvent,
  holdFor,
  latestMoves,
  newTable,
  paceAfter,
  piddleSteps,
  rolledPositions,
  tableOrder,
} from './play-model'

/**
 * Play full games of Refusal against solid bots (src/strategy/bots.ts), on
 * the real engine, paced like a real table:
 *
 * - The piddle plays out roll by roll, then the table fills in, in order of
 *   play from the Hammer; the Hammer token moves down it as play passes left.
 * - Bots take each move at the pace you set (paceAfter): very slow to start,
 *   realistic (a few seconds of thinking that varies), up to instant. Pause,
 *   step with Next and change speed from the controls on the table.
 * - One outline glides to whoever's turn it is; each seat shows its latest
 *   move, the call sits in its own placard, and an announcer holds the
 *   newest move.
 * - Players who missed the game roll on their own, at the same time (you
 *   too); players in the cup have their dice picked up.
 * - Unless you're the Hammer or a refusal, your dice stay in the cup until
 *   the call; then you roll for it.
 * - Hard mode: you show your own game, dice by dice. Wrong dice are picked
 *   up and rolled whole, like at a real table.
 * - Hints say what a solid player would do, with your chance of the pencil
 *   for each option (call odds, or rounds played out in a worker).
 */

const ZERO = [0, 0, 0, 0, 0]
const label = (call) => formatCallLabel(call)
const emoji = (call) => GAMES_MAP[call.game]?.emoji
const gameName = (call) => GAMES_MAP[call.game]?.name || call.game
const HINT_SAMPLES = 1000
const REFUSAL_SAMPLES = 600

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
  return hand.made ? `a kicker of ${hand.kickerTotal}` : `no ${gameName(call)}`
}

/** Two pair or better: strong enough for a Boss to say "come up" (as the bots play it) */
const bossStrong = (dice) => compareBoss(dice, [2, 2, 1, 1, 3]) >= 0

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
      if (phase.kind === 'boss' && phase.stage === 'bossRoll')
        return bossStrong(dice) ? 'Don’t roll: say “come up”.' : 'Don’t roll: say “pick ’em up”.'
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
      return 'Say “pick ’em up”.'
    default:
      return null
  }
}

/** "Roll to beat Ava’s three 6s", or "Roll to make 10-3" when the hand to beat missed the game */
function beatText(dice, whose, call, lead, kept) {
  const text = handText(dice, call, kept)
  // "Cass’s kicker of 12", not "Cass’s a kicker of 12"
  return text.startsWith('no ') ? `${lead} make ${text.slice(3)}` : `${lead} beat ${whose} ${text.replace(/^an? /, '')}`
}

const list = (xs) => (xs.length < 2 ? xs.join('') : `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`)

/** The button that starts a round, for the Hammer and the refusals (who roll before the call); null for everyone else */
function comeOutLabel(game) {
  if (game.hammer === YOU) return 'Roll new hand'
  const { first, second } = refusalSeats(game)
  if (first === YOU) return 'Roll 1st refusal'
  if (second === YOU) return 'Roll 2nd refusal'
  return null
}

/** Has this player made the called kicker game (with their kept dice)? Always true outside kicker games */
function madeGame(game, id) {
  const ph = game.phase
  if (ph.kind !== 'play' || !isKickerGame(ph.call.game)) return true
  return evaluateKickerHand(game.dice[id], ph.call.game, ph.call.variant, ph.rolling[id]?.kept ?? []).made
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

/** The call in play this round, who made it, and any refused first call */
function roundCall(game, roundStart) {
  const called = game.log.slice(roundStart).filter((e) => e.type === 'called')
  const last = called[called.length - 1]
  if (game.phase.kind === 'secondCall') return { call: null, refused: game.phase.refused }
  if (!last) return { call: null }
  return { call: last.call, caller: last.player, second: last.second, refused: last.second ? called[0]?.call : null }
}

export default function Play({ intro }) {
  const [game, setGame] = useState(null)
  const [rollIds, setRollIds] = useState({})
  const [keep, setKeep] = useState([])
  const [error, setError] = useState(null)
  const [hints, setHints] = useState(true)
  const [hard, setHard] = useState(false)
  const [roundStart, setRoundStart] = useState(0)
  // The round before this one, [from, to) in the log, to look back at
  const [lastRound, setLastRound] = useState(null)
  const [paused, setPaused] = useState(false)
  // The piddle plays out a step at a time before the first deal
  const [piddleStep, setPiddleStep] = useState(0)
  const [dealt, setDealt] = useState(false)
  // The round you rolled your dice in (the Hammer and refusals roll at the deal; the rest after the call)
  const [rolledRound, setRolledRound] = useState(0)
  // Hard mode: the roll you last showed your game for, and the dice you're showing
  const [declared, setDeclared] = useState(null)
  const [showing, setShowing] = useState([])
  const [prefs, updatePrefs] = useDicePrefs()
  const pace = PACES.some((p) => p.id === prefs.pace) ? prefs.pace : DEFAULT_PACE
  const [tableRules] = useHouseRules()
  const prev = useRef(null)
  const roundStartRef = useRef(0)
  roundStartRef.current = roundStart

  const start = (botCount, hardMode) => {
    const g = newTable(botCount, Math.floor(Math.random() * 2 ** 31), tableRules)
    setRollIds(Object.fromEntries(g.seats.map((s) => [s.id, ZERO.map(() => 1)])))
    setGame(g)
    setHard(hardMode)
    setDealt(!g.log.some((e) => e.type === 'piddle'))
    setPiddleStep(0)
    setRoundStart(0)
    setLastRound(null)
    setRolledRound(0)
    setDeclared(null)
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

  /* ── Where the table stands ── */
  const phase = game?.phase
  const acting = useMemo(() => (game ? actors(game) : []), [game])
  const mine = acting.includes(YOU)
  const bots = acting.filter((id) => id !== YOU)
  const meOut = Boolean(game?.seats.find((s) => s.id === YOU)?.out)
  const live = Boolean(phase) && phase.kind !== 'roundOver' && phase.kind !== 'gameOver'
  const roles = live ? refusalSeats(game) : {}
  // The Hammer and the refusals roll at the deal; everyone else once the Hammer has called
  const involved = live && (game.hammer === YOU || roles.first === YOU || roles.second === YOU)
  const rolledIn = meOut || !live || involved || rolledRound === game?.round
  const hidingDice = dealt && !rolledIn
  // Past the refusals your dice count: the table waits for you to roll
  const waitingToRoll = hidingDice && ['play', 'tresAway', 'boss'].includes(phase?.kind)

  // Hard mode: after each roll of a kicker game you show your game before play goes on
  const myRolls = phase?.kind === 'play' ? phase.rolling[YOU] : null
  const kickerCall = phase?.kind === 'play' && isKickerGame(phase.call.game)
  const rollKey = myRolls ? `${game.round}:${phase.cycle}:${myRolls.rollsUsed}` : null
  const dead = myRolls?.kept.length === 5
  const mustShow = Boolean(hard && dealt && rolledIn && myRolls && kickerCall && !dead && declared !== rollKey)
  // Your dice are outlined for the game once you've shown it (always, outside hard mode)
  const myGrouping = !hard || !(myRolls && kickerCall) || declared === rollKey || dead
  useEffect(() => {
    setShowing(myRolls ? [...myRolls.kept] : [])
  }, [rollKey]) // eslint-disable-line react-hooks/exhaustive-deps

  const lastEvent = game && game.log.length > roundStart ? game.log[game.log.length - 1] : null
  const nextIsMine = phase?.kind === 'roundOver' && !meOut && Boolean(comeOutLabel(game))

  /* ── Pacing: the piddle, the bots (several at once while players make the game), the next deal ── */
  const steps = useMemo(() => {
    const piddle = game?.log.find((e) => e.type === 'piddle')
    return piddle ? piddleSteps(piddle.rounds) : []
  }, [game?.log])
  const piddleDone = piddleStep >= steps.length - 1

  const deal = useCallback(() => {
    setDealt(true)
    setRollIds((ids) => Object.fromEntries(Object.entries(ids).map(([id, r]) => [id, r.map((n) => n + 1)])))
    if (prefs.sound) playRollSound(5)
  }, [prefs.sound])
  const comeOut = useCallback(() => act({ type: 'nextRound' }), [act])
  const rollForCall = () => {
    setRolledRound(game.round)
    setRollIds((ids) => ({ ...ids, [YOU]: (ids[YOU] || ZERO).map((n) => n + 1) }))
    if (prefs.sound) playRollSound(5)
  }

  // The piddle, one roll at a time; then the first deal (yours to start if you roll before the call)
  useEffect(() => {
    if (!game || dealt || paused) return undefined
    if (!piddleDone) {
      const t = setTimeout(() => setPiddleStep((s) => s + 1), holdFor(2600, pace))
      return () => clearTimeout(t)
    }
    if (comeOutLabel(game)) return undefined
    const t = setTimeout(deal, holdFor(3000, pace))
    return () => clearTimeout(t)
  }, [game, dealt, paused, piddleDone, piddleStep, pace, deal])

  // Between rounds: the next Hammer comes out on their own, unless it's yours to start
  useEffect(() => {
    if (!dealt || paused || phase?.kind !== 'roundOver' || nextIsMine) return undefined
    const t = setTimeout(comeOut, holdFor(4000, pace))
    return () => clearTimeout(t)
  }, [dealt, paused, phase, nextIsMine, pace, comeOut])

  // Bots move on their own, each after reading the last move and thinking; while you must roll or show your game, they wait
  const timers = useRef({})
  const botsGo = Boolean(game && dealt && !paused && !waitingToRoll && !mustShow)
  const botKey = bots.join(',')
  useEffect(() => {
    const want = botsGo ? botKey.split(',').filter(Boolean) : []
    Object.keys(timers.current).forEach((id) => {
      if (!want.includes(id)) {
        clearTimeout(timers.current[id])
        delete timers.current[id]
      }
    })
    want.forEach((id) => {
      if (timers.current[id]) return
      timers.current[id] = setTimeout(() => {
        delete timers.current[id]
        const g = gameRef.current
        if (actors(g).includes(id)) act(botActionFor(g, id))
      }, paceAfter(lastEvent, pace))
    })
    // `game`: every move re-arms, even one the log doesn't show (a Boss who skips the extra roll)
  }, [botsGo, botKey, game, lastEvent, pace, act])
  useEffect(() => () => Object.values(timers.current).forEach(clearTimeout), [])

  // Next: one step while paused (or to skip a wait)
  const canStep = Boolean(
    game && (!dealt ? !piddleDone || !comeOutLabel(game) : (phase.kind === 'roundOver' && !nextIsMine) || (bots.length > 0 && !waitingToRoll && !mustShow))
  )
  const step = () => {
    if (!dealt) {
      if (!piddleDone) setPiddleStep((s) => s + 1)
      else if (!comeOutLabel(game)) deal()
      return
    }
    if (phase.kind === 'roundOver') {
      comeOut()
      return
    }
    const g = gameRef.current
    const id = actors(g).find((p) => p !== YOU)
    if (!id) return
    clearTimeout(timers.current[id])
    delete timers.current[id]
    act(botActionFor(g, id))
  }

  // A fresh keep selection whenever your move begins
  useEffect(() => {
    if (!game) return
    const key = `${game.round}:${game.phase.kind}:${mine}:${myRolls?.rollsUsed ?? ''}`
    if (prev.current === key) return
    prev.current = key
    setKeep(startingKeep(game))
  }, [game, mine]) // eslint-disable-line react-hooks/exhaustive-deps

  const view = useMemo(() => (game ? viewFor(game, YOU) : null), [game])
  const suggestion = useMemo(
    () => (game && dealt && mine && rolledIn && !mustShow ? botActionFor(game, YOU) : null),
    [game, dealt, mine, rolledIn, mustShow]
  )
  const names = useMemo(() => (game ? Object.fromEntries(game.seats.map((s) => [s.id, s.name])) : {}), [game])
  const call = phase && 'call' in phase ? phase.call : null
  const hintDetail = useMemo(
    () =>
      hints && suggestion
        ? hintStats(game, YOU, suggestion, { call: label, player: (id) => names[id], hand: (dice) => handText(dice, call) })
        : null,
    [hints, suggestion] // eslint-disable-line react-hooks/exhaustive-deps
  )
  // Every decision but the call is measured by playing rounds out, off the main thread
  const simRequest = useMemo(
    () =>
      hintDetail?.choices
        ? {
            kind: 'decision',
            options: { state: game, me: YOU, choices: hintDetail.choices.map(({ label: l, actions }) => ({ label: l, actions })), samples: HINT_SAMPLES },
          }
        : hintDetail?.refusal
          ? { kind: 'refusal', options: { ...hintDetail.refusal, samples: REFUSAL_SAMPLES } }
          : null,
    [hintDetail] // eslint-disable-line react-hooks/exhaustive-deps
  )
  const sim = useSimulation(simRequest)

  if (!game)
    return (
      <>
        {intro}
        <Setup onStart={start} />
      </>
    )

  /* ── The round in words ── */
  const myDice = game.dice[YOU]
  const roundLog = game.log.slice(roundStart)
  const roundEvents = roundLog.map((e) => describeEvent(e, names, label)).filter(Boolean)
  const previousEvents = lastRound
    ? game.log
        .slice(lastRound[0], lastRound[1])
        .map((e) => describeEvent(e, names, label))
        .filter(Boolean)
    : null
  const placard = roundCall(game, roundStart)

  // Roles and decisions this round
  const decisions = {}
  roundLog.forEach((e) => {
    if (e.type === 'refused') decisions[e.player] = 'Refused'
    if (e.type === 'accepted') decisions[e.player] = 'Accepted'
    if (e.type === 'stood') decisions[e.player] = phase.kind === 'play' ? 'Took the tie' : 'Done'
    if (e.type === 'cycle') e.players.forEach((id) => (decisions[id] = 'Replaying'))
  })
  const bottom = bottomHands(game)
  if (phase.kind === 'play')
    Object.entries(phase.rolling).forEach(([id, r]) => {
      if (r.done && decisions[id] !== 'Took the tie') decisions[id] = 'All day'
    })

  // The table from public information: who's at the bottom, who's all day, who's in the cup
  const table = dealt ? standings(game) : []
  const standingOf = Object.fromEntries(table.map((st) => [st.player, st]))
  const safe = table.filter((st) => st.status === 'safe').map((st) => st.player)
  const standingDetail = (st) => {
    if (st.player === YOU && hidingDice) return 'Dice in the cup'
    if (st.player === YOU && mustShow) return 'Showing your game'
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
    const rolls = decisions[st.player] === 'Took the tie' ? 'took the tie' : st.allDay ? 'all day' : `${st.rollsLeft} ${st.rollsLeft === 1 ? 'roll' : 'rolls'} left`
    return `${handText(dice, call, keptAt(game, st.player))} · ${rolls}`
  }
  const capital = (t) => t.charAt(0).toUpperCase() + t.slice(1)
  // In the cup, and why: "Kicker of 9 beats Ben’s all-day 6", "Can’t reach Ben’s 14, already out"
  const cupText = (st) => {
    const over = st.safeOver
    if (!over || !call) return 'Safe from the first cycle'
    const whose = over === YOU ? 'your' : `${names[over]}’s`
    const final = phase.kind === 'roundOver' || standingOf[over]?.allDay ? 'all-day' : 'final'
    const mine = game.dice[st.player]
    const theirs = game.dice[over]
    if (call.game === 'tres-away') {
      const out = phase.kind === 'tresAway' ? phase.hands[over].out.map((i) => theirs[i]) : theirs
      return phase.kind === 'tresAway' ? `Can’t reach ${whose} ${tresAwayScore(out)}, already out` : `${capital(handText(mine, call))} beats ${whose} ${tresAwayScore(theirs)}`
    }
    if (isKickerGame(call.game)) {
      const me = evaluateKickerHand(mine, call.game, call.variant, keptAt(game, st.player))
      const them = evaluateKickerHand(theirs, call.game, call.variant, keptAt(game, over))
      if (!them.made) return `Made ${gameName(call)}; ${over === YOU ? 'you' : names[over]} missed it, ${final === 'all-day' ? 'all day' : 'and stood'}`
      return `Kicker of ${me.kickerTotal} beats ${whose} ${final} ${them.kickerTotal}`
    }
    const hand = capital(handText(mine, call))
    const verb = /^(Three|Four|Five)\b/.test(hand) ? 'beat' : 'beats'
    return `${hand} ${verb} ${whose} ${final} ${handText(theirs, call).replace(/^an? /, '')}`
  }
  // Hard mode: nothing gives your hand away before you've shown it
  const statusOf = (st) =>
    !st || (st.player === YOU && hidingDice) || (mustShow && ['bottom', 'tied'].includes(st.status)) ? undefined : st.boss ? 'boss' : phase.kind === 'roundOver' && st.status === 'bottom' ? 'pencil' : st.status === 'live' ? undefined : st.status

  /* ── Your move ── */
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
  const toggleShowing = (i) => {
    if (myRolls?.kept.includes(i)) return
    setShowing((s) => (s.includes(i) ? s.filter((x) => x !== i) : [...s, i]))
  }
  // Hard mode: right, play on; wrong, pick them all up (with no roll left, the hand is dead)
  const showGame = (claim) => {
    const hand = evaluateKickerHand(myDice, call.game, call.variant, myRolls.kept)
    const right = claim === 'none' ? !hand.made : isGameSet(myDice, showing, call.game, myRolls.kept)
    if (right || myRolls.rollsUsed >= 3) setDeclared(rollKey)
    if (!right) act({ type: 'misread', player: YOU })
  }
  // The Boss can skip the extra roll and say it straight away
  const bossSays = (type, skipRoll) => {
    if (skipRoll) act({ type: 'stand', player: YOU })
    act({ type, player: YOU })
  }

  let title = ''
  let body = null
  let controls = null
  let labLink = null
  const botNames = list(bots.map((id) => names[id]))

  if (!dealt) {
    title = ''
  } else if (phase.kind === 'gameOver') {
    title = phase.winner === YOU ? 'You win the pot! 🎉' : `${names[phase.winner]} wins the pot`
    body = <p>Last player standing. Rack ’em up again?</p>
    controls = <RollButton onClick={() => setGame(null)}>New game</RollButton>
  } else if (phase.kind === 'roundOver') {
    const loser = phase.loser
    title = loser ? (loser === YOU ? 'You take the pencil' : `${names[loser]} takes the pencil`) : 'No pencil this round'
    body = (
      <p>
        {loser ? `${loser === YOU ? 'You hold' : `${names[loser]} holds`} the Hammer next.` : 'The Hammer passes left.'}{' '}
        {game.hammer === YOU
          ? 'When everyone’s ready, say “coming out” and everyone rolls.'
          : nextIsMine
            ? `${names[game.hammer]} says “coming out”: roll your dice for the refusal.`
            : `${names[game.hammer]} says “coming out” in a moment. Your dice stay in the cup until the call.`}
      </p>
    )
    if (nextIsMine) controls = <RollButton onClick={comeOut}>{comeOutLabel(game)}</RollButton>
  } else if (hidingDice) {
    // Not the Hammer or a refusal: roll once there's a call to roll for
    if (call) {
      title = `${names[placard.caller] || 'The Hammer'} called ${label(call)}`
      body = <p>Your dice are still in the cup. Roll them for {label(call)}: this is your first of three rolls.</p>
      controls = <RollButton onClick={rollForCall}>Roll for {label(call)}</RollButton>
    } else {
      title = 'Your dice are in the cup'
      body = (
        <p>
          {phase.kind === 'secondCall'
            ? `Both refused, so ${names[game.hammer]} makes a second call. You roll for whatever is called.`
            : `Wait for ${names[game.hammer]}’s call, then roll for it.`}
        </p>
      )
    }
  } else if (mustShow) {
    // Hard mode: show the dice that make the game, or say you missed it
    const size = gameSize(call.game)
    const name = gameName(call)
    title = `Show your game: ${label(call)}`
    body = (
      <p>
        Tap the {size} dice that make {name}
        {myRolls.kept.length ? ', with the dice you kept' : ''}, then show them. No {name}? Say so. Show the wrong dice and you pick them all up
        {myRolls.rollsUsed >= 3 ? ': out of rolls, that’s no game.' : ' and roll all five.'}
      </p>
    )
    controls = (
      <div className="flex flex-wrap gap-2">
        <Button disabled={showing.length !== size} onClick={() => showGame('dice')}>
          Show {name} ({showing.length}/{size})
        </Button>
        <Button variant="outline" onClick={() => showGame('none')}>
          No {name}
        </Button>
      </div>
    )
  } else if (!mine) {
    title = meOut ? 'You’re out: watching the bots' : bots.length ? `${botNames} ${bots.length > 1 ? 'are' : 'is'} thinking…` : ''
    if (phase.kind === 'play' && bots.length) {
      const making = isKickerGame(call.game) && (bots.length > 1 || !madeGame(game, bots[0]))
      const target = bottomTarget(game, bots[0])
      title = making ? `${botNames} ${bots.length > 1 ? 'roll' : 'rolls'} to make ${gameName(call)}` : `${botNames} has the worst hand and rolls`
      body = (
        <p className="text-muted-foreground">
          {making
            ? 'Anyone who missed the game rolls on their own until they make it or run out of rolls.'
            : target && `${beatText(game.dice[target], target === YOU ? 'your' : `${names[target]}’s`, call, 'They need to', keptAt(game, target))}.`}
        </p>
      )
    } else if (bots.length) {
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
              'flex min-h-11 w-full flex-col items-start gap-1 rounded-lg border bg-background p-2 text-left text-sm transition-colors hover:border-primary hover:bg-primary/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:flex-row sm:items-center sm:justify-between sm:gap-2',
              suggested && 'border-primary ring-1 ring-primary'
            )}
          >
            <span className="font-medium">
              <span aria-hidden>{emoji(c)}</span> {label(c)}
              {suggested && <span className="ml-1 text-xs text-primary">Suggested</span>}
            </span>
            <Hand dice={myDice} game={hard ? null : c.game} variant={c.variant} size="xs" />
          </button>
        </li>
      )
    }
    controls = (
      <div className="space-y-3">
        <p className="text-sm font-semibold">Best fits for your dice</p>
        <ul className="grid grid-cols-2 gap-2">{ranked.slice(0, 4).map(callButton)}</ul>
        <details className="group rounded-lg border bg-background/60">
          <summary className="cursor-pointer select-none rounded-lg p-2 text-sm font-medium hover:bg-accent">Other calls ({ranked.length - 4})</summary>
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
    body = (
      <p>
        You’re the {phase.seat === 1 ? '1st' : '2nd'} refusal. Accept and everyone plays it, or refuse and{' '}
        {phase.seat === 1 && roles.second ? 'the 2nd refusal decides' : 'the Hammer must call a different game'}. You keep these dice either way.
      </p>
    )
    controls = (
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => act({ type: 'accept', player: YOU })}>Accept</Button>
        <Button variant="outline" onClick={() => act({ type: 'refuse', player: YOU })}>
          Refuse
        </Button>
      </div>
    )
  } else if (phase.kind === 'play') {
    const r = phase.rolling[YOU]
    const left = 3 - r.rollsUsed
    const kicker = isKickerGame(call.game)
    const hand = kicker ? evaluateKickerHand(myDice, call.game, call.variant, r.kept) : null
    const badKeep = kicker
      ? keepProblem(keep.map((i) => myDice[i]), call.game, { locked: r.kept.map((i) => myDice[i]), hand: myDice, rules: game.rules })
      : null
    const must = wouldLoseIfStopped(game, YOU)
    const target = bottomTarget(game, YOU)
    const targetDice = game.dice[target]
    const tied = bottom.filter((id) => id !== YOU)
    const making = kicker && !hand.made
    const rollsWord = `${left} ${left === 1 ? 'roll' : 'rolls'} left`
    title = making ? `Roll to make ${gameName(call)}: ${rollsWord}` : `You have the worst hand: ${rollsWord}`
    body = (
      <>
        <p>
          {making ? (
            <>Everyone who missed the game rolls on their own, you included, until they make it or run out of rolls.</>
          ) : must ? (
            <>
              {beatText(targetDice, `${names[target]}’s`, call, 'Roll to', keptAt(game, target))}. Climb off the bottom and your turn ends; still there when your rolls run out,
              and you take the pencil.
            </>
          ) : (
            <>
              You’re tied with {tied.map((id) => names[id]).join(' and ')}, who {tied.length === 1 ? 'is' : 'are'} out of rolls. Take the tie and you replay, or roll to beat it.
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
        {!must && (
          <Button variant="outline" onClick={() => act({ type: 'stand', player: YOU })}>
            Take the tie
          </Button>
        )}
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
        {!h.fresh && <RollButton onClick={() => act({ type: 'roll', player: YOU })}>Roll {5 - h.out.length}</RollButton>}
      </div>
    )
    if (h.fresh) labLink = `/odds-lab/?tab=keep&game=tres-away&roll=${myDice.join('')}`
  } else if (phase.kind === 'boss') {
    const others = phase.players.filter((id) => id !== YOU).map((id) => game.dice[id])
    const sayButtons = (skipRoll) => (
      <>
        <Button onClick={() => bossSays('comeUp', skipRoll)}>Come up</Button>
        <Button variant="outline" onClick={() => bossSays('dontComeUp', skipRoll)}>
          Pick ’em up
        </Button>
      </>
    )
    if (phase.stage === 'bossRoll') {
      title = 'You’re the Boss: roll, come up, or pick ’em up'
      body = (
        <p>
          Roll once more, in secret: pick up any dice, as long as what you keep still beats everyone else’s hand. Or skip the roll: “come up” gives everyone one last roll and
          the worst hand loses (it can be you); “pick ’em up” ends the round with no loser, and the Hammer passes left.
        </p>
      )
      const badBossKeep = bossKeepProblem(keep.map((i) => myDice[i]), others)
      controls = (
        <div className="flex flex-wrap items-center gap-2">
          <RollButton disabled={keep.length === 5 || Boolean(badBossKeep)} onClick={() => act({ type: 'reroll', player: YOU, keep })}>
            Roll {5 - keep.length}
          </RollButton>
          {sayButtons(true)}
          {badBossKeep && keep.length < 5 && <span className="text-sm text-destructive">{badBossKeep}.</span>}
        </div>
      )
    } else if (phase.stage === 'decide') {
      title = 'Come up, or pick ’em up?'
      body = <p>“Come up” gives everyone one last roll, and the worst hand loses: it can be you. “Pick ’em up” ends the round with no loser, and the Hammer passes left.</p>
      controls = <div className="flex flex-wrap gap-2">{sayButtons(false)}</div>
    } else {
      title = 'Your last roll'
      body = <p>Keep any dice and roll the rest, or stand. The worst hand at the table loses.</p>
      controls = (
        <div className="flex flex-wrap gap-2">
          <RollButton disabled={keep.length === 5} onClick={() => act({ type: 'reroll', player: YOU, keep })}>
            Roll {5 - keep.length}
          </RollButton>
          <Button variant="outline" onClick={() => act({ type: 'stand', player: YOU })}>
            Stand
          </Button>
        </div>
      )
      labLink = `/odds-lab/?tab=keep&game=boss&roll=${myDice.join('')}`
    }
  }

  const canKeep = mine && rolledIn && !mustShow && (phase.kind === 'play' || phase.kind === 'tresAway' || (phase.kind === 'boss' && phase.stage !== 'decide'))
  const hint = hints && suggestion ? hintText(suggestion, myDice, phase) : null
  // The hint's numbers: the call odds straight away; any other decision once its rounds are played out
  let simRows = null
  if (hintDetail && sim.result && !sim.running) {
    if (hintDetail.choices && Array.isArray(sim.result))
      simRows = hintDetail.choices.map((c, i) => ({ label: c.label, value: sim.result[i]?.pencil ?? 0, best: c.best }))
    else if (hintDetail.refusal && sim.result.accept)
      simRows = [
        { label: 'Accept', value: sim.result.accept.pencil, best: suggestion.type === 'accept' },
        { label: 'Refuse', value: sim.result.refuse.pencil, best: suggestion.type === 'refuse' },
      ]
    simRows?.sort((a, b) => a.value - b.value)
  }
  const simulated = Boolean(hintDetail?.choices || hintDetail?.refusal)
  // When the rounds played out clearly favour another option than the solid player's pick, say so
  const picked = simRows?.find((r) => r.best)
  const lowest = simRows?.[0]
  // (not for the Boss's choice: picking 'em up never costs a pencil, but never hands one out either)
  const bossChoice = phase.kind === 'boss' && phase.stage !== 'comeUp'
  const disagree =
    !bossChoice && picked && lowest && lowest !== picked && picked.value - lowest.value >= 0.03
      ? `Played out, ${lowest.label.toLowerCase()} takes the pencil less often here (${Math.round(lowest.value * 100)}% vs ${Math.round(picked.value * 100)}%): the solid player’s rule of thumb gets this one wrong.`
      : null
  const hintStatsShown = hintDetail
    ? {
        ...hintDetail,
        rows: simulated ? simRows || [] : hintDetail.rows,
        pending: simulated && !simRows,
        disagree,
        note: simulated
          ? `${(hintDetail.refusal ? REFUSAL_SAMPLES : HINT_SAMPLES).toLocaleString()} rounds played out by solid bots, so each chance is good to about 2 points.`
          : null,
      }
    : null

  /* ── The table ── */
  const firstHammer = game.log.find((e) => e.type === 'hammer')?.player ?? game.hammer
  const order = tableOrder(game.seats, firstHammer)
  const others = order.filter((s) => s.id !== YOU)
  const you = game.seats.find((s) => s.id === YOU)

  // Each seat's latest move this round; the newest stands out
  const moves = latestMoves(roundLog, label)
  const newest = Math.max(-1, ...Object.values(moves).map((m) => m.at))
  const latestAt = roundLog.map((e, i) => (describeEvent(e, names, label) ? i : -1)).reduce((a, b) => Math.max(a, b), -1)
  const latest = latestAt >= 0 ? describeEvent(roundLog[latestAt], names, label) : null

  // The piddle, revealed a roll at a time
  const piddle = game.log.find((e) => e.type === 'piddle')
  const pStep = steps[Math.min(piddleStep, steps.length - 1)]
  const piddleDie = {}
  if (piddle && pStep) piddle.rounds.slice(0, pStep.round + 1).forEach((round, r) => round.forEach((x) => (piddleDie[x.player] = { die: x.die, round: r })))
  let piddleText = null
  if (!dealt && pStep) {
    const round = piddle.rounds[pStep.round]
    const high = Math.max(...round.map((r) => r.die))
    const top = round.filter((r) => r.die === high).map((r) => names[r.player])
    if (pStep.done) piddleText = game.hammer === YOU ? 'You rolled highest and hold the Hammer.' : `${names[game.hammer]} rolled highest and holds the Hammer.`
    else if (top.length > 1) piddleText = `${list(top)} tied on ${high} for the highest, so ${top.length === 2 ? 'both' : 'they'} roll again.`
    else piddleText = pStep.round === 0 ? `Everyone rolled one die. ${top[0]} has the highest: ${high}.` : `${top[0]} wins the roll-off with ${high}.`
  }

  // Your move sits in your seat; anyone else's is announced above the table
  const moveInSeat = Boolean(controls) && !meOut
  const roundOverTres = phase.kind === 'roundOver' && call?.game === 'tres-away'
  // One outline glides to whoever's turn it is; several players rolling at once each glow
  // (showing your game in hard mode, the table waits on you)
  const turnId = mustShow ? YOU : dealt && acting.length === 1 ? acting[0] : null

  const move = (
    <div aria-live="polite">
      <h2 className="text-subheading">{title}</h2>
      <div className="mt-1 space-y-2 text-sm leading-relaxed text-muted-foreground">{body}</div>
      {error && <p className="mt-3 rounded-md border border-destructive/40 bg-destructive/10 p-2 text-sm">{error}</p>}
      {/* Phones and tablets: the hint folds into one line above your buttons */}
      {hint && (
        <details className="group mt-3 rounded-lg border bg-background/60 lg:hidden">
          <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 px-2 text-sm [&::-webkit-details-marker]:hidden">
            <span className="min-w-0 flex-1">
              <strong>Hint:</strong> {hint}
            </span>
            <span className="shrink-0 text-xs text-muted-foreground">Odds</span>
            <ChevronDown aria-hidden className="h-4 w-4 shrink-0 transition-transform group-open:rotate-180" />
          </summary>
          <HintCard hint={hint} stats={hintStatsShown} className="m-2 mt-0 border-0 p-0 shadow-none" />
        </details>
      )}
      {labLink && (
        <a href={withPrefix(labLink)} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-primary hover:underline">
          <FlaskConical aria-hidden className="h-4 w-4" /> Not sure? See the exact odds in the Odds Lab
          <span className="sr-only">(opens in a new tab)</span>
        </a>
      )}
      {controls && <div className="mt-3">{controls}</div>}
    </div>
  )

  const renderSeat = (s, { compact } = {}) => {
    const isYou = s.id === YOU
    const st = standingOf[s.id]
    if (!dealt) {
      // The piddle: one die each; anyone out of a roll-off greys out
      const p = piddleDie[s.id]
      const stillIn = p && p.round === pStep.round
      return (
        <Seat
          key={s.id}
          name={s.name}
          you={isYou}
          compact={compact}
          pencils={0}
          maxPencils={game.rules.pencilsToLose}
          badges={pStep?.done && s.id === game.hammer ? ['🔨 Hammer'] : []}
          className={cn(!stillIn && 'opacity-60')}
        >
          {p && <Die value={p.die} size={compact ? 'sm' : 'md'} rollId={p.round + 1} label={`rolled ${p.die}`} />}
        </Seat>
      )
    }
    const badges = []
    if (phase.kind !== 'gameOver') {
      if (s.id === game.hammer) badges.push(phase.kind === 'roundOver' ? '🔨 Next Hammer' : '🔨 Hammer')
      // Refusal seats matter until play starts; then the decision badge says what they did
      if (['call', 'refusal', 'secondCall'].includes(phase.kind)) {
        if (s.id === roles.first) badges.push('1st refusal')
        if (s.id === roles.second) badges.push('2nd refusal')
      }
    }
    if (phase.kind === 'boss' && phase.boss === s.id) badges.push('👑 Boss')
    if (bottom.includes(s.id) && !mustShow && !(isYou && hidingDice)) badges.push(bottom.length > 1 ? 'Tied worst' : 'Worst hand')
    const dice = view.dice[s.id] || [null, null, null, null, null]
    const tres = phase.kind === 'tresAway' && phase.hands[s.id]
    const m = moves[s.id]
    // In the cup: their dice are picked up (the loser's stay on the table)
    const inCup = safe.includes(s.id) && !(phase.kind === 'roundOver' && phase.loser === s.id)
    const hand = (size) => (
      <Hand
        dice={dice}
        game={call && (!isYou || myGrouping) ? call.game : null}
        variant={call?.variant}
        size={size}
        rollIds={rollIds[s.id]}
        committed={call && isKickerGame(call.game) && (!isYou || myGrouping) ? keptAt(game, s.id) : undefined}
        putOut={tres ? tres.out : roundOverTres ? [0, 1, 2, 3, 4] : undefined}
        kept={isYou && mustShow ? showing : isYou && canKeep ? keep : undefined}
        locked={
          isYou && mustShow
            ? myRolls.kept
            : isYou && tres
              ? tres.out
              : isYou && phase.kind === 'play' && isKickerGame(phase.call.game) && phase.rolling[YOU]?.kept.length
                ? phase.rolling[YOU].kept
                : undefined
        }
        onToggleKeep={isYou && mustShow ? toggleShowing : isYou && canKeep ? toggleKeep : undefined}
      />
    )
    let dicePart = null
    if (!s.out) {
      if (isYou && hidingDice) dicePart = <DiceCup label="Your dice, in the cup" />
      else if (inCup)
        dicePart = (
          <DiceCup>
            <span className="flex min-w-0 flex-col leading-tight">
              <span className="text-xs font-semibold text-muted-foreground">In the cup</span>
              <span className="text-sm font-semibold text-foreground">{cupText(st)}</span>
            </span>
          </DiceCup>
        )
      else dicePart = hand(compact ? 'sm' : 'md')
    }
    return (
      <Seat
        key={s.id}
        name={s.name}
        you={isYou}
        out={s.out}
        compact={compact}
        turn={turnId === s.id}
        active={!turnId && acting.includes(s.id)}
        loser={phase.kind === 'roundOver' && phase.loser === s.id}
        badges={badges}
        // The seat's latest move already says "Refuses" or "Accepts"
        decision={['Refuses', 'Accepts'].includes(m?.text) ? undefined : decisions[s.id]}
        pencils={s.pencils}
        maxPencils={game.rules.pencilsToLose}
        said={m && !s.out ? { text: m.text, at: m.at, fresh: m.at === newest } : undefined}
        detail={compact && !s.out && st && !inCup ? capital(standingDetail(st)) : undefined}
        className={isYou ? 'max-h-[75vh] overflow-y-auto shadow-lg' : undefined}
        footer={isYou && moveInSeat ? <div className="mt-3 border-t pt-3">{move}</div> : undefined}
      >
        {dicePart}
      </Seat>
    )
  }

  const orderRows = order.map((s) => {
    const st = standingOf[s.id]
    const tags = []
    if (dealt && ['call', 'refusal', 'secondCall'].includes(phase.kind)) {
      if (s.id === roles.first) tags.push('1st refusal')
      if (s.id === roles.second) tags.push('2nd refusal')
    }
    return {
      id: s.id,
      name: s.name,
      you: s.id === YOU,
      out: s.out,
      pencils: s.pencils,
      tags,
      active: dealt && acting.includes(s.id),
      detail: st && !s.out ? capital(standingDetail(st)) : undefined,
      status: statusOf(st),
    }
  })
  const piddleRound = piddle && pStep ? piddle.rounds[pStep.round] : []
  const piddleHigh = Math.max(0, ...piddleRound.map((x) => x.die))
  const sidePanel =
    !dealt && !pStep?.done ? (
      <Panel title="The piddle" description="Everyone rolls one die. Highest holds the Hammer; a tie for the highest rolls again.">
        <Standings
          label={pStep?.round ? `Roll-off ${pStep.round}` : 'Piddle rolls'}
          rows={rankBest(piddleRound, (a, b) => a.die - b.die).map(({ id: r, rank }) => ({
            id: r.player,
            name: names[r.player],
            you: r.player === YOU,
            rank,
            aside: <Die value={r.die} size="md" rollId={pStep.round + 1} label={`rolled ${r.die}`} />,
            status: r.die === piddleHigh && piddleRound.filter((x) => x.die === r.die).length > 1 ? 'again' : undefined,
          }))}
        />
      </Panel>
    ) : (
      <Panel
        title="Order of play"
        description={
          dealt && phase.kind === 'roundOver'
            ? 'How the round finished. The Hammer goes to whoever took the pencil.'
            : 'The Hammer calls first; play passes to the left, down the list.'
        }
      >
        <TableOrder rows={orderRows} hammer={game.hammer} maxPencils={game.rules.pencilsToLose} />
      </Panel>
    )

  return (
    <div className="space-y-6">
      <h1 className="sr-only">Play</h1>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_19rem] lg:gap-6">
        {/* Wide screens: the order of play, the hint and the round's story beside the table */}
        <aside className="hidden space-y-4 lg:col-start-2 lg:row-start-1 lg:block">
          {sidePanel}
          {hint && <HintCard hint={hint} stats={hintStatsShown} />}
          {dealt && (
            <Panel title="This round" tone="note" as="section">
              <RoundLog events={roundEvents} previous={previousEvents} />
            </Panel>
          )}
        </aside>

        {/* The table: the controls, the call, what just happened, the others in order of play, then you */}
        <TableFelt className="space-y-3 self-start overflow-visible lg:col-start-1 lg:row-start-1">
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 text-felt-foreground">
            <div className="font-display text-lg font-bold">{dealt ? `Round ${game.round}` : 'The piddle'}</div>
            {phase.kind !== 'gameOver' && (
              <Transport paused={paused} onToggle={() => setPaused((p) => !p)} onStep={step} canStep={canStep} />
            )}
          </div>
          {phase.kind !== 'gameOver' && <SpeedPicker pace={pace} onPace={(p) => updatePrefs({ pace: p })} />}

          {dealt && phase.kind !== 'gameOver' && (
            <CallPlacard
              call={placard.call}
              caller={placard.caller === YOU ? 'You' : names[placard.caller]}
              second={placard.second}
              refused={placard.refused}
              hammerName={names[game.hammer]}
              youHammer={game.hammer === YOU}
            />
          )}

          {/* The announcer: the newest move, held until the next one, and whose turn it is */}
          <div className="rounded-xl bg-card/95 p-3 shadow-sm">
            <p className="eyebrow text-muted-foreground">
              {paused ? 'Paused' : !dealt ? 'Piddle for the Hammer' : latest ? 'Just now' : 'New deal'}
            </p>
            <p key={dealt ? `${roundStart}:${latestAt}` : `p${piddleStep}`} className="story-pop mt-0.5 font-medium" aria-live="polite">
              {!dealt
                ? piddleText
                : latest || (game.hammer === YOU ? 'Everyone rolls. You hold the Hammer.' : `${names[game.hammer]} holds the Hammer and says “coming out”.`)}
            </p>
            {dealt && !moveInSeat && title && (
              <div className="mt-2 border-t pt-2 text-sm">
                <p className="font-semibold">{title}</p>
                {body && <div className="mt-0.5 space-y-1 text-muted-foreground">{body}</div>}
              </div>
            )}
            {!dealt && pStep?.done && comeOutLabel(game) && (
              <div className="mt-2 border-t pt-2">
                <p className="mb-2 text-sm text-muted-foreground">
                  {game.hammer === YOU ? 'Say “coming out” and everyone rolls.' : `${names[game.hammer]} says “coming out”. You’re a refusal, so you roll now.`}
                </p>
                <RollButton onClick={deal}>{comeOutLabel(game)}</RollButton>
              </div>
            )}
          </div>

          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">{others.map((s) => renderSeat(s, { compact: true }))}</div>

          {/* Your seat, docked to the bottom of the screen when it's your move: your dice and buttons in thumb reach */}
          <div className={cn((moveInSeat || (controls && meOut)) && 'sticky bottom-2 z-10')}>
            {renderSeat(you)}
            {/* Out of the game: the table's actions sit in your place */}
            {controls && meOut && <div className="mt-2 rounded-xl border bg-card p-3 shadow-lg">{move}</div>}
          </div>
        </TableFelt>
      </div>

      {/* Phones and tablets: the order of play and the round's story under the table */}
      <div className="grid gap-4 sm:grid-cols-2 lg:hidden">
        {sidePanel}
        {dealt && (
          <Panel title="This round" tone="note" as="section">
            <RoundLog events={roundEvents} previous={previousEvents} />
          </Panel>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <Switch id="hints" checked={hints} onCheckedChange={setHints} />
          <Label htmlFor="hints">Hints</Label>
        </div>
        <DiceSettings />
        {hard && <span className="rounded-full border px-2 py-0.5 text-xs font-semibold">Hard mode</span>}
        <button type="button" onClick={() => setGame(null)} className="ml-auto min-h-11 underline-offset-2 hover:underline">
          Leave the table
        </button>
      </div>
    </div>
  )
}
