import React from 'react'
import { Link } from 'gatsby'
import { ChevronRight } from 'lucide-react'
import { cn } from '../../lib/utils'

/**
 * The page frame. Every page sits in the header's frame (1280px), so titles
 * line up under the logo on every page and nothing jumps as you move
 * between pages. `width` caps the content column, left-aligned; never set
 * a page's width with its own max-w-*.
 *
 *  - reading (768px): text you read top to bottom: Rules, Glossary
 *  - tool (1024px):   things you use: Strategy, Odds Lab, Play, game pages
 *  - wide (1280px):   grids of cards: Games, the home page
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
    <Container as="section" width="wide" className={cn('py-8 sm:py-10', className)}>
      <div className={PAGE_WIDTHS[width]}>{children}</div>
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
        <p className="eyebrow mb-2 text-primary">
          {eyebrow}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <h1 className="text-title text-foreground">
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
export { default as ChoiceGroup } from './ChoiceGroup'
export { default as NextStep } from './NextStep'
export { default as StepNumber } from './StepNumber'
export { default as StepPanel } from './StepPanel'
export { default as TextLink, Term } from './TextLink'
export { default as Field, EmptyState } from './Field'
