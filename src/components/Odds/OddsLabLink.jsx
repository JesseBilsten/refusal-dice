import React from 'react'
import { withPrefix } from 'gatsby'
import { ExternalLink, FlaskConical } from 'lucide-react'
import { oddsLabPath } from '../../lib/roll-query'

/**
 * Opens the Odds Lab with `query` loaded, for odds too involved to show in
 * full where the decision is made. The Lab covers one roll of 1–5 dice, so
 * the link text should say what that roll is.
 *
 * It opens in a new tab: decision screens (the tutorial, a game) hold state
 * that following a link in the same tab would lose.
 */
export default function OddsLabLink({ query, compare, children }) {
  return (
    <a
      href={withPrefix(oddsLabPath(query, { compare }))}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 font-medium text-primary underline-offset-2 hover:underline"
    >
      <FlaskConical aria-hidden className="h-4 w-4 shrink-0" />
      <span>{children}</span>
      <ExternalLink aria-hidden className="h-3 w-3 shrink-0" />
      <span className="sr-only">(opens the Odds Lab in a new tab)</span>
    </a>
  )
}
