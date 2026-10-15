import React, { useCallback, useMemo, useState } from 'react'
import { Link } from 'gatsby'
import {
  applyAction,
  evaluateKickerHand,
  refusalSeats,
  viewFor,
} from '../../engine'
import {
  AVA_ROLLS,
  BEN_REPLAY_ROLLS,
  BEN_ROLLS,
  CALL,
  PLAYERS,
  ROLL_PATH_DICE,
  TIE_PATH_DICE,
  newTutorialGame,
  withDice,
} from './script'
import { freshMakeChance, rollOrTakeTie } from '../../strategy'
import { Button, buttonVariants } from '../ui/button'
import { Badge } from '../ui/badge'
import { Die, DiceSettings, playRollSound, useDicePrefs } from '../Dice'
import { cn } from '../../lib/utils'

/**
 * Interactive first round, played on the real engine with scripted dice so
 * every player sees the same lesson: call a game, see refusals, play with
 * keepers, and find the loser.
 */

const CALL_OPTIONS = [
  { label: '10-3 High', call: CALL },
  { label: '10-3 Low', call: { game: '10-3', variant: 'low' } },
  { label: '10-2 High', call: { game: '10-2', variant: 'high' } },
  { label: 'Pairs High', call: { game: 'pairs', variant: 'high' } },
]

const WRONG_CALL = {
  '10-3 Low':
    'In Low, the lowest kicker wins. Your kicker would be 5+5 = 10, almost the highest possible, so Low is a bad fit.',
  '10-2 High':
    'You do make 10-2 with 5+5, but then your kicker is 1+3+6 = 10 out of a possible 18. Only middling.',
  'Pairs High':
    'Pairs needs two pairs. You only have one (5-5), so you’d be rolling to make the game.',
}

const newGame = newTutorialGame

const pct = (p) => `${Math.round(p * 100)}%`
const pct1 = (p) => `${(p * 100).toFixed(1)}%`

// Tied with Ben at 5+5 = 10 in 10-3 High, with 2 rolls left
const TIE_ODDS = rollOrTakeTie({
  kickerDice: 2,
  rolls: 2,
  variant: 'high',
  total: 10,
  tied: 2,
})

// The worked math behind those odds (shown under "How the math works")
const MISS_TWICE = TIE_ODDS.worse ** 2
const TIE_LATER = TIE_ODDS.worse * TIE_ODDS.equal
const LOSE_VIA_TIE = TIE_ODDS.loseIfTie * (TIE_ODDS.equal + TIE_LATER)

// Chance of making 10-3 in the replay within 1, 2 and 3 rolls
const MAKE = {
  1: freshMakeChance('10-3', 1),
  2: freshMakeChance('10-3', 2),
  3: freshMakeChance('10-3', 3),
}
const ONE_MISSES = MAKE[3] * (1 - MAKE[3])

const T = ({ to, children }) => (
  <Link
    to={`/glossary#${to}`}
    className="font-medium text-primary underline-offset-2 hover:underline"
  >
    {children}
  </Link>
)

/** The dice that make 10-3 and the kicker total, in words */
function describeHand(dice) {
  const hand = evaluateKickerHand(dice, '10-3', 'high')
  if (!hand.made) return { made: false, text: 'No 10-3 yet' }
  const game = hand.gameDice.map((i) => dice[i]).join('+')
  const kick = hand.kickerDice.map((i) => dice[i]).join('+')
  return {
    made: true,
    hand,
    total: hand.kickerTotal,
    text: `${game} = 10 · kicker ${kick} = ${hand.kickerTotal}`,
  }
}

