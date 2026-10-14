import React, { useEffect, useMemo, useRef, useState } from 'react'
import Die from '../Die'
import { cn } from '../../lib/utils'

const CELL = 8 // internal pixels per outcome; the canvas is scaled with CSS

const toDigits = (index, count) => {
  const out = []
  for (let i = 0; i < count; i++) {
    out.unshift((index % 6) + 1)
    index = Math.floor(index / 6)
  }
  return out
}

const sortedKey = (roll) => roll.slice().sort((a, b) => a - b).join('')

/** Bumps whenever the light/dark class on <html> changes, so the canvas can redraw. */
const useThemeVersion = () => {
  const [version, setVersion] = useState(0)
  useEffect(() => {
    if (typeof window === 'undefined') return undefined
    const observer = new MutationObserver(() => setVersion((v) => v + 1))
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [])
  return version
}

const token = (name) =>
  `hsl(${getComputedStyle(document.documentElement).getPropertyValue(name).trim()})`

/**
 * Every ordered outcome (6^n). One panel per value of the first die; inside
 * a panel, rows walk the next dice and columns the last ones.
 */
const OutcomeMap = ({ diceCount, matchByKey, diffKeys }) => {
  const canvases = useRef([])
  const [hover, setHover] = useState(null)
  const themeVersion = useThemeVersion()

  const inner = diceCount - 1
  const rowDigits = Math.floor(inner / 2)
  const colDigits = inner - rowDigits
  const rows = Math.pow(6, rowDigits)
  const cols = Math.pow(6, colDigits)

  const rollAt = (first, r, c) => [first, ...toDigits(r, rowDigits), ...toDigits(c, colDigits)]

  useEffect(() => {
    const on = token('--color-uncommon-border')
    const off = token('--color-border')
    const diff = token('--color-epic-border')
    canvases.current.forEach((canvas, i) => {
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const key = sortedKey(rollAt(i + 1, r, c))
          ctx.fillStyle = diffKeys && diffKeys.has(key) ? diff : matchByKey.get(key) ? on : off
          ctx.fillRect(c * CELL, r * CELL, CELL - 1, CELL - 1)
        }
      }
    })
    // rollAt is derived from the dimensions already listed
  }, [matchByKey, diffKeys, rows, cols, themeVersion]) // eslint-disable-line react-hooks/exhaustive-deps

  const pointerAt = (e, first) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const c = Math.min(cols - 1, Math.floor(((e.clientX - rect.left) / rect.width) * cols))
    const r = Math.min(rows - 1, Math.floor(((e.clientY - rect.top) / rect.height) * rows))
    const roll = rollAt(first, r, c)
    setHover({ roll, match: matchByKey.get(sortedKey(roll)) })
  }

  const axisNote = useMemo(() => {
    const ordinal = (n) => ['1st', '2nd', '3rd', '4th', '5th'][n - 1]
    const span = (from, count) =>
      count === 1 ? `the ${ordinal(from)} die` : `the ${ordinal(from)}–${ordinal(from + count - 1)} dice`
    if (diceCount === 1) return 'Each square is one face of the die.'
    const parts = ['Each panel is one value of the 1st die.']
    if (rowDigits) parts.push(`Rows step through ${span(2, rowDigits)};`)
    parts.push(`${rowDigits ? 'columns' : 'Squares'} step through ${span(2 + rowDigits, colDigits)}.`)
    return parts.join(' ')
  }, [diceCount, rowDigits, colDigits])

  const matchedCount = useMemo(() => {
    let n = 0
    for (let i = 0; i < Math.pow(6, diceCount); i++) {
      if (matchByKey.get(sortedKey(toDigits(i, diceCount)))) n++
    }
    return n
  }, [matchByKey, diceCount])

  return (
    <div>
      <div className={cn('grid gap-3', diceCount <= 2 ? 'grid-cols-1' : 'grid-cols-2 sm:grid-cols-3')}>
        {[1, 2, 3, 4, 5, 6].map((first, i) => (
          <figure key={first} className="min-w-0">
            <figcaption className="mb-1 flex items-center gap-1 text-xs text-muted-foreground">
              1st die <Die inline number={first} />
            </figcaption>
            <canvas
              ref={(el) => (canvases.current[i] = el)}
              width={cols * CELL}
              height={rows * CELL}
              role="img"
              aria-label={`Outcomes where the first die is ${first}`}
              onMouseMove={(e) => pointerAt(e, first)}
              onMouseLeave={() => setHover(null)}
              className="block h-auto w-full cursor-crosshair rounded-sm"
              style={{ imageRendering: 'pixelated', maxWidth: cols * 28 }}
            />
          </figure>
        ))}
      </div>
      <p className="mt-3 min-h-[1.75rem] text-sm" aria-live="polite">
        {hover ? (
          <span className="inline-flex items-center gap-1">
            {hover.roll.map((d, i) => (
              <Die key={i} inline number={d} />
            ))}
            <span className={cn('ml-1 font-medium', hover.match ? 'text-uncommon-foreground' : 'text-muted-foreground')}>
              {hover.match ? 'matches' : 'no match'}
            </span>
          </span>
        ) : (
          <span className="text-muted-foreground">
            {matchedCount.toLocaleString()} of {Math.pow(6, diceCount).toLocaleString()} squares lit.
            Hover or tap a square to see its roll.
          </span>
        )}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">{axisNote}</p>
    </div>
  )
}

export default OutcomeMap
