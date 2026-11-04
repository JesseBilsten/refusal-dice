import React from 'react'
import { Link } from 'gatsby'
import { cn } from '../../lib/utils'

/**
 * A link inside running text, to another page of the site. Always
 * underlined, wherever it sits, so color isn't the only cue (WCAG 1.4.1).
 */
export default function TextLink({ to, className, children }) {
  return (
    <Link
      to={to}
      className={cn(
        'text-primary underline decoration-primary/40 underline-offset-2 transition-colors hover:decoration-primary',
        className
      )}
    >
      {children}
    </Link>
  )
}

/** A game term linked to its Glossary entry: <Term id="hammer">Hammer</Term> */
export function Term({ id, className, children }) {
  return (
    <TextLink to={`/glossary#${id}`} className={cn('font-medium', className)}>
      {children}
    </TextLink>
  )
}
