import React from 'react'
import { cn } from '../../lib/utils'
import { fmtPct } from './model'
import { STRENGTH_GRADES, strengthGrade } from './grades'

/**
 * How strong a roll is for a call, as a tag: graded by `loss`, the chance
 * the Hammer takes the pencil calling it (callLoss() from call-odds.ts),
 * against an even share of the table. Always shows the number beside the
 * grade, so the color never carries the meaning alone.
 */
export { STRENGTH_GRADES, strengthGrade }

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
