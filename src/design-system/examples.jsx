import React, { useState } from 'react'
import { Lightbulb } from 'lucide-react'
import {
  Chip,
  ChoiceGroup,
  EmptyState,
  Field,
  NextStep,
  PageHeader,
  PageTabs,
  Panel,
  Stat,
  StepNumber,
  StepPanel,
  Term,
  TextLink,
} from '../components/Page'
import {
  DiceGroup,
  DiceSettings,
  Die,
  DieFace,
  DieSlot,
  DIE_SIZES,
  Hand,
  RollButton,
  RollInput,
} from '../components/Dice'
import {
  BarkOdds,
  Branches,
  Disclosure,
  MathSteps,
  OddsDecision,
  OddsLabLink,
  OutcomeGrid,
  ProbabilityBar,
  Questions,
  RollsPct,
  StrengthTag,
} from '../components/Odds'
import {
  LOSE_VIA_TIE,
  MISS_TWICE,
  TIE_ODDS,
} from '../components/Tutorial/tie-odds'
import { HouseRuleSettings, Settings } from '../components/Settings'
import GameLink, { CallName } from '../components/GameLink'
import VariantSelector from '../components/VariantSelector'
import Seat from '../components/Table/Seat'
import SeatRing from '../components/Table/SeatRing'
import TableFelt from '../components/Table/TableFelt'
import Standings from '../components/Table/Standings'
import TableOrder from '../components/Table/TableOrder'
import DiceCup from '../components/Table/DiceCup'
import HintCard from '../components/Play/HintCard'
import CallPlacard from '../components/Play/CallPlacard'
import Setup from '../components/Play/Setup'
import { SpeedPicker, Transport } from '../components/Play/TableControls'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Switch } from '../components/ui/switch'
import { Slider } from '../components/ui/slider'
import { NativeSelect } from '../components/ui/native-select'
import { ToggleGroup, ToggleGroupItem } from '../components/ui/toggle-group'
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../components/ui/popover'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../components/ui/tooltip'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../components/ui/dialog'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '../components/ui/sheet'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table'
import { PRESETS } from '../lib/roll-query'
import { seatOdds } from '../strategy'
import { Specimen } from './DocKit'

/**
 * Live examples for each registry entry (registry.js), keyed by id. Each
 * renders the real component, so the design system can't drift from the
 * site. Entries with `liveAt` link to the page that shows them instead.
 */

const PlayersDemo = ({ children }) => (
  <div className="grid gap-3 sm:grid-cols-2">{children}</div>
)

function TabsDemo() {
  const [tab, setTab] = useState('keep')
  return (
    <PageTabs
      label="Example tools"
      tabs={[
        { id: 'keep', label: 'What should I keep?' },
        { id: 'games', label: 'Every game’s odds' },
      ]}
      value={tab}
      onChange={setTab}
    />
  )
}

function RollInputDemo() {
  const [dice, setDice] = useState(['1', '3', '6', '', ''])
  return <RollInput diceValues={dice} onDiceChange={setDice} size="md" />
}

function KeepDemo() {
  const [kept, setKept] = useState([0, 1, 2])
  return (
    <Hand
      dice={[1, 3, 6, 5, 5]}
      game="10-3"
      variant="high"
      kept={kept}
      onToggleKeep={(i) =>
        setKept((k) => (k.includes(i) ? k.filter((x) => x !== i) : [...k, i]))
      }
    />
  )
}

function ChoiceDemo() {
  const [n, setN] = useState(3)
  return (
    <div className="space-y-6">
      <ChoiceGroup
        label="Opponents"
        size="lg"
        value={n}
        onChange={setN}
        options={[1, 2, 3, 4, 5].map((v) => ({ value: v, label: v }))}
      />
      <ChoiceGroup
        label="Rolls left"
        value={n > 2 ? 2 : 1}
        onChange={() => {}}
        options={[
          { value: 2, label: '2' },
          { value: 1, label: '1' },
        ]}
      />
    </div>
  )
}

