# Refusal Dice — Product Roadmap

_Written 2026-10-14. This is a living document: update it as phases ship or decisions change._

## Goals

1. **New players learn the game as fast as possible.**
2. **Expert players hone their skills** by understanding the odds behind nuanced decisions (call, bark, accept, refuse, second call).
3. **Play against an AI.**
4. **Play against other people online** in a turn-based game that emails you when it's your turn if you're not signed in.

## Guiding principle: one engine, many surfaces

All four goals need the same foundation: **a pure, UI-free model of a full game of Refusal Dice.**

```
            ┌───────────────────────────────┐
            │  engine/ (pure JS/TS, no React) │
            │  rules · round state machine    │
            └───────────────┬───────────────┘
        ┌─────────┬─────────┼──────────┬──────────────┐
   Tutorial   Decision   Practice vs   Online server   Post-game
 (scripted    trainer    AI (bots use  (authoritative   review
   dice)    (set-up spots) strategy/)   referee)
```

- The tutorial drives the engine with scripted dice.
- The trainer drives it with hand-picked situations.
- Bots are policies that act inside it.
- The online server runs the same code as the referee.

Build it once and every later phase gets cheaper.

## State of the project at roadmap time

**Stack:** Gatsby 5 static site, React 18, Tailwind 3 + shadcn/ui (JS, not TSX), Jest. No backend.

