import React from 'react'
import { cn } from '../../lib/utils'
import { fmtPct } from './model'

const FILL = {
  primary: 'bg-primary',
  safe: 'bg-odds-safe',
  coin: 'bg-odds-coin',
  lose: 'bg-odds-lose',
}

/**
 * One chance as a labeled bar: "2 rolls ▇▇▇▇▇▇░░ 90.9%". For comparing
 * options in a decision, use OddsDecision instead.
 *
 * tone: primary (a plain chance), safe, coin or lose (what it means for you)
 */
export default function ProbabilityBar({
  p,
  label,
  tone = 'primary',
  digits = 1,
  className,
}) {
  return (
    <div
      className={cn(
        'grid grid-cols-[minmax(4.5rem,auto)_1fr_auto] items-center gap-3 text-sm',
        className
      )}
    >
      <span className="font-medium">{label}</span>
      <span
        role="img"
        aria-label={`${label}: ${fmtPct(p, digits)}`}
        className="h-2.5 overflow-hidden rounded-full bg-muted"
      >
        <span
          className={cn('block h-full rounded-full', FILL[tone])}
          style={{ width: `${Math.min(1, Math.max(0, p)) * 100}%` }}
        />
      </span>
      <span className="w-14 text-right font-semibold tabular-nums">
        {fmtPct(p, digits)}
      </span>
    </div>
  )
}
