import React from 'react'
import { Lightbulb } from 'lucide-react'
import { ProbabilityBar, fmtPct } from '../Odds'
import { cn } from '../../lib/utils'

/**
 * The hint in Play: what a solid player would do, and your chance of the
 * pencil with each option they weighed (the pick marked), then why.
 * `stats` comes from hintStats() in ./hint-stats.ts; `pending` while its
 * rounds are still being played out, `note` says how the chances were found,
 * `disagree` when the rounds played out favour another option than the pick.
 */
export default function HintCard({ hint, stats, className }) {
  return (
    <div className={cn('space-y-3 rounded-xl border bg-card p-3 text-sm shadow-sm', className)}>
      <p className="flex items-start gap-2">
        <Lightbulb aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-odds-coin" />
        <span>
          <strong>A solid player would:</strong> {hint}
        </span>
      </p>
      {stats?.pending && (
        <p className="animate-pulse text-xs text-muted-foreground" role="status">
          Playing the round out to find your chance of the pencil…
        </p>
      )}
      {stats?.rows.length > 0 && (
        <div>
          <p className="mb-1.5 text-xs font-medium text-muted-foreground">{stats.measure}</p>
          <ul className="space-y-1">
            {stats.rows.map((r) => (
              <li key={r.label} className={cn('rounded-md px-1.5 py-1', r.best && 'bg-primary/10 ring-1 ring-primary/30')}>
                <ProbabilityBar label={r.label} p={r.value} tone="lose" digits={0} className="grid-cols-[minmax(0,9rem)_1fr_auto] gap-2" />
                {r.tie > 0.005 && <p className="text-xs text-muted-foreground">plus a {fmtPct(r.tie, 0)} chance of a tie</p>}
                {r.best && <span className="sr-only"> (the pick)</span>}
              </li>
            ))}
          </ul>
        </div>
      )}
      {stats?.disagree && <p className="rounded-md border border-odds-coin/50 bg-odds-coin/10 p-2 text-xs font-medium">{stats.disagree}</p>}
      {stats?.why && <p className="text-xs leading-relaxed text-muted-foreground">{stats.why}</p>}
      {stats?.note && <p className="text-xs text-muted-foreground">{stats.note}</p>}
    </div>
  )
}
