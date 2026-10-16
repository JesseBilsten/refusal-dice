import React from 'react'
import { Link } from 'gatsby'
import { OddsDecision, ProbabilityBar } from '../Odds'
import { Hand } from '../Dice'
import { CallName } from '../GameLink'
import { formatCallLabel } from '../../lib/games-config'
import { hammerView } from './odds'

/**
 * What to call as the Hammer, on the odds-decision pattern
 * (.claude/skills/explain-odds/SKILL.md): the best calls and a bark, each
 * split into accepted vs. both refuse and your second call. The odds are
 * simulated with simulateHammer() (in a worker; `samples` of `total` so
 * far); the bark's come from seat-odds.ts. Numbers are built in ./odds.ts.
 */
export default function HammerDecision({ calls, bark, dice, players, samples, total, running }) {
  const view = hammerView({ calls, bark, name: formatCallLabel })
  const options = view.options.map((o) => ({
    ...o,
    title: o.call ? (
      <>
        Call <CallName call={o.call} />
      </>
    ) : (
      <span className="inline-flex items-center gap-1.5">
        <span aria-hidden>🐶</span> Bark
      </span>
    ),
    visual: o.call ? (
      <Hand dice={dice} game={o.call.game} variant={o.call.variant} size="sm" />
    ) : (
      <span className="text-xs text-muted-foreground">
        The Hammer passes left; you sit last.{' '}
        <Link to="/games/#barking" className="text-primary hover:underline">
          Why that hurts
        </Link>
      </span>
    ),
  }))
  return (
    <div className="space-y-4">
      {running && (
        <ProbabilityBar label="Simulating" p={samples / total} digits={0}/>
      )}
      <OddsDecision outcome="take the pencil" options={options} tieMargin={view.tieMargin} />
      <p className="text-xs text-muted-foreground">
        Simulated: {samples.toLocaleString()} rounds per call at a {players}-player table, played out by the game
        engine with solid bot players (including you, after this decision). Other players' dice are random. Bots are
        heuristic, so these are odds against good, not perfect, play. A bark's odds come from{' '}
        {bark.samples.toLocaleString()} rounds after a bark; the bots never bark back.
      </p>
    </div>
  )
}
