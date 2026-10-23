# Changelog

Every release of refusaldice.com, newest first. Versions are
major.minor.patch ([docs/WORKFLOW.md](docs/WORKFLOW.md)): each pull request
bumps the version once and adds its entry here.

## 1.3.0 (unreleased)

- **A 404 page that plays along:** a cocked die and a stacked pair, an
  apology that names the address you asked for, and a way out: the page
  you most likely meant (a typo like `/rulez` or `/game/10-2`), a re-roll
  to a random page, or Home.
- **Unknown games get a 400:** `/games/yahtzee` says "Nobody plays that
  game" and points to the games list (or the game you nearly typed).
- **Error pages as table mishaps:** `TableFault` and its catalog (404 cocked,
  400 unknown game, 500 dice off the table) and `DiceMishap` for the
  pictures; approved by the owner 2026-10-22.
- **Glossary:** Cocked Die, Stacked Dice and Off the Table: each is
  re-rolled (ruled 2026-10-22, docs/RULES.md §1).

## 1.2.0 (unreleased)

- **Design system site** at `/design`: every foundation, component and
  pattern, live, with a sidebar organized like Ant Design and Material
  (Overview, Foundations, Components in nine groups, Patterns), a filter, a
  status for each piece (approved, proposed, deprecated) and a page per piece.
- **Theme playground** (`/design/theming/`): try colors, fonts, heading sizes
  and corner radius live, with presets, a live contrast check, a switch to
  preview the draft on the whole site, and Copy CSS.
- **Approval before use:** new patterns are registered as proposed and the
  tests block them outside the design system until they're approved.
- **Type roles:** every heading uses one of five roles (display, title,
  section, heading, subheading); eyebrows are one style; no arbitrary sizes.
- **Navigation in three groups** (Learn the game, Get better, Play) in the
  header, the mobile menu and a new footer site map; the path's Next links
  now pass through the Strategy Assistant.
- **Consistency fixes:** one primary button per view on the Games page;
  short rolls-left choices in the Odds Lab; percentages always through
  fmtPct (no more "29%" beside "49.1%"); "Ship, Captain, Crew" spelled one
  way; legible 12px card details; dice colors and every badge or alert
  color from tokens; the game page's variant filter sits by the sections it
  filters; sample rolls no longer print a kicker as text.
- **Approved** (2026-10-22): ChoiceGroup, TextLink and Term, StepPanel,
  Field and EmptyState, NativeSelect, Transport and SpeedPicker,
  CallPlacard, Setup, GameCard, the game page sections and RollBuilder.
- **Coral meets AA:** `pop` is darker in light mode (white on it 4.8:1, it
  on the page 4.7:1, up from 3.55:1); in dark mode text on it is ink (6.2:1).
- Removed unused components (`RollAnalysis`, the empty `Term`).

## 1.1.0 (2026-10-22)

Play, rebuilt to feel like a real table (committed straight to master,
before this workflow):

- The piddle plays out on the felt, roll by roll; the order of play fills in
  beside it and the Hammer token moves down it.
- Video-player controls: pause, step and every speed in view, from Very slow
  to Instant, with Realistic thinking time.
- The call in its own placard; a turn outline that glides from seat to seat.
- Players who missed the game roll on their own, together; safe players'
  dice go in the cup, with the hand they beat.
- The Boss can roll, say "Come up" or "Pick 'em up"; hard mode has you show
  your own game; hints show your chance of the pencil for every option.
- Fixed: a Boss who skipped the extra roll could stall the table.

## 1.0.0

The site before versioning: Learn, Rules, Games, the Odds Lab, the Strategy
Assistant and Play.
