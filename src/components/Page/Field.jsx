import React from 'react'
import { cn } from '../../lib/utils'

/**
 * A labelled control in a form or tool panel: the label, the control, then
 * an optional hint. `htmlFor` (the control's id) makes the label a real
 * <label>, so tapping it focuses the control and screen readers announce
 * it; the hint is then the control's description (`${htmlFor}-hint`).
 */
export default function Field({ label, hint, htmlFor, className, children }) {
  const Label = htmlFor ? 'label' : 'div'
  return (
    <div className={cn('space-y-2', className)}>
      <Label htmlFor={htmlFor} className="block text-sm font-semibold">
        {label}
      </Label>
      {children}
      {hint && (
        <p id={htmlFor && `${htmlFor}-hint`} className="text-xs text-muted-foreground">
          {hint}
        </p>
      )}
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