**Pages** (as of 2026-10-15, in story order): Learn, Rules, Games (10 games + Barking, with `/games/<id>` detail pages), Odds Lab (*What should I keep?*, *Every game's odds*, *Build any roll*), Strategy Assistant (with *Predict the second call*), Play (full games vs bots), Glossary, and `/design` (the design system, unlisted). `/odds`, `/second-call-predictor` and `/practice` redirect.

**Core logic:** `src/lib/game-validation.js` (~2,600 lines) handles game matching (`checkGame`), kicker strength, Boss rank, Tres Away score, Razzle, Hammer call recommendations, refuser advice and second-call prediction. 148 Jest tests pass.

**Known gaps and problems:**

- **Strategy is heuristic, not computed.** Accept/refuse uses percentile cutoffs (e.g. ">70th percentile, accept") and tuning factors. It's fine for orienting a newcomer but not trustworthy for experts.
- **The Strategy Assistant is fixed at 3 players.**
- **No full-game model.** We can evaluate a single roll, but nothing models a round: piddle → Hammer → call/bark → 1st and 2nd refusal → second call → reveal → ties → pencils → elimination.
- **Broken or duplicate navigation.** The mobile nav links to `/strategies` (doesn't exist) and lists "Odds" twice.
- **Old content left in the page.** `games.js` contains a hidden (`display: none`) "OLD Tres away" section.
- **Full page reloads.** Some buttons use `window.location.href` instead of Gatsby `<Link>`/`navigate`.
- **Dead code.** `rolls-explorer`, `rolls-hybrid` and `rolls-original` are three parallel pages; `src/ideas/` holds about 12 abandoned prototypes; `src/pages/rolls.js.archive` is unused.
- **Starter leftovers.** The manifest is still named "gatsby-starter-default" and the README is Gatsby boilerplate.
- ✅ ~~**The game list is defined in several places:**~~ (fixed) `gatsby-node.js`, `second-call-predictor.js`, `generate-roll-game-matrix.js`, `game-validation.js` (`predictHammerSecondCalls`) and `games-config.js`.
- ✅ ~~**The Practice page's email signup only does `console.log`.**~~ Practice became Play (2026-10-15).
- **`npm audit` reports 128 vulnerabilities,** mostly transitive through Gatsby 5.
- ✅ ~~**Wrong odds feeding strategy.**~~ Fixed 2026-10-14: 10-3 was hardcoded at 53.43% (exact: 63.85%) in the odds table behind Hammer/refuser advice. Odds are now computed from the rules.
- ✅ ~~**Node version mismatch.**~~ `.nvmrc` now pins Node 24 (LTS).

---

## Phase 0 — Foundation & cleanup (≈1–2 weeks)

**Goal:** a clean base and a reusable engine.

1. **Cleanup** ✅ _done 2026-10-14. The roll-explorer variants were all deleted because Odds + Odds Lab supersede them; they're recoverable from git history (before commit `3ad9409`)._
   - Delete `src/ideas/`, `rolls.js.archive` and the roll-explorer variants we don't keep (pick one; fold anything good into `/odds`).
   - Remove the "OLD Tres away" section.
   - Fix the mobile nav (`/strategies`, duplicate Odds entry).
   - Replace `window.location.href` with `<Link>`/`navigate`.
   - Fix the manifest name and colors; replace the README with a project README.
2. **One game list.** ✅ _done 2026-10-14. `games-config.js` is now CommonJS so `gatsby-node.js` and the generators share it. `game-validation.js` still has an inline copy until step 3 moves the rules into `engine/`._
3. **Extract the engine** from `game-validation.js`: 🟡 _in progress. The engine (`src/engine/`) plays all ten games as of 2026-10-14: full round flow, cycles, ties, elimination, hidden-info views (Tres Away hands, the Boss's secret roll), seeded and scripted dice. Tests check it against `checkGame` on all 7,776 rolls and run 2,000 random full games across every game. `src/strategy/` (2026-10-14) adds exact make-the-game odds, solid bot policies for every decision, and a seeded Monte Carlo of your chance of the pencil that plays rounds through the engine. The Strategy Assistant's refusal advice and Hammer pencil odds use it. Next: move the remaining heuristics (`generateHammerStrategy`, odds-page classifiers) once the computed odds cover them. `game-validation.js` stays for the plain-Node generators, which can't import TypeScript._
   - `src/engine/rules`: playable-game checks, kicker/hand comparison, tie rules. Pure functions.
   - `src/engine/round`: an explicit state machine (states + actions + reducer) for a full game, implementing **[docs/RULES.md](docs/RULES.md)** exactly. That's the authoritative rules spec, and engine tests are written against it. Note the per-game play procedures: kicker games use 3 simultaneous rolls; Tres Away uses caller-paced put-out cycles; Boss uses a hidden Boss re-roll then "come up" / "don't come up".
   - `src/strategy/`: the current recommendation logic, moved as-is for now.
   - Engine code has **no React, no DOM, no Gatsby** so a server can import it later. Use TypeScript for the engine (see `CLAUDE.md`).
   - Seedable RNG passed in (never `Math.random()` inside the engine) so games are replayable and testable.
4. **Node version.** ✅ _`.nvmrc` → 24 (LTS), verified in CI._
5. **Deploys.** ✅ _`netlify.toml` added. Still to confirm in the Netlify dashboard: the site builds from `master` with deploy previews on PRs._
6. **CI.** ✅ _GitHub Actions: tests, build, and generated-data check on every push/PR._

**Done when:** the engine can play a full scripted game in a Jest test, every page still works, and nav has no dead links.

### House rules system (after the engine; before Phase 2's odds tables)

✅ _Started 2026-10-19: the first rule, Monterey's lone 3 or 4 keep (`montereyLoneKeep`), is a switch under House rules in Settings (`useHouseRules`). The engine, bots, exact keep odds, simulations and every generated table follow it; the tables are generated for both settings. Next: ante, parity money and barking as settings._

- **Owner requirement:** house rules are selectable site-wide (header or user preferences), and changing them recalculates every probability on the site. See `docs/RULES.md` section 5.
- **Engine and data:** the engine takes a `HouseRules` object; every rule and odds function is parameterized by it. Precomputed tables are generated for the default rules, and other rule sets are computed on demand (or a small set of common presets is precomputed).
- **Game detail pages** explain common variations and show the odds for each, e.g. a Monterey table that only requires keeping a 3 or 4.

## Phase 1 — Learn fast (new players)

**Goal:** someone who has never played can play a round with friends after ~5 minutes on the site.

0. ✅ _Done 2026-10-14: the Rules page now has "Play the game" (3 rolls, keepers, visible dice, the three games with their own procedures) and "Find the loser" steps; glossary and Games-page errors fixed._ **Teach re-rolling (highest priority).** The Rules page currently goes from the call straight to "everyone reveals their dice" and never explains the up-to-3 rolls with keepers, or the different procedures for Tres Away and Boss (see `docs/RULES.md` section 3). New players can't learn the game from it as written.
1. ✅ _Done 2026-10-14: `/learn` (homepage "Learn to Play" and the first nav item). One scripted 3-player round on the engine: call, refusals, keepers, a tie to break, the pencil. Its script is tested against the engine (`tutorial-script.test.ts`). Next: a second lesson as a refuser, and one for a missed game._ **Interactive first round.** A guided tutorial on the engine with scripted dice, explaining each step in context instead of asking people to read the rules first.
2. **"What can I call?" as the centerpiece.** Tap your five dice and see the playable games and hand strength. The logic exists in `games.js` and the Strategy Assistant; give it a fast, mobile-first screen and make it prominent on the homepage.
3. **Inline jargon.** Use the existing `Term` component everywhere: Hammer, kicker, pencil, bark, piddle, parity, refusal.
   - ✅ _Done 2026-10-14 (`src/components/Dice`: CSS 3D cube, Web Audio rattle, settings in the tutorial; in the header's Settings menu since 2026-10-16)._ **3D dice with sound (optional).** Rolling 3D dice and dice sounds for the tutorial and game table. Both start **off and muted**; players turn them on in preferences (remembered per browser). Respect `prefers-reduced-motion`, and keep the flat dice as the default and the fallback. Owner request, 2026-10-14.
4. **Micro-drills.** Quick quizzes with instant feedback: "Which games does this roll make?", "Who takes the pencil?", "Is this second call legal?"
5. ✅ _Done 2026-10-15: navigation follows the story (Learn, Rules, Games, Odds Lab, Strategy, Play, Glossary); Odds folded into the Odds Lab and the Second Call Predictor into the Strategy Assistant; one design system (`docs/DESIGN_SYSTEM.md`, `/design`, guarded by a test)._ **Simpler information architecture.**

**Measure:** time from landing to finishing the tutorial; tutorial completion rate.

## Phase 2 — Hone skills (experts)

**Goal:** the odds behind every decision are exact (or tightly simulated), explained, and practicable.

1. **A real odds engine.** There are only 252 distinct sorted rolls (7,776 ordered), so exact enumeration or tight Monte Carlo is cheap. Compute the **probability of taking the pencil** for each option by:
   - decision (call X / bark / accept / refuse / second call)
   - roll
   - called game and variant
   - seat (Hammer, 1st refusal, 2nd refusal, other)
   - player count (2–8)
   - opponent policy assumption

   Precompute the tables at build time, as `roll-game-matrix.json` is today (hash-based regeneration in `gatsby-node.js`).
2. **Odds Lab — shipped 2026-10-14** (`/odds-lab`, `src/lib/roll-query.js`).
   - **What it does:** users build any roll query from 1–5 dice and see exact odds live, as every outcome lights up or fades.
     - Requirement types: specific dice, runs, of-a-kinds, sums, per-die limits and counts.
     - Combining: requirements within a pattern use their own dice (AND); multiple patterns are alternatives (OR); "remaining dice" means the kickers.
   - **Checks the site:** queries can be compared with the site's own game definitions (`checkGame`), and differing rolls are outlined. The game presets are verified against `checkGame` on all 7,776 rolls in Jest.
   - **Follow-ups:**
     - Specialty-game scoring rules (Razzle wilds as a "count toward" rule, Boss rank, Tres Away score).
     - Conditional odds ("given I hold X, chance my re-roll makes Y"), which leads into the trainer.
     - "Beat a hand" queries, comparing against N opponents.
3. **Decision trainer.** Show a situation, take the player's decision, then reveal the odds of every option and the trade-off in plain words. Example: "Refusing costs you 4% now but dodges a 30% second-call risk."
4. **Player-count aware everywhere** (2–8), especially the Strategy Assistant.
5. **Personal stats** in `localStorage`: accuracy by decision type, and weak spots to drill.
6. ✅ _Done 2026-10-14._ **Fix the refuser model's assumption.** The old model (`evaluateRefuserPosition`, `REFUSER_STRATEGY.md`) assumed a refuser re-rolls. It's deleted; refusal advice is now simulated on the engine, where refusers keep their dice (`simulateRefusal` in `src/strategy/simulate.ts`).
7. Retire or re-base the heuristic thresholds in `strategy/` once the computed odds exist. Keep the heuristics only as the "novice/solid" bot policies.
8. **Finish the odds audit** (every figure shown is computed since 2026-10-21; these are what's left):
   - Advice that names a minimum hand to call disagrees with the computed when-to-call table (`OddsLab/specialty-calls.js`): Boss says "two pair or better" (two pair stays off the pencil 66%, under an even share of 67%; the table says three of a kind); Razzle says "three or more wilds" (two wilds already beat an even share). Derive the thresholds from `specialtyCalls(game).firstAbove`.
   - GameOdds' barking rule of thumb still uses the heuristic `analyzeRoll`.
   - Dead code: `RollAnalysis.jsx`'s default export (`generateHammerStrategy`) and the typed `gameOddsMap` in `lib/game-validation.js` it feeds; the old `analyzeSecondCallDistribution`.
   - `docs/RULES.md` has a worked example with typed figures (a doc, not on the site).

**Measure:** trainer sessions per returning user; accuracy improvement over time.

## Phase 3 — Play vs AI

1. ✅ _Shipped 2026-10-15 (`/play`, `src/components/Play`): 1–7 solid bots, every game, hints, Odds Lab links for your exact situation. Next: difficulty levels, saving games, post-game review._ **Full game table UI** on the engine, 2–7 bots. Show dice animations, whose turn it is, pencils and Hammer position clearly.
2. **Bot difficulty levels:**
   - **Novice:** simple rules of thumb, some randomness.
   - **Solid:** today's heuristics.
   - **Expert:** the Phase 2 odds engine.
   - **What "better" needs** (found 2026-10-16 while testing bark vs. call): bots that bark when it pays, refuse knowing the Hammer may be calling a decoy (a game they don't hold, to get their real game as an unrefusable second call). Read the call itself, as players do: most players save a real 10-4 for their second call, so a first-call 10-4 looks like a bluff and gets accepted to deny the second call; and a weak first call like 10-3 reads as a weak hand with no good second call, so it gets refused (owner, 2026-10-16). Bots should also and read the table (who's all day, pencils, player count). Today's bots choose calls and refusals from `strategy/call-odds.ts` (each call's chance of losing when everyone plays it, 3 players) and never bark.
   - **Then re-run the strategy findings** against the better bots: bark vs. call (today: never bark; a bark gives 41.5% at 3 players vs. 33.9% for the weakest hand's best call), decoy calls (12445: 10-4 Low, refused 45%, then 10-3 Low; if always accepted as a bluff it's 33.8%; 10-3 Low first, if always refused, means a 10-4 Low second call at ~32–34%: an even share whichever way the table reads it), and the owner's Tres Away rules of thumb (total under 6: ~10% to lose; one 3: 29.5%; a 1 and no 3: 38.2%). Owner request, 2026-10-16. Rewrite the bark copy (glossary, Rules, Barking page) once the results hold.

   Bots see only their own dice (the engine enforces information hiding through per-player views).
3. **Post-game review.** Annotate each human decision, highlight the costliest mistakes, and deep-link into the Phase 2 trainer for that situation.
4. Works signed-out; games saved in `localStorage`.

## Phase 4 — Online async multiplayer with email turn alerts

1. **Backend (recommended):** **Supabase**, which covers:
   - sign-in by emailed magic link
   - a Postgres database
   - real-time updates for players who are online
   - presence (who's online)
   - Edge Functions for server logic

   Plus **Resend** (or Postmark) for transactional email. Site hosting stays on Netlify.
2. **The server is authoritative:**
   - The server rolls the dice with a cryptographically secure RNG and runs the shared engine to validate every action.
   - Hidden hands **never** reach other clients; Supabase row-level security enforces it, with per-player game views.
   - Clients send intents ("accept", "call 10-2 high"), never state.
3. **Turn flow:**
   - Rolls happen simultaneously; decisions are sequential.
   - Email only when it's your turn **and** you're not online (presence check), with a short delay so quick back-and-forths don't spam.
   - Each email has a one-click, signed link straight back into the game.
   - Nudges, then a configurable turn timeout (auto-action or forfeit) so one player can't stall a game.
   - Invite links; per-user notification preferences; a one-click unsubscribe link (List-Unsubscribe header) in every email.
4. **Framework decision point** (decide at the start of this phase, not before). Gatsby is fine for content but awkward for an authenticated app. Options:
   - Keep Gatsby for content and add a client-only `/play/*` app section.
   - Migrate to Next.js or Vite + React.

   The engine being framework-free keeps either path cheap.

## Phase 5 — Ongoing polish

- Installable app (PWA) with offline support for Learn/Practice/Analyze.
- Accessibility pass (WCAG 2.1 AA): keyboard play, screen-reader dice announcements, color-independent indicators.
- Privacy-friendly analytics to track time-to-first-round and trainer engagement.
- Dependency hygiene: reduce the `npm audit` backlog; revisit Gatsby's long-term viability.

---

## Open questions

1. **House rules:** should the ante, extra money at parity, and barking be configurable settings, or are we encoding one canonical ruleset?
2. **Player counts:** support 2–8 everywhere? (The 2-player tie rule already differs.)
3. **Accounts:** confirm AI play works fully signed-out, with accounts required only for online play.
4. **Money:** do we track the pot/ante in online games, or only pencils?

## Decision log

| Date | Decision | Notes |
|---|---|---|
| 2026-10-14 | Build a pure, shared game engine before any new feature surfaces | Powers the tutorial, trainer, AI and online server |
| 2026-10-14 | Defer the framework choice (Gatsby vs Next/Vite) to the start of Phase 4 | Engine is framework-free either way |
| 2026-10-14 | Supabase + Resend as the default plan for online play | Revisit at Phase 4 |
| 2026-10-14 | Commit directly to `master` while there's a single developer | Switch to PRs when collaborators join |
| 2026-10-14 | `docs/RULES.md` is the authoritative rules spec | Engine tests are written against it; player-facing pages must agree with it |
| 2026-10-14 | House rules are a site-wide setting that recalculates all odds | Owner requirement |
| 2026-10-14 | 3D dice and sounds are opt-in, off and muted by default | Owner request |
| 2026-10-14 | Decision advice = simulated chance of the pencil, through the engine with bot players | Accounts for refusals, second calls and play; labeled with sample size and the bot assumption |
| 2026-10-15 | The site tells one story: Learn → Games → Odds Lab → Play; the home page shows a round as an animation | Owner direction: new players learn fast, experts answer their own questions |
| 2026-10-15 | Keep-or-roll advice is exact (`strategy/situations.ts`), not simulated | Every keep can be enumerated; simulation is kept for decisions involving other players |
| 2026-10-16 | Bots choose calls and refusals from a generated table of each call's chance of losing (`strategy/call-odds.ts`), not hand-tuned scores | The hand-tuned scores weren't comparable across games (33356 called Razzle over Boss) |
| 2026-10-16 | Re-run the bark, decoy-call and Tres Away findings once the bots play like strong players | Owner request; today's findings are against "solid" bots |
| 2026-10-19 | Only dice toward the game may be kept, and kept dice stay kept (`docs/RULES.md` §3.1) | Owner ruling: the 10s come in one roll; Ship Captain Crew keeps 1-2 or 5-6; Monterey a connector; 7's and Pairs one pair |
| 2026-10-20 | Kept dice are part of the game, a made game can't be re-rolled, and the Boss may pick up dice that still leave them the Boss (`docs/RULES.md` §3.1, §3.3) | Owner ruling: a kept 7's pair stays one of the pairs; 10-2's 5-5 can't be rolled again; only Razzle and Boss let you pick up a made hand |
| 2026-10-19 | House-rule odds are generated for each setting, not computed on demand | Simulated tables take minutes to hours; one rule doubles them, which is affordable |
| 2026-10-14 | Odds Lab ships ahead of Phase 0 | Self-contained (`roll-query.js` is pure and tested), so it doesn't block or depend on the engine split |
