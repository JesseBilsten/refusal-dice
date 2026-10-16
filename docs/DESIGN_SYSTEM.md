# Design system

Every repeated piece of UI on Refusal Dice comes from one shared component,
so changing that component changes it everywhere. Before building UI, look
here for an existing piece. If you need something new that will appear
twice or more, add it to the right kit and list it here.

**See it live at `/design`** (not in the navigation): every piece below,
in light and dark mode. `src/__tests__/design-system.test.ts` fails on
raw palette colors, pages that set their own width, pages without a
`PageHeader`, any use of `ui/card` (use `Panel`), local copies of the game list and `@/` imports.

## The story the site tells

Pages are ordered as a path, and link forward along it:

1. **Learn** (`/learn`): one guided round.
2. **Rules** and **Games** (`/rules`, `/games`, `/games/<id>`): how each
   game is made, its quirks, and one real "question from the table" with
   its exact answer.
3. **Odds Lab** (`/odds-lab`): answer your own questions. *What should I
   keep?* (exact keep-or-roll odds), *Every game's odds*, *Build any roll*.
4. **Strategy** (`/strategy-assistant`): your roll and seat, simulated;
   *Predict the second call*.
5. **Play** (`/play`): full games against bots, with hints and Odds Lab
   links for your exact situation.

The home page tells a round as an animated story and lays out this path.

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
  h1–h3 automatically), Inter for everything else. Running text is capped
  at 70 characters (`p { max-width: 70ch }`) so lines stay readable at any
  width.
- **Radius:** `rounded-lg`, `rounded-md`, `rounded-sm` (tokens); panels and
  cards `rounded-xl`, home cards `rounded-2xl`. Dice use `rounded-[22%]`.
- **Motion:** short and purposeful (dice tumbles, a pop-in). Everything
  honors `prefers-reduced-motion`.
- **Dark mode:** class-based. Check both themes for every change.
- **Mobile first:** every screen works at 390px wide with no horizontal
  scroll.

## Page frame: `src/components/Page/`

Every page is `<Layout><Page width="…"><PageHeader … />…</Page></Layout>`.
Pages never set their own `max-w-*`, so content edges line up across the
site.

| Width | Max | Use it for |
|---|---|---|
| `reading` | 768px | Text read top to bottom: Rules, Glossary |
| `tool` | 1024px | Things you use: Learn, Play, Strategy Assistant, Odds Lab, game pages |
| `wide` | 1280px | Grids of cards: Games, the home page (matches the header) |

- `PageHeader`: left-aligned title, a one- or two-sentence description,
  then optional `breadcrumbs`, `badge`, `eyebrow` and links (children).
  No emoji in titles, except a game's own emoji on its page.
- `Container`: width and gutters only, for full-bleed sections such as the
  home hero.
- `Panel`: a section in a box, and the only one: never use `ui/card`.
  `tone`: `default`, `tool` (the thing you interact with, tinted; one per
  page) or `note` (an aside). `title` can be a node (a game's emoji and
  link, or a button that collapses the panel). Never nest panels: inside
  one, group with a heading, a divider, a `Stat` or a plain
  `rounded-lg border bg-background` box (the roll builder's patterns).
- `Stat`: a headline number with its label.
- `PageTabs` (+ `tabFromUrl`): top-level tools on one page, kept in
  `?tab=`. Only the chosen tab renders.
- `NextStep`: the next stop on the path, at the foot of a page.
- `Chip`: a tappable choice (a game, a count, an example question);
  `active` makes a row of chips a segmented control.

## Table: `src/components/Table/`

- `Standings`: **the ranking pattern.** Players best first: rank (tied
  players share one), name, a line of detail, an optional `aside` (the
  piddle die) and a status chip from `STANDING_STATUS`: *Worst hand*,
  *Tied worst*, *In the cup*, *Pencil*, *Rolls again*, *Hammer*, *Boss*.
  Rows slide to their new place as the order changes. Play uses it for the
  piddle and for each round (fed by the engine's `standings()`); use it for
  any ranked list of players.

- `Seat`: one player at the table (name, role badges, decision, pencils,
  their dice, a status line). The tutorial and Play both use it.

## Primitives: `src/components/ui/`

These are shadcn/ui components (JS): Button (and `buttonVariants` for
links), Badge, Card (kept for shadcn; use `Panel`), Table, Dialog, Sheet, Tooltip, Tabs, ToggleGroup,
Switch, Slider, Select, Input, Label, Alert. Add new primitives with the
shadcn CLI.

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
| `DiceSettings` | The 3D and sound switches (both start off). |

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
  compare options with `OddsDecision`)
- formatting: `fmtPct`, `inWords`

**Every roll:** `EveryPossibility` (`src/components/OddsLab/`) is the one
way to show "every roll this counts": the unique rolls as a dice grid
(`RollGrid`) with matches lit, or a map of every ordered outcome
(`OutcomeMap`). The Odds Lab's builder and *Every game's odds* use it.

**What should I keep?** `KeepAdvisor` (Odds Lab) and `SituationCard`
(game pages) rank keep options exactly with `keepOptions()` in
`src/strategy/situations.ts`. Table questions live in
`OddsLab/situations-catalog.js`, one per game; add new ones there.

The rules are in `.claude/skills/explain-odds/SKILL.md`. Reference screens:
the tutorial's take-the-tie step, and the Strategy Assistant's
accept-or-refuse decision (`RefusalDecision`).

## Game references

- `GameLink`: a game's name linking to its page.
- Game names and labels come from `src/lib/games-config.js`
  (`getGameName`, `formatCallLabel`, `GAMES_MAP`). Never hardcode them.
- Site navigation lives in `src/components/nav-items.js`.

## Known one-offs to fold in

These predate the design system. Move each onto a kit piece the next time
you work on that page:

- **Percent formatting** is duplicated: `pct` in `strategy-assistant.js`
  and `OddsLab/RollGrid.jsx`, `formatPct` in `odds-lab.js`, `fmtPct` in
  `games-config.js`. Use `fmtPct` from the Odds kit.
- **Glossary links:**
  - `Term` is an empty wrapper.
  - The tutorial's local `T` link is the real pattern; make it the shared
    `Term`.
- **Duplicate strength meter:** `StrengthBar` and `CallList` in
  `RollAnalysis.jsx` are a separate strength meter. Decide whether it
  belongs in the Odds kit.
