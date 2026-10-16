import React, { useMemo, useState } from 'react'
import { Switch } from '../ui/switch'
import { Label } from '../ui/label'
import { ToggleGroup, ToggleGroupItem } from '../ui/toggle-group'
import { cn } from '../../lib/utils'
import RollGrid from './RollGrid'
import OutcomeMap from './OutcomeMap'

/**
 * Every possible roll, with the matches lit up: the one way the site shows
 * "here is every roll this counts". Two views: the unique rolls (order
 * ignored, ×N outcomes each) and a map of every ordered outcome.
 *
 * rolls: [{ key: '11234' (sorted), roll: [1,1,2,3,4], count, match, owner?, patternIndex? }]
 * total: ordered outcomes (6^diceCount)
 * diffKeys: Set of keys outlined as "differs from the site" (Odds Lab compare)
 * matchLabel / missLabel: legend wording, e.g. 'Makes 10-3'
 * actions: extra controls or links shown beside the title
 * view / onViewChange: control the view ('unique' | 'ordered'), e.g. from the URL
 */
export default function EveryPossibility({
  rolls,
  total,
  diceCount = 5,
  diffKeys,
  title = 'Every possibility',
  matchLabel = 'Matches',
  missLabel = "Doesn't match",
  actions,
  view: viewProp,
  onViewChange,
  className,
}) {
  const [ownView, setOwnView] = useState('unique')
  const view = viewProp ?? ownView
  const setView = onViewChange ?? setOwnView
  const [matchesFirst, setMatchesFirst] = useState(false)
  const matchByKey = useMemo(
    () => new Map(rolls.map((r) => [r.key, r.match])),
    [rolls]
  )
  const showsKickers = rolls.some((r) => r.owner)

  return (
    <section className={className}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold">{title}</h2>
        <div className="flex flex-wrap items-center gap-4">
          {actions}
          {view === 'unique' && (
            <div className="flex items-center gap-2">
              <Switch
                id="matches-first"
                checked={matchesFirst}
                onCheckedChange={setMatchesFirst}
              />
              <Label htmlFor="matches-first" className="text-sm">
                Matches first
              </Label>
            </div>
          )}
          <ToggleGroup
            type="single"
            value={view}
            onValueChange={(v) => v && setView(v)}
            aria-label="View"
          >
            <ToggleGroupItem value="unique" className="h-8 px-3 text-xs">
              Unique rolls ({rolls.length})
            </ToggleGroupItem>
            <ToggleGroupItem value="ordered" className="h-8 px-3 text-xs">
              Every outcome ({total.toLocaleString()})
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>

      <div className="mb-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-sm border border-uncommon-border bg-uncommon" />{' '}
          {matchLabel}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-sm bg-muted" />{' '}
          {missLabel}
        </span>
        {diffKeys && diffKeys.size > 0 && (
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded-sm ring-2 ring-epic-border" />{' '}
            Differs from the site
          </span>
        )}
        {view === 'unique' && (
          <span>
            {showsKickers &&
              "Dimmed dice inside a match weren't needed by any requirement (the kicker). "}
            ×N is how many ordered outcomes give that roll.
          </span>
        )}
      </div>

      <div className={cn(view !== 'unique' && 'hidden')}>
        <RollGrid
          rolls={rolls}
          total={total}
          diffKeys={diffKeys}
          matchesFirst={matchesFirst}
        />
      </div>
      {view === 'ordered' && (
        <OutcomeMap
          diceCount={diceCount}
          matchByKey={matchByKey}
          diffKeys={diffKeys}
        />
      )}
    </section>
  )
}
