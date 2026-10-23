import React, { useEffect, useState } from 'react'
import { Link } from 'gatsby'
import {
  ArrowRight,
  BookOpen,
  ChevronRight,
  Dices,
  FlaskConical,
  Lightbulb,
  Settings,
  Swords,
} from 'lucide-react'
import { Chip, Panel, Stat } from '../components/Page'
import { Hand } from '../components/Dice'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { CALLABLE_GAMES } from '../lib/games-config'
import { DOCS, GROUPS, docPath } from './registry'
import {
  Code,
  DoDont,
  DocSection,
  SpecTable,
  Specimen,
  StatusBadge,
} from './DocKit'
import { contrast, currentValue, hslToHex } from './theme-draft'

/**
 * The design system's written pages: the Overview and every Foundation
 * except the theme playground (ThemePlayground.jsx). Keyed by registry id.
 */

/* ── Overview ── */

function Introduction() {
  const counts = (section) => DOCS.filter((d) => d.section === section).length
  const proposed = DOCS.filter((d) => d.status === 'proposed')
  return (
    <div className="space-y-10">
      <p className="text-lg text-muted-foreground">
        Every screen on Refusal Dice is built from the pieces on this site, so
        changing one changes it everywhere. Each piece below renders the real
        component, live, in whichever theme you’re using.
      </p>
      <div className="grid gap-3 sm:grid-cols-3">
        <Stat
          value={String(counts('foundations'))}
          label="Foundations"
          sub="color, type, layout, writing…"
        />
        <Stat
          value={String(counts('components'))}
          label="Components"
          sub={`in ${GROUPS.components.length} groups`}
        />
        <Stat
          value={String(counts('patterns'))}
          label="Patterns"
          sub="whole features, built from components"
        />
      </div>
      {proposed.length > 0 && (
        <Panel tone="note" title={`Waiting for approval (${proposed.length})`}>
          <p className="mb-3 text-sm">
            These are on the site for review. Until they’re approved, only the
            design system may use them.
          </p>
          <ul className="grid gap-1 sm:grid-cols-2">
            {proposed.map((d) => (
              <li key={d.id}>
                <Link
                  to={docPath(d.id)}
                  className="text-sm font-medium text-primary hover:underline"
                >
                  {d.title}
                </Link>
              </li>
            ))}
          </ul>
        </Panel>
      )}
      <DocSection title="How this site is organized">
        <SpecTable
          head={['Section', 'What’s in it']}
          rows={[
            ['Overview', 'Principles, and how a new pattern gets approved.'],
            [
              'Foundations',
              'Color, typography, layout, shape, motion, icons, writing, accessibility, and the theme playground.',
            ],
            [
              'Components',
              `The building blocks, in groups: ${GROUPS.components.join(', ')}.`,
            ],
            [
              'Patterns',
              'Whole features built from components: Play, the tutorial, the Odds Lab tools, the Strategy Assistant.',
            ],
          ]}
        />
      </DocSection>
      <DocSection title="Status">
        <SpecTable
          head={['Status', 'Means']}
          rows={[
            [<StatusBadge key="a" status="approved" />, 'Use it anywhere.'],
            [
              <StatusBadge key="p" status="proposed" />,
              'On this site for review. Only the design system may render it until it’s approved.',
            ],
            [
              <StatusBadge key="d" status="deprecated" />,
              'Kept for reference. Nothing may import it; the page says what to use instead.',
            ],
          ]}
        />
        <p className="text-sm text-muted-foreground">
          The tests in <Code>src/__tests__/design-system.test.ts</Code> enforce
          all three, and fail when a component file isn’t listed in{' '}
          <Code>src/design-system/registry.js</Code>.
        </p>
      </DocSection>
      <DocSection title="Start here">
        <div className="grid gap-3 sm:grid-cols-2">
          {['principles', 'contributing', 'typography', 'theming'].map((id) => {
            const d = DOCS.find((x) => x.id === id)
            return (
              <Link
                key={id}
                to={docPath(id)}
                className="group rounded-xl border bg-card p-4 shadow-sm transition-colors hover:border-primary"
              >
                <span className="flex items-center justify-between font-semibold">
                  {d.title}{' '}
                  <ArrowRight
                    aria-hidden
                    className="h-4 w-4 text-primary transition-transform group-hover:translate-x-0.5"
                  />
                </span>
                <span className="mt-1 block text-sm text-muted-foreground">
                  {d.summary}
                </span>
              </Link>
            )
          })}
        </div>
      </DocSection>
    </div>
  )
}

