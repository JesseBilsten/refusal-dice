import React, { useId } from 'react'
import { cn } from '../../lib/utils'

/**
 * A round table seen from above: every seat with its chance of the pencil,
 * the Hammer marked 🔨 and your seat at the bottom. Seats run clockwise
 * from yours, which is to your left (the way the Hammer passes).
 *
 * seats: [{ value, text, hammer, you }] in seat order clockwise from your
 * seat (index 0 is you). value is 0–1, shown as a percent; or `text` shows
 * a label instead (e.g. "1st"), untinted. `even` (0–1), an even share,
 * tints each value: better than it (safe) or worse (lose). `passTo`: draw the Hammer passing
 * from your seat to that seat index.
 */
const tone = (value, even) => (value == null ? 'plain' : value < even ? 'safe' : 'lose')

const FILL = {
  safe: 'fill-odds-safe/20 stroke-odds-safe',
  lose: 'fill-odds-lose/20 stroke-odds-lose',
  plain: 'fill-card stroke-border',
}

export default function SeatRing({ seats, even, passTo, label, className }) {
  const n = seats.length
  const arrow = `seatring-arrow-${useId().replace(/:/g, '')}`
  const R = 74
  // Seat i: clockwise on screen from the bottom
  const at = (i, r = R) => {
    const a = Math.PI / 2 + (2 * Math.PI * i) / n
    return [100 + r * Math.cos(a), 100 + r * Math.sin(a)]
  }
  const seatR = n > 6 ? 18 : n > 4 ? 21 : 24
  return (
    <svg viewBox="-8 -8 216 222" role="img" aria-label={label} className={cn('mx-auto h-auto w-full max-w-[15rem]', className)}>
      <defs>
        <marker id={arrow} viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" className="fill-primary" />
        </marker>
      </defs>
      <circle cx="100" cy="100" r="46" className="fill-felt" />
      {passTo != null && (() => {
        // An arc along the ring, in the gap between your seat and the new Hammer's
        const r = R
        const gap = (seatR + 4) / R / ((2 * Math.PI) / n)
        const [x1, y1] = at(gap, r)
        const [x2, y2] = at(passTo - gap, r)
        return (
          <path
            d={`M ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2}`}
            className="fill-none stroke-primary"
            strokeWidth="2.5"
            markerEnd={`url(#${arrow})`}
          />
        )
      })()}
      {seats.map((s, i) => {
        const [x, y] = at(i)
        const t = tone(s.value, even)
        return (
          <g key={i}>
            <circle cx={x} cy={y} r={seatR} strokeWidth={s.you ? 3 : 1.5} className={cn(FILL[t], s.you && 'stroke-primary')} />
            <text x={x} y={y} textAnchor="middle" dominantBaseline="central" className={cn('fill-foreground font-bold tabular-nums', n > 6 ? 'text-sm' : 'text-base')}>
              {s.text ?? `${Math.round(s.value * 100)}%`}
            </text>
            {s.hammer && (
              <text x={x + seatR * 0.75} y={y - seatR * 0.75} textAnchor="middle" dominantBaseline="central" className="text-base">
                🔨
              </text>
            )}
            {s.you && (
              <text x={x} y={y + seatR + 11} textAnchor="middle" dominantBaseline="central" className="fill-primary text-sm font-bold">
                You
              </text>
            )}
          </g>
        )
      })}
    </svg>
  )
}
