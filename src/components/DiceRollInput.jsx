import React, { useRef, useCallback, useEffect } from 'react'
import { Input } from './ui/input'
import { Button } from './ui/button'

/**
 * Shared 5-dice roll input component.
 *
 * Props:
 *  - diceValues: string[] of length 5 (each '' or '1'-'6')
 *  - onDiceChange: (newValues: string[]) => void
 *  - onClear: () => void           — called after clearing internal state
 *  - initialRoll?: string           — optional 5-char string to pre-fill on mount
 *  - className?: string             — additional wrapper classes
 */
const DiceRollInput = ({ diceValues, onDiceChange, onClear, initialRoll, className = '' }) => {
  const refs = [useRef(), useRef(), useRef(), useRef(), useRef()]

  // Pre-fill from initialRoll on mount (e.g. from URL param)
  useEffect(() => {
    if (initialRoll && initialRoll.length === 5) {
      const vals = initialRoll.split('')
      onDiceChange(vals)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // run once on mount

  const handleChange = useCallback((index, value) => {
    // Only allow 1-6 or empty
    if (value === '' || (value >= '1' && value <= '6' && value.length === 1)) {
      const next = [...diceValues]
      next[index] = value
      onDiceChange(next)

      // Auto-focus next input
      if (value !== '' && index < 4) {
        refs[index + 1].current?.focus()
      }
    }
  }, [diceValues, onDiceChange])

  const handleKeyDown = useCallback((index, e) => {
    // Backspace on empty field focuses previous
    if (e.key === 'Backspace' && diceValues[index] === '' && index > 0) {
      refs[index - 1].current?.focus()
    }
    // Typing a digit 1-6 when field already has a value: replace and advance
    if (e.key >= '1' && e.key <= '6' && diceValues[index] !== '') {
      e.preventDefault()
      const next = [...diceValues]
      next[index] = e.key
      onDiceChange(next)
      if (index < 4) {
        refs[index + 1].current?.focus()
      }
    }
  }, [diceValues, onDiceChange])

  const handleRollRandom = useCallback(() => {
    const randomRoll = Array.from({ length: 5 }, () =>
      String(Math.floor(Math.random() * 6) + 1)
    )
    onDiceChange(randomRoll)
  }, [onDiceChange])

  const handleClear = useCallback(() => {
    const empty = ['', '', '', '', '']
    onDiceChange(empty)
    onClear?.()
    refs[0].current?.focus()
  }, [onDiceChange, onClear])

  return (
    <div className={`flex flex-wrap items-center gap-2 sm:gap-3 ${className}`}>
      {/* Dice Inputs */}
      {diceValues.map((value, index) => (
        <Input
          key={index}
          ref={refs[index]}
          type="text"
          inputMode="numeric"
          pattern="[1-6]"
          maxLength={1}
          value={value}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          className="w-12 h-12 sm:w-14 sm:h-14 text-2xl sm:text-3xl text-center font-bold rounded-lg border-2 p-0"
          placeholder="?"
        />
      ))}

      {/* Action Buttons — same height as dice */}
      <Button onClick={handleRollRandom} variant="default" className="h-12 sm:h-14 px-4 text-sm ml-2">
        🎲 Roll
      </Button>
      <Button onClick={handleClear} variant="outline" className="h-12 sm:h-14 px-4 text-sm">
        Clear
      </Button>
    </div>
  )
}

export default DiceRollInput
