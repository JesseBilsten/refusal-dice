import React, { useState } from 'react'
import { Link } from 'gatsby'
import { Chip } from '../Page'
import SeatRing from '../Table/SeatRing'
import { SEAT_ODDS_SAMPLES, seatOdds } from '../../strategy'

const pct = (p) => `${Math.round(p * 100)}%`

/**
 * The table from above, twice: when you call (you hold the Hammer) and
 * after you bark (the Hammer passes left and you sit last). Each seat shows
 * its chance of the pencil with random dice, from seat-odds.ts.
 */
export function BarkRings({ players }) {
  const odds = seatOdds(players)
  const even = 1 / players
  // Seats clockwise from yours. Calling: you're the Hammer, seat i is i to your left.
  const call = odds.map((value, i) => ({ value, hammer: i === 0, you: i === 0 }))
  // Barking: the Hammer is on your left, so you're last; seat i is (i - 1) seats left of the new Hammer
  const bark = odds.map((_, i) => ({ value: odds[(i - 1 + players) % players], hammer: i === 1, you: i === 0 }))
  return (
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
  )
}

/** The table-size picker shared by the bark views */
export function PlayersPicker({ players, onChange, className }) {
  return (
    <div className={className ?? 'flex flex-wrap items-center gap-1.5'} role="group" aria-label="Players at the table">
      <span className="mr-1 text-sm font-medium">Players</span>
      {[2, 3, 4, 5, 6, 7, 8].map((n) => (
        <Chip key={n} active={players === n} onClick={() => onChange(n)}>
          {n}
        </Chip>
      ))}
    </div>
  )
}

/**
 * What a bark is worth, drawn (BarkRings) with a table-size picker and a
 * short explanation. On the Games page's Bark card.
 */
export default function BarkOdds({ className }) {
  const [players, setPlayers] = useState(3)
  const odds = seatOdds(players)
  const even = 1 / players
  const others = odds.slice(1)
  const low = Math.min(...others)
  const high = Math.max(...others)
  return (
    <div className={className}>
      <PlayersPicker players={players} onChange={setPlayers} className="mb-4 flex flex-wrap items-center gap-1.5" />
      <BarkRings players={players} />
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
    </div>
  )
}
