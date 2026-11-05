# Changelog

Every release of refusaldice.com, newest first. Versions are
major.minor.patch ([docs/WORKFLOW.md](docs/WORKFLOW.md)): each pull request
bumps the version once and adds its entry here.

## 1.10.0 (unreleased)

- **Decision trainer (proposed, on the design system for now):** a real
  moment from a game against solid bots, "What do you do?", then every
  option's chance of the pencil, with your pick marked and a verdict: the
  best move, a toss-up, or how many points it cost. Practise everything, or
  just calling, refusing or rolling; a running tally counts your best picks
  and the pencils given away. It gets its own page once approved.
- **Fix: no standing on a missed game.** A player who hasn't made the game
  rolls until they make it or run out of rolls. The engine let you stand on
  a miss once every other miss was out of rolls, so Play, its hints and the
  trainer offered "Stand" with rolls left (e.g. 10-4 with 2 rolls left).
- **"Roll the kicker":** once your dice make the game, the only roll left is
  the kicker, so hints and the trainer now say "Roll the kicker" instead of
  "Keep 2-3-5".
- **Boss: roll, then decide.** The Boss always takes the secret roll first
  (keeping all five rolls nothing) and decides whether everyone comes up
  after seeing it. Play no longer offers "Come up" or "Pick 'em up" before
  the roll, and its hint weighs the keeps: your hand alone, your hand and its
  highest die, or all five. Solid bots keep only their hand and roll the rest
  (three 4s and a 6: roll two dice, since two dice improve trips 16 times in
  36 and one die only 12).
- **Boss: net pencils.** Picking 'em up never costs a pencil, but coming up
  hands one to someone else, so the Boss's choices (the secret roll, then
  come up or pick 'em up) are scored in net pencils: the pencils that go to
  someone else, minus yours, per 100 rounds. The trainer deals them that
  way, Play's hint shows it, and solid bots come up when their exact chance
  of taking the pencil is under 50% (it was "two pair or better").

## 1.9.0 (unreleased)

- **Your game is saved:** a game at [Play](/play) is kept in this browser
  after every move, so a refresh, a closed tab or leaving the table doesn't
  lose it. Set the table offers to pick it up where you left off (round,
  players still in, the pot and your pencils); a new game replaces it, and a
  finished one is cleared.
- **Screen readers:** the Hammer in the order of play is announced again.

## 1.8.0 (2026-11-04)

- **The pot:** in [Play](/play), everyone puts $5 in the pot to start, the
  pot shows beside the round number, and the last player standing takes it.
  At the end you see how much you're up or down.
- **Parity, your way:** when you set the table, pick what happens when
  everyone left has 2 pencils: **a loss is out** (pencils go back, and the
  next pencil puts a player out; most tables play this way) or **buy in
  again** (pencils go back, everyone puts another $5 in, and the game
  starts over).
- **Fix:** the game log's last line now names the winner (it read
  " wins the pot!").

## 1.7.0 (2026-11-04)

- **Parity:** when everyone still in has 2 pencils, everyone puts their
  pencils back, and from then on a loss is out. Play follows it, and the
  pencils by each seat show one to lose after parity. The [Rules](/rules)
  and [Glossary](/glossary) say so too.
- **Barking in the Odds Lab:** the barking card now counts the rolls that
  really do better barking than calling, from rounds played out (as on the
  [Barking](/games/barking) page). It used a rule of thumb with two sliders.
- **High or Low:** the [Games](/games) page and each game's page now score
  your roll's call in the variant less likely to take the pencil. A rough
  strength score used to pick it.
- **Tres Away:** the hands worth calling are now the ones the odds say:
  a 3 or more, and four 3s for a strong call. The Odds Lab, the Games page
  and the Tres Away page used fixed score cut-offs (10 or less) that didn't
  match the advice.
- **Easier to read:** on the Games page with a roll entered, the games your
  roll doesn't play were faded so much the text was hard to read; now only
  their dice go grey. The same for the rolls that don't match in the Odds
  Lab's every-roll grid. Links in text are underlined everywhere, not only
  in paragraphs.
- **Rules:** a Tres Away replay starts with the tied player nearest the
  caller's left (the caller, when tied), and everyone puts out one die at a
  time
  time. Barking is always allowed, so it's no longer listed as a house rule.
- **Behind the scenes:** old guesswork code and notes removed; the dice
  data files are a third of the size.

## 1.6.0 (2026-11-04)

- **What’s new:** a page listing every release of the site, newest first,
  read from this changelog at build time (`/changelog`, in the footer).
- **Report a problem:** a short form (`/report`, in the footer) for a bug, a
  rule or number that looks wrong, or an idea. It opens a GitHub issue with
  everything filled in, including the page, version, browser and house
  rules; you check it and submit it there.
- **Design system:** Textarea, ReleaseNotes and ReportForm, approved
  2026-11-04. Field can now tie its label to its control (`htmlFor`).

## 1.5.1 (unreleased)

- **Nothing changes on the site:** release dates in this changelog and the
  project's notes.

## 1.5.0 (2026-11-01)

- **Boss replays end like Boss games** (ruled 2026-10-29): when tied worst
  hands replay Boss and two of them tie for the best hand, there's no Boss:
  nobody takes a pencil and the Hammer passes left. Before, the replay
  started over.
- **Taking a tie is an offer** (ruled 2026-10-29): tied for the worst hand,
  you can take the tie on your turn even while the others tied with you can
  still roll. It's a replay only if they all take it too. If one rolls
  instead and climbs off the bottom, you roll on with the rolls you have
  left; if they end up the worst hand, they lose. Play, Rules and the
  Glossary say so, and the bots play it.
- **Tres Away replays go one die at a time** (ruled 2026-10-30): when tied
  highest scores replay, nobody sets the pace; everyone puts out one die
  per turn. The main game keeps the caller's pace.

## 1.4.2 (2026-11-01)

- **Nothing changes on the site:** release dates in this changelog, the
  rule for merging stacked pull requests, and the project's notes.

## 1.4.1 (2026-10-23)

- **Your seat no longer covers the table:** in Play your seat sits right
  under the call and the latest move, with the others below it. It used to
  dock to the bottom of the screen on your turn, which on a phone, a tablet
  or a short window hid the seats behind it.

## 1.4.0 (2026-10-23)

- **Hard mode checks your pick as you make it** (ruled 2026-10-22): pick dice
  that aren't the game (or too many, like 5-3-2 for 10-2) and it says "Not a
  valid game", with Roll all five; fix the pick and Show turns on, then roll
  the kicker. Saying you missed means rolling all five, as before.

## 1.3.0 (2026-10-23)

- **A 404 page that plays along:** a cocked die and a stacked pair, an
  apology that names the address you asked for, and a way out: the page
  you most likely meant (a typo like `/rulez` or `/game/10-2`, or a page
  name without its section, like `/1o-2`), a re-roll
  to a random page, or Home.
- **Unknown games get a 400:** `/games/yahtzee` says "Nobody plays that
  game" and points to the games list (or the game you nearly typed).
- **Error pages as table mishaps:** `TableFault` and its catalog (404 cocked,
  400 unknown game, 500 dice off the table) and `DiceMishap` for the
  pictures; approved by the owner 2026-10-22.
- **Glossary:** Cocked Die, Stacked Dice and Off the Table: each is
  re-rolled (ruled 2026-10-22, docs/RULES.md §1).

## 1.2.0 (2026-10-23)

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
