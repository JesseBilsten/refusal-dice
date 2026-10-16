import React, { useState } from 'react'
import Helmet from 'react-helmet'
import Layout from '../components/layout'
import Page, { Chip, PageHeader, PageTabs, Panel, Stat } from '../components/Page'
import {
  DiceGroup,
  Die,
  DieSlot,
  DIE_SIZES,
  Hand,
  RollButton,
  RollInput,
} from '../components/Dice'
import {
  Disclosure,
  OddsDecision,
  OddsLabLink,
  OutcomeGrid,
  ProbabilityBar,
  Questions,
} from '../components/Odds'
import Seat from '../components/Table/Seat'
import Standings from '../components/Table/Standings'
import { PRESETS } from '../lib/roll-query'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'

/**
 * The design system on one page (docs/DESIGN_SYSTEM.md): every shared
 * piece, live. Not in the navigation; check it in light and dark mode
 * after changing a kit.
 */

const COLORS = [
  ['background', 'bg-background'],
  ['card', 'bg-card'],
  ['muted', 'bg-muted'],
  ['primary', 'bg-primary'],
  ['felt', 'bg-felt'],
  ['dice', 'bg-dice'],
  ['pop', 'bg-pop'],
  ['odds-safe', 'bg-odds-safe'],
  ['odds-coin', 'bg-odds-coin'],
  ['odds-lose', 'bg-odds-lose'],
  ['destructive', 'bg-destructive'],
  ['border', 'bg-border'],
]

const Section = ({ title, children }) => (
  <section className="space-y-4">
    <h2 className="border-b pb-2 text-2xl font-bold tracking-tight">{title}</h2>
    {children}
  </section>
)

