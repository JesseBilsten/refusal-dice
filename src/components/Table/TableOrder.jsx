import React from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { Pencil } from 'lucide-react'
import { cn } from '../../lib/utils'
import { STANDING_STATUS } from './Standings'

const CHIP = {
  lose: 'border-odds-lose/50 bg-odds-lose/15',
  coin: 'border-odds-coin/60 bg-odds-coin/15',
  safe: 'border-odds-safe/50 bg-odds-safe/15',
  primary: 'border-primary/40 bg-primary/10',
}

/**
 * The table in seat order, fixed for the whole game (Play's side panel):
 * it starts at the player who won the piddle and goes left. The Hammer is a
 * token that slides down the list as play passes left, so the order of
 * play is always in view. Rows fill in one by one when it first appears.
 *
 * rows: [{ id, name, you, detail, tags, status, active, pencils, out }]
 *  - tags: role labels, e.g. ['1st refusal']
 *  - status: a key of STANDING_STATUS (Worst hand, In the cup, Pencil, …)
 * hammer: the id holding the Hammer
 */
export default function TableOrder({
  rows,
  hammer,
  maxPencils = 3,
  label = 'The table, in order of play',
  className,
}) {
  const reduced = useReducedMotion()
  return (
    <ol
      aria-label={label}
      className={cn(
        'divide-y overflow-hidden rounded-lg border bg-background',
        className
      )}
    >
      {rows.map((r, i) => {
        const status = r.status && STANDING_STATUS[r.status]
        const Icon = status?.icon
        return (
          <motion.li
            key={r.id}
            initial={reduced ? false : { opacity: 0, x: 12 }}
            animate={{ opacity: r.out ? 0.5 : 1, x: 0 }}
            transition={{ delay: reduced ? 0 : i * 0.12, duration: 0.3 }}
            className={cn(
              'flex items-center gap-3 px-3 py-2',
              r.active && 'bg-pop/10'
            )}
            aria-current={r.active ? 'true' : undefined}
          >
            <span
              className="flex w-7 shrink-0 justify-center text-lg"
              aria-label={r.id === hammer ? 'Holds the Hammer' : undefined}
            >
              {r.id === hammer && (
                <motion.span
                  layoutId="hammer-token"
                  transition={{
                    duration: reduced ? 0 : 0.6,
                    ease: 'easeInOut',
                  }}
                  aria-hidden
                >
                  🔨
                </motion.span>
              )}
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className={cn('font-semibold', r.you && 'text-primary')}>
                  {r.name}
                </span>
                {r.tags?.map((t) => (
                  <span
                    key={t}
                    className="text-xs font-medium text-muted-foreground"
                  >
                    {t}
                  </span>
                ))}
                {status && (
                  <span
                    className={cn(
                      'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold',
                      CHIP[status.tone]
                    )}
                  >
                    {Icon && <Icon aria-hidden className="h-3.5 w-3.5" />}
                    {status.label}
                  </span>
                )}
                <span
                  className="ml-auto flex shrink-0 items-center gap-0.5"
                  role="img"
                  aria-label={
                    r.out
                      ? 'Out of the game'
                      : `${r.pencils} of ${maxPencils} pencils`
                  }
                >
                  {r.out ? (
                    <span className="text-xs font-medium text-muted-foreground">
                      Out
                    </span>
                  ) : (
                    Array.from({ length: maxPencils }, (_, k) => (
                      <Pencil
                        key={k}
                        aria-hidden
                        className={cn(
                          'h-3 w-3',
                          k < r.pencils
                            ? 'text-pop'
                            : 'text-muted-foreground/30'
                        )}
                      />
                    ))
                  )}
                </span>
              </span>
              {r.detail && (
                <span className="block text-sm text-muted-foreground">
                  {r.detail}
                </span>
              )}
            </span>
          </motion.li>
        )
      })}
    </ol>
  )
}
