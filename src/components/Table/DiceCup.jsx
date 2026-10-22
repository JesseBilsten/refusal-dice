import React from 'react'
import { cn } from '../../lib/utils'

/**
 * A dice cup: where a player's dice go once they're picked up (in the cup:
 * safe this round), or wait before they're rolled. `children` sits beside
 * it, e.g. the hand it holds, small.
 */
export default function DiceCup({ label, children, className }) {
  return (
    <span className={cn('story-pop inline-flex items-center gap-2', className)}>
      <svg
        viewBox="0 0 32 32"
        aria-hidden
        className="h-8 w-8 shrink-0 text-muted-foreground"
      >
        <path
          d="M7 6h18l-2.5 21a2 2 0 0 1-2 1.8h-9a2 2 0 0 1-2-1.8z"
          fill="currentColor"
          opacity="0.85"
        />
        <rect x="5" y="4" width="22" height="4" rx="1.5" fill="currentColor" />
        <path
          d="M10 13h12M10.6 19h10.8"
          stroke="hsl(var(--color-card))"
          strokeWidth="1.2"
          opacity="0.5"
        />
      </svg>
      {label && (
        <span className="whitespace-nowrap text-xs font-semibold text-muted-foreground">
          {label}
        </span>
      )}
      {children}
    </span>
  )
}