function Principles() {
  const items = [
    [
      'Teach through the table',
      'The site exists to teach a bar game. Show dice, seats and the felt instead of describing them, and put the odds next to the decision they’re for.',
    ],
    [
      'Every number is computed',
      'Odds come from exact enumeration or a seeded simulation with its sample size stated. Nothing is typed in or guessed; heuristics say so.',
    ],
    [
      'One way to do each thing',
      'A roll is always a Hand, a section is always a Panel, a call is always a CallName. If a piece almost fits, improve it; don’t fork it.',
    ],
    [
      'Verdict first, detail on request',
      'Lead with the answer in one plain sentence. Put the math, the questions and the edge cases behind a Disclosure.',
    ],
    [
      'Thumbs first',
      'Everything works at 390px wide. The action you need now sits where a thumb reaches it, with a 44px target.',
    ],
    [
      'Calm, then a little delight',
      'Warm paper and ink for reading; the felt, the dice and the coral pop are kept for play.',
    ],
  ]
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {items.map(([t, d], i) => (
        <Panel key={t} title={`${i + 1}. ${t}`}>
          <p className="text-sm">{d}</p>
        </Panel>
      ))}
    </div>
  )
}

function Contributing() {
  return (
    <div className="space-y-10">
      <p className="text-lg text-muted-foreground">
        Nothing new reaches the site until it has been on this page and
        approved. That keeps one way of doing each thing, and gives every change
        a place to be looked at in both themes and at phone width.
      </p>
      <DocSection title="The steps">
        <ol className="space-y-3">
          {[
            [
              'Look here first',
              'Search the sidebar. If something almost fits, add a prop or a size to it rather than building a new one.',
            ],
            [
              'Build it in its kit',
              'Put the component in the right folder of src/components (or a new kit folder), pure logic in a .ts file beside it with a test.',
            ],
            [
              'Register it as proposed',
              'Add an entry to src/design-system/registry.js with status “proposed”, what it replaces, and a live example in examples.jsx.',
            ],
            [
              'Show it',
              'Open its page here: light and dark, 390px wide, keyboard only. Screenshot it for the pull request.',
            ],
            [
              'Get it approved',
              'The site owner approves it in the pull request. Only then does its status change to “approved” (with the date), and only then may pages use it. The tests block it until then.',
            ],
          ].map(([t, d], i) => (
            <li key={t} className="flex gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                {i + 1}
              </span>
              <span>
                <span className="font-semibold">{t}.</span>{' '}
                <span className="text-muted-foreground">{d}</span>
              </span>
            </li>
          ))}
        </ol>
      </DocSection>
      <DocSection title="Retiring a piece">
        <p>
          Mark it <StatusBadge status="deprecated" />, say what replaces it in
          its summary, and move every use to the replacement. The tests fail
          while anything still imports it; delete it when nothing does.
        </p>
      </DocSection>
      <DocSection title="What the tests check">
        <ul className="list-disc space-y-1 pl-5 text-sm">
          <li>
            Every component file in src/components is in the registry, with the
            exports it lists.
          </li>
          <li>
            Only approved components are imported outside the design system;
            nothing imports a deprecated one.
          </li>
          <li>
            Every component has a live example here, or a link to the page that
            shows it.
          </li>
          <li>
            Pages and templates define no components of their own and render no
            raw buttons, inputs, selects or tables.
          </li>
          <li>
            Colors are tokens; text sizes come from the type scale; headings use
            a type role.
          </li>
          <li>
            Copy says “tap”, not “click”, and names games the way games-config
            does.
          </li>
        </ul>
      </DocSection>
    </div>
  )
}

/* ── Foundations ── */

