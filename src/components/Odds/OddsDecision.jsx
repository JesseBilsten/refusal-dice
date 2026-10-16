import React from 'react'
import { Badge } from '../ui/badge'
import { cn } from '../../lib/utils'
import { fmtPct, inWords, rankOptions } from './model'

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
 * outcome: what the bars measure, as a verb phrase ('take the pencil')
 * tieMargin: totals this close to the best are a toss-up (default 0.5 pts;
 *   pass about 2 × the error for simulated odds)
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

const label = (o) => (
  <>
    <strong>{fmtPct(o.total)}</strong> if you {lower(o.label)}
  </>
)

function Verdict({ ranked, outcome, lowerIsBetter }) {
  const best = ranked.filter((o) => o.best)
  if (best.length !== 1)
    return (
      <p className="text-base">
        <strong>It's a toss-up.</strong> You {outcome}{' '}
        {best.map((o, i) => (
          <React.Fragment key={o.id}>
            {i > 0 && (i === best.length - 1 ? ', or ' : ', ')}
            {label(o)}
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
      <strong>{pick.label}.</strong> You {outcome}{' '}
      <strong>{fmtPct(pick.total)}</strong> of the time,{' '}
      {lowerIsBetter ? 'instead of' : 'compared with'}{' '}
      {others.map((o, i) => (
        <React.Fragment key={o.id}>
          {i > 0 && ', or '}
          {label(o)}
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
}) {
  const ranked = rankOptions(options, lowerIsBetter, tieMargin)
  return (
    <div className="space-y-3">
      <Verdict
        ranked={ranked}
        outcome={outcome}
        lowerIsBetter={lowerIsBetter}
      />
      <figure>
        <figcaption className="sr-only">Chance you {outcome}</figcaption>
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
                <span className="text-right">
                  <span className="text-xl font-semibold tabular-nums">
                    {fmtPct(o.total)}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {inWords(o.total)}
                    {o.error != null && o.total > 0 && o.total < 1 && (
                      <> · ±{(o.error * 100).toFixed(1)} pts</>
                    )}
                  </span>
                </span>
              </div>
              <div
                role="img"
                aria-label={`${fmtPct(o.total)} chance you ${outcome}: ${o.segments
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
