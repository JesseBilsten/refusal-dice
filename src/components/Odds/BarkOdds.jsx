import React, { useState } from 'react'
import { Link } from 'gatsby'
import { Chip } from '../Page'
import SeatRing from '../Table/SeatRing'
import BarkHands from './BarkHands'
import { SEAT_ODDS_SAMPLES, seatOdds } from '../../strategy'

const pct = (p) => `${Math.round(p * 100)}%`

/**
 * What a bark is worth, drawn: the table when you call (you hold the
 * Hammer) beside the table after you bark (the Hammer passes left and you
 * sit last). Each seat shows its chance of the pencil with random dice,
 * from seat-odds.ts. `hands`: also rank every roll by its best call
 * against the bark, at the same table size (BarkHands).
 */
export default function BarkOdds({ hands, className }) {
  const [players, setPlayers] = useState(3)
  const odds = seatOdds(players)
  const even = 1 / players
  // Seats clockwise from yours. Calling: you're the Hammer, seat i is i to your left.
  const call = odds.map((value, i) => ({ value, hammer: i === 0, you: i === 0 }))
  // Barking: the Hammer is on your left, so you're last; seat i is (i - 1) seats left of the new Hammer
  const bark = odds.map((_, i) => ({ value: odds[(i - 1 + players) % players], hammer: i === 1, you: i === 0 }))
  const others = odds.slice(1)
  const low = Math.min(...others)
  const high = Math.max(...others)
  return (
    <div className={className}>
      <div className="mb-4 flex flex-wrap items-center gap-1.5" role="group" aria-label="Players at the table">
        <span className="mr-1 text-sm font-medium">Players</span>
        {[2, 3, 4, 5, 6, 7, 8].map((n) => (
          <Chip key={n} active={players === n} onClick={() => setPlayers(n)}>
            {n}
          </Chip>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3 sm:gap-6">
        <figure className="text-center">
          <SeatRing
            seats={call}
            even={even}
            label={`You call: you hold the Hammer and take the pencil ${pct(odds[0])} of the time`}
          />
          <figcaption className="mt-1 text-sm">
            <strong>You call</strong>
            <span className="block text-muted-foreground">You keep the Hammer: {pct(odds[0])}</span>
          </figcaption>
        </figure>
        <figure className="text-center">
          <SeatRing
            seats={bark}
            even={even}
            passTo={1}
            label={`You bark: the Hammer passes to your left, you sit last and take the pencil ${pct(odds[players - 1])} of the time`}
          />
          <figcaption className="mt-1 text-sm">
            <strong>You bark</strong>
            <span className="block text-muted-foreground">
              The Hammer passes left; you’re last: {pct(odds[players - 1])}
            </span>
          </figcaption>
        </figure>
      </div>
      <p className="mt-4 text-sm">
        Each seat shows its chance of the pencil when everyone holds a random hand. The Hammer picks the game to
        suit their dice, so they take the pencil only {pct(odds[0])} of the time; every other seat takes it{' '}
        {Math.round(low * 100) === Math.round(high * 100) ? pct(low) : `${Math.round(low * 100)}–${pct(high)}`}
        {players > 2 && ', wherever it sits'}. An even share is {pct(even)}. A bark hands that edge to the next
        player, so even the worst roll does better calling.{' '}
        <Link to="/strategy-assistant" className="text-primary hover:underline">
          Check your hand in the Strategy Assistant
        </Link>
        .
      </p>
      <p className="mt-2 text-xs text-muted-foreground">
        {SEAT_ODDS_SAMPLES.toLocaleString()} simulated rounds per table size, played out by the game engine with the
        site’s bots, who never bark. Stronger players who refuse more shrewdly may shrink the Hammer’s edge.
      </p>
      {hands && (
        <section className="mt-8 border-t border-border pt-6" aria-labelledby="bark-hands">
          <h3 id="bark-hands" className="mb-1 text-base font-semibold">
            Every roll against a bark, worst first
          </h3>
          <p className="mb-3 text-sm text-muted-foreground">
            The rolls most likely to take the pencil even with their best call. A roll would be worth barking if its bar
            ran past the tick.
          </p>
          <BarkHands players={players} />
        </section>
      )}
    </div>
  )
}
