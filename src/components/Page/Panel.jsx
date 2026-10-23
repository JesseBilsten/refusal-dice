import React, { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '../../lib/utils'

/**
 * A section of a page in a box. One style everywhere; never put a Panel
 * inside a Panel (use a heading or a divider instead).
 *
 * tone:
 *  - default: content
 *  - tool: the thing you interact with on this page (tinted, at most one per page)
 *  - note: an aside, a tip or a rule of thumb (muted)
 *
 * `collapsible`: the title becomes a button that shows or hides the content
 * (closed until opened, or `defaultOpen`); `badge` sits after the title.
 */
export default function Panel({
  title,
  description,
  actions,
  tone = 'default',
  collapsible = false,
  defaultOpen = false,
  badge,
  as: As = 'section',
  className,
  children,
  ...rest
}) {
  const [open, setOpen] = useState(defaultOpen)
  const shown = !collapsible || open
  const heading = collapsible ? (
    <button
      type="button"
      onClick={() => setOpen((o) => !o)}
      aria-expanded={open}
      className="flex items-center gap-2 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <ChevronDown
        aria-hidden
        className={cn(
          'h-5 w-5 shrink-0 text-muted-foreground transition-transform',
          open && 'rotate-180'
        )}
      />
      {title}
      {badge}
    </button>
  ) : (
    <>
      {title}
      {badge && <> {badge}</>}
    </>
  )
  return (
    <As
      {...rest}
      className={cn(
        'rounded-xl border p-4 sm:p-6',
        tone === 'default' && 'bg-card text-card-foreground shadow-sm',
        tone === 'tool' && 'border-primary/30 bg-primary/5 shadow-sm',
        tone === 'note' && 'border-transparent bg-muted/60',
        className
      )}
    >
      {(title || actions) && (
        <div
          className={cn(
            'flex flex-wrap items-start justify-between gap-x-4 gap-y-2',
            children && shown && 'mb-4'
          )}
        >
          <div>
            {title && (
              <h2
                className={tone === 'note' ? 'text-subheading' : 'text-heading'}
              >
                {heading}
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
      {shown ? children : null}
    </As>
  )
}

/**
 * A headline number: "63.9%" over "Single-roll chance". `plain` drops the
 * card for a row of figures inside a Panel (label first, smaller number).
 */
export function Stat({ value, label, sub, plain, className }) {
  if (plain)
    return (
      <div className={className}>
        <div className="eyebrow text-muted-foreground">{label}</div>
        <div className="font-display text-heading tabular-nums">{value}</div>
        {sub && <div className="text-xs text-muted-foreground">{sub}</div>}
      </div>
    )
  return (
    <div
      className={cn(
        'rounded-xl border bg-card p-4 text-card-foreground shadow-sm',
        className
      )}
    >
      <div className="font-display text-section tabular-nums text-primary">
        {value}
      </div>
      <div className="mt-1 text-sm font-medium">{label}</div>
      {sub && <div className="text-xs text-muted-foreground">{sub}</div>}
    </div>
  )
}
