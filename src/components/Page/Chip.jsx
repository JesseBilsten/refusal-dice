import React from 'react'
import { Link } from 'gatsby'
import { cn } from '../../lib/utils'

/**
 * A choice you tap: a game, a count, an example. `active` marks the chosen
 * one (aria-pressed), so a row of chips works like a segmented control.
 * With `to`, it's a link that looks the same (a related game, say).
 */
export default function Chip({ active, to, className, children, ...props }) {
  const classes = cn(
    'min-h-9 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
    active
      ? 'border-primary bg-primary text-primary-foreground'
      : 'border-border bg-background hover:border-primary/50 hover:bg-accent',
    className
  )
  if (to)
    return (
      <Link
        to={to}
        className={cn('inline-flex items-center', classes)}
        {...props}
      >
        {children}
      </Link>
    )
  return (
    <button
      type="button"
      // A radio (ChoiceGroup) says it's checked instead
      aria-pressed={
        active === undefined || props.role === 'radio' ? undefined : !!active
      }
      className={classes}
      {...props}
    >
      {children}
    </button>
  )
}
