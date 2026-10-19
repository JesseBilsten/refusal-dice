import React from 'react'
import { formatCallLabel } from '../../lib/games-config'
import { Hand } from '../Dice'
import { HAMMER_ODDS_SAMPLES, HAMMER_ODDS_SIZES, SEAT_ODDS_SAMPLES, barkOdds, barkTable } from '../../strategy'
import { fmtPct } from './model'

const diceText = (dice) => dice.join('-')
const worstBy = (rows, pick) => rows.reduce((w, r) => (pick(r).loss > pick(w).loss ? r : w))

/**
 * The case for calling over barking, from the generated hammer-odds.ts and
 * seat-odds.ts: at every table size, the worst roll's best call against a
 * bark, with and without 10-4; then why, and what the numbers don't cover.
 */
export default function BarkCase({ className }) {
  const sizes = HAMMER_ODDS_SIZES.map((players) => {
    const rows = barkTable(players)
    const bark = barkOdds(players)
    const worst = rows[0]
    const worstAlt = worstBy(rows, (r) => r.alt)
    return {
      players,
      bark,
      worst,
      worstAlt,
      barkWins: rows.filter((r) => r.best.loss > bark).length,
      barkWinsAlt: rows.filter((r) => r.alt.loss > bark).length,
    }
  })
  const never = sizes.every((s) => s.barkWins === 0)
  const neverAlt = sizes.every((s) => s.barkWinsAlt === 0)
  const closest = sizes.reduce((c, s) => (s.worst.best.loss / s.bark > c.worst.best.loss / c.bark ? s : c))
  const closestAlt = sizes.reduce((c, s) => (s.worstAlt.alt.loss / s.bark > c.worstAlt.alt.loss / c.bark ? s : c))
  const swapped = barkTable(closestAlt.players).filter((r) => r.best.call.game === '10-4')
  const altCalls = Object.entries(
    swapped.reduce((n, r) => ({ ...n, [formatCallLabel(r.alt.call)]: (n[formatCallLabel(r.alt.call)] || 0) + 1 }), {})
  ).sort((a, b) => b[1] - a[1])

  return (
    <div className={className}>
      <p className="text-sm">
        {never ? (
          <>
            <strong>Barking never pays against solid players, at any table size.</strong> The worst roll you can hold
            the Hammer with still takes the pencil less often with its best call than a bark gives you. It comes
            closest at {closest.players} players, {fmtPct(closest.worst.best.loss, 1)} calling against{' '}
            {fmtPct(closest.bark, 1)} for a bark, and the gap is far wider than the simulation’s noise.
          </>
        ) : (
          <>
            <strong>Barking pays only with a handful of rolls.</strong> See the table for how many at each table size.
          </>
        )}
      </p>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-sm">
          <caption className="sr-only">The worst roll to hold the Hammer with, calling against barking, by table size</caption>
          <thead className="text-left text-xs text-muted-foreground">
            <tr>
              <th scope="col" className="py-1 pr-2 sm:pr-3 font-medium">Players</th>
              <th scope="col" className="py-1 pr-2 sm:pr-3 font-medium">Worst roll, best call</th>
              <th scope="col" className="py-1 pr-2 sm:pr-3 text-right font-medium">Calling</th>
              <th scope="col" className="py-1 pr-2 sm:pr-3 text-right font-medium">No 10-4</th>
              <th scope="col" className="py-1 text-right font-medium">Bark</th>
            </tr>
          </thead>
          <tbody className="tabular-nums">
            {sizes.map((s) => (
              <tr key={s.players} className="border-t border-border">
                <th scope="row" className="py-1.5 pr-2 sm:pr-3 font-medium">{s.players}</th>
                <td className="py-1.5 pr-2 sm:pr-3">
                  <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <Hand dice={s.worst.dice} size="xs" game={s.worst.best.call.game} variant={s.worst.best.call.variant} />
                    {formatCallLabel(s.worst.best.call)}
                  </span>
                  {diceText(s.worstAlt.dice) !== diceText(s.worst.dice) && (
                    <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                      No 10-4:
                      <Hand dice={s.worstAlt.dice} size="xs" game={s.worstAlt.alt.call.game} variant={s.worstAlt.alt.call.variant} />
                      {formatCallLabel(s.worstAlt.alt.call)}
                    </span>
                  )}
                </td>
                <td className="py-1.5 pr-2 sm:pr-3 text-right font-semibold">{fmtPct(s.worst.best.loss, 1)}</td>
                <td className="py-1.5 pr-2 sm:pr-3 text-right">
                  {fmtPct(s.worstAlt.alt.loss, 1)}
                </td>
                <td className="py-1.5 text-right font-semibold">{fmtPct(s.bark, 1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        Each one is a chance of taking the pencil. “No 10-4”: the worst roll when your table won’t play a 10-4, so each
        roll makes its best other call; when that’s a different roll, it’s shown under the first. Differences of a point or two between columns are simulation noise.
      </p>

      <h3 className="mt-6 text-base font-semibold">Why calling wins</h3>
      <ul className="mt-2 list-disc space-y-2 pl-5 text-sm">
        <li>
          <strong>You choose the game after seeing your dice.</strong> Nobody else does. Even a roll with nothing in it
          is closer to some game than the rest of the table is on average, and your call is roll 1 of that game for
          you.
        </li>
        <li>
          <strong>A bark trades a known hand for an unknown one, in a worse seat.</strong> You roll again with fresh
          dice and sit last, the seat before the new Hammer, and they get the Hammer’s edge instead of you.
        </li>
        <li>
          <strong>A refusal often doesn’t rescue the table.</strong> If both refusers turn your call down, your second
          call can’t be refused, and you pick it with your dice in view.
        </li>
        <li>
          <strong>The bigger the table, the more hands can finish below yours.</strong> Your chance of the pencil
          with a weak call falls quickly as players join ({fmtPct(sizes[0].worst.best.loss)} for the worst roll at{' '}
          {sizes[0].players} players, {fmtPct(sizes[sizes.length - 1].worst.best.loss)} at {sizes[sizes.length - 1].players}),
          while a bark only ever gives you an ordinary seat’s share.
        </li>
      </ul>

      <h3 className="mt-6 text-base font-semibold">What the numbers assume</h3>
      <ul className="mt-2 list-disc space-y-2 pl-5 text-sm">
        <li>
          <strong>Solid opponents who refuse on their own dice.</strong> The bots accept a call they play well and
          refuse one they don’t. They don’t read anything into what you called.
        </li>
        <li>
          <strong>Tables that won’t play a 10-4.</strong> Players rarely call 10-4 first, so a weak roll whose best call
          is 10-4 may be refused on sight. Tap “My table refuses 10-4” below to swap in each roll’s best other call.
          {swapped.length > 0 && altCalls.length > 0 && (
            <>
              {' '}At {closestAlt.players} players, {swapped.length} rolls’ best call is 10-4; their best other calls are
              mostly {altCalls.slice(0, 2).map(([name]) => name).join(' and ')}.
            </>
          )}{' '}
          {neverAlt
            ? 'Without 10-4, calling still beats barking for every roll at every table size.'
            : 'Without 10-4, barking beats calling with a few rolls: see the table.'}
        </li>
        <li>
          <strong>Nobody else barks.</strong> The bots never bark, so after your bark the new Hammer always calls. At a
          table where others bark too, the bark figures would shift; that isn’t measured here.
        </li>
        <li>
          <strong>One round’s pencil, nothing more.</strong> The odds are for this round only. The pencil count, the
          pot and house rules (some tables don’t allow barking) aren’t modeled.
        </li>
        <li>
          <strong>Simulated, so a little noisy.</strong> Each calling figure is{' '}
          {HAMMER_ODDS_SAMPLES.toLocaleString()} rounds, and each bark figure {SEAT_ODDS_SAMPLES.toLocaleString()}. The
          best call was picked on separate rounds, so picking it doesn’t flatter calling.
        </li>
      </ul>
    </div>
  )
}
