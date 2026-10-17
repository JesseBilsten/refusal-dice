import React from 'react'
import { cn } from '../../lib/utils'

/** A step's number in a filled circle: the home page's path and the Rules page's steps */
export default function StepNumber({ n, className }) {
  return (
    <span
      className={cn(
        'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary font-display text-base font-bold text-primary-foreground',
        className
      )}
    >
      <span className="sr-only">Step </span>
      {n}
    </span>
  )
}
