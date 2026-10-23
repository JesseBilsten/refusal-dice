import React from 'react'
import { Pause, Play as Resume, SkipForward } from 'lucide-react'
import { ToggleGroup, ToggleGroupItem } from '../ui/toggle-group'
import { PACES } from './play-model'

/*
 * Play's controls on the felt, like a video player's: Transport (pause,
 * play, step to the next move) and SpeedPicker (every speed in view, with
 * what the chosen one means).
 */

/** Play, pause and step: the table's controls, like a video player's */
export function Transport({ paused, onToggle, onStep, canStep }) {
  const button =
    'inline-flex min-h-11 items-center gap-1.5 rounded-full border border-felt-foreground/40 px-3 text-sm font-medium text-felt-foreground transition-colors hover:bg-felt-foreground/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40 disabled:hover:bg-transparent'
  return (
    <div
      className="flex items-center gap-2"
      role="group"
      aria-label="Table controls"
    >
      <button type="button" onClick={onToggle} className={button}>
        {paused ? (
          <Resume aria-hidden className="h-4 w-4" />
        ) : (
          <Pause aria-hidden className="h-4 w-4" />
        )}
        {paused ? 'Play' : 'Pause'}
      </button>
      <button
        type="button"
        onClick={onStep}
        disabled={!canStep}
        className={button}
      >
        <SkipForward aria-hidden className="h-4 w-4" /> Next
      </button>
    </div>
  )
}

/** Every speed in view, slowest to instant, and what the chosen one means */
export function SpeedPicker({ pace, onPace }) {
  const current = PACES.find((p) => p.id === pace) ?? PACES[0]
  return (
    <div className="space-y-1.5 text-felt-foreground">
      <ToggleGroup
        type="single"
        value={current.id}
        onValueChange={(v) => v && onPace(v)}
        aria-label="Speed"
        aria-describedby="play-speed-about"
        className="grid grid-cols-3 gap-1 rounded-xl border border-felt-foreground/40 p-1 sm:grid-cols-6"
      >
        {PACES.map((p) => (
          <ToggleGroupItem
            key={p.id}
            value={p.id}
            className="min-h-10 whitespace-nowrap rounded-lg px-1.5 py-1 text-sm text-felt-foreground hover:bg-felt-foreground/10 hover:text-felt-foreground data-[state=on]:bg-felt-foreground data-[state=on]:font-semibold data-[state=on]:text-felt data-[state=on]:shadow-sm"
          >
            {p.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
      <p
        id="play-speed-about"
        className="text-xs text-felt-foreground/85"
        aria-live="polite"
      >
        <span className="font-semibold">Speed: {current.label}.</span>{' '}
        {current.about}
      </p>
    </div>
  )
}
