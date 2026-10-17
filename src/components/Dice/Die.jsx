import React, { useEffect, useRef, useState } from 'react'
import { Lock } from 'lucide-react'
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

const cubeTransform = (value, size, rollId) => {
  // Each roll adds two whole turns, so the cube tumbles but lands on `value`
  const [x, y] = FACE_ROTATION[value]
  const turns = 720 * rollId
  return `translateZ(${-size / 2}px) rotateX(${x + turns}deg) rotateY(${y + turns}deg)`
}

const Cube = ({ value, size, rollId, bouncing, settled }) => {
  const target = cubeTransform(value, size, rollId)
  // A cube that appears already rolled (the first roll, or 3D just switched
  // on) starts a roll behind and tumbles into place instead of popping in;
  // a settled die (one that only moved) starts where it landed
  const [shown, setShown] = useState(() =>
    rollId > 0 && !settled ? cubeTransform(value, size, rollId - 1) : target
  )
  useEffect(() => {
    let inner
    const outer = requestAnimationFrame(() => {
      inner = requestAnimationFrame(() => setShown(target))
    })
    return () => {
      cancelAnimationFrame(outer)
      cancelAnimationFrame(inner)
    }
  }, [target])

  return (
    <div
      className={cn('dice-scene', bouncing && 'dice-bounce')}
      style={{ width: size, height: size, perspective: size * 6 }}
    >
      <div className="dice-cube" style={{ transform: shown }}>
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

/** Die sizes in px. Use these names rather than numbers so dice stay consistent */
export const DIE_SIZES = { xs: 16, sm: 28, md: 40, lg: 52 }
const px = (size) => (typeof size === 'number' ? size : DIE_SIZES[size] || 40)

/**
 * The one die used everywhere (see docs/DESIGN_SYSTEM.md): flat by
 * default, a tumbling 3D cube when the player turned 3D dice on (and hasn't
 * asked for reduced motion). Bump `rollId` whenever this die is rolled to
 * animate it.
 *
 * - `onClick` makes it a button: in a modeled game, tapping keeps the die
 *   (pass `kept`); in a roll input, tapping edits it
 * - `kept`: set aside, not re-rolled (shown with a lock badge)
 * - `locked`: can't be tapped right now
 * - `dimension`: '3d' or 'flat' to override the player's setting (the
 *   home page's story always tumbles); reduced motion still wins
 * - `settled`: this die already showed its roll and has only moved (e.g.
 *   put out into another group), so it slides in instead of rolling
 */
const Die = ({
  value,
  size = 'md',
  rollId = 0,
  onClick,
  kept,
  locked,
  label,
  dimension,
  settled,
  className,
}) => {
  const [prefs] = useDicePrefs()
  const reduced = usePrefersReducedMotion()
  const [rolling, setRolling] = useState(false)
  const n = px(size)

  // A settled die mounts with its roll already shown: only a later roll animates
  const [slid] = useState(settled)
  const shownRoll = useRef(settled ? rollId : 0)

  // Flat dice wobble; 3D dice bounce while they tumble
  useEffect(() => {
    if (!rollId || reduced || rollId === shownRoll.current) return
    setRolling(true)
    const t = setTimeout(() => setRolling(false), 950)
    return () => clearTimeout(t)
  }, [rollId, reduced])

  // Tiny dice (in tables and text) stay flat and still
  const want3d = dimension ? dimension === '3d' : prefs.dice3d
  const show3d = want3d && !reduced && value && n >= 32
  const face = show3d ? (
    <Cube value={value} size={n} rollId={rollId} bouncing={rolling} settled={slid} />
  ) : (
    <DieFace
      value={value}
      size={n}
      className={rolling && n >= 32 ? 'dice-wobble' : undefined}
    />
  )

  // The face always sits in the same wrapper, so becoming clickable (or not) never remounts it mid-roll
  return (
    <span
      className={cn(
        'relative inline-flex shrink-0 rounded-[22%] transition-transform',
        kept && '-translate-y-1',
        slid && 'dice-slide',
        className
      )}
    >
      {face}
      {kept && (
        <span
          aria-hidden
          className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-foreground text-background"
        >
          <Lock className="h-2.5 w-2.5" />
        </span>
      )}
      {onClick && (
        <button
          type="button"
          onClick={onClick}
          disabled={locked}
          aria-pressed={kept === undefined ? undefined : !!kept}
          aria-label={label || (value ? `Die showing ${value}` : 'Hidden die')}
          className={cn(
            'absolute inset-0 rounded-[22%] focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
            locked ? 'cursor-not-allowed' : 'cursor-pointer'
          )}
        />
      )}
    </span>
  )
}

export default Die
