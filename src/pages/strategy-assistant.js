import React, { useEffect, useState } from 'react'
import Layout from '../components/layout'
import Page, {
  Chip,
  NextStep,
  PageHeader,
  PageTabs,
  Panel,
  tabFromUrl,
} from '../components/Page'
import SecondCallPredictor from '../components/SecondCallPredictor'
import { RollInput } from '../components/Dice'
import { useSimulation } from '../components/Odds/use-simulation'
import HammerDecision from '../components/HammerDecision'
import RefusalDecision from '../components/RefusalDecision'
import { SEAT_ODDS_SAMPLES, barkOdds } from '../strategy'
import { useHouseRules } from '../components/Settings/house-rules'
import { GAMES } from '../lib/games-config'

const TABS = [
  { id: 'roll', label: 'Your roll' },
  { id: 'second', label: 'Predict the second call' },
]

/** Players at the table (the assistant is fixed at 3 for now) */
const PLAYERS = 3
/** Rounds simulated per call; the Hammer's estimate shows as it goes */
const HAMMER_SAMPLES = 2000
const REFUSAL_SAMPLES = 800

const POSITION_TIPS = {
  hammer: (
    <>
      <p className="font-medium text-sm">You're the Hammer</p>
      <p className="text-xs text-muted-foreground">
        You choose which game to call. We'll simulate your chance of the pencil
        for every call, including refusals and second calls.
      </p>
    </>
  ),
  'first-refusal': (
    <>
      <p className="font-medium text-sm">You're First Refusal</p>
      <p className="text-xs text-muted-foreground">
        The Hammer has called a game. Select it below, and we'll simulate your
        chance of the pencil if you <strong>accept</strong> or
        <strong> refuse</strong>. You keep your dice either way.
      </p>
    </>
  ),
  'second-refusal': (
    <>
      <p className="font-medium text-sm">You're Second Refusal</p>
      <p className="text-xs text-muted-foreground">
        First refusal already said no. If you refuse too, the Hammer
        <em> must</em> make a second call, a different game, and everyone plays
        it. We'll simulate both choices.
      </p>
    </>
  ),
}

