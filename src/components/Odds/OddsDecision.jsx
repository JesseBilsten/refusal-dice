import React from 'react'
import { Badge } from '../ui/badge'
import { cn } from '../../lib/utils'
import { fmtNet, fmtPct, inWords, rankOptions } from './model'
import RollsPct, { rollsLeft } from './RollsPct'

/**
 * The odds-decision pattern: lead with the answer, then show each option's
 * chance as a bar, split into the ways it happens. See
 * .claude/skills/explain-odds/SKILL.md.
 *
 * options: [{ id, label: 'Take the tie', segments: [{ p, label, kind }], error?, title?, visual? }]
 *   label: the option as a verb phrase, also used in the verdict sentence
 *   title: a node to head the option's row instead of label (e.g. a CallName)
 *   visual: a picture of the option, e.g. the dice it keeps
 *   error: standard error of a simulated total, shown as ± points
 *   rolls: rolls left the total covers, said under it; with `over(n)`, the
 *     total with n rolls left, tapping the total compares them (RollsPct)
 * outcome: what the bars measure, as a verb phrase ('take the pencil')
 * when: when the chances hold, leading the verdict ('With 2 rolls left')
 * tieMargin: totals this close to the best are a toss-up (default 0.5 pts;
 *   pass about 2 × the error for simulated odds)
 * net: the options weigh pencils both ways (the Boss's choices): each has
 *   `value` = someone else's chance of the pencil minus yours, shown as net
 *   pencils per 100 rounds, higher is better; its segments are the two
 *   chances ('safe': someone else, 'lose': you)
 */

export const FILL = {
  lose: 'bg-odds-lose',
  coin: 'bg-odds-coin',
  safe: 'bg-odds-safe',
}

// Coin-flip slices are striped too, so they don't rely on color alone
export const STRIPES = {
  backgroundImage:
    'repeating-linear-gradient(135deg, transparent 0 4px, rgba(255,255,255,.45) 4px 7px)',
}

export function Swatch({ kind, className }) {
  return (
    <span
      aria-hidden
      className={cn(
        'inline-block h-2.5 w-2.5 shrink-0 rounded-sm',
        FILL[kind],
        className
      )}
      style={kind === 'coin' ? STRIPES : undefined}
    />
  )
}

const lower = (s) => s.charAt(0).toLowerCase() + s.slice(1)

const label = (o, digits) => (
  <>
    <strong>{fmtPct(o.total, digits)}</strong> if you {lower(o.label)}
  </>
)

/** Whole percents, unless two options would read the same: then one decimal */
const digitsFor = (ranked) =>
  new Set(ranked.map((o) => Math.round(o.total * 100))).size < ranked.length
    ? 1
    : 0

function NetVerdict({ ranked }) {
  const best = ranked.filter((o) => o.best)
  const others = ranked.filter((o) => !o.best)
  const list = (os) =>
    os.map((o, i) => (
      <React.Fragment key={o.id}>
        {i > 0 && ', or '}
        <strong>{fmtNet(o.total)}</strong> if you {lower(o.label)}
      </React.Fragment>
    ))
  if (best.length !== 1)
    return (
      <p className="text-base">
        <strong>It's a toss-up.</strong> Net pencils per 100 rounds:{' '}
        {list(best)}: too close to call.
        {others.length > 0 && ' Everything else is worse.'}
      </p>
    )
  const [pick] = best
  return (
    <p className="text-base">
      <strong>{pick.label}.</strong> Per 100 rounds,{' '}
      <strong>{fmtNet(pick.total)}</strong> net pencils: the pencils that go to
      someone else, minus yours. Compared with {list(others)}.
    </p>
  )
}

