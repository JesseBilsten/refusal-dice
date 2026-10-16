import React from 'react'
import { cn } from '../../lib/utils'
import { DIE_SIZES } from './Die'

/**
 * An empty place for a die the player hasn't rolled or entered yet: a
 * dashed outline. RollInput's blank boxes share this look (SLOT_CLASS).
 * A die someone else rolled and hid is a Die with no value instead.
 */
export const SLOT_CLASS =
  'rounded-[22%] border-2 border-dashed border-input bg-background'

export default function DieSlot({ size = 'md', className }) {
  const px = DIE_SIZES[size] || size
  return (
    <span
      aria-hidden
      style={{ width: px, height: px }}
      className={cn('inline-block shrink-0', SLOT_CLASS, className)}
    />
  )
}
