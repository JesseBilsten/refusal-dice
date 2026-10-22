import React, { useId } from 'react'
import Chip from './Chip'
import { cn } from '../../lib/utils'

/**
 * Pick one of a few options, as a row of Chips with radio semantics: how
 * many opponents, which difficulty, how many rolls are left. `label` names
 * the group (shown, or `hideLabel` for screen readers only); `size="lg"`
 * gives 44px targets for the main choices on a page.
 *
 * options: [{ value, label }]
 */
export default function ChoiceGroup({
  label,
  hideLabel,
  options,
  value,
  onChange,
  size = 'md',
  className,
}) {
  const id = useId()
  return (
    <div className={cn('space-y-2', className)}>
      <div
        id={id}
        className={cn('text-sm font-semibold', hideLabel && 'sr-only')}
      >
        {label}
      </div>
      <div
        role="radiogroup"
        aria-labelledby={id}
        className="flex flex-wrap gap-1.5"
      >
        {options.map((o) => (
          <Chip
            key={String(o.value)}
            role="radio"
            aria-checked={value === o.value}
            active={value === o.value}
            onClick={() => onChange(o.value)}
            className={
              size === 'lg' ? 'min-h-11 min-w-11 px-4 text-base' : undefined
            }
          >
            {o.label}
          </Chip>
        ))}
      </div>
    </div>
  )
}
