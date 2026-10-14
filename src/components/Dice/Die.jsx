import React, { useEffect, useState } from 'react'
import { cn } from '../../lib/utils'
import DieFace from './DieFace'
import { useDicePrefs, usePrefersReducedMotion } from './preferences'
import './dice.css'

/** Cube rotation that brings each face to the front (opposite faces sum to 7) */
const FACE_ROTATION = {
  1: [0, 0],
  2: [-90, 0],
  3: [0, -90],
  4: [0, 90],
  5: [90, 0],
  6: [0, 180],
}

/** Where each face sits on the cube */
const FACE_PLACEMENT = {
  1: 'rotateY(0deg)',
  2: 'rotateX(90deg)',
  3: 'rotateY(90deg)',
  4: 'rotateY(-90deg)',
  5: 'rotateX(-90deg)',
  6: 'rotateY(180deg)',
}

const Cube = ({ value, size, rollId }) => {
  // Each roll adds whole turns, so the cube tumbles but lands on `value`
  const [x, y] = FACE_ROTATION[value]
  const turns = 360 * (2 * rollId)
  return (
    <div
      className="dice-scene"
      style={{ width: size, height: size, perspective: size * 6 }}
    >
      <div
        className="dice-cube"
        style={{
          transform: `translateZ(${-size / 2}px) rotateX(${x + turns}deg) rotateY(${y + turns}deg)`,
        }}
      >
        {[1, 2, 3, 4, 5, 6].map((face) => (
          <div
            key={face}
            className="dice-cube-face"
            style={{
              transform: `${FACE_PLACEMENT[face]} translateZ(${size / 2}px)`,
            }}
          >
            <DieFace value={face} size={size} />
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * A die for game tables and the tutorial: flat by default, a tumbling 3D
 * cube when the player turned 3D dice on (and hasn't asked for reduced
 * motion). Bump `rollId` whenever this die is rolled to animate it.
 *
 * - `onClick` makes it a toggle button (for picking dice to re-roll)
 * - `selected`: picked to re-roll; `locked`: can't be picked
 * - `tone`: 'game' (dice that make the game) or 'kicker'
 */
const Die = ({
  value,
  size = 48,
  rollId = 0,
  onClick,
  selected,
  locked,
  tone,
  label,
  className,
}) => {
  const [prefs] = useDicePrefs()
  const reduced = usePrefersReducedMotion()
  const [wobble, setWobble] = useState(false)

  useEffect(() => {
    if (!rollId || reduced || prefs.dice3d) return
    setWobble(true)
    const t = setTimeout(() => setWobble(false), 500)
    return () => clearTimeout(t)
  }, [rollId, reduced, prefs.dice3d])

  const show3d = prefs.dice3d && !reduced && value
  const face = show3d ? (
    <Cube value={value} size={size} rollId={rollId} />
  ) : (
    <DieFace
      value={value}
      size={size}
      className={wobble ? 'dice-wobble' : undefined}
    />
  )

  const frame = cn(
    'relative inline-flex rounded-[22%] transition-transform',
    tone === 'game' &&
      'ring-2 ring-primary ring-offset-2 ring-offset-background',
    tone === 'kicker' &&
      'ring-1 ring-muted-foreground/50 ring-offset-2 ring-offset-background',
    selected &&
      '-translate-y-2 ring-2 ring-destructive ring-offset-2 ring-offset-background',
    className
  )

  // The face always sits in the same wrapper, so becoming clickable (or not) never remounts it mid-roll
  return (
    <span className={frame}>
      {face}
      {onClick && (
        <button
          type="button"
          onClick={onClick}
          aria-pressed={!!selected}
          aria-label={label || (value ? `Die showing ${value}` : 'Hidden die')}
          className={cn(
            'absolute inset-0 rounded-[22%] focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            locked && 'cursor-not-allowed'
          )}
        />
      )}
    </span>
  )
}

export default Die
