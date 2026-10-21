import React, { useState } from 'react'
import { cn } from '../../lib/utils'
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover'
import { fmtPct } from './model'
import ProbabilityBar from './ProbabilityBar'

/** "1 roll left", "2 rolls left" */
export const rollsLeft = (n) => `${n} ${n === 1 ? 'roll' : 'rolls'} left`

/**
 * A chance that depends on how many rolls you have left. Shows `p`, the
 * chance with `rolls` rolls left; tap it to see the same chance with each
 * of `counts` rolls left, from `over(n)` (computed when it opens; null
 * when that can't happen). With nothing to compare (no `over`, or one
 * count) it's plain text.
 *
 * what: what the chance is for, as the popover's title ("Keep 3, roll 4")
 * note: what the chance counts, when that isn't obvious ("Wins only…")
 */
export default function RollsPct({
  p,
  digits = 0,
  rolls,
  over,
  counts = [1, 2],
  what,
  note,
  className,
}) {
  const [open, setOpen] = useState(false)
  const text = fmtPct(p, digits)
  if (!over || counts.length < 2)
    return <span className={cn('tabular-nums', className)}>{text}</span>
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        className={cn(
          'tabular-nums underline decoration-dotted decoration-from-font underline-offset-4 hover:decoration-solid',
          'rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          className
        )}
        aria-label={`${text} with ${rollsLeft(rolls)}. Compare other numbers of rolls`}
      >
        {text}
      </PopoverTrigger>
      <PopoverContent className="w-72 space-y-3 text-sm" align="end">
        {what && <p className="font-medium">{what}</p>}
        {open && (
          <div className="space-y-2">
            {counts
              .map((n) => ({ n, p: over(n) }))
              .filter((r) => r.p != null)
              .map(({ n, p: q }) => (
                <ProbabilityBar
                  key={n}
                  label={rollsLeft(n)}
                  sublabel={
                    n === rolls && (
                      <span className="text-primary">you, now</span>
                    )
                  }
                  tone={n === rolls ? 'primary' : 'muted'}
                  p={q}
                  digits={1}
                  className="grid-cols-[6rem_1fr_auto]"
                />
              ))}
          </div>
        )}
        <p className="text-xs text-muted-foreground">
          {note && <>{note} </>}Counts every roll left, keeping the best dice
          each time.
        </p>
      </PopoverContent>
    </Popover>
  )
}
