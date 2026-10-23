import React, { useState } from 'react'
import { ChoiceGroup, Panel } from '../Page'
import { RollButton } from '../Dice'
import { BOT_NAMES } from './play-model'

/** Before a game: how many bots, and the difficulty (Hard: you show your own game) */
export default function Setup({ onStart }) {
  const [bots, setBots] = useState(3)
  const [hard, setHard] = useState(false)
  return (
    <Panel
      tone="tool"
      title="Set the table"
      description="You against solid bots. First to three pencils is out; the last player standing wins."
    >
      <div className="space-y-5">
        <div className="space-y-2">
          <ChoiceGroup
            label="Opponents"
            size="lg"
            value={bots}
            onChange={setBots}
            options={[1, 2, 3, 4, 5, 6, 7].map((n) => ({ value: n, label: n }))}
          />
          <p className="text-sm text-muted-foreground">
            {BOT_NAMES.slice(0, bots).join(', ')}{' '}
            {bots === 1 ? 'joins' : 'join'} you.
            {bots === 1 && ' With two players there’s only one refusal.'}
          </p>
        </div>
        <div className="space-y-2">
          <ChoiceGroup
            label="Difficulty"
            size="lg"
            value={hard}
            onChange={setHard}
            options={[
              { value: false, label: 'Standard' },
              { value: true, label: 'Hard' },
            ]}
          />
          <p className="text-sm text-muted-foreground">
            {hard
              ? 'You show your own game: after each roll, tap the dice that make it, or say you missed. Show the wrong dice and you pick them all up and roll five, like at a real table.'
              : 'The table reads your dice for you and outlines the game.'}
          </p>
        </div>
        <RollButton size="lg" onClick={() => onStart(bots, hard)}>
          Piddle for the Hammer
        </RollButton>
      </div>
    </Panel>
  )
}
