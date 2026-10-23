import React from 'react'
import { cn } from '../../lib/utils'
import Die from './Die'

/**
 * A set of dice that belong together, outlined and labeled: the dice that
 * make a game (blue, labeled with the game) or a kicker (dashed). Use
 * `Hand` to split a roll into these groups automatically.
 *
 * tone: 'game' | 'kicker' | 'plain'
 * compact: tight padding and no label, for tables and text
 * dice + size: shorthand for children, e.g. dice={[4, 6]} size="sm"
 */
export default function DiceGroup({
  label,
  tone = 'game',
  compact = false,
  dice,
  size = 'md',
  children,
  className,
}) {
  const showLabel = label && !compact
  return (
    <span
      className={cn('inline-flex flex-col items-start align-middle', className)}
    >
      <span
        className={cn(
          'flex items-center',
          compact
            ? 'gap-0.5 rounded-md border p-0.5'
            : 'gap-1 rounded-lg border-2 p-1',
          tone === 'game' && 'border-primary bg-primary/5',
          tone === 'kicker' && 'border-dashed border-muted-foreground/50',
          tone === 'plain' && 'border-transparent',
          showLabel && 'rounded-bl-none'
        )}
      >
        {children ||
          dice?.map((d, i) => <Die key={i} value={Number(d)} size={size} />)}
      </span>
      {showLabel && (
        <span
          className={cn(
            'rounded-b-md px-1.5 py-0.5 text-2xs font-semibold uppercase leading-none tracking-wide',
            tone === 'game' && 'bg-primary text-primary-foreground',
            tone === 'kicker' && 'bg-muted text-muted-foreground',
            tone === 'plain' && 'text-muted-foreground'
          )}
        >
          {label}
        </span>
      )}
    </span>
  )
}
