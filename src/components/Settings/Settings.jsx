import React from 'react'
import { Monitor, Moon, Sun } from 'lucide-react'
import { ToggleGroup, ToggleGroupItem } from '../ui/toggle-group'
import { DiceSettings } from '../Dice'
import { cn } from '../../lib/utils'
import { useTheme } from './theme'

const THEME_OPTIONS = [
  { id: 'light', label: 'Light', icon: Sun },
  { id: 'dark', label: 'Dark', icon: Moon },
  { id: 'system', label: 'System', icon: Monitor },
]

/**
 * Every site-wide setting: theme, 3D dice and sound. Saved per browser.
 * Shown in the header's settings menu and the mobile menu.
 */
const Settings = ({ className }) => {
  const [theme, setTheme] = useTheme()
  return (
    <div className={cn('space-y-4', className)}>
      <div className="space-y-2">
        <div id="settings-theme" className="text-sm font-medium">
          Theme
        </div>
        <ToggleGroup
          type="single"
          value={theme ?? ''}
          onValueChange={(v) => v && setTheme(v)}
          aria-labelledby="settings-theme"
          className="grid grid-cols-3 gap-1 rounded-lg border bg-muted/40 p-1"
        >
          {THEME_OPTIONS.map(({ id, label, icon: Icon }) => (
            <ToggleGroupItem
              key={id}
              value={id}
              className="gap-1.5 px-1.5 py-1.5 data-[state=on]:bg-background data-[state=on]:text-foreground data-[state=on]:shadow-sm"
            >
              <Icon aria-hidden className="h-4 w-4 shrink-0" />
              {label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>
      <DiceSettings stacked />
    </div>
  )
}

export default Settings