const DesignPage = () => {
  const [dice, setDice] = useState(['1', '3', '6', '', ''])
  const [tab, setTab] = useState('a')
  const [kept, setKept] = useState([0, 1, 2])
  return (
    <Layout>
      <Helmet>
        <meta name="robots" content="noindex" />
      </Helmet>
      <Page width="tool">
        <PageHeader
          eyebrow="Reference"
          title="Design system"
          description="Every shared piece of the site, live. Change a kit and it changes here and everywhere else."
          breadcrumbs={[{ to: '/', label: 'Home' }, { label: 'Design system' }]}
          badge={<Badge variant="secondary">internal</Badge>}
        />

        <div className="space-y-12">
          <Section title="Color tokens">
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {COLORS.map(([name, cls]) => (
                <li key={name} className="overflow-hidden rounded-lg border">
                  <div className={`h-12 ${cls}`} />
                  <div className="p-2 font-mono text-xs">{name}</div>
                </li>
              ))}
            </ul>
          </Section>

          <Section title="Type">
            <p className="font-display text-5xl font-extrabold tracking-tight">Roll. Call. Refuse.</p>
            <h1 className="text-4xl font-bold">Heading 1 · Bricolage Grotesque</h1>
            <h2 className="text-2xl font-bold">Heading 2</h2>
            <h3 className="text-lg font-semibold">Heading 3</h3>
            <p>
              Body text is Inter. Running text never runs past about 70 characters, so long lines stay easy to read
              on any screen. This sentence is here to show where it wraps.
            </p>
            <p className="text-sm text-muted-foreground">Muted, small: captions and asides.</p>
          </Section>

          <Section title="Page kit">
            <PageTabs
              label="Example tabs"
              tabs={[
                { id: 'a', label: 'First tool' },
                { id: 'b', label: 'Second tool' },
              ]}
              value={tab}
              onChange={setTab}
            />
            <div className="flex flex-wrap gap-2">
              <Chip active>Active chip</Chip>
              <Chip>Chip</Chip>
              <Chip active={false}>Off</Chip>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <Stat value="63.9%" label="Made on one roll" sub="exact" />
              <Stat value="4,965" label="Rolls that make it" sub="of 7,776" />
              <Stat value="114" label="Unique patterns" />
            </div>
            <Panel title="Panel" description="The default box for a section.">
              <p className="text-sm">Never put a Panel inside a Panel.</p>
            </Panel>
            <Panel tone="tool" title="Tool panel" description="The thing you interact with: one per page.">
              <RollInput diceValues={dice} onDiceChange={setDice} size="md" />
            </Panel>
            <Panel tone="note" title="Note panel">
              <p className="text-sm">An aside, a tip or a rule of thumb.</p>
            </Panel>
            <div className="flex flex-wrap gap-2">
              <Button>Button</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <RollButton />
              <Badge>Badge</Badge>
              <Badge variant="secondary">Secondary</Badge>
              <Badge variant="outline">Outline</Badge>
            </div>
          </Section>

          <Section title="Dice kit">
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
                <DieSlot />
                <div>slot</div>
              </div>
              <div className="text-center text-xs text-muted-foreground">
                <Die value={6} size="lg" dimension="3d" rollId={1} />
                <div>3D</div>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <DiceGroup label="Game" dice={[1, 3, 6]} />
              <DiceGroup tone="kicker" label="Kicker" dice={[5, 5]} />
              <DiceGroup tone="plain" dice={[2, 4]} />
            </div>
            <div className="space-y-3">
              <Hand dice={[1, 3, 6, 5, 5]} game="10-3" variant="high" />
              <Hand dice={[1, 3, 6, 5, 5]} game="monterey" variant="high" />
              <Hand dice={[6, 6, 4, 4, 1]} game="boss" />
              <Hand dice={[1, 5, 1, 1, 3]} game="razzle" />
              <Hand dice={[3, 3, 1, 5, 2]} game="tres-away" />
              <Hand dice={[1, 3, 6, 5, 5]} game="10-3" variant="high" size="xs" />
              <Hand
                dice={[1, 3, 6, 5, 5]}
                game="10-3"
                variant="high"
                kept={kept}
                onToggleKeep={(i) => setKept((k) => (k.includes(i) ? k.filter((x) => x !== i) : [...k, i]))}
              />
            </div>
          </Section>

          <Section title="Table">
            <div className="grid gap-3 sm:grid-cols-2">
              <Seat name="You" you active badges={['🔨 Hammer']} pencils={1}>
                <Hand dice={[1, 3, 6, 5, 5]} game="10-3" variant="high" />
              </Seat>
              <Seat name="Ava" badges={['1st refusal']} decision="Refused" pencils={2} status="Thinking…">
                <Hand dice={[null, null, null, null, null]} />
              </Seat>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Standings
                label="Example standings"
                rows={[
                  { id: 'a', name: 'Ava', rank: 1, detail: 'A kicker of 11 · 2 rolls left', status: 'safe' },
                  { id: 'y', name: 'You', you: true, rank: 2, detail: 'A kicker of 7 · all day' },
                  { id: 'b', name: 'Ben', rank: 3, detail: 'A kicker of 6 · 1 roll left', status: 'bottom' },
                ]}
              />
              <Standings
                label="Example piddle"
                rows={[
                  { id: 'y', name: 'You', you: true, rank: 1, aside: <Die value={6} size="sm" />, status: 'again' },
                  { id: 'a', name: 'Ava', rank: 1, aside: <Die value={6} size="sm" />, status: 'again' },
                  { id: 'b', name: 'Ben', rank: 3, aside: <Die value={2} size="sm" /> },
                ]}
              />
            </div>
          </Section>

          <Section title="Odds kit">
            <div className="max-w-xl space-y-3">
              <ProbabilityBar label="1 roll" p={0.639} />
              <ProbabilityBar label="Safe" p={0.42} tone="safe" />
              <ProbabilityBar label="Coin flip" p={0.17} tone="coin" />
              <ProbabilityBar label="Lose" p={0.08} tone="lose" />
            </div>
            <OddsDecision
              outcome="take the pencil"
              options={[
                {
                  id: 'tie',
                  label: 'Take the tie',
                  segments: [{ p: 0.5, label: 'lose the replay', kind: 'coin' }],
                },
                {
                  id: 'roll',
                  label: 'Roll',
                  segments: [
                    { p: 0.72, label: 'miss twice', kind: 'lose' },
                    { p: 0.05, label: 'tie, then lose the replay', kind: 'coin' },
                  ],
                },
              ]}
            />
            <OutcomeGrid
              title="Two dice against a total of 8"
              classify={(a, b) => (a + b > 8 ? 'win' : a + b === 8 ? 'tie' : 'lose')}
              kinds={{
                win: { label: 'Beats 8', kind: 'safe', mark: '✓' },
                tie: { label: 'Ties 8', kind: 'coin', mark: '=' },
                lose: { label: 'Under 8', kind: 'lose' },
              }}
            />
            <Disclosure title="Disclosure">
              <Questions items={[{ q: 'A question?', a: 'Its answer, computed where it’s a number.' }]} />
            </Disclosure>
            <OddsLabLink query={PRESETS[0].query}>An Odds Lab link</OddsLabLink>
          </Section>
        </div>
      </Page>
    </Layout>
  )
}

export default DesignPage
