import React from 'react'
import { cn } from '../../lib/utils'

/**
 * A section of a page in a box. One style everywhere; never put a Panel
 * inside a Panel (use a heading or a divider instead).
 *
 * tone:
 *  - default: content
 *  - tool: the thing you interact with on this page (tinted, at most one per page)
 *  - note: an aside, a tip or a rule of thumb (muted)
 */
export default function Panel({
  title,
  description,
  actions,
  tone = 'default',
  as: As = 'section',
  className,
  children,
}) {
  return (
    <As
      className={cn(
        'rounded-xl border p-4 sm:p-6',
        tone === 'default' && 'bg-card text-card-foreground shadow-sm',
        tone === 'tool' && 'border-primary/30 bg-primary/5 shadow-sm',
        tone === 'note' && 'border-transparent bg-muted/60',
        className
      )}
    >
      {(title || actions) && (
        <div className="mb-4 flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
          <div>
            {title && (
              <h2
                className={cn(
                  'font-semibold tracking-tight',
                  tone === 'note' ? 'text-base' : 'text-xl'
                )}
              >
                {title}
              </h2>
            )}
            {description && (
              <p className="mt-1 text-sm text-muted-foreground">
                {description}
              </p>
            )}
          </div>
          {actions}
        </div>
      )}
      {children}
    </As>
  )
}

/** A headline number: "63.9%" over "Single-roll chance" */
export function Stat({ value, label, sub, className }) {
  return (
    <div
      className={cn(
        'rounded-xl border bg-card p-4 text-card-foreground shadow-sm',
        className
      )}
    >
      <div className="font-display text-3xl font-bold tabular-nums text-primary">
        {value}
      </div>
      <div className="mt-1 text-sm font-medium">{label}</div>
      {sub && <div className="text-xs text-muted-foreground">{sub}</div>}
    </div>
  )
}
