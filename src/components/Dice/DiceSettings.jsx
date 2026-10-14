import React from 'react'
import { Switch } from '../ui/switch'
import { Label } from '../ui/label'
import { cn } from '../../lib/utils'
import { useDicePrefs } from './preferences'
import { playRollSound } from './sound'

/** Opt-in 3D dice and dice sounds (both start off and muted) */
const DiceSettings = ({ className }) => {
  const [prefs, update] = useDicePrefs()
  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-x-5 gap-y-2 text-sm',
        className
      )}
    >
      <div className="flex items-center gap-2">
        <Switch
          id="dice-3d"
          checked={prefs.dice3d}
          onCheckedChange={(on) => update({ dice3d: on })}
        />
        <Label htmlFor="dice-3d">3D dice</Label>
      </div>
      <div className="flex items-center gap-2">
        <Switch
          id="dice-sound"
          checked={prefs.sound}
          onCheckedChange={(on) => {
            update({ sound: on })
            // Turning sound on is a user gesture, so it also unlocks audio; play a sample
            if (on) playRollSound(2)
          }}
        />
        <Label htmlFor="dice-sound">Sound</Label>
      </div>
    </div>
  )
}

export default DiceSettings