const SWATCHES = [
  ['background', 'Page background (warm paper)', 'foreground'],
  ['foreground', 'Text (ink)', 'background'],
  ['card', 'Panels and cards', 'card-foreground'],
  ['muted', 'Quiet fills, note panels', 'muted-foreground'],
  ['muted-foreground', 'Secondary text', 'background'],
  [
    'primary',
    'Links, actions, the dice that make a game',
    'primary-foreground',
  ],
  ['border', 'Borders and dividers', null],
  ['destructive', 'Destructive actions', 'destructive-foreground'],
  ['felt', 'The table', 'felt-foreground'],
  ['dice', 'The dice', 'dice-edge'],
  ['pop', 'Pencils, the Hammer’s call, the headline', 'pop-foreground'],
  ['odds-safe', 'Odds: you’re safe', null],
  ['odds-coin', 'Odds: it could go either way', null],
  ['odds-lose', 'Odds: you take the pencil', null],
]

/** Contrast of each text-on-fill pair, read from the page (so a theme draft shows too) */
function useContrastRows(pairs) {
  const [rows, setRows] = useState([])
  useEffect(() => {
    const read = () =>
      setRows(
        pairs.map(([fg, bg]) => {
          const a = currentValue(`--color-${fg}`)
          const b = currentValue(`--color-${bg}`)
          return { fg, bg, a, b, ratio: a && b ? contrast(a, b) : null }
        })
      )
    read()
    const obs = new MutationObserver(read)
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class', 'style'],
    })
    return () => obs.disconnect()
  }, [pairs])
  return rows
}

const CONTRAST_PAIRS = [
  ['foreground', 'background'],
  ['muted-foreground', 'background'],
  ['foreground', 'card'],
  ['muted-foreground', 'muted'],
  ['primary', 'background'],
  ['primary-foreground', 'primary'],
  ['felt-foreground', 'felt'],
  ['pop-foreground', 'pop'],
]

export function ContrastTable() {
  const rows = useContrastRows(CONTRAST_PAIRS)
  return (
    <SpecTable
      head={['Text', 'On', 'Sample', 'Ratio', 'WCAG']}
      rows={rows.map((r) => [
        <Code key="f">{r.fg}</Code>,
        <Code key="b">{r.bg}</Code>,
        <span
          key="s"
          className="rounded px-2 py-1 text-sm font-medium"
          style={{
            color: r.a && hslToHex(r.a),
            background: r.b && hslToHex(r.b),
          }}
        >
          Roll. Call.
        </span>,
        r.ratio ? r.ratio.toFixed(2) : '…',
        r.ratio
          ? r.ratio >= 7
            ? 'AAA'
            : r.ratio >= 4.5
              ? 'AA'
              : r.ratio >= 3
                ? 'AA large only'
                : 'Fails'
          : '…',
      ])}
    />
  )
}

function Color() {
  return (
    <div className="space-y-10">
      <p className="text-lg text-muted-foreground">
        Every color is a token with a light and a dark value, defined in{' '}
        <Code>src/styles/global.css</Code> and mapped in{' '}
        <Code>tailwind.config.js</Code>. Never use a hex value or a Tailwind
        palette color (<Code>green-500</Code>): the tests fail on them. Switch
        the theme in Settings to see the dark values.
      </p>
      <DocSection title="Tokens">
        <ul className="grid gap-3 sm:grid-cols-2">
          {SWATCHES.map(([name, use, on]) => (
            <li
              key={name}
              className="flex items-center gap-3 rounded-xl border bg-card p-3"
            >
              <span
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border text-sm font-bold"
                style={{
                  background: `hsl(var(--color-${name}))`,
                  color: on ? `hsl(var(--color-${on}))` : undefined,
                }}
              >
                {on ? 'Aa' : ''}
              </span>
              <span className="min-w-0">
                <Code>{name}</Code>
                <span className="block text-sm text-muted-foreground">
                  {use}
                </span>
              </span>
            </li>
          ))}
        </ul>
      </DocSection>
      <DocSection title="Contrast, measured live">
        <p className="text-sm text-muted-foreground">
          Body text needs 4.5:1 (AA); large text and UI parts need 3:1.
        </p>
        <ContrastTable />
      </DocSection>
      <DocSection title="Using color">
        <DoDont
          dos={[
            'Use semantic tokens: bg-background, text-foreground, text-muted-foreground, bg-primary, border-border.',
            'Use the odds tokens only for what an outcome means for the player: safe, either way, lose.',
            'Keep felt, dice and pop for play and delight.',
            'Pair every color with words or a shape (a status chip says “In the cup”, not just green).',
          ]}
          donts={[
            'Give data a traffic-light color unless it means good or bad for the player.',
            'Write hex values, inline style colors or Tailwind palette colors.',
            'Rely on color alone to say anything.',
          ]}
        />
      </DocSection>
    </div>
  )
}