function Verdict({ ranked, outcome, lowerIsBetter, when }) {
  const you = when ? `${when}, you` : 'You'
  const best = ranked.filter((o) => o.best)
  const digits = digitsFor(ranked)
  if (best.length !== 1)
    return (
      <p className="text-base">
        <strong>It's a toss-up.</strong> {you} {outcome}{' '}
        {best.map((o, i) => (
          <React.Fragment key={o.id}>
            {i > 0 && (i === best.length - 1 ? ', or ' : ', ')}
            {label(o, digits)}
          </React.Fragment>
        ))}
        : too close to call.
        {best.length < ranked.length && ' Everything else is worse.'}
      </p>
    )
  const [pick] = best
  const others = ranked.filter((o) => !o.best)
  return (
    <p className="text-base">
      <strong>{pick.label}.</strong> {you} {outcome}{' '}
      <strong>{fmtPct(pick.total, digits)}</strong> of the time,{' '}
      {lowerIsBetter ? 'instead of' : 'compared with'}{' '}
      {others.map((o, i) => (
        <React.Fragment key={o.id}>
          {i > 0 && ', or '}
          {label(o, digits)}
        </React.Fragment>
      ))}
      .
    </p>
  )
}

export default function OddsDecision({
  outcome,
  options,
  lowerIsBetter = true,
  tieMargin,
  when,
  net = false,
}) {
  const ranked = rankOptions(options, net ? false : lowerIsBetter, tieMargin)
  return (
    <div className="space-y-3">
      {net ? (
        <NetVerdict ranked={ranked} />
      ) : (
        <Verdict
          ranked={ranked}
          outcome={outcome}
          lowerIsBetter={lowerIsBetter}
          when={when}
        />
      )}
      <figure>
        <figcaption className="sr-only">
          {net ? 'Net pencils per 100 rounds' : `Chance you ${outcome}`}
        </figcaption>
        <ul className="space-y-2">
          {ranked.map((o) => (
            <li
              key={o.id}
              className={cn(
                'rounded-md border p-3',
                o.best ? 'border-primary ring-1 ring-primary' : 'border-border'
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex flex-col gap-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{o.title ?? o.label}</span>
                    {o.best && ranked.length > 1 && <Badge>Best</Badge>}
                  </div>
                  {o.visual}
                </div>
                {net ? (
                  <span className="text-right">
                    <span className="block text-xl font-semibold tabular-nums">
                      {fmtNet(o.total)}
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      net per 100 rounds
                      {o.error != null && o.error > 0 && (
                        <> · ±{(o.error * 100).toFixed(1)}</>
                      )}
                    </span>
                  </span>
                ) : (
                  <span className="text-right">
                    <RollsPct
                      p={o.total}
                      rolls={o.rolls}
                      over={o.over}
                      what={o.label}
                      className="text-xl font-semibold"
                    />
                    <span className="block text-xs text-muted-foreground">
                      {o.rolls != null && <>{rollsLeft(o.rolls)} · </>}
                      {inWords(o.total)}
                      {o.error != null && o.total > 0 && o.total < 1 && (
                        <> · ±{(o.error * 100).toFixed(1)} pts</>
                      )}
                    </span>
                  </span>
                )}
              </div>
              <div
                role="img"
                aria-label={`${net ? `${fmtNet(o.total)} net pencils per 100 rounds` : `${fmtPct(o.total)} chance you ${outcome}`}: ${o.segments
                  .map((s) => `${s.label} ${fmtPct(s.p, 1)}`)
                  .join(', ')}`}
                className="mt-2 flex h-3 gap-px overflow-hidden rounded-full bg-muted"
              >
                {o.segments.map((s) => (
                  <div
                    key={s.label}
                    className={FILL[s.kind]}
                    style={{
                      width: `${s.p * 100}%`,
                      ...(s.kind === 'coin' ? STRIPES : {}),
                    }}
                  />
                ))}
              </div>
              <ul className="mt-2 space-y-0.5 text-xs text-muted-foreground">
                {o.segments.map((s) => (
                  <li key={s.label} className="flex items-center gap-1.5">
                    <Swatch kind={s.kind} />
                    <span className="tabular-nums">{fmtPct(s.p, 1)}</span>
                    <span>{s.label}</span>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </figure>
    </div>
  )
}
