import React, { useState } from 'react'
import { CALLABLE_GAMES, getGameFullName } from '../lib/games-config'
import SecondCallDistribution from './SecondCallDistribution'
import { Chip, Panel } from './Page'

/**
 * If both refusals say no, what will the Hammer call instead? For a first
 * call, the second calls the Hammer's possible rolls point to (heuristic
 * Hammer strategy over every roll that can make the first call).
 */
export default function SecondCallPredictor() {
  const [game, setGame] = useState('monterey')
  const [variant, setVariant] = useState('low')
  const hasVariants = CALLABLE_GAMES.find((g) => g.id === game)?.hasVariants || false

  return (
    <div className="space-y-6">
      <p className="text-muted-foreground">
        Thinking of refusing? If both refusals say no, the Hammer must call a different game. Pick the first call to see
        what they’re most likely to call instead.
      </p>
      <Panel tone="tool" title="The first call" as="div">
        <div className="space-y-4">
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Game">
            {CALLABLE_GAMES.map((g) => (
              <Chip key={g.id} active={game === g.id} onClick={() => setGame(g.id)}>
                <span aria-hidden>{g.emoji}</span> {g.name}
              </Chip>
            ))}
          </div>
          {hasVariants && (
            <div className="flex gap-1.5" role="group" aria-label="Variant">
              {['high', 'low'].map((v) => (
                <Chip key={v} active={variant === v} onClick={() => setVariant(v)}>
                  {v === 'high' ? 'High' : 'Low'}
                </Chip>
              ))}
            </div>
          )}
        </div>
      </Panel>

      <SecondCallDistribution
        gameId={game}
        hasVariants={hasVariants}
        variant={hasVariants ? variant : null}
        numOpponents={2}
        showTabs={false}
        title={`Likely second calls after ${getGameFullName(game)}${hasVariants ? ` ${variant === 'high' ? 'High' : 'Low'}` : ''}`}
      />

      <Panel tone="note" title="How to use it">
        <ul className="list-disc space-y-1 pl-5 text-sm">
          <li>Weak on the first call but strong for the likely second calls? Refusing can pay.</li>
          <li>If the likely second calls are worse for your dice, accept a middling first call.</li>
          <li>
            These come from a rule-of-thumb Hammer, not a simulation: for your actual roll, the Strategy Assistant’s
            accept-or-refuse odds account for everything.
          </li>
        </ul>
      </Panel>
    </div>
  )
}
