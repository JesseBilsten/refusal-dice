import React from 'react'
import { Link } from 'gatsby'
import { ArrowRight } from 'lucide-react'
import { cn } from '../../lib/utils'

/**
 * The next stop on the site's path (Learn → Rules → Games → Odds Lab →
 * Play), at the foot of a page, so the site reads as one story.
 */
export default function NextStep({ to, title, text, className }) {
  return (
    <nav aria-label="Next step" className={cn('mt-12', className)}>
      <Link
        to={to}
        className="group flex items-center justify-between gap-4 rounded-2xl border bg-card p-5 shadow-sm transition-colors hover:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <span>
          <span className="eyebrow block text-primary">Next</span>
          <span className="block font-display text-xl font-bold">{title}</span>
          {text && <span className="mt-1 block text-sm text-muted-foreground">{text}</span>}
        </span>
        <ArrowRight aria-hidden className="h-6 w-6 shrink-0 text-primary transition-transform group-hover:translate-x-1" />
      </Link>
    </nav>
  )
}
