import React, { useState } from 'react'
import { formatCallLabel } from '../../lib/games-config'
import { Hand } from '../Dice'
import { barkOdds, barkTable } from '../../strategy'
import { BarkRings, PlayersPicker } from './BarkOdds'
import { BarkAssumptions, BarkSizes, BarkWhy } from './BarkCase'
import BarkHands from './BarkHands'
import { Disclosure } from './Explain'
import ProbabilityBar from './ProbabilityBar'
import UnheldCalls from './UnheldCalls'
import { useHouseRules } from '../Settings/house-rules'

const BAR = 'grid-cols-[minmax(0,8.5rem)_1fr_auto] gap-2 sm:grid-cols-[minmax(0,11rem)_1fr_auto] sm:gap-3'

/**
 * The Barking page, short answer first (progressive disclosure): the
 * verdict in a line, your worst roll against a bark at your table size,
 * then the detail behind it as questions, closed until asked. One player
 * count drives every view.
 */
export default function BarkGuide({ className }) {
  const [players, setPlayers] = useState(3)
  const [rules] = useHouseRules()
  const bark = barkOdds(players, rules)
  const rows = barkTable(players, rules)
  const worst = rows[0]
  const barkWins = rows.filter((r) => r.best.loss > bark).length

  return (
    <div className={className}>
      <p className="text-lg font-semibold">
        {barkWins === 0 ? 'Call. Even your worst roll beats a bark.' : `Call, except with ${barkWins} of 252 rolls.`}
      </p>
      <p className="mt-1 text-muted-foreground">
        As the Hammer you pick the game after seeing your dice. A bark throws that away for random dice and the last
        seat.
      </p>

      <PlayersPicker players={players} onChange={setPlayers} className="mt-4 flex flex-wrap items-center gap-1.5" />
      <div className="mt-4 space-y-2">
        <ProbabilityBar
          className={BAR}
          label={
            <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
              Worst roll, calling
              <Hand dice={worst.dice} size="xs" game={worst.best.call.game} variant={worst.best.call.variant} />
            </span>
          }
          p={worst.best.loss}
          tone="safe"
        />
        <ProbabilityBar className={BAR} label="Barking, any roll" p={bark} tone="lose" />
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        Chance of taking the pencil at {players} players. The worst roll calls {formatCallLabel(worst.best.call)}.
      </p>

      <div className="mt-6 space-y-2">
        <Disclosure title="See every roll, worst first">
          <BarkHands players={players} rules={rules} />
        </Disclosure>
        <Disclosure title="Why does calling win?">
          <BarkWhy />
          <BarkRings players={players} rules={rules} />
          <p className="text-xs text-muted-foreground">
            Each seat’s chance of the pencil with random dice. The Hammer’s is lowest; a bark gives it to the player on
            your left.
          </p>
        </Disclosure>
        <Disclosure title="What about calling a game I don’t have?">
          <UnheldCalls rules={rules} />
        </Disclosure>
        <Disclosure title="Does the table size change it?">
          <BarkSizes rules={rules} />
        </Disclosure>
        <Disclosure title="What do these numbers assume?">
          <BarkAssumptions rules={rules} />
        </Disclosure>
      </div>
    </div>
  )
}
