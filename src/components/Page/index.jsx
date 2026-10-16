import React from 'react'
import { Link } from 'gatsby'
import { ChevronRight } from 'lucide-react'
import { cn } from '../../lib/utils'

/**
 * The page frame. Every page sets its width here, never with its own
 * max-w-*, so content edges line up across the site.
 *
 *  - reading (768px): text you read top to bottom: Rules, Glossary, Learn
 *  - tool (1024px):   things you use: Strategy, Odds Lab, game pages
 *  - wide (1280px):   grids of cards: Games, Odds; matches the header
 */
export const PAGE_WIDTHS = {
  reading: 'max-w-3xl',
  tool: 'max-w-5xl',
  wide: 'max-w-7xl',
}

/** Width and side gutters only, for sections outside a Page (the home hero) */
export function Container({
  width = 'tool',
  className,
  children,
  as: As = 'div',
}) {
  return (
    <As
      className={cn(
        'mx-auto w-full px-4 sm:px-6 lg:px-8',
        PAGE_WIDTHS[width],
        className
      )}
    >
      {children}
    </As>
  )
}

export default function Page({ width = 'tool', className, children }) {
  return (
    <Container
      as="section"
      width={width}
      className={cn('py-8 sm:py-10', className)}
    >
      {children}
    </Container>
  )
}

/**
 * The top of every page: breadcrumbs, title, one or two lines of
 * description, then optional links or actions. Left-aligned everywhere.
 *
 *  - breadcrumbs: [{ to, label }], the current page last (no `to`)
 *  - badge: a node after the title, e.g. <Badge>beta</Badge>
 *  - eyebrow: a small label above the title, e.g. "Coming soon"
 *  - children: links or actions under the description
 */
export function PageHeader({
  title,
  description,
  breadcrumbs,
  badge,
  eyebrow,
  children,
  className,
}) {
  return (
    <header className={cn('mb-8', className)}>
      {breadcrumbs && (
        <nav
          aria-label="Breadcrumb"
          className="mb-3 text-sm text-muted-foreground"
        >
          <ol className="flex flex-wrap items-center gap-1">
            {breadcrumbs.map((b, i) => (
              <li key={b.label} className="flex items-center gap-1">
                {i > 0 && <ChevronRight aria-hidden className="h-3.5 w-3.5" />}
                {b.to ? (
                  <Link to={b.to} className="hover:text-primary">
                    {b.label}
                  </Link>
                ) : (
                  <span
                    aria-current="page"
                    className="font-medium text-foreground"
                  >
                    {b.label}
                  </span>
                )}
              </li>
            ))}
          </ol>
        </nav>
      )}
      {eyebrow && (
        <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-primary">
          {eyebrow}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          {title}
        </h1>
        {badge}
      </div>
      {description && (
        <p className="mt-2 max-w-2xl text-base text-muted-foreground sm:text-lg">
          {description}
        </p>
      )}
      {children && <div className="mt-3 text-sm">{children}</div>}
    </header>
  )
}

export { default as Panel, Stat } from './Panel'
export { default as PageTabs, tabFromUrl } from './PageTabs'
export { default as Chip } from './Chip'
export { default as NextStep } from './NextStep'