const ROLES = [
  ['text-display', 'Display', 'The home headline only', 'Roll. Call. Refuse.'],
  ['text-title', 'Title', 'Each page’s h1 (PageHeader)', 'How to play'],
  [
    'text-section',
    'Section',
    'h2 between panels; home sections; a game on the Games page; Stat numbers',
    'Each round',
  ],
  [
    'text-heading',
    'Heading',
    'Panel titles (h2 inside a Panel)',
    'A question from the table',
  ],
  [
    'text-subheading',
    'Subheading',
    'h3 inside a section; note panel titles',
    'Second call',
  ],
]

const SCALE = [
  ['text-2xs', '10px', 'Labels on dice groups only (DiceGroup, OutcomeGrid)'],
  ['text-xs', '12px', 'Captions, notes, eyebrows, table details'],
  ['text-sm', '14px', 'Secondary text, controls, most tool UI'],
  ['text-base', '16px', 'Body text'],
  ['text-lg', '18px', 'Lead paragraphs (PageHeader description)'],
  ['text-xl', '20px', 'Emphasis inside a component'],
  ['text-2xl', '24px', 'A call’s name, a figure inside a card'],
]

function Typography() {
  return (
    <div className="space-y-10">
      <p className="text-lg text-muted-foreground">
        Two families: <strong>Bricolage Grotesque</strong> for headings (
        <Code>font-display</Code>, applied to h1–h3 automatically) and{' '}
        <strong>Inter</strong> for everything else. Running text stops at 70
        characters a line.
      </p>
      <DocSection title="Heading roles">
        <p className="text-sm text-muted-foreground">
          Every heading uses one of these five roles; the tests fail on a
          heading without one. Sizes are CSS variables, so they grow on wider
          screens and the theme playground can change them.
        </p>
        <div className="space-y-4">
          {ROLES.map(([cls, name, use, sample]) => (
            <div
              key={cls}
              className="grid gap-2 border-b pb-4 sm:grid-cols-[12rem_minmax(0,1fr)]"
            >
              <div>
                <Code>{cls}</Code>
                <p className="mt-1 text-xs text-muted-foreground">{use}</p>
              </div>
              <p className={`${cls} font-display`}>{sample}</p>
            </div>
          ))}
        </div>
      </DocSection>
      <DocSection title="Text sizes">
        <SpecTable
          head={['Class', 'Size', 'Use it for', 'Sample']}
          rows={SCALE.map(([cls, px, use]) => [
            <Code key="c">{cls}</Code>,
            px,
            use,
            <span key="s" className={cls}>
              Five dice, ten games
            </span>,
          ])}
        />
        <p className="text-sm text-muted-foreground">
          Larger sizes come only from the heading roles. Arbitrary sizes (
          <Code>text-[13px]</Code>) fail the tests.
        </p>
      </DocSection>
      <DocSection title="Eyebrow">
        <Specimen>
          <p className="eyebrow text-primary">Next</p>
          <p className="font-display text-xl font-bold">Meet the ten games</p>
        </Specimen>
        <p className="text-sm">
          <Code>eyebrow</Code> is the small uppercase label above or before
          something: “Next”, “1st call”, a footer group. Add a color class with
          it.
        </p>
      </DocSection>
      <DocSection title="Weight and emphasis">
        <DoDont
          dos={[
            'font-semibold for labels and emphasis; font-medium for controls; font-bold only for figures.',
            'One level of heading per step down: title, section, heading, subheading.',
            'tabular-nums for any figure that changes or lines up in a column.',
          ]}
          donts={[
            'Skip heading levels for size: pick the role, not the level.',
            'Set headings in Inter, or body text in the display face.',
            'Use all caps except through eyebrow.',
          ]}
        />
      </DocSection>
    </div>
  )
}

