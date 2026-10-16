import React from 'react'
import { Settings as Gear } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover'
import Settings from './Settings'

/** The header's gear button: opens every site-wide setting */
const SettingsMenu = () => (
  <Popover>
    <PopoverTrigger
      aria-label="Settings"
      className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-input bg-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 data-[state=open]:bg-accent"
    >
      <Gear aria-hidden className="h-4 w-4" />
    </PopoverTrigger>
    <PopoverContent align="end" className="w-72">
      <h2 className="mb-3 font-display text-base font-bold">Settings</h2>
      <Settings />
    </PopoverContent>
  </Popover>
)

export default SettingsMenu
