import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Button } from '../ui/button'
import { cn } from '../../lib/utils'
import Die, { DIE_SIZES } from './Die'
import RollButton from './RollButton'
import { SLOT_CLASS } from './DieSlot'
import { useDicePrefs } from './preferences'
import { playRollSound } from './sound'

/**
 * Enter a roll of five dice. A blank slot is a box you type 1–6 into; once
 * it has a number it shows as a die, and tapping the die turns it back
 * into a box to change it. Focus moves to the next blank slot as you type,
 * Backspace on a blank slot goes back one, and pasting "13655" fills the
 * slots in order. Use this anywhere players edit a roll.
 *
 * Props:
 *  - diceValues: string[5], each '' or '1'–'6'
 *  - onDiceChange(values)
 *  - onClear?()
 *  - initialRoll?: '13655', filled in once on mount (e.g. from the URL)
 *  - size?: a Die size (default 'lg')
 */
const DIGIT = /[1-6]/

export default function RollInput({
  diceValues,
  onDiceChange,
  onClear,
  initialRoll,
  size = 'lg',
  className,
}) {
  const inputs = useRef([])
  const [editing, setEditing] = useState(null)
  const [focusAt, setFocusAt] = useState(null)
  const [rollIds, setRollIds] = useState(() => diceValues.map(() => 0))
  const [prefs] = useDicePrefs()
  const px = DIE_SIZES[size] || size

  useEffect(() => {
    if (initialRoll && /^[1-6]{5}$/.test(initialRoll))
      onDiceChange(initialRoll.split(''))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Focus after React has swapped a die for its input
  useEffect(() => {
    if (focusAt == null) return
    const el = inputs.current[focusAt]
    if (el) {
      el.focus()
      el.select()
    }
    setFocusAt(null)
  }, [focusAt])

  /** After filling slot `i`: go to the next blank slot, or finish */
  const advance = useCallback((i, values) => {
    const next = values.findIndex((v, k) => k > i && v === '')
    setEditing(null)
    if (next >= 0) setFocusAt(next)
    else inputs.current[i]?.blur()
  }, [])

  const fill = useCallback(
    (i, digits) => {
      const next = [...diceValues]
      digits.slice(0, next.length - i).forEach((d, k) => (next[i + k] = d))
      onDiceChange(next)
      advance(i + digits.length - 1, next)
    },
    [diceValues, onDiceChange, advance]
  )

  const handleChange = (i, raw) => {
    // The last digit typed wins, so typing over a selected value replaces it
    const d = [...raw].reverse().find((c) => DIGIT.test(c))
    if (d) fill(i, [d])
    else if (raw === '') {
      const next = [...diceValues]
      next[i] = ''
      onDiceChange(next)
    }
  }

  const handleKeyDown = (i, e) => {
    if (e.key === 'Backspace' && diceValues[i] === '' && i > 0) {
      e.preventDefault()
      setEditing(i - 1)
      setFocusAt(i - 1)
    } else if (e.key === 'Escape' || e.key === 'Enter') {
      setEditing(null)
      e.currentTarget.blur()
    } else if (e.key === 'ArrowLeft' && i > 0) {
      setEditing(i - 1)
      setFocusAt(i - 1)
    } else if (e.key === 'ArrowRight' && i < diceValues.length - 1) {
      setEditing(i + 1)
      setFocusAt(i + 1)
    }
  }

  const handlePaste = (i, e) => {
    const digits = [...e.clipboardData.getData('text')].filter((c) =>
      DIGIT.test(c)
    )
    if (!digits.length) return
    e.preventDefault()
    fill(i, digits)
  }

  const roll = () => {
    const values = diceValues.map(() => String(Math.ceil(Math.random() * 6)))
    setEditing(null)
    setRollIds((ids) => ids.map((n) => n + 1))
    if (prefs.sound) playRollSound(values.length)
    onDiceChange(values)
  }

  const clear = () => {
    onDiceChange(diceValues.map(() => ''))
    onClear?.()
    setEditing(0)
    setFocusAt(0)
  }

  return (
    <div
      className={cn('flex flex-wrap items-center gap-2 sm:gap-3', className)}
    >
      <div className="flex gap-2" role="group" aria-label="Your roll">
        {diceValues.map((value, i) =>
          value === '' || editing === i ? (
            <input
              key={`input-${i}`}
              ref={(el) => (inputs.current[i] = el)}
              type="text"
              inputMode="numeric"
              autoComplete="off"
              maxLength={2}
              value={value}
              placeholder="?"
              aria-label={`Die ${i + 1} (1 to 6)`}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              onPaste={(e) => handlePaste(i, e)}
              onBlur={() => setEditing((cur) => (cur === i ? null : cur))}
              style={{ width: px, height: px }}
              className={cn(
                SLOT_CLASS,
                'p-0 text-center text-2xl font-bold caret-primary placeholder:text-muted-foreground/60 focus:border-solid focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/30'
              )}
            />
          ) : (
            <Die
              key={`die-${i}`}
              value={Number(value)}
              size={size}
              rollId={rollIds[i]}
              label={`Die ${i + 1} shows ${value}. Tap to change it`}
              onClick={() => {
                setEditing(i)
                setFocusAt(i)
              }}
            />
          )
        )}
      </div>
      <div className="flex gap-2">
        <RollButton onClick={roll} style={{ height: px }} className="px-4" />
        <Button
          onClick={clear}
          variant="outline"
          style={{ height: px }}
          className="px-4 text-sm"
        >
          Clear
        </Button>
      </div>
    </div>
  )
}
