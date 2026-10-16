# Design system

Every repeated piece of UI on Refusal Dice comes from one shared component,
so changing that component changes it everywhere. Before building UI, look
here for an existing piece. If you need something new that will appear
twice or more, add it to the right kit and list it here.

## Foundations

- **Color tokens** (`src/styles/global.css`, `tailwind.config.js`). Each
  has light and dark values. Never use raw hex values or Tailwind palette
  colors (`green-500`) in new code.
  - Semantic: `background`, `foreground`, `card`, `muted`, `primary`,
    `secondary`, `accent`, `destructive`, `border`, `input`, `ring`.
  - Odds: `odds-lose`, `odds-coin`, `odds-safe`, which take an alpha, e.g.
    `bg-odds-lose/15`.
  - Rarity: `legendary`, `epic`, `rare`, `uncommon`, `common`.
- **Radius:** `rounded-lg`, `rounded-md`, `rounded-sm` (tokens). Dice use
  `rounded-[22%]`.
- **Dark mode:** class-based. Check both themes for every change.
- **Mobile first:** every screen works at 390px wide with no horizontal
  scroll.

## Primitives: `src/components/ui/`

These are shadcn/ui components (JS): Button (and `buttonVariants` for
links), Badge, Card, Table, Dialog, Sheet, Tooltip, Tabs, ToggleGroup,
Switch, Slider, Select, Input, Label, Alert. Add new primitives with the
shadcn CLI.

## Dice kit: `src/components/Dice/`

The only way dice are drawn. Never render a roll as text like
`[1, 3, 6, 5, 5]` or `13655`.

| Component | Use it for |
|---|---|
| `Die` | One die. Sizes `xs` 16, `sm` 28, `md` 40, `lg` 52 (`DIE_SIZES`). Flat SVG, or a 3D cube when the player turns 3D on (`md` and up). Bump `rollId` to animate a roll. |
| `DieFace` | The flat SVG face on its own (used by `Die`). |
| `Hand` | A roll **for a game**. The dice that make it get a blue outline and the game's name; the kicker gets a dashed outline and its total. Misses show "No 10-3". Specialty games outline the dice that make the hand: Boss the poker hand (just the high die for a high die), Razzle the chosen number plus wild 1s, Tres Away the dice put out (`putOut`), or for a fresh roll the best first put-out (`tresAwayPutOut`, exact). `xs`/`sm` are compact (outlines, no labels) for tables. |
| `DiceGroup` | A hand-picked group with an outline and a label, when the grouping is authored rather than computed (e.g. the examples on the Games page). `tone`: `game`, `kicker` or `plain`. |
| `RollInput` | Anywhere a player **enters or edits** a roll. |
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
- formatting: `fmtPct`, `inWords`

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
- **Raw palette colors** (`green-…`, `red-…`) appear in `odds.js`,
  `index.js`, `rules.js` and a few components. Use semantic or odds tokens
  instead.
- **Glossary links:**
  - `Term` is an empty wrapper.
  - The tutorial's local `T` link is the real pattern; make it the shared
    `Term`.
- **Nested buttons:** `odds.js` `StrategyCallout` puts a `<button>` inside
  a `<button>`, which is invalid HTML (React warns about it).
- **Duplicate strength meter:** `StrengthBar` and `CallList` in
  `RollAnalysis.jsx` are a separate strength meter. Decide whether it
  belongs in the Odds kit.
