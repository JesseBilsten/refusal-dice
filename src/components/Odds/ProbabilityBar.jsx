import React from 'react'
import { cn } from '../../lib/utils'
import { fmtPct } from './model'

const FILL = {
  primary: 'bg-primary',
  safe: 'bg-odds-safe',
  coin: 'bg-odds-coin',
  lose: 'bg-odds-lose',
  muted: 'bg-muted-foreground/40',
}

const clamp = (p) => Math.min(1, Math.max(0, p))

/**
 * One chance as a labeled bar: "2 rolls ▇▇▇▇▇▇░░ 90.9%". For comparing
 * options in a decision, use OddsDecision instead.
 *
 * tone: primary (a plain chance), safe, coin or lose (what it means for you),
 *   or muted (for comparison)
 * sublabel: a line under the label
 * mark: a chance to compare against, drawn as a tick across the bar, with
 * `markLabel` naming it (e.g. "Bark 17%")
 */
export default function ProbabilityBar({
  p,
  label,
  sublabel,
  tone = 'primary',
  digits = 1,
  mark,
  markLabel,
  className,
}) {
  return (
    <div
      className={cn(
        'grid grid-cols-[minmax(4.5rem,auto)_1fr_auto] items-center gap-3 text-sm',
        className
      )}
    >
      <span className="font-medium">
        {label}
        {sublabel && <span className="block text-xs font-normal">{sublabel}</span>}
      </span>
      <span
        role="img"
        aria-label={`${label}: ${fmtPct(p, digits)}${markLabel ? `; ${markLabel}` : ''}`}
        className="relative h-2.5 rounded-full bg-muted"
      >
        <span
          className={cn('block h-full rounded-full', FILL[tone])}
          style={{ width: `${clamp(p) * 100}%` }}
        />
        {mark != null && (
          <span
            aria-hidden
            className="absolute -inset-y-1 w-0.5 -translate-x-1/2 rounded-full bg-foreground"
            style={{ left: `${clamp(mark) * 100}%` }}
          />
        )}
      </span>
      <span className="w-14 text-right font-semibold tabular-nums">
        {fmtPct(p, digits)}
      </span>
    </div>
  )
}
