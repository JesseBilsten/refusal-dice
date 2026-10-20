import React, { useMemo, useState } from 'react'
import { CALLABLE_GAMES, formatCallLabel, getGameFullName } from '../lib/games-config'
import SecondCallDistribution from './SecondCallDistribution'
import { Chip, Panel } from './Page'
import { Disclosure, Questions, fmtPct } from './Odds'
import { comebackOf } from '../strategy'
import { useHouseRules } from './Settings/house-rules'

/** "10-3 Low (10-4 Low, 35%) and Monterey Low (10-4 Low, 30%)" */
const list = (xs) => {
  const parts = xs.map((x) => `${formatCallLabel(x.first)} (${formatCallLabel(x.comeback.call)}, ${fmtPct(x.comeback.share, 0)})`)
  return parts.length > 1 ? `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}` : parts[0]
}

/**
 * If both refusals say no, what will the Hammer call instead? For a first
 * call, the comebacks over every roll the site calls it with, exact
 * (src/strategy/comebacks.ts), plus the questions players ask about them.
 */
export default function SecondCallPredictor() {
  const [game, setGame] = useState('monterey')
  const [variant, setVariant] = useState('low')
  const hasVariants = CALLABLE_GAMES.find((g) => g.id === game)?.hasVariants || false
  const [rules] = useHouseRules()
  // The table's hunch: 10-3 Low or Monterey Low comes back with 10-4
  const tenFour = useMemo(() => {
    const all = comebackOf('10-4', rules)
    const top = all.filter((x) => x.top)
    const others = all.filter((x) => !x.top).slice(0, 2)
    return (
      `It's the likeliest comeback (or tied for it) after ${list(top)}. ` +
      (others.length ? `Less often, it follows ${list(others)}.` : '')
    )
  }, [rules])

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
        variant={hasVariants ? variant : null}
        title={`Likely comebacks after ${getGameFullName(game)}${hasVariants ? ` ${variant === 'high' ? 'High' : 'Low'}` : ''}`}
      />

      <Disclosure title="When is 10-4 the comeback?">
        <Questions items={[{ q: 'After which first calls does the Hammer come back with 10-4?', a: tenFour }]} />
      </Disclosure>

      <Panel tone="note" title="How to use it">
        <ul className="list-disc space-y-1 pl-5 text-sm">
          <li>Weak on the first call but strong for the likely second calls? Refusing can pay.</li>
          <li>If the likely second calls are worse for your dice, accept a middling first call.</li>
          <li>
            These assume a Hammer who calls the site’s recommended call. For your actual roll, the Strategy Assistant’s
            accept-or-refuse odds account for everything.
          </li>
        </ul>
      </Panel>
    </div>
  )
}