function LayoutDoc() {
  return (
    <div className="space-y-10">
      <DocSection title="Page widths">
        <p>
          Every page sits in the header’s 1280px frame, left-aligned, so titles
          line up under the logo. <Code>Page width</Code> caps the content
          column; pages never set their own <Code>max-w-*</Code>.
        </p>
        <SpecTable
          head={['Width', 'Column', 'Use it for']}
          rows={[
            [
              <Code key="r">reading</Code>,
              '768px',
              'Text read top to bottom: Rules, Glossary',
            ],
            [
              <Code key="t">tool</Code>,
              '1024px',
              'Things you use: Learn, Play, Strategy, Odds Lab, game pages',
            ],
            [
              <Code key="w">wide</Code>,
              '1280px',
              'Grids of cards: Games, the home page, this design system',
            ],
          ]}
        />
      </DocSection>
      <DocSection title="Spacing">
        <p>
          Spacing follows a 4px grid through Tailwind’s scale. Space inside a
          group is smaller than space between groups.
        </p>
        <div className="space-y-2">
          {[
            ['1', '4px', 'Icon to its label'],
            ['2', '8px', 'Items in a row of chips or buttons'],
            ['3', '12px', 'Cards in a grid; lines in a control group'],
            ['4', '16px', 'Inside a panel on phones; between related blocks'],
            ['6', '24px', 'Inside a panel on wider screens; between panels'],
            ['8', '32px', 'After the PageHeader'],
            ['12', '48px', 'Between page sections; before NextStep'],
          ].map(([n, px, use]) => (
            <div
              key={n}
              className="grid grid-cols-[5rem_4rem_minmax(0,1fr)] items-center gap-3 text-sm"
            >
              <Code>{`space-${n}`}</Code>
              <span
                className="h-3 rounded bg-primary/70"
                style={{ width: px }}
              />
              <span className="text-muted-foreground">
                {px}: {use}
              </span>
            </div>
          ))}
        </div>
      </DocSection>
      <DocSection title="Breakpoints">
        <SpecTable
          head={['From', 'Name', 'What changes']}
          rows={[
            [
              '0',
              'phone',
              'One column. Your move docks to the bottom in Play. 16px gutters.',
            ],
            ['640px', 'sm', 'Two-column grids; headings grow.'],
            ['768px', 'md', 'The header shows the full navigation.'],
            [
              '1024px',
              'lg',
              'Side panels (Play’s order of play, this sidebar).',
            ],
          ]}
        />
      </DocSection>
      <DocSection title="Grouping">
        <DoDont
          dos={[
            'Group a section in one Panel.',
            'Inside a Panel, group with a heading, a divider, a Stat or a plain bordered box.',
            'One tool panel per page: the thing you interact with.',
          ]}
          donts={[
            'Nest a Panel inside a Panel.',
            'Use ui/card (use Panel).',
            'Center-align content inside left-aligned pages.',
          ]}
        />
      </DocSection>
    </div>
  )
}

function Shape() {
  return (
    <div className="space-y-10">
      <DocSection title="Radius">
        <SpecTable
          head={['Class', 'Use it for', 'Sample']}
          rows={[
            [
              <Code key="1">rounded-md</Code>,
              'Buttons, inputs, selects',
              <span
                key="s"
                className="inline-block h-8 w-16 rounded-md border bg-card"
              />,
            ],
            [
              <Code key="2">rounded-lg</Code>,
              'Boxes inside a panel; tokens (--radius-lg)',
              <span
                key="s"
                className="inline-block h-8 w-16 rounded-lg border bg-card"
              />,
            ],
            [
              <Code key="3">rounded-xl</Code>,
              'Panels, Stats, tables',
              <span
                key="s"
                className="inline-block h-8 w-16 rounded-xl border bg-card"
              />,
            ],
            [
              <Code key="4">rounded-2xl</Code>,
              'Home path cards, NextStep, the call placard',
              <span
                key="s"
                className="inline-block h-8 w-16 rounded-2xl border bg-card"
              />,
            ],
            [
              <Code key="5">rounded-full</Code>,
              'Chips, badges, step numbers, the Play controls',
              <span
                key="s"
                className="inline-block h-8 w-16 rounded-full border bg-card"
              />,
            ],
            [
              <Code key="6">rounded-[22%]</Code>,
              'Dice only',
              <span
                key="s"
                className="inline-block h-8 w-8 rounded-[22%] border bg-dice"
              />,
            ],
          ]}
        />
      </DocSection>
      <DocSection title="Elevation">
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            ['shadow-sm', 'Panels, cards and seats at rest'],
            ['shadow-md', 'Something lifted: a hovered card, the call placard'],
            ['shadow-lg', 'Your seat docked over the table in Play'],
          ].map(([cls, use]) => (
            <div key={cls} className={`rounded-xl border bg-card p-4 ${cls}`}>
              <Code>{cls}</Code>
              <p className="mt-1 text-sm text-muted-foreground">{use}</p>
            </div>
          ))}
        </div>
      </DocSection>
      <DocSection title="Borders">
        <p className="text-sm">
          1px <Code>border</Code> in the border token separates; a 2px primary
          border (or ring) marks the chosen or active thing; a dashed border
          means “not there yet” (an empty slot, a result to come).
        </p>
      </DocSection>
    </div>
  )
}