const StrategyAssistantPage = () => {
  const [tab, setTab] = useState(null)
  useEffect(() => setTab(tabFromUrl(TABS)), [])
  const chooseTab = (id) => {
    window.history.replaceState(
      null,
      '',
      `${window.location.pathname}?tab=${id}`
    )
    setTab(id)
  }

  const [diceValues, setDiceValues] = useState(['', '', '', '', ''])
  const [position, setPosition] = useState('hammer')
  const [game, setGame] = useState(null)
  const [variant, setVariant] = useState(null)

  const roll = diceValues.every((v) => v >= '1' && v <= '6')
    ? diceValues.map(Number)
    : null
  const rollIsComplete = !!roll
  const hasVariants = GAMES.find((g) => g.id === game)?.hasVariants
  // A refuser needs the exact call, including High or Low
  const call =
    game && (!hasVariants || variant)
      ? hasVariants
        ? { game, variant }
        : { game }
      : null

  /** Clear the variant when switching to a game without variants */
  const chooseGame = (id) => {
    setGame(id)
    if (!GAMES.find((g) => g.id === id)?.hasVariants) setVariant(null)
  }

  // The simulations run in a worker, so the page never freezes
  const request = !roll
    ? null
    : position === 'hammer'
      ? {
          kind: 'hammer',
          options: { dice: roll, players: PLAYERS, samples: HAMMER_SAMPLES },
        }
      : call
        ? {
            kind: 'refusal',
            options: {
              dice: roll,
              call,
              position: position === 'first-refusal' ? 1 : 2,
              players: PLAYERS,
              samples: REFUSAL_SAMPLES,
            },
          }
        : null
  const sim = useSimulation(request)
  const [houseRules] = useHouseRules()

  // Barking doesn't depend on your dice, only the table (seat-odds.ts)
  const barkPencil = barkOdds(PLAYERS, houseRules)
  const bark = {
    pencil: barkPencil,
    error: Math.sqrt((barkPencil * (1 - barkPencil)) / SEAT_ODDS_SAMPLES),
    samples: SEAT_ODDS_SAMPLES,
  }

  return (
    <Layout>
      <Page width="tool">
        <PageHeader
          title="Strategy Assistant"
          description="Enter your roll and your seat to see what to call, or whether to accept or refuse."
        />
        {tab && (
          <PageTabs
            tabs={TABS}
            value={tab}
            onChange={chooseTab}
            label="Strategy tools"
          />
        )}
        {tab === 'second' && <SecondCallPredictor />}
        {tab === 'roll' && (
          <>
            <Panel
              tone="tool"
              title="Your roll and seat"
              as="div"
              className="mb-6"
            >
              <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
                <div className="space-y-5">
                  <div className="space-y-2">
                    <div className="text-sm font-semibold">Your dice</div>
                    <RollInput
                      diceValues={diceValues}
                      onDiceChange={setDiceValues}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="text-sm font-semibold">Your seat</div>
                    <div
                      className="flex flex-wrap gap-1.5"
                      role="group"
                      aria-label="Your seat"
                    >
                      {[
                        ['hammer', '🔨 Hammer'],
                        ['first-refusal', '1st refusal'],
                        ['second-refusal', '2nd refusal'],
                      ].map(([id, text]) => (
                        <Chip
                          key={id}
                          active={position === id}
                          onClick={() => setPosition(id)}
                        >
                          {text}
                        </Chip>
                      ))}
                    </div>
                  </div>

                  {position !== 'hammer' && (
                    <div className="space-y-2">
                      <div className="text-sm font-semibold">
                        The Hammer called
                      </div>
                      <div
                        className="flex flex-wrap gap-1.5"
                        role="group"
                        aria-label="Game called"
                      >
                        {GAMES.filter((game) => game.id !== 'barking').map(
                          (game) => (
                            <Chip
                              key={game.id}
                              active={game === game.id}
                              onClick={() => chooseGame(game.id)}
                            >
                              <span aria-hidden>{game.emoji}</span> {game.name}
                            </Chip>
                          )
                        )}
                      </div>
                      {game &&
                        GAMES.find((g) => g.id === game)?.hasVariants && (
                          <div
                            className="flex gap-1.5"
                            role="group"
                            aria-label="Variant called"
                          >
                            {['high', 'low'].map((v) => (
                              <Chip
                                key={v}
                                active={variant === v}
                                onClick={() => setVariant(v)}
                              >
                                {v === 'high' ? 'High' : 'Low'}
                              </Chip>
                            ))}
                          </div>
                        )}
                    </div>
                  )}

                  {position !== 'hammer' &&
                    game &&
                    GAMES.find((g) => g.id === game)?.hasVariants &&
                    variant !== 'high' &&
                    variant !== 'low' &&
                    rollIsComplete && (
                      <p className="text-sm font-medium text-primary">
                        Pick High or Low: the call decides which kicker wins.
                      </p>
                    )}
                  {position !== 'hammer' && !game && rollIsComplete && (
                    <p className="text-sm font-medium text-primary">
                      Pick the game the Hammer called to see your odds.
                    </p>
                  )}
                </div>

                <div className="space-y-1 rounded-lg bg-background/70 p-4 text-sm">
                  {POSITION_TIPS[position]}
                </div>
              </div>
            </Panel>

            {request && (
              <section aria-live="polite">
                {position === 'hammer' ? (
                  <Panel title="What to call">
                    {sim.result ? (
                      <HammerDecision
                        calls={sim.result}
                        bark={bark}
                        dice={roll}
                        players={PLAYERS}
                        samples={sim.samples}
                        total={HAMMER_SAMPLES}
                        running={sim.running}
                      />
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Simulating your calls…
                      </p>
                    )}
                  </Panel>
                ) : (
                  <Panel
                    title={
                      position === 'first-refusal'
                        ? 'You’re the 1st refusal'
                        : 'You’re the 2nd refusal'
                    }
                  >
                    {sim.result && !sim.running ? (
                      <RefusalDecision
                        estimate={sim.result}
                        dice={roll}
                        call={call}
                        position={position === 'first-refusal' ? 1 : 2}
                        players={PLAYERS}
                      />
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Simulating accept and refuse…
                      </p>
                    )}
                  </Panel>
                )}
              </section>
            )}
          </>
        )}
        <NextStep
          to="/play"
          title="Play the bots"
          text="Try your calls and refusals in full games."
        />
      </Page>
    </Layout>
  )
}

export default StrategyAssistantPage
