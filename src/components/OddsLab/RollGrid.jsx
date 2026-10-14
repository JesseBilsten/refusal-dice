import React from 'react'
import Die from '../Die'
import { cn } from '../../lib/utils'

const pct = (count, total) => `${((count / total) * 100).toFixed(2)}%`

/**
 * Every unique roll (order ignored), weighted by how many ordered outcomes
 * produce it. Matches glow green; everything else fades out. Inside a match,
 * dice no requirement needed (kickers) are dimmed.
 */
const RollGrid = ({ rolls, total, diffKeys, matchesFirst }) => {
  const list = matchesFirst
    ? [...rolls].sort((a, b) => Number(b.match) - Number(a.match))
    : rolls

  return (
    <ul
      className="grid gap-1.5"
      style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(8.25rem, 1fr))' }}
      aria-label="All unique rolls"
    >
      {list.map((r) => {
        const showKickers = r.owner && r.owner.some((o) => o >= 0)
        const differs = diffKeys && diffKeys.has(r.key)
        const status = r.match ? 'matches' : 'no match'
        const pattern =
          r.patternIndex >= 0 ? ` (pattern ${String.fromCharCode(65 + r.patternIndex)})` : ''
        return (
          <li
            key={r.key}
            title={`${r.roll.join(' ')}: ${status}${pattern}. ${r.count} of ${total.toLocaleString()} outcomes (${pct(r.count, total)})${differs ? '. Differs from the site’s odds' : ''}`}
            className={cn(
              'flex items-center justify-between rounded-md border px-1 py-0.5 text-sm transition-all duration-300',
              r.match
                ? 'border-uncommon-border bg-uncommon text-uncommon-foreground'
                : 'border-transparent bg-muted/40 text-muted-foreground opacity-25 grayscale',
              differs && 'opacity-100 grayscale-0 ring-2 ring-epic-border'
            )}
          >
            <span className="sr-only">{`${r.roll.join(', ')}: ${status}`}</span>
            <span aria-hidden="true" className="flex items-center">
              {r.roll.map((d, i) => (
                <span
                  key={i}
                  className={cn('transition-opacity', showKickers && r.owner[i] === -1 && 'opacity-40')}
                >
                  <Die inline number={d} />
                </span>
              ))}
            </span>
            <span className="ml-1 text-right text-xs tabular-nums opacity-70">×{r.count}</span>
          </li>
        )
      })}
    </ul>
  )
}

export default RollGrid
