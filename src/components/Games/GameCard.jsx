import React, { useMemo } from 'react'
import { Link } from 'gatsby'
import { Panel } from '../Page'
import { Hand } from '../Dice'
import { StrengthTag, fmtPct } from '../Odds'
import { Badge } from '../ui/badge'
import { buttonVariants } from '../ui/button'
import { formatCallLabel, GAMES_MAP } from '../../lib/games-config'
import { cn } from '../../lib/utils'

/**
 * One game on the Games page: how it's made, a note, how often it comes up
 * (or when it's worth calling), example hands, and links to its page and
 * every roll that makes it. `playable`: your entered roll plays it (with
 * `loss`, its strength); `dimmed`: your roll doesn't.
 */
export default function GameCard({ section, oneRoll, playable, loss, dimmed }) {
  const meta = GAMES_MAP[section.id]
  const callLine = useMemo(() => section.callLine?.(), [section])
  return (
    <Panel
      id={section.id}
      className={cn(
        'scroll-mt-24 transition-opacity',
        playable && 'border-primary ring-1 ring-primary',
        dimmed && 'opacity-50'
      )}
    >
      <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_auto]">
        <div>
          <div className="mb-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h2 className="text-section">
              <span aria-hidden>{meta.emoji}</span> {meta.fullName || meta.name}
            </h2>
            {meta.hasVariants && (
              <span className="text-sm text-muted-foreground">high or low</span>
            )}
            {playable && (
              <Badge>
                Your roll plays it
                {playable.variant ? `: ${formatCallLabel(playable)}` : ''}
              </Badge>
            )}
            {playable && <StrengthTag loss={loss} />}
          </div>
          <p className="mb-2">{section.made}</p>
          {section.note && (
            <p className="mb-2 text-sm text-muted-foreground">{section.note}</p>
          )}
          <p className="mb-4 text-sm text-muted-foreground">
            {callLine || `Made on one roll ${fmtPct(oneRoll, 1)} of the time.`}
          </p>
          <div className="flex flex-wrap gap-2">
            <Link
              to={`/games/${section.id}`}
              className={buttonVariants({ variant: 'outline', size: 'sm' })}
            >
              How to play it
            </Link>
            <Link
              to={`/odds-lab/?tab=games&game=${section.id}`}
              className={buttonVariants({ variant: 'ghost', size: 'sm' })}
            >
              Every roll that makes it
            </Link>
          </div>
        </div>
        <div className="flex flex-col gap-3 md:items-end">
          {section.examples.map((e, i) => (
            <Hand
              key={i}
              dice={e.dice}
              game={section.id}
              variant={e.variant}
              // Tres Away examples are finished hands, labeled with their score
              putOut={section.id === 'tres-away' ? [0, 1, 2, 3, 4] : undefined}
              size="sm"
              labels
            />
          ))}
        </div>
      </div>
    </Panel>
  )
}
