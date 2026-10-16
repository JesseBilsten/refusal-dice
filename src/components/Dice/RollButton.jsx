import React from 'react'
import { Dices } from 'lucide-react'
import { Button } from '../ui/button'
import { cn } from '../../lib/utils'

/**
 * The one Roll button: anywhere the player rolls dice, entered (RollInput)
 * or scripted (the tutorial). Takes Button props.
 */
export default function RollButton({ children = 'Roll', className, ...props }) {
  return (
    <Button className={cn('gap-2', className)} {...props}>
      <Dices aria-hidden className="h-4 w-4" />
      {children}
    </Button>
  )
}
