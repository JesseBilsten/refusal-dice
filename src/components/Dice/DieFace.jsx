import React from 'react'
import { cn } from '../../lib/utils'

/** Pip positions on a 0–100 grid */
const PIPS = {
  1: [[50, 50]],
  2: [
    [27, 27],
    [73, 73],
  ],
  3: [
    [25, 25],
    [50, 50],
    [75, 75],
  ],
  4: [
    [27, 27],
    [73, 27],
    [27, 73],
    [73, 73],
  ],
  5: [
    [26, 26],
    [74, 26],
    [50, 50],
    [26, 74],
    [74, 74],
  ],
  6: [
    [28, 24],
    [72, 24],
    [28, 50],
    [72, 50],
    [28, 76],
    [72, 76],
  ],
}

/** Michigan Red-Eye colors, matching the site's other dice: 1 and 6 black, 2 and 5 red, 3 and 4 blue */
const PIP_COLOR = {
  1: 'fill-pip-dark',
  2: 'fill-pip-red',
  3: 'fill-pip-blue',
  4: 'fill-pip-blue',
  5: 'fill-pip-red',
  6: 'fill-pip-dark',
}

/**
 * One flat die face as SVG, so it stays crisp at any size. `value` null
 * draws a face-down (hidden) die.
 */
const DieFace = ({ value, size = 48, className }) => (
  <svg
    viewBox="0 0 100 100"
    width={size}
    height={size}
    className={cn('block', className)}
    role="img"
    aria-label={value ? `Die showing ${value}` : 'Hidden die'}
  >
    <rect
      x="3"
      y="3"
      width="94"
      height="94"
      rx="16"
      className={
        value ? 'fill-dice stroke-dice-edge' : 'fill-muted stroke-border'
      }
      strokeWidth="3"
    />
    {value ? (
      PIPS[value].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="9" className={PIP_COLOR[value]} />
      ))
    ) : (
      <text
        x="50"
        y="64"
        textAnchor="middle"
        fontSize="44"
        className="fill-muted-foreground font-bold"
      >
        ?
      </text>
    )}
  </svg>
)

export default DieFace
