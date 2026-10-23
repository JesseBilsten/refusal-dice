# Design system

Every repeated piece of UI on Refusal Dice comes from one shared component,
so changing that component changes it everywhere. Before building UI, look
here for an existing piece.

**See it live at `/design`** (linked from the footer): a site modelled on
Ant Design and Material, with a sidebar of **Overview** (introduction,
principles, proposing a pattern), **Foundations** (color, typography,
layout and spacing, shape and elevation, motion, icons and emoji, writing
style, accessibility, the theme playground), **Components** (General,
Layout, Navigation, Data entry, Data display, Dice, Table, Odds, Feedback)
and **Patterns** (whole features). Each piece has its own page at
`/design/<id>/` with its status, source and live examples.

- **The registry** (`src/design-system/registry.js`) lists every
  component file and its status: *approved* (use it anywhere), *proposed*
  (shown on the design system for review; only the design system may use
  it) or *deprecated* (nothing may import it). It drives the site and the
  tests.
- **New patterns are approved before they're used.** Register a new piece
  as proposed with a live example (`src/design-system/examples.jsx`); the
  site owner approves it, and only then is it set to approved. The steps
  are in [WORKFLOW.md](WORKFLOW.md) and on `/design/contributing/`.
- **The theme playground** (`/design/theming/`) tries colors, fonts,
  heading sizes and radius live, without a rebuild, and gives the CSS to
  keep.
- **The tests** (`src/__tests__/design-system.test.ts`) fail on: an
  unregistered component file; a proposed or deprecated component used
  outside the design system; a component with no live example or page; a
  page or template that defines its own component or renders a raw button,
  input, select or table; raw palette or hex colors; arbitrary text sizes
  or sizes above 2xl; headings without a type role; pages that set their
  own width or have no `PageHeader`; `ui/card`; local copies of the game
  list; `@/` imports; and copy that says "click" or misspells a game.

## The story the site tells

Pages are ordered as a path, and link forward along it:

1. **Learn** (`/learn`): one guided round.
2. **Rules** and **Games** (`/rules`, `/games`, `/games/<id>`): how each
   game is made, its quirks, and, where the game has one, a real "question
   from the table" with its exact answer.
3. **Odds Lab** (`/odds-lab`): answer your own questions. *What should I
   keep?* (exact keep-or-roll odds), *Every game's odds*, *Build any roll*.
4. **Strategy** (`/strategy-assistant`): your roll and seat, simulated;
   *Predict the second call*.
5. **Play** (`/play`): full games against bots, with hints and Odds Lab
   links for your exact situation.

The navigation groups these as **Learn the game** (Learn, Rules, Games,
Glossary), **Get better** (Odds Lab, Strategy) and **Play**, in the header,
the mobile menu and the footer's site map (`nav-items.js`, `NAV_GROUPS`).
Each page's `NextStep` leads to the next stop: Learn → Rules → Games →
Odds Lab → Strategy → Play. The home page tells a round as an animated
story and lays out the path.

## Foundations

