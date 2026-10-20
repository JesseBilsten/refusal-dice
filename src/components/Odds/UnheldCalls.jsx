import React from 'react'
import { Link } from 'gatsby'
import { formatCallLabel, getGameName } from '../../lib/games-config'
import { KICKER_GAMES } from '../../engine'
import { CALL_ODDS_PLAYERS, CALL_TIE, chooseCall, freshMakeChance, heldOrNot } from '../../strategy'
import { Hand } from '../Dice'
import ProbabilityBar from './ProbabilityBar'
import { fmtPct } from './model'

/**
 * Calling a game you don't have: why it can work (misses cycle, so a hard
 * game shares the risk), why it rarely does (most players make even 10-4
 * within three rolls), and how often it beats the best game you hold, as a
 * first call and as a second call. From make-odds.ts and call-odds.ts.
 */
export default function UnheldCalls({ className }) {
  const first = heldOrNot()
  const second = heldOrNot({ secondCall: true })
  const edge = (r) => r.held.loss - r.unheld.loss
  const wins = (rows) => rows.filter((r) => edge(r) > 0)
  const firstWins = wins(first)
  const secondWins = wins(second)
  const most = Math.max(edge(first[0]), edge(second[0]), 0)
  const count = (rows) => (rows.length ? `with ${rows.length} of 252 rolls` : 'with none of the 252 rolls')
  const example = second[0]
  const hard = [...KICKER_GAMES].sort((a, b) => freshMakeChance(a) - freshMakeChance(b))[0]

  return (
    <div className={className}>
      <p className="text-sm">
        <strong>How it can work.</strong> You take the pencil only if you finish last. Missing the game is the worst
        result, but when two or more players miss, they all play another cycle of the same game until one loser is
        left. So in a game that’s hard to make, a miss is often shared, while in an easy game a made hand with a poor
        kicker can still finish last.
      </p>
      <p className="mt-3 text-sm">
        <strong>Why it rarely does.</strong> Everyone gets three rolls, not one. A game few players make on the first
        roll is one most of them make by the third, so “nobody will have it” is seldom true:
      </p>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full text-sm">
          <caption className="sr-only">Chance of making each kicker game from a fresh roll</caption>
          <thead className="text-left text-xs text-muted-foreground">
            <tr>
              <th scope="col" className="py-1 pr-3 font-medium">Game</th>
              <th scope="col" className="py-1 pr-3 text-right font-medium">On the first roll</th>
              <th scope="col" className="py-1 text-right font-medium">Within three rolls</th>
            </tr>
          </thead>
          <tbody className="tabular-nums">
            {KICKER_GAMES.map((g) => (
              <tr key={g} className="border-t border-border">
                <th scope="row" className="py-1.5 pr-3 text-left font-medium">{getGameName(g)}</th>
                <td className="py-1.5 pr-3 text-right">{fmtPct(freshMakeChance(g, 1), 1)}</td>
                <td className="py-1.5 text-right font-semibold">{fmtPct(freshMakeChance(g, 3), 1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        Exact, keeping the best dice between rolls. Even {getGameName(hard)}, the hardest, is made{' '}
        {fmtPct(freshMakeChance(hard, 3))} of the time within three rolls.
      </p>

      <p className="mt-4 text-sm">
        <strong>How to compare.</strong> Every call has a chance of the pencil for your roll: how often you’d take it if
        everyone played that call. Find the best call you hold (a game you’ve made, or Tres Away, Boss or Razzle, which
        every roll plays) and the best one you don’t, and call the lower. When they’re within{' '}
        {Math.round(CALL_TIE * 100)} points, the numbers can’t tell them apart, so call the game you hold.{' '}
        <Link to="/strategy-assistant" className="text-primary hover:underline">
          The Strategy Assistant ranks every call for your roll
        </Link>
        .
      </p>

      <p className="mt-4 text-sm">
        <strong>When it makes sense.</strong> Hardly ever, and never by much. As a first call, a game you don’t hold
        beats your best game {count(firstWins)}. As a second call, after your best game is refused,{' '}
        {count(secondWins)}, and never by more than {fmtPct(most, 1)}, inside the noise. The closest case is a
        second call, when the games you have left are weak:
      </p>
      {edge(example) > 0 && (
        <figure className="mt-3 rounded-md border border-border p-3">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <Hand dice={example.dice} size="sm" game={example.held.call.game} variant={example.held.call.variant} />
            <span className="text-muted-foreground">after {formatCallLabel(chooseCall(example.dice))} is refused</span>
          </div>
          <div className="mt-3 space-y-2">
            <ProbabilityBar
              className="grid-cols-[minmax(0,7.5rem)_1fr_auto] gap-2 sm:grid-cols-[minmax(0,10rem)_1fr_auto] sm:gap-3"
              label={`${formatCallLabel(example.held.call)} (held)`}
              p={example.held.loss}
              tone="lose"
            />
            <ProbabilityBar
              className="grid-cols-[minmax(0,7.5rem)_1fr_auto] gap-2 sm:grid-cols-[minmax(0,10rem)_1fr_auto] sm:gap-3"
              label={`${formatCallLabel(example.unheld.call)} (not held)`}
              p={example.unheld.loss}
              tone="lose"
            />
          </div>
          <figcaption className="mt-2 text-xs text-muted-foreground">
            A gap of {fmtPct(edge(example), 1)}, too small to trust: call {formatCallLabel(example.held.call)}.
          </figcaption>
        </figure>
      )}
      <p className="mt-4 text-sm">
        <strong>When it doesn’t.</strong> Every other time. A made game, even with a poor kicker, starts you ahead of
        anyone who still has to make it, and you get three rolls to improve the kicker. Chances are from rounds played
        out by solid bots at a {CALL_ODDS_PLAYERS}-player table, everyone playing the call.
      </p>
    </div>
  )
}
