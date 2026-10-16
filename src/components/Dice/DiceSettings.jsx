import React, { useId } from 'react'
import { Switch } from '../ui/switch'
import { Label } from '../ui/label'
import { cn } from '../../lib/utils'
import { useDicePrefs } from './preferences'
import { playRollSound } from './sound'

/**
 * Opt-in 3D dice and dice sounds (both start off and muted). In a row by
 * default; `stacked` puts each on its own line, label first (the settings menu).
 */
const DiceSettings = ({ stacked, className }) => {
  const [prefs, update] = useDicePrefs()
  const id = useId()
  const options = [
    { key: 'dice3d', label: '3D dice', onChange: (on) => update({ dice3d: on }) },
    {
      key: 'sound',
      label: 'Sound',
      onChange: (on) => {
        update({ sound: on })
        // Turning sound on is a user gesture, so it also unlocks audio; play a sample
        if (on) playRollSound(2)
      },
    },
  ]
  return (
    <div
      className={cn(
        stacked ? 'space-y-3 text-sm' : 'flex flex-wrap items-center gap-x-5 gap-y-2 text-sm',
        className
      )}
    >
      {options.map((o) => (
        <div
          key={o.key}
          className={cn('flex items-center gap-2', stacked && 'flex-row-reverse justify-between')}
        >
          <Switch id={`${id}-${o.key}`} checked={prefs[o.key]} onCheckedChange={o.onChange} />
          <Label htmlFor={`${id}-${o.key}`}>{o.label}</Label>
        </div>
      ))}
    </div>
  )
}

export default DiceSettings