const Tutorial = () => {
  const [game, setGame] = useState(newGame)
  const [step, setStep] = useState('welcome')
  const [rollIds, setRollIds] = useState({
    you: [0, 0, 0, 0, 0],
    ava: [0, 0, 0, 0, 0],
    ben: [0, 0, 0, 0, 0],
  })
  const [feedback, setFeedback] = useState(null)
  const [prefs] = useDicePrefs()

  const view = useMemo(() => viewFor(game, 'you'), [game])
  const inPlay = game.phase.kind === 'play' || game.phase.kind === 'roundOver'

  /**
   * Apply engine actions (from `start`, default the current game) and
   * animate (and sound) every die that was rolled, including a replay's deal
   */
  const actFrom = useCallback(
    (start, ...actions) => {
      const next = actions.reduce(applyAction, start)
      setGame(next)
      const bumps = {}
      next.log.slice(start.log.length).forEach((e) => {
        if (e.type === 'rolled') {
          bumps[e.player] = [0, 1, 2, 3, 4].filter((i) => !e.kept.includes(i))
        }
        if (e.type === 'cycle') {
          e.players.forEach((id) => (bumps[id] = [0, 1, 2, 3, 4]))
        }
      })
      const rolled = Object.values(bumps).flat().length
      if (rolled) {
        setRollIds((ids) => {
          const out = { ...ids }
          Object.entries(bumps).forEach(([id, idx]) => {
            out[id] = ids[id].map((n, i) => (idx.includes(i) ? n + 1 : n))
          })
          return out
        })
        if (prefs.sound) playRollSound(Math.min(rolled, 10))
      }
    },
    [prefs.sound]
  )
  const act = (...actions) => actFrom(game, ...actions)

  const restart = () => {
    setGame(newGame())
    setStep('welcome')
    setFeedback(null)
    setRollIds({
      you: [0, 0, 0, 0, 0],
      ava: [0, 0, 0, 0, 0],
      ben: [0, 0, 0, 0, 0],
    })
  }

  const firstRoll = () => {
    setRollIds((ids) => ({
      you: ids.you.map((n) => n + 1),
      ava: ids.ava,
      ben: ids.ben,
    }))
    if (prefs.sound) playRollSound(5)
    setStep('roll')
  }

  const chooseCall = (option) => {
    if (option.label !== '10-3 High') {
      setFeedback(WRONG_CALL[option.label])
      return
    }
    setFeedback(null)
    act({ type: 'call', player: 'you', call: CALL })
    setStep('called')
  }

  const mine = describeHand(game.dice.you)
  const ben = describeHand(game.dice.ben)

  /* ── Narration and the one control for each step ── */
  const steps = {
    welcome: {
      title: 'Your first round',
      body: (
        <>
          <p>
            You're at a table with Ava and Ben. Everyone has five dice. At the
            start of the game everyone <T to="piddle">piddles</T> (rolls one
            die), and you rolled highest, so you hold the{' '}
            <T to="hammer">Hammer</T>: you'll call the game this round.
          </p>
          <p>
            Whoever has the worst hand at the end of the round takes a{' '}
            <T to="pencil">pencil</T>. Let's play one.
          </p>
        </>
      ),
      action: <Button onClick={firstRoll}>Roll the dice</Button>,
    },
    roll: {
      title: 'Everyone rolls, and hides their dice',
      body: (
        <>
          <p>
            Everyone rolls all five dice at once and keeps them hidden. You can
            see yours; Ava's and Ben's are face down.
          </p>
          <p>
            This roll counts: it's roll 1 of 3 in whatever game gets played.
          </p>
        </>
      ),
      action: (
        <Button onClick={() => setStep('call')}>Next: make a call</Button>
      ),
    },
    call: {
      title: 'Call a game',
      body: (
        <>
          <p>
            As the Hammer, you name a game, and for most games whether{' '}
            <strong>High</strong> or <strong>Low</strong>{' '}
            <T to="kicker">kicker</T> wins. The kicker is all the dice left over
            after you make the game.
          </p>
          <p>Your dice already make two games:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              <strong>10-3</strong>: three dice adding to 10 (1+3+6), leaving a
              kicker of 5+5 = 10
            </li>
            <li>
              <strong>10-2</strong>: two dice adding to 10 (5+5), leaving a
              kicker of 1+3+6 = 10
            </li>
          </ul>
          <p>Which call gives you the strongest hand?</p>
        </>
      ),
      action: (
        <div className="flex flex-wrap gap-2">
          {CALL_OPTIONS.map((o) => (
            <Button
              key={o.label}
              variant="outline"
              onClick={() => chooseCall(o)}
            >
              {o.label}
            </Button>
          ))}
        </div>
      ),
    },
    called: {
      title: 'You called 10-3 High',
      body: (
        <p>
          A two-dice kicker totals at most 12, so your 5+5 = 10 is strong. Now
          the players to your left get a say: first the{' '}
          <T to="first-refusal">1st refusal</T>, then the{' '}
          <T to="second-refusal">2nd refusal</T>.
        </p>
      ),
      action: (
        <Button
          onClick={() => {
            act({ type: 'refuse', player: refusalSeats(game).first })
            setStep('refused')
          }}
        >
          Next: 1st refusal
        </Button>
      ),
    },
    refused: {
      title: 'Ava refuses',
      body: (
        <p>
          Ava sits on your left, so she's 1st refusal. She doesn't like her dice
          for 10-3 High, so she refuses. Refusing doesn't give her new dice: it
          only asks for a different game. Now it's Ben's turn as 2nd refusal.
        </p>
      ),
      action: (
        <Button
          onClick={() => {
            act({ type: 'accept', player: 'ben' })
            setStep('accepted')
          }}
        >
          Next: 2nd refusal
        </Button>
      ),
    },
    accepted: {
      title: 'Ben accepts, so everyone plays 10-3 High',
      body: (
        <>
          <p>
            Once anyone accepts, the whole table plays your call, Ava included.
            (If Ben had refused too, you'd have to call a different game, and
            nobody could refuse that one.)
          </p>
          <p>
            Play starts and all dice are turned face up. Each player gets up to
            3 rolls in total, and the first one has already happened. Everyone's
            best 10 is outlined; the rest is their kicker. You have the best
            kicker right now.
          </p>
        </>
      ),
      action: (
        <Button
          onClick={() => {
            act(...AVA_ROLLS)
            setStep('ava')
          }}
        >
          Next: everyone rolls
        </Button>
      ),
    },
    ava: {
      title: 'Ava keeps her 10 and re-rolls her kicker',
      body: (
        <>
          <p>
            After each roll you <strong>keep</strong> dice and re-roll the rest.
            Once the dice you keep make the game, only those stay on the table:
            your <strong>kicker is always re-rolled whole</strong>. You can't
            keep part of your kicker and re-roll the rest.
          </p>
          <p>
            Ava keeps 2+4+4 and re-rolls her kicker, the 6 and the 1. She gets
            6+6 = 12, the best possible, and stops rolling.
          </p>
        </>
      ),
      action: (
        <Button
          onClick={() => {
            act(...BEN_ROLLS)
            setStep('ben')
          }}
        >
          Next: Ben rolls
        </Button>
      ),
    },
    ben: {
      title: 'Ben catches up',
      body: (
        <>
          <p>
            Ben keeps 6+3+1 and re-rolls his kicker, the 6 and the 2. He gets a
            kicker of {ben.text.split('kicker ')[1]}, and stops.
          </p>
          <p>
            Now look at the table: your kicker (10) <strong>ties</strong> Ben's
            for the weakest hand, and Ben has stopped rolling. You've used 1
            roll and have 2 left.
          </p>
        </>
      ),
      action: <Button onClick={() => setStep('decide')}>Your turn</Button>,
    },
    decide: {
      title: 'Take the tie, or roll?',
      body: (
        <>
          <p>
            You can <strong>take the tie</strong>: stop here, and you and Ben
            replay 10-3 High from scratch while Ava is safe. Or you can roll
            your kicker, both 5s together, hoping to beat 10.
          </p>
          <p>
            Rolling two fresh dice for your kicker, you have only an{' '}
            <strong>{pct1(TIE_ODDS.better)}</strong> chance of improving (5+6,
            6+5, 6+6) and a{' '}
            <strong>{pct1(TIE_ODDS.better + TIE_ODDS.equal)}</strong> chance of
            getting the same value or better (adding 4+6, 5+5, 6+4).
          </p>
          <p>
            If you only had 1 roll left, you'd lose outright{' '}
            {pct1(TIE_ODDS.worse)} of the time. With your 2 rolls, you take the
            pencil about <strong>{pct(TIE_ODDS.loseIfRoll)}</strong> of the
            time.
          </p>
          <p>
            Take the tie, and the replay is an even contest: you and Ben each
            make 10-3 {pct(MAKE[3])} of the time over three rolls, so you take
            the pencil <strong>{pct(TIE_ODDS.loseIfTie)}</strong> of the time.{' '}
            {pct(TIE_ODDS.loseIfTie)} beats {pct(TIE_ODDS.loseIfRoll)}:{' '}
            <strong>take the tie</strong>.
          </p>
          <details className="rounded-md border border-border p-3">
            <summary className="cursor-pointer font-medium">
              How the math works
            </summary>
            <div className="mt-2 space-y-2">
              <p className="font-medium">Rolling your kicker</p>
              <ul className="list-disc space-y-1 pl-5">
                <li>
                  Two dice have 36 equally likely results: 3 beat 10 (3/36 ={' '}
                  {pct1(TIE_ODDS.better)}), 3 tie it ({pct1(TIE_ODDS.equal)})
                  and 30 fall short ({pct1(TIE_ODDS.worse)}).
                </li>
                <li>
                  Miss both rolls: multiply the chances, 30/36 × 30/36 ={' '}
                  {pct1(MISS_TWICE)}. You lose outright.
                </li>
                <li>
                  Tie along the way, on the first roll ({pct1(TIE_ODDS.equal)})
                  or on the second after missing the first (
                  {pct1(TIE_ODDS.worse)} × {pct1(TIE_ODDS.equal)} ={' '}
                  {pct1(TIE_LATER)}): you take the tie then and lose half of
                  those replays, ½ × ({pct1(TIE_ODDS.equal)} + {pct1(TIE_LATER)}
                  ) = {pct1(LOSE_VIA_TIE)}.
                </li>
                <li>
                  Add them up: {pct1(MISS_TWICE)} + {pct1(LOSE_VIA_TIE)} ={' '}
                  <strong>{pct1(TIE_ODDS.loseIfRoll)}</strong> that you take the
                  pencil.
                </li>
              </ul>
              <p className="font-medium">The replay against Ben</p>
              <ul className="list-disc space-y-1 pl-5">
                <li>
                  Making 10-3 from fresh dice: {pct1(MAKE[1])} on the first
                  roll, {pct1(MAKE[2])} within two and {pct1(MAKE[3])} within
                  all three. Ben has the same chances.
                </li>
                <li>
                  You make it and Ben misses: {pct1(MAKE[3])} ×{' '}
                  {pct1(1 - MAKE[3])} = {pct1(ONE_MISSES)}, a win. Ben makes it
                  and you miss: also {pct1(ONE_MISSES)}, a loss. Both miss (
                  {((1 - MAKE[3]) ** 2 * 100).toFixed(2)}%): you replay again.
                </li>
                <li>
                  Both make it ({pct1(MAKE[3] ** 2)}): the higher kicker wins.
                  You're both rolling the same dice with the same choices, so
                  each of you comes out ahead half the time (a tied kicker means
                  another replay).
                </li>
                <li>
                  Every step is the same for both of you, so the replay is{' '}
                  <strong>{pct(TIE_ODDS.loseIfTie)}</strong> either way.
                </li>
              </ul>
            </div>
          </details>
        </>
      ),
      action: (
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => {
              actFrom(withDice(game, TIE_PATH_DICE), {
                type: 'stand',
                player: 'you',
              })
              setStep('replay')
            }}
          >
            Take the tie
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              actFrom(withDice(game, ROLL_PATH_DICE), {
                type: 'reroll',
                player: 'you',
                keep: mine.hand.gameDice,
              })
              setStep('lucky')
            }}
          >
            Roll my kicker
          </Button>
        </div>
      ),
    },
    replay: {
      title: 'You and Ben replay 10-3 High',
      body: (
        <>
          <p>
            Tied players replay the same call, High included, with fresh dice
            and three rolls. Everyone else is safe, so Ava is out of this one.
          </p>
          <p>
            You roll {mine.text}: the best kicker possible. Ben rolls {ben.text}
            .
          </p>
        </>
      ),
      action: (
        <Button
          onClick={() => {
            act(...BEN_REPLAY_ROLLS)
            setStep('benReplay')
          }}
        >
          Next: Ben rolls
        </Button>
      ),
    },
    benReplay: {
      title: 'Ben chases your 12',
      body: (
        <p>
          Ben keeps his 10 and re-rolls his kicker, twice. He ends on a kicker
          of {ben.text.split('kicker ')[1]} and he's out of rolls. Nothing can
          beat your 12, so you're done rolling.
        </p>
      ),
      action: (
        <Button
          onClick={() => {
            act({ type: 'stand', player: 'you' })
            setStep('done')
          }}
        >
          Stop rolling
        </Button>
      ),
    },
    lucky: {
      title: mine.made ? `Kicker ${mine.total}: that paid off` : 'Your roll',
      body: (
        <p>
          {mine.text}. You beat Ben's 10, but it was a long shot: only{' '}
          {pct1(TIE_ODDS.better)} of rolls do that. Next time, take the tie. You
          still have a roll, but you're safe now, so stop rolling.
        </p>
      ),
      action: (
        <Button
          onClick={() => {
            act({ type: 'stand', player: 'you' })
            setStep('done')
          }}
        >
          Stop rolling
        </Button>
      ),
    },
    done: {
      title: 'Ben takes a pencil',
      body: (
        <>
          <p>
            Ben has the weakest hand, so he takes a pencil, and he's the Hammer
            next round. Three pencils and you're out; the last player standing
            wins the pot.
          </p>
          <p>That's a whole round. Real rounds add a few twists:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              If exactly one player <strong>misses</strong> the game, they lose,
              however good everyone else's kicker is.
            </li>
            <li>
              The Hammer can <T to="bark">bark</T> instead of calling: the
              Hammer passes left and everyone re-rolls.
            </li>
            <li>
              10-2 leaves a <strong>three-dice</strong> kicker, re-rolled whole,
              so a total near the top or bottom of the range is very hard to
              beat.
            </li>
            <li>Tres Away, Boss and Razzle each play a little differently.</li>
          </ul>
        </>
      ),
      action: (
        <div className="flex flex-wrap gap-2">
          <Link to="/rules" className={buttonVariants()}>
            Read the full rules
          </Link>
          <Link to="/games" className={buttonVariants({ variant: 'outline' })}>
            Explore the 10 games
          </Link>
          <Button variant="ghost" onClick={restart}>
            Play the round again
          </Button>
        </div>
      ),
    },
  }

  const current = steps[step]
  const seats = refusalSeats(game)
  const role =
    game.phase.kind === 'roundOver'
      ? { [game.hammer]: '🔨 Next Hammer' }
      : {
          [game.hammer]: '🔨 Hammer',
          [seats.first]: '1st refusal',
          [seats.second]: '2nd refusal',
        }
  const decisions = {}
  let replaying = null
  game.log.forEach((e) => {
    if (e.type === 'refused') decisions[e.player] = 'Refused'
    if (e.type === 'accepted') decisions[e.player] = 'Accepted'
    if (e.type === 'stood') decisions[e.player] = 'Done rolling'
    if (e.type === 'cycle') {
      replaying = e.players
      e.players.forEach((id) => (decisions[id] = 'Replaying'))
    }
  })
  if (replaying) {
    PLAYERS.forEach((p) => {
      if (!replaying.includes(p.id)) decisions[p.id] = 'Safe'
    })
  }

  return (
    <div className="space-y-6">
      {/* The table */}
      <div className="grid gap-3 sm:grid-cols-3">
        {PLAYERS.map((p) => {
          const seat = game.seats.find((s) => s.id === p.id)
          const dice =
            step === 'welcome' && p.id === 'you'
              ? [null, null, null, null, null]
              : view.dice[p.id]
          const status = inPlay ? describeHand(game.dice[p.id]) : null
          const isLoser =
            game.phase.kind === 'roundOver' && game.phase.loser === p.id
          return (
            <div
              key={p.id}
              className={cn(
                'rounded-lg border bg-card p-3',
                p.id === 'you' && 'border-primary/60',
                isLoser && 'border-destructive'
              )}
            >
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className="font-semibold">{p.name}</span>
                {role[p.id] && <Badge variant="secondary">{role[p.id]}</Badge>}
                {decisions[p.id] && (
                  <Badge variant="outline">{decisions[p.id]}</Badge>
                )}
                <span
                  className="ml-auto text-xs text-muted-foreground"
                  aria-label={`${seat.pencils} pencils`}
                >
                  {seat.pencils ? '✏️'.repeat(seat.pencils) : 'No pencils'}
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {(dice || [null, null, null, null, null]).map((d, i) => (
                  <Die
                    key={i}
                    value={d}
                    size={40}
                    rollId={rollIds[p.id][i]}
                    tone={
                      status?.made
                        ? status.hand.gameDice.includes(i)
                          ? 'game'
                          : 'kicker'
                        : undefined
                    }
                  />
                ))}
              </div>
              {status && (
                <p className="mt-2 text-xs text-muted-foreground">
                  {status.text}
                </p>
              )}
              {isLoser && (
                <p className="mt-1 text-xs font-semibold text-destructive">
                  Weakest hand: takes a pencil
                </p>
              )}
            </div>
          )
        })}
      </div>

      {/* Narration */}
      <div
        className="rounded-lg border bg-muted/30 p-4 sm:p-5"
        aria-live="polite"
      >
        <h2 className="mb-2 text-lg font-semibold">{current.title}</h2>
        <div className="space-y-2 text-sm leading-relaxed text-muted-foreground">
          {current.body}
        </div>
        {feedback && (
          <p className="mt-3 rounded-md border border-destructive/40 bg-destructive/10 p-2 text-sm text-foreground">
            {feedback}
          </p>
        )}
        <div className="mt-4">{current.action}</div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
        <DiceSettings />
        {step !== 'welcome' && (
          <button
            type="button"
            onClick={restart}
            className="underline-offset-2 hover:underline"
          >
            Start over
          </button>
        )}
      </div>
    </div>
  )
}

export default Tutorial