- **Color tokens** (`src/styles/global.css`, `tailwind.config.js`). Each
  has light and dark values. Never use raw hex values or Tailwind palette
  colors (`green-500`); the test fails on them.
  - Semantic: `background` (warm paper), `foreground` (ink), `card`,
    `muted`, `primary` (blue: links, actions, the dice that make a game),
    `secondary`, `accent`, `destructive`, `border`, `input`, `ring`.
  - Brand, used sparingly for play and delight: `felt` (the table green,
    with `felt-foreground`), `dice` (the dice cream), `pop` (coral: the
    home headline, pencils, the Hammer's call). All take an alpha.
  - Don't give data a traffic-light color unless it means good or bad for
    the player (that's what the odds tokens are for). How common a game
    is, for example, is neutral `primary`.
  - Odds: `odds-lose`, `odds-coin`, `odds-safe`, which take an alpha, e.g.
    `bg-odds-lose/15`.
  - Rarity: `legendary`, `epic`, `rare`, `uncommon`, `common`.
- **Type:** Bricolage Grotesque for headings (`font-display`, applied to
  h1–h3 automatically), Inter for everything else; both are CSS variables
  (`--font-display`, `--font-sans`). Running text is capped at 70
  characters (`p { max-width: 70ch }`).
  - **Heading roles:** every heading uses one: `text-display` (the home
    headline), `text-title` (each page's h1), `text-section` (h2 between
    panels), `text-heading` (Panel titles), `text-subheading` (h3, note
    titles). Sizes are CSS variables (`--fs-*`) that grow at `sm`.
  - **Text sizes:** `text-2xs` (10px, dice-group labels only), `xs`, `sm`,
    `base`, `lg`, `xl`, `2xl`. Nothing larger outside the roles, and no
    arbitrary sizes.
  - **Eyebrow:** `eyebrow` is the small uppercase label ("Next", "1st
    call", footer groups); add a color class.
- **Writing:** plain words, the table's terms, "tap" not "click", sentence
  case, curly quotes, en dashes for ranges, game names from games-config
  ("Ship, Captain, Crew"), and every number computed with its source
  stated. The full guide is `/design/writing/`.
- **Radius:** `rounded-lg`, `rounded-md`, `rounded-sm` (tokens); panels and
  cards `rounded-xl`, home cards `rounded-2xl`. Dice use `rounded-[22%]`.
- **Motion:** short and purposeful (dice tumbles, a pop-in). Everything
  honors `prefers-reduced-motion`.
- **Dark mode:** class-based (`dark` on `<html>`). The theme is Light, Dark
  or System (follow the device), chosen in Settings; `gatsby-ssr.js` sets it
  before first paint. Check both themes for every change.
- **Mobile first:** every screen works at 390px wide with no horizontal
  scroll.

## Page frame: `src/components/Page/`

Every page is `<Layout><Page width="…"><PageHeader … />…</Page></Layout>`.
Every page sits in the header's 1280px frame, so the title starts under the
logo on every page and nothing jumps as you move between pages. `width`
caps the content column, **left-aligned**. Pages never set their own
`max-w-*`.

| Width | Content column | Use it for |
|---|---|---|
| `reading` | 768px | Text read top to bottom: Rules, Glossary |
| `tool` | 1024px | Things you use: Learn, Play, Strategy Assistant, Odds Lab, game pages |
| `wide` | 1280px | Grids of cards: Games, the home page (matches the header) |

- `PageHeader`: left-aligned title, a one- or two-sentence description,
  then optional `breadcrumbs`, `badge`, `eyebrow` and links (children).
  No emoji in titles, except a game's own emoji on its page.
- `StepNumber`: a step's number in a filled circle. Numbered steps are
  Panels titled with it (the Rules page) or cards led by it (the home
  page's path).
- `Container`: width and gutters only, for full-bleed sections such as the
  home hero. Use `width="wide"` so it lines up with every page.
- `Panel`: a section in a box, and the only one: never use `ui/card`.
  `tone`: `default`, `tool` (the thing you interact with, tinted; one per
  page) or `note` (an aside). `title` can be a node (a game's emoji and
  link, or a button that collapses the panel). Never nest panels: inside
  one, group with a heading, a divider, a `Stat` or a plain
  `rounded-lg border bg-background` box (the roll builder's patterns).
- `Stat`: a headline number with its label; `plain` drops the card for a
  row of figures inside a Panel.
- `StepPanel`: one numbered step, a Panel titled with its
  StepNumber (the Rules page's round).
- `Field` and `EmptyState`: a labelled control with a hint;
  the dashed box where a result will appear.
- `ChoiceGroup`: pick one of a few options, as a labelled row
  of Chips with radio semantics; `size="lg"` for 44px targets.
- `TextLink` and `Term`: a link in running text; `Term` links
  a game term to the Glossary.
- `Panel collapsible`: the title becomes a button that shows or hides the
  content; `badge` sits after the title.
- `PageTabs` (+ `tabFromUrl`): top-level tools on one page, kept in
  `?tab=`. Only the chosen tab renders.
- `NextStep`: the next stop on the path, at the foot of a page.
- `Chip`: a tappable choice (a game, a count, an example question);
  `active` makes a row of chips a segmented control; `to` makes it a link
  that looks the same.

## Table: `src/components/Table/`

- `Standings`: **the ranking pattern.** Players best first: rank (tied
  players share one), name, a line of detail, an optional `aside` (the
  piddle die) and a status chip from `STANDING_STATUS`: *Worst hand*,
  *Tied worst*, *In the cup*, *Pencil*, *Rolls again*, *Hammer*, *Boss*.
  Rows slide to their new place as the order changes. Play uses it for the
  piddle and for each round (fed by the engine's `standings()`); use it for
  any ranked list of players.

- `TableFelt`: **the table**: green felt in a wood rail. Seats, and
  anything played at the table, sit on it: the home page's story and
  Play. Text placed directly on the felt uses `text-felt-foreground`.

- `Seat`: one player at the table (name, role badges, decision, a pencil
  meter with one slot per pencil it takes to lose, their dice, a status
  line). `said` labels the seat with its latest move, the way online tables
  do ("Calls 10-4 High", "Keeps 2, rolls 3"; the table's newest pulses
  once); `compact` and `detail` (the hand in words) suit the other players
  around your seat; `turn` draws **the turn outline**, one per table, which
  glides from seat to seat as the turn passes (framer-motion `layoutId`);
  `footer` holds your move under everything else. The tutorial and Play
  both use it.
- `TableOrder`: **the order of play**, fixed for the whole game: from the
  piddle winner, going left. The 🔨 token slides down it as the Hammer
  passes; rows show roles, the hand in words, a status chip and pencils.
- `DiceCup`: dice picked up: a player in the cup (safe; Play shows why in place of the dice, against the finished hand they beat: "Kicker of 9 beats Ben’s all-day 6"), or your dice
  before you roll for the call.
- **Play's table:** a video-player style control bar on the felt (Pause/Play,
  Next), every speed in view as a row of buttons (Very slow, the default,
  to Instant, with Realistic in between: a few seconds of thinking per move,
  varied) with a line saying what the chosen speed means, the
  call in its own placard (emoji, name, 1st or 2nd call), an announcer
  holding the newest move, the others in order of play, and your seat last,
  docked to the bottom of the screen when it's your move so your buttons
  stay in thumb reach. The piddle plays out on the same table.

- `SeatRing`: **the table seen from above** (SVG). Each seat shows a
  chance (of the pencil), tinted better or worse than an even share; your
  seat is at the bottom, seats run clockwise to your left, the Hammer gets
  🔨, and `passTo` draws the Hammer passing. A seat's `text` shows a label
  instead of a chance (the Rules page marks the 1st and 2nd refusal). Use it for anything that
  depends on where people sit.

## Settings: `src/components/Settings/`

Every site-wide setting, saved per browser: theme (`useTheme`), 3D dice and
sound (`useDicePrefs`), and house rules (`useHouseRules`). Each setting is
one hook, so every place that shows it stays in sync.

House rules change the odds: any figure that depends on one reads
`useHouseRules()` and passes it to the strategy function (`rules`), and
`useSimulation` passes it to every simulation. Today that's the Monterey
lone 3 or 4 keep.

| Component | Use it for |
|---|---|
| `Settings` | All the settings as one block. Add a new site-wide setting here and it appears everywhere. |
| `SettingsMenu` | The header's gear button: `Settings` in a popover (desktop). The mobile menu shows `Settings` directly. |
| `HouseRuleSettings` | The house-rule switches, inside `Settings`. Each gets a one-line hint saying what "off" means. |

## Primitives: `src/components/ui/`

These are shadcn/ui components (JS): Button (and `buttonVariants` for
links), Badge, Card (kept for shadcn; use `Panel`), Table, Dialog, Sheet, Popover, Tooltip, Tabs, ToggleGroup,
Switch, Slider, Select, Input, Label, Alert, and `NativeSelect`,
the one dropdown, a native select. Card, Tabs and Select are
deprecated (use Panel, PageTabs and NativeSelect). Add new primitives with
the shadcn CLI, then register them.

## Dice kit: `src/components/Dice/`

The only way dice are drawn. Never render a roll as text like
`[1, 3, 6, 5, 5]` or `13655`.

| Component | Use it for |
|---|---|
| `Die` | One die. Sizes `xs` 16, `sm` 28, `md` 40, `lg` 52 (`DIE_SIZES`). Flat SVG, or a 3D cube when the player turns 3D on (`md` and up); `dimension="3d"` forces the cube (the home story). Bump `rollId` to animate a roll. |
| `DieFace` | The flat SVG face on its own (used by `Die`). |
| `Hand` | A roll **for a game**. The dice that make it get a blue outline and the game's name; the kicker gets a dashed outline and its total. Misses show "No 10-3". Specialty games outline the dice that make the hand: Boss the poker hand (just the high die for a high die), Razzle the chosen number plus wild 1s, Tres Away the dice put out (`putOut`), or for a fresh roll the best first put-out (`tresAwayPutOut`, exact). `xs`/`sm` are compact (outlines, no labels) for tables. |
| `DiceGroup` | A hand-picked group with an outline and a label, when the grouping is authored rather than computed (e.g. the examples on the Games page). `tone`: `game`, `kicker` or `plain`. |
| `RollInput` | Anywhere a player **enters or edits** a roll. Set the dice through `diceValues`; `initialRoll` only applies on first render. |
| `RollButton` | The one Roll button (dice icon + "Roll"), for entered and scripted rolls alike. |
| `DieSlot` | An empty dashed slot for a die not rolled or entered yet (RollInput's blank boxes share `SLOT_CLASS`). A die someone rolled and hid is a `Die` with no value instead. |
| `DiceSettings` | The 3D and sound switches (both start off). `stacked` puts each on its own line (Settings). Play and the tutorial keep a row of them by the table. |

The grouping logic is `handGroups()` in `hand-groups.ts`, a pure function
covered by tests.

**Interaction rules:**

- **Editing a roll** (`RollInput`):
  - A blank slot is a box you type 1–6 into, and the number turns into a
    die.
  - Tapping a die turns it back into a box.
  - Focus moves to the next blank slot. Backspace on a blank slot goes back
    one, and pasting `13655` fills all five.
  - 🎲 Roll animates the dice and plays sound if it's on.
- **Playing a modeled game** (`Hand` with `kept` / `onToggleKeep`):
  - Tapping a die keeps it: it lifts and shows a lock badge
    (`aria-pressed`).
  - Tapping again releases it.
  - `locked` positions can't be tapped: dice put out in Tres Away, and in
    kicker games the dice kept last roll (kept dice stay kept). Play explains
    an illegal keep (including a Boss keep that would make someone else the
    Boss) under the Roll button and disables it.
  - `committed`: in kicker games, the positions kept last roll, so the
    outline shows the game made with them (a kept pair stays a pair).
- **Showing a game:** always use `Hand`, or `DiceGroup` for authored
  examples, so the game's dice are outlined and labeled.

## Odds kit: `src/components/Odds/`

How every probability decision is shown: verdict first, then comparison
bars, an outcome visual, the math and questions (collapsed), and Odds Lab
links. Components:

- `OddsDecision`
- `OutcomeGrid`
- `Branches`
- `Disclosure`, `MathSteps`, `Questions`
- `OddsLabLink`
- `ProbabilityBar`: one chance as a labeled bar (for a single figure;
  compare options with `OddsDecision`). `mark` draws a tick for a chance
  to compare against (e.g. a bark), named by `markLabel`
- `RollsPct`: a chance that depends on rolls left. Tap it to compare 1
  and 2 rolls left, from `over(n)`. Every keep's odds use it (Odds Lab,
  game-page questions); say how many rolls any other chance covers
- `useSimulation` (`use-simulation.js`): runs a strategy simulation in Web
  Workers (`src/strategy/simulate.worker.ts`), split across CPU cores, with
  the estimate updating as it goes. Never run a simulation on the main
  thread: it freezes the page.
- `HammerDecision` (`src/components/HammerDecision/`) and
  `RefusalDecision`: the Strategy Assistant's two answers, both on
  `OddsDecision`. Each call is a `CallName` with its `Hand`, its bar split
  into the ways you lose (accepted vs. both refuse and your second call).
- `BarkOdds`: what a bark is worth, as two `SeatRing`s (you call vs. you
  bark) with a player-count picker, from the generated `seat-odds.ts`. On
  the Games page's Bark card. Its pieces, `BarkRings` and `PlayersPicker`,
  are exported for `BarkGuide`.
- `BarkGuide`: the Barking page, short answer first. A one-line verdict and
  your worst roll against a bark (two `ProbabilityBar`s) at the picked table
  size, then the detail as `Disclosure` questions, closed until opened:
  `BarkHands` (every roll worst first, the bark as a tick, a "My table
  refuses 10-4" chip, decoy notes), `BarkWhy` with `BarkRings`,
  `UnheldCalls` (calling a game you don't have: exact make odds and how
  rarely it beats a held game, `heldOrNot`), `BarkSizes` (every table size)
  and `BarkAssumptions`. One player count drives every view. Lead each
  answer with one plain sentence; detail after.
- `StrengthTag`: how strong a roll is for a call, as a graded tag (Strong,
  Good, Fair, Weak) with the number beside it, from `callLoss()` (the
  generated `call-odds.ts`). Fair still beats an even share. On the Games
  page, where the games a roll plays rise to the top, strongest first.
- `HintCard` (`src/components/Play/`): Play's hint, with the options a
  solid player weighed (best first, the pick marked) and why, from
  `hintStats()` in `hint-stats.ts`.
- formatting: `fmtPct`, `inWords`

**Every roll:** `EveryPossibility` (`src/components/OddsLab/`) is the one
way to show "every roll this counts": the unique rolls as a dice grid
(`RollGrid`) with matches lit, or a map of every ordered outcome
(`OutcomeMap`). The Odds Lab's builder and *Every game's odds* use it.

**What should I keep?** `KeepAdvisor` (Odds Lab) and `SituationCard`
(game pages) rank keep options exactly with `keepOptions()` in
`src/strategy/situations.ts`, which only offers keeps the rules allow.
With one roll left in a kicker game, KeepAdvisor asks which dice you kept
last roll, since every option has to hold them. Table questions live in
`OddsLab/situations-catalog.js`; a game page shows each of its game's
questions. Only questions players really ask, or whose answer isn't common
sense, and best of all a fine line: where one choice flips to the other.
Pairs, 10-3 and 10-4 have none. Each must ask about legal keeps, and its
optional `why` (and `table` of where it flips, rendered by `SituationWhy`)
quotes only computed odds (`keepOdds`); tests check both.

The rules are in `.claude/skills/explain-odds/SKILL.md`. Reference screens:
the tutorial's take-the-tie step, and the Strategy Assistant's
accept-or-refuse decision (`RefusalDecision`).

## Game references

- `GameLink`: a game's name linking to its page.
- `CallName` (same file): **a call, named the same way everywhere**: the
  game's emoji, its name and the variant ("👌 10-3 High"), linked. Use it
  wherever a list or decision names a call.
- Game names and labels come from `src/lib/games-config.js`
  (`getGameName`, `formatCallLabel`, `GAMES_MAP`). Never hardcode them.
- Site navigation lives in `src/components/nav-items.js`.

## Known one-offs to fold in

These predate the design system. Move each onto a kit piece the next time
you work on that page:

- **Percent formatting:** `formatPct` in `OddsLab/RollBuilder.jsx` (adaptive
  precision for tiny chances) and `pct` in `OddsLab/RollGrid.jsx` duplicate
  `fmtPct`. Give `fmtPct` an adaptive mode in the Odds kit and use it.
- **Single-choice controls:** `PlayersPicker` (BarkOdds) and
  `VariantSelector` are their own segmented controls; fold them into
  `ChoiceGroup` or `ToggleGroup` once those are approved.
