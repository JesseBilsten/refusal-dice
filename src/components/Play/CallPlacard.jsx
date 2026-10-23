import React from 'react'
import { formatCallLabel, GAMES_MAP } from '../../lib/games-config'

const label = (call) => formatCallLabel(call)
const emoji = (call) => GAMES_MAP[call.game]?.emoji

/** The call, in its own placard: the game's emoji and name, and whose call it is */
export default function CallPlacard({
  call,
  caller,
  second,
  refused,
  hammerName,
  youHammer,
}) {
  if (!call)
    return (
      <div className="flex items-center gap-3 rounded-2xl border-2 border-dashed border-felt-foreground/40 p-3 text-felt-foreground">
        <span className="text-section" aria-hidden>
          🔨
        </span>
        <p className="font-medium">
          {refused
            ? `${label(refused)} was refused: ${youHammer ? 'your' : `${hammerName}’s`} second call is next`
            : youHammer
              ? 'Your call'
              : `Waiting for ${hammerName}’s call`}
        </p>
      </div>
    )
  return (
    <div
      key={`${label(call)}:${second}`}
      className="story-pop flex items-center gap-3 rounded-2xl border-2 border-primary bg-card p-3 shadow-md"
    >
      <span className="text-title leading-none" aria-hidden>
        {emoji(call)}
      </span>
      <div className="min-w-0">
        <p className="eyebrow text-muted-foreground">
          {second ? '2nd call' : '1st call'} · {caller}
          {second && ' · can’t be refused'}
        </p>
        <p className="font-display text-2xl font-bold leading-tight">
          {label(call)}
        </p>
        {refused && (
          <p className="text-xs text-muted-foreground">
            Refused: <s>{label(refused)}</s>
          </p>
        )}
      </div>
    </div>
  )
}
