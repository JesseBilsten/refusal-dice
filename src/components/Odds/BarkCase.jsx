import React from 'react'
import { formatCallLabel } from '../../lib/games-config'
import { Hand } from '../Dice'
import { HAMMER_ODDS_SAMPLES, HAMMER_ODDS_SIZES, SEAT_ODDS_SAMPLES, barkOdds, barkTable } from '../../strategy'
import { fmtPct } from './model'

const worstBy = (rows, pick) => rows.reduce((w, r) => (pick(r).loss > pick(w).loss ? r : w))

/**
 * The case for calling over barking, in pieces for the Barking page's
 * questions (BarkGuide), from the generated hammer-odds.ts and seat-odds.ts.
 */

/** Every table size: the worst roll's call against a bark, with and without 10-4 */
export function BarkSizes({ rules }) {
  const sizes = HAMMER_ODDS_SIZES.map((players) => {
    const rows = barkTable(players, rules)
    return { players, bark: barkOdds(players, rules), worst: rows[0], worstAlt: worstBy(rows, (r) => r.alt) }
  })
  const [few, many] = [sizes[0], sizes[sizes.length - 1]]
  return (
    <>
      <p>
        <strong>Calling wins at every size.</strong> More players means more people who can finish below you: the worst
        roll loses {fmtPct(few.worst.best.loss)} at {few.players} players but {fmtPct(many.worst.best.loss)} at{' '}
        {many.players}.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-xs sm:text-sm">
          <caption className="sr-only">The worst roll to hold the Hammer with, calling against barking, by table size</caption>
          <thead className="text-left text-xs text-muted-foreground">
            <tr>
              <th scope="col" className="py-1 pr-2 font-medium sm:pr-3">Players</th>
              <th scope="col" className="py-1 pr-2 font-medium sm:pr-3">Worst roll</th>
              <th scope="col" className="py-1 pr-2 text-right font-medium sm:pr-3">Call</th>
              <th scope="col" className="py-1 pr-2 text-right font-medium sm:pr-3">No 10-4</th>
              <th scope="col" className="py-1 text-right font-medium">Bark</th>
            </tr>
          </thead>
          <tbody className="tabular-nums">
            {sizes.map((s) => (
              <tr key={s.players} className="border-t border-border">
                <th scope="row" className="py-1.5 pr-2 text-left font-medium sm:pr-3">{s.players}</th>
                <td className="py-1.5 pr-2 sm:pr-3">
                  <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <Hand dice={s.worst.dice} size="xs" game={s.worst.best.call.game} variant={s.worst.best.call.variant} />
                    {formatCallLabel(s.worst.best.call)}
                  </span>
                </td>
                <td className="py-1.5 pr-2 text-right font-semibold sm:pr-3">{fmtPct(s.worst.best.loss, 1)}</td>
                <td className="py-1.5 pr-2 text-right sm:pr-3">{fmtPct(s.worstAlt.alt.loss, 1)}</td>
                <td className="py-1.5 text-right font-semibold">{fmtPct(s.bark, 1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted-foreground">
        Chances of taking the pencil. “No 10-4”: the worst roll when your table won’t play a 10-4 (it may be a different
        roll).
      </p>
    </>
  )
}

/** Why calling beats barking, in four plain lines */
export function BarkWhy() {
  return (
    <ul className="list-disc space-y-1.5 pl-5">
      <li>
        <strong>You pick the game after seeing your dice.</strong> Nobody else gets to.
      </li>
      <li>
        <strong>A bark swaps your dice for random ones</strong> and puts you last, with the next player holding the
        Hammer’s edge.
      </li>
      <li>
        <strong>Refusals can’t stop you.</strong> If both refusers say no, your second call can’t be refused.
      </li>
      <li>
        <strong>You only have to beat one player,</strong> and more players means more chances someone finishes below
        you.
      </li>
    </ul>
  )
}

/** What the numbers assume, briefly */
export function BarkAssumptions({ rules }) {
  const decoys = barkTable(3, rules)
    .map((r) => r.best.loss - r.bots.loss)
    .filter((gain) => gain >= 0.01)
  return (
    <ul className="list-disc space-y-1.5 pl-5">
      <li>
        <strong>Solid opponents.</strong> They refuse based on their own dice and don’t read anything into your call.
      </li>
      <li>
        <strong>The site’s recommended call.</strong> Each roll calls the game it loses least when everyone plays it.
        Against the bots, a decoy (a weaker first call, made to be refused so your real game comes second, unrefusable)
        sometimes does a little better
        {decoys.length > 0 && <>: {decoys.length} of 252 rolls at 3 players, by {fmtPct(Math.max(...decoys), 1)} at most</>}.
        Real players can see a decoy coming, so it isn’t the advice.
      </li>
      <li>
        <strong>Nobody else barks,</strong> and only this round’s pencil counts (not the pot or the pencil count).
      </li>
      <li>
        <strong>Simulated.</strong> {HAMMER_ODDS_SAMPLES.toLocaleString()} rounds per call figure,{' '}
        {SEAT_ODDS_SAMPLES.toLocaleString()} per bark figure: good to about ±2 points.
      </li>
    </ul>
  )
}
