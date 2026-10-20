import React, { useMemo, useState } from 'react'
import { formatCallLabel } from '../../lib/games-config'
import { Hand } from '../Dice'
import { Chip } from '../Page'
import { HAMMER_ODDS_SAMPLES, barkOdds, barkTable } from '../../strategy'
import ProbabilityBar from './ProbabilityBar'
import { fmtPct } from './model'

const SHOWN = 10
const diceText = (dice) => dice.join('-')
const sameCall = (a, b) => a.game === b.game && a.variant === b.variant

/**
 * Every roll the Hammer can hold, the one most likely to take the pencil
 * first, at a table of `players`: each roll's best call and its chance of
 * the pencil, against a bark (the tick). From the generated hammer-odds.ts
 * and seat-odds.ts. "My table refuses 10-4" swaps in each roll's best call
 * that isn't 10-4. A row notes a decoy that does better against the bots.
 */
export default function BarkHands({ players, rules, className }) {
  const [no104, setNo104] = useState(false)
  const [all, setAll] = useState(false)
  const bark = barkOdds(players, rules)
  const rows = useMemo(() => {
    const pick = (r) => (no104 ? r.alt : r.best)
    return barkTable(players, rules)
      .map((r) => ({ ...r, pick: pick(r) }))
      .sort((a, b) => b.pick.loss - a.pick.loss)
  }, [players, no104, rules])
  const worst = rows[0]
  const barkBetter = rows.filter((r) => r.pick.loss > bark)
  const barkShare = barkBetter.reduce((s, r) => s + r.ways, 0) / 7776
  const swapped = rows.filter((r) => r.best.call.game === '10-4').length
  const shown = all ? rows : rows.slice(0, SHOWN)

  return (
    <div className={className}>
      <div className="mb-3 flex flex-wrap items-center gap-1.5">
        <Chip active={no104} onClick={() => setNo104(!no104)}>
          My table refuses 10-4
        </Chip>
        <span className="text-xs text-muted-foreground">
          {no104
            ? `${swapped} rolls whose call is 10-4 call something else`
            : 'For tables that turn down a 10-4 on sight'}
        </span>
      </div>
      <p className="mb-4" aria-live="polite">
        {barkBetter.length === 0 ? (
          <>
            <strong>No bar reaches the tick</strong> (a bark, {fmtPct(bark, 1)}), so every roll does better calling.
          </>
        ) : (
          <>
            <strong>
              {barkBetter.length} {barkBetter.length === 1 ? 'roll does' : 'rolls do'} better barking
            </strong>{' '}
            ({fmtPct(barkShare, 1)} of hands): their bars pass the tick.
          </>
        )}
      </p>
      <ol className="space-y-3">
        {shown.map((r, i) => {
          const worse = r.pick.loss > bark
          // A call that does a point or more better against the bots, usually a decoy
          const decoy =
            !sameCall(r.bots.call, r.pick.call) &&
            !(no104 && r.bots.call.game === '10-4') &&
            r.pick.loss - r.bots.loss >= 0.01 &&
            r.bots
          return (
            <li
              key={diceText(r.dice)}
              className="grid grid-cols-[1.75rem_minmax(0,1fr)] items-center gap-x-2 gap-y-1 sm:grid-cols-[1.75rem_11rem_minmax(0,1fr)]"
            >
              <span className="text-right text-sm tabular-nums text-muted-foreground">{i + 1}</span>
              <Hand dice={r.dice} size="sm" game={r.pick.call.game} variant={r.pick.call.variant} />
              <ProbabilityBar
                className="col-start-2 grid-cols-[minmax(0,6rem)_1fr_auto] gap-2 sm:col-start-3 sm:grid-cols-[minmax(0,8rem)_1fr_auto] sm:gap-3"
                label={
                  <>
                    {formatCallLabel(r.pick.call)}
                    {worse && <span className="ml-1 text-odds-lose">· bark</span>}
                  </>
                }
                p={r.pick.loss}
                tone={worse ? 'lose' : 'safe'}
                mark={bark}
                markLabel={`a bark ${fmtPct(bark, 1)}`}
              />
              {decoy && (
                <p className="col-start-2 text-xs text-muted-foreground sm:col-start-3">
                  Decoy: {formatCallLabel(decoy.call)} first does {fmtPct(decoy.loss, 1)} against the bots (see the
                  assumptions).
                </p>
              )}
            </li>
          )
        })}
      </ol>
      {rows.length > SHOWN && (
        <button type="button" onClick={() => setAll(!all)} className="mt-3 text-sm font-medium text-primary hover:underline">
          {all ? `Show the worst ${SHOWN}` : `Show all ${rows.length} rolls`}
        </button>
      )}
      <p className="mt-3 text-xs text-muted-foreground">
        Bar: your chance of the pencil with the recommended call, refusals played out. Tick: a bark.{' '}
        {HAMMER_ODDS_SAMPLES.toLocaleString()} rounds each against solid bots, good to about ±
        {fmtPct(1.96 * Math.sqrt((worst.pick.loss * (1 - worst.pick.loss)) / HAMMER_ODDS_SAMPLES), 1)}.
      </p>
    </div>
  )
}
