import React from 'react'
import { cn } from '../../lib/utils'

/** A labelled control in a form or tool panel: the label, the control, then an optional hint */
export default function Field({ label, hint, className, children }) {
  return (
    <div className={cn('space-y-2', className)}>
      <div className="text-sm font-semibold">{label}</div>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}

/** Where a result will appear, before there is one: "Enter your five dice, or tap Roll." */
export function EmptyState({ className, children }) {
  return (
    <div
      className={cn(
        'flex min-h-48 items-center justify-center rounded-xl border border-dashed p-6 text-center text-muted-foreground',
        className
      )}
    >
      {children}
    </div>
  )
}
