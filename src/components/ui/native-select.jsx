import * as React from 'react'
import { cn } from '../../lib/utils'

/**
 * A native <select>: the one dropdown style. Native so it works with every
 * keyboard and screen reader and opens the phone's own picker.
 * options: [{ value, label }]; `numeric` hands onChange a number.
 */
const NativeSelect = React.forwardRef(
  ({ label, value, options, onChange, numeric, className, ...props }, ref) => (
    <select
      ref={ref}
      aria-label={label}
      value={String(value)}
      onChange={(e) =>
        onChange(numeric ? Number(e.target.value) : e.target.value)
      }
      className={cn(
        'h-9 rounded-md border border-input bg-background px-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring',
        className
      )}
      {...props}
    >
      {options.map((o) => (
        <option key={String(o.value)} value={String(o.value)}>
          {o.label}
        </option>
      ))}
    </select>
  )
)
NativeSelect.displayName = 'NativeSelect'

export { NativeSelect }
