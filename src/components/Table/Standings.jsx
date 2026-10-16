import React from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { Check, Pencil } from 'lucide-react'
import { cn } from '../../lib/utils'

/**
 * The ranking pattern: players best first, each with a rank, a line of
 * detail, and a status chip when their place means something. Rows slide
 * to their new place when the order changes (not with reduced motion).
 * Used for the piddle and for the table during a round (Play).
 *
 * rows: [{ id, name, rank, you, detail, aside, status, statusLabel }]
 *  - rank: 1 is best; tied rows share a rank; null shows a dash
 *  - detail: a line under the name (the hand in words, rolls left)
 *  - aside: a node before the chip, e.g. the piddle die
 *  - status: a key of STANDING_STATUS, or omitted for none
 */
export const STANDING_STATUS = {
  /** Alone at the bottom: the loser right now */
  bottom: { label: 'Worst hand', tone: 'lose' },
  /** Tied at the bottom */
  tied: { label: 'Tied worst', tone: 'coin' },
  /** Can't lose this round: someone with a final hand is worse */
  safe: { label: 'In the cup', tone: 'safe', icon: Check },
  /** Took the pencil */
  pencil: { label: 'Pencil', tone: 'lose', icon: Pencil },
  /** Tied for the highest piddle: rolls again */
  again: { label: 'Rolls again', tone: 'coin' },
  /** Won the piddle */
  hammer: { label: '🔨 Hammer', tone: 'primary' },
  /** Boss: the best hand, partly hidden */
  boss: { label: '👑 Boss', tone: 'primary' },
}

const CHIP = {
  lose: 'border-odds-lose/50 bg-odds-lose/15',
  coin: 'border-odds-coin/60 bg-odds-coin/15',
  safe: 'border-odds-safe/50 bg-odds-safe/15',
  primary: 'border-primary/40 bg-primary/10',
}

const ROW = {
  lose: 'bg-odds-lose/[0.07]',
  coin: 'bg-odds-coin/[0.07]',
  safe: '',
  primary: 'bg-primary/5',
}

const ordinal = (n) => {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return n + (s[(v - 20) % 10] || s[v] || s[0])
}

export default function Standings({ rows, label, className }) {
  const reduced = useReducedMotion()
  return (
    <ol aria-label={label} className={cn('divide-y overflow-hidden rounded-lg border bg-background', className)}>
      {rows.map((r) => {
        const status = r.status && STANDING_STATUS[r.status]
        const Icon = status?.icon
        const tied = r.rank != null && rows.filter((x) => x.rank === r.rank).length > 1
        return (
          <motion.li
            key={r.id}
            layout={reduced ? false : 'position'}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className={cn('flex items-center gap-3 px-3 py-2', status && ROW[status.tone])}
          >
            <span
              className="w-6 shrink-0 text-center font-display text-lg font-bold tabular-nums text-muted-foreground"
              aria-label={r.rank == null ? 'unranked' : `${tied ? 'tied ' : ''}${ordinal(r.rank)}`}
            >
              {r.rank ?? '–'}
            </span>
            <span className="min-w-0 flex-1">
              <span className={cn('block font-semibold', r.you && 'text-primary')}>{r.name}</span>
              {r.detail && <span className="block text-sm text-muted-foreground">{r.detail}</span>}
            </span>
            {r.aside}
            {status && (
              <span
                className={cn(
                  'inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold',
                  CHIP[status.tone]
                )}
              >
                {Icon && <Icon aria-hidden className="h-3.5 w-3.5" />}
                {r.statusLabel || status.label}
              </span>
            )}
          </motion.li>
        )
      })}
    </ol>
  )
}
