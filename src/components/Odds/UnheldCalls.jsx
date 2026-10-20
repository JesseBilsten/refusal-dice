import React from 'react'
import { Link } from 'gatsby'
import { formatCallLabel, getGameName } from '../../lib/games-config'
import { KICKER_GAMES } from '../../engine'
import { CALL_ODDS_PLAYERS, CALL_TIE, chooseCall, freshMakeChance, heldOrNot } from '../../strategy'
import { Hand } from '../Dice'
import ProbabilityBar from './ProbabilityBar'
import { fmtPct } from './model'

const BAR = 'grid-cols-[minmax(0,7.5rem)_1fr_auto] gap-2 sm:grid-cols-[minmax(0,10rem)_1fr_auto] sm:gap-3'

/**
 * Calling a game you don't have, plainly: most players make even a hard
 * game within three rolls, so it almost never beats the best game you hold.
 * Exact make odds (make-odds.ts), then how often it wins (call-odds.ts).
 */
export default function UnheldCalls({ rules, className }) {
  const first = heldOrNot({ rules })
  const second = heldOrNot({ secondCall: true, rules })
  const make = (g, rolls) => freshMakeChance(g, rolls, rules)
  const edge = (r) => r.held.loss - r.unheld.loss
  const firstWins = first.filter((r) => edge(r) > 0).length
  const secondWins = second.filter((r) => edge(r) > 0).length
  const example = second[0]
  const hard = [...KICKER_GAMES].sort((a, b) => make(a, 3) - make(b, 3))[0]

  return (
    <div className={className}>
      <p>
        <strong>Almost never worth it.</strong> “Nobody will have it” is true on the first roll, not by the third.{' '}
        {getGameName(hard)} is made {fmtPct(make(hard, 1))} of the time on the first roll, but{' '}
        {fmtPct(make(hard, 3))} within three.
      </p>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full text-sm">
          <caption className="sr-only">Chance of making each kicker game from a fresh roll</caption>
          <thead className="text-left text-xs text-muted-foreground">
            <tr>
              <th scope="col" className="py-1 pr-3 font-medium">Game</th>
              <th scope="col" className="py-1 pr-3 text-right font-medium">First roll</th>
              <th scope="col" className="py-1 text-right font-medium">Within three</th>
            </tr>
          </thead>
          <tbody className="tabular-nums">
            {KICKER_GAMES.map((g) => (
              <tr key={g} className="border-t border-border">
                <th scope="row" className="py-1.5 pr-3 text-left font-medium">{getGameName(g)}</th>
                <td className="py-1.5 pr-3 text-right">{fmtPct(make(g, 1), 1)}</td>
                <td className="py-1.5 text-right font-semibold">{fmtPct(make(g, 3), 1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3">
        <strong>How to compare:</strong> find your best call that you hold (a game you’ve made, or Tres Away, Boss or
        Razzle, which every roll plays) and your best one you don’t. Call the lower chance of the pencil; within{' '}
        {Math.round(CALL_TIE * 100)} points, call the one you hold.{' '}
        <Link to="/strategy-assistant" className="text-primary hover:underline">
          The Strategy Assistant ranks every call for your roll
        </Link>
        .
      </p>
      <p className="mt-3">
        <strong>How often a game you don’t hold wins:</strong> {firstWins ? `${firstWins} of 252 rolls` : 'never'} as a
        first call, {secondWins ? `${secondWins} of 252` : 'never'} as a second call, and only by a hair. Missing is
        shared when two or more miss (they play another cycle), but a made game still starts you ahead.
      </p>
      {edge(example) > 0 && (
        <figure className="mt-3 rounded-md border border-border p-3">
          <figcaption className="flex flex-wrap items-center gap-2">
            <span className="text-muted-foreground">The closest case:</span>
            <Hand dice={example.dice} size="sm" game={example.held.call.game} variant={example.held.call.variant} />
            <span className="text-muted-foreground">after {formatCallLabel(chooseCall(example.dice, undefined, rules))} is refused</span>
          </figcaption>
          <div className="mt-3 space-y-2">
            <ProbabilityBar className={BAR} label={`${formatCallLabel(example.held.call)} (held)`} p={example.held.loss} tone="lose" />
            <ProbabilityBar className={BAR} label={`${formatCallLabel(example.unheld.call)} (not held)`} p={example.unheld.loss} tone="lose" />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {fmtPct(edge(example), 1)} apart, too close to trust: call {formatCallLabel(example.held.call)}.
          </p>
        </figure>
      )}
      <p className="mt-3 text-xs text-muted-foreground">
        Make odds are exact. Call odds are from rounds played by solid bots at a {CALL_ODDS_PLAYERS}-player table,
        everyone playing the call.
      </p>
    </div>
  )
}
