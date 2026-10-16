import React from 'react'
import { cn } from '../../lib/utils'

/**
 * A choice you tap: a game, a count, an example. `active` marks the chosen
 * one (aria-pressed), so a row of chips works like a segmented control.
 */
export default function Chip({ active, className, children, ...props }) {
  return (
    <button
      type="button"
      aria-pressed={active === undefined ? undefined : !!active}
      className={cn(
        'min-h-9 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        active
          ? 'border-primary bg-primary text-primary-foreground'
          : 'border-border bg-background hover:border-primary/50 hover:bg-accent',
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}
