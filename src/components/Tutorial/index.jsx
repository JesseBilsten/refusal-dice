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
import {
  Disclosure,
  MathSteps,
  OddsDecision,
  OddsLabLink,
  OutcomeGrid,
  Questions,
  fmtPct,
} from '../Odds'
import {
  AT_THE_LINE,
  LAB,
  LOSE_VIA_TIE,
  MAKE,
  MISS_TWICE,
  ROLL_UP_TO,
  TIED_AT,
  TIE_ALONG_THE_WAY,
  TIE_ODDS,
  WAYS,
} from './tie-odds'
import { Button, buttonVariants } from '../ui/button'
import {
  DiceSettings,
  DieSlot,
  Hand,
  RollButton,
  playRollSound,
  useDicePrefs,
} from '../Dice'
import Seat from '../Table/Seat'
import { Panel, Term } from '../Page'

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
            start of the game everyone <Term id="piddle">piddles</Term> (rolls one
            die), and you rolled highest, so you hold the{' '}
            <Term id="hammer">Hammer</Term>: you'll call the game this round.
          </p>
          <p>
            Whoever has the worst hand at the end of the round takes a{' '}
            <Term id="pencil">pencil</Term>. Let's play one.
          </p>
        </>
      ),
      action: <RollButton onClick={firstRoll}>Roll the dice</RollButton>,
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
            <Term id="kicker">kicker</Term> wins. The kicker is all the dice left over
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
          <Term id="first-refusal">1st refusal</Term>, then the{' '}
          <Term id="second-refusal">2nd refusal</Term>.
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
          <p>
            Now the <strong>worst hand rolls first</strong>: right now that
            player is the loser. They keep rolling until they climb off the
            bottom or run out of rolls. If they never get off it, nobody else
            has to roll. Ava's kicker of 7 is the worst.
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
          Next: Ava rolls
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
            6+6 = 12, the best possible. She's off the bottom, so her turn
            ends. Ben's 8 is the worst hand now.
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
            Ben keeps 6+3+1 and re-rolls his kicker, the 6 and the 2. He gets
            5+4 = 9: still the worst hand, so he rolls again, and gets a kicker
            of {ben.text.split('kicker ')[1]}. That was his third roll.
          </p>
          <p>
            Now look at the table: your kicker (10) <strong>ties</strong> Ben's
            for the weakest hand, and Ben is out of rolls, so it's your move.
            You haven't rolled again yet: you have 2 rolls left.
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
            You're tied with Ben at {TIED_AT}, and he's done rolling. You can{' '}
            <strong>take the tie</strong> (you and Ben replay 10-3 High; Ava is
            safe) or <strong>roll your kicker</strong> with your 2 rolls left.
          </p>
          <OddsDecision
            outcome="take the pencil"
            options={[
              {
                id: 'tie',
                label: 'Take the tie',
                segments: [
                  {
                    p: TIE_ODDS.loseIfTie,
                    label: 'lose the replay (a coin flip)',
                    kind: 'coin',
                  },
                ],
              },
              {
                id: 'roll',
                label: 'Roll your kicker',
                segments: [
                  {
                    p: MISS_TWICE,
                    label: 'miss 10 on both rolls',
                    kind: 'lose',
                  },
                  {
                    p: LOSE_VIA_TIE,
                    label: 'roll exactly 10, then lose the replay',
                    kind: 'coin',
                  },
                ],
              },
            ]}
          />
          <OutcomeGrid
            title="Each roll of your kicker: all 36 ways"
            classify={(a, b) =>
              a + b > TIED_AT ? 'better' : a + b === TIED_AT ? 'equal' : 'worse'
            }
            kinds={{
              better: {
                label: `Beats ${TIED_AT}: you're safe`,
                kind: 'safe',
                mark: '✓',
              },
              equal: { label: 'Ties again: a replay', kind: 'coin', mark: '=' },
              worse: {
                label: 'Falls short: roll again, or lose on your last roll',
                kind: 'lose',
              },
            }}
          />
          <Disclosure title="How the math works">
            <MathSteps
              title="Roll your kicker"
              steps={[
                {
                  label: 'Miss 10 on both rolls',
                  expr: `${WAYS.worse}/36 × ${WAYS.worse}/36`,
                  result: fmtPct(MISS_TWICE, 1),
                },
                {
                  label: 'Roll exactly 10 (first roll, or second after a miss)',
                  expr: `${WAYS.equal}/36 + ${WAYS.worse}/36 × ${WAYS.equal}/36`,
                  result: fmtPct(TIE_ALONG_THE_WAY, 1),
                },
                {
                  label: '…then lose that replay',
                  expr: `½ × ${fmtPct(TIE_ALONG_THE_WAY, 1)}`,
                  result: fmtPct(LOSE_VIA_TIE, 1),
                },
                {
                  label: 'Chance you take the pencil',
                  expr: `${fmtPct(MISS_TWICE, 1)} + ${fmtPct(LOSE_VIA_TIE, 1)}`,
                  result: fmtPct(TIE_ODDS.loseIfRoll, 1),
                  total: true,
                },
              ]}
            />
            <MathSteps
              title="Take the tie"
              steps={[
                {
                  label: 'Chance you take the pencil',
                  expr: '1 of 2 players loses the replay',
                  result: fmtPct(TIE_ODDS.loseIfTie, 1),
                  total: true,
                },
              ]}
            />
            <p className="text-muted-foreground">
              "And" multiplies (miss, and miss again). "Or" adds (miss twice, or
              tie and lose the replay).
            </p>
            <div className="space-y-1">
              <p className="font-medium">See every roll in the Odds Lab</p>
              <ul className="space-y-1">
                <li>
                  <OddsLabLink query={LAB.kickerBeats}>
                    Your kicker beating {TIED_AT}
                  </OddsLabLink>
                </li>
                <li>
                  <OddsLabLink query={LAB.kickerReaches}>
                    Your kicker reaching {TIED_AT} or better
                  </OddsLabLink>
                </li>
                <li>
                  <OddsLabLink query={LAB.make103} compare="10-3">
                    Making 10-3 on one roll of five dice
                  </OddsLabLink>
                </li>
              </ul>
            </div>
          </Disclosure>
          <Disclosure title="Questions">
            <Questions
              items={[
                {
                  q: "Isn't a tie safe?",
                  a: 'No. A tie means you and Ben replay the round, and you lose half of replays.',
                },
                {
                  q: `${WAYS.better + WAYS.equal} of 36 rolls reach ${TIED_AT}. Why does rolling still lose so often?`,
                  a: `Only ${WAYS.better} of them beat ${TIED_AT}. The other ${WAYS.equal} tie again, which leaves you facing the same replay.`,
                },
                {
                  q: `One roll misses ${fmtPct(TIE_ODDS.worse)} of the time. Why is rolling only ${fmtPct(TIE_ODDS.loseIfRoll)}?`,
                  a: `You have two rolls, so you only lose outright if both miss (${fmtPct(MISS_TWICE)}). The rest is ties you go on to lose.`,
                },
                {
                  q: 'Why is the replay 50/50?',
                  a: `You and Ben start over with the same dice and three rolls each. Each of you makes 10-3 ${fmtPct(MAKE[3])} of the time (${fmtPct(MAKE[1])} on the first roll), then the higher kicker wins. Neither of you has an edge.`,
                },
                {
                  q: 'Can I keep one 5 and roll the other?',
                  a: 'No. Your kicker is rolled whole: both dice or neither.',
                },
                {
                  q: 'When should I roll instead?',
                  a: `With 2 rolls left, roll when you're tied at ${ROLL_UP_TO} or lower. At ${AT_THE_LINE[0].total}, rolling loses ${fmtPct(AT_THE_LINE[0].loseIfRoll)} of the time; at ${AT_THE_LINE[1].total}, ${fmtPct(AT_THE_LINE[1].loseIfRoll)}. The replay is always 50%.`,
                },
              ]}
            />
          </Disclosure>
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
          Ben has the worst hand, so he rolls and you wait. He keeps his 10
          and re-rolls his kicker, twice, and ends on a kicker of{' '}
          {ben.text.split('kicker ')[1]}. He's out of rolls and still at the
          bottom. You never had to roll.
        </p>
      ),
      action: <Button onClick={() => setStep('done')}>Next: the pencil</Button>,
    },
    lucky: {
      title: mine.made ? `Kicker ${mine.total}: that paid off` : 'Your roll',
      body: (
        <p>
          {mine.text}. You beat Ben's 10, but it was a long shot: only{' '}
          {fmtPct(TIE_ODDS.better, 1)} of rolls do that. Next time, take the
          tie. You're off the bottom, and Ben, the worst hand now, is out of
          rolls.
        </p>
      ),
      action: <Button onClick={() => setStep('done')}>Next: the pencil</Button>,
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
              The Hammer can <Term id="bark">bark</Term> instead of calling: the
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
          <Link to="/play" className={buttonVariants()}>
            Play a full game against bots
          </Link>
          <Link to="/rules" className={buttonVariants({ variant: 'outline' })}>
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
          const unrolled = step === 'welcome' && p.id === 'you'
          const dice = unrolled
            ? [null, null, null, null, null]
            : view.dice[p.id]
          const status = inPlay ? describeHand(game.dice[p.id]) : null
          const isLoser =
            game.phase.kind === 'roundOver' && game.phase.loser === p.id
          return (
            <Seat
              key={p.id}
              name={p.name}
              you={p.id === 'you'}
              loser={isLoser}
              badges={role[p.id] ? [role[p.id]] : []}
              decision={decisions[p.id]}
              pencils={seat.pencils}
              status={
                <>
                  {status && <p>{status.text}</p>}
                  {isLoser && (
                    <p className="mt-1 font-semibold text-destructive">
                      Weakest hand: takes a pencil
                    </p>
                  )}
                </>
              }
            >
              {unrolled ? (
                // Your dice before the first roll: empty slots, as in RollInput
                <span className="flex gap-2" role="img" aria-label="Not rolled yet">
                  {dice.map((_, i) => (
                    <DieSlot key={i} />
                  ))}
                </span>
              ) : (
                <Hand
                  dice={dice || [null, null, null, null, null]}
                  game={inPlay ? CALL.game : null}
                  variant={CALL.variant}
                  rollIds={rollIds[p.id]}
                />
              )}
            </Seat>
          )
        })}
      </div>

      {/* Narration */}
      <Panel tone="tool" as="div" title={current.title} aria-live="polite">
        <div className="space-y-2 text-sm leading-relaxed text-muted-foreground">
          {current.body}
        </div>
        {feedback && (
          <p className="mt-3 rounded-md border border-destructive/40 bg-destructive/10 p-2 text-sm text-foreground">
            {feedback}
          </p>
        )}
        <div className="mt-4">{current.action}</div>
      </Panel>

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