function ToggleDemo() {
  const [v, setV] = useState('light')
  return (
    <ToggleGroup
      type="single"
      value={v}
      onValueChange={(x) => x && setV(x)}
      aria-label="Theme"
      className="grid max-w-xs grid-cols-3 gap-1 rounded-lg border bg-muted/40 p-1"
    >
      {['light', 'dark', 'system'].map((x) => (
        <ToggleGroupItem
          key={x}
          value={x}
          className="px-1.5 py-1.5 capitalize data-[state=on]:bg-background data-[state=on]:text-foreground data-[state=on]:shadow-sm"
        >
          {x}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}

function SelectDemo() {
  const [v, setV] = useState(2)
  return (
    <NativeSelect
      label="Rolls left"
      numeric
      value={v}
      onChange={setV}
      options={[
        { value: 2, label: '2 rolls left' },
        { value: 1, label: '1 roll left' },
      ]}
    />
  )
}

function SwitchDemo() {
  const [on, setOn] = useState(true)
  return (
    <div className="flex items-center gap-2">
      <Switch id="demo-switch" checked={on} onCheckedChange={setOn} />
      <Label htmlFor="demo-switch">Hints</Label>
    </div>
  )
}

function VariantDemo() {
  const [v, setV] = useState('all')
  return <VariantSelector selectedVariant={v} onChange={(x) => x && setV(x)} />
}

function ControlsDemo() {
  const [paused, setPaused] = useState(false)
  const [pace, setPace] = useState('verySlow')
  return (
    <TableFelt className="space-y-3">
      <div className="flex justify-end">
        <Transport
          paused={paused}
          onToggle={() => setPaused((p) => !p)}
          onStep={() => {}}
          canStep
        />
      </div>
      <SpeedPicker pace={pace} onPace={setPace} />
    </TableFelt>
  )
}

const TIE_OPTIONS = [
  {
    id: 'tie',
    label: 'Take the tie',
    segments: [
      { p: TIE_ODDS.loseIfTie, label: 'lose the replay', kind: 'coin' },
    ],
  },
  {
    id: 'roll',
    label: 'Roll',
    segments: [
      { p: MISS_TWICE, label: 'miss twice', kind: 'lose' },
      { p: LOSE_VIA_TIE, label: 'tie, then lose the replay', kind: 'coin' },
    ],
  },
]

export const EXAMPLES = {
  button: () => (
    <>
      <Specimen title="Variants: one primary per view">
        <div className="flex flex-wrap gap-2">
          <Button>Primary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="link">Link</Button>
          <Button variant="destructive">Leave the table</Button>
        </div>
      </Specimen>
      <Specimen title="Sizes">
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm">Small</Button>
          <Button>Default</Button>
          <Button size="lg">Large (44px, for a page’s main action)</Button>
          <Button disabled>Disabled</Button>
        </div>
      </Specimen>
    </>
  ),
  chip: () => (
    <Specimen title="Chips: tap to choose; active is the chosen one">
      <div className="flex flex-wrap gap-2">
        <Chip active>✌️ 10-2</Chip>
        <Chip>👌 10-3</Chip>
        <Chip>👑 Boss</Chip>
        <Chip to="/games/razzle">✨ Razzle (a link)</Chip>
      </div>
    </Specimen>
  ),
  'choice-group': () => (
    <Specimen title="Radio semantics; size lg gives 44px targets">
      <ChoiceDemo />
    </Specimen>
  ),
  badge: () => (
    <Specimen title="Variants">
      <div className="flex flex-wrap gap-2">
        <Badge>Your roll plays it</Badge>
        <Badge variant="secondary">Strategy</Badge>
        <Badge variant="outline">106</Badge>
        <Badge variant="warning">Every roll plays</Badge>
        <Badge variant="destructive">Out</Badge>
      </div>
    </Specimen>
  ),
  'text-link': () => (
    <Specimen title="In running text">
      <p>
        The <Term id="hammer">Hammer</Term> calls a game; read the{' '}
        <TextLink to="/rules">rules</TextLink> for the rest.
      </p>
    </Specimen>
  ),
  'game-link': () => (
    <Specimen title="A game, and a call">
      <p className="flex flex-wrap items-center gap-4">
        <GameLink id="monterey" showEmoji />
        <CallName call={{ game: '10-3', variant: 'high' }} />
        <CallName call={{ game: 'boss' }} link={false} />
      </p>
    </Specimen>
  ),
  'step-number': () => (
    <Specimen>
      <div className="flex gap-3">
        <StepNumber n={1} />
        <StepNumber n={2} />
        <StepNumber n={3} className="h-10 w-10 text-lg" />
      </div>
    </Specimen>
  ),
  page: () => (
    <Specimen title="PageHeader">
      <PageHeader
        className="mb-0"
        eyebrow="Reference"
        title="How to play"
        description="2–8 players · 5 dice each · about 30 minutes"
        breadcrumbs={[{ to: '/', label: 'Home' }, { label: 'Rules' }]}
        badge={<Badge variant="secondary">example</Badge>}
      />
    </Specimen>
  ),
  panel: () => (
    <>
      <Specimen title="Tones">
        <div className="space-y-3">
          <Panel title="Panel" description="The default box for a section.">
            <p className="text-sm">Never put a Panel inside a Panel.</p>
          </Panel>
          <Panel
            tone="tool"
            title="Tool panel"
            description="The thing you interact with: one per page."
          >
            <RollInputDemo />
          </Panel>
          <Panel tone="note" title="Note panel">
            <p className="text-sm">An aside, a tip or a rule of thumb.</p>
          </Panel>
          <Panel
            collapsible
            title="Collapsible panel"
            description="Closed until opened."
            badge={<Badge variant="outline">106</Badge>}
          >
            <p className="text-sm">The detail, once asked for.</p>
          </Panel>
        </div>
      </Specimen>
      <Specimen title="Stat, and Stat plain inside a Panel">
        <div className="grid gap-3 sm:grid-cols-3">
          <Stat value="49.1%" label="Made on one roll" sub="exact" />
          <Stat value="3,816" label="Rolls that make it" sub="of 7,776" />
          <Panel>
            <Stat plain label="Chance" value="18.2%" sub="about 1 in 5" />
          </Panel>
        </div>
      </Specimen>
    </>
  ),
  'step-panel': () => (
    <Specimen>
      <StepPanel n={1} title="Roll">
        <p>
          The Hammer says “coming out”, then everyone rolls all 5 dice and hides
          them.
        </p>
      </StepPanel>
    </Specimen>
  ),
  field: () => (
    <Specimen>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Your dice" hint="Enter five dice, or tap Roll.">
          <RollInputDemo />
        </Field>
        <EmptyState>Enter your five dice, or tap Roll.</EmptyState>
      </div>
    </Specimen>
  ),
  'page-tabs': () => (
    <Specimen>
      <TabsDemo />
    </Specimen>
  ),
  'next-step': () => (
    <Specimen>
      <NextStep
        className="mt-0"
        to="/games"
        title="Meet the ten games"
        text="What makes each one, what it looks like, and its quirks."
      />
    </Specimen>
  ),
  'roll-input': () => (
    <Specimen title="Type 1–6 into a box; tap a die to edit it">
      <RollInputDemo />
    </Specimen>
  ),
  'roll-button': () => (
    <Specimen>
      <div className="flex flex-wrap gap-2">
        <RollButton />
        <RollButton size="lg">Piddle for the Hammer</RollButton>
      </div>
    </Specimen>
  ),
  'native-select': () => (
    <Specimen>
      <SelectDemo />
    </Specimen>
  ),
  input: () => (
    <Specimen>
      <Input
        placeholder="Search terms…"
        className="max-w-xs"
        aria-label="Search terms"
      />
    </Specimen>
  ),
  label: () => (
    <Specimen>
      <SwitchDemo />
    </Specimen>
  ),
  switch: () => (
    <Specimen>
      <SwitchDemo />
    </Specimen>
  ),
  'toggle-group': () => (
    <Specimen>
      <ToggleDemo />
    </Specimen>
  ),
  slider: () => (
    <Specimen>
      <Slider
        defaultValue={[3]}
        min={1}
        max={7}
        step={1}
        className="max-w-xs"
        aria-label="Opponents"
      />
    </Specimen>
  ),
  'variant-selector': () => (
    <Specimen>
      <VariantDemo />
    </Specimen>
  ),
  'dice-settings': () => (
    <Specimen>
      <DiceSettings />
    </Specimen>
  ),
  settings: () => (
    <Specimen>
      <Panel title="Settings" className="max-w-sm">
        <Settings />
      </Panel>
    </Specimen>
  ),
  'house-rule-settings': () => (
    <Specimen>
      <HouseRuleSettings className="max-w-sm" />
    </Specimen>
  ),
  table: () => (
    <Specimen>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Roll</TableHead>
            <TableHead>Strength</TableHead>
            <TableHead className="text-right">Occurrences</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {[
            [[5, 5, 6, 6, 6], 0.05],
            [[4, 6, 6, 5, 3], 0.31],
          ].map(([dice, loss], i) => (
            <TableRow key={i}>
              <TableCell>
                <Hand dice={dice} game="10-2" variant="high" size="xs" />
              </TableCell>
              <TableCell>
                <StrengthTag loss={loss} />
              </TableCell>
              <TableCell className="text-right tabular-nums">60×</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Specimen>
  ),
  'strength-tag': () => (
    <Specimen title="Graded against an even share; the number always shows">
      <div className="flex flex-wrap gap-2">
        {[0.05, 0.2, 0.3, 0.5].map((l) => (
          <StrengthTag key={l} loss={l} />
        ))}
      </div>
    </Specimen>
  ),
  die: () => (
    <Specimen title="Sizes, hidden, and 3D">
      <div className="flex flex-wrap items-end gap-4">
        {Object.keys(DIE_SIZES).map((size) => (
          <div key={size} className="text-center text-xs text-muted-foreground">
            <Die value={5} size={size} />
            <div>{size}</div>
          </div>
        ))}
        <div className="text-center text-xs text-muted-foreground">
          <Die value={null} />
          <div>hidden</div>
        </div>
        <div className="text-center text-xs text-muted-foreground">
          <Die value={6} size="lg" dimension="3d" rollId={1} />
          <div>3D</div>
        </div>
      </div>
    </Specimen>
  ),
  'die-face': () => (
    <Specimen title="Michigan Red-Eye pips: 1 and 6 dark, 2 and 5 red, 3 and 4 blue">
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5, 6].map((v) => (
          <DieFace key={v} value={v} size={40} />
        ))}
      </div>
    </Specimen>
  ),
  'die-slot': () => (
    <Specimen>
      <div className="flex gap-2">
        <DieSlot />
        <DieSlot />
      </div>
    </Specimen>
  ),
  hand: () => (
    <>
      <Specimen title="Each game outlines its own dice">
        <div className="space-y-3">
          <Hand dice={[1, 3, 6, 5, 5]} game="10-3" variant="high" />
          <Hand dice={[1, 3, 6, 5, 5]} game="monterey" variant="high" />
          <Hand dice={[6, 6, 4, 4, 1]} game="boss" />
          <Hand dice={[1, 5, 1, 1, 3]} game="razzle" />
          <Hand dice={[3, 3, 1, 5, 2]} game="tres-away" />
          <Hand dice={[1, 3, 6, 5, 5]} game="10-3" variant="high" size="xs" />
        </div>
      </Specimen>
      <Specimen title="Keeping dice in play: tap to keep">
        <KeepDemo />
      </Specimen>
    </>
  ),
  'dice-group': () => (
    <Specimen>
      <div className="flex flex-wrap gap-3">
        <DiceGroup label="Game" dice={[1, 3, 6]} />
        <DiceGroup tone="kicker" label="Kicker" dice={[5, 5]} />
        <DiceGroup tone="plain" dice={[2, 4]} />
      </div>
    </Specimen>
  ),
  'table-felt': () => (
    <Specimen>
      <TableFelt>
        <p className="text-felt-foreground">
          Text on the felt uses felt-foreground.
        </p>
      </TableFelt>
    </Specimen>
  ),
  seat: () => (
    <Specimen>
      <TableFelt>
        <PlayersDemo>
          <Seat
            name="You"
            you
            turn
            badges={['🔨 Hammer']}
            pencils={1}
            said={{ text: 'Calls 10-3 High', at: 1, fresh: true }}
          >
            <Hand dice={[1, 3, 6, 5, 5]} game="10-3" variant="high" />
          </Seat>
          <Seat
            name="Ava"
            badges={['1st refusal']}
            decision="Refused"
            pencils={2}
            status="Thinking…"
            compact
            detail="A kicker of 7 · 2 rolls left"
          >
            <Hand dice={[null, null, null, null, null]} size="sm" />
          </Seat>
        </PlayersDemo>
      </TableFelt>
    </Specimen>
  ),
  'seat-ring': () => (
    <Specimen>
      <div className="grid max-w-md grid-cols-2 gap-3">
        <SeatRing
          label="Five seats, you hold the Hammer"
          even={1 / 5}
          seats={seatOdds(5).map((value, i) => ({
            value,
            hammer: i === 0,
            you: i === 0,
          }))}
        />
        <SeatRing
          label="The Hammer passes to your left"
          even={1 / 5}
          passTo={1}
          seats={seatOdds(5).map((_, i, o) => ({
            value: o[(i + 4) % 5],
            hammer: i === 1,
            you: i === 0,
          }))}
        />
      </div>
    </Specimen>
  ),
  standings: () => (
    <Specimen>
      <PlayersDemo>
        <Standings
          label="Example standings"
          rows={[
            {
              id: 'a',
              name: 'Ava',
              rank: 1,
              detail: 'A kicker of 11 · 2 rolls left',
              status: 'safe',
            },
            {
              id: 'y',
              name: 'You',
              you: true,
              rank: 2,
              detail: 'A kicker of 7 · all day',
            },
            {
              id: 'b',
              name: 'Ben',
              rank: 3,
              detail: 'A kicker of 6 · 1 roll left',
              status: 'bottom',
            },
          ]}
        />
        <Standings
          label="Example piddle"
          rows={[
            {
              id: 'y',
              name: 'You',
              you: true,
              rank: 1,
              aside: <Die value={6} size="sm" />,
              status: 'again',
            },
            {
              id: 'a',
              name: 'Ava',
              rank: 1,
              aside: <Die value={6} size="sm" />,
              status: 'again',
            },
            {
              id: 'b',
              name: 'Ben',
              rank: 3,
              aside: <Die value={2} size="sm" />,
            },
          ]}
        />
      </PlayersDemo>
    </Specimen>
  ),
  'table-order': () => (
    <Specimen>
      <TableOrder
        hammer="b"
        rows={[
          {
            id: 'b',
            name: 'Ben',
            detail: 'A kicker of 3',
            status: 'safe',
            pencils: 0,
          },
          {
            id: 'c',
            name: 'Cass',
            detail: 'No Monterey · all day',
            status: 'tied',
            pencils: 1,
          },
          {
            id: 'y',
            name: 'You',
            you: true,
            detail: 'A kicker of 10',
            tags: ['1st refusal'],
            pencils: 2,
            active: true,
          },
        ]}
      />
    </Specimen>
  ),
  'dice-cup': () => (
    <Specimen>
      <div className="flex flex-wrap gap-6">
        <DiceCup label="Your dice, in the cup" />
        <DiceCup>
          <span className="flex flex-col leading-tight">
            <span className="text-xs font-semibold text-muted-foreground">
              In the cup
            </span>
            <span className="text-sm font-semibold">
              Kicker of 9 beats Ben’s all-day 6
            </span>
          </span>
        </DiceCup>
      </div>
    </Specimen>
  ),
  'odds-decision': () => (
    <Specimen title="Verdict first, then the options as bars">
      <OddsDecision outcome="take the pencil" options={TIE_OPTIONS} />
    </Specimen>
  ),
  'probability-bar': () => (
    <Specimen title="A plain chance, and the three odds tones">
      <div className="max-w-xl space-y-3">
        <ProbabilityBar label="1 roll" p={0.491} />
        <ProbabilityBar label="Safe (tone)" p={0.42} tone="safe" />
        <ProbabilityBar label="Either way (tone)" p={0.17} tone="coin" />
        <ProbabilityBar
          label="Lose (tone)"
          p={0.08}
          tone="lose"
          mark={0.33}
          markLabel="an even share, 33%"
        />
      </div>
    </Specimen>
  ),
  'rolls-pct': () => (
    <Specimen title="Tap the number to compare rolls left">
      <p>
        Keep the 1-2 and you make it{' '}
        <RollsPct
          p={0.42}
          rolls={2}
          over={(n) => (n === 1 ? 0.25 : 0.42)}
          what="Keep 1-2, roll 3"
        />{' '}
        of the time.
      </p>
    </Specimen>
  ),
  'outcome-grid': () => (
    <Specimen>
      <OutcomeGrid
        title="Two dice against a total of 8"
        classify={(a, b) => (a + b > 8 ? 'win' : a + b === 8 ? 'tie' : 'lose')}
        kinds={{
          win: { label: 'Beats 8', kind: 'safe', mark: '✓' },
          tie: { label: 'Ties 8', kind: 'coin', mark: '=' },
          lose: { label: 'Under 8', kind: 'lose' },
        }}
      />
    </Specimen>
  ),
  branches: () => (
    <Specimen>
      <Branches
        title="If you refuse"
        outcome="take the pencil"
        rows={[
          {
            id: 'accept',
            label: 'The 2nd refusal accepts',
            share: 0.55,
            p: 0.31,
          },
          {
            id: 'second',
            label: 'Both refuse: a second call',
            share: 0.45,
            p: 0.38,
          },
        ]}
      />
    </Specimen>
  ),
  explain: () => (
    <Specimen>
      <div className="space-y-3">
        <Disclosure title="Why take the tie?">
          <Questions
            items={[
              {
                q: 'Isn’t a replay a coin flip?',
                a: 'With two of you, yes: 50%, against 31.7% for rolling.',
              },
            ]}
          />
        </Disclosure>
        <MathSteps
          title="The math"
          steps={[
            { label: 'Miss twice', expr: '0.509 × 0.509', result: '25.9%' },
            {
              label: 'Tie, then lose the replay',
              expr: '0.116 × 0.5',
              result: '5.8%',
            },
            { label: 'You take the pencil', result: '31.7%', total: true },
          ]}
        />
      </div>
    </Specimen>
  ),
  'odds-lab-link': () => (
    <Specimen>
      <OddsLabLink query={PRESETS[0].query}>
        Work it through in the Odds Lab
      </OddsLabLink>
    </Specimen>
  ),
  'bark-odds': () => (
    <Specimen>
      <BarkOdds />
    </Specimen>
  ),
  alert: () => (
    <Specimen>
      <div className="space-y-3">
        <Alert>
          <AlertTitle>Default</AlertTitle>
          <AlertDescription>
            Something about this page’s state.
          </AlertDescription>
        </Alert>
        <Alert variant="warning">
          <AlertDescription>
            Two requirements claim the same dice: no roll can meet both.
          </AlertDescription>
        </Alert>
        <Alert variant="destructive">
          <AlertDescription>
            The simulation stopped. Try again.
          </AlertDescription>
        </Alert>
      </div>
    </Specimen>
  ),
  popover: () => (
    <Specimen>
      <Popover>
        <PopoverTrigger className="underline decoration-dotted underline-offset-4">
          What’s a kicker?
        </PopoverTrigger>
        <PopoverContent className="text-sm">
          All the dice that don’t make the game, taken together as one total.
        </PopoverContent>
      </Popover>
    </Specimen>
  ),
  tooltip: () => (
    <Specimen>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="sm">
              <Lightbulb aria-hidden className="mr-1 h-4 w-4" /> Hover or focus
              me
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            A hint, never the only place information lives
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </Specimen>
  ),
  dialog: () => (
    <Specimen>
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline">Open a dialog</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Leave the table?</DialogTitle>
            <DialogDescription>
              Not used on the site yet: prefer content on the page.
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </Specimen>
  ),
  sheet: () => (
    <Specimen>
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline">Open a sheet</Button>
        </SheetTrigger>
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle>Navigation</SheetTitle>
          </SheetHeader>
        </SheetContent>
      </Sheet>
    </Specimen>
  ),
  'table-controls': () => (
    <Specimen>
      <ControlsDemo />
    </Specimen>
  ),
  'call-placard': () => (
    <Specimen>
      <TableFelt className="space-y-3">
        <CallPlacard call={{ game: '10-3', variant: 'high' }} caller="Ben" />
        <CallPlacard
          call={{ game: 'boss' }}
          caller="You"
          second
          refused={{ game: '10-4', variant: 'high' }}
        />
        <CallPlacard hammerName="Ben" />
      </TableFelt>
    </Specimen>
  ),
  'play-setup': () => (
    <Specimen>
      <Setup onStart={() => {}} />
    </Specimen>
  ),
  'hint-card': () => (
    <Specimen>
      <HintCard
        hint="Refuse the call."
        stats={{
          measure: 'Chance you take the pencil',
          rows: [
            { label: 'Refuse', value: 0.4, best: true },
            { label: 'Accept', value: 0.43 },
          ],
          note: '600 rounds played out by solid bots, so each chance is good to about 2 points.',
        }}
      />
    </Specimen>
  ),
}
