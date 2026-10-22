import React from 'react'
import { motion, useReducedMotion } from 'framer-motion'
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
 * - said: { text, fresh, at } this player's latest move ("Calls 10-4 High"),
 *   beside their dice the way an online table labels each seat's last
 *   action; `fresh` (the table's newest move) stands out, and a new `at`
 *   replays its entrance
 * - detail: a line under the dice (the hand in words, rolls left)
 * - compact: smaller padding, for the other players around your seat
 * - footer: below everything else, e.g. your move and its buttons
 * - turn: draw the turn outline here. There's one outline on the table: it
 *   glides from seat to seat as the turn passes, pulling the eye along
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
  said,
  detail,
  compact,
  turn,
  footer,
  children,
  className,
}) {
  const reduced = useReducedMotion()
  return (
    <div
      className={cn(
        'relative rounded-xl border bg-card shadow-sm transition-shadow',
        compact ? 'p-2.5' : 'p-3',
        you && 'border-primary/60',
        active && 'ring-2 ring-pop ring-offset-2 ring-offset-transparent',
        loser && 'border-destructive',
        out && 'opacity-50',
        className
      )}
      aria-current={active || turn ? 'true' : undefined}
    >
      {turn && (
        <motion.span
          layoutId="turn-outline"
          aria-hidden
          transition={{ duration: reduced ? 0 : 0.45, ease: 'easeInOut' }}
          className="pointer-events-none absolute inset-0 z-10 rounded-xl border-[3px] border-pop shadow-[0_0_18px_hsl(var(--color-pop)/0.45)]"
        />
      )}
      <div className={cn('flex flex-wrap items-center', compact ? 'mb-1.5 gap-1.5' : 'mb-2 gap-2')}>
        <span className="font-semibold">{name}</span>
        {badges.map((b) => (
          <Badge key={b} variant="secondary">
            {b}
          </Badge>
        ))}
        {decision && <Badge variant="outline">{decision}</Badge>}
        <span
          className="ml-auto flex items-center gap-0.5 text-muted-foreground"
          role="img"
          aria-label={out ? 'Out of the game' : `${pencils} of ${maxPencils} pencils`}
          title={`${pencils} of ${maxPencils} pencils`}
        >
          {out ? (
            <span className="text-xs font-medium">Out</span>
          ) : (
            // One slot per pencil it takes to lose: taken ones filled in
            Array.from({ length: maxPencils }, (_, i) => (
              <Pencil
                key={i}
                aria-hidden
                className={cn('h-3.5 w-3.5', i < pencils ? 'text-pop' : 'text-muted-foreground/30')}
              />
            ))
          )}
        </span>
      </div>
      {said ? (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          {children}
          <span
            key={said.at}
            className={cn(
              'seat-said inline-flex max-w-full items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold',
              said.fresh ? 'seat-said-fresh border-pop bg-pop/15 text-foreground' : 'bg-muted text-muted-foreground'
            )}
          >
            {said.text}
          </span>
        </div>
      ) : (
        children
      )}
      {detail && <div className="mt-1 text-xs text-muted-foreground">{detail}</div>}
      {status && <div className="mt-2 text-xs text-muted-foreground">{status}</div>}
      {footer}
    </div>
  )
}
