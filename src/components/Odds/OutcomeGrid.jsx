import React from 'react'
import { cn } from '../../lib/utils'
import { fmtPct, twoDiceGrid } from './model'
import { Swatch } from './OddsDecision'

/**
 * All 36 ways two dice land, colored by what each means for you. Seeing
 * "3 boxes out of 36" makes a probability concrete in a way a percent
 * doesn't. Cells carry a mark (✓, =) as well as a color, so color isn't
 * the only cue.
 *
 * classify(a, b) → a key of `kinds`
 * kinds: { key: { label: 'Beats 10: safe', kind: 'safe', mark: '✓' } }
 */

const TINT = {
  lose: 'bg-odds-lose/15 border-odds-lose/40',
  coin: 'bg-odds-coin/25 border-odds-coin/60',
  safe: 'bg-odds-safe/25 border-odds-safe/70',
}

export default function OutcomeGrid({ title, classify, kinds }) {
  const cells = twoDiceGrid(classify)
  const counts = Object.keys(kinds).map((key) => ({
    key,
    ...kinds[key],
    n: cells.filter((c) => c.kind === key).length,
  }))
  return (
    <figure className="space-y-2">
      <figcaption className="text-sm font-medium">{title}</figcaption>
      <div className="flex gap-3">
        <div
          role="img"
          aria-label={counts.map((c) => `${c.n} of 36: ${c.label}`).join('; ')}
          className="grid w-48 shrink-0 grid-cols-6 gap-0.5 sm:w-56"
        >
          {cells.map((c) => {
            const k = kinds[c.kind]
            return (
              <div
                key={`${c.a}-${c.b}`}
                aria-hidden
                title={`${c.a}+${c.b} = ${c.sum}`}
                className={cn(
                  'flex aspect-square flex-col items-center justify-center rounded-sm border text-[10px] leading-none tabular-nums',
                  TINT[k.kind]
                )}
              >
                <span className="font-semibold">{c.sum}</span>
                {k.mark && <span>{k.mark}</span>}
              </div>
            )
          })}
        </div>
        <ul className="space-y-2 text-sm">
          {counts.map((c) => (
            <li key={c.key} className="flex gap-1.5">
              <Swatch kind={c.kind} className="mt-1" />
              <span>
                <span className="font-semibold tabular-nums">{c.n} of 36</span>{' '}
                <span className="text-muted-foreground">
                  ({fmtPct(c.n / 36, 1)})
                </span>
                <br />
                {c.mark && <span aria-hidden>{c.mark} </span>}
                {c.label}
              </span>
            </li>
          ))}
        </ul>
      </div>
      <p className="text-xs text-muted-foreground">
        Each box is one way the two dice can land; the number is their total.
      </p>
    </figure>
  )
}
