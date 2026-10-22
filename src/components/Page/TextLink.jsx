import React from 'react'
import { Link } from 'gatsby'
import { cn } from '../../lib/utils'

/**
 * A link inside running text, to another page of the site. Underlined in
 * paragraphs by global.css, so color isn't the only cue.
 */
export default function TextLink({ to, className, children }) {
  return (
    <Link to={to} className={cn('text-primary hover:underline', className)}>
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