function Motion() {
  return (
    <div className="space-y-10">
      <p className="text-lg text-muted-foreground">
        Short and purposeful: motion shows what changed, never decorates.
        Everything honors reduced motion.
      </p>
      <SpecTable
        head={['Motion', 'Where', 'Reduced motion']}
        rows={[
          [
            'Dice tumble (~1s)',
            'Die, on a new rollId',
            'Shows the result at once',
          ],
          [
            'story-pop (0.35s)',
            'Something new appears: the call placard, a cup',
            'None',
          ],
          ['seat-said pulse', 'A seat’s newest move in Play', 'None'],
          ['The turn outline glides', 'Seat (framer-motion layoutId)', 'Jumps'],
          ['The Hammer token slides', 'TableOrder', 'Jumps'],
          ['Rows reorder', 'Standings', 'Jumps'],
        ]}
      />
      <DoDont
        dos={[
          'Keep transitions under 400ms, except a die’s tumble.',
          'Check prefers-reduced-motion (usePrefersReducedMotion, useReducedMotion).',
        ]}
        donts={[
          'Animate to decorate.',
          'Move anything the player is about to tap.',
        ]}
      />
    </div>
  )
}

function Icons() {
  return (
    <div className="space-y-10">
      <DocSection title="Icons">
        <p>
          Icons come from <Code>lucide-react</Code> only. Inline with text
          they’re <Code>h-4 w-4</Code>; alone in a button, <Code>h-5 w-5</Code>.
          Decorative icons get <Code>aria-hidden</Code>; an icon-only button
          gets an <Code>aria-label</Code>.
        </p>
        <Specimen>
          <div className="flex flex-wrap items-center gap-4 text-sm">
            {[
              BookOpen,
              Dices,
              FlaskConical,
              Swords,
              Lightbulb,
              Settings,
              ChevronRight,
              ArrowRight,
            ].map((Icon, i) => (
              <Icon key={i} aria-hidden className="h-5 w-5" />
            ))}
          </div>
        </Specimen>
      </DocSection>
      <DocSection title="Game emoji">
        <p>
          Each game has its own emoji in games-config. It names the game
          wherever the game appears (CallName, chips, cards).
        </p>
        <Specimen>
          <div className="flex flex-wrap gap-2">
            {CALLABLE_GAMES.map((g) => (
              <Chip key={g.id}>
                <span aria-hidden>{g.emoji}</span> {g.name}
              </Chip>
            ))}
          </div>
        </Specimen>
        <DoDont
          dos={[
            'Use 🔨 for the Hammer, ✏️ for pencils, a game’s own emoji for the game.',
            'Hide emoji from screen readers when the text says the same.',
          ]}
          donts={[
            'Put emoji in page titles, except a game’s own on its page.',
            'Use an emoji as the only label.',
          ]}
        />
      </DocSection>
    </div>
  )
}

