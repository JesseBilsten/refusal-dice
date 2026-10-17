import React from 'react'
import { cn } from '../../lib/utils'
import { fmtPct } from './model'

/**
 * How strong a roll is for a call, as a tag: graded by `loss`, the chance
 * the Hammer takes the pencil calling it (callLoss() from call-odds.ts),
 * against an even share of the table. Always shows the number beside the
 * grade, so the color never carries the meaning alone.
 */
export const STRENGTH_GRADES = [
  { max: 0.15, label: 'Strong', tone: 'border-odds-safe/50 bg-odds-safe/15' },
  { max: 0.25, label: 'Good', tone: 'border-odds-safe/40 bg-odds-safe/10' },
  { max: 1 / 3, label: 'Fair', tone: 'border-odds-coin/60 bg-odds-coin/15' },
  { max: Infinity, label: 'Weak', tone: 'border-odds-lose/50 bg-odds-lose/15' },
]

export const strengthGrade = (loss) => STRENGTH_GRADES.find((g) => loss <= g.max)

export default function StrengthTag({ loss, className }) {
  const grade = strengthGrade(loss)
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold',
        grade.tone,
        className
      )}
    >
      {grade.label}
      <span className="font-normal text-muted-foreground">· {fmtPct(loss, 0)} to take the pencil</span>
    </span>
  )
}
