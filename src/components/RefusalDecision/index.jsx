import React from 'react'
import { PRESETS } from '../../lib/roll-query'
import { formatCallLabel } from '../../lib/games-config'
import {
  Branches,
  Disclosure,
  MathSteps,
  OddsDecision,
  OddsLabLink,
  Questions,
  fmtPct,
} from '../Odds'
import { Hand } from '../Dice'
import { refusalView } from './odds'

/**
 * Accept or refuse, on the odds-decision pattern
 * (.claude/skills/explain-odds/SKILL.md). The odds are simulated with
 * simulateRefusal(); the numbers are built in ./odds.ts.
 */

const presetFor = (game) => PRESETS.find((p) => p.gameId === game)

export default function RefusalDecision({
  estimate,
  dice,
  call,
  position,
  players,
}) {
  const view = refusalView({
    estimate,
    dice,
    call,
    position,
    players,
    name: formatCallLabel,
  })
  const callName = formatCallLabel(call)
  const samples = estimate.accept.samples
  const pts = (p) => `±${(p * 100).toFixed(1)} pts`

  // Odds Lab links: the call, then the likeliest second calls
  const labGames = [
    call.game,
    ...estimate.secondCalls.map((sc) => sc.call.game),
  ].filter((g, i, all) => presetFor(g) && all.indexOf(g) === i)

  return (
    <div className="space-y-4">
      <p>
        The Hammer called <strong>{callName}</strong>, and you're the{' '}
        {position === 1 ? '1st' : '2nd'} refusal.{' '}
        {view.nextCanAccept
          ? 'If you refuse, the 2nd refusal decides next.'
          : 'If you refuse, the Hammer makes a second call.'}
      </p>

      <Hand dice={dice} game={call.game} variant={call.variant} />

      <OddsDecision
        outcome="take the pencil"
        options={view.options}
        tieMargin={view.tieMargin}
      />

      {view.branches.length > 0 && (
        <Branches
          title="If you refuse: what happens next"
          outcome="lose"
          rows={view.branches.slice(0, 8)}
          note={
            view.branches.length > 8
              ? `Plus ${view.branches.length - 8} rarer second calls.`
              : undefined
          }
        />
      )}

      <Disclosure title="How the math works">
        <MathSteps
          title="Refuse"
          steps={[
            ...view.refuseSteps.slice(0, -1),
            {
              ...view.refuseSteps[view.refuseSteps.length - 1],
              label: 'Chance you take the pencil',
            },
          ]}
        />
        <MathSteps
          title={`Accept ${callName}`}
          steps={[
            {
              label: 'Chance you take the pencil',
              expr: `lost ${Math.round(estimate.accept.pencil * samples)} of ${samples} rounds`,
              result: fmtPct(estimate.accept.pencil, 1),
              total: true,
            },
          ]}
        />
        {view.refuseSteps.length > 1 && (
          <p className="text-muted-foreground">
            "And" multiplies (the 2nd refusal accepts, and you lose). "Or" adds
            (one way of losing, or the other).
          </p>
        )}
        {labGames.length > 0 && (
          <div className="space-y-1">
            <p className="font-medium">See every roll in the Odds Lab</p>
            <ul className="space-y-1">
              {labGames.slice(0, 4).map((g) => (
                <li key={g}>
                  <OddsLabLink query={presetFor(g).query} compare={g}>
                    Making {formatCallLabel({ game: g })} on one roll of five
                    dice
                  </OddsLabLink>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Disclosure>

      <Disclosure title="Questions">
        <Questions
          items={[
            {
              q: 'Do I get new dice if I refuse?',
              a: 'No. You keep this roll whatever is played. Refusing only changes which game you play it in.',
            },
            {
              q: 'What happens if I refuse?',
              a: view.nextCanAccept
                ? 'The 2nd refusal accepts or refuses next. If they refuse too, the Hammer makes a second call: a different game, which nobody can refuse.'
                : 'The Hammer makes a second call: a different game, which nobody can refuse.',
            },
            {
              q: 'Why can refusing be worse, even with weak dice?',
              a: "The Hammer picks the second call to suit their dice, not yours. It can be a game your roll can't make at all.",
            },
            ...(view.makeIt != null
              ? [
                  {
                    q: `How likely am I to make ${callName} from this roll?`,
                    a:
                      view.makeIt === 1
                        ? "You already have it. Making it isn't enough on its own, though: the weakest hand still loses."
                        : `${fmtPct(view.makeIt)}, using both re-rolls well (exact). Making it isn't enough on its own: the weakest hand still loses.`,
                  },
                ]
              : []),
            {
              q: "What's an average chance?",
              a: `At a ${players}-player table, an average player takes the pencil 1 time in ${players} (${fmtPct(1 / players)}).`,
            },
            {
              q: 'How sure are these numbers?',
              a: `They depend on what everyone else rolls and decides, so the site plays this round out ${samples.toLocaleString()} times with the game engine and solid bot players (you included, after this choice). Each figure is within about ${pts(view.tieMargin / 2)}, so a gap under ${pts(view.tieMargin).slice(1)} is a toss-up.`,
            },
          ]}
        />
      </Disclosure>

      <p className="text-xs text-muted-foreground">
        Simulated: {samples.toLocaleString()} rounds at a {players}-player table
        against solid bot players, not perfect ones. Other players' dice are
        random, with the Hammer's drawn to fit their call.
      </p>
    </div>
  )
}
