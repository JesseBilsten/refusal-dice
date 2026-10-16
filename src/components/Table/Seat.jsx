import React from 'react'
import { Pencil } from 'lucide-react'
import { Badge } from '../ui/badge'
import { cn } from '../../lib/utils'

/**
 * One player at the table: name, role badges, pencils, then their dice
 * (children) and a line of status. Used by the tutorial and by Play.
 *
 * - you: your own seat (outlined in primary)
 * - active: it's this player's move (a soft glow)
 * - loser: took the pencil this round
 * - badges: ['🔨 Hammer', '1st refusal'], shown as secondary badges
 * - decision: 'Refused', 'Accepted', ... shown as an outline badge
 */
export default function Seat({
  name,
  you,
  active,
  loser,
  out,
  badges = [],
  decision,
  pencils = 0,
  maxPencils = 3,
  status,
  children,
  className,
}) {
  return (
    <div
      className={cn(
        'rounded-xl border bg-card p-3 shadow-sm transition-shadow',
        you && 'border-primary/60',
        active && 'ring-2 ring-primary/40 ring-offset-2 ring-offset-background',
        loser && 'border-destructive',
        out && 'opacity-50',
        className
      )}
      aria-current={active ? 'true' : undefined}
    >
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <span className="font-semibold">{name}</span>
        {badges.map((b) => (
          <Badge key={b} variant="secondary">
            {b}
          </Badge>
        ))}
        {decision && <Badge variant="outline">{decision}</Badge>}
        <span
          className="ml-auto flex items-center gap-0.5 text-muted-foreground"
          aria-label={out ? 'Out of the game' : `${pencils} of ${maxPencils} pencils`}
          title={`${pencils} of ${maxPencils} pencils`}
        >
          {out ? (
            <span className="text-xs font-medium">Out</span>
          ) : pencils ? (
            Array.from({ length: pencils }, (_, i) => (
              <Pencil key={i} aria-hidden className="h-3.5 w-3.5 text-pop" />
            ))
          ) : (
            <span className="text-xs">No pencils</span>
          )}
        </span>
      </div>
      {children}
      {status && <div className="mt-2 text-xs text-muted-foreground">{status}</div>}
    </div>
  )
}
