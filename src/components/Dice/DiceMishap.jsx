import React from 'react'
import { cn } from '../../lib/utils'
import DieFace from './DieFace'

const S = 56 // die size, px

/**
 * Each mishap: what it is (for screen readers), how wide the scene is, how
 * much of the table there is, and where each die sits. `x` and `y` place a
 * die's bottom-left corner above the table; `turn` tips it about that
 * corner (degrees, negative leans left).
 */
const MISHAPS = {
  cocked: {
    label: 'A cocked die, leaning on another die',
    width: 128,
    dice: [
      { value: 4, x: 4, y: 0 },
      { value: 3, x: 70, y: 0, turn: -22, rock: true },
    ],
  },
  stacked: {
    label: 'Two dice stacked, one on top of the other',
    width: 84,
    dice: [
      { value: 6, x: 14, y: 0 },
      { value: 2, x: 20, y: S, turn: 8 },
    ],
  },
  'off-table': {
    label: 'A die rolling off the edge of the table',
    width: 132,
    table: 0.62,
    drop: 36, // room under the table for the falling die
    dice: [
      { value: 1, x: 6, y: 0 },
      { value: 5, x: 80, y: -4, turn: 38 },
    ],
  },
  unknown: {
    label: 'A die with a question mark where its face should be',
    width: 128,
    dice: [
      { value: 2, x: 4, y: 0 },
      { value: null, x: 68, y: 0, turn: 6 },
    ],
  },
}

/**
 * Dice that didn't land right, for error pages: a cocked die, stacked dice,
 * a die off the table, a die no one can read. Purely illustrative; the page
 * says what went wrong in words.
 */
export default function DiceMishap({ kind = 'cocked', className }) {
  const m = MISHAPS[kind] || MISHAPS.cocked
  const floor = m.drop || 0
  return (
    <div
      role="img"
      aria-label={m.label}
      className={cn('relative shrink-0', className)}
      style={{ width: m.width, height: S * 2 + 8 + floor }}
    >
      <div
        aria-hidden
        className="absolute left-0 h-0.5 rounded-full bg-border"
        style={{ bottom: floor, width: `${(m.table || 1) * 100}%` }}
      />
      {m.dice.map((d, i) => (
        <div
          key={i}
          aria-hidden
          className={cn('absolute origin-bottom-left', d.rock && 'dice-rock')}
          style={{
            left: d.x,
            bottom: floor + d.y + 2,
            transform: d.turn ? `rotate(${d.turn}deg)` : undefined,
            '--turn': `${d.turn || 0}deg`,
          }}
        >
          <DieFace value={d.value} size={S} />
        </div>
      ))}
    </div>
  )
}

export const MISHAP_KINDS = Object.keys(MISHAPS)
