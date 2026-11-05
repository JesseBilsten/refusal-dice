import React, { useState } from 'react'
import { ChoiceGroup, Panel } from '../Page'
import { RollButton } from '../Dice'
import { DEFAULT_HOUSE_RULES } from '../../engine'
import { Button } from '../ui/button'
import { BOT_NAMES, money } from './play-model'

/** What happens at parity (docs/RULES.md §1), picked per game */
const PARITY = [
  {
    value: 'sudden-death',
    label: 'A loss is out',
    detail:
      'Pencils go back, and from then on one pencil puts a player out. Most tables play this way.',
  },
  {
    value: 'buy-in',
    label: 'Buy in again',
    detail: `Pencils go back, everyone left puts another ${money(DEFAULT_HOUSE_RULES.ante)} in the pot, and the game starts over.`,
  },
]

/**
 * Before a game: how many bots, the difficulty (Hard: you show your own game)
 * and the parity rule. `saved` (savedSummary): a game left unfinished in this
 * browser, offered first; `onResume` picks it up.
 */
export default function Setup({ onStart, saved, onResume }) {
  const [bots, setBots] = useState(3)
  const [hard, setHard] = useState(false)
  const [parity, setParity] = useState(DEFAULT_HOUSE_RULES.parity)
  const ante = DEFAULT_HOUSE_RULES.ante
  return (
    <div className="space-y-6">
      {saved && <ResumeGame saved={saved} onResume={onResume} />}
      <Panel
        tone="tool"
        title={saved ? 'Or start a new game' : 'Set the table'}
        description={`You against solid bots. Everyone puts ${money(ante)} in the pot; first to three pencils is out, and the last player standing wins the pot.`}
      >
        <div className="space-y-5">
          <div className="space-y-2">
            <ChoiceGroup
              label="Opponents"
              size="lg"
              value={bots}
              onChange={setBots}
              options={[1, 2, 3, 4, 5, 6, 7].map((n) => ({
                value: n,
                label: n,
              }))}
            />
            <p className="text-sm text-muted-foreground">
              {BOT_NAMES.slice(0, bots).join(', ')}{' '}
              {bots === 1 ? 'joins' : 'join'} you. The pot starts at{' '}
              {money(ante * (bots + 1))}.
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
                ? 'You show your own game: after each roll, tap the dice that make it, or say you missed. A pick that isn’t the game is flagged: fix it, or roll all five.'
                : 'The table reads your dice for you and outlines the game.'}
            </p>
          </div>
          <div className="space-y-2">
            <ChoiceGroup
              label="At parity (everyone left has 2 pencils)"
              size="lg"
              value={parity}
              onChange={setParity}
              options={PARITY.map(({ value, label }) => ({ value, label }))}
            />
            <p className="text-sm text-muted-foreground">
              {PARITY.find((p) => p.value === parity).detail}
            </p>
          </div>
          <RollButton size="lg" onClick={() => onStart(bots, hard, parity)}>
            Piddle for the Hammer
          </RollButton>
          {saved && (
            <p className="text-sm text-muted-foreground">
              A new game replaces your saved one.
            </p>
          )}
        </div>
      </Panel>
    </div>
  )
}

/** The game left unfinished in this browser: where it stood, and a way back in */
function ResumeGame({ saved, onResume }) {
  const you = saved.out
    ? 'You’re out; the bots are still playing.'
    : `You have ${saved.pencils === 0 ? 'no pencils' : saved.pencils === 1 ? '1 pencil' : `${saved.pencils} pencils`}.`
  return (
    <Panel
      title="Your game is waiting"
      description={`Round ${saved.round}, ${saved.players} players still in, and ${money(saved.pot)} in the pot. ${you}`}
    >
      <Button size="lg" onClick={onResume}>
        Pick up where you left off
      </Button>
    </Panel>
  )
}