function Writing() {
  return (
    <div className="space-y-10">
      <p className="text-lg text-muted-foreground">
        The site talks like a good player at the table explaining a call: plain,
        short, specific, and in the game’s own words.
      </p>
      <DocSection title="Voice">
        <DoDont
          dos={[
            'Talk to the player: “you”, “your roll”.',
            'Lead with the answer in one sentence, then the why.',
            'Use the table’s words: Hammer, refusal, kicker, pencil, in the cup, all day. Link each to the Glossary the first time (Term).',
            'Say “tap” for touch and pointer alike.',
          ]}
          donts={[
            'Say “click”, “simply” or “just”.',
            'Use jargon the Glossary doesn’t define.',
            'Hedge a computed number (“maybe around”): say how it was computed instead.',
          ]}
        />
      </DocSection>
      <DocSection title="Mechanics">
        <SpecTable
          head={['Rule', 'Write', 'Not']}
          rows={[
            [
              'Sentence case for titles, buttons and labels',
              'Every game’s odds',
              'Every Game’s Odds',
            ],
            ['Buttons start with a verb', 'Roll for 10-3 High', 'OK'],
            [
              'Curly quotes and apostrophes',
              'you’re · “come up”',
              'you\'re · "come up"',
            ],
            ['En dash for ranges, no spaces', '2–8 players', '2-8 players'],
            [
              'Game names from games-config',
              'Ship, Captain, Crew · 7’s · Tres Away',
              'Ship Captain Crew · Sevens',
            ],
            ['A call: game then variant', '10-3 High', 'High 10-3'],
            ['A kicker is singular', 'a kicker of 6+1', 'kickers of 6 and 1'],
            [
              'Dice shown, never written',
              <Hand
                key="h"
                dice={[1, 3, 6, 5, 5]}
                game="10-3"
                variant="high"
                size="xs"
              />,
              '[1, 3, 6, 5, 5]',
            ],
          ]}
        />
      </DocSection>
      <DocSection title="Numbers and odds">
        <DoDont
          dos={[
            'Format chances with fmtPct: 49.1%, <1%, >99%.',
            'State where a figure comes from: “exact over all 7,776 rolls”, or “1,000 rounds played out by solid bots”.',
            'Give a natural frequency next to a hard percentage: “about 1 in 5”.',
          ]}
          donts={[
            'Type a number in: compute it.',
            'Show a simulated figure without its sample size.',
            'Print “0%” for a chance that isn’t zero.',
          ]}
        />
      </DocSection>
      <DocSection title="Messages">
        <p className="text-sm">
          An error says what happened and what to do next: “Two requirements
          claim the same dice: no roll can meet both. Remove one.”
        </p>
      </DocSection>
    </div>
  )
}

function Accessibility() {
  return (
    <div className="space-y-10">
      <SpecTable
        head={['Area', 'The rule']}
        rows={[
          [
            'Contrast',
            'Body text 4.5:1, large text and UI parts 3:1, in both themes (Color has the live check).',
          ],
          [
            'Keyboard',
            'Everything works with the keyboard alone; focus rings stay (focus-visible:ring-2 ring-ring).',
          ],
          [
            'Targets',
            'A page’s main actions are at least 44px (Button size lg, ChoiceGroup size lg); nothing interactive is under 32px.',
          ],
          [
            'Semantics',
            'Real buttons and links; ChoiceGroup is a radiogroup, Chip says aria-pressed; one h1 per page; headings in order.',
          ],
          [
            'Not color alone',
            'Status chips have words; StrengthTag shows the number; odds bars have labels.',
          ],
          ['Motion', 'Everything honors prefers-reduced-motion.'],
          [
            'Live updates',
            'Play’s announcer and the speed line are aria-live; hidden dice are labeled “Hidden die”.',
          ],
          ['Zoom', 'Layouts reflow at 200% zoom with no sideways scroll.'],
        ]}
      />
      <Specimen title="Focus ring">
        <div className="flex gap-2">
          <Button className="ring-2 ring-ring ring-offset-2">
            Focused button
          </Button>
          <Badge variant="outline">Tab to any control to see it</Badge>
        </div>
      </Specimen>
    </div>
  )
}

export const GUIDES = {
  introduction: Introduction,
  principles: Principles,
  contributing: Contributing,
  color: Color,
  typography: Typography,
  layout: LayoutDoc,
  shape: Shape,
  motion: Motion,
  icons: Icons,
  writing: Writing,
  accessibility: Accessibility,
}
