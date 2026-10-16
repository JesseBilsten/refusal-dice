import React from 'react'
import { cn } from '../../lib/utils'

/**
 * Top-level tools on one page (the Odds Lab, the Strategy Assistant). Each
 * tab is its own tool, so only the chosen one is rendered.
 *
 * tabs: [{ id, label }]
 */
export default function PageTabs({ tabs, value, onChange, label, className }) {
  return (
    <div
      role="tablist"
      aria-label={label}
      className={cn('mb-6 inline-flex flex-wrap gap-1 rounded-xl bg-muted p-1', className)}
    >
      {tabs.map((t) => (
        <button
          key={t.id}
          type="button"
          role="tab"
          aria-selected={value === t.id}
          onClick={() => onChange(t.id)}
          className={cn(
            'rounded-lg px-3 py-2 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            value === t.id
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}

/** Read the tab from ?tab=, falling back to the first */
export const tabFromUrl = (tabs) => {
  if (typeof window === 'undefined') return tabs[0].id
  const asked = new URLSearchParams(window.location.search).get('tab')
  return tabs.some((t) => t.id === asked) ? asked : tabs[0].id
}
